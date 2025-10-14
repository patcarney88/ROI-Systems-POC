# Feature Catalog

Comprehensive catalog of all ML features in the ROI Systems Predictive Analytics Engine.

## Overview

This catalog documents all engineered features used across ML models in the platform. Features are organized by category and include computation methods, data types, validation rules, and typical use cases.

## Feature Categories

- **Behavioral Features**: User interaction patterns and engagement metrics
- **Property Features**: Real estate property characteristics and financial data
- **Transactional Features**: Historical transaction patterns
- **Market Features**: External market conditions and economic indicators
- **Temporal Features**: Time-based cyclical patterns

---

## Behavioral Features

### Document Access Patterns

| Feature Name | Data Type | Description | Computation Method | Validation |
|--------------|-----------|-------------|-------------------|------------|
| `doc_access_count_7d` | Integer | Number of documents accessed in last 7 days | Count DISTINCT document_id from access logs | >= 0, <= 1000 |
| `doc_access_count_30d` | Integer | Number of documents accessed in last 30 days | Count DISTINCT document_id from access logs | >= 0, <= 5000 |
| `doc_download_count_7d` | Integer | Document downloads in last 7 days | Count DOWNLOAD actions | >= 0, <= 500 |
| `unique_docs_accessed_30d` | Integer | Unique documents accessed in 30 days | Count DISTINCT documents | >= 0, <= 1000 |
| `last_doc_access_days_ago` | Integer | Days since last document access | Current date - MAX(access_date) | >= 0, <= 365 |
| `avg_docs_per_session` | Float | Average documents accessed per session | Total docs / session count | >= 0, <= 50 |

**Importance**: High for engagement prediction models
**Update Frequency**: Daily
**Null Handling**: Default to 0 if no activity

### Email Engagement

| Feature Name | Data Type | Description | Computation Method | Validation |
|--------------|-----------|-------------|-------------------|------------|
| `email_open_rate_30d` | Float | Email open rate in last 30 days | Opens / Sent emails | >= 0, <= 1.0 |
| `email_click_rate_30d` | Float | Email click-through rate | Clicks / Sent emails | >= 0, <= 1.0 |
| `emails_opened_last_7d` | Integer | Emails opened in last 7 days | Count opened=true | >= 0, <= 100 |
| `emails_clicked_last_7d` | Integer | Emails with clicks in last 7 days | Count clicked=true | >= 0, <= 100 |
| `days_since_last_email_open` | Integer | Days since last email open | Current date - MAX(opened_at) | >= 0, <= 365 |
| `campaign_engagement_score` | Float | Composite engagement score | Weighted average of opens, clicks, actions | >= 0, <= 1.0 |

**Importance**: Critical for email timing optimization
**Update Frequency**: Daily
**Dependencies**: Requires email tracking data

### Platform Engagement

| Feature Name | Data Type | Description | Computation Method | Validation |
|--------------|-----------|-------------|-------------------|------------|
| `login_count_7d` | Integer | Login count in last 7 days | Count LOGIN actions | >= 0, <= 100 |
| `login_count_30d` | Integer | Login count in last 30 days | Count LOGIN actions | >= 0, <= 500 |
| `avg_session_duration_minutes` | Float | Average session duration | AVG(last_activity - created_at) / 60 | >= 0, <= 480 |
| `pages_per_session` | Float | Average pages viewed per session | Total page views / sessions | >= 0, <= 200 |
| `days_since_last_login` | Integer | Days since last login | Current date - MAX(login_date) | >= 0, <= 365 |
| `weekend_usage_ratio` | Float | Ratio of weekend to weekday usage | Weekend logins / Weekday logins | >= 0, <= 10 |

**Importance**: Medium for churn prediction
**Update Frequency**: Daily
**Note**: Session duration calculated from audit logs

### Alert Interaction

| Feature Name | Data Type | Description | Computation Method | Validation |
|--------------|-----------|-------------|-------------------|------------|
| `alerts_viewed_30d` | Integer | Alerts viewed in last 30 days | Count alert views | >= 0, <= 200 |
| `alerts_dismissed_30d` | Integer | Alerts dismissed without action | Count dismissals | >= 0, <= 200 |
| `alerts_acted_upon_30d` | Integer | Alerts with user action | Count conversions | >= 0, <= 100 |
| `alert_response_time_avg_hours` | Float | Average time to respond to alerts | AVG(action_time - created_time) | >= 0, <= 720 |

