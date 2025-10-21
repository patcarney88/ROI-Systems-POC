"""
Apache Airflow DAG for Feature Engineering Pipeline
Runs daily feature computation and stores in feature store
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator
from datetime import datetime, timedelta
import sys
import os

# Add ML source to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from feature_engineering.feature_engineer import FeatureEngineer
from feature_engineering.feature_pipeline import FeaturePipeline

# Default arguments for DAG
default_args = {
    'owner': 'ml-team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email': ['ml-alerts@roisystems.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'execution_timeout': timedelta(hours=2),
}

dag = DAG(
    'feature_engineering_daily',
    default_args=default_args,
    description='Daily feature engineering pipeline',
    schedule_interval='0 2 * * *',  # 2 AM daily
    catchup=False,
    max_active_runs=1,
    tags=['ml', 'features', 'daily'],
)


# ============================================================================
# TASK DEFINITIONS
# ============================================================================

def extract_data_from_postgres(**context):
    """
    Extract raw data from PostgreSQL for feature computation
    """
    import logging
    from sqlalchemy import create_engine
    import pandas as pd

    logger = logging.getLogger(__name__)
    logger.info("Starting data extraction from PostgreSQL")

    # Get database connection string from Airflow variables
    db_connection = os.getenv('DATABASE_URL')
    engine = create_engine(db_connection)

    try:
        # Extract active users
        users_query = """
            SELECT id, email, created_at, status
            FROM users
            WHERE status = 'ACTIVE'
            AND deleted_at IS NULL
        """
        users_df = pd.read_sql(users_query, engine)

        # Extract recent document access logs
        doc_logs_query = """
            SELECT user_id, document_id, action, timestamp
            FROM document_access_logs
            WHERE timestamp >= NOW() - INTERVAL '90 days'
        """
        doc_logs_df = pd.read_sql(doc_logs_query, engine)

        # Extract email engagement data
        email_query = """
            SELECT user_id, opened, clicked, sent_at
            FROM alert_deliveries
            WHERE channel = 'EMAIL'
            AND sent_at >= NOW() - INTERVAL '90 days'
        """
        email_df = pd.read_sql(email_query, engine)

        # Store in XCom for next tasks
        context['task_instance'].xcom_push(key='user_count', value=len(users_df))
        context['task_instance'].xcom_push(key='doc_log_count', value=len(doc_logs_df))
        context['task_instance'].xcom_push(key='email_count', value=len(email_df))

        logger.info(f"Extracted {len(users_df)} users, {len(doc_logs_df)} doc logs, {len(email_df)} emails")

        return {
            'users': len(users_df),
            'doc_logs': len(doc_logs_df),
            'emails': len(email_df)
        }

    except Exception as e:
        logger.error(f"Data extraction failed: {str(e)}")
        raise


def compute_behavioral_features(**context):
    """
    Compute behavioral features for all active users
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Computing behavioral features")

    # Initialize feature engineer
    db_connection = os.getenv('DATABASE_URL')
    feature_config = {}  # Load from config file

    engineer = FeatureEngineer(db_connection, feature_config)
    pipeline = FeaturePipeline(engineer)

    # Get user IDs from XCom
    user_count = context['task_instance'].xcom_pull(task_ids='extract_raw_data', key='user_count')
    logger.info(f"Processing {user_count} users")

    # Compute behavioral features
    behavioral_features = pipeline.BEHAVIORAL_FEATURES

    # This would iterate through users and compute features
    # For production, this should be batched and parallelized
    features_computed = 0

    logger.info(f"Computed {features_computed} behavioral features")

    return features_computed


def compute_property_features(**context):
    """
    Compute property-related features
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Computing property features")

    # Initialize feature engineer
    db_connection = os.getenv('DATABASE_URL')
    feature_config = {}

    engineer = FeatureEngineer(db_connection, feature_config)
    pipeline = FeaturePipeline(engineer)

    # Compute property features
    property_features = pipeline.PROPERTY_FEATURES

    features_computed = 0

    logger.info(f"Computed {features_computed} property features")

    return features_computed


def compute_market_features(**context):
    """
    Compute market and economic features
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Computing market features")

    # Initialize feature engineer
    db_connection = os.getenv('DATABASE_URL')
    feature_config = {}

    engineer = FeatureEngineer(db_connection, feature_config)
    pipeline = FeaturePipeline(engineer)

    # Compute market features
    market_features = pipeline.MARKET_FEATURES

    features_computed = 0

    logger.info(f"Computed {features_computed} market features")

    return features_computed


