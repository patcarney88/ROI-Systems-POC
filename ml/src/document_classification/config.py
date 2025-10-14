"""
Configuration for Document Classification
"""

# Document categories (23 classes + OTHER + UNKNOWN)
CATEGORY_NAMES = [
    'DEED',
    'MORTGAGE',
    'TITLE_INSURANCE',
    'TITLE_COMMITMENT',
    'SETTLEMENT_STATEMENT',
    'TAX_RETURN',
    'BANK_STATEMENT',
    'PAY_STUB',
    'W2_FORM',
    'FORM_1099',
    'PURCHASE_AGREEMENT',
    'LISTING_AGREEMENT',
    'POWER_OF_ATTORNEY',
    'AFFIDAVIT',
    'DIVORCE_DECREE',
    'PROPERTY_APPRAISAL',
    'HOME_INSPECTION',
    'SURVEY',
    'HOMEOWNER_INSURANCE',
    'DRIVERS_LICENSE',
    'PASSPORT',
    'SOCIAL_SECURITY_CARD',
    'OTHER',
    'UNKNOWN',
]

# Category index mapping
CATEGORY_MAPPING = {name: idx for idx, name in enumerate(CATEGORY_NAMES)}
REVERSE_CATEGORY_MAPPING = {idx: name for name, idx in CATEGORY_MAPPING.items()}

# Model configuration
MODEL_CONFIG = {
    'architecture': 'efficientnet_b3',  # or 'resnet50'
    'pretrained': True,
    'num_classes': len(CATEGORY_NAMES),
    'input_size': (224, 224),
    'dropout': 0.3,
    'hidden_dim': 512,
}

# Training configuration
TRAINING_CONFIG = {
    'batch_size': 32,
    'num_epochs': 50,
    'learning_rate': 0.001,
    'weight_decay': 1e-4,
    'lr_scheduler': 'ReduceLROnPlateau',
    'early_stopping_patience': 10,
    'grad_clip': 1.0,
}

# Data augmentation configuration
AUGMENTATION_CONFIG = {
    'rotation_range': 15,
    'horizontal_flip': 0.5,
    'vertical_flip': 0.1,
    'brightness': 0.2,
    'contrast': 0.2,
    'gaussian_noise': 0.01,
    'gaussian_blur': 0.1,
}

# Image preprocessing
IMAGE_MEAN = [0.485, 0.456, 0.406]
IMAGE_STD = [0.229, 0.224, 0.225]

# Confidence thresholds
CONFIDENCE_THRESHOLDS = {
    'HIGH_CONFIDENCE': 0.85,  # No review needed
    'MEDIUM_CONFIDENCE': 0.65,  # Optional review
    'LOW_CONFIDENCE': 0.50,  # Requires review
}

# Model paths
MODEL_SAVE_DIR = '/models/document_classification'
CHECKPOINT_DIR = '/models/checkpoints'
LOGS_DIR = '/logs/training'