**Importance**: High for alert routing optimization
**Update Frequency**: Daily
**Dependencies**: Alert tracking system

### Search & Browse Behavior

| Feature Name | Data Type | Description | Computation Method | Validation |
|--------------|-----------|-------------|-------------------|------------|
| `property_searches_30d` | Integer | Property searches in last 30 days | Count search queries | >= 0, <= 500 |
| `market_report_views_30d` | Integer | Market report views | Count report accesses | >= 0, <= 100 |
| `saved_searches_count` | Integer | Number of saved searches | Count active saved searches | >= 0, <= 50 |
| `price_range_searches` | Integer | Searches with price filters | Count queries with price range | >= 0, <= 500 |

**Importance**: Medium for transaction type prediction
**Update Frequency**: Daily

---

## Property Features

### Property Characteristics

| Feature Name | Data Type | Description | Source | Validation |
|--------------|-----------|-------------|--------|------------|
| `property_age_years` | Integer | Age of property in years | Purchase date or build year | >= 0, <= 200 |
| `square_footage` | Integer | Total square footage | Property records | >= 100, <= 50000 |
| `bedrooms` | Integer | Number of bedrooms | Property records | >= 0, <= 20 |
| `bathrooms` | Float | Number of bathrooms | Property records | >= 0, <= 20 |
| `lot_size` | Integer | Lot size in square feet | Property records | >= 0, <= 1000000 |
| `property_type` | Categorical | Type of property | Property records | {SINGLE_FAMILY, CONDO, TOWNHOUSE, MULTI_FAMILY} |
| `has_pool` | Boolean | Property has pool | Property features | true/false |
| `has_garage` | Boolean | Property has garage | Property features | true/false |

**Importance**: High for property value prediction
**Update Frequency**: Static (or on property update)
**Source**: Property management system

### Financial

| Feature Name | Data Type | Description | Computation Method | Validation |
|--------------|-----------|-------------|-------------------|------------|
| `current_value` | Float | Current estimated property value | Latest valuation or estimate | >= 0 |
| `purchase_price` | Float | Original purchase price | Transaction records | >= 0 |
| `value_appreciation_pct` | Float | Percentage value appreciation | (current - purchase) / purchase | >= -1.0, <= 10.0 |
| `equity_amount` | Float | Estimated equity amount | Current value - mortgage balance | >= 0 |
| `equity_percentage` | Float | Equity as % of value | Equity / current value | >= 0, <= 1.0 |
| `mortgage_balance` | Float | Remaining mortgage balance | Loan records | >= 0 |
| `years_owned` | Integer | Years of ownership | Current year - purchase year | >= 0, <= 100 |

**Importance**: Critical for refinance and move prediction
**Update Frequency**: Monthly
**Privacy**: Sensitive financial data

### Market Context

| Feature Name | Data Type | Description | Computation Method | Validation |
|--------------|-----------|-------------|-------------------|------------|
| `zip_code_median_value` | Float | Median property value in zip | Aggregated from market data | >= 0 |
| `zip_code_value_growth_12m` | Float | 12-month value growth in zip | Year-over-year change | >= -0.5, <= 2.0 |
| `neighborhood_turnover_rate` | Float | Annual turnover rate | Sales / total properties | >= 0, <= 1.0 |
| `days_on_market_avg_zip` | Integer | Average days on market | Median DOM in zip code | >= 0, <= 365 |
| `inventory_levels_zip` | Integer | Active listings in zip code | Current listing count | >= 0 |

**Importance**: High for market timing predictions
**Update Frequency**: Weekly
**Source**: MLS and market data providers

### Lifecycle

| Feature Name | Data Type | Description | Computation Method | Validation |
|--------------|-----------|-------------|-------------------|------------|
| `months_since_purchase` | Integer | Months since property purchase | (Current date - purchase date) in months | >= 0 |
| `months_until_mortgage_payoff` | Integer | Months until mortgage paid off | Remaining balance / monthly payment | >= 0, <= 360 |
| `refi_potential_savings` | Float | Potential refinance savings | Calculate based on rate difference | >= 0 |

**Importance**: High for refinance opportunity detection
**Update Frequency**: Monthly