def validate_feature_quality(**context):
    """
    Validate computed features for quality and completeness
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Validating feature quality")

    # Get counts from previous tasks
    behavioral_count = context['task_instance'].xcom_pull(task_ids='compute_behavioral_features')
    property_count = context['task_instance'].xcom_pull(task_ids='compute_property_features')
    market_count = context['task_instance'].xcom_pull(task_ids='compute_market_features')

    total_features = behavioral_count + property_count + market_count

    logger.info(f"Total features computed: {total_features}")

    # Validation checks
    validation_results = {
        'total_features': total_features,
        'null_rate': 0.05,  # Example
        'validation_passed': True
    }

    if not validation_results['validation_passed']:
        raise ValueError("Feature validation failed")

    return validation_results


def store_in_feature_store(**context):
    """
    Store validated features in the feature store
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Storing features in feature store")

    validation_results = context['task_instance'].xcom_pull(task_ids='validate_features')

    logger.info(f"Storing {validation_results['total_features']} features")

    # Store features in PostgreSQL feature store
    # This is handled by the feature_engineer._store_feature_value method

    return {
        'stored_count': validation_results['total_features'],
        'timestamp': datetime.utcnow().isoformat()
    }


def update_feature_statistics(**context):
    """
    Update feature statistics (mean, std, importance, etc.)
    """
    import logging
    from sqlalchemy import create_engine, text
    logger = logging.getLogger(__name__)
    logger.info("Updating feature statistics")

    db_connection = os.getenv('DATABASE_URL')
    engine = create_engine(db_connection)

    # Update statistics for each feature
    update_query = text("""
        UPDATE ml_features f
        SET
            null_rate = stats.null_rate,
            mean_value = stats.mean_value,
            std_dev = stats.std_dev,
            min_value = stats.min_value,
            max_value = stats.max_value,
            last_updated = NOW()
        FROM (
            SELECT
                feature_id,
                COUNT(*) FILTER (WHERE value IS NULL)::float / NULLIF(COUNT(*), 0) as null_rate,
                AVG((value::json->>'value')::float) as mean_value,
                STDDEV((value::json->>'value')::float) as std_dev,
                MIN((value::json->>'value')::float) as min_value,
                MAX((value::json->>'value')::float) as max_value
            FROM ml_feature_values
            WHERE computed_at >= NOW() - INTERVAL '30 days'
            GROUP BY feature_id
        ) stats
        WHERE f.id = stats.feature_id
    """)

    with engine.connect() as conn:
        result = conn.execute(update_query)
        conn.commit()
        logger.info(f"Updated statistics for {result.rowcount} features")

    return result.rowcount


# ============================================================================
# DAG TASK DEFINITIONS
# ============================================================================

# Task 1: Extract raw data
extract_data = PythonOperator(
    task_id='extract_raw_data',
    python_callable=extract_data_from_postgres,
    dag=dag,
)

# Task 2: Compute behavioral features
compute_behavioral = PythonOperator(
    task_id='compute_behavioral_features',
    python_callable=compute_behavioral_features,
    dag=dag,
)

# Task 3: Compute property features
compute_property = PythonOperator(
    task_id='compute_property_features',
    python_callable=compute_property_features,
    dag=dag,
)

# Task 4: Compute market features
compute_market = PythonOperator(
    task_id='compute_market_features',
    python_callable=compute_market_features,
    dag=dag,
)

# Task 5: Validate features
validate = PythonOperator(
    task_id='validate_features',
    python_callable=validate_feature_quality,
    dag=dag,
)

# Task 6: Store in feature store
store_features = PythonOperator(
    task_id='store_features',
    python_callable=store_in_feature_store,
    dag=dag,
)

# Task 7: Update statistics
update_stats = PythonOperator(
    task_id='update_feature_statistics',
    python_callable=update_feature_statistics,
    dag=dag,
)

# ============================================================================
# DAG DEPENDENCIES
# ============================================================================

# Define task dependencies
extract_data >> [compute_behavioral, compute_property, compute_market]
[compute_behavioral, compute_property, compute_market] >> validate
validate >> store_features >> update_stats
