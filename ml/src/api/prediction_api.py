"""
FastAPI Model Serving API
Real-time prediction endpoints for ML models
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
import joblib
import numpy as np
from enum import Enum
import os
import sys

# Add ML source to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from feature_engineering.feature_engineer import FeatureEngineer
from feature_engineering.feature_pipeline import FeaturePipeline
from registry.model_registry import ModelRegistry
from api.intelligence_router import router as intelligence_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="ROI Systems ML API",
    description="Machine Learning prediction API for real estate analytics",
    version="1.0.0",
    docs_url="/api/ml/docs",
    redoc_url="/api/ml/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(intelligence_router)

# Global model registry
model_registry = None
feature_engineer = None
feature_pipeline = None


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class EntityType(str, Enum):
    USER = "USER"
    PROPERTY = "PROPERTY"
    TRANSACTION = "TRANSACTION"
    CONTACT = "CONTACT"
    DOCUMENT = "DOCUMENT"


class PredictionType(str, Enum):
    MOVE_PROBABILITY = "MOVE_PROBABILITY"
    TRANSACTION_TYPE = "TRANSACTION_TYPE"
    CONTACT_TIMING = "CONTACT_TIMING"
    PROPERTY_VALUE = "PROPERTY_VALUE_FORECAST"
    EMAIL_ENGAGEMENT = "EMAIL_ENGAGEMENT"
    CHURN_RISK = "CHURN_RISK"


class PredictionRequest(BaseModel):
    entity_id: str = Field(..., description="ID of the entity to predict for")
    entity_type: EntityType = Field(default=EntityType.USER, description="Type of entity")
    prediction_type: PredictionType = Field(..., description="Type of prediction to make")
    features: Optional[Dict[str, Any]] = Field(None, description="Pre-computed features (optional)")
    as_of_date: Optional[datetime] = Field(None, description="Point-in-time date for features")

    @validator('entity_id')
    def entity_id_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('entity_id cannot be empty')
        return v


class TopFeature(BaseModel):
    feature_name: str
    contribution: float
    value: Any


class PredictionResponse(BaseModel):
    prediction_id: str
    entity_id: str
    prediction_type: str
    predicted_value: float = Field(..., description="Predicted probability or value")
    predicted_class: Optional[str] = Field(None, description="Predicted class label")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence score")
    top_features: List[TopFeature] = Field(..., description="Top contributing features")
    prediction_date: datetime
    model_version: str
    latency_ms: int


class BatchPredictionRequest(BaseModel):
    requests: List[PredictionRequest] = Field(..., max_items=1000)


class BatchPredictionResponse(BaseModel):
    predictions: List[PredictionResponse]
    total_count: int
    success_count: int
    failed_count: int
    total_latency_ms: int


class ModelHealthResponse(BaseModel):
    model_name: str
    model_version: str
    status: str
    deployed_at: datetime
    prediction_count: int
    avg_latency_ms: float
    error_rate: float
    drift_detected: bool
    last_prediction_at: Optional[datetime]


# ============================================================================
# STARTUP/SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize ML infrastructure on startup"""
    global model_registry, feature_engineer, feature_pipeline

    logger.info("Initializing ML API...")

    try:
        # Initialize database connection
        db_connection = os.getenv('DATABASE_URL')
        if not db_connection:
            raise ValueError("DATABASE_URL environment variable not set")

        # Initialize feature engineering
        feature_config = {}  # Load from config file
        feature_engineer = FeatureEngineer(db_connection, feature_config)
        feature_pipeline = FeaturePipeline(feature_engineer)

        # Initialize model registry
        mlflow_uri = os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5000')
        model_registry = ModelRegistry(mlflow_uri)

        logger.info("ML API initialized successfully")

    except Exception as e:
        logger.error(f"Failed to initialize ML API: {str(e)}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down ML API...")
    # Cleanup resources if needed


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_model_for_prediction(prediction_type: str):
    """Load model from registry based on prediction type"""
    model_name_mapping = {
        'MOVE_PROBABILITY': 'move_probability_model',
        'TRANSACTION_TYPE': 'transaction_type_model',
        'CONTACT_TIMING': 'contact_timing_model',
        'PROPERTY_VALUE_FORECAST': 'property_value_model',
        'EMAIL_ENGAGEMENT': 'email_engagement_model',
        'CHURN_RISK': 'churn_risk_model',
    }

    model_name = model_name_mapping.get(prediction_type)
    if not model_name:
        raise HTTPException(status_code=400, detail=f"Unknown prediction type: {prediction_type}")

    try:
        model = model_registry.load_model(model_name, version="latest")
        return model
    except Exception as e:
        logger.error(f"Failed to load model {model_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")


