"""
Document Dataset for Training
Handles data loading and augmentation
"""

import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import numpy as np
from typing import Optional, List, Tuple, Dict
import logging
from pathlib import Path
import json

from .config import (
    CATEGORY_MAPPING,
    IMAGE_MEAN,
    IMAGE_STD,
    MODEL_CONFIG,
    AUGMENTATION_CONFIG
)

logger = logging.getLogger(__name__)


class DocumentDataset(Dataset):
    """
    PyTorch Dataset for document classification
    """

    def __init__(
        self,
        image_paths: List[str],
        labels: List[int],
        transform: Optional[transforms.Compose] = None,
        augment: bool = False
    ):
        """
        Initialize dataset

        Args:
            image_paths: List of paths to images
            labels: List of label indices
            transform: Torchvision transforms
            augment: Apply data augmentation
        """
        self.image_paths = image_paths
        self.labels = labels
        self.augment = augment

        # Set transforms
        if transform is None:
            self.transform = self._get_default_transform(augment)
        else:
            self.transform = transform

        logger.info(
            f"Initialized DocumentDataset: {len(self)} samples, "
            f"augmentation={'ON' if augment else 'OFF'}"
        )

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        """
        Get dataset item

        Args:
            idx: Index

        Returns:
            Tuple of (image_tensor, label)
        """
        image_path = self.image_paths[idx]
        label = self.labels[idx]

        try:
            # Load image
            image = Image.open(image_path).convert('RGB')

            # Apply transforms
            if self.transform:
                image = self.transform(image)

            return image, label

        except Exception as e:
            logger.error(f"Error loading {image_path}: {str(e)}")
            # Return blank image on error
            blank_image = torch.zeros(3, *MODEL_CONFIG['input_size'])
            return blank_image, label

    def _get_default_transform(self, augment: bool) -> transforms.Compose:
        """Get default image transforms"""
        transform_list = [
            transforms.Resize(MODEL_CONFIG['input_size']),
        ]

        if augment:
            # Add augmentation transforms
            transform_list.extend([
                transforms.RandomRotation(AUGMENTATION_CONFIG['rotation_range']),
                transforms.RandomHorizontalFlip(p=AUGMENTATION_CONFIG['horizontal_flip']),
                transforms.RandomVerticalFlip(p=AUGMENTATION_CONFIG['vertical_flip']),
                transforms.ColorJitter(
                    brightness=AUGMENTATION_CONFIG['brightness'],
                    contrast=AUGMENTATION_CONFIG['contrast']
                ),
                transforms.RandomApply([
                    transforms.GaussianBlur(kernel_size=3)
                ], p=AUGMENTATION_CONFIG['gaussian_blur']),
            ])

        # Add normalization
        transform_list.extend([
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGE_MEAN, std=IMAGE_STD)
        ])

        return transforms.Compose(transform_list)

    @staticmethod
    def from_directory(
        data_dir: str,
        split: str = 'train',
        augment: bool = False
    ) -> 'DocumentDataset':
        """
        Create dataset from directory structure

        Expected structure:
        data_dir/
            train/
                DEED/
                    image1.jpg
                    image2.jpg
                MORTGAGE/
                    image1.jpg
            val/
            test/

        Args:
            data_dir: Root data directory
            split: 'train', 'val', or 'test'
            augment: Apply augmentation

        Returns:
            DocumentDataset instance
        """
        data_path = Path(data_dir) / split
        if not data_path.exists():
            raise ValueError(f"Data path {data_path} does not exist")

        image_paths = []
        labels = []

        # Iterate through category folders
        for category_name, category_idx in CATEGORY_MAPPING.items():
            category_path = data_path / category_name

            if not category_path.exists():
                continue

            # Get all images in category
            for ext in ['*.jpg', '*.jpeg', '*.png', '*.pdf']:
                for img_path in category_path.glob(ext):
                    image_paths.append(str(img_path))
                    labels.append(category_idx)

        logger.info(
            f"Loaded {len(image_paths)} images from {data_path} "
            f"({split} split)"
        )

        return DocumentDataset(image_paths, labels, augment=augment)

    @staticmethod
    def from_json(
        json_path: str,
        augment: bool = False
    ) -> 'DocumentDataset':
        """
        Create dataset from JSON file

        JSON format:
        [
            {"image_path": "/path/to/image.jpg", "category": "DEED"},
            ...
        ]

        Args:
            json_path: Path to JSON file
            augment: Apply augmentation

        Returns:
            DocumentDataset instance
        """
        with open(json_path, 'r') as f:
            data = json.load(f)

        image_paths = []
        labels = []

        for item in data:
            image_paths.append(item['image_path'])
            category_name = item['category']
            labels.append(CATEGORY_MAPPING[category_name])

        logger.info(f"Loaded {len(image_paths)} images from {json_path}")

        return DocumentDataset(image_paths, labels, augment=augment)

    def get_class_distribution(self) -> Dict[str, int]:
        """Get distribution of classes in dataset"""
        from collections import Counter
        from .config import REVERSE_CATEGORY_MAPPING

        label_counts = Counter(self.labels)

        return {
            REVERSE_CATEGORY_MAPPING[label]: count
            for label, count in label_counts.items()
        }


def get_class_weights(dataset: DocumentDataset) -> torch.Tensor:
    """
    Compute class weights for imbalanced dataset

    Args:
        dataset: Document dataset

    Returns:
        Tensor of class weights
    """
    from collections import Counter
    from .config import CATEGORY_NAMES

    label_counts = Counter(dataset.labels)

    # Calculate inverse frequency weights
    total_samples = len(dataset)
    num_classes = len(CATEGORY_NAMES)

    weights = torch.zeros(num_classes)

    for class_idx in range(num_classes):
        count = label_counts.get(class_idx, 1)  # Avoid division by zero
        weights[class_idx] = total_samples / (num_classes * count)

    logger.info(f"Computed class weights: min={weights.min():.3f}, max={weights.max():.3f}")

    return weights


def create_data_loaders(
    train_dataset: DocumentDataset,
    val_dataset: DocumentDataset,
    batch_size: int = 32,
    num_workers: int = 4
) -> Tuple[DataLoader, DataLoader]:
    """
    Create train and validation data loaders

    Args:
        train_dataset: Training dataset
        val_dataset: Validation dataset
        batch_size: Batch size
        num_workers: Number of worker processes

    Returns:
        Tuple of (train_loader, val_loader)
    """
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True,
        drop_last=True
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True
    )

    logger.info(
        f"Created data loaders: "
        f"train={len(train_loader)} batches, "
        f"val={len(val_loader)} batches"
    )

    return train_loader, val_loader
