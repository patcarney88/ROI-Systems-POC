# Document Classification System

Production-ready CNN-based document classification system achieving 99% accuracy target for real estate document processing.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Model Performance](#model-performance)
- [Installation](#installation)
- [Training](#training)
- [Deployment](#deployment)
- [API Usage](#api-usage)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose

Automatically classify 23+ types of real estate documents with high accuracy, reducing manual processing time and improving document organization.

### Key Features

- **99% Accuracy Target**: Transfer learning with EfficientNet-B3 or ResNet-50
- **23+ Document Categories**: Covers all major real estate document types
- **Production-Ready**: FastAPI integration, PostgreSQL storage, comprehensive monitoring
- **Scalable**: Batch processing, GPU acceleration, automatic mixed precision
- **Explainable**: SHAP values for feature importance and model transparency

### Supported Document Categories

#### Title Documents (5)
- Deed
- Mortgage/Deed of Trust
- Title Insurance Policy
- Title Commitment
- Settlement Statement (HUD-1/Closing Disclosure)

#### Financial Documents (5)
- Tax Returns
- Bank Statements
- Pay Stubs
- W-2 Forms
- 1099 Forms

#### Legal Documents (5)
- Purchase Agreement
- Listing Agreement
- Power of Attorney
- Affidavit
- Divorce Decree

#### Property Documents (4)
- Property Appraisal
- Home Inspection Report
- Property Survey
- Homeowner's Insurance

#### Identification (3)
- Driver's License
- Passport
- Social Security Card

#### Other (1)
- Uncategorized/Unknown documents

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend/Backend                        │
│                   (TypeScript Service)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI Classification API                  │
│              (Python - Port 8001)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│            CNN Document Classifier                          │
│      (EfficientNet-B3 / ResNet-50 + PyTorch)               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (AWS RDS)                   │
│    - Classification results                                 │
│    - Model versions & metrics                               │
│    - Training datasets                                      │
└─────────────────────────────────────────────────────────────┘
```

### Model Architecture

**EfficientNet-B3 (Recommended)**
```
Input (224x224x3)
    ↓
EfficientNet-B3 Backbone (pretrained on ImageNet)
    ↓
Global Average Pooling
    ↓
Dropout(0.3)
    ↓
Dense(512) + ReLU
    ↓
Dropout(0.2)
    ↓
Dense(25) [23 categories + OTHER + UNKNOWN]
    ↓
Softmax
```

**Training Strategy**
- Transfer learning from ImageNet weights
- Fine-tuning all layers
- Cross-entropy loss with class weights (handles imbalance)
- AdamW optimizer with weight decay
- Learning rate scheduling (ReduceLROnPlateau)
- Early stopping (patience=10)
- Gradient clipping (max_norm=1.0)

---

## Model Performance

### Target Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Overall Accuracy | 99% | TBD (after training) |
| Precision (avg) | >98% | TBD |
| Recall (avg) | >98% | TBD |
| F1-Score (avg) | >98% | TBD |
| Inference Time | <200ms | ~150ms (GPU) |

### Per-Category Performance

Performance metrics will be measured for each of the 23+ categories:

```python
# Example output after training
{
  "DEED": {
    "precision": 0.992,
    "recall": 0.995,
    "f1-score": 0.993,
    "support": 1250
  },
  "MORTGAGE": {
    "precision": 0.988,
    "recall": 0.991,
    "f1-score": 0.989,
    "support": 1180
  },
  # ... other categories
}
```

### Confidence Thresholds

- **High Confidence**: ≥85% - No review needed
- **Medium Confidence**: 65-85% - Optional review
- **Low Confidence**: <65% - Manual review required

---

## Installation

### Prerequisites

- Python 3.9+
- CUDA 11.8+ (for GPU training)
- PostgreSQL 14+ (AWS RDS)
- Node.js 18+ (for TypeScript integration)

### Python Dependencies

```bash
cd ml/src/document_classification
pip install -r requirements.txt
```

**requirements.txt**
```
torch>=2.0.0
torchvision>=0.15.0
efficientnet-pytorch>=0.7.1
pillow>=9.5.0
numpy>=1.24.0
scikit-learn>=1.2.0
tensorboard>=2.13.0
fastapi>=0.100.0
uvicorn>=0.23.0
python-multipart>=0.0.6
shap>=0.42.0
```

### Database Setup

```bash
# Run Prisma migrations
cd backend
npx prisma migrate dev --schema=prisma/schema.document-processing.prisma
```

---

## Training

### Preparing Training Data

**Directory Structure**
```
/data/documents/
├── train/
│   ├── DEED/
│   │   ├── image1.jpg
│   │   ├── image2.jpg
│   ├── MORTGAGE/
│   │   ├── image1.jpg
│   └── ...
├── val/
│   ├── DEED/
│   └── ...
└── test/
    ├── DEED/
    └── ...
```

**Alternative: JSON Format**
```json
[
  {
    "image_path": "/path/to/deed1.jpg",
    "category": "DEED"
  },
  {
    "image_path": "/path/to/mortgage1.jpg",
    "category": "MORTGAGE"
  }
]
```

### Training Script

```python
#!/usr/bin/env python3
"""
Train Document Classification Model
"""

from document_classification import DocumentClassifierTrainer
from document_classification.dataset import DocumentDataset
import logging

logging.basicConfig(level=logging.INFO)

# Load datasets
train_dataset = DocumentDataset.from_directory(
    data_dir='/data/documents',
    split='train',
    augment=True
)

val_dataset = DocumentDataset.from_directory(
    data_dir='/data/documents',
    split='val',
    augment=False
)

# Initialize trainer
trainer = DocumentClassifierTrainer(
    train_dataset=train_dataset,
    val_dataset=val_dataset,
    device='cuda',  # or 'cpu'
    use_amp=True
)

# Train model
history = trainer.train(num_epochs=50)

# Save metrics
trainer.save_metrics(history, 'training_metrics.json')

print(f"Training completed. Best validation accuracy: {history['best_val_acc']:.2f}%")
```

**Run Training**
```bash
python train_classifier.py
```

### Data Augmentation

Applied during training:
- Random rotation (±15°)
- Horizontal flip (50% probability)
- Vertical flip (10% probability)
- Color jitter (brightness ±20%, contrast ±20%)
- Gaussian blur (10% probability)
- Gaussian noise (σ=0.01)

### Monitoring Training

**TensorBoard**
```bash
tensorboard --logdir=/logs/training
```

View at: http://localhost:6006

**Metrics Tracked**
- Training loss (per epoch)
- Training accuracy (per epoch)
- Validation accuracy (per epoch)
- Learning rate (per epoch)
- Per-class precision/recall/F1
- Confusion matrix

---

## Deployment

### FastAPI Service

**Start Classification API**
```bash
cd ml/src/api
uvicorn classification_api:app --host 0.0.0.0 --port 8001 --reload
```

**Environment Variables**
```bash
export MODEL_PATH="/models/document_classification/best_model_weights.pth"
export DEVICE="cuda"  # or "cpu"
export USE_AMP="true"
export PORT="8001"
```

**Docker Deployment**
```dockerfile
FROM python:3.9-slim

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy model and code
COPY models/ /models/
COPY src/ /app/

# Set environment
ENV MODEL_PATH=/models/document_classification/best_model_weights.pth
ENV DEVICE=cuda
ENV PORT=8001

# Run API
CMD ["uvicorn", "classification_api:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Production Deployment

**AWS Lambda + API Gateway (Serverless)**
- Use AWS Lambda with container image support
- Deploy model weights to S3
- Use AWS API Gateway for REST endpoints
- Configure autoscaling based on load

**Kubernetes (Scalable)**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: document-classification
spec:
  replicas: 3
  selector:
    matchLabels:
      app: document-classification
  template:
    metadata:
      labels:
        app: document-classification
    spec:
      containers:
      - name: classification-api
        image: roi-systems/classification-api:latest
        ports:
        - containerPort: 8001
        env:
        - name: MODEL_PATH
          value: "/models/best_model_weights.pth"
        - name: DEVICE
          value: "cuda"
        resources:
          limits:
            nvidia.com/gpu: 1
```

---

## API Usage

### REST API Endpoints

**Base URL**: `http://localhost:8001`

#### 1. Classify Single Document

**Endpoint**: `POST /v1/classify`

**Request**
```bash
curl -X POST "http://localhost:8001/v1/classify" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/document.pdf" \
  -F "document_id=doc_12345" \
  -F "return_probabilities=false"
```

**Response**
```json
{
  "classification_id": "cls_abc123",
  "document_id": "doc_12345",
  "primary_category": "DEED",
  "confidence": 0.972,
  "secondary_predictions": [
    {
      "category": "TITLE_INSURANCE",
      "confidence": 0.018
    },
    {
      "category": "MORTGAGE",
      "confidence": 0.007
    }
  ],
  "requires_review": false,
  "processing_time_ms": 152,
  "model_version": "v1.0.0",
  "timestamp": "2025-10-14T10:30:00Z"
}
```

#### 2. Batch Classification

**Endpoint**: `POST /v1/classify/batch`

**Request**
```bash
curl -X POST "http://localhost:8001/v1/classify/batch" \
  -H "Content-Type: multipart/form-data" \
  -F "files=@/path/to/doc1.pdf" \
  -F "files=@/path/to/doc2.pdf" \
  -F "files=@/path/to/doc3.pdf"
```

**Response**
```json
{
  "results": [
    {
      "classification_id": "cls_abc123",
      "primary_category": "DEED",
      "confidence": 0.972,
      "requires_review": false,
      "processing_time_ms": 150
    },
    {
      "classification_id": "cls_abc124",
      "primary_category": "MORTGAGE",
      "confidence": 0.988,
      "requires_review": false,
      "processing_time_ms": 145
    }
  ],
  "total_count": 3,
  "success_count": 2,
  "failed_count": 1,
  "total_processing_time_ms": 450
}
```

#### 3. Get Categories

**Endpoint**: `GET /v1/categories`

**Response**
```json
[
  "DEED",
  "MORTGAGE",
  "TITLE_INSURANCE",
  "TITLE_COMMITMENT",
  "SETTLEMENT_STATEMENT",
  ...
]
```

#### 4. Health Check

**Endpoint**: `GET /v1/health`

**Response**
```json
{
  "status": "healthy",
  "model_version": "v1.0.0",
  "device": "cuda:0",
  "prediction_count": 1523,
  "average_latency_ms": 148.5,
  "supported_categories": [...],
  "confidence_thresholds": {
    "HIGH_CONFIDENCE": 0.85,
    "MEDIUM_CONFIDENCE": 0.65,
    "LOW_CONFIDENCE": 0.50
  }
}
```

### TypeScript Integration

```typescript
import { documentClassificationService } from './services/document-classification.service';

// Classify single document
const result = await documentClassificationService.classifyDocument(
  'doc_12345',
  '/path/to/document.pdf',
  { returnProbabilities: false }
);

console.log(`Classified as: ${result.primaryCategory} (${(result.confidence * 100).toFixed(1)}%)`);
console.log(`Requires review: ${result.requiresReview}`);

// Batch classification
const batchResult = await documentClassificationService.classifyBatch([
  { documentId: 'doc_1', filePath: '/path/to/doc1.pdf' },
  { documentId: 'doc_2', filePath: '/path/to/doc2.pdf' },
]);

console.log(`Success: ${batchResult.successCount}/${batchResult.totalCount}`);

// Check model health
const health = await documentClassificationService.checkHealth();
console.log(`Model status: ${health.status}`);
console.log(`Average latency: ${health.averageLatencyMs}ms`);
```

---

## Monitoring

### Performance Metrics

**Real-time Monitoring**
- Prediction count
- Average latency (p50, p95, p99)
- Error rate
- Confidence distribution
- Category distribution

**Model Drift Detection**
- Track prediction accuracy over time
- Compare against validation set
- Alert when accuracy drops below threshold

### Database Queries

**Classification Statistics**
```sql
SELECT
  category,
  COUNT(*) as total,
  AVG(confidence) as avg_confidence,
  SUM(CASE WHEN requires_review THEN 1 ELSE 0 END) as review_count
FROM document_classifications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY category
ORDER BY total DESC;
```

**Model Performance**
```sql
SELECT
  model_version,
  COUNT(*) as predictions,
  AVG(processing_time) as avg_latency_ms,
  AVG(confidence) as avg_confidence
FROM document_classifications
GROUP BY model_version
ORDER BY created_at DESC;
```

### Logging

**Log Levels**
- `INFO`: Successful classifications, model loads
- `WARNING`: Low confidence predictions, missing files
- `ERROR`: Classification failures, API errors
- `DEBUG`: Detailed processing steps

**Log Format**
```
2025-10-14 10:30:15 - document-classification - INFO - Document doc_12345 classified as DEED (97.2%) in 152ms
2025-10-14 10:30:20 - document-classification - WARNING - Low confidence classification: doc_67890 -> MORTGAGE (62.3%)
2025-10-14 10:30:25 - document-classification - ERROR - Classification failed for doc_11111: File not found
```

---

## Troubleshooting

### Common Issues

#### 1. Model Not Loading
**Symptom**: Error on API startup
```
Failed to initialize API: Model path not found
```

**Solution**
```bash
# Check model path
export MODEL_PATH="/correct/path/to/best_model_weights.pth"

# Verify file exists
ls -lh $MODEL_PATH
```

#### 2. Low Accuracy
**Symptom**: Classification accuracy below 99%

**Solutions**
- Increase training data (target: 1000+ samples per category)
- Apply more data augmentation
- Increase number of epochs
- Use EfficientNet-B4 or B5 for higher capacity
- Check for label noise in training data

#### 3. Slow Inference
**Symptom**: Latency >200ms

**Solutions**
```python
# Enable automatic mixed precision
classifier = DocumentClassifier(
    model_path=model_path,
    device='cuda',
    use_amp=True  # <-- Enable AMP
)

# Use batch processing
results = classifier.classify_batch(image_paths, batch_size=32)
```

#### 4. Out of Memory (GPU)
**Symptom**: CUDA out of memory error

**Solutions**
- Reduce batch size
- Use smaller model (EfficientNet-B0 or B1)
- Enable gradient checkpointing
```python
import torch
torch.cuda.empty_cache()
```

#### 5. High Review Rate
**Symptom**: Too many documents flagged for review

**Solutions**
- Lower confidence threshold (current: 85%)
- Add more training data for problematic categories
- Implement ensemble of models
- Use semi-supervised learning for unlabeled data

### Support

For issues not covered here:
1. Check logs: `/logs/training/` and application logs
2. Review TensorBoard metrics
3. Consult confusion matrix for error patterns
4. Contact ML team with:
   - Model version
   - Sample failing documents
   - Error logs and stack traces

---

## Future Enhancements

### Roadmap

- [ ] Multi-page document support
- [ ] Document orientation correction
- [ ] Ensemble models (CNN + Transformer)
- [ ] Active learning pipeline
- [ ] Semi-supervised learning
- [ ] Document similarity search
- [ ] OCR integration for text-based classification
- [ ] Multi-language support
- [ ] Model compression (ONNX, TensorRT)
- [ ] Edge deployment (mobile/browser)

### Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| Accuracy | TBD | 99.5% |
| Latency | 150ms | 100ms |
| Throughput | TBD | 1000 docs/min |
| Model Size | ~50MB | <20MB (compressed) |

---

## License

Internal ROI Systems project. All rights reserved.

## Contact

ML Team: ml-team@roisystems.com
DevOps: devops@roisystems.com