---

## Transactional Features

| Feature Name | Data Type | Description | Computation Method | Validation |
|--------------|-----------|-------------|-------------------|------------|
| `total_transactions` | Integer | Total lifetime transactions | Count all transactions | >= 0, <= 50 |
| `transactions_last_5_years` | Integer | Transactions in last 5 years | Count recent transactions | >= 0, <= 20 |
| `avg_years_between_transactions` | Float | Average years between transactions | Total years / transaction count | >= 0, <= 50 |
| `last_transaction_type` | Categorical | Type of last transaction | Most recent transaction | {BUY, SELL, REFI, INVESTMENT} |
| `months_since_last_transaction` | Integer | Months since last transaction | Current date - last transaction | >= 0 |
| `buy_count` | Integer | Number of purchase transactions | Count BUY transactions | >= 0, <= 20 |
| `sell_count` | Integer | Number of sale transactions | Count SELL transactions | >= 0, <= 20 |
| `refi_count` | Integer | Number of refinances | Count REFI transactions | >= 0, <= 10 |
| `has_refinanced` | Boolean | Ever refinanced | refi_count > 0 | true/false |
| `transaction_frequency` | Float | Transactions per year | Count / years active | >= 0, <= 5.0 |
| `transactions_with_current_agent` | Integer | Transactions with same agent | Count matching agent_id | >= 0, <= 20 |
| `years_with_agent` | Integer | Years relationship with agent | Current year - first transaction year | >= 0, <= 50 |
| `agent_loyalty_score` | Float | Agent loyalty metric | Weighted score | >= 0, <= 1.0 |

**Importance**: Critical for move probability and transaction type prediction
**Update Frequency**: On transaction events
**Source**: Transaction management system

---

## Market Features

### Market Conditions

| Feature Name | Data Type | Description | Source | Validation |
|--------------|-----------|-------------|--------|------------|
| `mortgage_rate_30y` | Float | Current 30-year mortgage rate | Federal Reserve data | >= 0, <= 0.20 |
| `mortgage_rate_trend_30d` | Float | 30-day rate change | Rate delta | >= -0.05, <= 0.05 |
| `market_inventory_levels` | Integer | Total market inventory | MLS aggregate | >= 0 |
| `median_days_on_market` | Integer | Median DOM in market | MLS statistics | >= 0, <= 365 |
| `price_per_sqft_zip` | Float | Price per sq ft in zip code | Calculated from sales | >= 0 |

**Importance**: High for timing predictions
**Update Frequency**: Daily
**Source**: External market data APIs

### Economic Indicators

| Feature Name | Data Type | Description | Source | Validation |
|--------------|-----------|-------------|--------|------------|
| `unemployment_rate_county` | Float | County unemployment rate | Bureau of Labor Statistics | >= 0, <= 1.0 |
| `job_growth_rate_county` | Float | Annual job growth rate | Economic data | >= -0.5, <= 0.5 |
| `population_growth_rate` | Float | Annual population growth | Census data | >= -0.2, <= 0.2 |

**Importance**: Medium for market predictions
**Update Frequency**: Monthly
**Source**: Government economic data

### Seasonal

| Feature Name | Data Type | Description | Computation Method | Validation |
|--------------|-----------|-------------|-------------------|------------|
| `month` | Integer | Current month | Date extraction | 1-12 |
| `quarter` | Integer | Current quarter | (month - 1) // 3 + 1 | 1-4 |
| `is_peak_season` | Boolean | Peak real estate season | month in [4,5,6,7,8] | true/false |
| `days_until_peak_season` | Integer | Days until peak season | Calculate from current date | >= 0, <= 365 |

**Importance**: Medium for timing optimization
**Update Frequency**: Daily
**Computation**: Automatic from current date

---

## Temporal Features

### Time-Based

| Feature Name | Data Type | Description | Computation Method | Validation |
|--------------|-----------|-------------|-------------------|------------|
| `days_of_week_active` | Integer | Days of week with activity | Count distinct active days | 0-7 |
| `preferred_contact_hour` | Integer | Preferred hour for contact | Mode of interaction hours | 0-23 |
| `preferred_contact_day` | Integer | Preferred day of week | Mode of interaction days | 0-6 |
| `timezone` | Categorical | User timezone | From profile or inferred | Valid timezone string |

