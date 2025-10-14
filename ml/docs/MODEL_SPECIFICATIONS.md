# ROI Systems Predictive Analytics Engine
## ML Models Specification & Documentation

**Version:** 1.0.0
**Last Updated:** October 2024
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Model Architecture](#model-architecture)
3. [Model 1: Move Probability Predictor](#model-1-move-probability-predictor)
4. [Model 2: Transaction Type Classifier](#model-2-transaction-type-classifier)
5. [Model 3: Contact Timing Optimizer](#model-3-contact-timing-optimizer)
6. [Model 4: Property Value Forecaster](#model-4-property-value-forecaster)
7. [Training Pipeline](#training-pipeline)
8. [Evaluation Framework](#evaluation-framework)
9. [Deployment Strategy](#deployment-strategy)
10. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Overview

The ROI Systems Predictive Analytics Engine comprises four specialized machine learning models designed to predict client behavior, optimize engagement, and forecast real estate market trends.

### Business Objectives

- **Increase Client Retention**: Predict and prevent client churn through proactive engagement
- **Maximize Transaction Success**: Identify transaction opportunities and optimize timing
- **Optimize Communication**: Deliver the right message through the right channel at the right time
- **Provide Market Intelligence**: Accurate property value forecasts for strategic planning

### Technical Stack

- **Languages**: Python 3.8+
- **ML Frameworks**: XGBoost, LightGBM, Random Forest, TensorFlow/Keras
- **MLOps**: MLflow, Apache Airflow
- **Infrastructure**: AWS (SageMaker, RDS PostgreSQL, S3, Lambda)
- **Serving**: FastAPI REST APIs

---

## Model Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Data Ingestion Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ User     │  │Document  │  │ Email    │  │ Market   │       │
│  │ Events   │  │ Access   │  │ Analytics│  │ Data     │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
└───────┼─────────────┼─────────────┼─────────────┼──────────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
        ┌─────────────▼──────────────┐
        │   Feature Engineering      │
        │   ┌──────────────────┐    │
        │   │ Transformers     │    │
        │   │ Aggregators      │    │
        │   │ Encoders         │    │
        │   │ Scalers          │    │
        │   └──────────────────┘    │
        └─────────────┬──────────────┘
                      │
        ┌─────────────▼──────────────────────────────┐
        │           Model Training                    │
        │  ┌────────────┐  ┌────────────┐           │
        │  │ Move Prob  │  │ Trans Type │           │
        │  │ (XGBoost)  │  │ (RF)       │           │
        │  └────────────┘  └────────────┘           │
        │  ┌────────────┐  ┌────────────┐           │
        │  │ Contact    │  │ Property   │           │
        │  │ Timing     │  │ Value      │           │
        │  │ (LightGBM) │  │ (LSTM)     │           │
        │  └────────────┘  └────────────┘           │
        └─────────────┬──────────────────────────────┘
                      │
        ┌─────────────▼──────────────┐
        │    Model Serving            │
        │  ┌──────────────────┐      │
        │  │ REST API         │      │
        │  │ (FastAPI)        │      │
        │  └──────────────────┘      │
        │  ┌──────────────────┐      │
        │  │ Batch Predictions│      │
        │  └──────────────────┘      │
        │  ┌──────────────────┐      │
        │  │ Model Registry   │      │
        │  │ (MLflow)         │      │
        │  └──────────────────┘      │
        └─────────────┬──────────────┘
                      │
        ┌─────────────▼──────────────┐
        │      Monitoring             │
        │  ┌──────────────────┐      │
        │  │ Performance      │      │
        │  │ Drift Detection  │      │
        │  │ Explainability   │      │
        │  └──────────────────┘      │
        └────────────────────────────┘
```

---

## Model 1: Move Probability Predictor

### Purpose
Predict the likelihood of a client moving (buying or selling) within 6-12 months.

### Algorithm
**XGBoost (Gradient Boosting)** - Binary Classification

### Features (28 total)

#### Behavioral Signals (6 features)
- `doc_access_count_30d`: Number of document accesses in last 30 days
- `email_engagement_score`: Composite email engagement metric (0-1)
- `property_search_frequency`: Search activity frequency
- `market_report_views_30d`: Market report engagement
- `portal_login_frequency_30d`: Login frequency
- `comparable_views_30d`: Property comparison activity

#### Property Factors (6 features)
- `years_owned`: Property ownership duration
- `equity_percentage`: Home equity as % of value
- `value_appreciation_pct`: YoY appreciation percentage
- `property_age_years`: Age of property
- `home_size_sqft`: Square footage
- `lot_size_sqft`: Lot size

#### Market Factors (6 features)
- `mortgage_rate_30y`: Current 30-year mortgage rate
- `mortgage_rate_trend`: Rate trend over 30 days
- `neighborhood_turnover_rate`: Local turnover percentage
- `inventory_levels_zip`: Inventory in ZIP code
- `median_price_zip`: Median price in area
- `days_on_market_avg_zip`: Average DOM in area

#### Transaction History (3 features)
- `months_since_last_transaction`: Time since last transaction
- `transaction_frequency_lifetime`: Historical transaction count
- `avg_ownership_duration_years`: Average ownership period

#### Lifecycle Indicators (4 features)
- `life_event_score`: Composite life event indicator
- `home_size_vs_household_size`: Size adequacy score
- `commute_distance_miles`: Commute distance
- `school_district_rating_change`: School rating changes

#### Financial Indicators (3 features)
- `debt_to_income_ratio`: DTI ratio
- `payment_to_income_ratio`: Monthly payment ratio
- `equity_growth_rate_annual`: Annual equity growth

### Model Configuration

```python
params = {
    'objective': 'binary:logistic',
    'eval_metric': 'auc',
    'max_depth': 6,
    'learning_rate': 0.1,
    'n_estimators': 200,
    'min_child_weight': 3,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'scale_pos_weight': 3,  # Handle class imbalance
    'gamma': 0.1,
    'reg_alpha': 0.1,
    'reg_lambda': 1.0
}
```

### Performance Targets

| Metric | Target | Achieved |
|--------|--------|----------|
| Accuracy | 85%+ | TBD |
| Precision | 80%+ | TBD |
| Recall | 75%+ | TBD |
| AUC-ROC | 0.90+ | TBD |

### Prediction Output

```python
{
    'prediction': 1,  # 0 = No move, 1 = Will move
    'probability': 0.87,
    'confidence_level': 'HIGH',
    'risk_category': 'CRITICAL',
    'top_factors': [
        {'feature': 'doc_access_count_30d', 'importance': 0.23},
        {'feature': 'equity_percentage', 'importance': 0.18},
        {'feature': 'life_event_score', 'importance': 0.15}
    ]
}
```

### Use Cases

1. **Proactive Engagement**: Identify clients likely to move for targeted outreach
2. **Resource Allocation**: Prioritize high-probability leads
3. **Churn Prevention**: Engage at-risk clients before they leave
4. **Marketing Campaigns**: Segment clients by move probability

---

## Model 2: Transaction Type Classifier

### Purpose
Predict the type of next transaction: BUY, SELL, REFINANCE, or HOLD.

### Algorithm
**Random Forest** - Multi-class Classification (4 classes)

### Features (42 total)

#### Financial Situation (8 features)
- `equity_percentage`: Current equity percentage
- `mortgage_balance`: Outstanding mortgage balance
- `mortgage_balance_ratio`: Balance to value ratio
- `refi_potential_savings_monthly`: Potential monthly savings
- `refi_potential_savings_pct`: Savings as percentage
- `debt_to_income_ratio`: Current DTI
- `credit_score`: Client credit score
- `cash_reserves_months`: Liquid reserves

#### Property Factors (8 features)
- `years_owned`: Ownership duration
- `property_value`: Current estimated value
- `property_value_appreciation_pct`: Appreciation rate
- `maintenance_cost_annual`: Annual maintenance costs
- `maintenance_cost_trend`: Maintenance cost trend
- `home_size_adequacy_score`: Size vs. needs score
- `bedrooms`: Number of bedrooms
- `bathrooms`: Number of bathrooms

#### Market Conditions (10 features)
- `mortgage_rate_30y`: 30-year rate
- `mortgage_rate_15y`: 15-year rate
- `mortgage_rate_trend_30d`: 30-day trend
- `mortgage_rate_trend_90d`: 90-day trend
- `inventory_levels_zip`: Local inventory
- `inventory_trend`: Inventory trend
- `median_price_zip`: Median area price
- `price_appreciation_forecast_6m`: 6-month forecast
- `price_appreciation_forecast_12m`: 12-month forecast

#### Behavioral Signals (7 features)
- `property_search_buy_frequency`: Buy-focused searches
- `property_search_sell_frequency`: Sell-focused searches
- `mortgage_calculator_usage_count`: Calculator usage
- `refi_calculator_usage_count`: Refi calculator usage
- `comparable_property_views_buy`: Buy comparables
- `comparable_property_views_sell`: Sell comparables
- `market_analysis_requests`: Analysis requests

#### Life Stage Indicators (7 features)
- `household_size`: Current household size
- `household_size_change`: Recent changes
- `household_income`: Current income
- `income_change_pct`: Income change percentage
- `job_location_change_distance`: Job relocation distance
- `life_event_indicators_composite`: Composite score
- `school_age_children_count`: Number of school-age children

#### Transaction History (4 features)
- `transactions_lifetime`: Total transactions
- `months_since_last_buy`: Time since last purchase
- `months_since_last_sell`: Time since last sale
- `months_since_last_refi`: Time since last refinance

### Model Configuration

```python
params = {
    'n_estimators': 500,
    'max_depth': 15,
    'min_samples_split': 10,
    'min_samples_leaf': 5,
    'max_features': 'sqrt',
    'class_weight': 'balanced',
    'random_state': 42,
    'oob_score': True,
    'bootstrap': True
}
```

### Performance Targets

| Metric | Target | Achieved |
|--------|--------|----------|
| Overall Accuracy | 80%+ | TBD |
| Per-class Precision | 75%+ | TBD |
| Per-class Recall | 70%+ | TBD |
| Macro F1 | 0.75+ | TBD |

### Prediction Output

```python
{
    'predicted_transaction_type': 'SELL',
    'confidence': 0.78,
    'confidence_level': 'HIGH',
    'probabilities': {
        'BUY': 0.05,
        'SELL': 0.78,
        'REFINANCE': 0.12,
        'HOLD': 0.05
    },
    'top_alternative': 'REFINANCE',
    'recommendation': 'Client likely to sell. Provide market analysis and seller services.'
}
```

### Use Cases

1. **Service Personalization**: Tailor services to expected transaction type
2. **Resource Planning**: Allocate appropriate resources (buyer/seller agents)
3. **Content Targeting**: Send relevant content (buyer guides vs. seller tips)
4. **Revenue Forecasting**: Predict transaction pipeline and revenue

---

## Model 3: Contact Timing Optimizer

### Purpose
Predict optimal day, time, and channel for client communication to maximize engagement.

### Algorithm
**LightGBM** - Multi-output Classification (3 models)
- Day Model: 7-class (Mon-Sun)
- Hour Model: 24-class (0-23 hours)
- Channel Model: 3-class (email, phone, sms)

### Features (36 total)

#### Historical Engagement Patterns (7 features)
- `avg_email_open_hour`: Average opening hour
- `std_email_open_hour`: Standard deviation of open times
- `most_active_day_of_week`: Most active day
- `weekend_engagement_ratio`: Weekend vs. weekday ratio
- `morning_engagement_ratio`: Morning engagement (6-12)
- `afternoon_engagement_ratio`: Afternoon engagement (12-18)
- `evening_engagement_ratio`: Evening engagement (18-24)

#### Recent Activity (6 features)
- `days_since_last_login`: Days since login
- `days_since_last_email_open`: Days since email open
- `days_since_last_phone_answer`: Days since phone answer
- `days_since_last_sms_response`: Days since SMS response
- `recent_engagement_trend`: Recent trend score
- `engagement_frequency_30d`: 30-day engagement frequency

#### Channel Preferences (5 features)
- `email_open_rate`: Historical email open rate
- `email_click_rate`: Historical click rate
- `phone_answer_rate`: Phone answer rate
- `sms_response_rate`: SMS response rate
- `preferred_channel_score`: Channel preference score

#### Cyclical Time Features (8 features)
- `day_of_week_sin`: Sine-encoded day
- `day_of_week_cos`: Cosine-encoded day
- `hour_of_day_sin`: Sine-encoded hour
- `hour_of_day_cos`: Cosine-encoded hour
- `day_of_month`: Day of month
- `is_holiday`: Holiday indicator
- `is_weekend`: Weekend indicator
- `is_business_hours`: Business hours indicator

#### Demographics and Context (5 features)
- `age_group`: Client age bracket
- `employment_status`: Employment type
- `timezone_offset`: Timezone offset
- `has_children`: Children indicator
- `property_stage`: Transaction stage

#### Behavioral Patterns (3 features)
- `typical_response_time_hours`: Average response time
- `prefers_immediate_contact`: Immediacy preference
- `engagement_consistency_score`: Consistency metric

### Model Configuration

```python
day_params = {
    'objective': 'multiclass',
    'num_class': 7,
    'metric': 'multi_logloss',
    'num_leaves': 31,
    'learning_rate': 0.05,
    'feature_fraction': 0.8,
    'bagging_fraction': 0.8,
    'bagging_freq': 5
}

hour_params = {
    'objective': 'multiclass',
    'num_class': 24,
    'metric': 'multi_logloss',
    'num_leaves': 31,
    'learning_rate': 0.05,
    'feature_fraction': 0.8,
    'bagging_fraction': 0.8,
    'bagging_freq': 5
}

channel_params = {
    'objective': 'multiclass',
    'num_class': 3,
    'metric': 'multi_logloss',
    'num_leaves': 31,
    'learning_rate': 0.05,
    'feature_fraction': 0.8,
    'bagging_fraction': 0.8,
    'bagging_freq': 5
}
```

### Performance Targets

| Metric | Target | Achieved |
|--------|--------|----------|
| Day Accuracy | 75%+ | TBD |
| Hour Accuracy | 75%+ | TBD |
| Channel Accuracy | 80%+ | TBD |
| Engagement Lift | 25%+ | TBD |

### Prediction Output

```python
{
    'next_contact_datetime': '2024-10-20T14:00:00-07:00',
    'day_of_week': 'Wednesday',
    'hour_of_day': 14,
    'time_period': 'afternoon',
    'channel': 'email',
    'overall_confidence': 0.82,
    'day_confidence': 0.85,
    'hour_confidence': 0.78,
    'channel_confidence': 0.83,
    'alternative_channels': [
        {'channel': 'phone', 'probability': 0.12},
        {'channel': 'sms', 'probability': 0.05}
    ]
}
```

### Use Cases

1. **Campaign Optimization**: Schedule campaigns at optimal times
2. **Sales Productivity**: Maximize agent contact success rates
3. **Channel Strategy**: Route communications through preferred channels
4. **Engagement Automation**: Automate optimal contact timing

---

## Model 4: Property Value Forecaster

### Purpose
Forecast property values for 3, 6, and 12-month horizons using time-series deep learning.

### Algorithm
**Bidirectional LSTM** with Attention - Time-series Regression

### Features (20 total per timestep)

#### Historical Property Values (1 feature)
- `property_value`: Historical monthly values

#### Market Indicators - ZIP Level (5 features)
- `median_price_zip`: Median ZIP price
- `inventory_level_zip`: Inventory levels
- `days_on_market_avg_zip`: Average days on market
- `sales_volume_zip`: Monthly sales volume
- `price_per_sqft_zip`: Price per square foot

#### Economic Indicators (4 features)
- `mortgage_rate_30y`: 30-year mortgage rate
- `mortgage_rate_15y`: 15-year mortgage rate
- `unemployment_rate_county`: County unemployment
- `gdp_growth_rate`: GDP growth rate

#### Seasonal Indicators (4 features)
- `month_sin`: Sine-encoded month
- `month_cos`: Cosine-encoded month
- `quarter`: Quarter (1-4)
- `is_peak_season`: Peak season indicator

#### Property Static Features (6 features)
- `square_footage`: Property square footage
- `bedrooms`: Number of bedrooms
- `bathrooms`: Number of bathrooms
- `property_age`: Age in years
- `lot_size_sqft`: Lot size

### Model Architecture

```python
model = Sequential([
    # First Bidirectional LSTM
    Bidirectional(LSTM(128, return_sequences=True)),
    Dropout(0.2),

    # Second Bidirectional LSTM
    Bidirectional(LSTM(64, return_sequences=True)),
    Dropout(0.2),

    # Attention Mechanism
    Attention(),

    # Third LSTM
    LSTM(32, return_sequences=False),
    Dropout(0.2),

    # Dense Layers
    Dense(32, activation='relu'),
    Dropout(0.1),
    Dense(16, activation='relu'),

    # Output
    Dense(1)
])

optimizer = Adam(learning_rate=0.001)
model.compile(optimizer=optimizer, loss='mse', metrics=['mae', 'mape'])
```

### Performance Targets

| Metric | Target | Achieved |
|--------|--------|----------|
| R² Score | 0.85+ | TBD |
| MAPE | <5% | TBD |
| RMSE | <$50K | TBD |
| MAE | <$30K | TBD |

### Prediction Output

```python
{
    'current_value': 750000,
    'forecast_horizon_months': 6,
    'forecasts': [
        {
            'month_ahead': 1,
            'predicted_value': 755000,
            'confidence_lower': 745000,
            'confidence_upper': 765000,
            'appreciation_pct': 0.67,
            'appreciation_dollars': 5000
        },
        # ... months 2-6
    ],
    'summary': {
        'final_predicted_value': 780000,
        'total_appreciation_pct': 4.0,
        'total_appreciation_dollars': 30000,
        'avg_monthly_appreciation_pct': 0.67,
        'forecast_trend': 'appreciating',
        'volatility': 8500
    }
}
```

### Use Cases

1. **Client Insights**: Provide value forecasts to clients
2. **Investment Strategy**: Identify appreciation opportunities
3. **Portfolio Management**: Monitor property value trends
4. **Market Analysis**: Understand market dynamics

---

## Training Pipeline

### Data Flow

```
Raw Data → Feature Engineering → Train/Val/Test Split → Model Training → Evaluation → Registry
```

### Pipeline Components

#### 1. Data Ingestion
- **Source**: PostgreSQL RDS
- **Format**: CSV, Parquet
- **Validation**: Great Expectations
- **Schedule**: Daily batch loads

#### 2. Feature Engineering
```python
class FeatureEngineer:
    def transform(self, df):
        # Temporal features
        df = self._add_cyclical_features(df)

        # Aggregations
        df = self._add_rolling_aggregates(df)

        # Encodings
        df = self._encode_categorical(df)

        return df
```

#### 3. Model Training
```bash
# Train all models
python -m ml.src.training.train_all_models --config config.json

# Train specific model
python -m ml.src.training.train_all_models --models move_probability

# Train and evaluate
python -m ml.src.training.train_all_models --evaluate
```

#### 4. MLflow Tracking
- Experiment tracking
- Parameter logging
- Metric logging
- Model versioning
- Artifact storage

#### 5. Model Registry
- Version control
- Staging → Production promotion
- A/B testing support
- Rollback capability

### Training Schedule

| Model | Training Frequency | Duration | Resources |
|-------|-------------------|----------|-----------|
| Move Probability | Weekly | ~1 hour | 8 CPU |
| Transaction Type | Weekly | ~1.5 hours | 8 CPU |
| Contact Timing | Daily | ~45 min | 8 CPU |
| Property Value | Daily | ~2 hours | 1 GPU |

---

## Evaluation Framework

### Evaluation Metrics

#### Classification Models
- Accuracy, Precision, Recall, F1
- AUC-ROC, AUC-PR
- Confusion Matrix
- Per-class metrics

#### Regression Models
- MSE, RMSE, MAE
- R², MAPE
- Residual analysis
- Prediction intervals

### Evaluation Tools

```python
from ml.src.evaluation.model_evaluation import ModelEvaluator

evaluator = ModelEvaluator(output_dir='./results')

# Evaluate classification
metrics = evaluator.evaluate_classification_model(
    y_true, y_pred, y_pred_proba,
    class_names=['No Move', 'Move'],
    model_name='move_probability'
)

# Evaluate regression
metrics = evaluator.evaluate_regression_model(
    y_true, y_pred,
    model_name='property_value'
)

# Compare models
comparison = evaluator.compare_models(
    model_results={'model1': metrics1, 'model2': metrics2},
    metric_name='accuracy'
)
```

### Quality Gates

All models must pass quality gates before deployment:

1. **Performance Thresholds**: Meet or exceed target metrics
2. **Data Quality**: Pass data validation checks
3. **Fairness**: No significant bias across protected attributes
4. **Stability**: Consistent performance across cross-validation folds
5. **Production Readiness**: Latency < 200ms, no errors

---

## Deployment Strategy

### Deployment Architecture

```
Training → Staging → Canary (5%) → Blue-Green (50%) → Full Production
```

### Deployment Steps

1. **Model Training**: Train on full dataset
2. **Validation**: Evaluate on held-out test set
3. **Staging**: Deploy to staging environment
4. **Integration Testing**: Test API endpoints
5. **Canary Deployment**: 5% of traffic
6. **Monitor**: Check performance for 24 hours
7. **Blue-Green**: Gradual rollout to 50%
8. **Full Production**: Complete rollout
9. **Monitoring**: Continuous performance tracking

### Model Serving

#### REST API (FastAPI)

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class PredictionRequest(BaseModel):
    features: dict

@app.post("/predict/move-probability")
async def predict_move(request: PredictionRequest):
    model = load_model('move_probability')
    prediction = model.predict(request.features)
    return {"prediction": prediction}
```

#### Batch Predictions

```python
from ml.src.models import MoveProbabilityModel

model = MoveProbabilityModel()
model.load_model('./models/trained/move_probability')

# Batch predict
predictions = model.predict(batch_df)
```

### Performance Requirements

- **Latency**: < 200ms (p95)
- **Throughput**: > 100 req/sec
- **Availability**: 99.9%
- **Error Rate**: < 0.1%

---

## Monitoring & Maintenance

### Monitoring Components

#### 1. Performance Monitoring
- Prediction accuracy tracking
- Latency monitoring
- Throughput metrics
- Error rates

#### 2. Data Drift Detection
```python
from evidently import ColumnDriftMetric
from evidently.report import Report

report = Report(metrics=[
    ColumnDriftMetric(column_name='feature1'),
    ColumnDriftMetric(column_name='feature2')
])

report.run(reference_data=train_df, current_data=production_df)
```

#### 3. Concept Drift Detection
- Monitor prediction distribution shifts
- Track label distribution changes
- Alert on significant drift (KS-test p-value < 0.05)

#### 4. Model Explainability
```python
import shap

explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X)

# Feature importance
shap.summary_plot(shap_values, X)
```

### Maintenance Schedule

| Task | Frequency | Owner |
|------|-----------|-------|
| Model Retraining | Weekly/Daily | ML Engineer |
| Performance Review | Weekly | Data Scientist |
| Drift Detection | Daily | MLOps |
| A/B Testing | Monthly | Product |
| Model Audit | Quarterly | ML Team |
| Documentation Update | Monthly | ML Engineer |

### Alerting

**Critical Alerts** (Page immediately)
- Model error rate > 1%
- API latency > 500ms (p95)
- Service downtime

**Warning Alerts** (Slack notification)
- Accuracy drop > 5%
- Data drift detected
- Feature distribution shifts

**Info Alerts** (Email)
- Weekly performance reports
- Training completion
- New model deployed

---

## Appendix

### A. Feature Engineering Techniques

1. **Cyclical Encoding**: Sin/cos transformation for temporal features
2. **Rolling Aggregations**: Moving averages, sums, counts
3. **One-Hot Encoding**: Categorical variable encoding
4. **Target Encoding**: Category to numeric mapping
5. **Normalization**: StandardScaler, MinMaxScaler

### B. Hyperparameter Tuning

Use Optuna for automated hyperparameter optimization:

```python
import optuna

def objective(trial):
    params = {
        'max_depth': trial.suggest_int('max_depth', 3, 10),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
        'n_estimators': trial.suggest_int('n_estimators', 50, 500)
    }

    model = XGBClassifier(**params)
    model.fit(X_train, y_train)
    score = accuracy_score(y_val, model.predict(X_val))

    return score

study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=100)
```

### C. Model Versioning

Models are versioned using semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes to API or model architecture
- **MINOR**: New features, improved performance
- **PATCH**: Bug fixes, minor improvements

### D. Data Requirements

**Minimum Data Requirements for Training:**

- Move Probability: 10,000+ labeled examples
- Transaction Type: 15,000+ examples (balanced classes)
- Contact Timing: 20,000+ engagement events
- Property Value: 12+ months of historical data per property

### E. Testing Strategy

```python
# Unit tests
pytest ml/tests/unit/

# Integration tests
pytest ml/tests/integration/

# Model tests
pytest ml/tests/models/

# Coverage report
pytest --cov=ml/src --cov-report=html
```

---

## Contact & Support

**ML Team**: ml-team@roisystems.com
**Documentation**: https://docs.roisystems.com/ml
**Issues**: https://github.com/roisystems/ml-models/issues

---

**End of Specification**
