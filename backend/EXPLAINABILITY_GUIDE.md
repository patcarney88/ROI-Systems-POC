# ML Model Explainability Guide

## Overview

This guide explains how to use the SHAP-based explainability system to understand and communicate model predictions.

## Table of Contents

1. [Architecture](#architecture)
2. [Quick Start](#quick-start)
3. [SHAP Explainer](#shap-explainer)
4. [Model Interpreter](#model-interpreter)
5. [Visualization Types](#visualization-types)
6. [API Integration](#api-integration)
7. [Best Practices](#best-practices)

## Architecture

```
┌─────────────────────────────────────────────┐
│           User Request                       │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      Model Interpreter Service              │
│  • User-level selection                     │
│  • Narrative generation                     │
│  • Feature translation                      │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         SHAP Explainer                      │
│  • TreeExplainer (tree models)              │
│  • DeepExplainer (neural nets)              │
│  • KernelExplainer (model-agnostic)         │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│    Trained ML Model                         │
│  • GradientBoosting                         │
│  • RandomForest                             │
│  • XGBoost, etc.                            │
└─────────────────────────────────────────────┘
```

## Quick Start

### 1. Initialize SHAP Explainer

```python
from ml.explainability.shap_explainer import SHAPExplainer
from ml.alert_model import AlertScoringModel

# Load your trained model
model = AlertScoringModel('move_probability')
model.load_model('models/move_probability_v1.pkl')

# Initialize SHAP explainer
explainer = SHAPExplainer(model.model, model_type='tree')

# Initialize with background data (sample from training set)
explainer.initialize_explainer(
    X_background=X_train_sample,
    feature_names=model.feature_names,
    max_samples=100
)
```

### 2. Explain a Single Prediction

```python
# Get prediction
features = model.engineer_features(signals, user_features)

# Generate explanation
explanation = explainer.explain_prediction(
    features,
    feature_names=model.feature_names
)

# View top contributing features
for feature in explanation['top_features']:
    print(f"{feature['feature']}: {feature['shap_value']:+.4f} ({feature['impact']})")
```

### 3. Generate User-Friendly Explanation

```python
from ml.explainability.model_interpreter import ModelInterpreter

# Initialize interpreter
interpreter = ModelInterpreter(
    model=model.model,
    model_type='tree',
    feature_names=model.feature_names,
    model_name='move_probability'
)

interpreter.initialize(X_train_sample)

# Generate explanation
prediction_data = {
    'features': features,
    'predicted_value': 0.78,
    'confidence': 0.75,
    'type': 'move_probability'
}

explanation = interpreter.explain_to_user(
    prediction_data,
    user_level='non_technical'  # or 'technical' or 'detailed'
)

print(explanation['summary'])
```

## SHAP Explainer

### Supported Model Types

1. **Tree-based Models** (`model_type='tree'`)
   - GradientBoostingClassifier
   - RandomForestClassifier
   - XGBoost, LightGBM
   - Fast and exact

2. **Deep Learning** (`model_type='deep'`)
   - TensorFlow/Keras models
   - PyTorch models
   - Requires background data

3. **Linear Models** (`model_type='linear'`)
   - LogisticRegression
   - LinearRegression
   - Ridge, Lasso, ElasticNet

4. **Model-Agnostic** (`model_type='kernel'`)
   - Any model with predict/predict_proba
   - Slower but works for any model

### Explanation Components

**SHAP Values**: Individual feature contributions to the prediction
- Positive SHAP: Feature increases prediction
- Negative SHAP: Feature decreases prediction
- Magnitude: Strength of contribution

**Base Value**: Expected model output (average prediction)

**Prediction**: Base value + sum of SHAP values

### Example Explanation Structure

```json
{
  "base_value": 0.45,
  "predicted_value": 0.78,
  "shap_values_sum": 0.33,
  "top_features": [
    {
      "feature": "doc_access_count_30d",
      "value": 15.0,
      "shap_value": 0.12,
      "impact": "increases",
      "impact_percent": 36.4
    },
    {
      "feature": "email_engagement_score",
      "value": 0.85,
      "shap_value": 0.08,
      "impact": "increases",
      "impact_percent": 24.2
    }
  ]
}
```

## Model Interpreter

### User Levels

#### 1. Non-Technical (`user_level='non_technical'`)

**Best for**: End-users, clients, non-technical stakeholders

**Example Output**:
```
🎯 High Likelihood of Moving (78%)

This client shows strong indicators of planning a move in the next 6-12 months.
Our analysis suggests this is a high-priority opportunity.

What's driving this assessment:
1. High recent engagement with property documents (↗️ increases likelihood by 36.4%)
2. Strong email interaction indicates interest (↗️ increases likelihood by 24.2%)
3. Frequently checking property value (↗️ increases likelihood by 15.8%)
```

#### 2. Technical (`user_level='technical'`)

**Best for**: Data analysts, technical team members

**Example Output**:
```
Model Output
- Prediction: 0.7800
- Confidence: 0.7500
- Base value: 0.4500
- SHAP sum: 0.3300

Top Feature Contributions (SHAP)
1. doc_access_count_30d: +0.1200 (36.4%)
2. email_engagement_score: +0.0800 (24.2%)
3. value_check_count: +0.0520 (15.8%)
4. years_owned: +0.0450 (13.6%)
5. property_search_frequency: +0.0330 (10.0%)
```

#### 3. Detailed (`user_level='detailed'`)

**Best for**: ML engineers, researchers, debugging

Includes all features, SHAP values, model metadata, and comprehensive analysis.

### Feature Translation

The interpreter automatically translates technical feature names to user-friendly descriptions:

```python
# Technical feature -> User-friendly description
'doc_access_count_30d' -> "High recent engagement with property documents"
'email_engagement_score' -> "Strong email interaction indicates interest"
'years_owned' -> "Length of homeownership suggests lifecycle timing"
```

## Visualization Types

### 1. Force Plot

Shows how each feature pushes prediction from base value:

```python
explainer.generate_force_plot(
    X_instance=features,
    output_path='explanations/force_plot.png'
)
```

**Use case**: Individual prediction explanation

### 2. Summary Plot

Shows feature importance and distributions across dataset:

```python
explainer.generate_summary_plot(
    X_test=X_test,
    output_path='explanations/summary_plot.png',
    max_display=20
)
```

**Use case**: Global feature importance, model behavior understanding

### 3. Waterfall Plot

Shows cumulative feature contributions:

```python
explainer.generate_waterfall_plot(
    X_instance=features,
    output_path='explanations/waterfall_plot.png',
    max_display=10
)
```

**Use case**: Step-by-step prediction breakdown

### 4. Dependence Plot

Shows interaction effects between features:

```python
explainer.generate_dependence_plot(
    X_test=X_test,
    feature_idx=0,  # Feature to plot
    interaction_idx=5,  # Interaction feature
    output_path='explanations/dependence_plot.png'
)
```

**Use case**: Understanding feature interactions

## API Integration

### REST API Example

```typescript
// Explain prediction endpoint
app.post('/api/ml/explain', async (req, res) => {
  const { modelName, features, userLevel } = req.body;

  const explanation = await mlDashboardService.explainPrediction(
    modelName,
    features,
    userLevel
  );

  res.json(explanation);
});
```

### Frontend Integration

```typescript
// Request explanation
const getExplanation = async (prediction) => {
  const response = await fetch('/api/ml/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelName: 'move_probability',
      features: prediction.features,
      userLevel: 'non_technical'
    })
  });

  return response.json();
};
```

## Best Practices

### 1. Background Data Selection

- **Size**: 100-200 samples (balance between accuracy and speed)
- **Representativeness**: Include diverse examples from training data
- **Stratification**: Ensure all classes/ranges represented

```python
# Good: Stratified sampling
from sklearn.model_selection import train_test_split

X_background, _ = train_test_split(
    X_train,
    train_size=100,
    stratify=y_train,
    random_state=42
)
```

### 2. Performance Optimization

- **Cache explanations** for repeated predictions
- **Batch processing** for multiple explanations
- **Use TreeExplainer** for tree models (fastest)
- **Pre-compute** feature importance periodically

### 3. Explanation Quality

- **Validate**: Check that SHAP values sum to (prediction - base_value)
- **Context**: Provide domain-specific feature descriptions
- **Simplify**: Group related features for non-technical users
- **Visualize**: Use plots for better understanding

### 4. User Communication

- **Match audience**: Choose appropriate user level
- **Focus on impact**: Highlight most important features
- **Provide actionable insights**: Explain what features mean
- **Be transparent**: Show confidence levels

### 5. Error Handling

```python
try:
    explanation = explainer.explain_prediction(features)
except Exception as e:
    logger.error(f"Explanation failed: {e}")
    # Provide fallback explanation
    explanation = generate_fallback_explanation(prediction)
```

## Troubleshooting

### Issue: SHAP values don't sum correctly

**Solution**: Check model compatibility and background data quality

### Issue: Slow explanation generation

**Solution**:
- Reduce background data size
- Switch to TreeExplainer for tree models
- Batch process explanations

### Issue: Confusing feature names

**Solution**: Update feature translation dictionary in ModelInterpreter

### Issue: Memory errors

**Solution**:
- Reduce background data size
- Process in batches
- Use model-specific explainers (not Kernel)

## Advanced Usage

### Custom Feature Importance Metrics

```python
# Global feature importance
feature_importance = explainer.get_global_feature_importance(
    X_test=X_validation,
    feature_names=model.feature_names
)

# Top 10 features
for feature, importance in feature_importance[:10]:
    print(f"{feature}: {importance:.4f}")
```

### Batch Explanations

```python
from ml.explainability.shap_explainer import batch_explain_predictions

explanations = batch_explain_predictions(
    explainer=explainer,
    X_data=X_test,
    feature_names=model.feature_names,
    batch_size=100
)
```

### Saving Explanations

```python
explainer.save_explanations(
    explanations=explanations,
    output_path='explanations/batch_results.json'
)
```

## Resources

- [SHAP Documentation](https://shap.readthedocs.io/)
- [SHAP Paper](https://arxiv.org/abs/1705.07874)
- [Interpretable ML Book](https://christophm.github.io/interpretable-ml-book/)

## Support

For questions or issues:
- Check logs in `backend/logs/ml_explainability.log`
- Review example notebooks in `backend/notebooks/`
- Contact ML team
