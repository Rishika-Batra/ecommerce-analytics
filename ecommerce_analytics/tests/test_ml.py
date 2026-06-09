import os
import sys
import pandas as pd
import pytest

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.predict import EcommercePredictor

DATA_DIR = "ecommerce_analytics/data"

def test_data_generation_files_exist():
    # Verify all expected CSV outputs are present
    expected_files = [
        "raw_customers.csv",
        "raw_products.csv",
        "raw_orders.csv",
        "raw_order_items.csv",
        "raw_web_events.csv"
    ]
    for file in expected_files:
        path = os.path.join(DATA_DIR, file)
        assert os.path.exists(path), f"File {file} missing from data/ folder."

def test_data_generation_schemas():
    # Load customer data and check columns
    df_cust = pd.read_csv(os.path.join(DATA_DIR, "raw_customers.csv"))
    expected_cols = ["customer_id", "join_date", "age", "gender", "country", "acquisition_channel"]
    assert all(col in df_cust.columns for col in expected_cols)
    assert len(df_cust) == 1000

    # Load products schema
    df_prod = pd.read_csv(os.path.join(DATA_DIR, "raw_products.csv"))
    assert "product_id" in df_prod.columns
    assert "price" in df_prod.columns
    assert len(df_prod) == 50

def test_predictor_predictions():
    # Test predictor load and predict
    predictor = EcommercePredictor()
    
    # Mock customer sample (low engagement)
    customer_low = {
        "age": 30,
        "gender": "Female",
        "country": "USA",
        "acquisition_channel": "Email",
        "total_orders": 1,
        "total_spend": 25.0,
        "average_order_value": 25.0,
        "total_sessions": 2,
        "total_page_views": 4,
        "total_cart_additions": 1
    }
    
    # Mock customer sample (high engagement)
    customer_high = {
        "age": 45,
        "gender": "Male",
        "country": "Germany",
        "acquisition_channel": "Paid Search",
        "total_orders": 12,
        "total_spend": 1200.0,
        "average_order_value": 100.0,
        "total_sessions": 25,
        "total_page_views": 85,
        "total_cart_additions": 18
    }

    churn_prob_low = predictor.predict_churn(customer_low)
    churn_prob_high = predictor.predict_churn(customer_high)
    
    clv_pred_low = predictor.predict_clv(customer_low)
    clv_pred_high = predictor.predict_clv(customer_high)

    assert 0.0 <= churn_prob_low <= 1.0
    assert 0.0 <= churn_prob_high <= 1.0
    assert clv_pred_low >= 0.0
    assert clv_pred_high >= 0.0
    
    # The high engagement user should have higher CLV prediction than the low engagement one
    assert clv_pred_high > clv_pred_low
