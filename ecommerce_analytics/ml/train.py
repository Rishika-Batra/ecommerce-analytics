import os
import json
import duckdb
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, mean_squared_error, r2_score

# Database path
DB_PATH = "ecommerce_analytics/data/ecommerce.db"
MODEL_DIR = "ecommerce_analytics/ml"

def load_data():
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"DuckDB database not found at {DB_PATH}. Run dbt first.")
    
    conn = duckdb.connect(DB_PATH)
    # Query features from the dim_customers analytical mart
    query = """
        select 
            customer_id,
            age,
            gender,
            country,
            acquisition_channel,
            total_orders,
            total_spend,
            average_order_value,
            total_sessions,
            total_page_views,
            total_cart_additions,
            is_churned
        from dim_customers
    """
    df = conn.execute(query).fetchdf()
    conn.close()
    return df

def train_models():
    print("Loading engineered features from dim_customers mart...")
    df = load_data()
    
    # 1. Preprocessing and Feature Encoding
    # Define categorical columns
    cat_cols = ["gender", "country", "acquisition_channel"]
    
    # Save encoding map to ensure consistency in FastAPI inference
    encoding_maps = {}
    for col in cat_cols:
        # Sort classes to make mapping deterministic
        unique_classes = sorted(df[col].unique().tolist())
        mapping = {val: idx for idx, val in enumerate(unique_classes)}
        encoding_maps[col] = mapping
        df[col] = df[col].map(mapping)
    
    # Save the encoding metadata
    with open(os.path.join(MODEL_DIR, "encoder_metadata.json"), "w") as f:
        json.dump(encoding_maps, f, indent=4)
    print("Saved feature encoders metadata.")

    # ------------------
    # Model 1: Churn Prediction (Classification)
    # Goal: Predict 'is_churned' (1 or 0)
    # Feature Selection: To avoid data leakage, we DO NOT use 'recency_days' or 'last_order_date'
    # since churn is directly defined by lack of recent purchases. Instead, we use demographics,
    # frequency of purchases, monetary aggregates, and web interaction aggregates.
    # ------------------
    churn_features = [
        "age", "gender", "country", "acquisition_channel", 
        "total_orders", "total_spend", "average_order_value",
        "total_sessions", "total_page_views", "total_cart_additions"
    ]
    
    X_churn = df[churn_features]
    y_churn = df["is_churned"]
    
    X_train_c, X_val_c, y_train_c, y_val_c = train_test_split(
        X_churn, y_churn, test_size=0.2, random_state=42, stratify=y_churn
    )
    
    print("\nTraining XGBoost Churn Classifier...")
    churn_model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.05,
        random_state=42,
        eval_metric="logloss"
    )
    churn_model.fit(X_train_c, y_train_c)
    
    # Evaluate Churn Model
    y_pred_c = churn_model.predict(X_val_c)
    y_proba_c = churn_model.predict_proba(X_val_c)[:, 1]
    
    acc = accuracy_score(y_val_c, y_pred_c)
    auc = roc_auc_score(y_val_c, y_proba_c)
    print(f"Churn Model Evaluation Metrics:")
    print(f"- Accuracy: {acc:.4f}")
    print(f"- ROC AUC: {auc:.4f}")
    
    # Save Churn Model
    churn_model.save_model(os.path.join(MODEL_DIR, "churn_model.json"))
    print("Saved Churn Model to ml/churn_model.json")
    
    # ------------------
    # Model 2: Customer Lifetime Value (CLV) Prediction (Regression)
    # Goal: Predict 'total_spend' (Monetary value)
    # Feature Selection: We predict total customer value using demographics and clickstream traffic intensity.
    # ------------------
    clv_features = [
        "age", "gender", "country", "acquisition_channel",
        "total_sessions", "total_page_views", "total_cart_additions"
    ]
    
    X_clv = df[clv_features]
    y_clv = df["total_spend"]
    
    X_train_r, X_val_r, y_train_r, y_val_r = train_test_split(
        X_clv, y_clv, test_size=0.2, random_state=42
    )
    
    print("\nTraining XGBoost CLV Regressor...")
    clv_model = xgb.XGBRegressor(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.05,
        random_state=42
    )
    clv_model.fit(X_train_r, y_train_r)
    
    # Evaluate CLV Model
    y_pred_r = clv_model.predict(X_val_r)
    rmse = np.sqrt(mean_squared_error(y_val_r, y_pred_r))
    r2 = r2_score(y_val_r, y_pred_r)
    print(f"CLV Model Evaluation Metrics:")
    print(f"- RMSE: ${rmse:.2f}")
    print(f"- R2 Score: {r2:.4f}")
    
    # Save CLV Model
    clv_model.save_model(os.path.join(MODEL_DIR, "clv_model.json"))
    print("Saved CLV Model to ml/clv_model.json")
    
    # Store feature list metadata
    features_meta = {
        "churn_features": churn_features,
        "clv_features": clv_features
    }
    with open(os.path.join(MODEL_DIR, "features_metadata.json"), "w") as f:
        json.dump(features_meta, f, indent=4)

if __name__ == "__main__":
    train_models()