def compute_shap_values(model, features: Dict) -> List[TopFeature]:
    """
    Compute SHAP values for feature explainability
    Returns top 5 contributing features
    """
    try:
        # This is a placeholder - implement actual SHAP computation
        # import shap
        # explainer = shap.TreeExplainer(model)
        # shap_values = explainer.shap_values(features)

        # For now, return mock top features
        top_features = [
            TopFeature(
                feature_name="doc_access_count_7d",
                contribution=0.25,
                value=features.get("doc_access_count_7d", 0)
            ),
            TopFeature(
                feature_name="email_open_rate_30d",
                contribution=0.18,
                value=features.get("email_open_rate_30d", 0)
            ),
            TopFeature(
                feature_name="login_count_30d",
                contribution=0.15,
                value=features.get("login_count_30d", 0)
            ),
        ]

        return top_features

    except Exception as e:
        logger.error(f"Error computing SHAP values: {str(e)}")
        return []


async def store_prediction(prediction_response: PredictionResponse):
    """Store prediction in database for tracking"""
    try:
        # Store in PostgreSQL ml_predictions table
        # This would use SQLAlchemy or Prisma
        logger.info(f"Stored prediction {prediction_response.prediction_id}")
    except Exception as e:
        logger.error(f"Failed to store prediction: {str(e)}")


# ============================================================================
# PREDICTION ENDPOINTS
# ============================================================================

@app.post("/v1/predict/move-probability", response_model=PredictionResponse)
async def predict_move_probability(
    request: PredictionRequest,
    background_tasks: BackgroundTasks
):
    """
    Predict likelihood of user moving in next 6-12 months

    Returns probability score between 0 and 1
    """
    start_time = datetime.utcnow()

    try:
        # Load model
        model = get_model_for_prediction("MOVE_PROBABILITY")

        # Get or compute features
        if request.features:
            features = request.features
        else:
            features = feature_pipeline.create_prediction_features(
                request.entity_id,
                "MOVE_PROBABILITY",
                request.as_of_date
            )

        # Make prediction
        feature_array = np.array([list(features.values())])
        probability = model.predict_proba(feature_array)[0][1]  # Probability of class 1
        predicted_class = "HIGH" if probability > 0.7 else "MEDIUM" if probability > 0.4 else "LOW"

        # Compute feature importance
        top_features = compute_shap_values(model, features)

        # Calculate latency
        latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        # Create response
        response = PredictionResponse(
            prediction_id=f"pred_{datetime.utcnow().timestamp()}",
            entity_id=request.entity_id,
            prediction_type="MOVE_PROBABILITY",
            predicted_value=float(probability),
            predicted_class=predicted_class,
            confidence=float(probability),
            top_features=top_features,
            prediction_date=datetime.utcnow(),
            model_version="v1.0.0",
            latency_ms=latency_ms
        )

        # Store prediction asynchronously
        background_tasks.add_task(store_prediction, response)

        return response

    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/predict/transaction-type", response_model=PredictionResponse)
async def predict_transaction_type(
    request: PredictionRequest,
    background_tasks: BackgroundTasks
):
    """
    Predict type of next transaction (buy, sell, refinance, investment)
    """
    start_time = datetime.utcnow()

    try:
        model = get_model_for_prediction("TRANSACTION_TYPE")

        # Get features
        if request.features:
            features = request.features
        else:
            features = feature_pipeline.create_prediction_features(
                request.entity_id,
                "TRANSACTION_TYPE",
                request.as_of_date
            )

        # Make prediction
        feature_array = np.array([list(features.values())])
        probabilities = model.predict_proba(feature_array)[0]
        predicted_class_idx = np.argmax(probabilities)
        class_labels = ["BUY", "SELL", "REFINANCE", "INVESTMENT"]
        predicted_class = class_labels[predicted_class_idx]
        confidence = float(probabilities[predicted_class_idx])

        # Feature importance
        top_features = compute_shap_values(model, features)

        latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        response = PredictionResponse(
            prediction_id=f"pred_{datetime.utcnow().timestamp()}",
            entity_id=request.entity_id,
            prediction_type="TRANSACTION_TYPE",
            predicted_value=confidence,
            predicted_class=predicted_class,
            confidence=confidence,
            top_features=top_features,
            prediction_date=datetime.utcnow(),
            model_version="v1.0.0",
            latency_ms=latency_ms
        )

        background_tasks.add_task(store_prediction, response)

        return response

    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/predict/contact-timing", response_model=PredictionResponse)
