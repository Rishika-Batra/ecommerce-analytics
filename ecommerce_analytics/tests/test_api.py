import os
import sys
from fastapi.testclient import TestClient
import pytest

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from api.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_summary_metrics_endpoint():
    response = client.get("/api/metrics/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_customers" in data
    assert "total_revenue" in data
    assert "total_orders" in data
    assert "conversion_rate" in data
    assert data["total_customers"] > 0

def test_sales_trend_endpoint():
    response = client.get("/api/metrics/sales-trend")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "sales_date" in data[0]
        assert "total_orders" in data[0]
        assert "daily_revenue" in data[0]

def test_categories_endpoint():
    response = client.get("/api/metrics/categories")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "category" in data[0]
        assert "items_sold" in data[0]
        assert "revenue" in data[0]

def test_funnel_endpoint():
    response = client.get("/api/metrics/funnel")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 3
    assert data[0]["stage"] == "1. Product Views"

def test_customers_endpoint():
    response = client.get("/api/customers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first_cust = data[0]
    assert "customer_id" in first_cust
    assert "predicted_churn_prob" in first_cust
    assert "predicted_clv" in first_cust

def test_predict_churn_sim():
    payload = {
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
    response = client.post("/api/predict/churn", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "churn_probability" in data
    assert "risk_segment" in data
    assert 0.0 <= data["churn_probability"] <= 1.0

def test_predict_clv_sim():
    payload = {
        "age": 30,
        "gender": "Female",
        "country": "USA",
        "acquisition_channel": "Email",
        "total_sessions": 5,
        "total_page_views": 12,
        "total_cart_additions": 3
    }
    response = client.post("/api/predict/clv", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_clv" in data
    assert data["predicted_clv"] >= 0.0
