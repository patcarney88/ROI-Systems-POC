# ML Infrastructure Environment Variables
# PostgreSQL Database (ONLY - NO SUPABASE OR DYNAMODB)

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=roi_systems
POSTGRES_USER=ml_user
POSTGRES_PASSWORD=ml_password_change_in_production
DATABASE_URL=postgresql://ml_user:ml_password_change_in_production@localhost:5432/roi_systems

# MLflow Configuration
MLFLOW_TRACKING_URI=http://localhost:5000
MLFLOW_BACKEND_STORE_URI=postgresql://ml_user:ml_password_change_in_production@localhost:5432/mlflow
MLFLOW_ARTIFACT_ROOT=s3://roi-systems-ml-artifacts
MLFLOW_EXPERIMENT_NAME=roi-systems-ml
MLFLOW_S3_ENDPOINT_URL=https://s3.us-east-1.amazonaws.com

# Model Serving Configuration
MODEL_CACHE_DIR=/app/models
PREDICTION_CACHE_TTL=300
MAX_BATCH_SIZE=1000
MODEL_SERVING_PORT=8000
MODEL_SERVING_HOST=0.0.0.0

# Feature Store Configuration
FEATURE_STORE_CACHE_TTL=3600
FEATURE_COMPUTATION_TIMEOUT=300
FEATURE_BACKFILL_BATCH_SIZE=100

# Airflow Configuration
AIRFLOW_HOME=/opt/airflow
AIRFLOW__CORE__EXECUTOR=CeleryExecutor
AIRFLOW__CORE__SQL_ALCHEMY_CONN=postgresql://ml_user:ml_password_change_in_production@localhost:5432/airflow
AIRFLOW__CORE__LOAD_EXAMPLES=False
AIRFLOW__WEBSERVER__SECRET_KEY=change_this_to_random_secret_key
AIRFLOW__CELERY__BROKER_URL=redis://localhost:6379/0
AIRFLOW__CELERY__RESULT_BACKEND=db+postgresql://ml_user:ml_password_change_in_production@localhost:5432/airflow

# AWS Configuration (for S3 model storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
S3_MODEL_BUCKET=roi-systems-ml-models
S3_FEATURE_BUCKET=roi-systems-ml-features

# Redis Configuration (for caching and Celery)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Logging Configuration
LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_FILE=/app/logs/ml-api.log

# Performance Configuration
WORKERS=4
THREADS_PER_WORKER=2
MAX_REQUESTS=1000
TIMEOUT=300

# Model Training Configuration
TRAINING_DATA_DAYS=90
TRAINING_VALIDATION_SPLIT=0.2
TRAINING_TEST_SPLIT=0.1
TRAINING_RANDOM_SEED=42

# Monitoring Configuration
ENABLE_MONITORING=true
MONITORING_INTERVAL_SECONDS=60
DRIFT_DETECTION_THRESHOLD=0.1
ALERT_EMAIL=ml-alerts@roisystems.com

# Security Configuration
API_KEY_REQUIRED=true
JWT_SECRET_KEY=change_this_to_random_jwt_secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Development/Production Mode
ENVIRONMENT=development
DEBUG=true
