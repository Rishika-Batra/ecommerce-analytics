import os
import sys
import duckdb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add parent directory to path to enable ML imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.predict import EcommercePredictor

app = FastAPI(
    title="Ecommerce Analytics API",
    description="FastAPI service exposing DuckDB analytics and XGBoost churn/CLV models.",
    version="1.0.0"
)

# Enable CORS for Next.js dashboard integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "ecommerce_analytics/data/ecommerce.db"

# Initialize predictor lazily
predictor = None
def get_predictor():
    global predictor
    if predictor is None:
        try:
            predictor = EcommercePredictor()
        except Exception as e:
            print(f"Warning: Could not initialize Predictor. Ensure models are trained first. Error: {e}")
    return predictor

# Pydantic schemas for interactive simulation endpoints
class ChurnSimRequest(BaseModel):
    age: int
    gender: str
    country: str
    acquisition_channel: str
    total_orders: int
    total_spend: float
    average_order_value: float
    total_sessions: int
    total_page_views: int
    total_cart_additions: int

class ClvSimRequest(BaseModel):
    age: int
    gender: str
    country: str
    acquisition_channel: str
    total_sessions: int
    total_page_views: int
    total_cart_additions: int

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Ecommerce Analytics Platform API is running"}

@app.get("/api/metrics/summary")
def get_summary_metrics():
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=400, detail="Database files do not exist. Please run dbt first.")
        
    try:
        conn = duckdb.connect(DB_PATH, read_only=True)
        
        # 1. Total revenue, customers, average order value
        cust_stats = conn.execute("""
            select 
                count(distinct customer_id) as total_customers,
                sum(total_spend) as total_revenue,
                avg(total_spend) as avg_spend_per_customer
            from dim_customers
        """).fetchone()
        
        # 2. Total order counts
        order_stats = conn.execute("""
            select count(distinct order_id) as total_orders
            from stg_orders
            where status = 'completed'
        """).fetchone()
        
        # 3. Funnel counts
        funnel_stats = conn.execute("""
            select total_views, total_cart_additions, total_purchases
            from fct_funnel_analysis
        """).fetchone()
        
        conn.close()
        
        total_customers = int(cust_stats[0]) if cust_stats[0] is not None else 0
        total_revenue = float(cust_stats[1]) if cust_stats[1] is not None else 0.0
        avg_spend = float(cust_stats[2]) if cust_stats[2] is not None else 0.0
        total_orders = int(order_stats[0]) if order_stats[0] is not None else 0
        
        views = int(funnel_stats[0]) if funnel_stats and funnel_stats[0] is not None else 0
        purchases = int(funnel_stats[2]) if funnel_stats and funnel_stats[2] is not None else 0
        conversion_rate = round((purchases / views) * 100, 2) if views > 0 else 0.0
        
        return {
            "total_customers": total_customers,
            "total_revenue": round(total_revenue, 2),
            "average_revenue_per_customer": round(avg_spend, 2),
            "total_orders": total_orders,
            "conversion_rate": conversion_rate
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")

@app.get("/api/metrics/sales-trend")
def get_sales_trend():
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=400, detail="Database files do not exist.")
        
    try:
        conn = duckdb.connect(DB_PATH, read_only=True)
        df = conn.execute("""
            select 
                cast(sales_date as varchar) as sales_date, 
                total_orders, 
                daily_revenue 
            from fct_daily_sales
            order by sales_date
        """).fetchdf()
        conn.close()
        
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metrics/categories")
def get_category_metrics():
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=400, detail="Database files do not exist.")
        
    try:
        conn = duckdb.connect(DB_PATH, read_only=True)
        df = conn.execute("""
            select 
                product_category as category, 
                sum(quantity) as items_sold, 
                round(sum(item_revenue), 2) as revenue 
            from fct_orders 
            where status = 'completed'
            group by 1 
            order by revenue desc
        """).fetchdf()
        conn.close()
        
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metrics/funnel")
def get_funnel():
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=400, detail="Database files do not exist.")
        
    try:
        conn = duckdb.connect(DB_PATH, read_only=True)
        stats = conn.execute("""
            select total_views, total_cart_additions, total_purchases
            from fct_funnel_analysis
        """).fetchone()
        conn.close()
        
        if not stats:
            return []
            
        views = int(stats[0])
        cart = int(stats[1])
        purchases = int(stats[2])
        
        return [
            {"stage": "1. Product Views", "count": views, "pct": 100.0},
            {"stage": "2. Add to Cart", "count": cart, "pct": round((cart / views) * 100, 1) if views > 0 else 0.0},
            {"stage": "3. Purchases", "count": purchases, "pct": round((purchases / views) * 100, 1) if views > 0 else 0.0}
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/customers")
def get_customers():
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=400, detail="Database files do not exist.")
        
    try:
        conn = duckdb.connect(DB_PATH, read_only=True)
        df = conn.execute("""
            select 
                customer_id,
                join_date,
                age,
                gender,
                country,
                acquisition_channel,
                total_orders,
                total_spend,
                average_order_value,
                recency_days,
                total_sessions,
                total_page_views,
                total_cart_additions,
                is_churned as actual_churn
            from dim_customers
            order by total_spend desc
            limit 150
        """).fetchdf()
        conn.close()
        
        pred_service = get_predictor()
        records = df.to_dict(orient="records")
        
        # Enrich records with ML models if models are initialized
        if pred_service:
            for rec in records:
                # Prepare features dict
                features = {
                    "age": rec["age"],
                    "gender": rec["gender"],
                    "country": rec["country"],
                    "acquisition_channel": rec["acquisition_channel"],
                    "total_orders": rec["total_orders"],
                    "total_spend": rec["total_spend"],
                    "average_order_value": rec["average_order_value"],
                    "total_sessions": rec["total_sessions"],
                    "total_page_views": rec["total_page_views"],
                    "total_cart_additions": rec["total_cart_additions"]
                }
                rec["predicted_churn_prob"] = round(pred_service.predict_churn(features), 3)
                rec["predicted_clv"] = round(pred_service.predict_clv(features), 2)
        else:
            for rec in records:
                rec["predicted_churn_prob"] = 0.0
                rec["predicted_clv"] = 0.0
                
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict/churn")
def predict_churn(req: ChurnSimRequest):
    pred_service = get_predictor()
    if not pred_service:
        raise HTTPException(status_code=503, detail="XGBoost prediction models not loaded. Check server logs.")
    
    try:
        input_data = req.dict()
        prob = pred_service.predict_churn(input_data)
        return {
            "churn_probability": round(prob, 4),
            "risk_segment": "High" if prob > 0.6 else "Medium" if prob > 0.3 else "Low"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict/clv")
def predict_clv(req: ClvSimRequest):
    pred_service = get_predictor()
    if not pred_service:
        raise HTTPException(status_code=503, detail="XGBoost prediction models not loaded. Check server logs.")
    
    try:
        input_data = req.dict()
        pred = pred_service.predict_clv(input_data)
        return {
            "predicted_clv": round(pred, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
