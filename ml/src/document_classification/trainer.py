"""
Document Classifier Trainer
Training pipeline with data augmentation, early stopping, and model checkpointing
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.tensorboard import SummaryWriter
import torchvision.models as models
from typing import Dict, Optional, Tuple
import logging
from pathlib import Path
import time
import json
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np

from .config import (
    MODEL_CONFIG,
    TRAINING_CONFIG,
    CATEGORY_NAMES,
    REVERSE_CATEGORY_MAPPING,
    MODEL_SAVE_DIR,
    CHECKPOINT_DIR,
    LOGS_DIR
)
from .dataset import DocumentDataset, create_data_loaders, get_class_weights

logger = logging.getLogger(__name__)


class DocumentClassifierTrainer:
    """
    Production-ready trainer for document classification
    """

    def __init__(
        self,
        train_dataset: DocumentDataset,
        val_dataset: DocumentDataset,
        device: Optional[str] = None,
        use_amp: bool = True
    ):
        """
        Initialize trainer

        Args:
            train_dataset: Training dataset
            val_dataset: Validation dataset
            device: Device to use
            use_amp: Use automatic mixed precision
        """
        self.train_dataset = train_dataset
        self.val_dataset = val_dataset
        self.use_amp = use_amp

        # Set device
        if device is None:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = torch.device(device)

        logger.info(f"Initializing trainer on {self.device}")

        # Build model
        self.model = self._build_model()

        # Setup loss and optimizer
        class_weights = get_class_weights(train_dataset)
        self.criterion = nn.CrossEntropyLoss(weight=class_weights.to(self.device))

        self.optimizer = optim.AdamW(
            self.model.parameters(),
            lr=TRAINING_CONFIG['learning_rate'],
            weight_decay=TRAINING_CONFIG['weight_decay']
        )

        # Learning rate scheduler
        self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer,
            mode='max',
            factor=0.5,
            patience=3,
            verbose=True
        )

        # Create data loaders
        self.train_loader, self.val_loader = create_data_loaders(
            train_dataset,
            val_dataset,
            batch_size=TRAINING_CONFIG['batch_size']
        )

        # Initialize tensorboard
        self.writer = SummaryWriter(log_dir=LOGS_DIR)

        # Training state
        self.current_epoch = 0
        self.best_val_acc = 0.0
        self.patience_counter = 0

        # AMP scaler
        self.scaler = torch.cuda.amp.GradScaler() if use_amp and self.device.type == 'cuda' else None

        logger.info("Trainer initialized successfully")

    def _build_model(self) -> nn.Module:
        """Build model architecture"""
        if MODEL_CONFIG['architecture'] == 'efficientnet_b3':
            model = models.efficientnet_b3(pretrained=MODEL_CONFIG['pretrained'])
            num_features = model.classifier[1].in_features

            # Replace classifier
            model.classifier = nn.Sequential(
                nn.Dropout(MODEL_CONFIG['dropout']),
                nn.Linear(num_features, MODEL_CONFIG['hidden_dim']),
                nn.ReLU(),
                nn.Dropout(MODEL_CONFIG['dropout'] * 0.67),
                nn.Linear(MODEL_CONFIG['hidden_dim'], MODEL_CONFIG['num_classes'])
            )

        elif MODEL_CONFIG['architecture'] == 'resnet50':
            model = models.resnet50(pretrained=MODEL_CONFIG['pretrained'])
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

        model.to(self.device)
        logger.info(f"Built {MODEL_CONFIG['architecture']} model")

        return model

    def train_epoch(self) -> Tuple[float, float]:
        """
        Train for one epoch

        Returns:
            Tuple of (loss, accuracy)
        """
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0

        for batch_idx, (images, labels) in enumerate(self.train_loader):
            images, labels = images.to(self.device), labels.to(self.device)

            # Zero gradients
            self.optimizer.zero_grad()

            # Forward pass with optional AMP
            if self.scaler is not None:
                with torch.cuda.amp.autocast():
                    outputs = self.model(images)
                    loss = self.criterion(outputs, labels)

                # Backward pass with gradient scaling
                self.scaler.scale(loss).backward()

                # Gradient clipping
                self.scaler.unscale_(self.optimizer)
                torch.nn.utils.clip_grad_norm_(
                    self.model.parameters(),
                    TRAINING_CONFIG['grad_clip']
                )

                # Optimizer step
                self.scaler.step(self.optimizer)
                self.scaler.update()
            else:
                outputs = self.model(images)
                loss = self.criterion(outputs, labels)
                loss.backward()

                # Gradient clipping
                torch.nn.utils.clip_grad_norm_(
                    self.model.parameters(),
                    TRAINING_CONFIG['grad_clip']
                )

                self.optimizer.step()

            # Calculate metrics
            total_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

            # Log batch
            if batch_idx % 10 == 0:
                logger.debug(
                    f"Epoch {self.current_epoch} | "
                    f"Batch {batch_idx}/{len(self.train_loader)} | "
                    f"Loss: {loss.item():.4f}"
                )

        avg_loss = total_loss / len(self.train_loader)
        accuracy = 100.0 * correct / total

        return avg_loss, accuracy

    @torch.no_grad()
    def validate(self) -> Tuple[float, Dict]:
        """
        Validate model

        Returns:
            Tuple of (accuracy, metrics_dict)
        """
        self.model.eval()
        correct = 0
        total = 0
        all_preds = []
        all_labels = []

        for images, labels in self.val_loader:
            images, labels = images.to(self.device), labels.to(self.device)

            # Forward pass
            if self.scaler is not None:
                with torch.cuda.amp.autocast():
                    outputs = self.model(images)
            else:
                outputs = self.model(images)

            _, predicted = outputs.max(1)

            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

        accuracy = 100.0 * correct / total

        # Calculate per-class metrics
        report = classification_report(
            all_labels,
            all_preds,
            target_names=CATEGORY_NAMES,
            output_dict=True,
            zero_division=0
        )

        # Confusion matrix
        cm = confusion_matrix(all_labels, all_preds)

        metrics = {
            'accuracy': accuracy,
            'classification_report': report,
            'confusion_matrix': cm.tolist(),
        }

        return accuracy, metrics

    def train(self, num_epochs: Optional[int] = None) -> Dict:
        """
        Train model

        Args:
            num_epochs: Number of epochs (defaults to config)

        Returns:
            Training history
        """
        if num_epochs is None:
            num_epochs = TRAINING_CONFIG['num_epochs']

        logger.info(f"Starting training for {num_epochs} epochs")

        history = {
            'train_loss': [],
            'train_acc': [],
            'val_acc': [],
            'learning_rates': [],
        }

        start_time = time.time()

        for epoch in range(num_epochs):
            self.current_epoch = epoch

            # Train epoch
            train_loss, train_acc = self.train_epoch()

            # Validate
            val_acc, val_metrics = self.validate()

            # Log metrics
            self.writer.add_scalar('Loss/train', train_loss, epoch)
            self.writer.add_scalar('Accuracy/train', train_acc, epoch)
            self.writer.add_scalar('Accuracy/val', val_acc, epoch)
            self.writer.add_scalar(
                'Learning_Rate',
                self.optimizer.param_groups[0]['lr'],
                epoch
            )

            # Update history
            history['train_loss'].append(train_loss)
            history['train_acc'].append(train_acc)
            history['val_acc'].append(val_acc)
            history['learning_rates'].append(self.optimizer.param_groups[0]['lr'])

            logger.info(
                f"Epoch {epoch}/{num_epochs} | "
                f"Train Loss: {train_loss:.4f} | "
                f"Train Acc: {train_acc:.2f}% | "
                f"Val Acc: {val_acc:.2f}%"
            )

            # Learning rate scheduling
            self.scheduler.step(val_acc)

            # Save best model
            if val_acc > self.best_val_acc:
                self.best_val_acc = val_acc
                self.save_checkpoint('best_model.pth', val_metrics)
                self.patience_counter = 0
                logger.info(f"New best model saved: {val_acc:.2f}%")
            else:
                self.patience_counter += 1

            # Early stopping
            if self.patience_counter >= TRAINING_CONFIG['early_stopping_patience']:
                logger.info(f"Early stopping at epoch {epoch}")
                break

            # Save periodic checkpoint
            if (epoch + 1) % 10 == 0:
                self.save_checkpoint(f'checkpoint_epoch_{epoch+1}.pth', val_metrics)

        total_time = time.time() - start_time
        logger.info(f"Training completed in {total_time:.2f}s")
        logger.info(f"Best validation accuracy: {self.best_val_acc:.2f}%")

        self.writer.close()

        # Add final metrics to history
        history['best_val_acc'] = self.best_val_acc
        history['total_time'] = total_time

        return history

    def save_checkpoint(self, filename: str, metrics: Dict):
        """Save model checkpoint"""
        Path(CHECKPOINT_DIR).mkdir(parents=True, exist_ok=True)
        checkpoint_path = Path(CHECKPOINT_DIR) / filename

        checkpoint = {
            'epoch': self.current_epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'scheduler_state_dict': self.scheduler.state_dict(),
            'best_val_acc': self.best_val_acc,
            'metrics': metrics,
            'config': {
                'model': MODEL_CONFIG,
                'training': TRAINING_CONFIG,
            }
        }

        if self.scaler is not None:
            checkpoint['scaler_state_dict'] = self.scaler.state_dict()

        torch.save(checkpoint, checkpoint_path)
        logger.info(f"Checkpoint saved: {checkpoint_path}")

        # Also save model weights only
        model_path = Path(MODEL_SAVE_DIR)
        model_path.mkdir(parents=True, exist_ok=True)
        torch.save(
            self.model.state_dict(),
            model_path / filename.replace('.pth', '_weights.pth')
        )

    def load_checkpoint(self, checkpoint_path: str):
        """Load model checkpoint"""
        checkpoint = torch.load(checkpoint_path, map_location=self.device)

        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.scheduler.load_state_dict(checkpoint['scheduler_state_dict'])

        if self.scaler is not None and 'scaler_state_dict' in checkpoint:
            self.scaler.load_state_dict(checkpoint['scaler_state_dict'])

        self.current_epoch = checkpoint['epoch']
        self.best_val_acc = checkpoint['best_val_acc']

        logger.info(f"Checkpoint loaded from {checkpoint_path}")

    def save_metrics(self, metrics: Dict, filename: str = 'training_metrics.json'):
        """Save training metrics to JSON"""
        metrics_path = Path(LOGS_DIR) / filename

        with open(metrics_path, 'w') as f:
            json.dump(metrics, f, indent=2)

        logger.info(f"Metrics saved: {metrics_path}")
