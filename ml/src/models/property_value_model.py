"""
Property Value Forecasting Model
=================================

Forecasts future property values using LSTM neural networks.
Combines time-series forecasting with market indicators.

Forecast Horizons: 3, 6, 12 months

Target Metrics:
- R² Score: 0.85+
- MAPE: <5%
- RMSE: <$50,000
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import mlflow
import mlflow.keras
from typing import Dict, Tuple, List, Optional
import joblib
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PropertyValueModel:
    """
    LSTM-based property value forecasting model.

    Features:
    - Historical property values (12-month sequence)
    - Market indicators (median prices, inventory, days on market)
    - Economic indicators (mortgage rates, unemployment)
    - Seasonal features
    - Property static features

    Architecture:
    - Bidirectional LSTM layers
    - Attention mechanism
    - Dropout for regularization
    - Dense output layer
    """

    def __init__(self, sequence_length: int = 12):
        """
        Initialize the Property Value Model.

        Args:
            sequence_length: Number of historical months to use (default: 12)
        """
        self.model = None
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.target_scaler = MinMaxScaler(feature_range=(0, 1))
        self.sequence_length = sequence_length
        self.feature_names = []
        self.model_version = "1.0.0"

    def prepare_features(self, df: pd.DataFrame) -> List[str]:
        """
        Define features for the model.

        Args:
            df: Input dataframe

        Returns:
            List of feature names
        """
        features = [
            # Historical property values
            'property_value',

            # Market indicators (zip code level)
            'median_price_zip',
            'inventory_level_zip',
            'days_on_market_avg_zip',
            'sales_volume_zip',
            'price_per_sqft_zip',

            # Economic indicators
            'mortgage_rate_30y',
            'mortgage_rate_15y',
            'unemployment_rate_county',
            'gdp_growth_rate',

            # Seasonal indicators
            'month_sin',
            'month_cos',
            'quarter',
            'is_peak_season',

            # Property static features
            'square_footage',
            'bedrooms',
            'bathrooms',
            'property_age',
            'lot_size_sqft',
        ]

        self.feature_names = features
        return features

    def create_sequences(
        self,
        df: pd.DataFrame,
        target_col: str = 'property_value'
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Create time-series sequences for LSTM training.

        Args:
            df: Input dataframe with features
            target_col: Target column name

        Returns:
            Tuple of (X_sequences, y_targets)
        """
        features = self.prepare_features(df)

        # Scale features
        scaled_data = self.scaler.fit_transform(df[features])

        # Create sequences
        X, y = [], []
        for i in range(len(scaled_data) - self.sequence_length):
            # Sequence of features
            X.append(scaled_data[i:i+self.sequence_length])

            # Target is next value
            target_idx = features.index(target_col)
            y.append(scaled_data[i+self.sequence_length, target_idx])

        return np.array(X), np.array(y)

    def build_model(self, input_shape: Tuple) -> keras.Model:
        """
        Build LSTM model architecture.

        Args:
            input_shape: Shape of input (sequence_length, n_features)

        Returns:
            Compiled Keras model
        """
        model = keras.Sequential([
            # First Bidirectional LSTM layer
            layers.Bidirectional(
                layers.LSTM(128, return_sequences=True),
                input_shape=input_shape
            ),
            layers.Dropout(0.2),

            # Second Bidirectional LSTM layer
            layers.Bidirectional(
                layers.LSTM(64, return_sequences=True)
            ),
            layers.Dropout(0.2),

            # Attention layer
            layers.Attention(),

            # Third LSTM layer
            layers.LSTM(32, return_sequences=False),
            layers.Dropout(0.2),

            # Dense layers
            layers.Dense(32, activation='relu'),
            layers.Dropout(0.1),
            layers.Dense(16, activation='relu'),

            # Output layer
            layers.Dense(1)
        ])

        # Compile model
        optimizer = keras.optimizers.Adam(learning_rate=0.001)
        model.compile(
            optimizer=optimizer,
            loss='mse',
            metrics=['mae', 'mape']
        )

        return model

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
        epochs: int = 100,
        batch_size: int = 32,
        experiment_name: str = "property_value"
    ) -> Tuple[Dict, keras.callbacks.History]:
        """
        Train the LSTM model.

        Args:
            X_train: Training sequences
            y_train: Training targets
            X_val: Validation sequences
            y_val: Validation targets
            epochs: Number of training epochs
            batch_size: Batch size
            experiment_name: MLflow experiment name

        Returns:
            Tuple of (metrics, training_history)
        """
        mlflow.set_experiment(experiment_name)

        with mlflow.start_run(run_name=f"property_value_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):
            logger.info("Starting property value model training...")

            # Log parameters
            mlflow.log_param("sequence_length", self.sequence_length)
            mlflow.log_param("epochs", epochs)
            mlflow.log_param("batch_size", batch_size)
            mlflow.log_param("model_version", self.model_version)

            # Build model
            input_shape = (X_train.shape[1], X_train.shape[2])
            self.model = self.build_model(input_shape)

            # Log model architecture
            logger.info(f"Model architecture:\n{self.model.summary()}")

            # Define callbacks
            early_stopping = callbacks.EarlyStopping(
                monitor='val_loss',
                patience=15,
                restore_best_weights=True,
                verbose=1
            )

            reduce_lr = callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=7,
                min_lr=0.00001,
                verbose=1
            )

            model_checkpoint = callbacks.ModelCheckpoint(
                'best_model.h5',
                monitor='val_loss',
                save_best_only=True,
                verbose=1
            )

            # MLflow callback
            mlflow_callback = MLflowCallback()

            # Train model
            history = self.model.fit(
                X_train, y_train,
                validation_data=(X_val, y_val),
                epochs=epochs,
                batch_size=batch_size,
                callbacks=[early_stopping, reduce_lr, model_checkpoint, mlflow_callback],
                verbose=1
            )

            # Evaluate on validation set
            val_pred = self.model.predict(X_val, verbose=0)

            # Calculate metrics
            metrics = {
                'val_mse': mean_squared_error(y_val, val_pred),
                'val_mae': mean_absolute_error(y_val, val_pred),
                'val_rmse': np.sqrt(mean_squared_error(y_val, val_pred)),
                'val_r2': r2_score(y_val, val_pred),
                'val_mape': np.mean(np.abs((y_val - val_pred.flatten()) / y_val)) * 100
            }

            # Log metrics
            mlflow.log_metrics(metrics)

            # Log model
            mlflow.keras.log_model(self.model, "model")

            logger.info(f"Training complete. Validation R²: {metrics['val_r2']:.4f}, MAPE: {metrics['val_mape']:.2f}%")

            return metrics, history

    def predict(
        self,
        X: np.ndarray,
        inverse_transform: bool = True
    ) -> np.ndarray:
        """
        Make predictions on new data.

        Args:
            X: Input sequences
            inverse_transform: Whether to inverse scale predictions

        Returns:
            Predicted values
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")

        predictions = self.model.predict(X, verbose=0)

        if inverse_transform:
            # Inverse transform predictions
            # Note: Need to create dummy array with all features
            n_features = len(self.feature_names)
            dummy = np.zeros((len(predictions), n_features))
            dummy[:, 0] = predictions.flatten()
            predictions_unscaled = self.scaler.inverse_transform(dummy)[:, 0]
            return predictions_unscaled
        else:
            return predictions.flatten()

    def predict_future(
        self,
        X_last: np.ndarray,
        n_months: int = 6,
        return_confidence: bool = True
    ) -> Tuple[List[float], Optional[List[Tuple[float, float]]]]:
        """
        Forecast property value for next n months.

        Uses iterative prediction with Monte Carlo Dropout for uncertainty.

        Args:
            X_last: Last sequence of features
            n_months: Number of months to forecast
            return_confidence: Whether to return confidence intervals

        Returns:
            Tuple of (predictions, confidence_intervals)
        """
        if self.model is None:
            raise ValueError("Model not trained.")

        predictions = []
        confidence_intervals = []

        current_sequence = X_last.copy()

        for month in range(n_months):
            # Reshape for prediction
            seq_input = current_sequence.reshape(1, self.sequence_length, -1)

            # Point prediction
            pred = self.model.predict(seq_input, verbose=0)[0][0]
            predictions.append(pred)

            if return_confidence:
                # Monte Carlo Dropout for uncertainty estimation
                mc_predictions = []
                for _ in range(100):
                    mc_pred = self.model(seq_input, training=True).numpy()[0][0]
                    mc_predictions.append(mc_pred)

                # Calculate confidence intervals (95%)
                ci_lower = np.percentile(mc_predictions, 2.5)
                ci_upper = np.percentile(mc_predictions, 97.5)
                confidence_intervals.append((ci_lower, ci_upper))

            # Update sequence for next prediction
            # Shift sequence left and add new prediction
            current_sequence = np.roll(current_sequence, -1, axis=0)
            current_sequence[-1, 0] = pred  # Update property value feature

            # Note: In production, need to update other features too
            # (market indicators, economic data, etc.)

        # Inverse transform predictions
        if return_confidence:
            # Inverse transform predictions and confidence intervals
            n_features = len(self.feature_names)

            # Predictions
            dummy = np.zeros((len(predictions), n_features))
            dummy[:, 0] = predictions
            predictions_unscaled = self.scaler.inverse_transform(dummy)[:, 0].tolist()

            # Confidence intervals
            ci_unscaled = []
            for ci_lower, ci_upper in confidence_intervals:
                dummy_lower = np.zeros((1, n_features))
                dummy_lower[0, 0] = ci_lower
                lower_unscaled = self.scaler.inverse_transform(dummy_lower)[0, 0]

                dummy_upper = np.zeros((1, n_features))
                dummy_upper[0, 0] = ci_upper
                upper_unscaled = self.scaler.inverse_transform(dummy_upper)[0, 0]

                ci_unscaled.append((lower_unscaled, upper_unscaled))

            return predictions_unscaled, ci_unscaled
        else:
            # Just predictions
            dummy = np.zeros((len(predictions), n_features))
            dummy[:, 0] = predictions
            predictions_unscaled = self.scaler.inverse_transform(dummy)[:, 0].tolist()
            return predictions_unscaled, None

    def create_forecast_report(
        self,
        current_value: float,
        predictions: List[float],
        confidence_intervals: List[Tuple[float, float]],
        n_months: int = 6
    ) -> Dict:
        """
        Create detailed forecast report.

        Args:
            current_value: Current property value
            predictions: Forecasted values
            confidence_intervals: CI bounds
            n_months: Forecast horizon

        Returns:
            Forecast report dictionary
        """
        report = {
            'current_value': current_value,
            'forecast_horizon_months': n_months,
            'forecasts': [],
            'summary': {}
        }

        # Monthly forecasts
        for i, (pred, (ci_lower, ci_upper)) in enumerate(zip(predictions, confidence_intervals)):
            month_ahead = i + 1
            appreciation = ((pred - current_value) / current_value) * 100

            forecast = {
                'month_ahead': month_ahead,
                'predicted_value': round(pred, 2),
                'confidence_lower': round(ci_lower, 2),
                'confidence_upper': round(ci_upper, 2),
                'appreciation_pct': round(appreciation, 2),
                'appreciation_dollars': round(pred - current_value, 2)
            }
            report['forecasts'].append(forecast)

        # Summary statistics
        final_value = predictions[-1]
        final_appreciation = ((final_value - current_value) / current_value) * 100

        report['summary'] = {
            'final_predicted_value': round(final_value, 2),
            'total_appreciation_pct': round(final_appreciation, 2),
            'total_appreciation_dollars': round(final_value - current_value, 2),
            'avg_monthly_appreciation_pct': round(final_appreciation / n_months, 2),
            'forecast_trend': 'appreciating' if final_appreciation > 0 else 'depreciating',
            'volatility': round(np.std(predictions), 2)
        }

        return report

    def evaluate(
        self,
        X_test: np.ndarray,
        y_test: np.ndarray
    ) -> Dict:
        """
        Evaluate model on test set.

        Args:
            X_test: Test sequences
            y_test: Test targets

        Returns:
            Evaluation metrics
        """
        if self.model is None:
            raise ValueError("Model not trained.")

        # Make predictions
        y_pred = self.model.predict(X_test, verbose=0)

        # Calculate metrics
        metrics = {
            'test_mse': mean_squared_error(y_test, y_pred),
            'test_mae': mean_absolute_error(y_test, y_pred),
            'test_rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
            'test_r2': r2_score(y_test, y_pred),
            'test_mape': np.mean(np.abs((y_test - y_pred.flatten()) / y_test)) * 100
        }

        logger.info(f"Test set evaluation: R² = {metrics['test_r2']:.4f}, MAPE = {metrics['test_mape']:.2f}%")

        return metrics

    def save_model(self, path: str):
        """
        Save model and scalers to disk.

        Args:
            path: Directory path to save model
        """
        # Save Keras model
        model_path = f"{path}/property_value_model.h5"
        self.model.save(model_path)

        # Save scalers
        scaler_path = f"{path}/property_value_scaler.pkl"
        joblib.dump(self.scaler, scaler_path)

        # Save metadata
        metadata = {
            'feature_names': self.feature_names,
            'sequence_length': self.sequence_length,
            'model_version': self.model_version,
            'saved_at': datetime.now().isoformat()
        }

        import json
        metadata_path = f"{path}/property_value_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        logger.info(f"Model saved to {path}")

    def load_model(self, path: str):
        """
        Load model and scalers from disk.

        Args:
            path: Directory path containing model files
        """
        # Load Keras model
        model_path = f"{path}/property_value_model.h5"
        self.model = keras.models.load_model(model_path)

        # Load scaler
        scaler_path = f"{path}/property_value_scaler.pkl"
        self.scaler = joblib.load(scaler_path)

        # Load metadata
        import json
        metadata_path = f"{path}/property_value_metadata.json"
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)

        self.feature_names = metadata['feature_names']
        self.sequence_length = metadata['sequence_length']
        self.model_version = metadata['model_version']

        logger.info(f"Model loaded from {path}")


class MLflowCallback(callbacks.Callback):
    """Custom callback to log metrics to MLflow during training."""

    def on_epoch_end(self, epoch, logs=None):
        """Log metrics at end of each epoch."""
        if logs:
            mlflow.log_metrics({
                'train_loss': logs.get('loss'),
                'train_mae': logs.get('mae'),
                'train_mape': logs.get('mape'),
                'val_loss': logs.get('val_loss'),
                'val_mae': logs.get('val_mae'),
                'val_mape': logs.get('val_mape'),
            }, step=epoch)
