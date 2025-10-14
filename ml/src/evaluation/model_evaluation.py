"""
Model Evaluation Suite
======================

Comprehensive evaluation framework for all ML models.

Features:
- Performance metrics calculation
- Cross-validation
- Model comparison
- Visualization generation
- Report generation
- A/B testing support
"""

import os
import sys
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import json
from datetime import datetime

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, roc_curve, confusion_matrix,
    classification_report, mean_squared_error,
    mean_absolute_error, r2_score
)

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ModelEvaluator:
    """
    Comprehensive model evaluation framework.

    Supports:
    - Classification metrics
    - Regression metrics
    - Cross-validation
    - Confusion matrices
    - ROC curves
    - Feature importance analysis
    """

    def __init__(self, output_dir: str = './evaluation_results'):
        """
        Initialize evaluator.

        Args:
            output_dir: Directory to save evaluation results
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

        # Set plotting style
        sns.set_style('whitegrid')
        plt.rcParams['figure.figsize'] = (12, 8)

    def evaluate_classification_model(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_pred_proba: Optional[np.ndarray] = None,
        class_names: Optional[List[str]] = None,
        model_name: str = 'model'
    ) -> Dict:
        """
        Evaluate classification model.

        Args:
            y_true: True labels
            y_pred: Predicted labels
            y_pred_proba: Prediction probabilities
            class_names: Names of classes
            model_name: Name of model

        Returns:
            Dictionary of metrics
        """
        logger.info(f"Evaluating classification model: {model_name}")

        # Basic metrics
        metrics = {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision_macro': precision_score(y_true, y_pred, average='macro', zero_division=0),
            'recall_macro': recall_score(y_true, y_pred, average='macro', zero_division=0),
            'f1_macro': f1_score(y_true, y_pred, average='macro', zero_division=0),
        }

        # Binary classification specific metrics
        if len(np.unique(y_true)) == 2:
            metrics['precision'] = precision_score(y_true, y_pred, zero_division=0)
            metrics['recall'] = recall_score(y_true, y_pred, zero_division=0)
            metrics['f1'] = f1_score(y_true, y_pred, zero_division=0)

            if y_pred_proba is not None:
                metrics['roc_auc'] = roc_auc_score(y_true, y_pred_proba)

        # Confusion matrix
        cm = confusion_matrix(y_true, y_pred)
        self._plot_confusion_matrix(cm, class_names, model_name)

        # Classification report
        report = classification_report(
            y_true, y_pred,
            target_names=class_names,
            output_dict=True,
            zero_division=0
        )

        # ROC curve for binary classification
        if y_pred_proba is not None and len(np.unique(y_true)) == 2:
            self._plot_roc_curve(y_true, y_pred_proba, model_name)

        # Save detailed report
        self._save_classification_report(metrics, report, model_name)

        logger.info(f"{model_name} evaluation complete: Accuracy={metrics['accuracy']:.4f}")

        return metrics

    def evaluate_regression_model(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        model_name: str = 'model'
    ) -> Dict:
        """
        Evaluate regression model.

        Args:
            y_true: True values
            y_pred: Predicted values
            model_name: Name of model

        Returns:
            Dictionary of metrics
        """
        logger.info(f"Evaluating regression model: {model_name}")

        # Calculate metrics
        metrics = {
            'mse': mean_squared_error(y_true, y_pred),
            'rmse': np.sqrt(mean_squared_error(y_true, y_pred)),
            'mae': mean_absolute_error(y_true, y_pred),
            'r2': r2_score(y_true, y_pred),
            'mape': np.mean(np.abs((y_true - y_pred) / y_true)) * 100,
            'max_error': np.max(np.abs(y_true - y_pred)),
            'median_error': np.median(np.abs(y_true - y_pred))
        }

        # Residual analysis
        residuals = y_true - y_pred

        # Plot predictions vs actual
        self._plot_predictions_vs_actual(y_true, y_pred, model_name)

        # Plot residuals
        self._plot_residuals(residuals, y_pred, model_name)

        # Save detailed report
        self._save_regression_report(metrics, model_name)

        logger.info(f"{model_name} evaluation complete: R²={metrics['r2']:.4f}, MAPE={metrics['mape']:.2f}%")

        return metrics

    def compare_models(
        self,
        model_results: Dict[str, Dict],
        metric_name: str = 'accuracy'
    ) -> pd.DataFrame:
        """
        Compare multiple models.

        Args:
            model_results: Dictionary of model results
            metric_name: Primary metric for comparison

        Returns:
            Comparison dataframe
        """
        logger.info(f"Comparing {len(model_results)} models on {metric_name}")

        comparison_data = []

        for model_name, results in model_results.items():
            row = {'model': model_name}
            row.update(results)
            comparison_data.append(row)

        comparison_df = pd.DataFrame(comparison_data)

        # Sort by primary metric
        if metric_name in comparison_df.columns:
            comparison_df = comparison_df.sort_values(metric_name, ascending=False)

        # Save comparison
        comparison_path = os.path.join(self.output_dir, 'model_comparison.csv')
        comparison_df.to_csv(comparison_path, index=False)

        # Plot comparison
        self._plot_model_comparison(comparison_df, metric_name)

        logger.info(f"Model comparison saved to {comparison_path}")

        return comparison_df

    def _plot_confusion_matrix(
        self,
        cm: np.ndarray,
        class_names: Optional[List[str]],
        model_name: str
    ):
        """Plot confusion matrix."""
        plt.figure(figsize=(10, 8))

        # Normalize confusion matrix
        cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]

        sns.heatmap(
            cm_normalized,
            annot=True,
            fmt='.2f',
            cmap='Blues',
            xticklabels=class_names if class_names else range(len(cm)),
            yticklabels=class_names if class_names else range(len(cm))
        )

        plt.title(f'Confusion Matrix - {model_name}')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()

        save_path = os.path.join(self.output_dir, f'{model_name}_confusion_matrix.png')
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

        logger.info(f"Confusion matrix saved to {save_path}")

    def _plot_roc_curve(
        self,
        y_true: np.ndarray,
        y_pred_proba: np.ndarray,
        model_name: str
    ):
        """Plot ROC curve."""
        fpr, tpr, thresholds = roc_curve(y_true, y_pred_proba)
        auc = roc_auc_score(y_true, y_pred_proba)

        plt.figure(figsize=(10, 8))
        plt.plot(fpr, tpr, label=f'ROC Curve (AUC = {auc:.3f})', linewidth=2)
        plt.plot([0, 1], [0, 1], 'k--', label='Random Classifier')
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title(f'ROC Curve - {model_name}')
        plt.legend(loc='lower right')
        plt.grid(True, alpha=0.3)
        plt.tight_layout()

        save_path = os.path.join(self.output_dir, f'{model_name}_roc_curve.png')
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

        logger.info(f"ROC curve saved to {save_path}")

    def _plot_predictions_vs_actual(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        model_name: str
    ):
        """Plot predictions vs actual values."""
        plt.figure(figsize=(10, 8))

        plt.scatter(y_true, y_pred, alpha=0.5, s=20)
        plt.plot([y_true.min(), y_true.max()],
                [y_true.min(), y_true.max()],
                'r--', linewidth=2, label='Perfect Prediction')

        plt.xlabel('Actual Values')
        plt.ylabel('Predicted Values')
        plt.title(f'Predictions vs Actual - {model_name}')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()

        save_path = os.path.join(self.output_dir, f'{model_name}_predictions_vs_actual.png')
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

        logger.info(f"Predictions plot saved to {save_path}")

    def _plot_residuals(
        self,
        residuals: np.ndarray,
        y_pred: np.ndarray,
        model_name: str
    ):
        """Plot residual analysis."""
        fig, axes = plt.subplots(1, 2, figsize=(15, 6))

        # Residuals vs predictions
        axes[0].scatter(y_pred, residuals, alpha=0.5, s=20)
        axes[0].axhline(y=0, color='r', linestyle='--', linewidth=2)
        axes[0].set_xlabel('Predicted Values')
        axes[0].set_ylabel('Residuals')
        axes[0].set_title('Residuals vs Predictions')
        axes[0].grid(True, alpha=0.3)

        # Residuals distribution
        axes[1].hist(residuals, bins=50, edgecolor='black')
        axes[1].axvline(x=0, color='r', linestyle='--', linewidth=2)
        axes[1].set_xlabel('Residuals')
        axes[1].set_ylabel('Frequency')
        axes[1].set_title('Residuals Distribution')
        axes[1].grid(True, alpha=0.3)

        plt.suptitle(f'Residual Analysis - {model_name}')
        plt.tight_layout()

        save_path = os.path.join(self.output_dir, f'{model_name}_residuals.png')
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

        logger.info(f"Residuals plot saved to {save_path}")

    def _plot_model_comparison(
        self,
        comparison_df: pd.DataFrame,
        metric_name: str
    ):
        """Plot model comparison."""
        if metric_name not in comparison_df.columns:
            logger.warning(f"Metric {metric_name} not found in comparison data")
            return

        plt.figure(figsize=(12, 6))

        models = comparison_df['model']
        scores = comparison_df[metric_name]

        plt.bar(range(len(models)), scores, color='steelblue', edgecolor='black')
        plt.xticks(range(len(models)), models, rotation=45, ha='right')
        plt.ylabel(metric_name.replace('_', ' ').title())
        plt.title(f'Model Comparison - {metric_name.replace("_", " ").title()}')
        plt.grid(True, alpha=0.3, axis='y')
        plt.tight_layout()

        save_path = os.path.join(self.output_dir, 'model_comparison.png')
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

        logger.info(f"Comparison plot saved to {save_path}")

    def _save_classification_report(
        self,
        metrics: Dict,
        report: Dict,
        model_name: str
    ):
        """Save detailed classification report."""
        report_data = {
            'model': model_name,
            'timestamp': datetime.now().isoformat(),
            'metrics': metrics,
            'detailed_report': report
        }

        report_path = os.path.join(self.output_dir, f'{model_name}_classification_report.json')
        with open(report_path, 'w') as f:
            json.dump(report_data, f, indent=2, default=str)

        logger.info(f"Classification report saved to {report_path}")

    def _save_regression_report(
        self,
        metrics: Dict,
        model_name: str
    ):
        """Save detailed regression report."""
        report_data = {
            'model': model_name,
            'timestamp': datetime.now().isoformat(),
            'metrics': metrics
        }

        report_path = os.path.join(self.output_dir, f'{model_name}_regression_report.json')
        with open(report_path, 'w') as f:
            json.dump(report_data, f, indent=2, default=str)

        logger.info(f"Regression report saved to {report_path}")

    def generate_evaluation_summary(
        self,
        all_results: Dict[str, Dict]
    ) -> str:
        """
        Generate comprehensive evaluation summary.

        Args:
            all_results: Results for all models

        Returns:
            Path to summary report
        """
        logger.info("Generating comprehensive evaluation summary")

        summary = {
            'timestamp': datetime.now().isoformat(),
            'models_evaluated': len(all_results),
            'results': all_results
        }

        # Calculate summary statistics
        summary['summary_statistics'] = {}

        for model_name, results in all_results.items():
            summary['summary_statistics'][model_name] = {
                'primary_metric': self._get_primary_metric(results),
                'status': 'passed' if self._passes_thresholds(results, model_name) else 'failed'
            }

        # Save summary
        summary_path = os.path.join(self.output_dir, 'evaluation_summary.json')
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2, default=str)

        # Generate markdown report
        markdown_path = self._generate_markdown_report(summary)

        logger.info(f"Evaluation summary saved to {summary_path}")
        logger.info(f"Markdown report saved to {markdown_path}")

        return summary_path

    def _get_primary_metric(self, results: Dict) -> Tuple[str, float]:
        """Get primary metric from results."""
        if 'accuracy' in results:
            return ('accuracy', results['accuracy'])
        elif 'r2' in results:
            return ('r2', results['r2'])
        elif 'roc_auc' in results:
            return ('roc_auc', results['roc_auc'])
        else:
            return ('unknown', 0.0)

    def _passes_thresholds(self, results: Dict, model_name: str) -> bool:
        """Check if model passes quality thresholds."""
        thresholds = {
            'move_probability': {'accuracy': 0.85, 'roc_auc': 0.90},
            'transaction_type': {'accuracy': 0.80},
            'contact_timing': {'day_accuracy': 0.75, 'hour_accuracy': 0.75, 'channel_accuracy': 0.80},
            'property_value': {'r2': 0.85, 'mape': 5.0}
        }

        if model_name not in thresholds:
            return True

        model_thresholds = thresholds[model_name]

        for metric, threshold in model_thresholds.items():
            if metric in results:
                if metric == 'mape':
                    # Lower is better for MAPE
                    if results[metric] > threshold:
                        return False
                else:
                    # Higher is better for other metrics
                    if results[metric] < threshold:
                        return False

        return True

    def _generate_markdown_report(self, summary: Dict) -> str:
        """Generate markdown evaluation report."""
        markdown_path = os.path.join(self.output_dir, 'EVALUATION_REPORT.md')

        with open(markdown_path, 'w') as f:
            f.write("# Model Evaluation Report\n\n")
            f.write(f"**Generated:** {summary['timestamp']}\n\n")
            f.write(f"**Models Evaluated:** {summary['models_evaluated']}\n\n")

            f.write("## Summary\n\n")
            f.write("| Model | Status | Primary Metric |\n")
            f.write("|-------|--------|----------------|\n")

            for model_name, stats in summary['summary_statistics'].items():
                metric_name, metric_value = stats['primary_metric']
                status_icon = "✅" if stats['status'] == 'passed' else "❌"
                f.write(f"| {model_name} | {status_icon} {stats['status']} | {metric_name}: {metric_value:.4f} |\n")

            f.write("\n## Detailed Results\n\n")

            for model_name, results in summary['results'].items():
                f.write(f"### {model_name}\n\n")
                f.write("```json\n")
                f.write(json.dumps(results, indent=2, default=str))
                f.write("\n```\n\n")

        return markdown_path


def main():
    """Example usage of ModelEvaluator."""
    evaluator = ModelEvaluator()

    # Example: Evaluate a binary classification model
    # y_true = np.array([0, 1, 1, 0, 1, 0, 1, 1, 0, 0])
    # y_pred = np.array([0, 1, 1, 0, 0, 0, 1, 1, 1, 0])
    # y_pred_proba = np.array([0.1, 0.9, 0.8, 0.2, 0.4, 0.3, 0.7, 0.9, 0.6, 0.1])

    # metrics = evaluator.evaluate_classification_model(
    #     y_true, y_pred, y_pred_proba,
    #     class_names=['Not Move', 'Move'],
    #     model_name='move_probability'
    # )

    logger.info("Model evaluation suite ready")


if __name__ == "__main__":
    main()