**Importance**: Critical for contact timing optimization
**Update Frequency**: Weekly
**Computation**: Statistical analysis of interaction patterns

### Cyclical Encoding

| Feature Name | Data Type | Description | Computation Method | Validation |
|--------------|-----------|-------------|-------------------|------------|
| `month_sin` | Float | Sine of month (cyclical) | sin(2π × month / 12) | >= -1, <= 1 |
| `month_cos` | Float | Cosine of month (cyclical) | cos(2π × month / 12) | >= -1, <= 1 |
| `day_of_week_sin` | Float | Sine of day of week | sin(2π × day / 7) | >= -1, <= 1 |
| `day_of_week_cos` | Float | Cosine of day of week | cos(2π × day / 7) | >= -1, <= 1 |

**Importance**: High for temporal pattern modeling
**Update Frequency**: Real-time
**Purpose**: Capture cyclical nature of time for ML models

---

## Feature Engineering Pipelines

### Pipeline Configurations

**Move Probability Model**:
- Feature Sets: behavioral, property, transactional, market, temporal
- Total Features: ~60
- Update Frequency: Daily
- Point-in-Time: Last 90 days

**Transaction Type Model**:
- Feature Sets: behavioral, property, transactional, market
- Total Features: ~45
- Update Frequency: Daily
- Point-in-Time: Last 60 days

**Contact Timing Model**:
- Feature Sets: behavioral, temporal
- Total Features: ~25
- Update Frequency: Weekly
- Point-in-Time: Last 30 days

**Property Value Model**:
- Feature Sets: property, market, temporal
- Total Features: ~30
- Update Frequency: Monthly
- Point-in-Time: Current

---

## Feature Store Architecture

### Storage Schema

Features are stored in the `ml_feature_values` table with:
- `feature_id`: FK to ml_features
- `entity_id`: Subject entity (user_id, property_id, etc.)
- `entity_type`: Type of entity
- `value`: JSON-encoded feature value
- `computed_at`: Timestamp of computation
- `version`: Feature version

### Caching Strategy

- **Hot Cache**: Last 7 days in Redis
- **Warm Cache**: Last 30 days in PostgreSQL
- **Cold Storage**: Historical data in S3 Parquet files
- **TTL**: 3600 seconds for computed features

### Quality Metrics

Tracked for each feature:
- `null_rate`: Percentage of null values
- `mean_value`: Average value
- `std_dev`: Standard deviation
- `min_value`: Minimum observed value
- `max_value`: Maximum observed value
- `importance`: Feature importance score from models

---

## Usage Examples

### Python Feature Computation

```python
from feature_engineering.feature_engineer import FeatureEngineer
from feature_engineering.feature_pipeline import FeaturePipeline

# Initialize
engineer = FeatureEngineer(db_connection, config)
pipeline = FeaturePipeline(engineer)

# Compute single feature
value = engineer.compute_feature('email_open_rate_30d', user_id='123')

# Compute feature set
features = engineer.compute_feature_set(
    ['email_open_rate_30d', 'login_count_7d', 'doc_access_count_30d'],
    entity_id='123'
)

# Create training dataset
df = pipeline.create_training_dataset(
    entity_ids=['123', '456', '789'],
    feature_sets=['behavioral', 'temporal']
)
```

### SQL Feature Query

```sql
-- Get latest feature values for a user
SELECT
    f.feature_name,
    fv.value,
    fv.computed_at
FROM ml_feature_values fv
JOIN ml_features f ON f.id = fv.feature_id
WHERE fv.entity_id = '123'
    AND fv.entity_type = 'USER'
    AND fv.computed_at = (
        SELECT MAX(computed_at)
        FROM ml_feature_values
        WHERE feature_id = fv.feature_id
            AND entity_id = '123'
    );
```

---

## Maintenance & Monitoring

### Daily Tasks
- Compute new feature values
- Update feature statistics
- Monitor data quality metrics
- Check for missing or anomalous values

### Weekly Tasks
- Review feature importance scores
- Identify deprecated features
- Update feature documentation
- Performance optimization

### Monthly Tasks
- Feature drift analysis
- Add/remove features based on model performance
- Schema migrations if needed
- Cost optimization for storage

---

## Contact

For questions or feature requests, contact the ML team at ml-team@roisystems.com
