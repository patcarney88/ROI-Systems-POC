# ROI Systems Predictive Analytics Engine

## Machine Learning Models for Real Estate Intelligence

This directory contains the complete ML infrastructure for the ROI Systems POC, including four production-ready predictive models designed to optimize client engagement and provide market intelligence.

---

## 🎯 Overview

The ROI Systems Predictive Analytics Engine consists of:

1. **Move Probability Model** (XGBoost) - Predicts likelihood of client moving in 6-12 months
2. **Transaction Type Model** (Random Forest) - Classifies next transaction as BUY, SELL, REFINANCE, or HOLD
3. **Contact Timing Model** (LightGBM) - Optimizes day, time, and channel for client contact
4. **Property Value Model** (LSTM) - Forecasts property values for 3, 6, 12-month horizons

---

## 📁 Project Structure

```
ml/
├── README.md                          # This file
├── requirements.txt                   # Python dependencies
├── config/                            # Configuration files
│   └── training_config.json
├── data/                              # Data storage
│   ├── raw/                           # Raw data
│   ├── processed/                     # Processed data
│   └── features/                      # Feature stores
├── models/                            # Model artifacts
│   ├── artifacts/                     # Model checkpoints
│   └── trained/                       # Production models
├── notebooks/                         # Jupyter notebooks
│   ├── 01_data_exploration.ipynb
│   ├── 02_feature_engineering.ipynb
│   ├── 03_model_training.ipynb
│   └── 04_model_evaluation.ipynb
├── src/                               # Source code
│   ├── models/                        # Model implementations
│   │   ├── move_probability_model.py
│   │   ├── transaction_type_model.py
│   │   ├── contact_timing_model.py
│   │   └── property_value_model.py
│   ├── training/                      # Training pipeline
│   │   └── train_all_models.py
│   ├── evaluation/                    # Evaluation framework
│   │   └── model_evaluation.py
│   ├── feature_engineering/           # Feature engineering
│   │   ├── transformers.py
│   │   └── feature_store.py
│   ├── api/                           # Model serving API
│   │   └── app.py
│   ├── monitoring/                    # Model monitoring
│   │   └── drift_detection.py
│   ├── registry/                      # Model registry
│   │   └── mlflow_registry.py
│   └── utils/                         # Utility functions
│       └── helpers.py
├── tests/                             # Test suite
│   ├── unit/
│   ├── integration/
│   └── models/
├── docs/                              # Documentation
│   └── MODEL_SPECIFICATIONS.md        # Comprehensive model docs
└── dags/                              # Airflow DAGs
    └── training_pipeline.py
```

---

## 🚀 Quick Start

### 1. Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Setup MLflow

```bash
# Start MLflow tracking server
mlflow server --backend-store-uri sqlite:///mlflow.db --default-artifact-root ./mlruns --host 0.0.0.0 --port 5000
```

### 3. Train Models

```bash
# Train all models
python -m ml.src.training.train_all_models --config config/training_config.json

# Train specific model
python -m ml.src.training.train_all_models --models move_probability

# Train and evaluate
python -m ml.src.training.train_all_models --evaluate
```

### 4. Evaluate Models

```bash
# Run evaluation suite
python -m ml.src.evaluation.model_evaluation
```

### 5. Serve Models

```bash
# Start FastAPI server
uvicorn ml.src.api.app:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📊 Model Performance Targets

| Model | Primary Metric | Target | Status |
|-------|---------------|--------|--------|
| Move Probability | AUC-ROC | 0.90+ | ⏳ In Training |
| Transaction Type | Accuracy | 0.80+ | ⏳ In Training |
| Contact Timing | Combined Accuracy | 0.75+ | ⏳ In Training |
| Property Value | R² Score | 0.85+ | ⏳ In Training |

---

## 🔧 Configuration

### Training Configuration

Create `config/training_config.json`:

```json
{
  "mlflow_tracking_uri": "http://localhost:5000",
  "report_path": "./reports/training_report.json",
  "data": {
    "move_probability": {
      "path": "./data/processed/move_probability_data.csv",
      "stratify_col": "will_move_6_12_months",
      "train_ratio": 0.7,
      "val_ratio": 0.15,
      "test_ratio": 0.15
    },
    "transaction_type": {
      "path": "./data/processed/transaction_type_data.csv",
      "stratify_col": "transaction_type",
      "train_ratio": 0.7,
      "val_ratio": 0.15,
      "test_ratio": 0.15
    },
    "contact_timing": {
      "path": "./data/processed/contact_timing_data.csv",
      "train_ratio": 0.7,
      "val_ratio": 0.15,
      "test_ratio": 0.15
    },
    "property_value": {
      "path": "./data/processed/property_value_data.csv",
      "train_ratio": 0.7,
      "val_ratio": 0.15,
      "test_ratio": 0.15
    }
  },
  "models": {
    "move_probability": {
      "save_path": "./models/trained/move_probability"
    },
    "transaction_type": {
      "save_path": "./models/trained/transaction_type"
    },
    "contact_timing": {
      "save_path": "./models/trained/contact_timing"
    },
    "property_value": {
      "save_path": "./models/trained/property_value",
      "sequence_length": 12,
      "epochs": 100,
      "batch_size": 32
    }
  }
}
```

---

## 📝 Usage Examples

### Move Probability Prediction

```python
from ml.src.models.move_probability_model import MoveProbabilityModel
import pandas as pd

