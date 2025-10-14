"""
Document OCR & Data Extraction Module
Hybrid OCR: Tesseract (basic) + AWS Textract (complex)
Features: NER, Key-Value extraction, Table parsing, Signature detection
"""

from .ocr_service import OCRService
from .ner_service import NERService
from .table_extractor import TableExtractor
from .signature_detector import SignatureDetector

__all__ = ['OCRService', 'NERService', 'TableExtractor', 'SignatureDetector']
