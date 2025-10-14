"""
AI-Powered Alert Scoring Model
Uses Gradient Boosting for intent prediction with 70% accuracy target
Processes signals and generates confidence scores for buy/sell/refinance intent
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.preprocessing import StandardScaler
import joblib
import json
from datetime import datetime
from typing import Dict, List, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AlertScoringModel:
    """
    Gradient Boosting model for predicting homeowner intent
    """

    def __init__(self, model_type: str = 'sell'):
        """
        Initialize model

        Args:
            model_type: One of 'sell', 'buy', 'refinance', 'investment'
        """
        self.model_type = model_type
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = []
        self.model_version = None

    def engineer_features(self, signals: List[Dict], user_features: Dict) -> np.ndarray:
        """
        Engineer features from signals and user data

        Args:
            signals: List of detected signals
            user_features: User feature dictionary

        Returns:
            Feature vector
        """
        features = {}

        # Document Activity Features
        features['doc_access_count'] = user_features.get('docAccessCount', 0)
        features['doc_download_count'] = user_features.get('docDownloadCount', 0)
        features['doc_share_count'] = user_features.get('docShareCount', 0)
        features['doc_access_frequency'] = user_features.get('docAccessFrequency', 0)
        features['last_doc_access_days'] = user_features.get('lastDocAccessDays', 999)

        # Email Engagement Features
        features['email_open_rate'] = user_features.get('emailOpenRate', 0)
        features['email_click_rate'] = user_features.get('emailClickRate', 0)
        features['refinance_email_clicks'] = user_features.get('refinanceEmailClicks', 0)
        features['market_report_views'] = user_features.get('marketReportViews', 0)

        # Platform Behavior Features
        features['value_check_count'] = user_features.get('valueCheckCount', 0)
        features['calculator_use_count'] = user_features.get('calculatorUseCount', 0)
        features['comparable_views'] = user_features.get('comparableViews', 0)
        features['session_count'] = user_features.get('sessionCount', 0)
        features['avg_session_duration'] = user_features.get('avgSessionDuration', 0)

        # Property Context Features
        features['property_count'] = user_features.get('propertyCount', 0)
        features['home_ownership_years'] = user_features.get('homeOwnershipYears', 0)
        features['estimated_equity'] = user_features.get('estimatedEquity', 0)
        features['loan_to_value'] = user_features.get('loanToValue', 0)

        # Engagement Pattern Features
        features['days_since_last_visit'] = user_features.get('daysSinceLastVisit', 999)
        features['visit_frequency'] = user_features.get('visitFrequency', 0)

        # Life Event Indicators
        features['address_change_recent'] = 1 if user_features.get('addressChangeRecent') else 0
        features['job_change_indicator'] = 1 if user_features.get('jobChangeIndicator') else 0
        features['marital_status_change'] = 1 if user_features.get('maritalStatusChange') else 0

        # Signal Strength Features
        signal_strengths = {}
        signal_confidences = {}

        for signal in signals:
            signal_type = signal.get('signalType', '')
            signal_strengths[signal_type] = signal.get('strength', 0)
            signal_confidences[signal_type] = signal.get('confidence', 0)

        # Document signal strengths
        features['document_access_spike_strength'] = signal_strengths.get('DOCUMENT_ACCESS_SPIKE', 0)
        features['document_download_pattern_strength'] = signal_strengths.get('DOCUMENT_DOWNLOAD_PATTERN', 0)
        features['document_sharing_activity_strength'] = signal_strengths.get('DOCUMENT_SHARING_ACTIVITY', 0)
        features['dormant_reactivation_strength'] = signal_strengths.get('DORMANT_REACTIVATION', 0)

        # Email signal strengths
        features['high_email_engagement_strength'] = signal_strengths.get('HIGH_EMAIL_ENGAGEMENT', 0)
        features['refinance_interest_strength'] = signal_strengths.get('REFINANCE_INTEREST', 0)
        features['market_report_views_strength'] = signal_strengths.get('MARKET_REPORT_VIEWS', 0)

        # Platform signal strengths
        features['value_checks_strength'] = signal_strengths.get('FREQUENT_VALUE_CHECKS', 0)
        features['calculator_usage_strength'] = signal_strengths.get('CALCULATOR_USAGE', 0)
        features['comparable_research_strength'] = signal_strengths.get('COMPARABLE_RESEARCH', 0)
        features['profile_updates_strength'] = signal_strengths.get('PROFILE_UPDATES', 0)

        # Signal counts by category
        features['document_signal_count'] = len([s for s in signals if s.get('signalCategory') == 'DOCUMENT_ACTIVITY'])
        features['email_signal_count'] = len([s for s in signals if s.get('signalCategory') == 'EMAIL_ENGAGEMENT'])
        features['platform_signal_count'] = len([s for s in signals if s.get('signalCategory') == 'PLATFORM_BEHAVIOR'])

        # Total signal strength
        features['total_signal_strength'] = sum(signal_strengths.values())
        features['avg_signal_confidence'] = np.mean(list(signal_confidences.values())) if signal_confidences else 0

        # Store feature names
        if not self.feature_names:
            self.feature_names = list(features.keys())

        # Convert to numpy array
        feature_vector = np.array([features[name] for name in self.feature_names])

        return feature_vector.reshape(1, -1)

    def train(self, X: np.ndarray, y: np.ndarray, hyperparameters: Dict = None) -> Dict:
        """
        Train the gradient boosting model

        Args:
            X: Feature matrix
            y: Target labels (0 or 1)
            hyperparameters: Model hyperparameters

        Returns:
            Training metrics
        """
        logger.info(f"Training {self.model_type} model with {len(X)} samples")

        # Default hyperparameters
        if hyperparameters is None:
            hyperparameters = {
                'n_estimators': 100,
                'learning_rate': 0.1,
                'max_depth': 5,
                'min_samples_split': 20,
                'min_samples_leaf': 10,
                'subsample': 0.8,
                'random_state': 42
            }

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train model
        self.model = GradientBoostingClassifier(**hyperparameters)
        self.model.fit(X_train_scaled, y_train)

        # Make predictions
        y_pred = self.model.predict(X_test_scaled)
        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]

        # Calculate metrics
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1_score': f1_score(y_test, y_pred),
            'auc': roc_auc_score(y_test, y_pred_proba)
        }

        # Cross-validation
        cv_scores = cross_val_score(self.model, X_train_scaled, y_train, cv=5, scoring='accuracy')
        metrics['cv_mean'] = cv_scores.mean()
        metrics['cv_std'] = cv_scores.std()

        logger.info(f"Training complete - Accuracy: {metrics['accuracy']:.3f}, AUC: {metrics['auc']:.3f}")

        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)

        logger.info("\nTop 10 Features:")
        logger.info(feature_importance.head(10))

        metrics['feature_importance'] = feature_importance.to_dict('records')

        return metrics

    def predict(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predict intent and confidence scores

        Args:
            X: Feature matrix

        Returns:
            Tuple of (predictions, probabilities)
        """
        if self.model is None:
            raise ValueError("Model not trained yet")

        X_scaled = self.scaler.transform(X)
        predictions = self.model.predict(X_scaled)
        probabilities = self.model.predict_proba(X_scaled)[:, 1]

        return predictions, probabilities

    def score_user(self, signals: List[Dict], user_features: Dict) -> Dict:
        """
        Score a single user

        Args:
            signals: List of detected signals
            user_features: User feature dictionary

        Returns:
            Score dictionary with confidence and explanation
        """
        # Engineer features
        X = self.engineer_features(signals, user_features)

        # Predict
        prediction, probability = self.predict(X)

        # Get feature contributions (using SHAP would be better in production)
        feature_vector = X[0]
        feature_contributions = {}

        for i, feature_name in enumerate(self.feature_names):
            if feature_vector[i] > 0:
                importance = self.model.feature_importances_[i]
                feature_contributions[feature_name] = {
                    'value': float(feature_vector[i]),
                    'importance': float(importance)
                }

        # Sort by importance
        top_features = sorted(
            feature_contributions.items(),
            key=lambda x: x[1]['importance'],
            reverse=True
        )[:5]

        result = {
            'model_type': self.model_type,
            'prediction': int(prediction[0]),
            'confidence': float(probability[0]),
            'calibrated_score': self._calibrate_score(float(probability[0])),
            'top_features': dict(top_features),
            'signal_count': len(signals),
            'model_version': self.model_version
        }

        return result

    def _calibrate_score(self, raw_score: float) -> float:
        """
        Calibrate raw probability to better align with actual conversion rates
        Using isotonic regression or Platt scaling in production
        """
        # Simple calibration: reduce overconfidence
        if raw_score > 0.9:
            return 0.85 + (raw_score - 0.9) * 0.5
        elif raw_score < 0.1:
            return raw_score * 0.5
        else:
            return raw_score

    def save_model(self, version: str, filepath: str) -> None:
        """
        Save model to disk

        Args:
            version: Model version string
            filepath: Path to save model
        """
        self.model_version = version

        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'model_type': self.model_type,
            'version': version,
            'saved_at': datetime.now().isoformat()
        }

        joblib.dump(model_data, filepath)
        logger.info(f"Model saved to {filepath}")

    def load_model(self, filepath: str) -> None:
        """
        Load model from disk

        Args:
            filepath: Path to model file
        """
        model_data = joblib.load(filepath)

        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_names = model_data['feature_names']
        self.model_type = model_data['model_type']
        self.model_version = model_data['version']

        logger.info(f"Model loaded from {filepath} - Version: {self.model_version}")


def batch_score_users(model: AlertScoringModel, users_data: List[Dict]) -> List[Dict]:
    """
    Batch score multiple users

    Args:
        model: Trained AlertScoringModel
        users_data: List of user data dictionaries with 'signals' and 'features'

    Returns:
        List of score dictionaries
    """
    results = []

    for user_data in users_data:
        try:
            score = model.score_user(
                signals=user_data.get('signals', []),
                user_features=user_data.get('features', {})
            )
            score['user_id'] = user_data.get('user_id')
            results.append(score)
        except Exception as e:
            logger.error(f"Failed to score user {user_data.get('user_id')}: {str(e)}")
            continue

    logger.info(f"Batch scored {len(results)} users")

    return results


if __name__ == "__main__":
    # Example usage
    logger.info("AI-Powered Alert Scoring Model initialized")

    # Initialize models for each intent type
    sell_model = AlertScoringModel('sell')
    buy_model = AlertScoringModel('buy')
    refinance_model = AlertScoringModel('refinance')

    logger.info("Models ready for training")
