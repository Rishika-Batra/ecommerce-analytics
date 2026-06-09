# Ecommerce Analytics Engine

A full-stack data analytics platform that ingests raw ecommerce data, models it with **dbt + DuckDB**, trains **XGBoost** ML models for churn and CLV prediction, serves predictions via a **FastAPI** REST layer, and visualises everything in a **Next.js** dashboard.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Component Guide](#component-guide)
  - [Data Generation](#1-data-generation)
  - [dbt + DuckDB Modelling](#2-dbt--duckdb-modelling)
  - [ML Training](#3-ml-training)
  - [FastAPI Server](#4-fastapi-server)
  - [Next.js Dashboard](#5-nextjs-dashboard)
- [API Reference](#api-reference)
- [dbt Model Lineage](#dbt-model-lineage)
- [ML Model Details](#ml-model-details)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Data Analytics Lifecycle](#data-analytics-lifecycle)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Raw Data Layer                           │
│   data_generator.py  →  CSV files (customers, orders,          │
│                          clickstream, catalog, sessions)        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    dbt + DuckDB Layer                           │
│   staging/  →  intermediate/  →  marts/  →  ml/                │
│   (views)       (ephemeral)     (tables)    (feature tables)    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
┌──────────────────────┐    ┌─────────────────────────────────────┐
│    ML Training       │    │           FastAPI Server            │
│  ltv_model.py        │    │  /api/metrics/*   →  analytics      │
│  churn_model.py      │    │  /api/customers   →  scored list    │
│  → JSON model files  │    │  /api/predict/*   →  real-time ML   │
└──────────────────────┘    └─────────────────┬───────────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────────┐
                              │      Next.js Dashboard        │
                              │  Overview · Customers ·       │
                              │  ML Sandbox · Architecture    │
                              └───────────────────────────────┘
```

---

## Project Structure

```
ecommerce_analytics/
│
├── api/
│   └── main.py                  # FastAPI app — metrics, customers, predictions
│
├── dashboard/                   # Next.js 16 frontend
│   ├── src/app/
│   │   ├── page.js              # Main dashboard (Overview, Customers, ML Sandbox, Docs)
│   │   ├── layout.js            # Root layout + metadata
│   │   └── globals.css          # Global styles & CSS variables
│   ├── package.json
│   └── next.config.mjs
│
├── dbt/
│   ├── models/
│   │   ├── staging/             # stg_customers, stg_orders, stg_sessions, stg_events
│   │   ├── intermediate/        # int_customer_sessions, int_rfm_features
│   │   ├── marts/               # dim_customers, fct_orders, mart_cohort_retention
│   │   └── ml/                  # ml_churn_features, ml_clv_features
│   ├── tests/                   # custom generic tests (schema.yml)
│   ├── profiles.yml             # DuckDB connection config
│   └── dbt_project.yml
│
├── ml/
│   ├── data_generator.py        # Synthetic dataset generation
│   ├── train.py                 # XGBoost model training script
│   ├── churn_model.json         # Serialised XGBClassifier
│   └── clv_model.json           # Serialised XGBRegressor
│
├── data/                        # Generated CSV files (git-ignored)
│   ├── customers.csv
│   ├── orders.csv
│   ├── order_items.csv
│   ├── sessions.csv
│   └── clickstream.csv
│
└── README.md
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | ≥ 3.11 | ML training, FastAPI server, data generation |
| Node.js | ≥ 20 | Next.js dashboard |
| dbt-duckdb | ≥ 1.8 | Data transformation layer |
| DuckDB | ≥ 0.10 | Embedded analytical database |

Install Python dependencies:

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install fastapi uvicorn duckdb xgboost scikit-learn pandas numpy
pip install dbt-duckdb
```

---

## Quick Start

### 1 — Generate data

```bash
cd ml
python data_generator.py
# Writes five CSV files to ../data/
```

### 2 — Run dbt models

```bash
cd dbt
dbt deps
dbt run
dbt test
```

### 3 — Train ML models

```bash
cd ml
python train.py
# Outputs churn_model.json and clv_model.json
```

### 4 — Start the API server

```bash
cd api
uvicorn main:app --reload --port 8000
# API live at http://localhost:8000
```

### 5 — Start the dashboard

```bash
cd dashboard
npm install
npm run dev
# Dashboard live at http://localhost:3000
```

---

## Component Guide

### 1. Data Generation

`ml/data_generator.py` creates synthetic but statistically coherent ecommerce data:

- **customers.csv** — demographics (age, gender, country, acquisition channel, join date)
- **orders.csv** — order headers with status, timestamps, revenue
- **order_items.csv** — line items with product category, quantity, unit price
- **sessions.csv** — web session records with duration
- **clickstream.csv** — individual events: `page_view`, `cart_add`, `purchase`

Adjust `N_CUSTOMERS` and `N_MONTHS` at the top of the file to scale the dataset.

---

### 2. dbt + DuckDB Modelling

The dbt project uses four layers, each with a specific materialisation:

| Layer | Materialisation | Purpose |
|-------|----------------|---------|
| `staging/` | View | Parse and rename raw CSV columns |
| `intermediate/` | Ephemeral | Join and enrich — no DuckDB cost |
| `marts/` | Table (partitioned) | Business-ready dimensional models |
| `ml/` | Table | Feature tables consumed by training |

Key mart models:

- **`dim_customers`** — enriched customer profile with RFM metrics, session aggregates, and predicted scores written back after training
- **`fct_orders`** — order-grain fact table with category, revenue, and status
- **`mart_cohort_retention`** — cohort × period retention matrix

Run a specific model:

```bash
dbt run --select mart_cohort_retention
dbt run --select tag:ml           # all ML feature models
```

---

### 3. ML Training

`ml/train.py` trains two XGBoost models:

**Churn Classifier (`XGBClassifier`)**
- Target: binary `churned` flag (no purchase in last 90 days)
- Features: age, gender, country, channel, total orders, total spend, AOV, sessions, page views, cart additions
- Output: `churn_probability` ∈ [0, 1] and `risk_segment` (Low / Medium / High)

**CLV Regressor (`XGBRegressor`)**
- Target: total spend over the next 365 days
- Features: demographics + engagement intensity (sessions, views, cart adds)
- Output: `predicted_clv` in USD

Both models are serialised to JSON and loaded at API startup — no pickle files, no external model registry required.

---

### 4. FastAPI Server

`api/main.py` connects to DuckDB at startup and loads both XGBoost models. All endpoints return JSON.

See full [API Reference](#api-reference) below.

---

### 5. Next.js Dashboard

Built with **Next.js 16**, **React 19**, **Tailwind CSS v4**, and **Lucide React** icons.

Four tabs:

| Tab | What it shows |
|-----|--------------|
| **Overview** | KPI cards, daily revenue chart, conversion funnel, category breakdown |
| **Customers** | Searchable, filterable, sortable table with churn risk badges and CLV |
| **ML Sandbox** | Interactive feature editor — tweak inputs and get live XGBoost predictions |
| **Architecture** | DALC walkthrough mapping each phase to the codebase |

---

## API Reference

All endpoints are prefixed with `http://localhost:8000`.

### GET `/api/metrics/summary`

Returns aggregate KPIs.

```json
{
  "total_customers": 1000,
  "total_revenue": 482310.50,
  "average_revenue_per_customer": 482.31,
  "total_orders": 3847,
  "conversion_rate": 16.0
}
```

---

### GET `/api/metrics/sales-trend`

Returns daily revenue grouped by date.

```json
[
  { "sales_date": "2024-01-01", "daily_revenue": 1420.50 },
  ...
]
```

---

### GET `/api/metrics/categories`

Returns revenue and quantity by product category.

```json
[
  { "category": "Electronics", "revenue": 120430.0, "items_sold": 834 },
  ...
]
```

---

### GET `/api/metrics/funnel`

Returns conversion funnel stage counts and percentages.

```json
[
  { "stage": "Sessions", "count": 15200, "pct": 100 },
  { "stage": "Page Views", "count": 9800, "pct": 64 },
  { "stage": "Cart Adds", "count": 4000, "pct": 26 },
  { "stage": "Purchases", "count": 2432, "pct": 16 }
]
```

---

### GET `/api/customers`

Returns all customers with pre-scored churn probability and CLV.

```json
[
  {
    "customer_id": "CUST_0001",
    "age": 34,
    "gender": "Female",
    "country": "USA",
    "acquisition_channel": "Email",
    "total_orders": 5,
    "total_spend": 620.0,
    "average_order_value": 124.0,
    "total_sessions": 12,
    "total_page_views": 38,
    "total_cart_additions": 9,
    "recency_days": 14,
    "join_date": "2023-06-12",
    "predicted_churn_prob": 0.18,
    "predicted_clv": 890.40
  }
]
```

---

### POST `/api/predict/churn`

Real-time churn inference. All fields required.

**Request body:**
```json
{
  "age": 30,
  "gender": "Female",
  "country": "USA",
  "acquisition_channel": "Email",
  "total_orders": 2,
  "total_spend": 150.0,
  "average_order_value": 75.0,
  "total_sessions": 5,
  "total_page_views": 12,
  "total_cart_additions": 3
}
```

**Response:**
```json
{
  "churn_probability": 0.42,
  "risk_segment": "Medium"
}
```

---

### POST `/api/predict/clv`

Real-time CLV inference.

**Request body:**
```json
{
  "age": 30,
  "gender": "Female",
  "country": "USA",
  "acquisition_channel": "Email",
  "total_sessions": 5,
  "total_page_views": 12,
  "total_cart_additions": 3
}
```

**Response:**
```json
{
  "predicted_clv": 614.27
}
```

---

## dbt Model Lineage

```
stg_customers ──┐
stg_orders    ──┤──► int_rfm_features ──► dim_customers
stg_sessions  ──┤──► int_customer_sessions
stg_events    ──┘

stg_orders    ──► fct_orders ──► mart_cohort_retention

dim_customers ──► ml_churn_features ──► (XGBClassifier training)
dim_customers ──► ml_clv_features   ──► (XGBRegressor training)
```

---

## ML Model Details

| | Churn Model | CLV Model |
|---|---|---|
| Type | XGBClassifier | XGBRegressor |
| Target | Binary (churned / retained) | Continuous USD spend |
| Metric | ROC-AUC | RMSE |
| Key features | recency_days, total_orders, total_sessions | total_sessions, total_page_views, total_cart_additions |
| Serialisation | JSON | JSON |

Risk segment thresholds:

| Segment | Probability range |
|---------|-----------------|
| Low | < 30% |
| Medium | 30% – 60% |
| High | > 60% |

---

## Environment Variables

No `.env` file is required for local development. The following defaults are hardcoded and can be overridden:

| Variable | Default | Used in |
|----------|---------|--------|
| `API_BASE` | `http://localhost:8000` | `dashboard/src/app/page.js` |
| `DUCKDB_PATH` | `../data/warehouse.duckdb` | `api/main.py` |
| `MODEL_DIR` | `../ml/` | `api/main.py` |

For production, expose these as environment variables and read them with `os.getenv()` in Python and `process.env` in Next.js.

---

## Running Tests

**dbt data quality tests:**

```bash
cd dbt
dbt test
# Runs: unique, not_null, expression_is_true, unique_combination_of_columns
```

**API smoke test:**

```bash
curl http://localhost:8000/api/metrics/summary
curl -X POST http://localhost:8000/api/predict/churn \
  -H "Content-Type: application/json" \
  -d '{"age":30,"gender":"Female","country":"USA","acquisition_channel":"Email","total_orders":2,"total_spend":150,"average_order_value":75,"total_sessions":5,"total_page_views":12,"total_cart_additions":3}'
```

---

## Data Analytics Lifecycle

This project is a working implementation of the six-phase DALC framework:

| Phase | Implementation |
|-------|---------------|
| **1. Discovery** | Problem framing — retention vs acquisition cost, churn and CLV hypotheses |
| **2. Data Preparation** | `ml/data_generator.py` — synthetic but statistically coherent CSV datasets |
| **3. Model Planning** | dbt staging + intermediate + mart layers, RFM feature engineering |
| **4. Model Building** | `ml/train.py` — XGBoost classifier and regressor, JSON serialisation |
| **5. Communicate Results** | Next.js dashboard — KPIs, charts, customer table, ML sandbox |
| **6. Operationalize** | FastAPI REST API — live analytics queries + real-time ML scoring |

---

*Built with FastAPI · DuckDB · dbt · XGBoost · Next.js · Tailwind CSS*