# Load model
model = MoveProbabilityModel()
model.load_model('./models/trained/move_probability')

# Prepare features
client_data = pd.DataFrame({
    'doc_access_count_30d': [15],
    'email_engagement_score': [0.8],
    'equity_percentage': [45],
    # ... other features
})

features = model.prepare_features(client_data)

# Predict
predictions, probabilities = model.predict(features)

print(f"Prediction: {predictions[0]}")
print(f"Probability: {probabilities[0]:.2f}")

# Get explanation
explanation = model.explain_prediction(features, instance_idx=0)
print(f"Top factors: {explanation['top_positive_factors']}")
```

### Transaction Type Classification

```python
from ml.src.models.transaction_type_model import TransactionTypeModel

model = TransactionTypeModel()
model.load_model('./models/trained/transaction_type')

# Predict with reasoning
results = model.predict_with_reasoning(features)

print(f"Transaction Type: {results['predicted_transaction_type'][0]}")
print(f"Confidence: {results['confidence'][0]:.2f}")
print(f"Probabilities: {results['prob_BUY'][0]:.2f}, {results['prob_SELL'][0]:.2f}")
```

### Contact Timing Optimization

```python
from ml.src.models.contact_timing_model import ContactTimingModel

model = ContactTimingModel()
model.load_models('./models/trained/contact_timing')

# Predict optimal time
recommendations = model.predict_optimal_time(
    features,
    client_timezone='America/Los_Angeles'
)

for rec in recommendations:
    print(f"Contact on {rec['day_of_week']} at {rec['hour_of_day']}:00")
    print(f"Channel: {rec['channel']}")
    print(f"Confidence: {rec['overall_confidence']:.2f}")
```

### Property Value Forecasting

```python
from ml.src.models.property_value_model import PropertyValueModel

model = PropertyValueModel(sequence_length=12)
model.load_model('./models/trained/property_value')

# Forecast future values
predictions, confidence_intervals = model.predict_future(
    X_last=last_sequence,
    n_months=6,
    return_confidence=True
)

# Generate report
report = model.create_forecast_report(
    current_value=750000,
    predictions=predictions,
    confidence_intervals=confidence_intervals,
    n_months=6
)

print(f"6-month forecast: ${report['summary']['final_predicted_value']:,.0f}")
print(f"Total appreciation: {report['summary']['total_appreciation_pct']:.2f}%")
```

---

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=ml/src --cov-report=html

# Run specific test suite
pytest tests/unit/
pytest tests/integration/
pytest tests/models/
```

---

## 📈 Monitoring

### MLflow UI

Access at `http://localhost:5000`

- View experiments
- Compare model versions
- Track metrics
- Manage model registry

### Model Monitoring

```python
from ml.src.monitoring.drift_detection import DriftDetector

detector = DriftDetector()
drift_report = detector.detect_drift(
    reference_data=train_df,
    current_data=production_df
)

if drift_report['drift_detected']:
    print("⚠️ Data drift detected - consider retraining")
```

---

## 🔄 Deployment

### Model Serving API

```bash
# Start API server
uvicorn ml.src.api.app:app --host 0.0.0.0 --port 8000

# Test endpoint
curl -X POST "http://localhost:8000/predict/move-probability" \
  -H "Content-Type: application/json" \
  -d '{"features": {...}}'
```

### Docker Deployment

```bash
# Build image
docker build -t roi-ml-models:latest .

# Run container
docker run -p 8000:8000 roi-ml-models:latest
```

---

## 📚 Documentation

- **[Model Specifications](docs/MODEL_SPECIFICATIONS.md)**: Comprehensive model documentation
- **[API Documentation](http://localhost:8000/docs)**: Interactive API docs (FastAPI)
- **[MLflow Documentation](https://mlflow.org/docs/latest/index.html)**: MLflow reference

---

## 🤝 Contributing

1. Create feature branch
2. Implement changes with tests
3. Run test suite
4. Submit pull request

---

## 📄 License

Proprietary - ROI Systems 2024

---

## 📞 Support

- **ML Team**: ml-team@roisystems.com
- **Documentation**: https://docs.roisystems.com/ml
- **Issues**: https://github.com/roisystems/ml-models/issues

---

## 🔍 Additional Resources

- [XGBoost Documentation](https://xgboost.readthedocs.io/)
- [LightGBM Documentation](https://lightgbm.readthedocs.io/)
- [TensorFlow/Keras Documentation](https://www.tensorflow.org/guide/keras)
- [MLflow Documentation](https://mlflow.org/docs/latest/index.html)
- [Scikit-learn Documentation](https://scikit-learn.org/stable/)

---

**Built with ❤️ by the ROI Systems ML Team**
