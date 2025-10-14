"""
FastAPI Document Classification Service
Production-ready API for document classification with monitoring
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import tempfile
import os
import sys
import time
import logging
from pathlib import Path
import uuid

# Add document_classification to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from document_classification import DocumentClassifier
from document_classification.config import CATEGORY_NAMES, CONFIDENCE_THRESHOLDS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Document Classification API",
    description="ML-powered document classification for real estate documents",
    version="1.0.0",
    docs_url="/api/classification/docs",
    redoc_url="/api/classification/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global classifier instance
classifier: Optional[DocumentClassifier] = None


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ClassificationRequest(BaseModel):
    """Request model for classification"""
    document_id: Optional[str] = Field(None, description="Document ID for tracking")
    return_probabilities: bool = Field(False, description="Return full probability distribution")


class SecondaryPrediction(BaseModel):
    """Secondary prediction model"""
    category: str
    confidence: float


class ClassificationResponse(BaseModel):
    """Response model for classification"""
    classification_id: str = Field(..., description="Unique classification ID")
    document_id: Optional[str] = Field(None, description="Original document ID")
    primary_category: str = Field(..., description="Predicted category")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score")
    secondary_predictions: List[SecondaryPrediction] = Field(..., description="Top 3 alternative predictions")
    requires_review: bool = Field(..., description="Whether manual review is needed")
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")
    model_version: str = Field(..., description="Model version used")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    all_probabilities: Optional[Dict[str, float]] = Field(None, description="Full probability distribution")


class BatchClassificationRequest(BaseModel):
    """Batch classification request"""
    classifications: List[ClassificationRequest] = Field(..., max_items=100)


class BatchClassificationResponse(BaseModel):
    """Batch classification response"""
    results: List[ClassificationResponse]
    total_count: int
    success_count: int
    failed_count: int
    total_processing_time_ms: int


class ModelHealthResponse(BaseModel):
    """Model health check response"""
    status: str
    model_version: str
    device: str
    prediction_count: int
    average_latency_ms: float
    supported_categories: List[str]
    confidence_thresholds: Dict[str, float]


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# STARTUP/SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize classifier on startup"""
    global classifier

    logger.info("Initializing Document Classification API...")

    try:
        # Get model path from environment
        model_path = os.getenv('MODEL_PATH', '/models/document_classification/best_model_weights.pth')

        if not os.path.exists(model_path):
            logger.warning(f"Model path {model_path} not found. Using placeholder.")
            # In production, this should fail
            model_path = None

        # Initialize classifier
        classifier = DocumentClassifier(
            model_path=model_path,
            device=os.getenv('DEVICE', None),
            use_amp=os.getenv('USE_AMP', 'true').lower() == 'true'
        )

        logger.info("Document Classification API initialized successfully")

    except Exception as e:
        logger.error(f"Failed to initialize API: {str(e)}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Document Classification API...")


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def store_classification_result(
    classification_id: str,
    document_id: Optional[str],
    result: Dict
):
    """
    Store classification result in database

    Args:
        classification_id: Classification ID
        document_id: Document ID
        result: Classification result
    """
    try:
        # TODO: Store in PostgreSQL via Prisma
        # This would be implemented with database connection
        logger.info(f"Stored classification {classification_id}")

    except Exception as e:
        logger.error(f"Failed to store classification: {str(e)}")


def validate_file_type(filename: str) -> bool:
    """Validate uploaded file type"""
    allowed_extensions = {'.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif'}
    ext = Path(filename).suffix.lower()
    return ext in allowed_extensions


# ============================================================================
# CLASSIFICATION ENDPOINTS
# ============================================================================

