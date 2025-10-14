"""
Transaction Type Prediction Model
==================================

Predicts the type of next real estate transaction for a client.
Uses Random Forest for multi-class classification.

Classes: BUY, SELL, REFINANCE, HOLD

Target Metrics:
- Overall Accuracy: 80%+
- Per-class Precision: 75%+
- Per-class Recall: 70%+
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    classification_report, confusion_matrix
)
from sklearn.model_selection import cross_validate
import mlflow
import mlflow.sklearn
from typing import Dict, Tuple, List, Optional
import joblib
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TransactionTypeModel:
    """
    Predicts type of next transaction: BUY, SELL, REFINANCE, or HOLD.

    Features considered:
    - Financial situation (equity, mortgage balance, refi potential)
    - Property factors (years owned, value, size adequacy)
    - Market conditions (rates, inventory, forecasts)
    - Behavioral signals (search patterns, calculator usage)
    - Life stage indicators (household changes, job location, income)
    """

    def __init__(self):
        """Initialize the Transaction Type Model."""
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_names = []
        self.classes = ['BUY', 'SELL', 'REFINANCE', 'HOLD']
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
            # Financial situation
            'equity_percentage',
            'mortgage_balance',
            'mortgage_balance_ratio',
            'refi_potential_savings_monthly',
            'refi_potential_savings_pct',
            'debt_to_income_ratio',
            'credit_score',
            'cash_reserves_months',

            # Property factors
            'years_owned',
            'property_value',
            'property_value_appreciation_pct',
            'maintenance_cost_annual',
            'maintenance_cost_trend',
            'home_size_adequacy_score',
            'bedrooms',
            'bathrooms',

            # Market conditions
            'mortgage_rate_30y',
            'mortgage_rate_15y',
            'mortgage_rate_trend_30d',
            'mortgage_rate_trend_90d',
            'inventory_levels_zip',
            'inventory_trend',
            'median_price_zip',
            'price_appreciation_forecast_6m',
            'price_appreciation_forecast_12m',

            # Behavioral signals
            'property_search_buy_frequency',
            'property_search_sell_frequency',
            'mortgage_calculator_usage_count',
            'refi_calculator_usage_count',
            'comparable_property_views_buy',
            'comparable_property_views_sell',
            'market_analysis_requests',

            # Life stage indicators
            'household_size',
            'household_size_change',
            'household_income',
            'income_change_pct',
            'job_location_change_distance',
            'life_event_indicators_composite',
            'school_age_children_count',

            # Transaction history
            'transactions_lifetime',
            'months_since_last_buy',
            'months_since_last_sell',
            'months_since_last_refi',
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
        experiment_name: str = "transaction_type"
    ) -> Dict:
        """
        Train the Random Forest classifier.

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

        with mlflow.start_run(run_name=f"transaction_type_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):
            logger.info("Starting transaction type model training...")

            # Encode labels
            y_train_encoded = self.label_encoder.fit_transform(y_train)
            y_val_encoded = self.label_encoder.transform(y_val)

            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_val_scaled = self.scaler.transform(X_val)

            # Define model parameters
            params = {
                'n_estimators': 500,
                'max_depth': 15,
                'min_samples_split': 10,
                'min_samples_leaf': 5,
                'max_features': 'sqrt',
                'class_weight': 'balanced',
                'random_state': 42,
                'n_jobs': -1,
                'oob_score': True,
                'bootstrap': True,
                'max_samples': 0.8
            }

            # Log parameters
            mlflow.log_params(params)
            mlflow.log_param("model_version", self.model_version)
            mlflow.log_param("n_classes", len(self.classes))

            # Train model
            self.model = RandomForestClassifier(**params)
            self.model.fit(X_train_scaled, y_train_encoded)

            # Training predictions
            train_pred = self.model.predict(X_train_scaled)
            train_proba = self.model.predict_proba(X_train_scaled)

            # Validation predictions
            val_pred = self.model.predict(X_val_scaled)
            val_proba = self.model.predict_proba(X_val_scaled)

            # Calculate overall metrics
            metrics = {
                'train_accuracy': accuracy_score(y_train_encoded, train_pred),
                'val_accuracy': accuracy_score(y_val_encoded, val_pred),
                'oob_score': self.model.oob_score_
            }

            # Calculate per-class metrics
            train_report = classification_report(
                y_train_encoded, train_pred,
                target_names=self.classes,
                output_dict=True
            )

            val_report = classification_report(
                y_val_encoded, val_pred,
                target_names=self.classes,
                output_dict=True
            )

            # Log overall metrics
            mlflow.log_metrics(metrics)

            # Log per-class metrics
            for class_name in self.classes:
                mlflow.log_metric(f'train_precision_{class_name}', train_report[class_name]['precision'])
                mlflow.log_metric(f'train_recall_{class_name}', train_report[class_name]['recall'])
                mlflow.log_metric(f'train_f1_{class_name}', train_report[class_name]['f1-score'])

                mlflow.log_metric(f'val_precision_{class_name}', val_report[class_name]['precision'])
                mlflow.log_metric(f'val_recall_{class_name}', val_report[class_name]['recall'])
                mlflow.log_metric(f'val_f1_{class_name}', val_report[class_name]['f1-score'])

            # Log confusion matrix
            cm = confusion_matrix(y_val_encoded, val_pred)
            logger.info(f"Validation Confusion Matrix:\n{cm}")
            logger.info(f"Classes: {self.classes}")

            # Log classification report
            logger.info(f"Validation Classification Report:\n{classification_report(y_val_encoded, val_pred, target_names=self.classes)}")

            # Log feature importance
            importance_dict = self.get_feature_importance()
            for feat, imp in list(importance_dict.items())[:10]:
                mlflow.log_metric(f"importance_{feat}", imp)

            # Log models
            mlflow.sklearn.log_model(self.model, "model")
            mlflow.sklearn.log_model(self.scaler, "scaler")

            logger.info(f"Training complete. Validation Accuracy: {metrics['val_accuracy']:.4f}")

            return {**metrics, 'classification_report': val_report}

    def predict(
        self,
        X: pd.DataFrame,
        return_probabilities: bool = True
    ) -> Tuple[np.ndarray, Optional[np.ndarray], Optional[np.ndarray]]:
        """
        Predict transaction type for new data.

        Args:
            X: Input features
            return_probabilities: Whether to return probability scores

        Returns:
            Tuple of (predicted_classes, confidences, all_probabilities)
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")

        # Scale features
        X_scaled = self.scaler.transform(X)

        # Make predictions
        predictions_encoded = self.model.predict(X_scaled)
        probabilities = self.model.predict_proba(X_scaled)

        # Decode predictions
        predicted_classes = self.label_encoder.inverse_transform(predictions_encoded)

        # Get confidence for predicted class
        confidences = np.max(probabilities, axis=1)

        if return_probabilities:
            return predicted_classes, confidences, probabilities
        else:
            return predicted_classes, confidences, None

    def predict_with_reasoning(
        self,
        X: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Predict with detailed reasoning and alternative scenarios.

        Args:
            X: Input features

        Returns:
            DataFrame with predictions, confidences, and alternatives
        """
        predicted_classes, confidences, probabilities = self.predict(
            X, return_probabilities=True
        )

        results = []
        for i in range(len(X)):
            # Get probabilities for all classes
            class_probs = dict(zip(self.classes, probabilities[i]))

            # Sort by probability
            sorted_probs = sorted(
                class_probs.items(),
                key=lambda x: x[1],
                reverse=True
            )

            # Primary prediction
            primary = sorted_probs[0]

            # Alternative predictions
            alternatives = sorted_probs[1:]

            result = {
                'predicted_transaction_type': primary[0],
                'confidence': primary[1],
                'confidence_level': self._categorize_confidence(primary[1]),
                **{f'prob_{cls}': prob for cls, prob in class_probs.items()},
                'top_alternative': alternatives[0][0] if alternatives else None,
                'top_alternative_prob': alternatives[0][1] if alternatives else 0.0
            }

            results.append(result)

        return pd.DataFrame(results)

    def _categorize_confidence(self, confidence: float) -> str:
        """
        Categorize prediction confidence.

        Args:
            confidence: Confidence score (0-1)

        Returns:
            Confidence category
        """
        if confidence >= 0.8:
            return 'VERY_HIGH'
        elif confidence >= 0.6:
            return 'HIGH'
        elif confidence >= 0.4:
            return 'MEDIUM'
        else:
            return 'LOW'

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
        Explain a specific prediction.

        Args:
            X: Input features
            instance_idx: Index of instance to explain

        Returns:
            Dictionary with explanation
        """
        # Get prediction
        predicted_classes, confidences, probabilities = self.predict(
            X.iloc[instance_idx:instance_idx+1],
            return_probabilities=True
        )

        predicted_class = predicted_classes[0]
        confidence = confidences[0]
        class_probs = dict(zip(self.classes, probabilities[0]))

        # Get top contributing features
        feature_values = X.iloc[instance_idx]
        feature_importance = self.get_feature_importance()

        # Calculate feature contributions
        contributions = []
        for feature, importance in feature_importance.items():
            value = feature_values[feature]
            contributions.append({
                'feature': feature,
                'value': float(value),
                'importance': float(importance),
                'contribution_score': float(importance * abs(value))
            })

        # Sort by contribution
        contributions.sort(key=lambda x: x['contribution_score'], reverse=True)

        explanation = {
            'predicted_class': predicted_class,
            'confidence': float(confidence),
            'class_probabilities': {k: float(v) for k, v in class_probs.items()},
            'top_contributing_features': contributions[:10],
            'recommendation': self._generate_recommendation(
                predicted_class,
                confidence,
                class_probs
            )
        }

        return explanation

    def _generate_recommendation(
        self,
        predicted_class: str,
        confidence: float,
        class_probs: Dict[str, float]
    ) -> str:
        """
        Generate action recommendation based on prediction.

        Args:
            predicted_class: Predicted transaction type
            confidence: Prediction confidence
            class_probs: Probabilities for all classes

        Returns:
            Recommendation text
        """
        recommendations = {
            'BUY': "Client likely to purchase. Engage with property listings and buyer resources.",
            'SELL': "Client likely to sell. Provide market analysis and seller services.",
            'REFINANCE': "Client likely to refinance. Offer mortgage rate comparisons and refinance calculators.",
            'HOLD': "Client likely to maintain current position. Focus on property value updates and market insights."
        }

        base_rec = recommendations.get(predicted_class, "Monitor client activity.")

        if confidence < 0.5:
            # Check second highest probability
            sorted_probs = sorted(class_probs.items(), key=lambda x: x[1], reverse=True)
            second_class = sorted_probs[1][0]
            base_rec += f" Note: Also consider {second_class.lower()} potential (uncertainty detected)."

        return base_rec

    def save_model(self, path: str):
        """
        Save model, scaler, and encoder to disk.

        Args:
            path: Directory path to save model
        """
        model_path = f"{path}/transaction_type_model.pkl"
        scaler_path = f"{path}/transaction_type_scaler.pkl"
        encoder_path = f"{path}/transaction_type_encoder.pkl"

        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)
        joblib.dump(self.label_encoder, encoder_path)

        # Save metadata
        metadata = {
            'feature_names': self.feature_names,
            'classes': self.classes,
            'model_version': self.model_version,
            'saved_at': datetime.now().isoformat()
        }

        metadata_path = f"{path}/transaction_type_metadata.json"
        import json
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        logger.info(f"Model saved to {path}")

    def load_model(self, path: str):
        """
        Load model, scaler, and encoder from disk.

        Args:
            path: Directory path containing model files
        """
        model_path = f"{path}/transaction_type_model.pkl"
        scaler_path = f"{path}/transaction_type_scaler.pkl"
        encoder_path = f"{path}/transaction_type_encoder.pkl"

        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        self.label_encoder = joblib.load(encoder_path)

        # Load metadata
        metadata_path = f"{path}/transaction_type_metadata.json"
        import json
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)

        self.feature_names = metadata['feature_names']
        self.classes = metadata['classes']
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
        # Encode labels
        y_encoded = self.label_encoder.fit_transform(y)

        # Scale features
        X_scaled = self.scaler.fit_transform(X)

        # Define scoring metrics
        scoring = {
            'accuracy': 'accuracy',
            'precision_macro': 'precision_macro',
            'recall_macro': 'recall_macro',
            'f1_macro': 'f1_macro'
        }

        # Perform cross-validation
        cv_results = cross_validate(
            self.model,
            X_scaled,
            y_encoded,
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