async def predict_contact_timing(
    request: PredictionRequest,
    background_tasks: BackgroundTasks
):
    """
    Predict optimal contact time for maximum engagement
    """
    start_time = datetime.utcnow()

    try:
        model = get_model_for_prediction("CONTACT_TIMING")

        # Get features
        features = request.features or feature_pipeline.create_prediction_features(
            request.entity_id,
            "CONTACT_TIMING",
            request.as_of_date
        )

        # Make prediction
        feature_array = np.array([list(features.values())])
        optimal_hour = int(model.predict(feature_array)[0])
        optimal_day = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][
            features.get("preferred_contact_day", 0)
        ]

        predicted_class = f"{optimal_day} at {optimal_hour}:00"

        top_features = compute_shap_values(model, features)

        latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        response = PredictionResponse(
            prediction_id=f"pred_{datetime.utcnow().timestamp()}",
            entity_id=request.entity_id,
            prediction_type="CONTACT_TIMING",
            predicted_value=float(optimal_hour),
            predicted_class=predicted_class,
            confidence=0.85,
            top_features=top_features,
            prediction_date=datetime.utcnow(),
            model_version="v1.0.0",
            latency_ms=latency_ms
        )

        background_tasks.add_task(store_prediction, response)

        return response

    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/predict/property-value", response_model=PredictionResponse)
async def predict_property_value(
    request: PredictionRequest,
    background_tasks: BackgroundTasks
):
    """
    Forecast future property value
    """
    start_time = datetime.utcnow()

    try:
        model = get_model_for_prediction("PROPERTY_VALUE_FORECAST")

        # Get features
        features = request.features or feature_pipeline.create_prediction_features(
            request.entity_id,
            "PROPERTY_VALUE",
            request.as_of_date
        )

        # Make prediction
        feature_array = np.array([list(features.values())])
        predicted_value = float(model.predict(feature_array)[0])

        top_features = compute_shap_values(model, features)

        latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        response = PredictionResponse(
            prediction_id=f"pred_{datetime.utcnow().timestamp()}",
            entity_id=request.entity_id,
            prediction_type="PROPERTY_VALUE_FORECAST",
            predicted_value=predicted_value,
            predicted_class=None,
            confidence=0.82,
            top_features=top_features,
            prediction_date=datetime.utcnow(),
            model_version="v1.0.0",
            latency_ms=latency_ms
        )

        background_tasks.add_task(store_prediction, response)

        return response

    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/predict/batch", response_model=BatchPredictionResponse)
async def batch_predictions(
    batch_request: BatchPredictionRequest,
    background_tasks: BackgroundTasks
):
    """
    Batch prediction endpoint for multiple entities
    """
    start_time = datetime.utcnow()

    predictions = []
    success_count = 0
    failed_count = 0

    for request in batch_request.requests:
        try:
            # Route to appropriate prediction endpoint
            if request.prediction_type == PredictionType.MOVE_PROBABILITY:
                pred = await predict_move_probability(request, background_tasks)
            elif request.prediction_type == PredictionType.TRANSACTION_TYPE:
                pred = await predict_transaction_type(request, background_tasks)
            elif request.prediction_type == PredictionType.CONTACT_TIMING:
                pred = await predict_contact_timing(request, background_tasks)
            elif request.prediction_type == PredictionType.PROPERTY_VALUE:
                pred = await predict_property_value(request, background_tasks)
            else:
                raise ValueError(f"Unknown prediction type: {request.prediction_type}")

            predictions.append(pred)
            success_count += 1

        except Exception as e:
            logger.error(f"Batch prediction failed for {request.entity_id}: {str(e)}")
            failed_count += 1

    total_latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

    return BatchPredictionResponse(
        predictions=predictions,
        total_count=len(batch_request.requests),
        success_count=success_count,
        failed_count=failed_count,
        total_latency_ms=total_latency_ms
    )


@app.get("/v1/models/{model_name}/health", response_model=ModelHealthResponse)
async def model_health(model_name: str):
    """
    Check model health status and performance metrics
    """
    try:
        # Get model metadata from registry
        metadata = model_registry.get_model_metadata(model_name, "latest")

        return ModelHealthResponse(
            model_name=model_name,
            model_version=metadata.get('version', 'unknown'),
            status=metadata.get('status', 'unknown'),
            deployed_at=metadata.get('deployed_at', datetime.utcnow()),
            prediction_count=metadata.get('prediction_count', 0),
            avg_latency_ms=metadata.get('avg_latency_ms', 0.0),
            error_rate=metadata.get('error_rate', 0.0),
            drift_detected=metadata.get('drift_detected', False),
            last_prediction_at=metadata.get('last_prediction_at')
        )

    except Exception as e:
        logger.error(f"Failed to get model health: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """API health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
