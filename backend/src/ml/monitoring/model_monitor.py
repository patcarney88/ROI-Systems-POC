"""
Comprehensive Model Monitoring System
Monitors model performance, data drift, prediction drift, and system health
Implements automated alerting and health scoring
"""

import numpy as np
import pandas as pd
from scipy import stats
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
import logging
import json
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelMonitor:
    """
    Comprehensive model monitoring with drift detection and alerting
    """

    def __init__(
        self,
        model_name: str,
        db_connection: Optional[Any] = None,
        alert_config: Optional[Dict] = None
    ):
        """
        Initialize model monitor

        Args:
            model_name: Name of the model to monitor
            db_connection: Database connection for metrics storage
            alert_config: Alert threshold configuration
        """
        self.model_name = model_name
        self.db = db_connection

        # Default alert thresholds
        self.alert_thresholds = alert_config or {
            'accuracy_drop': 0.05,  # 5% drop
            'drift_score': 0.3,
            'latency_spike': 2.0,  # 2x normal
            'error_rate': 0.05,  # 5% errors
            'prediction_drift_pvalue': 0.05
        }

        # Baseline metrics (loaded from historical data)
        self.baseline_metrics = {
            'accuracy': 0.75,
            'latency_ms': 50,
            'feature_distributions': {}
        }

        logger.info(f"Initialized ModelMonitor for {model_name}")

    def check_model_health(self) -> Dict[str, Any]:
        """
        Comprehensive model health check

        Returns:
            Health report with status and metrics
        """
        logger.info(f"Running health check for {self.model_name}")

        health_report = {
            'model_name': self.model_name,
            'timestamp': datetime.now().isoformat(),
            'checks': {}
        }

        try:
            # 1. Performance Degradation
            health_report['checks']['performance'] = self._check_performance_degradation()

            # 2. Data Drift
            health_report['checks']['data_drift'] = self._check_data_drift()

            # 3. Prediction Drift
            health_report['checks']['prediction_drift'] = self._check_prediction_drift()

            # 4. Latency
            health_report['checks']['latency'] = self._check_latency()

            # 5. Error Rate
            health_report['checks']['error_rate'] = self._check_error_rate()

            # 6. Data Quality
            health_report['checks']['data_quality'] = self._check_data_quality()

            # Overall health score
            health_report['overall_health'] = self._calculate_health_score(
                health_report['checks']
            )

            # Generate alerts if needed
            if health_report['overall_health'] < 70:
                alerts = self._trigger_alerts(health_report)
                health_report['alerts'] = alerts

            # Store health check results
            self._store_health_check(health_report)

            logger.info(f"Health check complete - Overall health: {health_report['overall_health']:.1f}%")

            return health_report

        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return {
                'model_name': self.model_name,
                'timestamp': datetime.now().isoformat(),
                'overall_health': 0,
                'error': str(e)
            }

    def _check_performance_degradation(self) -> Dict[str, Any]:
        """
        Check if model performance has degraded compared to baseline
        """
        try:
            # Get recent predictions with ground truth feedback
            recent_predictions = self._get_recent_predictions_with_feedback(days=7)

            if len(recent_predictions) < 30:
                return {
                    'status': 'insufficient_data',
                    'message': 'Not enough feedback data for performance evaluation',
                    'alert': False,
                    'sample_count': len(recent_predictions)
                }

            # Calculate recent accuracy
            recent_accuracy = (
                recent_predictions['correct'].sum() / len(recent_predictions)
            )

            # Get baseline accuracy
            baseline_accuracy = self.baseline_metrics['accuracy']

            # Calculate accuracy drop
            accuracy_drop = baseline_accuracy - recent_accuracy

            # Check threshold
            alert = accuracy_drop > self.alert_thresholds['accuracy_drop']

            # Calculate other metrics
            if 'predicted_proba' in recent_predictions.columns:
                recent_auc = self._calculate_auc(
                    recent_predictions['actual'],
                    recent_predictions['predicted_proba']
                )
            else:
                recent_auc = None

            precision = self._calculate_precision(
                recent_predictions['actual'],
                recent_predictions['predicted']
            )

            recall = self._calculate_recall(
                recent_predictions['actual'],
                recent_predictions['predicted']
            )

            return {
                'status': 'degraded' if alert else 'healthy',
                'recent_accuracy': float(recent_accuracy),
                'baseline_accuracy': float(baseline_accuracy),
                'accuracy_drop': float(accuracy_drop),
                'recent_precision': float(precision),
                'recent_recall': float(recall),
                'recent_auc': float(recent_auc) if recent_auc else None,
                'sample_count': len(recent_predictions),
                'alert': alert,
                'severity': 'high' if accuracy_drop > 0.1 else 'medium' if alert else 'low'
            }

        except Exception as e:
            logger.error(f"Performance check failed: {str(e)}")
            return {'status': 'error', 'error': str(e), 'alert': False}

    def _check_data_drift(self) -> Dict[str, Any]:
        """
        Detect data drift using statistical tests (KL divergence, KS test)
        """
        try:
            # Get recent feature distributions
            recent_features = self._get_recent_feature_distributions(days=7)

            # Get baseline distributions
            baseline_features = self._get_baseline_feature_distributions()

            if recent_features is None or baseline_features is None:
                return {
                    'status': 'insufficient_data',
                    'message': 'Missing feature distribution data',
                    'alert': False
                }

            drift_scores = {}
            drift_pvalues = {}
            drifted_features = []

            for feature_name in recent_features.columns:
                if feature_name not in baseline_features.columns:
                    continue

                # Calculate KL divergence
                kl_div = self._calculate_kl_divergence(
                    baseline_features[feature_name].values,
                    recent_features[feature_name].values
                )

                # Calculate KS statistic
                ks_stat, ks_pval = stats.ks_2samp(
                    baseline_features[feature_name].values,
                    recent_features[feature_name].values
                )

                drift_scores[feature_name] = float(kl_div)
                drift_pvalues[feature_name] = float(ks_pval)

                # Check if feature has drifted
                if kl_div > self.alert_thresholds['drift_score']:
                    drifted_features.append({
                        'feature': feature_name,
                        'kl_divergence': float(kl_div),
                        'ks_pvalue': float(ks_pval)
                    })

            # Overall drift assessment
            max_drift = max(drift_scores.values()) if drift_scores else 0
            alert = len(drifted_features) > 0

            return {
                'status': 'drifted' if alert else 'stable',
                'max_drift_score': float(max_drift),
                'drifted_features': drifted_features,
                'drift_scores': drift_scores,
                'drift_pvalues': drift_pvalues,
                'features_checked': len(drift_scores),
                'alert': alert,
                'severity': 'high' if len(drifted_features) > 3 else 'medium' if alert else 'low'
            }

        except Exception as e:
            logger.error(f"Data drift check failed: {str(e)}")
            return {'status': 'error', 'error': str(e), 'alert': False}

    def _check_prediction_drift(self) -> Dict[str, Any]:
        """
        Check if prediction distribution has changed significantly
        """
        try:
            recent_predictions = self._get_recent_predictions(days=7)
            baseline_predictions = self._get_baseline_predictions()

            if recent_predictions is None or baseline_predictions is None:
                return {
                    'status': 'insufficient_data',
                    'message': 'Missing prediction data',
                    'alert': False
                }

            # Compare prediction distributions using KS test
            ks_statistic, p_value = stats.ks_2samp(
                recent_predictions['predicted_value'].values,
                baseline_predictions['predicted_value'].values
            )

            # Statistical test: significant if p < 0.05
            alert = p_value < self.alert_thresholds['prediction_drift_pvalue']

            # Calculate distribution statistics
            recent_mean = recent_predictions['predicted_value'].mean()
            recent_std = recent_predictions['predicted_value'].std()
            baseline_mean = baseline_predictions['predicted_value'].mean()
            baseline_std = baseline_predictions['predicted_value'].std()

            return {
                'status': 'drifted' if alert else 'stable',
                'ks_statistic': float(ks_statistic),
                'p_value': float(p_value),
                'recent_mean': float(recent_mean),
                'recent_std': float(recent_std),
                'baseline_mean': float(baseline_mean),
                'baseline_std': float(baseline_std),
                'mean_shift': float(recent_mean - baseline_mean),
                'alert': alert,
                'severity': 'high' if p_value < 0.01 else 'medium' if alert else 'low'
            }

        except Exception as e:
            logger.error(f"Prediction drift check failed: {str(e)}")
            return {'status': 'error', 'error': str(e), 'alert': False}

    def _check_latency(self) -> Dict[str, Any]:
        """
        Monitor prediction latency for performance issues
        """
        try:
            recent_latencies = self._get_recent_latencies(days=1)

            if recent_latencies is None or len(recent_latencies) == 0:
                return {
                    'status': 'insufficient_data',
                    'message': 'No latency data available',
                    'alert': False
                }

            baseline_latency = self.baseline_metrics['latency_ms']

            avg_latency = recent_latencies.mean()
            p50_latency = recent_latencies.quantile(0.50)
            p95_latency = recent_latencies.quantile(0.95)
            p99_latency = recent_latencies.quantile(0.99)
            max_latency = recent_latencies.max()

            # Check for latency spike
            latency_spike = avg_latency / baseline_latency
            alert = latency_spike > self.alert_thresholds['latency_spike']

            return {
                'status': 'slow' if alert else 'normal',
                'avg_latency_ms': float(avg_latency),
                'p50_latency_ms': float(p50_latency),
                'p95_latency_ms': float(p95_latency),
                'p99_latency_ms': float(p99_latency),
                'max_latency_ms': float(max_latency),
                'baseline_latency_ms': float(baseline_latency),
                'latency_spike_ratio': float(latency_spike),
                'sample_count': len(recent_latencies),
                'alert': alert,
                'severity': 'high' if latency_spike > 3.0 else 'medium' if alert else 'low'
            }

        except Exception as e:
            logger.error(f"Latency check failed: {str(e)}")
            return {'status': 'error', 'error': str(e), 'alert': False}

    def _check_error_rate(self) -> Dict[str, Any]:
        """
        Monitor prediction errors and failures
        """
        try:
            recent_predictions = self._get_recent_predictions(days=1)

            if recent_predictions is None or len(recent_predictions) == 0:
                return {
                    'status': 'insufficient_data',
                    'message': 'No prediction data available',
                    'alert': False
                }

            total_predictions = len(recent_predictions)
            error_count = recent_predictions['error'].sum() if 'error' in recent_predictions.columns else 0
            error_rate = error_count / total_predictions

            alert = error_rate > self.alert_thresholds['error_rate']

            # Categorize errors if available
            error_types = {}
            if 'error_type' in recent_predictions.columns:
                error_types = recent_predictions[
                    recent_predictions['error'] == True
                ]['error_type'].value_counts().to_dict()

            return {
                'status': 'high_errors' if alert else 'normal',
                'error_rate': float(error_rate),
                'total_predictions': int(total_predictions),
                'error_count': int(error_count),
                'error_types': error_types,
                'alert': alert,
                'severity': 'high' if error_rate > 0.1 else 'medium' if alert else 'low'
            }

        except Exception as e:
            logger.error(f"Error rate check failed: {str(e)}")
            return {'status': 'error', 'error': str(e), 'alert': False}

    def _check_data_quality(self) -> Dict[str, Any]:
        """
        Check data quality issues (missing values, outliers, invalid ranges)
        """
        try:
            recent_data = self._get_recent_feature_distributions(days=1)

            if recent_data is None:
                return {
                    'status': 'insufficient_data',
                    'message': 'No recent data available',
                    'alert': False
                }

            quality_issues = []

            # Check for missing values
            missing_counts = recent_data.isnull().sum()
            if missing_counts.sum() > 0:
                for col, count in missing_counts.items():
                    if count > 0:
                        pct = (count / len(recent_data)) * 100
                        quality_issues.append({
                            'type': 'missing_values',
                            'feature': col,
                            'count': int(count),
                            'percentage': float(pct)
                        })

            # Check for outliers (using IQR method)
            for col in recent_data.select_dtypes(include=[np.number]).columns:
                Q1 = recent_data[col].quantile(0.25)
                Q3 = recent_data[col].quantile(0.75)
                IQR = Q3 - Q1
                outliers = ((recent_data[col] < (Q1 - 1.5 * IQR)) |
                           (recent_data[col] > (Q3 + 1.5 * IQR))).sum()

                if outliers > len(recent_data) * 0.05:  # More than 5% outliers
                    pct = (outliers / len(recent_data)) * 100
                    quality_issues.append({
                        'type': 'outliers',
                        'feature': col,
                        'count': int(outliers),
                        'percentage': float(pct)
                    })

            alert = len(quality_issues) > 0

            return {
                'status': 'issues_detected' if alert else 'healthy',
                'quality_issues': quality_issues,
                'issues_count': len(quality_issues),
                'rows_checked': len(recent_data),
                'alert': alert,
                'severity': 'high' if len(quality_issues) > 5 else 'medium' if alert else 'low'
            }

        except Exception as e:
            logger.error(f"Data quality check failed: {str(e)}")
            return {'status': 'error', 'error': str(e), 'alert': False}

    def _calculate_health_score(self, checks: Dict[str, Dict]) -> float:
        """
        Calculate overall health score (0-100)

        Args:
            checks: Dictionary of check results

        Returns:
            Health score percentage
        """
        weights = {
            'performance': 0.30,
            'data_drift': 0.25,
            'prediction_drift': 0.20,
            'latency': 0.10,
            'error_rate': 0.10,
            'data_quality': 0.05
        }

        scores = {}

        # Performance score
        if checks['performance']['status'] == 'healthy':
            scores['performance'] = 100
        elif checks['performance']['status'] == 'degraded':
            drop = checks['performance'].get('accuracy_drop', 0)
            scores['performance'] = max(0, 100 - (drop * 1000))  # Penalize accuracy drops
        else:
            scores['performance'] = 50  # Insufficient data

        # Data drift score
        if checks['data_drift']['status'] == 'stable':
            scores['data_drift'] = 100
        elif checks['data_drift']['status'] == 'drifted':
            max_drift = checks['data_drift'].get('max_drift_score', 0)
            scores['data_drift'] = max(0, 100 - (max_drift * 200))
        else:
            scores['data_drift'] = 50

        # Prediction drift score
        if checks['prediction_drift']['status'] == 'stable':
            scores['prediction_drift'] = 100
        elif checks['prediction_drift']['status'] == 'drifted':
            p_value = checks['prediction_drift'].get('p_value', 0.5)
            scores['prediction_drift'] = max(0, 100 - ((0.05 - p_value) * 1000))
        else:
            scores['prediction_drift'] = 50

        # Latency score
        if checks['latency']['status'] == 'normal':
            scores['latency'] = 100
        elif checks['latency']['status'] == 'slow':
            spike = checks['latency'].get('latency_spike_ratio', 1.0)
            scores['latency'] = max(0, 100 - ((spike - 1.0) * 50))
        else:
            scores['latency'] = 50

        # Error rate score
        if checks['error_rate']['status'] == 'normal':
            scores['error_rate'] = 100
        elif checks['error_rate']['status'] == 'high_errors':
            error_rate = checks['error_rate'].get('error_rate', 0)
            scores['error_rate'] = max(0, 100 - (error_rate * 1000))
        else:
            scores['error_rate'] = 50

        # Data quality score
        if checks['data_quality']['status'] == 'healthy':
            scores['data_quality'] = 100
        elif checks['data_quality']['status'] == 'issues_detected':
            issues = checks['data_quality'].get('issues_count', 0)
            scores['data_quality'] = max(0, 100 - (issues * 10))
        else:
            scores['data_quality'] = 50

        # Calculate weighted score
        overall_score = sum(scores[check] * weights[check] for check in weights.keys())

        return float(overall_score)

    def _trigger_alerts(self, health_report: Dict) -> List[Dict]:
        """
        Generate and send alerts for unhealthy conditions

        Args:
            health_report: Health check report

        Returns:
            List of triggered alerts
        """
        alerts = []

        for check_name, check_result in health_report['checks'].items():
            if check_result.get('alert'):
                severity = check_result.get('severity', 'medium')

                alert = {
                    'timestamp': datetime.now().isoformat(),
                    'model_name': self.model_name,
                    'check': check_name,
                    'severity': severity,
                    'status': check_result.get('status'),
                    'message': self._generate_alert_message(check_name, check_result),
                    'details': check_result
                }

                alerts.append(alert)

                # Send alert via configured channels
                self._send_alert(alert)

        return alerts

    def _generate_alert_message(self, check_name: str, check_result: Dict) -> str:
        """Generate human-readable alert message"""
        messages = {
            'performance': f"Model accuracy dropped by {check_result.get('accuracy_drop', 0)*100:.1f}%",
            'data_drift': f"Data drift detected in {len(check_result.get('drifted_features', []))} features",
            'prediction_drift': f"Prediction distribution changed significantly (p={check_result.get('p_value', 0):.4f})",
            'latency': f"Latency increased {check_result.get('latency_spike_ratio', 1):.1f}x above baseline",
            'error_rate': f"Error rate at {check_result.get('error_rate', 0)*100:.1f}%",
            'data_quality': f"{check_result.get('issues_count', 0)} data quality issues detected"
        }

        return messages.get(check_name, f"Issue detected in {check_name}")

    def _send_alert(self, alert: Dict) -> None:
        """
        Send alert through configured channels (email, Slack, PagerDuty, etc.)
        """
        logger.warning(f"ALERT: {alert['message']}")

        # TODO: Implement actual alert sending
        # - Email notifications
        # - Slack webhooks
        # - PagerDuty integration
        # - Custom webhooks

    # Data retrieval methods (implement based on your data storage)

    def _get_recent_predictions_with_feedback(self, days: int = 7) -> pd.DataFrame:
        """Get recent predictions with ground truth feedback"""
        # TODO: Implement based on your database schema
        # This is a mock implementation
        return pd.DataFrame({
            'predicted': np.random.randint(0, 2, 100),
            'actual': np.random.randint(0, 2, 100),
            'predicted_proba': np.random.random(100),
            'correct': np.random.randint(0, 2, 100).astype(bool)
        })

    def _get_recent_feature_distributions(self, days: int = 7) -> Optional[pd.DataFrame]:
        """Get recent feature distributions"""
        # TODO: Implement
        return None

    def _get_baseline_feature_distributions(self) -> Optional[pd.DataFrame]:
        """Get baseline feature distributions"""
        # TODO: Implement
        return None

    def _get_recent_predictions(self, days: int = 7) -> Optional[pd.DataFrame]:
        """Get recent predictions"""
        # TODO: Implement
        return pd.DataFrame({
            'predicted_value': np.random.random(100),
            'error': np.random.randint(0, 2, 100).astype(bool)
        })

    def _get_baseline_predictions(self) -> Optional[pd.DataFrame]:
        """Get baseline predictions"""
        # TODO: Implement
        return pd.DataFrame({
            'predicted_value': np.random.random(100)
        })

    def _get_recent_latencies(self, days: int = 1) -> Optional[pd.Series]:
        """Get recent prediction latencies"""
        # TODO: Implement
        return pd.Series(np.random.uniform(30, 70, 100))

    def _calculate_kl_divergence(
        self,
        baseline: np.ndarray,
        recent: np.ndarray,
        bins: int = 10
    ) -> float:
        """Calculate KL divergence between distributions"""
        # Create histograms
        hist_baseline, bin_edges = np.histogram(baseline, bins=bins, density=True)
        hist_recent, _ = np.histogram(recent, bins=bin_edges, density=True)

        # Add small epsilon to avoid log(0)
        epsilon = 1e-10
        hist_baseline = hist_baseline + epsilon
        hist_recent = hist_recent + epsilon

        # Normalize
        hist_baseline = hist_baseline / hist_baseline.sum()
        hist_recent = hist_recent / hist_recent.sum()

        # Calculate KL divergence
        kl_div = np.sum(hist_recent * np.log(hist_recent / hist_baseline))

        return float(kl_div)

    def _calculate_auc(self, y_true: np.ndarray, y_pred_proba: np.ndarray) -> float:
        """Calculate AUC-ROC score"""
        from sklearn.metrics import roc_auc_score
        return roc_auc_score(y_true, y_pred_proba)

    def _calculate_precision(self, y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Calculate precision"""
        from sklearn.metrics import precision_score
        return precision_score(y_true, y_pred, zero_division=0)

    def _calculate_recall(self, y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Calculate recall"""
        from sklearn.metrics import recall_score
        return recall_score(y_true, y_pred, zero_division=0)

    def _store_health_check(self, health_report: Dict) -> None:
        """Store health check results in database"""
        # TODO: Implement database storage
        logger.info("Health check results stored")


if __name__ == "__main__":
    logger.info("Model Monitor initialized")
    logger.info("Use ModelMonitor class to monitor model health")
