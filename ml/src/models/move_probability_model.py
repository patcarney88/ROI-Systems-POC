"""
Move Probability Prediction Model
=================================

Predicts likelihood of a real estate client moving in the next 6-12 months.
Uses Gradient Boosting (XGBoost) for binary classification.

Target Metrics:
- Accuracy: 85%+
- Precision: 80%+
- Recall: 75%+
- AUC-ROC: 0.90+
"""

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, roc_auc_score,
    confusion_matrix, classification_report
)
from sklearn.preprocessing import StandardScaler
import mlflow
import mlflow.xgboost
from typing import Dict, Tuple, List, Optional
import joblib
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MoveProbabilityModel:
    """
    Predicts probability of client moving within 6-12 months.

    Features considered:
    - Behavioral signals (document access, email engagement)
    - Property factors (equity, value appreciation)
    - Market factors (rates, inventory)
    - Transaction history
    - Lifecycle indicators
    """

    def __init__(self, threshold: float = 0.5):
        """
        Initialize the Move Probability Model.

        Args:
            threshold: Classification threshold (default: 0.5)
        """
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = []
        self.threshold = threshold
        self.model_version = "1.0.0"

    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare features for training or prediction.

        Args:
            df: Input dataframe with raw features

        Returns:
            DataFrame with engineered features
        """
        features = [
            # Behavioral signals (30-day window)
            'doc_access_count_30d',
            'email_engagement_score',
            'property_search_frequency',
            'market_report_views_30d',
            'portal_login_frequency_30d',
            'comparable_views_30d',

            # Property factors
            'years_owned',
            'equity_percentage',
            'value_appreciation_pct',
            'property_age_years',
            'home_size_sqft',
            'lot_size_sqft',

            # Market factors
            'mortgage_rate_30y',
            'mortgage_rate_trend',
            'neighborhood_turnover_rate',
            'inventory_levels_zip',
            'median_price_zip',
            'days_on_market_avg_zip',

            # Transaction history
            'months_since_last_transaction',
            'transaction_frequency_lifetime',
            'avg_ownership_duration_years',

            # Lifecycle indicators
            'life_event_score',  # Composite score
            'home_size_vs_household_size',
            'commute_distance_miles',
            'school_district_rating_change',

            # Financial indicators
            'debt_to_income_ratio',
            'payment_to_income_ratio',
            'equity_growth_rate_annual',
        ]

        self.feature_names = features

        # Handle missing values
        feature_df = df[features].copy()
        feature_df = feature_df.fillna(feature_df.median())

        return feature_df

    def train(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: pd.DataFrame,
        y_val: pd.Series,
        experiment_name: str = "move_probability"
    ) -> Dict:
        """
        Train the XGBoost model with MLflow tracking.

        Args:
            X_train: Training features
            y_train: Training labels
            X_val: Validation features
            y_val: Validation labels
            experiment_name: MLflow experiment name

        Returns:
            Dictionary of training metrics
        """
        mlflow.set_experiment(experiment_name)

        with mlflow.start_run(run_name=f"move_probability_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):
            logger.info("Starting model training...")

            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_val_scaled = self.scaler.transform(X_val)

            # Define hyperparameters
            params = {
                'objective': 'binary:logistic',
                'eval_metric': 'auc',
                'max_depth': 6,
                'learning_rate': 0.1,
                'n_estimators': 200,
                'min_child_weight': 3,
                'subsample': 0.8,
                'colsample_bytree': 0.8,
                'scale_pos_weight': 3,  # Handle class imbalance
                'gamma': 0.1,
                'reg_alpha': 0.1,
                'reg_lambda': 1.0,
                'random_state': 42,
                'n_jobs': -1
            }

            # Log parameters
            mlflow.log_params(params)
            mlflow.log_param("threshold", self.threshold)
            mlflow.log_param("model_version", self.model_version)

            # Train model
            self.model = xgb.XGBClassifier(**params)

            eval_set = [(X_train_scaled, y_train), (X_val_scaled, y_val)]
            self.model.fit(
                X_train_scaled, y_train,
                eval_set=eval_set,
                early_stopping_rounds=20,
                verbose=False
            )

            # Evaluate on training set
            train_pred_proba = self.model.predict_proba(X_train_scaled)[:, 1]
            train_pred = (train_pred_proba > self.threshold).astype(int)

            # Evaluate on validation set
            val_pred_proba = self.model.predict_proba(X_val_scaled)[:, 1]
            val_pred = (val_pred_proba > self.threshold).astype(int)

            # Calculate metrics
            metrics = {
                'train_auc': roc_auc_score(y_train, train_pred_proba),
                'train_accuracy': accuracy_score(y_train, train_pred),
                'train_precision': precision_score(y_train, train_pred),
                'train_recall': recall_score(y_train, train_pred),

                'val_auc': roc_auc_score(y_val, val_pred_proba),
                'val_accuracy': accuracy_score(y_val, val_pred),
                'val_precision': precision_score(y_val, val_pred),
                'val_recall': recall_score(y_val, val_pred),
            }

            # Log metrics
            mlflow.log_metrics(metrics)

            # Log confusion matrix
            cm = confusion_matrix(y_val, val_pred)
            logger.info(f"Validation Confusion Matrix:\n{cm}")

            # Log classification report
            report = classification_report(y_val, val_pred)
            logger.info(f"Classification Report:\n{report}")

            # Log feature importance
            importance_dict = self.get_feature_importance()
            for feat, imp in list(importance_dict.items())[:10]:
                mlflow.log_metric(f"importance_{feat}", imp)

            # Log model
            mlflow.xgboost.log_model(self.model, "model")
            mlflow.sklearn.log_model(self.scaler, "scaler")

            logger.info(f"Training complete. Validation AUC: {metrics['val_auc']:.4f}")

            return metrics

    def predict(
        self,
        X: pd.DataFrame,
        return_probabilities: bool = True
    ) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """
        Make predictions on new data.

        Args:
            X: Input features
            return_probabilities: Whether to return probability scores

        Returns:
            Tuple of (predictions, probabilities)
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")

        # Scale features
        X_scaled = self.scaler.transform(X)

        # Get probabilities
        probabilities = self.model.predict_proba(X_scaled)[:, 1]

        # Apply threshold
        predictions = (probabilities > self.threshold).astype(int)

        if return_probabilities:
            return predictions, probabilities
        else:
            return predictions, None

    def predict_with_confidence(
        self,
        X: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Predict with confidence intervals using quantile regression.

        Args:
            X: Input features

        Returns:
            DataFrame with predictions and confidence bounds
        """
        predictions, probabilities = self.predict(X, return_probabilities=True)

        # Create results dataframe
        results = pd.DataFrame({
            'prediction': predictions,
            'probability': probabilities,
            'confidence_level': self._calculate_confidence(probabilities),
            'risk_category': self._categorize_risk(probabilities)
        })

        return results

    def _calculate_confidence(self, probabilities: np.ndarray) -> np.ndarray:
        """
        Calculate prediction confidence based on distance from threshold.

        Args:
            probabilities: Predicted probabilities

        Returns:
            Confidence scores (0-1)
        """
        # Confidence increases with distance from threshold
        distance = np.abs(probabilities - self.threshold)
        confidence = 2 * distance  # Scale to 0-1
        return np.clip(confidence, 0, 1)

    def _categorize_risk(self, probabilities: np.ndarray) -> np.ndarray:
        """
        Categorize move probability into risk levels.

        Args:
            probabilities: Predicted probabilities

        Returns:
            Risk categories
        """
        categories = np.empty(len(probabilities), dtype=object)
        categories[probabilities < 0.3] = 'LOW'
        categories[(probabilities >= 0.3) & (probabilities < 0.5)] = 'MEDIUM'
        categories[(probabilities >= 0.5) & (probabilities < 0.7)] = 'HIGH'
        categories[probabilities >= 0.7] = 'CRITICAL'
        return categories

    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance scores.

        Returns:
            Dictionary mapping feature names to importance scores
        """
        if self.model is None:
            raise ValueError("Model not trained.")

        importance = self.model.feature_importances_
        feature_importance = dict(zip(self.feature_names, importance))

        # Sort by importance
        sorted_importance = dict(
            sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        )

        return sorted_importance

    def explain_prediction(
        self,
        X: pd.DataFrame,
        instance_idx: int = 0
    ) -> Dict:
        """
        Explain a specific prediction using SHAP values.

        Args:
            X: Input features
            instance_idx: Index of instance to explain

        Returns:
            Dictionary with explanation
        """
        try:
            import shap

            # Create explainer
            explainer = shap.TreeExplainer(self.model)

            # Calculate SHAP values
            X_scaled = self.scaler.transform(X)
            shap_values = explainer.shap_values(X_scaled[instance_idx:instance_idx+1])

            # Get prediction
            prediction, probability = self.predict(
                X.iloc[instance_idx:instance_idx+1],
                return_probabilities=True
            )

            # Create explanation
            feature_contributions = dict(zip(
                self.feature_names,
                shap_values[0]
            ))

            # Sort by absolute contribution
            sorted_contributions = dict(
                sorted(
                    feature_contributions.items(),
                    key=lambda x: abs(x[1]),
                    reverse=True
                )
            )

            explanation = {
                'prediction': int(prediction[0]),
                'probability': float(probability[0]),
                'base_value': float(explainer.expected_value),
                'feature_contributions': sorted_contributions,
                'top_positive_factors': self._get_top_factors(sorted_contributions, positive=True),
                'top_negative_factors': self._get_top_factors(sorted_contributions, positive=False)
            }

            return explanation

        except ImportError:
            logger.warning("SHAP not installed. Install with: pip install shap")
            return {}

    def _get_top_factors(
        self,
        contributions: Dict[str, float],
        positive: bool = True,
        n: int = 5
    ) -> List[Tuple[str, float]]:
        """
        Get top contributing factors.

        Args:
            contributions: Feature contributions
            positive: Whether to get positive or negative factors
            n: Number of factors to return

        Returns:
            List of (feature, contribution) tuples
        """
        if positive:
            factors = [(k, v) for k, v in contributions.items() if v > 0]
        else:
            factors = [(k, v) for k, v in contributions.items() if v < 0]

        # Sort by absolute value
        factors.sort(key=lambda x: abs(x[1]), reverse=True)

        return factors[:n]

    def save_model(self, path: str):
        """
        Save model and scaler to disk.

        Args:
            path: Directory path to save model
        """
        model_path = f"{path}/move_probability_model.pkl"
        scaler_path = f"{path}/move_probability_scaler.pkl"

        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)

        # Save metadata
        metadata = {
            'feature_names': self.feature_names,
            'threshold': self.threshold,
            'model_version': self.model_version,
            'saved_at': datetime.now().isoformat()
        }

        metadata_path = f"{path}/move_probability_metadata.json"
        import json
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        logger.info(f"Model saved to {path}")

    def load_model(self, path: str):
        """
        Load model and scaler from disk.

        Args:
            path: Directory path containing model files
        """
        model_path = f"{path}/move_probability_model.pkl"
        scaler_path = f"{path}/move_probability_scaler.pkl"

        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)

        # Load metadata
        metadata_path = f"{path}/move_probability_metadata.json"
        import json
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)

        self.feature_names = metadata['feature_names']
        self.threshold = metadata['threshold']
        self.model_version = metadata['model_version']

        logger.info(f"Model loaded from {path}")

    def cross_validate(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        cv: int = 5
    ) -> Dict:
        """
        Perform cross-validation.

        Args:
            X: Features
            y: Labels
            cv: Number of folds

        Returns:
            Cross-validation scores
        """
        from sklearn.model_selection import cross_validate

        # Scale features
        X_scaled = self.scaler.fit_transform(X)

        # Define scoring metrics
        scoring = {
            'accuracy': 'accuracy',
            'precision': 'precision',
            'recall': 'recall',
            'roc_auc': 'roc_auc'
        }

        # Perform cross-validation
        cv_results = cross_validate(
            self.model,
            X_scaled,
            y,
            cv=cv,
            scoring=scoring,
            return_train_score=True,
            n_jobs=-1
        )

        # Calculate mean and std
        results = {}
        for metric in scoring.keys():
            results[f'{metric}_mean'] = cv_results[f'test_{metric}'].mean()
            results[f'{metric}_std'] = cv_results[f'test_{metric}'].std()

        logger.info(f"Cross-validation results: {results}")

        return results
