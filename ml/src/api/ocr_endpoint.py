"""
OCR API Endpoint
FastAPI endpoint for document OCR processing
Integrates all OCR services: OCR, NER, Tables, Signatures
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
import os
import logging
import tempfile
import shutil

from ..document_ocr.ocr_service import OCRService
from ..document_ocr.ner_service import NERService
from ..document_ocr.table_extractor import TableExtractor
from ..document_ocr.signature_detector import SignatureDetector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/ocr", tags=["OCR"])

# Initialize services
ocr_service = OCRService()
ner_service = NERService()
table_extractor = TableExtractor()
signature_detector = SignatureDetector()


@router.post("/process")
async def process_document(
    file: UploadFile = File(...),
    mode: str = Form('hybrid'),
    extract_entities: bool = Form(True),
    extract_tables: bool = Form(True),
    detect_signatures: bool = Form(True),
    confidence_threshold: float = Form(0.85),
    s3_bucket: Optional[str] = Form(None),
    s3_key: Optional[str] = Form(None)
):
    """
    Process document with full OCR pipeline

    Parameters:
    - file: Document file (PDF, image)
    - mode: OCR mode (tesseract, textract, hybrid)
    - extract_entities: Extract named entities
    - extract_tables: Extract tables
    - detect_signatures: Detect signatures
    - confidence_threshold: Minimum confidence for Tesseract
    - s3_bucket: S3 bucket for Textract (required for textract/hybrid)
    - s3_key: S3 key for file upload

    Returns:
    - OCR results with full text, entities, tables, and signatures
    """
    temp_path = None

    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name

        logger.info(f"Processing file: {file.filename} with mode: {mode}")

        # Step 1: Perform OCR
        if mode == 'tesseract':
            ocr_result = ocr_service.tesseract_ocr(temp_path)
        elif mode == 'textract':
            if not s3_bucket or not s3_key:
                raise HTTPException(
                    status_code=400,
                    detail="s3_bucket and s3_key required for Textract mode"
                )
            ocr_result = ocr_service.textract_ocr(temp_path, s3_bucket, s3_key)
        else:  # hybrid
            ocr_result = ocr_service.hybrid_ocr(
                temp_path,
                bucket=s3_bucket,
                key=s3_key,
                confidence_threshold=confidence_threshold
            )

        # Initialize response
        response_data = {
            'provider': ocr_result['provider'],
            'full_text': ocr_result['full_text'],
            'confidence': ocr_result['confidence'],
            'page_count': ocr_result.get('page_count', 1),
            'processing_time': ocr_result['processing_time'],
            'cost': ocr_result.get('cost', 0.0)
        }

        # Step 2: Extract entities if requested
        if extract_entities:
            entities = ner_service.extract_entities(
                ocr_result['full_text'],
                page_number=1
            )
            response_data['entities'] = entities
            logger.info(f"Extracted {len(entities)} entities")

        # Step 3: Extract tables if requested
        if extract_tables:
            if 'tables' in ocr_result:
                # Use tables from Textract
                response_data['tables'] = ocr_result['tables']
            else:
                # No built-in table extraction for Tesseract
                response_data['tables'] = []

            logger.info(f"Extracted {len(response_data['tables'])} tables")

        # Step 4: Detect signatures if requested
        if detect_signatures:
            signatures = signature_detector.detect_signatures(temp_path, page_number=1)
            response_data['signatures'] = signatures
            logger.info(f"Detected {len(signatures)} signatures")

        return JSONResponse(content=response_data)

    except Exception as e:
        logger.error(f"OCR processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Cleanup temporary file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


@router.post("/entities/extract")
async def extract_entities_endpoint(
    file: UploadFile = File(...),
):
    """
    Extract only entities from document

    Parameters:
    - file: Document file

    Returns:
    - List of extracted entities
    """
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name

        # Perform basic OCR
        ocr_result = ocr_service.tesseract_ocr(temp_path)

        # Extract entities
        entities = ner_service.extract_entities(ocr_result['full_text'])

        return JSONResponse(content={'entities': entities})

    except Exception as e:
        logger.error(f"Entity extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


@router.post("/signatures/detect")
async def detect_signatures_endpoint(
    file: UploadFile = File(...),
):
    """
    Detect only signatures in document

    Parameters:
    - file: Document file (image)

    Returns:
    - List of detected signatures
    """
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name

        # Detect signatures
        signatures = signature_detector.detect_signatures(temp_path)

        return JSONResponse(content={'signatures': signatures})

    except Exception as e:
        logger.error(f"Signature detection failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        'status': 'healthy',
        'services': {
            'ocr': 'operational',
            'ner': 'operational',
            'table_extraction': 'operational',
            'signature_detection': 'operational'
        }
    }
