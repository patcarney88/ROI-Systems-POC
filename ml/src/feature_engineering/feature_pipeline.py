"""
Feature Pipeline
End-to-end feature engineering pipeline for ML models
"""

from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from feature_engineer import FeatureEngineer

logger = logging.getLogger(__name__)


class FeaturePipeline:
    """
    Orchestrates feature engineering across all feature categories
    """

    # Feature definitions organized by category
    BEHAVIORAL_FEATURES = [
        # Document Access Patterns
        'doc_access_count_7d',
        'doc_access_count_30d',
        'doc_download_count_7d',
        'unique_docs_accessed_30d',
        'last_doc_access_days_ago',
        'avg_docs_per_session',

        # Email Engagement
        'email_open_rate_30d',
        'email_click_rate_30d',
        'emails_opened_last_7d',
        'emails_clicked_last_7d',
        'days_since_last_email_open',
        'campaign_engagement_score',

        # Platform Engagement
        'login_count_7d',
        'login_count_30d',
        'avg_session_duration_minutes',
        'pages_per_session',
        'days_since_last_login',
        'weekend_usage_ratio',

        # Alert Interaction
        'alerts_viewed_30d',
        'alerts_dismissed_30d',
        'alerts_acted_upon_30d',
        'alert_response_time_avg_hours',

        # Search & Browse Behavior
        'property_searches_30d',
        'market_report_views_30d',
        'saved_searches_count',
        'price_range_searches',
    ]

    PROPERTY_FEATURES = [
        # Property Characteristics
        'property_age_years',
        'square_footage',
        'bedrooms',
        'bathrooms',
        'lot_size',
        'property_type',
        'has_pool',
        'has_garage',

        # Financial
        'current_value',
        'purchase_price',
        'value_appreciation_pct',
        'equity_amount',
        'equity_percentage',
        'mortgage_balance',
        'years_owned',

        # Market Context
        'zip_code_median_value',
        'zip_code_value_growth_12m',
        'neighborhood_turnover_rate',
        'days_on_market_avg_zip',
        'inventory_levels_zip',

        # Lifecycle
        'months_since_purchase',
        'months_until_mortgage_payoff',
        'refi_potential_savings',
    ]

    TRANSACTIONAL_FEATURES = [
        # Transaction History
        'total_transactions',
        'transactions_last_5_years',
        'avg_years_between_transactions',
        'last_transaction_type',
        'months_since_last_transaction',

        # Transaction Patterns
        'buy_count',
        'sell_count',
        'refi_count',
        'has_refinanced',
        'transaction_frequency',

        # Agent Relationship
        'transactions_with_current_agent',
        'years_with_agent',
        'agent_loyalty_score',
    ]

    MARKET_FEATURES = [
        # Market Conditions
        'mortgage_rate_30y',
        'mortgage_rate_trend_30d',
        'market_inventory_levels',
        'median_days_on_market',
        'price_per_sqft_zip',

        # Economic Indicators
        'unemployment_rate_county',
        'job_growth_rate_county',
        'population_growth_rate',

        # Seasonal
        'month',
        'quarter',
        'is_peak_season',
        'days_until_peak_season',
    ]

    TEMPORAL_FEATURES = [
        # Time-based
        'days_of_week_active',
        'preferred_contact_hour',
        'preferred_contact_day',
        'timezone',

        # Cyclical Encoding
        'month_sin',
        'month_cos',
        'day_of_week_sin',
        'day_of_week_cos',
    ]

    def __init__(self, feature_engineer: FeatureEngineer):
        """
        Initialize FeaturePipeline

        Args:
            feature_engineer: FeatureEngineer instance
        """
        self.feature_engineer = feature_engineer
        self.feature_sets = {
            'behavioral': self.BEHAVIORAL_FEATURES,
            'property': self.PROPERTY_FEATURES,
            'transactional': self.TRANSACTIONAL_FEATURES,
            'market': self.MARKET_FEATURES,
            'temporal': self.TEMPORAL_FEATURES,
        }

    def create_training_dataset(
        self,
        entity_ids: List[str],
        feature_sets: Optional[List[str]] = None,
        as_of_date: Optional[datetime] = None,
        target_column: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Create training dataset with features for given entities

        Args:
            entity_ids: List of entity IDs
            feature_sets: Which feature sets to include (default: all)
            as_of_date: Point-in-time date
            target_column: Name of target column

        Returns:
            DataFrame with features and optional target
        """
        if feature_sets is None:
            feature_sets = list(self.feature_sets.keys())

        if as_of_date is None:
            as_of_date = datetime.utcnow()

        logger.info(f"Creating training dataset for {len(entity_ids)} entities")

        # Collect all features to compute
        all_features = []
        for feature_set in feature_sets:
            all_features.extend(self.feature_sets.get(feature_set, []))

        # Compute features for all entities
        data = []
        for entity_id in entity_ids:
            try:
                features = self.feature_engineer.compute_feature_set(
                    all_features,
                    entity_id,
                    'USER',
                    as_of_date
                )
                features['entity_id'] = entity_id
                features['as_of_date'] = as_of_date
                data.append(features)
            except Exception as e:
                logger.error(f"Error computing features for {entity_id}: {str(e)}")

        # Create DataFrame
        df = pd.DataFrame(data)

        # Add temporal features
        df = self._add_temporal_features(df, as_of_date)

        # Validate features
        df = self._validate_and_clean(df)

        logger.info(f"Created dataset with shape {df.shape}")

        return df

    def create_prediction_features(
        self,
        entity_id: str,
        model_type: str,
        as_of_date: Optional[datetime] = None
    ) -> Dict:
        """
        Create feature set for real-time prediction

        Args:
            entity_id: Entity ID
            model_type: Type of model (determines feature set)
            as_of_date: Point-in-time date

        Returns:
            Dictionary of features
        """
        if as_of_date is None:
            as_of_date = datetime.utcnow()

        # Select features based on model type
        feature_sets = self._get_feature_sets_for_model(model_type)

        all_features = []
        for feature_set in feature_sets:
            all_features.extend(self.feature_sets.get(feature_set, []))

        # Compute features
        features = self.feature_engineer.compute_feature_set(
            all_features,
            entity_id,
            'USER',
            as_of_date
        )

        # Add temporal features
        features.update(self._compute_temporal_features(as_of_date))

        return features

    def _get_feature_sets_for_model(self, model_type: str) -> List[str]:
        """
        Determine which feature sets are needed for a model type

        Args:
            model_type: Model type

        Returns:
            List of feature set names
        """
        model_feature_mapping = {
            'MOVE_PROBABILITY': ['behavioral', 'property', 'transactional', 'market', 'temporal'],
            'TRANSACTION_TYPE': ['behavioral', 'property', 'transactional', 'market'],
            'CONTACT_TIMING': ['behavioral', 'temporal'],
            'PROPERTY_VALUE': ['property', 'market', 'temporal'],
            'EMAIL_ENGAGEMENT': ['behavioral', 'temporal'],
            'CHURN_RISK': ['behavioral', 'transactional', 'temporal'],
        }

        return model_feature_mapping.get(model_type, ['behavioral', 'temporal'])

    def _add_temporal_features(self, df: pd.DataFrame, as_of_date: datetime) -> pd.DataFrame:
        """
        Add temporal features to DataFrame

        Args:
            df: Input DataFrame
            as_of_date: Reference date

        Returns:
            DataFrame with temporal features
        """
        # Month (cyclical encoding)
        df['month'] = as_of_date.month
        df['month_sin'] = np.sin(2 * np.pi * as_of_date.month / 12)
        df['month_cos'] = np.cos(2 * np.pi * as_of_date.month / 12)

        # Day of week (cyclical encoding)
        day_of_week = as_of_date.weekday()
        df['day_of_week_sin'] = np.sin(2 * np.pi * day_of_week / 7)
        df['day_of_week_cos'] = np.cos(2 * np.pi * day_of_week / 7)

        # Quarter
        df['quarter'] = (as_of_date.month - 1) // 3 + 1

        # Peak season indicator (spring/summer for real estate)
        df['is_peak_season'] = int(as_of_date.month in [4, 5, 6, 7, 8])

        # Days until peak season
        if as_of_date.month < 4:
            days_until_peak = (datetime(as_of_date.year, 4, 1) - as_of_date).days
        elif as_of_date.month > 8:
            days_until_peak = (datetime(as_of_date.year + 1, 4, 1) - as_of_date).days
        else:
            days_until_peak = 0

        df['days_until_peak_season'] = days_until_peak

        return df

    def _compute_temporal_features(self, as_of_date: datetime) -> Dict:
        """
        Compute temporal features for a single prediction

        Args:
            as_of_date: Reference date

        Returns:
            Dictionary of temporal features
        """
        return {
            'month': as_of_date.month,
            'month_sin': np.sin(2 * np.pi * as_of_date.month / 12),
            'month_cos': np.cos(2 * np.pi * as_of_date.month / 12),
            'day_of_week_sin': np.sin(2 * np.pi * as_of_date.weekday() / 7),
            'day_of_week_cos': np.cos(2 * np.pi * as_of_date.weekday() / 7),
            'quarter': (as_of_date.month - 1) // 3 + 1,
            'is_peak_season': int(as_of_date.month in [4, 5, 6, 7, 8]),
        }

    def _validate_and_clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Validate and clean feature DataFrame

        Args:
            df: Input DataFrame

        Returns:
            Cleaned DataFrame
        """
        # Remove rows with too many nulls
        null_threshold = 0.5
        null_counts = df.isnull().sum(axis=1)
        df = df[null_counts < len(df.columns) * null_threshold]

        # Fill remaining nulls with appropriate defaults
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        df[numeric_columns] = df[numeric_columns].fillna(0)

        # Remove infinite values
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.fillna(0)

        # Clip outliers (optional)
        for col in numeric_columns:
            if col not in ['entity_id', 'as_of_date']:
                q1 = df[col].quantile(0.01)
                q99 = df[col].quantile(0.99)
                df[col] = df[col].clip(q1, q99)

        logger.info(f"Cleaned dataset: {len(df)} rows, {len(df.columns)} columns")

        return df

    def feature_importance_analysis(
        self,
        model,
        feature_names: List[str]
    ) -> pd.DataFrame:
        """
        Analyze feature importance from trained model

        Args:
            model: Trained model with feature_importances_
            feature_names: List of feature names

        Returns:
            DataFrame with feature importance scores
        """
        if not hasattr(model, 'feature_importances_'):
            raise ValueError("Model does not have feature_importances_ attribute")

        importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': model.feature_importances_
        })

        importance_df = importance_df.sort_values('importance', ascending=False)
        importance_df['cumulative_importance'] = importance_df['importance'].cumsum()

        return importance_df

    def export_feature_set(
        self,
        df: pd.DataFrame,
        output_path: str,
        format: str = 'parquet'
    ) -> None:
        """
        Export feature set to file

        Args:
            df: Feature DataFrame
            output_path: Output file path
            format: Output format (parquet, csv, json)
        """
        if format == 'parquet':
            df.to_parquet(output_path, index=False)
        elif format == 'csv':
            df.to_csv(output_path, index=False)
        elif format == 'json':
            df.to_json(output_path, orient='records')
        else:
            raise ValueError(f"Unsupported format: {format}")

        logger.info(f"Exported feature set to {output_path}")
