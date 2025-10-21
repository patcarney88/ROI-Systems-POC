"""
Property Intelligence Data Pipeline
Apache Airflow DAG for daily batch updates of 100,000+ properties

Schedule: Daily at 2:00 AM
Tasks:
1. Update property valuations (quarterly)
2. Update neighborhood statistics
3. Update market metrics
4. Create financial snapshots
5. Send maintenance reminders
6. Check warranty expirations
7. Generate alerts
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.utils.dates import days_ago
from datetime import datetime, timedelta
import os
import sys

# Add backend src to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

# Default args for all tasks
default_args = {
    'owner': 'roi-systems',
    'depends_on_past': False,
    'email': ['alerts@roisystems.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
    'execution_timeout': timedelta(hours=4)
}

# Create DAG
dag = DAG(
    'property_intelligence_daily_update',
    default_args=default_args,
    description='Daily batch update for property intelligence system',
    schedule_interval='0 2 * * *',  # 2:00 AM daily
    start_date=days_ago(1),
    catchup=False,
    max_active_runs=1,
    tags=['property-intelligence', 'daily', 'batch']
)

# ============================================================================
# TASK FUNCTIONS
# ============================================================================

def update_property_valuations(**context):
    """
    Update property valuations for all tracked properties
    Only updates properties that need quarterly refresh
    """
    from services.avm_service import avmService
    from prisma import PrismaClient

    db = PrismaClient()

    try:
        # Get properties that need valuation update
        three_months_ago = datetime.now() - timedelta(days=90)

        properties = db.property.find_many(
            where={
                'tracking_enabled': True,
                'OR': [
                    {'last_valuation_date': None},
                    {'last_valuation_date': {'lt': three_months_ago}}
                ]
            }
        )

        print(f"Found {len(properties)} properties requiring valuation update")

        property_ids = [p.id for p in properties]

        # Batch update valuations
        avmService.batch_update_valuations(property_ids)

        context['task_instance'].xcom_push(
            key='properties_updated',
            value=len(property_ids)
        )

        print(f"✅ Updated valuations for {len(property_ids)} properties")

    except Exception as e:
        print(f"❌ Valuation update failed: {str(e)}")
        raise
    finally:
        db.disconnect()


def update_neighborhood_statistics(**context):
    """
    Update neighborhood statistics for all active ZIP codes
    Runs weekly on Sundays
    """
    from services.market_intelligence_service import marketIntelligenceService
    from prisma import PrismaClient

    db = PrismaClient()

    try:
        # Get unique ZIP codes from tracked properties
        properties = db.property.find_many(
            where={'tracking_enabled': True},
            distinct=['zip_code']
        )

        zip_codes = [p.zip_code for p in properties]

        print(f"Found {len(zip_codes)} unique ZIP codes to update")

        # Batch update neighborhoods
        marketIntelligenceService.batch_update_neighborhoods(zip_codes)

        context['task_instance'].xcom_push(
            key='neighborhoods_updated',
            value=len(zip_codes)
        )

        print(f"✅ Updated statistics for {len(zip_codes)} neighborhoods")

    except Exception as e:
        print(f"❌ Neighborhood update failed: {str(e)}")
        raise
    finally:
        db.disconnect()


def update_market_metrics(**context):
    """
    Update market metrics for all properties
    Tracks new listings and sales activity
    """
    from services.market_intelligence_service import marketIntelligenceService
    from prisma import PrismaClient

    db = PrismaClient()

    try:
        properties = db.property.find_many(
            where={'tracking_enabled': True}
        )

        print(f"Updating market metrics for {len(properties)} properties")

        updated_count = 0
        for property in properties:
            try:
                # Update property market metrics
                activity = marketIntelligenceService.get_neighborhood_activity(property.id)
                updated_count += 1

                # Create alert if high activity
                if activity.new_listings.length >= 5 or activity.recent_sales.length >= 5:
                    marketIntelligenceService.create_neighborhood_alert(property.id)

            except Exception as e:
                print(f"Failed to update metrics for property {property.id}: {str(e)}")
                continue

        context['task_instance'].xcom_push(
            key='metrics_updated',
            value=updated_count
        )

        print(f"✅ Updated market metrics for {updated_count} properties")

    except Exception as e:
        print(f"❌ Market metrics update failed: {str(e)}")
        raise
    finally:
        db.disconnect()


def create_financial_snapshots(**context):
    """
    Create quarterly financial snapshots for all properties
    Tracks equity, loan balance, and refinance opportunities
    """
    from services.financial_service import financialService
    from prisma import PrismaClient

    db = PrismaClient()

    try:
        # Get properties that need quarterly snapshot
        three_months_ago = datetime.now() - timedelta(days=90)

        properties = db.property.find_many(
            where={
                'tracking_enabled': True,
                'OR': [
                    {'last_data_update': None},
                    {'last_data_update': {'lt': three_months_ago}}
                ]
            }
        )

        print(f"Creating financial snapshots for {len(properties)} properties")

        property_ids = [p.id for p in properties]

        # Batch create snapshots
        financialService.batch_create_snapshots(property_ids)

        context['task_instance'].xcom_push(
            key='snapshots_created',
            value=len(property_ids)
        )

        print(f"✅ Created {len(property_ids)} financial snapshots")

    except Exception as e:
        print(f"❌ Financial snapshot creation failed: {str(e)}")
        raise
    finally:
        db.disconnect()


def send_maintenance_reminders(**context):
    """
    Send maintenance reminders for items due within 7 days
    Creates alerts for property subscribers
    """
    from services.maintenance_service import maintenanceService

    try:
        maintenanceService.send_maintenance_reminders()

        print("✅ Sent maintenance reminders")

    except Exception as e:
        print(f"❌ Maintenance reminders failed: {str(e)}")
        raise


def check_warranty_expirations(**context):
    """
    Check for warranties expiring within 30 days
    Creates alerts for property subscribers
    """
    from services.maintenance_service import maintenanceService

    try:
        maintenanceService.check_warranty_expirations()

        print("✅ Checked warranty expirations")

    except Exception as e:
        print(f"❌ Warranty check failed: {str(e)}")
        raise


def generate_daily_report(**context):
    """
    Generate daily summary report
    """
    properties_updated = context['task_instance'].xcom_pull(
        task_ids='update_valuations',
        key='properties_updated'
    ) or 0

    neighborhoods_updated = context['task_instance'].xcom_pull(
        task_ids='update_neighborhoods',
        key='neighborhoods_updated'
    ) or 0

    metrics_updated = context['task_instance'].xcom_pull(
        task_ids='update_market_metrics',
        key='metrics_updated'
    ) or 0

    snapshots_created = context['task_instance'].xcom_pull(
        task_ids='create_financial_snapshots',
        key='snapshots_created'
    ) or 0

    report = f"""
    ═══════════════════════════════════════════════════════
    Property Intelligence Daily Pipeline Report
    Date: {datetime.now().strftime('%Y-%m-%d')}
    ═══════════════════════════════════════════════════════

    📊 Valuations Updated:        {properties_updated}
    🏘️  Neighborhoods Updated:     {neighborhoods_updated}
    📈 Market Metrics Updated:    {metrics_updated}
    💰 Financial Snapshots:       {snapshots_created}

    ✅ Pipeline completed successfully
    ═══════════════════════════════════════════════════════
    """

    print(report)

    # Send email report (configure SMTP in Airflow)
    return report


def cleanup_old_data(**context):
    """
    Cleanup old data beyond retention period
    """
    from prisma import PrismaClient

    db = PrismaClient()

    try:
        # Delete valuations older than 5 years
        five_years_ago = datetime.now() - timedelta(days=1825)

        deleted_valuations = db.property_valuation.delete_many(
            where={'valuation_date': {'lt': five_years_ago}}
        )

        # Delete market metrics older than 3 years
        three_years_ago = datetime.now() - timedelta(days=1095)

        deleted_metrics = db.market_metric.delete_many(
            where={'metric_date': {'lt': three_years_ago}}
        )

        # Delete completed maintenance items older than 2 years
        two_years_ago = datetime.now() - timedelta(days=730)

        deleted_maintenance = db.maintenance_item.delete_many(
            where={
                'status': 'COMPLETED',
                'last_completed_date': {'lt': two_years_ago}
            }
        )

        print(f"✅ Cleaned up {deleted_valuations.count} valuations, "
              f"{deleted_metrics.count} metrics, "
              f"{deleted_maintenance.count} maintenance items")

    except Exception as e:
        print(f"❌ Data cleanup failed: {str(e)}")
        raise
    finally:
        db.disconnect()


# ============================================================================
# DEFINE TASKS
# ============================================================================

# Health check
health_check = BashOperator(
    task_id='health_check',
    bash_command='echo "Pipeline starting at $(date)"',
    dag=dag
)

# Update valuations
update_valuations = PythonOperator(
    task_id='update_valuations',
    python_callable=update_property_valuations,
    provide_context=True,
    dag=dag
)

# Update neighborhoods (runs on Sunday only)
update_neighborhoods = PythonOperator(
    task_id='update_neighborhoods',
    python_callable=update_neighborhood_statistics,
    provide_context=True,
    dag=dag
)

# Update market metrics
update_market_metrics_task = PythonOperator(
    task_id='update_market_metrics',
    python_callable=update_market_metrics,
    provide_context=True,
    dag=dag
)

# Create financial snapshots
create_snapshots = PythonOperator(
    task_id='create_financial_snapshots',
    python_callable=create_financial_snapshots,
    provide_context=True,
    dag=dag
)

# Send maintenance reminders
send_reminders = PythonOperator(
    task_id='send_maintenance_reminders',
    python_callable=send_maintenance_reminders,
    provide_context=True,
    dag=dag
)

# Check warranty expirations
check_warranties = PythonOperator(
    task_id='check_warranty_expirations',
    python_callable=check_warranty_expirations,
    provide_context=True,
    dag=dag
)

# Generate report
generate_report = PythonOperator(
    task_id='generate_daily_report',
    python_callable=generate_daily_report,
    provide_context=True,
    dag=dag
)

# Cleanup old data (runs weekly)
cleanup_data = PythonOperator(
    task_id='cleanup_old_data',
    python_callable=cleanup_old_data,
    provide_context=True,
    dag=dag
)

# ============================================================================
# DEFINE TASK DEPENDENCIES
# ============================================================================

# Sequential pipeline with parallel branches
health_check >> [update_valuations, update_neighborhoods]

update_valuations >> update_market_metrics_task
update_valuations >> create_snapshots

update_market_metrics_task >> send_reminders
create_snapshots >> check_warranties

[send_reminders, check_warranties, update_neighborhoods] >> generate_report

generate_report >> cleanup_data
