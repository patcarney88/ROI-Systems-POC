"""
SHAP Explainability Module
Provides model-agnostic explanations using SHAP (SHapley Additive exPlanations)
Supports TreeExplainer, DeepExplainer, and KernelExplainer
"""

import shap
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
import logging
import json
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SHAPExplainer:
    """
    SHAP-based model explainer with support for multiple model types
    """

    def __init__(self, model: Any, model_type: str = 'tree'):
        """
        Initialize SHAP explainer

        Args:
            model: Trained model (sklearn, xgboost, lightgbm, or tensorflow)
            model_type: One of 'tree', 'deep', 'linear', or 'kernel' (model-agnostic)
        """
        self.model = model
        self.model_type = model_type
        self.explainer: Optional[shap.Explainer] = None
        self.feature_names: List[str] = []
        self.background_data: Optional[np.ndarray] = None

        logger.info(f"Initialized SHAPExplainer with model_type: {model_type}")

    def initialize_explainer(
        self,
        X_background: np.ndarray,
        feature_names: List[str],
        max_samples: int = 100
    ) -> None:
        """
        Initialize SHAP explainer with background data

        Args:
            X_background: Background dataset for SHAP (training data sample)
            feature_names: List of feature names
            max_samples: Maximum background samples (for performance)
        """
        self.feature_names = feature_names

        # Sample background data if too large
        if len(X_background) > max_samples:
            indices = np.random.choice(
                len(X_background),
                max_samples,
                replace=False
            )
            self.background_data = X_background[indices]
        else:
            self.background_data = X_background

        try:
            if self.model_type == 'tree':
                # For tree-based models (XGBoost, RandomForest, LightGBM, GradientBoosting)
                logger.info("Initializing TreeExplainer...")
                self.explainer = shap.TreeExplainer(
                    self.model,
                    feature_names=self.feature_names
                )

            elif self.model_type == 'deep':
                # For neural networks
                logger.info("Initializing DeepExplainer...")
                self.explainer = shap.DeepExplainer(
                    self.model,
                    self.background_data
                )

            elif self.model_type == 'linear':
                # For linear models
                logger.info("Initializing LinearExplainer...")
                self.explainer = shap.LinearExplainer(
                    self.model,
                    self.background_data,
                    feature_names=self.feature_names
                )

            else:
                # Fallback to KernelExplainer (model-agnostic but slower)
                logger.info("Initializing KernelExplainer (model-agnostic)...")
                self.explainer = shap.KernelExplainer(
                    self.model.predict_proba if hasattr(self.model, 'predict_proba') else self.model.predict,
                    self.background_data,
                    feature_names=self.feature_names
                )

            logger.info("SHAP explainer initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize SHAP explainer: {str(e)}")
            raise

    def explain_prediction(
        self,
        X_instance: np.ndarray,
        feature_names: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate SHAP explanation for a single prediction

        Args:
            X_instance: Single instance to explain (shape: 1 x n_features)
            feature_names: Optional feature names (uses stored names if not provided)

        Returns:
            Dictionary with explanation details
        """
        if self.explainer is None:
            raise ValueError("Explainer not initialized. Call initialize_explainer() first.")

        if feature_names is None:
            feature_names = self.feature_names

        try:
            # Calculate SHAP values
            shap_values = self.explainer.shap_values(X_instance)

            # Handle multi-class output (take positive class for binary)
            if isinstance(shap_values, list):
                shap_values = shap_values[1]  # Positive class

            # Ensure 1D array
            if len(shap_values.shape) > 1:
                shap_values = shap_values[0]

            # Get base value (expected value)
            if hasattr(self.explainer, 'expected_value'):
                base_value = self.explainer.expected_value
                if isinstance(base_value, np.ndarray):
                    base_value = base_value[1] if len(base_value) > 1 else base_value[0]
            else:
                base_value = 0.5  # Default for binary classification

            # Get prediction
            if hasattr(self.model, 'predict_proba'):
                predicted_proba = self.model.predict_proba(X_instance)[0, 1]
            else:
                predicted_proba = self.model.predict(X_instance)[0]

            # Create explanation object
            explanation = {
                'base_value': float(base_value),
                'predicted_value': float(predicted_proba),
                'feature_contributions': {},
                'shap_values_sum': float(np.sum(shap_values))
            }

            # Get feature contributions
            for i, feature_name in enumerate(feature_names):
                explanation['feature_contributions'][feature_name] = {
                    'value': float(X_instance[0, i]),
                    'shap_value': float(shap_values[i]),
                    'impact': 'increases' if shap_values[i] > 0 else 'decreases',
                    'abs_impact': float(abs(shap_values[i]))
                }

            # Get top contributing features
            abs_shap_values = np.abs(shap_values)
            top_indices = np.argsort(abs_shap_values)[-5:][::-1]

            total_abs_shap = np.sum(abs_shap_values)

            explanation['top_features'] = [
                {
                    'feature': feature_names[idx],
                    'value': float(X_instance[0, idx]),
                    'shap_value': float(shap_values[idx]),
                    'impact': 'increases' if shap_values[idx] > 0 else 'decreases',
                    'impact_percent': float(abs(shap_values[idx]) / total_abs_shap * 100) if total_abs_shap > 0 else 0.0
                }
                for idx in top_indices
            ]

            logger.info(f"Generated explanation for prediction: {predicted_proba:.3f}")

            return explanation

        except Exception as e:
            logger.error(f"Failed to generate explanation: {str(e)}")
            raise

    def generate_force_plot(
        self,
        X_instance: np.ndarray,
        output_path: str,
        feature_names: Optional[List[str]] = None
    ) -> str:
        """
        Generate SHAP force plot visualization

        Args:
            X_instance: Single instance to explain
            output_path: Path to save the plot
            feature_names: Optional feature names

        Returns:
            Path to saved plot
        """
        if self.explainer is None:
            raise ValueError("Explainer not initialized")

        if feature_names is None:
            feature_names = self.feature_names

        try:
            shap_values = self.explainer.shap_values(X_instance)

            # Handle multi-class
            if isinstance(shap_values, list):
                shap_values = shap_values[1]

            if len(shap_values.shape) > 1:
                shap_values = shap_values[0]

            # Get base value
            base_value = self.explainer.expected_value
            if isinstance(base_value, np.ndarray):
                base_value = base_value[1] if len(base_value) > 1 else base_value[0]

            # Create force plot
            shap.force_plot(
                base_value,
                shap_values,
                X_instance[0],
                feature_names=feature_names,
                matplotlib=True,
                show=False
            )

            # Save plot
            plt.savefig(output_path, bbox_inches='tight', dpi=150)
            plt.close()

            logger.info(f"Force plot saved to {output_path}")

            return output_path

        except Exception as e:
            logger.error(f"Failed to generate force plot: {str(e)}")
            raise

    def generate_summary_plot(
        self,
        X_test: np.ndarray,
        output_path: str,
        feature_names: Optional[List[str]] = None,
        max_display: int = 20
    ) -> str:
        """
        Generate SHAP summary plot for dataset

        Args:
            X_test: Test dataset
            output_path: Path to save the plot
            feature_names: Optional feature names
            max_display: Maximum features to display

        Returns:
            Path to saved plot
        """
        if self.explainer is None:
            raise ValueError("Explainer not initialized")

        if feature_names is None:
            feature_names = self.feature_names

        try:
            shap_values = self.explainer.shap_values(X_test)

            # Handle multi-class
            if isinstance(shap_values, list):
                shap_values = shap_values[1]

            # Create summary plot
            shap.summary_plot(
                shap_values,
                X_test,
                feature_names=feature_names,
                max_display=max_display,
                show=False
            )

            # Save plot
            plt.savefig(output_path, bbox_inches='tight', dpi=150)
            plt.close()

            logger.info(f"Summary plot saved to {output_path}")

            return output_path

        except Exception as e:
            logger.error(f"Failed to generate summary plot: {str(e)}")
            raise

    def generate_waterfall_plot(
        self,
        X_instance: np.ndarray,
        output_path: str,
        feature_names: Optional[List[str]] = None,
        max_display: int = 10
    ) -> str:
        """
        Generate SHAP waterfall plot for single prediction

        Args:
            X_instance: Single instance to explain
            output_path: Path to save the plot
            feature_names: Optional feature names
            max_display: Maximum features to display

        Returns:
            Path to saved plot
        """
        if self.explainer is None:
            raise ValueError("Explainer not initialized")

        if feature_names is None:
            feature_names = self.feature_names

        try:
            shap_values = self.explainer.shap_values(X_instance)

            # Handle multi-class
            if isinstance(shap_values, list):
                shap_values = shap_values[1]

            # Create explanation object
            explanation = shap.Explanation(
                values=shap_values[0] if len(shap_values.shape) > 1 else shap_values,
                base_values=self.explainer.expected_value[1] if isinstance(self.explainer.expected_value, np.ndarray) else self.explainer.expected_value,
                data=X_instance[0],
                feature_names=feature_names
            )

            # Create waterfall plot
            shap.plots.waterfall(explanation, max_display=max_display, show=False)

            # Save plot
            plt.savefig(output_path, bbox_inches='tight', dpi=150)
            plt.close()

            logger.info(f"Waterfall plot saved to {output_path}")

            return output_path

        except Exception as e:
            logger.error(f"Failed to generate waterfall plot: {str(e)}")
            raise

    def get_global_feature_importance(
        self,
        X_test: np.ndarray,
        feature_names: Optional[List[str]] = None
    ) -> List[Tuple[str, float]]:
        """
        Calculate global feature importance using SHAP

        Args:
            X_test: Test dataset
            feature_names: Optional feature names

        Returns:
            List of (feature_name, importance) tuples sorted by importance
        """
        if self.explainer is None:
            raise ValueError("Explainer not initialized")

        if feature_names is None:
            feature_names = self.feature_names

        try:
            shap_values = self.explainer.shap_values(X_test)

            # Handle multi-class
            if isinstance(shap_values, list):
                shap_values = shap_values[1]

            # Calculate mean absolute SHAP values
            mean_abs_shap = np.mean(np.abs(shap_values), axis=0)

            # Create importance ranking
            importance = [
                (feature_names[i], float(mean_abs_shap[i]))
                for i in range(len(feature_names))
            ]

            # Sort by importance
            sorted_importance = sorted(
                importance,
                key=lambda x: x[1],
                reverse=True
            )

            logger.info(f"Calculated global feature importance for {len(X_test)} samples")

            return sorted_importance

        except Exception as e:
            logger.error(f"Failed to calculate feature importance: {str(e)}")
            raise

    def generate_dependence_plot(
        self,
        X_test: np.ndarray,
        feature_idx: int,
        output_path: str,
        interaction_idx: Optional[int] = None,
        feature_names: Optional[List[str]] = None
    ) -> str:
        """
        Generate SHAP dependence plot showing feature interaction

        Args:
            X_test: Test dataset
            feature_idx: Index of feature to plot
            output_path: Path to save the plot
            interaction_idx: Optional interaction feature index
            feature_names: Optional feature names

        Returns:
            Path to saved plot
        """
        if self.explainer is None:
            raise ValueError("Explainer not initialized")

        if feature_names is None:
            feature_names = self.feature_names

        try:
            shap_values = self.explainer.shap_values(X_test)

            # Handle multi-class
            if isinstance(shap_values, list):
                shap_values = shap_values[1]

            # Create dependence plot
            shap.dependence_plot(
                feature_idx,
                shap_values,
                X_test,
                feature_names=feature_names,
                interaction_index=interaction_idx,
                show=False
            )

            # Save plot
            plt.savefig(output_path, bbox_inches='tight', dpi=150)
            plt.close()

            logger.info(f"Dependence plot saved to {output_path}")

            return output_path

        except Exception as e:
            logger.error(f"Failed to generate dependence plot: {str(e)}")
            raise

    def save_explanations(
        self,
        explanations: List[Dict],
        output_path: str
    ) -> None:
        """
        Save explanations to JSON file

        Args:
            explanations: List of explanation dictionaries
            output_path: Path to save JSON file
        """
        try:
            with open(output_path, 'w') as f:
                json.dump(explanations, f, indent=2)

            logger.info(f"Saved {len(explanations)} explanations to {output_path}")

        except Exception as e:
            logger.error(f"Failed to save explanations: {str(e)}")
            raise


def batch_explain_predictions(
    explainer: SHAPExplainer,
    X_data: np.ndarray,
    feature_names: List[str],
    batch_size: int = 100
) -> List[Dict]:
    """
    Generate explanations for multiple predictions in batches

    Args:
        explainer: Initialized SHAPExplainer
        X_data: Data to explain
        feature_names: Feature names
        batch_size: Number of samples per batch

    Returns:
        List of explanation dictionaries
    """
    explanations = []

    n_samples = len(X_data)
    n_batches = (n_samples + batch_size - 1) // batch_size

    logger.info(f"Generating explanations for {n_samples} samples in {n_batches} batches")

    for i in range(n_batches):
        start_idx = i * batch_size
        end_idx = min((i + 1) * batch_size, n_samples)

        batch_data = X_data[start_idx:end_idx]

        for j in range(len(batch_data)):
            try:
                explanation = explainer.explain_prediction(
                    batch_data[j:j+1],
                    feature_names
                )
                explanation['sample_idx'] = start_idx + j
                explanations.append(explanation)

            except Exception as e:
                logger.error(f"Failed to explain sample {start_idx + j}: {str(e)}")
                continue

        logger.info(f"Completed batch {i+1}/{n_batches}")

    return explanations


if __name__ == "__main__":
    logger.info("SHAP Explainability Module initialized")
    logger.info("Use SHAPExplainer class to generate model explanations")
