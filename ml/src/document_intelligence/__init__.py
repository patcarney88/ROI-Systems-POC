"""
Document Intelligence Module

Provides AI-powered document analysis capabilities:
- Summarization (extractive and abstractive)
- Change detection (text and visual)
- Compliance checking
- Document relationship detection
"""

from .summarizer import DocumentSummarizer
from .change_detector import ChangeDetector
from .compliance_checker import ComplianceChecker

__all__ = [
    'DocumentSummarizer',
    'ChangeDetector',
    'ComplianceChecker'
]
