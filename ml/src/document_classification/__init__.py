"""
Document Classification Module
CNN-based document classification for real estate documents
"""

from .classifier import DocumentClassifier
from .trainer import DocumentClassifierTrainer
from .dataset import DocumentDataset
from .config import CATEGORY_NAMES, CATEGORY_MAPPING

__all__ = [
    'DocumentClassifier',
    'DocumentClassifierTrainer',
    'DocumentDataset',
    'CATEGORY_NAMES',
    'CATEGORY_MAPPING',
]
