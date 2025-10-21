"""
Model Registry with MLflow Integration
Manage ML model lifecycle, versioning, and deployment
"""

import mlflow
from mlflow.tracking import MlflowClient
from mlflow.models.signature import infer_signature
import joblib
import logging
from typing import Dict, Optional, Any, List
from datetime import datetime
import os

logger = logging.getLogger(__name__)


class ModelRegistry:
    """
    Manages ML model lifecycle with MLflow
    """

    def __init__(self, tracking_uri: str):
        """
        Initialize ModelRegistry

        Args:
            tracking_uri: MLflow tracking server URI
        """
        mlflow.set_tracking_uri(tracking_uri)
        self.client = MlflowClient()
        self.tracking_uri = tracking_uri

        logger.info(f"ModelRegistry initialized with tracking URI: {tracking_uri}")

    def register_model(
        self,
        model: Any,
        model_name: str,
        metrics: Dict[str, float],
        parameters: Dict[str, Any],
        tags: Optional[Dict[str, str]] = None,
        signature: Optional[Any] = None
    ) -> str:
        """
        Register a trained model in MLflow

        Args:
            model: Trained model object
            model_name: Name for the model
            metrics: Performance metrics
            parameters: Hyperparameters and config
            tags: Optional tags for the model
            signature: Model signature (input/output schema)

        Returns:
            Model version string
        """
        try:
            # Start MLflow run
            with mlflow.start_run() as run:
                # Log parameters
                for param_name, param_value in parameters.items():
                    mlflow.log_param(param_name, param_value)

                # Log metrics
                for metric_name, metric_value in metrics.items():
                    mlflow.log_metric(metric_name, metric_value)

                # Log tags
                if tags:
                    for tag_name, tag_value in tags.items():
                        mlflow.set_tag(tag_name, tag_value)

                # Log model
                mlflow.sklearn.log_model(
                    model,
                    "model",
                    registered_model_name=model_name,
                    signature=signature
                )

                # Get model version
                model_uri = f"runs:/{run.info.run_id}/model"
                model_details = mlflow.register_model(model_uri, model_name)
                version = model_details.version

                logger.info(f"Registered model {model_name} version {version}")

                return version

        except Exception as e:
            logger.error(f"Failed to register model: {str(e)}")
            raise

    def load_model(self, model_name: str, version: str = "latest") -> Any:
        """
        Load model from registry

        Args:
            model_name: Name of the model
            version: Version to load (default: "latest")

        Returns:
            Loaded model object
        """
        try:
            if version == "latest":
                # Get latest version
                latest_versions = self.client.get_latest_versions(model_name, stages=["Production"])
                if not latest_versions:
                    latest_versions = self.client.get_latest_versions(model_name, stages=["None"])

                if not latest_versions:
                    raise ValueError(f"No versions found for model {model_name}")

                version = latest_versions[0].version

            model_uri = f"models:/{model_name}/{version}"
            model = mlflow.sklearn.load_model(model_uri)

            logger.info(f"Loaded model {model_name} version {version}")

            return model

        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {str(e)}")
            raise

    def promote_model(
        self,
        model_name: str,
        version: str,
        stage: str = "Production"
    ) -> None:
        """
        Promote model to a specific stage (Staging, Production)

        Args:
            model_name: Name of the model
            version: Version to promote
            stage: Target stage (Staging, Production, Archived)
        """
        try:
            self.client.transition_model_version_stage(
                name=model_name,
                version=version,
                stage=stage
            )

            logger.info(f"Promoted model {model_name} version {version} to {stage}")

        except Exception as e:
            logger.error(f"Failed to promote model: {str(e)}")
            raise

    def archive_model(self, model_name: str, version: str) -> None:
        """
        Archive old model version

        Args:
            model_name: Name of the model
            version: Version to archive
        """
        try:
            self.client.transition_model_version_stage(
                name=model_name,
                version=version,
                stage="Archived"
            )

            logger.info(f"Archived model {model_name} version {version}")

        except Exception as e:
            logger.error(f"Failed to archive model: {str(e)}")
            raise

    def get_model_metadata(
        self,
        model_name: str,
        version: str = "latest"
    ) -> Dict[str, Any]:
        """
        Get model metadata and metrics

        Args:
            model_name: Name of the model
            version: Version (default: "latest")

        Returns:
            Dictionary with model metadata
        """
        try:
            if version == "latest":
                latest_versions = self.client.get_latest_versions(model_name, stages=["Production"])
                if not latest_versions:
                    latest_versions = self.client.get_latest_versions(model_name, stages=["None"])

                if not latest_versions:
                    raise ValueError(f"No versions found for model {model_name}")

                model_version = latest_versions[0]
            else:
                model_version = self.client.get_model_version(model_name, version)

            # Get run details
            run_id = model_version.run_id
            run = self.client.get_run(run_id)

            metadata = {
                'model_name': model_name,
                'version': model_version.version,
                'status': model_version.status,
                'stage': model_version.current_stage,
                'created_at': datetime.fromtimestamp(model_version.creation_timestamp / 1000),
                'description': model_version.description,
                'run_id': run_id,
                'metrics': run.data.metrics,
                'parameters': run.data.params,
                'tags': run.data.tags,
            }

            return metadata

        except Exception as e:
            logger.error(f"Failed to get model metadata: {str(e)}")
            raise

    def list_models(self) -> List[Dict[str, Any]]:
        """
        List all registered models

        Returns:
            List of model metadata dictionaries
        """
        try:
            models = []
            for rm in self.client.list_registered_models():
                model_info = {
                    'name': rm.name,
                    'creation_timestamp': rm.creation_timestamp,
                    'last_updated_timestamp': rm.last_updated_timestamp,
                    'description': rm.description,
                    'latest_versions': [
                        {
                            'version': mv.version,
                            'stage': mv.current_stage,
                            'status': mv.status
                        }
                        for mv in rm.latest_versions
                    ]
                }
                models.append(model_info)

            return models

        except Exception as e:
            logger.error(f"Failed to list models: {str(e)}")
            raise

    def delete_model_version(self, model_name: str, version: str) -> None:
        """
        Delete a specific model version

        Args:
            model_name: Name of the model
            version: Version to delete
        """
        try:
            self.client.delete_model_version(model_name, version)
            logger.info(f"Deleted model {model_name} version {version}")

        except Exception as e:
            logger.error(f"Failed to delete model version: {str(e)}")
            raise

    def update_model_description(
        self,
        model_name: str,
        version: str,
        description: str
    ) -> None:
        """
        Update model version description

        Args:
            model_name: Name of the model
            version: Version to update
            description: New description
        """
        try:
            self.client.update_model_version(
                name=model_name,
                version=version,
                description=description
            )

            logger.info(f"Updated description for model {model_name} version {version}")

        except Exception as e:
            logger.error(f"Failed to update model description: {str(e)}")
            raise

    def log_model_predictions(
        self,
        model_name: str,
        version: str,
        prediction_count: int,
        avg_latency_ms: float
    ) -> None:
        """
        Log production metrics for a model

        Args:
            model_name: Name of the model
            version: Model version
            prediction_count: Number of predictions made
            avg_latency_ms: Average prediction latency
        """
        try:
            # This would typically update a monitoring database
            # For now, log to MLflow as metrics
            with mlflow.start_run():
                mlflow.set_tag("model_name", model_name)
                mlflow.set_tag("model_version", version)
                mlflow.log_metric("production_prediction_count", prediction_count)
                mlflow.log_metric("production_avg_latency_ms", avg_latency_ms)

            logger.info(f"Logged production metrics for {model_name} v{version}")

        except Exception as e:
            logger.error(f"Failed to log model predictions: {str(e)}")
            raise

    def compare_models(
        self,
        model_name: str,
        version1: str,
        version2: str,
        metrics: List[str]
    ) -> Dict[str, Dict[str, float]]:
        """
        Compare metrics between two model versions

        Args:
            model_name: Name of the model
            version1: First version
            version2: Second version
            metrics: List of metric names to compare

        Returns:
            Dictionary with comparison results
        """
        try:
            # Get metadata for both versions
            metadata1 = self.get_model_metadata(model_name, version1)
            metadata2 = self.get_model_metadata(model_name, version2)

            comparison = {
                'version1': {
                    'version': version1,
                    'metrics': {m: metadata1['metrics'].get(m) for m in metrics}
                },
                'version2': {
                    'version': version2,
                    'metrics': {m: metadata2['metrics'].get(m) for m in metrics}
                },
                'differences': {}
            }

            # Calculate differences
            for metric in metrics:
                val1 = metadata1['metrics'].get(metric, 0)
                val2 = metadata2['metrics'].get(metric, 0)
                if val1 is not None and val2 is not None:
                    comparison['differences'][metric] = val2 - val1

            return comparison

        except Exception as e:
            logger.error(f"Failed to compare models: {str(e)}")
            raise
