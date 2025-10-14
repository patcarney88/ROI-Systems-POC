#!/usr/bin/env python3
"""
Training Script for Document Classification Model

Usage:
    python train_document_classifier.py --data-dir /path/to/data --epochs 50

Features:
- Automatic dataset loading
- Data augmentation
- Class imbalance handling
- Early stopping
- Model checkpointing
- TensorBoard logging
- Performance metrics
"""

import argparse
import logging
import sys
import os
from pathlib import Path
import json

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from document_classification import DocumentClassifierTrainer
from document_classification.dataset import DocumentDataset
from document_classification.config import (
    TRAINING_CONFIG,
    MODEL_CONFIG,
    CATEGORY_NAMES,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('training.log')
    ]
)
logger = logging.getLogger(__name__)


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description='Train Document Classification Model'
    )

    # Data arguments
    parser.add_argument(
        '--data-dir',
        type=str,
        required=True,
        help='Path to dataset directory (must contain train/, val/, test/ folders)'
    )
    parser.add_argument(
        '--data-format',
        type=str,
        choices=['directory', 'json'],
        default='directory',
        help='Dataset format: directory structure or JSON file'
    )

    # Training arguments
    parser.add_argument(
        '--epochs',
        type=int,
        default=TRAINING_CONFIG['num_epochs'],
        help=f'Number of training epochs (default: {TRAINING_CONFIG["num_epochs"]})'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=TRAINING_CONFIG['batch_size'],
        help=f'Batch size (default: {TRAINING_CONFIG["batch_size"]})'
    )
    parser.add_argument(
        '--learning-rate',
        type=float,
        default=TRAINING_CONFIG['learning_rate'],
        help=f'Learning rate (default: {TRAINING_CONFIG["learning_rate"]})'
    )

    # Model arguments
    parser.add_argument(
        '--architecture',
        type=str,
        choices=['efficientnet_b3', 'resnet50'],
        default=MODEL_CONFIG['architecture'],
        help=f'Model architecture (default: {MODEL_CONFIG["architecture"]})'
    )
    parser.add_argument(
        '--pretrained',
        action='store_true',
        default=MODEL_CONFIG['pretrained'],
        help='Use pretrained weights'
    )

    # Hardware arguments
    parser.add_argument(
        '--device',
        type=str,
        choices=['cuda', 'cpu', 'auto'],
        default='auto',
        help='Device to use for training'
    )
    parser.add_argument(
        '--no-amp',
        action='store_true',
        help='Disable automatic mixed precision'
    )

    # Checkpoint arguments
    parser.add_argument(
        '--resume',
        type=str,
        default=None,
        help='Path to checkpoint to resume from'
    )
    parser.add_argument(
        '--output-dir',
        type=str,
        default='./checkpoints',
        help='Output directory for checkpoints'
    )

    return parser.parse_args()


def load_datasets(args):
    """Load training and validation datasets"""
    logger.info(f"Loading datasets from {args.data_dir}")

    if args.data_format == 'directory':
        # Load from directory structure
        train_dataset = DocumentDataset.from_directory(
            data_dir=args.data_dir,
            split='train',
            augment=True
        )

        val_dataset = DocumentDataset.from_directory(
            data_dir=args.data_dir,
            split='val',
            augment=False
        )

    else:  # JSON format
        train_json = os.path.join(args.data_dir, 'train.json')
        val_json = os.path.join(args.data_dir, 'val.json')

        train_dataset = DocumentDataset.from_json(
            json_path=train_json,
            augment=True
        )

        val_dataset = DocumentDataset.from_json(
            json_path=val_json,
            augment=False
        )

    # Log dataset statistics
    logger.info(f"Training samples: {len(train_dataset)}")
    logger.info(f"Validation samples: {len(val_dataset)}")

    # Log class distribution
    train_distribution = train_dataset.get_class_distribution()
    logger.info("Training class distribution:")
    for category, count in sorted(train_distribution.items(), key=lambda x: -x[1]):
        logger.info(f"  {category}: {count}")

    return train_dataset, val_dataset


def update_config(args):
    """Update configuration based on arguments"""
    if args.architecture:
        MODEL_CONFIG['architecture'] = args.architecture

    if args.pretrained is not None:
        MODEL_CONFIG['pretrained'] = args.pretrained

    if args.batch_size:
        TRAINING_CONFIG['batch_size'] = args.batch_size

    if args.learning_rate:
        TRAINING_CONFIG['learning_rate'] = args.learning_rate


def main():
    """Main training function"""
    # Parse arguments
    args = parse_args()

    # Update config
    update_config(args)

    logger.info("="*80)
    logger.info("Document Classification Training")
    logger.info("="*80)
    logger.info(f"Architecture: {MODEL_CONFIG['architecture']}")
    logger.info(f"Pretrained: {MODEL_CONFIG['pretrained']}")
    logger.info(f"Epochs: {args.epochs}")
    logger.info(f"Batch Size: {TRAINING_CONFIG['batch_size']}")
    logger.info(f"Learning Rate: {TRAINING_CONFIG['learning_rate']}")
    logger.info(f"Device: {args.device}")
    logger.info(f"AMP: {not args.no_amp}")
    logger.info("="*80)

    try:
        # Load datasets
        train_dataset, val_dataset = load_datasets(args)

        # Initialize trainer
        logger.info("Initializing trainer...")
        trainer = DocumentClassifierTrainer(
            train_dataset=train_dataset,
            val_dataset=val_dataset,
            device=None if args.device == 'auto' else args.device,
            use_amp=not args.no_amp
        )

        # Resume from checkpoint if specified
        if args.resume:
            logger.info(f"Resuming from checkpoint: {args.resume}")
            trainer.load_checkpoint(args.resume)

        # Train model
        logger.info("Starting training...")
        history = trainer.train(num_epochs=args.epochs)

        # Save final metrics
        metrics_path = Path(args.output_dir) / 'training_metrics.json'
        metrics_path.parent.mkdir(parents=True, exist_ok=True)

        with open(metrics_path, 'w') as f:
            # Convert numpy types to Python types for JSON serialization
            serializable_history = {
                k: [float(v) if isinstance(v, (int, float)) else v for v in vals]
                if isinstance(vals, list) else float(vals) if isinstance(vals, (int, float)) else vals
                for k, vals in history.items()
            }
            json.dump(serializable_history, f, indent=2)

        logger.info(f"Metrics saved to {metrics_path}")

        # Log final results
        logger.info("="*80)
        logger.info("Training Completed!")
        logger.info(f"Best Validation Accuracy: {history['best_val_acc']:.2f}%")
        logger.info(f"Total Training Time: {history['total_time']:.2f}s")
        logger.info(f"Final Learning Rate: {history['learning_rates'][-1]:.6f}")
        logger.info("="*80)

        # Check if target accuracy achieved
        if history['best_val_acc'] >= 99.0:
            logger.info("✓ TARGET ACHIEVED: 99% accuracy threshold met!")
        else:
            logger.warning(
                f"Target accuracy (99%) not achieved. "
                f"Current: {history['best_val_acc']:.2f}%"
            )
            logger.info("Recommendations:")
            logger.info("  - Increase training data")
            logger.info("  - Try longer training (more epochs)")
            logger.info("  - Use EfficientNet-B4 or B5")
            logger.info("  - Apply more data augmentation")

        return 0

    except Exception as e:
        logger.error(f"Training failed: {str(e)}", exc_info=True)
        return 1


if __name__ == '__main__':
    sys.exit(main())