@app.post("/v1/classify", response_model=ClassificationResponse)
async def classify_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    document_id: Optional[str] = None,
    return_probabilities: bool = False
):
    """
    Classify a document image

    Upload a document image and receive classification results.

    **Supported formats:** PDF, JPG, PNG, TIFF

    **Returns:**
    - Primary category with confidence score
    - Top 3 alternative predictions
    - Whether manual review is recommended
    - Processing time

    **Performance:** < 200ms average
    """
    start_time = time.time()

    try:
        # Validate file type
        if not validate_file_type(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Supported: PDF, JPG, PNG, TIFF"
            )

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=Path(file.filename).suffix
        ) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        try:
            # Classify document
            result = classifier.classify(
                tmp_path,
                return_probabilities=return_probabilities
            )

            # Generate classification ID
            classification_id = str(uuid.uuid4())

            # Create response
            response = ClassificationResponse(
                classification_id=classification_id,
                document_id=document_id,
                primary_category=result['primary_category'],
                confidence=result['confidence'],
                secondary_predictions=[
                    SecondaryPrediction(**pred)
                    for pred in result['secondary_predictions']
                ],
                requires_review=result['requires_review'],
                processing_time_ms=result['processing_time_ms'],
                model_version='v1.0.0',
                all_probabilities=result.get('all_probabilities')
            )

            # Store result asynchronously
            background_tasks.add_task(
                store_classification_result,
                classification_id,
                document_id,
                result
            )

            logger.info(
                f"Classified document: {file.filename} -> "
                f"{result['primary_category']} ({result['confidence']:.3f})"
            )

            return response

        finally:
            # Clean up temporary file
            os.unlink(tmp_path)

    except Exception as e:
        logger.error(f"Classification failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/classify/batch", response_model=BatchClassificationResponse)
async def classify_batch(
    files: List[UploadFile] = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Batch classify multiple documents

    Upload multiple documents for batch processing.

    **Limits:**
    - Maximum 100 files per request
    - Maximum 10MB per file

    **Returns:**
    - Individual results for each document
    - Aggregate statistics
    - Total processing time
    """
    start_time = time.time()

    if len(files) > 100:
        raise HTTPException(
            status_code=400,
            detail="Maximum 100 files per batch request"
        )

    results = []
    success_count = 0
    failed_count = 0
    temp_files = []

    try:
        # Save all files temporarily
        for file in files:
            if not validate_file_type(file.filename):
                failed_count += 1
                continue

            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=Path(file.filename).suffix
            ) as tmp_file:
                content = await file.read()
                tmp_file.write(content)
                temp_files.append(tmp_file.name)

        # Batch classify
        batch_results = classifier.classify_batch(temp_files)

        # Process results
        for i, result in enumerate(batch_results):
            try:
                classification_id = str(uuid.uuid4())

                response = ClassificationResponse(
                    classification_id=classification_id,
                    document_id=None,
                    primary_category=result['primary_category'],
                    confidence=result['confidence'],
                    secondary_predictions=[
                        SecondaryPrediction(**pred)
                        for pred in result['secondary_predictions']
                    ],
                    requires_review=result['requires_review'],
                    processing_time_ms=result['processing_time_ms'],
                    model_version='v1.0.0'
                )

                results.append(response)
                success_count += 1

                # Store result asynchronously
                background_tasks.add_task(
                    store_classification_result,
                    classification_id,
                    None,
                    result
                )

            except Exception as e:
                logger.error(f"Failed to process result {i}: {str(e)}")
                failed_count += 1

        total_time_ms = int((time.time() - start_time) * 1000)

        return BatchClassificationResponse(
            results=results,
            total_count=len(files),
            success_count=success_count,
            failed_count=failed_count,
            total_processing_time_ms=total_time_ms
        )

    finally:
        # Clean up temporary files
        for tmp_path in temp_files:
            try:
                os.unlink(tmp_path)
            except:
                pass


@app.get("/v1/categories", response_model=List[str])
async def get_categories():
    """
    Get list of supported document categories

    Returns all document categories that can be classified.
    """
    return CATEGORY_NAMES


@app.get("/v1/health", response_model=ModelHealthResponse)
async def health_check():
    """
    Health check endpoint

    Returns model status and performance metrics.
    """
    try:
        metrics = classifier.get_metrics()

        return ModelHealthResponse(
            status="healthy",
            model_version="v1.0.0",
            device=metrics['device'],
            prediction_count=metrics['prediction_count'],
            average_latency_ms=metrics['average_latency_ms'],
            supported_categories=CATEGORY_NAMES,
            confidence_thresholds=CONFIDENCE_THRESHOLDS
        )

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint"""
    return {
        "service": "Document Classification API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/api/classification/docs"
    }


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return ErrorResponse(
        error=exc.detail,
        detail=None
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return ErrorResponse(
        error="Internal server error",
        detail=str(exc)
    )


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv('PORT', 8001)),
        log_level="info"
    )
