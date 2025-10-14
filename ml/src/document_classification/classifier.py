"""
Document Classifier
CNN-based document classification using transfer learning
"""

import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms
from PIL import Image
import numpy as np
from typing import Dict, List, Tuple, Optional
import logging
import time
import os
from pathlib import Path

from .config import (
    CATEGORY_NAMES,
    REVERSE_CATEGORY_MAPPING,
    MODEL_CONFIG,
    IMAGE_MEAN,
    IMAGE_STD,
    CONFIDENCE_THRESHOLDS
)

logger = logging.getLogger(__name__)


class DocumentClassifier:
    """
    Production-ready document classifier with transfer learning
    """

    def __init__(
        self,
        model_path: str,
        device: Optional[str] = None,
        use_amp: bool = True
    ):
        """
        Initialize document classifier

        Args:
            model_path: Path to trained model weights
            device: Device to run model on ('cuda', 'cpu', or None for auto)
            use_amp: Use automatic mixed precision for faster inference
        """
        self.model_path = model_path
        self.use_amp = use_amp

        # Set device
        if device is None:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = torch.device(device)

        logger.info(f"Initializing DocumentClassifier on {self.device}")

        # Load model
        self.model = self._load_model(model_path)
        self.model.eval()

        # Get transforms
        self.transform = self._get_transform()

        # Performance tracking
        self.prediction_count = 0
        self.total_latency = 0

        logger.info("DocumentClassifier initialized successfully")

    def _load_model(self, model_path: str) -> nn.Module:
        """Load model with proper architecture"""
        # Build model architecture
        if MODEL_CONFIG['architecture'] == 'efficientnet_b3':
            model = models.efficientnet_b3(pretrained=False)
            num_features = model.classifier[1].in_features

            # Replace classifier
            model.classifier = nn.Sequential(
                nn.Dropout(MODEL_CONFIG['dropout']),
                nn.Linear(num_features, MODEL_CONFIG['hidden_dim']),
                nn.ReLU(),
                nn.Dropout(MODEL_CONFIG['dropout'] * 0.67),  # Lower dropout
                nn.Linear(MODEL_CONFIG['hidden_dim'], MODEL_CONFIG['num_classes'])
            )

        elif MODEL_CONFIG['architecture'] == 'resnet50':
            model = models.resnet50(pretrained=False)
            num_features = model.fc.in_features

            # Replace final layer
            model.fc = nn.Sequential(
                nn.Dropout(MODEL_CONFIG['dropout']),
                nn.Linear(num_features, MODEL_CONFIG['hidden_dim']),
                nn.ReLU(),
                nn.Dropout(MODEL_CONFIG['dropout'] * 0.67),
                nn.Linear(MODEL_CONFIG['hidden_dim'], MODEL_CONFIG['num_classes'])
            )
        else:
            raise ValueError(f"Unknown architecture: {MODEL_CONFIG['architecture']}")

        # Load weights
        if os.path.exists(model_path):
            state_dict = torch.load(model_path, map_location=self.device)
            model.load_state_dict(state_dict)
            logger.info(f"Loaded model weights from {model_path}")
        else:
            logger.warning(f"Model path {model_path} not found. Using untrained model.")

        model.to(self.device)
        return model

    def _get_transform(self):
        """Get image preprocessing transforms"""
        return transforms.Compose([
            transforms.Resize(MODEL_CONFIG['input_size']),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGE_MEAN, std=IMAGE_STD)
        ])

    def preprocess_document(self, image_path: str) -> torch.Tensor:
        """
        Preprocess document image for classification

        Args:
            image_path: Path to document image

        Returns:
            Preprocessed tensor
        """
        try:
            # Load image
            image = Image.open(image_path).convert('RGB')

            # Apply transforms
            tensor = self.transform(image).unsqueeze(0)

            return tensor.to(self.device)

        except Exception as e:
            logger.error(f"Error preprocessing {image_path}: {str(e)}")
            raise

    @torch.no_grad()
    def classify(
        self,
        image_path: str,
        return_probabilities: bool = False
    ) -> Dict:
        """
        Classify a document image

        Args:
            image_path: Path to document image
            return_probabilities: Return full probability distribution

        Returns:
            Classification result dictionary
        """
        start_time = time.time()

        try:
            # Preprocess
            input_tensor = self.preprocess_document(image_path)

            # Run inference with optional AMP
            if self.use_amp and self.device.type == 'cuda':
                with torch.cuda.amp.autocast():
                    outputs = self.model(input_tensor)
            else:
                outputs = self.model(input_tensor)

            # Get probabilities
            probabilities = torch.softmax(outputs, dim=1)[0]

            # Get top 3 predictions
            top3_prob, top3_indices = torch.topk(probabilities, 3)

            # Primary prediction
            primary_idx = top3_indices[0].item()
            primary_category = REVERSE_CATEGORY_MAPPING[primary_idx]
            primary_confidence = top3_prob[0].item()

            # Secondary predictions
            secondary_predictions = [
                {
                    'category': REVERSE_CATEGORY_MAPPING[idx.item()],
                    'confidence': prob.item()
                }
                for idx, prob in zip(top3_indices[1:], top3_prob[1:])
            ]

            # Determine if review is required
            requires_review = primary_confidence < CONFIDENCE_THRESHOLDS['HIGH_CONFIDENCE']

            # Calculate latency
            latency_ms = int((time.time() - start_time) * 1000)

            # Update metrics
            self.prediction_count += 1
            self.total_latency += latency_ms

            result = {
                'primary_category': primary_category,
                'confidence': primary_confidence,
                'secondary_predictions': secondary_predictions,
                'requires_review': requires_review,
                'processing_time_ms': latency_ms,
            }

            # Add full probabilities if requested
            if return_probabilities:
                result['all_probabilities'] = {
                    REVERSE_CATEGORY_MAPPING[i]: prob.item()
                    for i, prob in enumerate(probabilities)
                }

            logger.info(
                f"Classified {Path(image_path).name}: "
                f"{primary_category} ({primary_confidence:.3f}) in {latency_ms}ms"
            )

            return result

        except Exception as e:
            logger.error(f"Classification failed for {image_path}: {str(e)}")
            raise

    def classify_batch(
        self,
        image_paths: List[str],
        batch_size: int = 32
    ) -> List[Dict]:
        """
        Classify multiple documents in batches

        Args:
            image_paths: List of image paths
            batch_size: Batch size for processing

        Returns:
            List of classification results
        """
        results = []

        # Process in batches
        for i in range(0, len(image_paths), batch_size):
            batch_paths = image_paths[i:i + batch_size]

            try:
                # Preprocess batch
                batch_tensors = []
                for path in batch_paths:
                    tensor = self.preprocess_document(path)
                    batch_tensors.append(tensor)

                # Concatenate into batch
                batch = torch.cat(batch_tensors, dim=0)

                # Run inference
                start_time = time.time()

                if self.use_amp and self.device.type == 'cuda':
                    with torch.cuda.amp.autocast():
                        outputs = self.model(batch)
                else:
                    outputs = self.model(batch)

                probabilities = torch.softmax(outputs, dim=1)
                latency_ms = int((time.time() - start_time) * 1000)

                # Process each result
                for j, (path, probs) in enumerate(zip(batch_paths, probabilities)):
                    top3_prob, top3_indices = torch.topk(probs, 3)

                    primary_idx = top3_indices[0].item()
                    primary_category = REVERSE_CATEGORY_MAPPING[primary_idx]
                    primary_confidence = top3_prob[0].item()

                    secondary_predictions = [
                        {
                            'category': REVERSE_CATEGORY_MAPPING[idx.item()],
                            'confidence': prob.item()
                        }
                        for idx, prob in zip(top3_indices[1:], top3_prob[1:])
                    ]

                    results.append({
                        'image_path': path,
                        'primary_category': primary_category,
                        'confidence': primary_confidence,
                        'secondary_predictions': secondary_predictions,
                        'requires_review': primary_confidence < CONFIDENCE_THRESHOLDS['HIGH_CONFIDENCE'],
                        'processing_time_ms': latency_ms // len(batch_paths),
                    })

            except Exception as e:
                logger.error(f"Batch classification failed: {str(e)}")
                # Add error results for failed images
                for path in batch_paths:
                    results.append({
                        'image_path': path,
                        'error': str(e),
                        'primary_category': 'UNKNOWN',
                        'confidence': 0.0,
                        'requires_review': True,
                    })

        logger.info(f"Batch classification completed: {len(results)} documents")
        return results

    def get_metrics(self) -> Dict:
        """Get classifier performance metrics"""
        avg_latency = (
            self.total_latency / self.prediction_count
            if self.prediction_count > 0
            else 0
        )

        return {
            'prediction_count': self.prediction_count,
            'average_latency_ms': avg_latency,
            'device': str(self.device),
            'use_amp': self.use_amp,
        }

    def reset_metrics(self):
        """Reset performance metrics"""
        self.prediction_count = 0
        self.total_latency = 0
