import os
import json
import numpy as np
import xgboost as xgb
import pandas as pd

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

class EcommercePredictor:
    def __init__(self):
        self.encoder_path = os.path.join(MODEL_DIR, "encoder_metadata.json")
        self.features_path = os.path.join(MODEL_DIR, "features_metadata.json")
        self.churn_model_path = os.path.join(MODEL_DIR, "churn_model.json")
        self.clv_model_path = os.path.join(MODEL_DIR, "clv_model.json")
        
        self.load_metadata()
        self.load_models()

    def load_metadata(self):
        if not os.path.exists(self.encoder_path) or not os.path.exists(self.features_path):
            raise FileNotFoundError("Metadata files missing. Train the model first.")
        with open(self.encoder_path, "r") as f:
            self.encoders = json.load(f)
        with open(self.features_path, "r") as f:
            self.features = json.load(f)

    def load_models(self):
        if not os.path.exists(self.churn_model_path) or not os.path.exists(self.clv_model_path):
            raise FileNotFoundError("Model files missing. Train the models first.")
        
        # Load classification model for churn
        self.churn_model = xgb.XGBClassifier()
        self.churn_model.load_model(self.churn_model_path)
        
        # Load regression model for CLV
        self.clv_model = xgb.XGBRegressor()
        self.clv_model.load_model(self.clv_model_path)

    def preprocess_input(self, data: dict, feature_list: list) -> pd.DataFrame:
        df = pd.DataFrame([data])
        # Encode categorical fields based on mapping created at train time
        for col in ["gender", "country", "acquisition_channel"]:
            if col in df.columns:
                val = df.at[0, col]
                mapping = self.encoders[col]
                df[col] = mapping.get(val, 0)
        
        # Select and order columns as expected by XGBoost
        return df[feature_list]

    def predict_churn(self, customer_data: dict) -> float:
        X = self.preprocess_input(customer_data, self.features["churn_features"])
        prob = self.churn_model.predict_proba(X)[0][1]
        return float(prob)

    def predict_clv(self, customer_data: dict) -> float:
        X = self.preprocess_input(customer_data, self.features["clv_features"])
        pred = self.clv_model.predict(X)[0]
        return float(max(0.0, pred))
