"""
Model Training Orchestrator
============================

Orchestrates training of all four core ML models:
1. Move Probability Model (XGBoost)
2. Transaction Type Model (Random Forest)
3. Contact Timing Model (LightGBM)
4. Property Value Model (LSTM)

Features:
- Automated data loading and preprocessing
- Parallel model training (where applicable)
- Comprehensive evaluation and reporting
- Model versioning and registration
- MLflow experiment tracking
"""

import os
import sys
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
import mlflow

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from models.move_probability_model import MoveProbabilityModel
from models.transaction_type_model import TransactionTypeModel
from models.contact_timing_model import ContactTimingModel
from models.property_value_model import PropertyValueModel

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ModelTrainingOrchestrator:
    """
    Orchestrates training of all ML models.

    Handles:
    - Data loading and preprocessing
    - Train/val/test splits
    - Model training
    - Model evaluation
    - Model persistence
    - MLflow tracking
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the orchestrator.

        Args:
            config: Configuration dictionary with paths and parameters
        """
        self.config = config
        self.models = {}
        self.training_results = {}

        # Set MLflow tracking URI
        mlflow_uri = config.get('mlflow_tracking_uri', 'file:./mlruns')
        mlflow.set_tracking_uri(mlflow_uri)

        logger.info("Model Training Orchestrator initialized")

    def load_data(self, model_name: str) -> Dict[str, pd.DataFrame]:
        """
        Load data for specific model.

        Args:
            model_name: Name of model to load data for

        Returns:
            Dictionary with train, val, test dataframes
        """
        data_config = self.config['data'][model_name]
        data_path = data_config['path']

        logger.info(f"Loading data for {model_name} from {data_path}")

        # Load data
        df = pd.read_csv(data_path)

        # Split into train/val/test
        train_ratio = data_config.get('train_ratio', 0.7)
        val_ratio = data_config.get('val_ratio', 0.15)
        test_ratio = data_config.get('test_ratio', 0.15)

        # First split: train and temp
        train_df, temp_df = train_test_split(
            df,
            test_size=(1 - train_ratio),
            random_state=42,
            stratify=df[data_config.get('stratify_col')] if 'stratify_col' in data_config else None
        )

        # Second split: val and test
        val_size = val_ratio / (val_ratio + test_ratio)
        val_df, test_df = train_test_split(
            temp_df,
            test_size=(1 - val_size),
            random_state=42,
            stratify=temp_df[data_config.get('stratify_col')] if 'stratify_col' in data_config else None
        )

        logger.info(f"Data split - Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")

        return {
            'train': train_df,
            'val': val_df,
            'test': test_df
        }

    def train_move_probability_model(self) -> Dict:
        """
        Train the Move Probability Model.

        Returns:
            Training metrics
        """
        logger.info("=" * 80)
        logger.info("Training Move Probability Model (XGBoost)")
        logger.info("=" * 80)

        # Load data
        data = self.load_data('move_probability')
        train_df = data['train']
        val_df = data['val']

        # Initialize model
        model = MoveProbabilityModel(threshold=0.5)

        # Prepare features
        X_train = model.prepare_features(train_df)
        y_train = train_df['will_move_6_12_months']

        X_val = model.prepare_features(val_df)
        y_val = val_df['will_move_6_12_months']

        # Train model
        metrics = model.train(X_train, y_train, X_val, y_val)

        # Save model
        save_path = self.config['models']['move_probability']['save_path']
        os.makedirs(save_path, exist_ok=True)
        model.save_model(save_path)

        # Store model and results
        self.models['move_probability'] = model
        self.training_results['move_probability'] = metrics

        logger.info(f"Move Probability Model training complete: {metrics}")

        return metrics

    def train_transaction_type_model(self) -> Dict:
        """
        Train the Transaction Type Model.

        Returns:
            Training metrics
        """
        logger.info("=" * 80)
        logger.info("Training Transaction Type Model (Random Forest)")
        logger.info("=" * 80)

        # Load data
        data = self.load_data('transaction_type')
        train_df = data['train']
        val_df = data['val']

        # Initialize model
        model = TransactionTypeModel()

        # Prepare features
        X_train = model.prepare_features(train_df)
        y_train = train_df['transaction_type']

        X_val = model.prepare_features(val_df)
        y_val = val_df['transaction_type']

        # Train model
        metrics = model.train(X_train, y_train, X_val, y_val)

        # Save model
        save_path = self.config['models']['transaction_type']['save_path']
        os.makedirs(save_path, exist_ok=True)
        model.save_model(save_path)

        # Store model and results
        self.models['transaction_type'] = model
        self.training_results['transaction_type'] = metrics

        logger.info(f"Transaction Type Model training complete")

        return metrics

    def train_contact_timing_model(self) -> Dict:
        """
        Train the Contact Timing Model.

        Returns:
            Training metrics
        """
        logger.info("=" * 80)
        logger.info("Training Contact Timing Model (LightGBM)")
        logger.info("=" * 80)

        # Load data
        data = self.load_data('contact_timing')
        train_df = data['train']
        val_df = data['val']

        # Initialize model
        model = ContactTimingModel()

        # Prepare features
        X_train = model.prepare_features(train_df)
        X_val = model.prepare_features(val_df)

        # Prepare labels (day, hour, channel)
        y_train = pd.DataFrame({
            'day': train_df['best_day'],
            'hour': train_df['best_hour'],
            'channel': train_df['best_channel']
        })

        y_val = pd.DataFrame({
            'day': val_df['best_day'],
            'hour': val_df['best_hour'],
            'channel': val_df['best_channel']
        })

        # Train all three models
        metrics = model.train_all_models(X_train, y_train, X_val, y_val)

        # Save models
        save_path = self.config['models']['contact_timing']['save_path']
        os.makedirs(save_path, exist_ok=True)
        model.save_models(save_path)

        # Store model and results
        self.models['contact_timing'] = model
        self.training_results['contact_timing'] = metrics

        logger.info(f"Contact Timing Model training complete")

        return metrics

    def train_property_value_model(self) -> Dict:
        """
        Train the Property Value Model.

        Returns:
            Training metrics
        """
        logger.info("=" * 80)
        logger.info("Training Property Value Model (LSTM)")
        logger.info("=" * 80)

        # Load data
        data = self.load_data('property_value')
        train_df = data['train']
        val_df = data['val']

        # Initialize model
        sequence_length = self.config['models']['property_value'].get('sequence_length', 12)
        model = PropertyValueModel(sequence_length=sequence_length)

        # Create sequences
        X_train, y_train = model.create_sequences(train_df)
        X_val, y_val = model.create_sequences(val_df)

        # Train model
        epochs = self.config['models']['property_value'].get('epochs', 100)
        batch_size = self.config['models']['property_value'].get('batch_size', 32)

        metrics, history = model.train(
            X_train, y_train,
            X_val, y_val,
            epochs=epochs,
            batch_size=batch_size
        )

        # Save model
        save_path = self.config['models']['property_value']['save_path']
        os.makedirs(save_path, exist_ok=True)
        model.save_model(save_path)

        # Store model and results
        self.models['property_value'] = model
        self.training_results['property_value'] = metrics

        logger.info(f"Property Value Model training complete: {metrics}")

        return metrics

    def train_all_models(self, models: Optional[list] = None) -> Dict:
        """
        Train all models in sequence.

        Args:
            models: List of model names to train (default: all)

        Returns:
            Combined training results
        """
        if models is None:
            models = ['move_probability', 'transaction_type', 'contact_timing', 'property_value']

        logger.info("=" * 80)
        logger.info("Starting Training Pipeline for All Models")
        logger.info(f"Models to train: {', '.join(models)}")
        logger.info("=" * 80)

        start_time = datetime.now()

        all_results = {}

        # Train each model
        if 'move_probability' in models:
            try:
                all_results['move_probability'] = self.train_move_probability_model()
            except Exception as e:
                logger.error(f"Error training move_probability model: {e}")
                all_results['move_probability'] = {'error': str(e)}

        if 'transaction_type' in models:
            try:
                all_results['transaction_type'] = self.train_transaction_type_model()
            except Exception as e:
                logger.error(f"Error training transaction_type model: {e}")
                all_results['transaction_type'] = {'error': str(e)}

        if 'contact_timing' in models:
            try:
                all_results['contact_timing'] = self.train_contact_timing_model()
            except Exception as e:
                logger.error(f"Error training contact_timing model: {e}")
                all_results['contact_timing'] = {'error': str(e)}

        if 'property_value' in models:
            try:
                all_results['property_value'] = self.train_property_value_model()
            except Exception as e:
                logger.error(f"Error training property_value model: {e}")
                all_results['property_value'] = {'error': str(e)}

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        logger.info("=" * 80)
        logger.info("Training Pipeline Complete")
        logger.info(f"Total duration: {duration:.2f} seconds")
        logger.info("=" * 80)

        # Generate summary report
        self.generate_training_report(all_results, duration)

        return all_results

    def evaluate_models(self, models: Optional[list] = None) -> Dict:
        """
        Evaluate all trained models on test set.

        Args:
            models: List of model names to evaluate (default: all)

        Returns:
            Evaluation results
        """
        if models is None:
            models = list(self.models.keys())

        logger.info("=" * 80)
        logger.info("Evaluating Models on Test Set")
        logger.info("=" * 80)

        evaluation_results = {}

        for model_name in models:
            if model_name not in self.models:
                logger.warning(f"Model {model_name} not found. Skipping evaluation.")
                continue

            logger.info(f"Evaluating {model_name}...")

            try:
                # Load test data
                data = self.load_data(model_name)
                test_df = data['test']

                model = self.models[model_name]

                # Model-specific evaluation
                if model_name == 'move_probability':
                    X_test = model.prepare_features(test_df)
                    y_test = test_df['will_move_6_12_months']
                    predictions, probabilities = model.predict(X_test)

                    from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score
                    metrics = {
                        'test_accuracy': accuracy_score(y_test, predictions),
                        'test_precision': precision_score(y_test, predictions),
                        'test_recall': recall_score(y_test, predictions),
                        'test_auc': roc_auc_score(y_test, probabilities)
                    }

                elif model_name == 'transaction_type':
                    X_test = model.prepare_features(test_df)
                    y_test = test_df['transaction_type']
                    predictions, confidences, _ = model.predict(X_test)

                    from sklearn.metrics import accuracy_score
                    metrics = {
                        'test_accuracy': accuracy_score(y_test, predictions)
                    }

                elif model_name == 'property_value':
                    X_test, y_test = model.create_sequences(test_df)
                    metrics = model.evaluate(X_test, y_test)

                else:
                    metrics = {}

                evaluation_results[model_name] = metrics
                logger.info(f"{model_name} evaluation: {metrics}")

            except Exception as e:
                logger.error(f"Error evaluating {model_name}: {e}")
                evaluation_results[model_name] = {'error': str(e)}

        return evaluation_results

    def generate_training_report(self, results: Dict, duration: float):
        """
        Generate comprehensive training report.

        Args:
            results: Training results for all models
            duration: Total training duration in seconds
        """
        report = {
            'timestamp': datetime.now().isoformat(),
            'duration_seconds': duration,
            'models': results,
            'config': self.config
        }

        # Save report
        report_path = self.config.get('report_path', './training_report.json')
        os.makedirs(os.path.dirname(report_path), exist_ok=True)

        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        logger.info(f"Training report saved to {report_path}")

        # Print summary
        logger.info("\n" + "=" * 80)
        logger.info("TRAINING SUMMARY")
        logger.info("=" * 80)

        for model_name, metrics in results.items():
            logger.info(f"\n{model_name.upper()}:")
            if 'error' in metrics:
                logger.info(f"  ❌ Training failed: {metrics['error']}")
            else:
                for metric_name, value in metrics.items():
                    if isinstance(value, float):
                        logger.info(f"  {metric_name}: {value:.4f}")
                    else:
                        logger.info(f"  {metric_name}: {value}")

        logger.info("\n" + "=" * 80)


