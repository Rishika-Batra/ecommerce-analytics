# College-Level Ecommerce Analytics Platform

This repository contains a complete, end-to-end Ecommerce Analytics Platform designed around the **Data Analytics Lifecycle (DALC)**. It demonstrates how to integrate raw transactional and web analytics data, transform it using **dbt** (configured with a local **DuckDB** instance), build machine learning models using **XGBoost** to predict customer behavior, and serve interactive analytics and predictions via a **FastAPI** server to a modern **Next.js** dashboard.

---

## 📂 Project Repository Structure

- `data/`: Holds the raw and intermediate CSV data files.
- `dbt/`: Contains the dbt project config, source schema mappings, and staged/mart transformation SQL models.
- `ml/`: Python code for synthetic data generation, XGBoost churn modeling, and CLV regression training.
- `api/`: FastAPI backend routes serving metrics, time series trends, and live prediction inference.
- `dashboard/`: Next.js web application styled with Tailwind CSS for visualizing KPIs and simulating predictions.
- `docs/`: In-depth analytical documentation outlining DALC guidelines.
- `tests/`: Automated unit and integration tests.

---

## 🔄 The Data Analytics Lifecycle (DALC) Mapping

This project is structured specifically to showcase the 6 phases of the Data Analytics Lifecycle:

1. **Discovery**: Defining the business objectives (minimizing customer churn, optimizing product categories, understanding conversion funnels).
2. **Data Preparation**: Written inside `ml/data_generator.py` to create realistic user sessions, orders, items, products, and customer demographics, exported to raw CSV files.
3. **Model Planning**: Configured inside `dbt/` using staging and analytical marts (`dim_customers`, `fct_orders`) to compute Recency, Frequency, Monetary (RFM) metrics, funnel conversion rates, and session durations.
4. **Model Building**: Implemented in `ml/train.py` utilizing **XGBoost** to train a binary classifier (Churn probability) and a regressor (Customer Lifetime Value).
5. **Communicate Results**: Visualized beautifully in the `dashboard/` with responsive analytics charts and metrics summaries.
6. **Operationalize**: Made available via the production-ready REST API in `api/main.py` allowing real-time inferences and automated report generation.

---

## 🚀 Quick Start Instructions

1. **Python Setup & Dependency Installation**
   Ensure Python 3.9+ is installed, then run:
   ```bash
   pip install -r requirements.txt
   ```

2. **Step 1: Generate Synthetic Raw Data**
   Generate realistic CSV data sources inside `data/`:
   ```bash
   python ml/data_generator.py
   ```

3. **Step 2: Transform Data with dbt**
   Run the dbt pipeline to create the relational tables in the local DuckDB file:
   ```bash
   cd dbt
   dbt run --profiles-dir .
   ```

4. **Step 3: Train XGBoost Models**
   Run the training pipeline to build and serialize the churn and CLV prediction models:
   ```bash
   cd ..
   python ml/train.py
   ```

5. **Step 4: Launch FastAPI Backend Server**
   Start the API server to query results and run live inference models:
   ```bash
   uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
   ```

6. **Step 5: Launch Next.js Dashboard**
   Navigate to the dashboard directory, install dependencies, and run:
   ```bash
   cd dashboard
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the platform!
