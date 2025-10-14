"""
Contact Timing Optimization Model
==================================

Predicts optimal day, time, and channel for client contact.
Uses LightGBM for multi-output time-series classification.

Predictions:
- Best day of week (0-6)
- Best hour of day (0-23)
- Best channel (email, phone, sms)

Target Metrics:
- Timing Accuracy: 75%+
- Engagement Lift: 25%+
- Channel Prediction Accuracy: 80%+
"""

import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import cross_validate
import mlflow
import mlflow.lightgbm
from typing import Dict, Tuple, List, Optional
from datetime import datetime, timedelta
import joblib
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ContactTimingModel:
    """
    Predicts optimal contact timing and channel for maximum engagement.

    Models:
    - Day predictor: Best day of week (0-6)
    - Hour predictor: Best hour of day (0-23)
    - Channel predictor: Best channel (email, phone, sms)

    Features considered:
    - Historical engagement patterns
    - Recent activity
    - Channel preferences
    - Cyclical time features
    - Demographics
    """

    def __init__(self):
        """Initialize the Contact Timing Model."""
        self.day_model = None
        self.hour_model = None
        self.channel_model = None
        self.scaler = StandardScaler()
        self.channel_encoder = LabelEncoder()
        self.feature_names = []
        self.model_version = "1.0.0"

        self.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        self.channels = ['email', 'phone', 'sms']

    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare features for training or prediction.

        Args:
            df: Input dataframe with raw features

        Returns:
            DataFrame with engineered features
        """
        features = [
            # Historical engagement patterns (aggregated)
            'avg_email_open_hour',
            'std_email_open_hour',
            'most_active_day_of_week',
            'weekend_engagement_ratio',
            'morning_engagement_ratio',  # 6-12
            'afternoon_engagement_ratio',  # 12-18
            'evening_engagement_ratio',  # 18-24

            # Recent activity (last 30 days)
            'days_since_last_login',
            'days_since_last_email_open',
            'days_since_last_phone_answer',
            'days_since_last_sms_response',
            'recent_engagement_trend',
            'engagement_frequency_30d',

            # Channel preferences (historical rates)
            'email_open_rate',
            'email_click_rate',
            'phone_answer_rate',
            'sms_response_rate',
            'preferred_channel_score',

            # Cyclical time features (for current prediction time)
            'day_of_week_sin',
            'day_of_week_cos',
            'hour_of_day_sin',
            'hour_of_day_cos',
            'day_of_month',
            'is_holiday',
            'is_weekend',
            'is_business_hours',

            # Demographics and context
            'age_group',
            'employment_status',
            'timezone_offset',
            'has_children',
            'property_stage',  # Searching, under_contract, etc.

            # Behavioral patterns
            'typical_response_time_hours',
            'prefers_immediate_contact',
            'engagement_consistency_score',
        ]

        self.feature_names = features

        # Handle missing values
        feature_df = df[features].copy()
        feature_df = feature_df.fillna(feature_df.median())

        return feature_df

    def _encode_cyclical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Encode cyclical features (day, hour) as sin/cos.

        Args:
            df: Input dataframe

        Returns:
            DataFrame with encoded cyclical features
        """
        df = df.copy()

        # Day of week (0-6)
        if 'day_of_week' in df.columns:
            df['day_of_week_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
            df['day_of_week_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)

        # Hour of day (0-23)
        if 'hour_of_day' in df.columns:
            df['hour_of_day_sin'] = np.sin(2 * np.pi * df['hour_of_day'] / 24)
            df['hour_of_day_cos'] = np.cos(2 * np.pi * df['hour_of_day'] / 24)

        return df

    def train_day_model(
        self,
        X_train: pd.DataFrame,
        y_train_day: pd.Series,
        X_val: pd.DataFrame,
        y_val_day: pd.Series,
        experiment_name: str = "contact_timing_day"
    ) -> Dict:
        """
        Train model for best day prediction.

        Args:
            X_train: Training features
            y_train_day: Training labels (day of week 0-6)
            X_val: Validation features
            y_val_day: Validation labels
            experiment_name: MLflow experiment name

        Returns:
            Training metrics
        """
        mlflow.set_experiment(experiment_name)

        with mlflow.start_run(run_name=f"day_model_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):
            logger.info("Training day prediction model...")

            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_val_scaled = self.scaler.transform(X_val)

            # LightGBM parameters for multiclass
            params = {
                'objective': 'multiclass',
                'num_class': 7,  # 7 days of week
                'metric': 'multi_logloss',
                'num_leaves': 31,
                'learning_rate': 0.05,
                'feature_fraction': 0.8,
                'bagging_fraction': 0.8,
                'bagging_freq': 5,
                'verbose': -1,
                'random_state': 42
            }

            mlflow.log_params(params)

            # Create datasets
            train_data = lgb.Dataset(X_train_scaled, label=y_train_day)
            val_data = lgb.Dataset(X_val_scaled, label=y_val_day, reference=train_data)

            # Train model
            self.day_model = lgb.train(
                params,
                train_data,
                valid_sets=[val_data],
                num_boost_round=500,
                callbacks=[lgb.early_stopping(20), lgb.log_evaluation(50)]
            )

            # Evaluate
            val_pred = np.argmax(self.day_model.predict(X_val_scaled), axis=1)

            metrics = {
                'day_accuracy': accuracy_score(y_val_day, val_pred),
            }

            # Per-day metrics
            report = classification_report(
                y_val_day, val_pred,
                target_names=self.days,
                output_dict=True
            )

            for i, day in enumerate(self.days):
                metrics[f'day_{day}_precision'] = report[day]['precision']
                metrics[f'day_{day}_recall'] = report[day]['recall']

            mlflow.log_metrics(metrics)
            mlflow.lightgbm.log_model(self.day_model, "day_model")

            logger.info(f"Day model training complete. Accuracy: {metrics['day_accuracy']:.4f}")

            return metrics

    def train_hour_model(
        self,
        X_train: pd.DataFrame,
        y_train_hour: pd.Series,
        X_val: pd.DataFrame,
        y_val_hour: pd.Series,
        experiment_name: str = "contact_timing_hour"
    ) -> Dict:
        """
        Train model for best hour prediction.

        Args:
            X_train: Training features
            y_train_hour: Training labels (hour 0-23)
            X_val: Validation features
            y_val_hour: Validation labels
            experiment_name: MLflow experiment name

        Returns:
            Training metrics
        """
        mlflow.set_experiment(experiment_name)

        with mlflow.start_run(run_name=f"hour_model_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):
            logger.info("Training hour prediction model...")

            # Use same scaled features
            X_train_scaled = self.scaler.transform(X_train)
            X_val_scaled = self.scaler.transform(X_val)

            # LightGBM parameters for 24-class
            params = {
                'objective': 'multiclass',
                'num_class': 24,  # 24 hours
                'metric': 'multi_logloss',
                'num_leaves': 31,
                'learning_rate': 0.05,
                'feature_fraction': 0.8,
                'bagging_fraction': 0.8,
                'bagging_freq': 5,
                'verbose': -1,
                'random_state': 42
            }

            mlflow.log_params(params)

            # Create datasets
            train_data = lgb.Dataset(X_train_scaled, label=y_train_hour)
            val_data = lgb.Dataset(X_val_scaled, label=y_val_hour, reference=train_data)

            # Train model
            self.hour_model = lgb.train(
                params,
                train_data,
                valid_sets=[val_data],
                num_boost_round=500,
                callbacks=[lgb.early_stopping(20), lgb.log_evaluation(50)]
            )

            # Evaluate
            val_pred = np.argmax(self.hour_model.predict(X_val_scaled), axis=1)

            metrics = {
                'hour_accuracy': accuracy_score(y_val_hour, val_pred),
            }

            # Group hours into time periods
            time_periods = {
                'morning': (6, 12),
                'afternoon': (12, 18),
                'evening': (18, 24),
                'night': (0, 6)
            }

            for period, (start, end) in time_periods.items():
                period_mask = (y_val_hour >= start) & (y_val_hour < end)
                if period_mask.sum() > 0:
                    period_accuracy = accuracy_score(
                        y_val_hour[period_mask],
                        val_pred[period_mask]
                    )
                    metrics[f'hour_{period}_accuracy'] = period_accuracy

            mlflow.log_metrics(metrics)
            mlflow.lightgbm.log_model(self.hour_model, "hour_model")

            logger.info(f"Hour model training complete. Accuracy: {metrics['hour_accuracy']:.4f}")

            return metrics

    def train_channel_model(
        self,
        X_train: pd.DataFrame,
        y_train_channel: pd.Series,
        X_val: pd.DataFrame,
        y_val_channel: pd.Series,
        experiment_name: str = "contact_timing_channel"
    ) -> Dict:
        """
        Train model for best channel prediction.

        Args:
            X_train: Training features
            y_train_channel: Training labels (channel)
            X_val: Validation features
            y_val_channel: Validation labels
            experiment_name: MLflow experiment name

        Returns:
            Training metrics
        """
        mlflow.set_experiment(experiment_name)

        with mlflow.start_run(run_name=f"channel_model_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):
            logger.info("Training channel prediction model...")

            # Encode channel labels
            y_train_encoded = self.channel_encoder.fit_transform(y_train_channel)
            y_val_encoded = self.channel_encoder.transform(y_val_channel)

            # Use same scaled features
            X_train_scaled = self.scaler.transform(X_train)
            X_val_scaled = self.scaler.transform(X_val)

            # LightGBM parameters for 3-class
            params = {
                'objective': 'multiclass',
                'num_class': 3,  # email, phone, sms
                'metric': 'multi_logloss',
                'num_leaves': 31,
                'learning_rate': 0.05,
                'feature_fraction': 0.8,
                'bagging_fraction': 0.8,
                'bagging_freq': 5,
                'verbose': -1,
                'random_state': 42
            }

            mlflow.log_params(params)

            # Create datasets
            train_data = lgb.Dataset(X_train_scaled, label=y_train_encoded)
            val_data = lgb.Dataset(X_val_scaled, label=y_val_encoded, reference=train_data)

            # Train model
            self.channel_model = lgb.train(
                params,
                train_data,
                valid_sets=[val_data],
                num_boost_round=500,
                callbacks=[lgb.early_stopping(20), lgb.log_evaluation(50)]
            )

            # Evaluate
            val_pred = np.argmax(self.channel_model.predict(X_val_scaled), axis=1)

            metrics = {
                'channel_accuracy': accuracy_score(y_val_encoded, val_pred),
            }

            # Per-channel metrics
            report = classification_report(
                y_val_encoded, val_pred,
                target_names=self.channels,
                output_dict=True
            )

            for channel in self.channels:
                metrics[f'channel_{channel}_precision'] = report[channel]['precision']
                metrics[f'channel_{channel}_recall'] = report[channel]['recall']

            mlflow.log_metrics(metrics)
            mlflow.lightgbm.log_model(self.channel_model, "channel_model")

            logger.info(f"Channel model training complete. Accuracy: {metrics['channel_accuracy']:.4f}")

            return metrics

    def train_all_models(
        self,
        X_train: pd.DataFrame,
        y_train: pd.DataFrame,
        X_val: pd.DataFrame,
        y_val: pd.DataFrame
    ) -> Dict:
        """
        Train all three models (day, hour, channel).

        Args:
            X_train: Training features
            y_train: Training labels with columns: day, hour, channel
            X_val: Validation features
            y_val: Validation labels

        Returns:
            Combined metrics from all models
        """
        all_metrics = {}

        # Train day model
        day_metrics = self.train_day_model(
            X_train, y_train['day'],
            X_val, y_val['day']
        )
        all_metrics.update(day_metrics)

        # Train hour model
        hour_metrics = self.train_hour_model(
            X_train, y_train['hour'],
            X_val, y_val['hour']
        )
        all_metrics.update(hour_metrics)

        # Train channel model
        channel_metrics = self.train_channel_model(
            X_train, y_train['channel'],
            X_val, y_val['channel']
        )
        all_metrics.update(channel_metrics)

        return all_metrics

    def predict_optimal_time(
        self,
        X: pd.DataFrame,
        client_timezone: str = 'America/Los_Angeles'
    ) -> List[Dict]:
        """
        Predict optimal contact time for each client.

        Args:
            X: Input features
            client_timezone: Client's timezone

        Returns:
            List of dictionaries with contact recommendations
        """
        if self.day_model is None or self.hour_model is None or self.channel_model is None:
            raise ValueError("Models not trained. Call train_all_models() first.")

        # Scale features
        X_scaled = self.scaler.transform(X)

        # Predict best day
        day_proba = self.day_model.predict(X_scaled)
        best_day = np.argmax(day_proba, axis=1)
        day_confidence = np.max(day_proba, axis=1)

        # Predict best hour
        hour_proba = self.hour_model.predict(X_scaled)
        best_hour = np.argmax(hour_proba, axis=1)
        hour_confidence = np.max(hour_proba, axis=1)

        # Predict best channel
        channel_proba = self.channel_model.predict(X_scaled)
        best_channel = np.argmax(channel_proba, axis=1)
        channel_confidence = np.max(channel_proba, axis=1)

        # Decode channel
        best_channel_names = self.channel_encoder.inverse_transform(best_channel)

        results = []
        for i in range(len(X)):
            next_contact = self._calculate_next_contact_time(
                best_day[i],
                best_hour[i],
                client_timezone
            )

            result = {
                'next_contact_datetime': next_contact.isoformat(),
                'day_of_week': self.days[best_day[i]],
                'hour_of_day': int(best_hour[i]),
                'time_period': self._get_time_period(best_hour[i]),
                'channel': best_channel_names[i],
                'overall_confidence': float((day_confidence[i] + hour_confidence[i] + channel_confidence[i]) / 3),
                'day_confidence': float(day_confidence[i]),
                'hour_confidence': float(hour_confidence[i]),
                'channel_confidence': float(channel_confidence[i]),
                'alternative_channels': self._get_alternative_channels(channel_proba[i])
            }

            results.append(result)

        return results

    def _calculate_next_contact_time(
        self,
        day_of_week: int,
        hour: int,
        timezone: str
    ) -> datetime:
        """
        Calculate next datetime for contact.

        Args:
            day_of_week: Day of week (0-6)
            hour: Hour of day (0-23)
            timezone: Timezone string

        Returns:
            Next contact datetime
        """
        from pytz import timezone as tz

        now = datetime.now(tz(timezone))

        # Calculate days until target day
        days_ahead = (day_of_week - now.weekday()) % 7

        # If target day is today but hour has passed, schedule for next week
        if days_ahead == 0 and now.hour >= hour:
            days_ahead = 7

        next_date = now + timedelta(days=days_ahead)
        next_datetime = next_date.replace(hour=hour, minute=0, second=0, microsecond=0)

        return next_datetime

    def _get_time_period(self, hour: int) -> str:
        """Get time period name for hour."""
        if 6 <= hour < 12:
            return 'morning'
        elif 12 <= hour < 18:
            return 'afternoon'
        elif 18 <= hour < 24:
            return 'evening'
        else:
            return 'night'

    def _get_alternative_channels(
        self,
        channel_proba: np.ndarray
    ) -> List[Dict]:
        """
        Get alternative channel recommendations.

        Args:
            channel_proba: Channel probabilities

        Returns:
            List of alternative channels with probabilities
        """
        alternatives = []
        for i, channel in enumerate(self.channels):
            alternatives.append({
                'channel': channel,
                'probability': float(channel_proba[i])
            })

        # Sort by probability
        alternatives.sort(key=lambda x: x['probability'], reverse=True)

        return alternatives[1:]  # Exclude primary channel

    def get_feature_importance(self, model_type: str = 'day') -> Dict[str, float]:
        """
        Get feature importance for specified model.

        Args:
            model_type: 'day', 'hour', or 'channel'

        Returns:
            Feature importance dictionary
        """
        model_map = {
            'day': self.day_model,
            'hour': self.hour_model,
            'channel': self.channel_model
        }

        model = model_map.get(model_type)
        if model is None:
            raise ValueError(f"Model type must be 'day', 'hour', or 'channel'")

        importance = model.feature_importance()
        feature_importance = dict(zip(self.feature_names, importance))

        # Sort by importance
        sorted_importance = dict(
            sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        )

        return sorted_importance

    def save_models(self, path: str):
        """
        Save all models to disk.

        Args:
            path: Directory path to save models
        """
        self.day_model.save_model(f"{path}/contact_timing_day.txt")
        self.hour_model.save_model(f"{path}/contact_timing_hour.txt")
        self.channel_model.save_model(f"{path}/contact_timing_channel.txt")

        joblib.dump(self.scaler, f"{path}/contact_timing_scaler.pkl")
        joblib.dump(self.channel_encoder, f"{path}/contact_timing_encoder.pkl")

        # Save metadata
        metadata = {
            'feature_names': self.feature_names,
            'days': self.days,
            'channels': self.channels,
            'model_version': self.model_version,
            'saved_at': datetime.now().isoformat()
        }

        import json
        with open(f"{path}/contact_timing_metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)

        logger.info(f"Models saved to {path}")

    def load_models(self, path: str):
        """
        Load all models from disk.

        Args:
            path: Directory path containing model files
        """
        self.day_model = lgb.Booster(model_file=f"{path}/contact_timing_day.txt")
        self.hour_model = lgb.Booster(model_file=f"{path}/contact_timing_hour.txt")
        self.channel_model = lgb.Booster(model_file=f"{path}/contact_timing_channel.txt")

        self.scaler = joblib.load(f"{path}/contact_timing_scaler.pkl")
        self.channel_encoder = joblib.load(f"{path}/contact_timing_encoder.pkl")

        # Load metadata
        import json
        with open(f"{path}/contact_timing_metadata.json", 'r') as f:
            metadata = json.load(f)

        self.feature_names = metadata['feature_names']
        self.days = metadata['days']
        self.channels = metadata['channels']
        self.model_version = metadata['model_version']

        logger.info(f"Models loaded from {path}")
