# ML Model Monitoring Guide

## Overview

Comprehensive guide for monitoring ML model health, detecting drift, and maintaining production model quality.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Quick Start](#quick-start)
3. [Health Checks](#health-checks)
4. [Drift Detection](#drift-detection)
5. [Automated Retraining](#automated-retraining)
6. [Alerting System](#alerting-system)
7. [Dashboard Integration](#dashboard-integration)
8. [Best Practices](#best-practices)

## System Architecture

```
┌─────────────────────────────────────────────┐
│       Production ML Models                  │
│  • move_probability                         │
│  • transaction_type                         │
│  • contact_timing                           │
│  • property_value                           │
└─────────────────┬───────────────────────────┘
                  │ Predictions
                  ▼
┌─────────────────────────────────────────────┐
│      Model Monitor (Continuous)             │
│  ├─ Performance Degradation                 │
│  ├─ Data Drift Detection                    │
│  ├─ Prediction Drift                        │
│  ├─ Latency Monitoring                      │
│  ├─ Error Rate Tracking                     │
│  └─ Data Quality Checks                     │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌──────────────┐    ┌──────────────────┐
│Alert System  │    │ Auto-Retraining  │
│• Slack       │    │ • Trigger Logic  │
│• Email       │    │ • Data Fetch     │
│• PagerDuty   │    │ • Model Train    │
└──────────────┘    │ • Validation     │
                    │ • Deployment     │
                    └──────────────────┘
```

## Quick Start

### 1. Initialize Model Monitor

```python
from ml.monitoring.model_monitor import ModelMonitor

# Initialize monitor
monitor = ModelMonitor(
    model_name='move_probability',
    db_connection=db,
    alert_config={
        'accuracy_drop': 0.05,
        'drift_score': 0.3,
        'latency_spike': 2.0,
        'error_rate': 0.05
    }
)

# Run health check
health_report = monitor.check_model_health()

print(f"Overall Health: {health_report['overall_health']:.1f}%")
```

### 2. Setup Automated Retraining

```python
from ml.retraining.auto_retrain import AutoRetrainingSystem
from ml.alert_model import AlertScoringModel

# Initialize trainer
trainer = AlertScoringModel('move_probability')

# Initialize auto-retraining
auto_retrain = AutoRetrainingSystem(monitor, trainer)

# Schedule daily checks at 2 AM
auto_retrain.schedule_retraining_checks(interval_hours=24)

print("Automated retraining scheduled")
```

### 3. Monitor via Dashboard

```typescript
import MLDashboardService from './services/ml-dashboard.service';

const dashboard = new MLDashboardService();

// Get comprehensive metrics
const metrics = await dashboard.getDashboardMetrics('7d');

console.log(`Total Predictions: ${metrics.totalPredictions}`);
console.log(`Average Confidence: ${metrics.avgConfidence}`);
console.log(`Active Alerts: ${metrics.activeAlerts.length}`);
```

## Health Checks

### Health Check Components

#### 1. Performance Degradation

**Monitors**: Accuracy, precision, recall, F1-score, AUC

**Alert Trigger**: Accuracy drops by more than 5%

```python
performance_check = health_report['checks']['performance']

if performance_check['alert']:
    print(f"⚠️ Performance degraded:")
    print(f"  Current: {performance_check['recent_accuracy']:.3f}")
    print(f"  Baseline: {performance_check['baseline_accuracy']:.3f}")
    print(f"  Drop: {performance_check['accuracy_drop']*100:.1f}%")
```

**Causes**:
- Data distribution changes
- Feature engineering issues
- Model staleness
- Data quality degradation

**Actions**:
- Investigate recent data changes
- Check feature distributions
- Consider model retraining
- Review data collection pipeline

#### 2. Data Drift Detection

**Monitors**: Feature distribution changes using KL divergence and KS test

**Alert Trigger**: KL divergence > 0.3 for any feature

```python
drift_check = health_report['checks']['data_drift']

if drift_check['alert']:
    print(f"⚠️ Data drift detected:")
    for feature in drift_check['drifted_features']:
        print(f"  • {feature['feature']}: KL={feature['kl_divergence']:.3f}")
```

**Causes**:
- Market changes
- User behavior shifts
- Data collection changes
- Seasonality effects

**Actions**:
- Analyze drifted features
- Update feature engineering
- Retrain with recent data
- Review business context

#### 3. Prediction Drift

**Monitors**: Prediction distribution changes

**Alert Trigger**: KS test p-value < 0.05

```python
pred_drift = health_report['checks']['prediction_drift']

if pred_drift['alert']:
    print(f"⚠️ Prediction drift detected:")
    print(f"  KS statistic: {pred_drift['ks_statistic']:.3f}")
    print(f"  p-value: {pred_drift['p_value']:.4f}")
    print(f"  Mean shift: {pred_drift['mean_shift']:+.3f}")
```

**Causes**:
- Input distribution changes
- Model behavior changes
- External factors

**Actions**:
- Investigate prediction patterns
- Compare with business metrics
- Check for systematic biases

#### 4. Latency Monitoring

**Monitors**: Prediction response times (avg, p50, p95, p99, max)

**Alert Trigger**: Average latency increases by 2x

```python
latency_check = health_report['checks']['latency']

if latency_check['alert']:
    print(f"⚠️ Latency spike detected:")
    print(f"  Average: {latency_check['avg_latency_ms']:.1f}ms")
    print(f"  P95: {latency_check['p95_latency_ms']:.1f}ms")
    print(f"  Spike ratio: {latency_check['latency_spike_ratio']:.1f}x")
```

**Causes**:
- Increased load
- Resource constraints
- Model complexity
- Infrastructure issues

**Actions**:
- Check system resources
- Optimize model inference
- Scale infrastructure
- Review recent changes

#### 5. Error Rate Tracking

**Monitors**: Prediction failures and errors

**Alert Trigger**: Error rate > 5%

```python
error_check = health_report['checks']['error_rate']

if error_check['alert']:
    print(f"⚠️ High error rate:")
    print(f"  Rate: {error_check['error_rate']*100:.1f}%")
    print(f"  Count: {error_check['error_count']}")
    print(f"  Types: {error_check['error_types']}")
```

**Causes**:
- Input validation issues
- Model loading failures
- Feature engineering errors
- Data quality problems

**Actions**:
- Review error logs
- Check input validation
- Verify model integrity
- Fix data pipeline issues

#### 6. Data Quality Checks

**Monitors**: Missing values, outliers, invalid ranges

**Alert Trigger**: Any quality issues detected

```python
quality_check = health_report['checks']['data_quality']

if quality_check['alert']:
    print(f"⚠️ Data quality issues:")
    for issue in quality_check['quality_issues']:
        print(f"  • {issue['type']} in {issue['feature']}: {issue['percentage']:.1f}%")
```

**Causes**:
- Data collection issues
- ETL pipeline problems
- Source system changes

**Actions**:
- Fix data pipeline
- Add validation rules
- Improve data quality
- Update monitoring

### Health Score Calculation

```python
# Weighted health score (0-100)
weights = {
    'performance': 0.30,      # Most important
    'data_drift': 0.25,
    'prediction_drift': 0.20,
    'latency': 0.10,
    'error_rate': 0.10,
    'data_quality': 0.05
}

overall_health = sum(check_score * weight for check, weight in weights.items())
```

**Health Levels**:
- **90-100**: Excellent - No action needed
- **70-89**: Good - Monitor closely
- **50-69**: Fair - Investigation recommended
- **0-49**: Poor - Immediate attention required

## Drift Detection

### Statistical Tests

#### 1. KL Divergence

**What**: Measures difference between probability distributions

**Formula**: `KL(P || Q) = Σ P(x) * log(P(x) / Q(x))`

**Interpretation**:
- 0: Identical distributions
- < 0.1: Small drift
- 0.1-0.3: Moderate drift
- \> 0.3: Significant drift (alert)

**Use case**: Feature distribution monitoring

#### 2. Kolmogorov-Smirnov Test

**What**: Tests if two samples come from same distribution

**Output**: (statistic, p-value)

**Interpretation**:
- p > 0.05: Same distribution (no drift)
- p < 0.05: Different distributions (drift detected)

**Use case**: Prediction drift detection

### Drift Handling Strategies

#### Strategy 1: Immediate Retraining

**When**: Critical features drifted, performance degraded

```python
if drift_severity == 'high' and performance_drop > 0.1:
    auto_retrain.trigger_retraining(
        model_name,
        reasons=['severe_drift', 'performance_degradation']
    )
```

#### Strategy 2: Feature Engineering Update

**When**: Specific features consistently drift

```python
if len(drifted_features) > 5:
    # Update feature engineering
    update_feature_definitions(drifted_features)
    retrain_with_new_features()
```

#### Strategy 3: Monitoring Period Extension

**When**: Minor drift, stable performance

```python
if drift_severity == 'low' and performance_stable:
    # Increase monitoring frequency
    monitor.check_interval_hours = 6  # Every 6 hours
```

## Automated Retraining

### Retraining Triggers

```python
retrain_triggers = {
    'performance_drop': 0.05,       # 5% accuracy drop
    'drift_detected': True,          # Any drift alert
    'days_since_training': 30,      # Model age
    'min_new_data_points': 1000,    # Sufficient new data
    'error_rate_threshold': 0.10    # 10% error rate
}
```

### Retraining Workflow

```
1. Trigger Detection
   ├─ Performance check
   ├─ Drift assessment
   ├─ Data availability
   └─ Error rate review

2. Data Preparation
   ├─ Fetch new training data
   ├─ Validate data quality
   ├─ Feature engineering
   └─ Train/test split

3. Model Training
   ├─ Train new model
   ├─ Hyperparameter tuning
   ├─ Cross-validation
   └─ Performance evaluation

4. Validation
   ├─ Compare to baseline
   ├─ Check minimum thresholds
   ├─ A/B testing (optional)
   └─ Approve/reject

5. Deployment
   ├─ Save new model
   ├─ Update model registry
   ├─ Gradual rollout
   └─ Monitor closely
```

### Manual Retraining

```python
# Check if retraining needed
needs_retrain, reasons = auto_retrain.check_retrain_needed('move_probability')

if needs_retrain:
    print(f"Retraining recommended: {reasons}")

    # Trigger manually
    job_id = auto_retrain.trigger_retraining(
        'move_probability',
        reasons,
        async_mode=True
    )

    print(f"Retraining job started: {job_id}")
```

### Retraining History

```python
# Get recent retraining jobs
history = auto_retrain.get_retraining_history(limit=10)

for job in history:
    print(f"{job['triggered_at']}: {job['model_name']}")
    print(f"  Status: {job['status']}")
    print(f"  Reasons: {', '.join(job['reasons'])}")
    if job['status'] == 'completed':
        print(f"  Accuracy: {job['metrics']['accuracy']:.3f}")
```

## Alerting System

### Alert Severity Levels

**High**: Immediate attention required
- Accuracy drop > 10%
- Error rate > 10%
- Multiple critical issues

**Medium**: Investigation recommended
- Accuracy drop 5-10%
- Drift detected
- Latency spike

**Low**: Informational
- Minor performance changes
- Single feature drift
- Non-critical warnings

### Alert Channels

#### Slack Integration

```python
def send_slack_alert(alert: Dict):
    webhook_url = os.getenv('SLACK_WEBHOOK_URL')

    message = {
        'text': f"🚨 ML Alert: {alert['message']}",
        'attachments': [{
            'color': 'danger' if alert['severity'] == 'high' else 'warning',
            'fields': [
                {'title': 'Model', 'value': alert['model_name'], 'short': True},
                {'title': 'Check', 'value': alert['check'], 'short': True},
                {'title': 'Severity', 'value': alert['severity'], 'short': True}
            ]
        }]
    }

    requests.post(webhook_url, json=message)
```

#### Email Notifications

```python
def send_email_alert(alert: Dict):
    subject = f"ML Alert: {alert['model_name']} - {alert['severity'].upper()}"

    body = f"""
    Model Health Alert

    Model: {alert['model_name']}
    Check: {alert['check']}
    Severity: {alert['severity']}

    Message: {alert['message']}

    Timestamp: {alert['timestamp']}

    Details: {json.dumps(alert['details'], indent=2)}
    """

    send_email(to=ML_TEAM_EMAIL, subject=subject, body=body)
```

## Dashboard Integration

### Backend API

```typescript
// Health status endpoint
app.get('/api/ml/health', async (req, res) => {
  const models = ['move_probability', 'transaction_type', 'contact_timing', 'property_value'];
  const health = await mlDashboard.getModelHealthScores();

  res.json(health);
});

// Trigger retraining
app.post('/api/ml/retrain/:model', async (req, res) => {
  const { model } = req.params;
  const { reason } = req.body;

  const result = await mlDashboard.triggerRetraining(model, reason);

  res.json(result);
});
```

### Frontend Components

```typescript
// Health Dashboard Component
const HealthDashboard = () => {
  const [health, setHealth] = useState<ModelHealthScores>({});

  useEffect(() => {
    const fetchHealth = async () => {
      const response = await fetch('/api/ml/health');
      const data = await response.json();
      setHealth(data);
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="health-dashboard">
      {Object.entries(health).map(([model, status]) => (
        <ModelHealthCard key={model} model={model} status={status} />
      ))}
    </div>
  );
};
```

## Best Practices

### 1. Baseline Management

**Establish Baselines**:
- Train on representative data
- Document baseline metrics
- Store baseline distributions
- Update periodically

**Update Strategy**:
- Quarterly baseline refresh
- After major model updates
- When business context changes

### 2. Monitoring Frequency

**Real-time**: Latency, error rate
**Hourly**: Prediction patterns
**Daily**: Performance metrics, drift
**Weekly**: Comprehensive health check
**Monthly**: Baseline updates

### 3. Alert Tuning

**Avoid Alert Fatigue**:
- Set appropriate thresholds
- Group related alerts
- Use severity levels
- Implement cool-down periods

**Alert Validation**:
- Track false positives
- Adjust thresholds
- Review alert effectiveness

### 4. Data Storage

**Store**:
- All predictions with timestamps
- Feature values
- Model versions
- Feedback/ground truth
- Performance metrics
- Alert history

**Retention**:
- Raw data: 90 days
- Aggregated metrics: 1 year
- Model artifacts: All versions

### 5. Incident Response

**Response Plan**:
1. Alert received
2. Assess severity
3. Investigate root cause
4. Apply temporary fix
5. Implement permanent solution
6. Document incident
7. Update monitoring

## Troubleshooting

### Issue: False Drift Alerts

**Causes**: Natural variation, seasonality, small samples

**Solutions**:
- Increase monitoring window
- Adjust thresholds
- Add seasonality handling
- Increase minimum sample size

### Issue: Missed Performance Degradation

**Causes**: Insufficient feedback data, delayed labels

**Solutions**:
- Implement feedback collection
- Use proxy metrics
- Reduce monitoring interval
- Add business metric correlation

### Issue: Frequent Retraining

**Causes**: Overly sensitive triggers, unstable data

**Solutions**:
- Review trigger thresholds
- Investigate data stability
- Add retraining cool-down
- Use ensemble models

## Support & Resources

**Logs**: `backend/logs/ml_monitoring.log`

**Metrics Dashboard**: `/admin/ml/dashboard`

**Alert History**: `/admin/ml/alerts`

**Documentation**: `/docs/ml/`

**Contact**: ML Engineering Team
