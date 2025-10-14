"""
Feature Engineering Framework
Compute and manage features for ML models in the ROI Systems platform
"""

import asyncio
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import logging
from functools import lru_cache
import hashlib
import json

logger = logging.getLogger(__name__)


class FeatureEngineer:
    """
    Main feature engineering class for computing and managing features
    """

    def __init__(self, db_connection_string: str, feature_config: Dict):
        """
        Initialize FeatureEngineer

        Args:
            db_connection_string: PostgreSQL connection string
            feature_config: Configuration for features
        """
        self.engine = create_engine(db_connection_string, pool_pre_ping=True)
        self.Session = sessionmaker(bind=self.engine)
        self.config = feature_config
        self.feature_cache = {}

        # Feature computation functions registry
        self.feature_functions = self._register_feature_functions()

        logger.info("FeatureEngineer initialized successfully")

    def _register_feature_functions(self) -> Dict:
        """Register all feature computation functions"""
        return {
            # User Behavioral Features
            'doc_access_count_7d': self._compute_doc_access_count_7d,
            'doc_access_count_30d': self._compute_doc_access_count_30d,
            'doc_download_count_7d': self._compute_doc_download_count_7d,
            'unique_docs_accessed_30d': self._compute_unique_docs_accessed_30d,
            'last_doc_access_days_ago': self._compute_last_doc_access_days_ago,
            'avg_docs_per_session': self._compute_avg_docs_per_session,

            # Email Engagement
            'email_open_rate_30d': self._compute_email_open_rate_30d,
            'email_click_rate_30d': self._compute_email_click_rate_30d,
            'emails_opened_last_7d': self._compute_emails_opened_last_7d,
            'emails_clicked_last_7d': self._compute_emails_clicked_last_7d,
            'days_since_last_email_open': self._compute_days_since_last_email_open,
            'campaign_engagement_score': self._compute_campaign_engagement_score,

            # Platform Engagement
            'login_count_7d': self._compute_login_count_7d,
            'login_count_30d': self._compute_login_count_30d,
            'avg_session_duration_minutes': self._compute_avg_session_duration_minutes,
            'pages_per_session': self._compute_pages_per_session,
            'days_since_last_login': self._compute_days_since_last_login,
            'weekend_usage_ratio': self._compute_weekend_usage_ratio,

            # Property Features
            'property_age_years': self._compute_property_age_years,
            'current_value': self._compute_current_value,
            'value_appreciation_pct': self._compute_value_appreciation_pct,
            'equity_percentage': self._compute_equity_percentage,

            # Market Features
            'zip_code_median_value': self._compute_zip_code_median_value,
            'zip_code_value_growth_12m': self._compute_zip_code_value_growth_12m,
            'neighborhood_turnover_rate': self._compute_neighborhood_turnover_rate,
        }

    @lru_cache(maxsize=1000)
    def compute_feature(
        self,
        feature_name: str,
        entity_id: str,
        entity_type: str = 'USER',
        as_of_date: Optional[datetime] = None
    ) -> Any:
        """
        Compute a single feature value with caching

        Args:
            feature_name: Name of the feature to compute
            entity_id: ID of the entity (user, property, etc.)
            entity_type: Type of entity
            as_of_date: Point-in-time date for feature computation

        Returns:
            Computed feature value
        """
        if as_of_date is None:
            as_of_date = datetime.utcnow()

        # Generate cache key
        cache_key = self._generate_cache_key(feature_name, entity_id, entity_type, as_of_date)

        # Check cache first
        if cache_key in self.feature_cache:
            logger.debug(f"Cache hit for feature {feature_name}")
            return self.feature_cache[cache_key]

        # Compute feature
        if feature_name not in self.feature_functions:
            raise ValueError(f"Unknown feature: {feature_name}")

        try:
            feature_value = self.feature_functions[feature_name](
                entity_id, entity_type, as_of_date
            )

            # Cache the result
            self.feature_cache[cache_key] = feature_value

            logger.info(f"Computed feature {feature_name} for {entity_id}: {feature_value}")
            return feature_value

        except Exception as e:
            logger.error(f"Error computing feature {feature_name}: {str(e)}")
            return None

    def compute_feature_set(
        self,
        feature_names: List[str],
        entity_id: str,
        entity_type: str = 'USER',
        as_of_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Compute multiple features efficiently in parallel

        Args:
            feature_names: List of feature names
            entity_id: Entity ID
            entity_type: Entity type
            as_of_date: Point-in-time date

        Returns:
            Dictionary of feature name -> value
        """
        results = {}

        for feature_name in feature_names:
            try:
                value = self.compute_feature(
                    feature_name, entity_id, entity_type, as_of_date
                )
                results[feature_name] = value
            except Exception as e:
                logger.error(f"Error computing {feature_name}: {str(e)}")
                results[feature_name] = None

        return results

    def backfill_features(
        self,
        feature_names: List[str],
        entity_ids: List[str],
        start_date: datetime,
        end_date: datetime,
        entity_type: str = 'USER'
    ) -> None:
        """
        Backfill historical feature values

        Args:
            feature_names: Features to backfill
            entity_ids: Entities to compute for
            start_date: Start date
            end_date: End date
            entity_type: Entity type
        """
        logger.info(f"Starting backfill for {len(feature_names)} features, {len(entity_ids)} entities")

        # Generate date range
        date_range = pd.date_range(start_date, end_date, freq='D')

        total_computations = len(feature_names) * len(entity_ids) * len(date_range)
        completed = 0

        session = self.Session()

        try:
            for as_of_date in date_range:
                for entity_id in entity_ids:
                    for feature_name in feature_names:
                        try:
                            value = self.compute_feature(
                                feature_name, entity_id, entity_type, as_of_date
                            )

                            # Store in database
                            self._store_feature_value(
                                session,
                                feature_name,
                                entity_id,
                                entity_type,
                                value,
                                as_of_date
                            )

                            completed += 1

                            if completed % 100 == 0:
                                logger.info(f"Backfill progress: {completed}/{total_computations}")
                                session.commit()

                        except Exception as e:
                            logger.error(f"Error in backfill: {str(e)}")
                            session.rollback()

            session.commit()
            logger.info("Backfill completed successfully")

        except Exception as e:
            logger.error(f"Backfill failed: {str(e)}")
            session.rollback()
            raise
        finally:
            session.close()

    def validate_features(self, features: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate feature values against defined rules

        Args:
            features: Dictionary of feature values

        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []

        for feature_name, value in features.items():
            # Get validation rules from config
            rules = self.config.get('features', {}).get(feature_name, {}).get('validation', {})

            if not rules:
                continue

            # Check null values
            if value is None:
                if not rules.get('nullable', True):
                    errors.append(f"{feature_name} cannot be null")
                continue

            # Check range
            if 'min' in rules and value < rules['min']:
                errors.append(f"{feature_name} below minimum: {value} < {rules['min']}")

            if 'max' in rules and value > rules['max']:
                errors.append(f"{feature_name} above maximum: {value} > {rules['max']}")

            # Check data type
            expected_type = rules.get('type')
            if expected_type == 'numeric' and not isinstance(value, (int, float)):
                errors.append(f"{feature_name} must be numeric, got {type(value)}")

        is_valid = len(errors) == 0
        return is_valid, errors

    # ========================================================================
    # FEATURE COMPUTATION METHODS
    # ========================================================================

    def _compute_doc_access_count_7d(
        self, entity_id: str, entity_type: str, as_of_date: datetime
    ) -> int:
        """Compute document access count in last 7 days"""
        session = self.Session()
        try:
            query = text("""
                SELECT COUNT(DISTINCT document_id)
                FROM document_access_logs
                WHERE user_id = :user_id
                  AND action IN ('VIEW', 'DOWNLOAD')
                  AND timestamp >= :start_date
                  AND timestamp <= :end_date
            """)

            result = session.execute(
                query,
                {
                    'user_id': entity_id,
                    'start_date': as_of_date - timedelta(days=7),
                    'end_date': as_of_date
                }
            )
            return result.scalar() or 0
        finally:
            session.close()

    def _compute_doc_access_count_30d(
        self, entity_id: str, entity_type: str, as_of_date: datetime
    ) -> int:
        """Compute document access count in last 30 days"""
        session = self.Session()
        try:
            query = text("""
                SELECT COUNT(DISTINCT document_id)
                FROM document_access_logs
                WHERE user_id = :user_id
                  AND action IN ('VIEW', 'DOWNLOAD')
                  AND timestamp >= :start_date
                  AND timestamp <= :end_date
            """)

            result = session.execute(
                query,
                {
                    'user_id': entity_id,
                    'start_date': as_of_date - timedelta(days=30),
                    'end_date': as_of_date
                }
            )
            return result.scalar() or 0
        finally:
            session.close()

    def _compute_email_open_rate_30d(
        self, entity_id: str, entity_type: str, as_of_date: datetime
    ) -> float:
        """Compute email open rate in last 30 days"""
        session = self.Session()
        try:
            query = text("""
                SELECT
                    CAST(SUM(CASE WHEN opened = true THEN 1 ELSE 0 END) AS FLOAT) /
                    NULLIF(COUNT(*), 0) as open_rate
                FROM alert_deliveries
                WHERE user_id = :user_id
                  AND channel = 'EMAIL'
                  AND created_at >= :start_date
                  AND created_at <= :end_date
            """)

            result = session.execute(
                query,
                {
                    'user_id': entity_id,
                    'start_date': as_of_date - timedelta(days=30),
                    'end_date': as_of_date
                }
            )
            return result.scalar() or 0.0
        finally:
            session.close()

    def _compute_login_count_7d(
        self, entity_id: str, entity_type: str, as_of_date: datetime
    ) -> int:
        """Compute login count in last 7 days"""
        session = self.Session()
        try:
            query = text("""
                SELECT COUNT(*)
                FROM audit_logs
                WHERE user_id = :user_id
                  AND action = 'LOGIN'
                  AND success = true
                  AND timestamp >= :start_date
                  AND timestamp <= :end_date
            """)

            result = session.execute(
                query,
                {
                    'user_id': entity_id,
                    'start_date': as_of_date - timedelta(days=7),
                    'end_date': as_of_date
                }
            )
            return result.scalar() or 0
        finally:
            session.close()

    def _compute_avg_session_duration_minutes(
        self, entity_id: str, entity_type: str, as_of_date: datetime
    ) -> float:
        """Compute average session duration"""
        session = self.Session()
        try:
            query = text("""
                SELECT AVG(EXTRACT(EPOCH FROM (last_activity_at - created_at)) / 60.0) as avg_duration
                FROM sessions
                WHERE user_id = :user_id
                  AND created_at >= :start_date
                  AND created_at <= :end_date
            """)

            result = session.execute(
                query,
                {
                    'user_id': entity_id,
                    'start_date': as_of_date - timedelta(days=30),
                    'end_date': as_of_date
                }
            )
            return result.scalar() or 0.0
        finally:
            session.close()

    # Additional feature computation methods would follow the same pattern...
    # Placeholder methods for remaining features:

    def _compute_doc_download_count_7d(self, entity_id: str, entity_type: str, as_of_date: datetime) -> int:
        """Compute document download count in last 7 days"""
        # Similar implementation to doc_access_count_7d but filtering for DOWNLOAD action
        return 0

    def _compute_unique_docs_accessed_30d(self, entity_id: str, entity_type: str, as_of_date: datetime) -> int:
        """Compute unique documents accessed in last 30 days"""
        return 0

    def _compute_last_doc_access_days_ago(self, entity_id: str, entity_type: str, as_of_date: datetime) -> int:
        """Compute days since last document access"""
        return 0

    def _compute_avg_docs_per_session(self, entity_id: str, entity_type: str, as_of_date: datetime) -> float:
        """Compute average documents per session"""
        return 0.0

    def _compute_email_click_rate_30d(self, entity_id: str, entity_type: str, as_of_date: datetime) -> float:
        """Compute email click rate in last 30 days"""
        return 0.0

    def _compute_emails_opened_last_7d(self, entity_id: str, entity_type: str, as_of_date: datetime) -> int:
        """Compute emails opened in last 7 days"""
        return 0

    def _compute_emails_clicked_last_7d(self, entity_id: str, entity_type: str, as_of_date: datetime) -> int:
        """Compute emails clicked in last 7 days"""
        return 0

    def _compute_days_since_last_email_open(self, entity_id: str, entity_type: str, as_of_date: datetime) -> int:
        """Compute days since last email open"""
        return 0

    def _compute_campaign_engagement_score(self, entity_id: str, entity_type: str, as_of_date: datetime) -> float:
        """Compute campaign engagement score"""
        return 0.0

    def _compute_login_count_30d(self, entity_id: str, entity_type: str, as_of_date: datetime) -> int:
        """Compute login count in last 30 days"""
        return 0

    def _compute_pages_per_session(self, entity_id: str, entity_type: str, as_of_date: datetime) -> float:
        """Compute average pages per session"""
        return 0.0

    def _compute_days_since_last_login(self, entity_id: str, entity_type: str, as_of_date: datetime) -> int:
        """Compute days since last login"""
        return 0

    def _compute_weekend_usage_ratio(self, entity_id: str, entity_type: str, as_of_date: datetime) -> float:
        """Compute ratio of weekend to weekday usage"""
        return 0.0

    def _compute_property_age_years(self, entity_id: str, entity_type: str, as_of_date: datetime) -> int:
        """Compute property age in years"""
        return 0

    def _compute_current_value(self, entity_id: str, entity_type: str, as_of_date: datetime) -> float:
        """Compute current property value"""
        return 0.0

    def _compute_value_appreciation_pct(self, entity_id: str, entity_type: str, as_of_date: datetime) -> float:
        """Compute value appreciation percentage"""
        return 0.0

    def _compute_equity_percentage(self, entity_id: str, entity_type: str, as_of_date: datetime) -> float:
        """Compute equity percentage"""
        return 0.0

    def _compute_zip_code_median_value(self, entity_id: str, entity_type: str, as_of_date: datetime) -> float:
        """Compute median value for zip code"""
        return 0.0

    def _compute_zip_code_value_growth_12m(self, entity_id: str, entity_type: str, as_of_date: datetime) -> float:
        """Compute 12-month value growth for zip code"""
        return 0.0

    def _compute_neighborhood_turnover_rate(self, entity_id: str, entity_type: str, as_of_date: datetime) -> float:
        """Compute neighborhood turnover rate"""
        return 0.0

    # ========================================================================
    # UTILITY METHODS
    # ========================================================================

    def _generate_cache_key(
        self, feature_name: str, entity_id: str, entity_type: str, as_of_date: datetime
    ) -> str:
        """Generate cache key for feature"""
        key_string = f"{feature_name}:{entity_id}:{entity_type}:{as_of_date.isoformat()}"
        return hashlib.md5(key_string.encode()).hexdigest()

    def _store_feature_value(
        self,
        session,
        feature_name: str,
        entity_id: str,
        entity_type: str,
        value: Any,
        computed_at: datetime
    ) -> None:
        """Store feature value in database"""
        query = text("""
            INSERT INTO ml_feature_values (id, feature_id, entity_type, entity_id, value, computed_at)
            SELECT
                gen_random_uuid(),
                f.id,
                :entity_type,
                :entity_id,
                :value,
                :computed_at
            FROM ml_features f
            WHERE f.feature_name = :feature_name
            ON CONFLICT (feature_id, entity_id, computed_at)
            DO UPDATE SET value = EXCLUDED.value
        """)

        session.execute(
            query,
            {
                'feature_name': feature_name,
                'entity_type': entity_type,
                'entity_id': entity_id,
                'value': json.dumps(value),
                'computed_at': computed_at
            }
        )

    def clear_cache(self) -> None:
        """Clear feature cache"""
        self.feature_cache.clear()
        logger.info("Feature cache cleared")
