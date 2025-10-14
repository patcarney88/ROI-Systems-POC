"""
Document Intelligence API Router

FastAPI endpoints for document intelligence features:
- Summarization
- Change detection
- Compliance checking
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import logging
from datetime import datetime

from ..document_intelligence.summarizer import DocumentSummarizer
from ..document_intelligence.change_detector import ChangeDetector
from ..document_intelligence.compliance_checker import ComplianceChecker

logger = logging.getLogger(__name__)

# Initialize services
summarizer = DocumentSummarizer()
change_detector = ChangeDetector()
compliance_checker = ComplianceChecker()

# Create router
router = APIRouter(prefix="/v1/intelligence", tags=["Document Intelligence"])


# Request/Response Models

class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=100, description="Full document text")
    category: Optional[str] = Field(None, description="Document category for context")


class SummarizeResponse(BaseModel):
    executive_summary: str
    detailed_summary: str
    key_points: List[str]
    main_parties: List[str]
    key_dates: Dict[str, str]
    key_amounts: Dict[str, str]
    action_items: List[str]
    summary_method: str
    word_count: int
    original_word_count: int
    compression_ratio: float
    model_version: Optional[str]
    confidence: Optional[float]
    processing_time: Optional[int]


class ChangeDetectionRequest(BaseModel):
    old_text: str = Field(..., description="Original document text")
    new_text: str = Field(..., description="New document text")
    old_pdf_path: Optional[str] = Field(None, description="Path to original PDF")
    new_pdf_path: Optional[str] = Field(None, description="Path to new PDF")


class ChangeDetectionResponse(BaseModel):
    additions: List[str]
    deletions: List[str]
    modifications: List[Dict[str, Any]]
    change_percentage: float
    significance: str
    changes_summary: str
    text_diff: str
    visual_diff_url: Optional[str]
    critical_changes: List[Dict[str, Any]]


class ComplianceCheckRequest(BaseModel):
    category: str = Field(..., description="Document category")
    data: Dict[str, Any] = Field(..., description="Extracted document data")
    transaction_type: Optional[str] = Field(None, description="Transaction type for context")


class ComplianceCheckResponse(BaseModel):
    overall_status: str
    checks: List[Dict[str, Any]]
    critical_issues: int
    warnings: int
    suggestions: int
    missing_signatures: List[str]
    missing_fields: List[str]
    date_inconsistencies: List[str]
    format_issues: List[str]
    requires_review: bool


# Endpoints

@router.post(
    "/summarize",
    response_model=SummarizeResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate document summary",
    description="Generate comprehensive summary using extractive and abstractive methods"
)
async def summarize_document(request: SummarizeRequest) -> SummarizeResponse:
    """
    Generate intelligent document summary

    Returns:
    - Executive summary (2-3 sentences)
    - Detailed summary (1-2 paragraphs)
    - Key points (bullet points)
    - Extracted parties, dates, amounts
    - Action items
    """
    try:
        logger.info(f"Summarization request received for {len(request.text)} characters")

        result = summarizer.generate_summary(
            text=request.text,
            category=request.category
        )

        logger.info("Summarization completed successfully")

        return SummarizeResponse(**result)

    except Exception as e:
        logger.error(f"Summarization failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Summarization failed: {str(e)}"
        )


@router.post(
    "/changes",
    response_model=ChangeDetectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect document changes",
    description="Detect and analyze changes between document versions"
)
async def detect_changes(request: ChangeDetectionRequest) -> ChangeDetectionResponse:
    """
    Detect changes between document versions

    Analyzes:
    - Text additions
    - Text deletions
    - Text modifications
    - Change significance
    - Critical changes

    Optional:
    - Visual diff for PDFs
    """
    try:
        logger.info("Change detection request received")

        # Text diff
        text_result = change_detector.detect_text_changes(
            old_text=request.old_text,
            new_text=request.new_text
        )

        # Visual diff if PDFs provided
        visual_diff_url = None
        if request.old_pdf_path and request.new_pdf_path:
            visual_result = change_detector.detect_visual_changes(
                old_pdf_path=request.old_pdf_path,
                new_pdf_path=request.new_pdf_path,
                output_path=f"/tmp/diff_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            )
            if visual_result.get('success'):
                visual_diff_url = visual_result.get('visual_diff_url')

        logger.info(f"Change detection completed: {text_result['significance']} significance")

        return ChangeDetectionResponse(
            additions=text_result['additions'],
            deletions=text_result['deletions'],
            modifications=text_result['modifications'],
            change_percentage=text_result['change_percentage'],
            significance=text_result['significance'],
            changes_summary=text_result['changes_summary'],
            text_diff=text_result['text_diff'],
            visual_diff_url=visual_diff_url,
            critical_changes=text_result['critical_changes']
        )

    except Exception as e:
        logger.error(f"Change detection failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Change detection failed: {str(e)}"
        )


@router.post(
    "/compliance",
    response_model=ComplianceCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Check document compliance",
    description="Validate document compliance against configurable rules"
)
async def check_compliance(request: ComplianceCheckRequest) -> ComplianceCheckResponse:
    """
    Check document compliance

    Validates:
    - Required fields
    - Required signatures
    - Date consistency
    - Amount validation
    - Format compliance

    Returns detailed check results with severity levels
    """
    try:
        logger.info(f"Compliance check request for category: {request.category}")

        result = compliance_checker.check_compliance(
            category=request.category,
            extracted_data=request.data,
            transaction_type=request.transaction_type
        )

        logger.info(f"Compliance check completed: {result['overall_status']}")

        return ComplianceCheckResponse(**result)

    except Exception as e:
        logger.error(f"Compliance check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Compliance check failed: {str(e)}"
        )


@router.get(
    "/categories",
    response_model=List[str],
    status_code=status.HTTP_200_OK,
    summary="Get available document categories",
    description="List all supported document categories for compliance checking"
)
async def get_categories() -> List[str]:
    """
    Get list of supported document categories

    Returns list of category identifiers
    """
    categories = list(compliance_checker.rules.keys())
    return categories


@router.get(
    "/categories/{category}/rules",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Get compliance rules for category",
    description="Get detailed compliance rules for a specific document category"
)
async def get_category_rules(category: str) -> Dict[str, Any]:
    """
    Get compliance rules for specific category

    Args:
        category: Document category identifier

    Returns:
        Dictionary of rules for the category
    """
    rules = compliance_checker.rules.get(category.upper())

    if not rules:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{category}' not found"
        )

    return {
        "category": category,
        "rules": rules
    }


@router.post(
    "/analyze/full",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Run full document analysis",
    description="Run comprehensive analysis including summarization, compliance, and change detection"
)
async def analyze_full(
    background_tasks: BackgroundTasks,
    text: str = Field(..., min_length=100),
    category: str = Field(...),
    extracted_data: Dict[str, Any] = Field(...),
    previous_text: Optional[str] = None
) -> Dict[str, str]:
    """
    Run full document intelligence analysis

    This endpoint accepts a document and runs:
    - Summarization
    - Compliance checking
    - Change detection (if previous version provided)

    Returns job ID for status tracking
    """
    try:
        # For now, return immediate results
        # In production, use background tasks for long-running operations

        results = {}

        # Summarization
        summary = summarizer.generate_summary(text, category)
        results['summary'] = summary

        # Compliance
        compliance = compliance_checker.check_compliance(
            category=category,
            extracted_data=extracted_data
        )
        results['compliance'] = compliance

        # Change detection if previous version exists
        if previous_text:
            changes = change_detector.detect_text_changes(previous_text, text)
            results['changes'] = changes

        logger.info(f"Full analysis completed for category: {category}")

        return {
            "status": "completed",
            "results": results
        }

    except Exception as e:
        logger.error(f"Full analysis failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Full analysis failed: {str(e)}"
        )


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Health check",
    description="Check if document intelligence services are operational"
)
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint

    Verifies all document intelligence services are loaded and operational
    """
    health = {
        "status": "healthy",
        "services": {
            "summarizer": summarizer is not None,
            "change_detector": change_detector is not None,
            "compliance_checker": compliance_checker is not None
        },
        "timestamp": datetime.now().isoformat()
    }

    # Check if ML model is loaded
    if summarizer and not summarizer.summarizer:
        health["services"]["summarizer"] = False
        health["status"] = "degraded"
        health["warnings"] = ["Abstractive summarization model not loaded"]

    return health