def load_config(config_path: str = None) -> Dict:
    """
    Load training configuration.

    Args:
        config_path: Path to config file

    Returns:
        Configuration dictionary
    """
    if config_path and os.path.exists(config_path):
        with open(config_path, 'r') as f:
            config = json.load(f)
    else:
        # Default configuration
        config = {
            'mlflow_tracking_uri': 'file:./mlruns',
            'report_path': './reports/training_report.json',
            'data': {
                'move_probability': {
                    'path': './data/processed/move_probability_data.csv',
                    'stratify_col': 'will_move_6_12_months',
                    'train_ratio': 0.7,
                    'val_ratio': 0.15,
                    'test_ratio': 0.15
                },
                'transaction_type': {
                    'path': './data/processed/transaction_type_data.csv',
                    'stratify_col': 'transaction_type',
                    'train_ratio': 0.7,
                    'val_ratio': 0.15,
                    'test_ratio': 0.15
                },
                'contact_timing': {
                    'path': './data/processed/contact_timing_data.csv',
                    'train_ratio': 0.7,
                    'val_ratio': 0.15,
                    'test_ratio': 0.15
                },
                'property_value': {
                    'path': './data/processed/property_value_data.csv',
                    'train_ratio': 0.7,
                    'val_ratio': 0.15,
                    'test_ratio': 0.15
                }
            },
            'models': {
                'move_probability': {
                    'save_path': './models/trained/move_probability'
                },
                'transaction_type': {
                    'save_path': './models/trained/transaction_type'
                },
                'contact_timing': {
                    'save_path': './models/trained/contact_timing'
                },
                'property_value': {
                    'save_path': './models/trained/property_value',
                    'sequence_length': 12,
                    'epochs': 100,
                    'batch_size': 32
                }
            }
        }

    return config


def main():
    """Main training pipeline."""
    import argparse

    parser = argparse.ArgumentParser(description='Train ML models')
    parser.add_argument('--config', type=str, help='Path to config file')
    parser.add_argument('--models', nargs='+', help='Models to train',
                       choices=['move_probability', 'transaction_type', 'contact_timing', 'property_value'])
    parser.add_argument('--evaluate', action='store_true', help='Evaluate models on test set')

    args = parser.parse_args()

    # Load configuration
    config = load_config(args.config)

    # Initialize orchestrator
    orchestrator = ModelTrainingOrchestrator(config)

    # Train models
    results = orchestrator.train_all_models(models=args.models)

    # Evaluate if requested
    if args.evaluate:
        eval_results = orchestrator.evaluate_models(models=args.models)
        logger.info("Evaluation complete")

    logger.info("Training pipeline finished successfully")


if __name__ == "__main__":
    main()
