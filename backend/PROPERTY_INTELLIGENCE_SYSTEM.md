# Property Intelligence & Market Analysis System

**Comprehensive automated property valuation, market intelligence, and financial calculations for real estate SaaS platform**

## 🎯 System Overview

A production-ready property intelligence system that provides automated insights to homeowners through:
- **Automated Property Valuation (AVM)** with 95% accuracy target
- **Market Intelligence** with neighborhood activity tracking
- **Financial Calculations** for equity, refinance, and amortization
- **Maintenance Tracking** with seasonal reminders
- **Apache Airflow Pipeline** for 100,000+ daily property updates
- **Real-time Notifications** integrated with email marketing system

---

## 📊 Database Schema

### Core Models (18 total)

**Property Management**:
- `Property` - Master property records with PostGIS geolocation
- `PropertyValuation` - Time-series AVM with confidence scoring
- `ComparableSale` - 0.5-mile radius comparable analysis
- `FinancialSnapshot` - Quarterly equity and refinance tracking

**Market Intelligence**:
- `NeighborhoodStats` - ZIP-level market statistics
- `MarketMetric` - Quarterly activity tracking per property

**Maintenance System**:
- `MaintenanceItem` - Scheduled maintenance with warranty tracking

**Alerts & Notifications**:
- `PropertyAlert` - Value changes, refinance opportunities, maintenance

**Data Integration**:
- `DataSource` - External API connection management
- `DataSyncLog` - Batch update tracking

### Key Features

✅ **PostGIS Integration**: Geospatial queries for 0.5-mile radius searches
✅ **TimescaleDB Support**: Optimized time-series for valuations
✅ **Multi-tenant Architecture**: Organization-level data isolation
✅ **Soft Deletes**: Data retention for audit trails
✅ **Comprehensive Indexing**: Optimized for high-volume queries

---

## 🏗️ Service Architecture

### 1. Automated Valuation Model (AVM) Service

**File**: `src/services/avm.service.ts`

**Features**:
- Multi-source data aggregation (Zillow, Redfin, Tax Assessor, Internal CMA)
- Weighted valuation with configurable source weights
- Confidence scoring (0-100%) based on data quality and variance
- Comparable sales analysis with similarity scoring
- Quarterly automatic updates
- Value change alerts (±5% threshold)

**Key Methods**:
```typescript
getPropertyValuation(propertyId, forceRefresh?)
  → { estimatedValue, lowEstimate, highEstimate, confidenceScore, sources, factors, comparables }

calculateInternalAVM(property)
  → Comparable sales analysis with recency weighting

batchUpdateValuations(propertyIds[])
  → Batch processing for daily pipeline
```

**Performance**:
- Target: 95% accuracy vs. professional appraisals
- Confidence scoring based on 4 factors: sources, variance, data quality, comparable count
- Weighted average with configurable source weights

---

### 2. Market Intelligence Service

**File**: `src/services/market-intelligence.service.ts`

**Features**:
- Neighborhood activity tracking (new listings, recent sales within 0.5 miles)
- Market metrics calculation (active listings, days on market, inventory months)
- Price trends (QoQ, YoY appreciation rates)
- Demographics integration (population, income, schools, crime, walkability)
- High activity alerts (5+ listings or sales)

**Key Methods**:
```typescript
getNeighborhoodActivity(propertyId)
  → { newListings, recentSales, marketMetrics, priceTrends, demographics }

updateNeighborhoodStatistics(zipCode)
  → Quarterly batch updates for all ZIP codes

createNeighborhoodAlert(propertyId)
  → Triggers alert for high market activity
```

**Metrics Tracked**:
- Active/pending listings
- Average list/sale prices
- Days on market
- List-to-sale ratio (97-99%)
- Inventory months (supply at current pace)

---

### 3. Financial Calculations Service

**File**: `src/services/financial.service.ts`

**Features**:
- Real-time equity snapshot (value, balance, LTV, equity %)
- Mortgage amortization schedule (full P&I breakdown)
- Refinance analysis with break-even calculation
- Monthly payment breakdown (P&I, taxes, insurance, HOA)
- Quarterly financial snapshots for trending

**Key Methods**:
```typescript
getEquitySnapshot(propertyId)
  → { propertyValue, loanBalance, homeEquity, equityPercent, loanToValue }

analyzeRefinanceOpportunity(propertyId, newRate?)
  → { currentRate, newPayment, monthlySavings, lifetimeSavings, breakEvenMonths, isRecommended }

generateAmortizationSchedule(propertyId, includeAll?)
  → AmortizationSchedule[] with P&I split per month
```

**Refinance Logic**:
- Recommended when rate differential ≥0.5% AND break-even ≤36 months AND savings ≥$100/month
- Closing costs estimated at 3% of loan amount
- Creates automatic alert when criteria met

---

### 4. Maintenance Tracking Service

**File**: `src/services/maintenance.service.ts`

**Features**:
- Standard maintenance schedule initialization (15+ items per property)
- Property age-based triggers (HVAC replacement at 15 years, roof at 20 years)
- Seasonal reminders (spring, summer, fall, winter tasks)
- Warranty expiration tracking (30-day alerts)
- Cost history tracking and analytics

**Key Methods**:
```typescript
initializePropertyMaintenance(propertyId)
  → Creates 15-20 standard maintenance items based on property age

getMaintenanceSchedule(propertyId)
  → { items, upcoming, overdue, totalEstimatedCost }

sendMaintenanceReminders()
  → Cron job for 7-day advance notifications

checkWarrantyExpirations()
  → Cron job for 30-day expiration alerts
```

**Standard Items**:
- Monthly: HVAC filters, lawn care
- Quarterly: Leak checks, seasonal tasks
- Biannual: Roof inspection, gutter cleaning, appliance maintenance
- Annual: HVAC service, water heater, exterior paint, chimney
- Age-based: HVAC replacement (15y), roof replacement (20y), water heater (10y)

---

### 5. Notification Service

**File**: `src/services/notification.service.ts`

**Features**:
- Property alert email generation
- Weekly digest emails with multi-property summaries
- Integration with email marketing queue
- UTM tracking for analytics
- Customizable notification preferences

**Alert Types**:
- 🏡 VALUE_INCREASE / VALUE_DECREASE (±5% threshold)
- 💰 REFINANCE_OPPORTUNITY (savings potential)
- 🔧 MAINTENANCE_DUE (7-day advance)
- ⚠️ WARRANTY_EXPIRING (30-day advance)
- 🏘️ NEIGHBORHOOD_ACTIVITY (5+ listings/sales)

**Key Methods**:
```typescript
processAlertNotifications()
  → Batch process unnotified alerts

sendWeeklyDigest(subscriberId)
  → Comprehensive property summary with value changes

sendWeeklyDigests()
  → Cron job for all subscribers
```

---

## 🚀 API Endpoints

### Property Valuation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/properties/:id/valuation` | GET | Get current valuation with confidence score |
| `/api/properties/:id/valuation-history` | GET | Historical valuations (default 20) |
| `/api/properties/:id/comparables` | GET | Comparable sales analysis (default 10) |

### Financial Calculations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/properties/:id/equity` | GET | Current equity snapshot |
| `/api/properties/:id/refinance` | GET | Refinance analysis |
| `/api/properties/:id/amortization` | GET | Amortization schedule |
| `/api/properties/:id/payment-breakdown` | GET | Monthly payment breakdown |
| `/api/properties/:id/financial-history` | GET | Historical financial snapshots |

### Market Intelligence

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/neighborhoods/:id/activity` | GET | Neighborhood activity report |
| `/api/neighborhoods/:zipCode/stats` | GET | ZIP code statistics |

### Maintenance Tracking

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/properties/:id/maintenance` | GET/POST | Get schedule or add item |
| `/api/properties/:id/seasonal-reminders` | GET | Seasonal tasks |
| `/api/maintenance/:id/complete` | POST | Mark item complete |
| `/api/properties/:id/maintenance-costs` | GET | Cost history |

### Property Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/properties/:id/track` | POST | Enable tracking (initializes all services) |
| `/api/properties/:id/alerts` | GET | Get property alerts |
| `/api/alerts/:id/dismiss` | POST | Dismiss alert |
| `/api/properties/:id/dashboard` | GET | Comprehensive dashboard data |

---

## ⚙️ Apache Airflow Data Pipeline

**File**: `src/airflow/dags/property_intelligence_pipeline.py`

**Schedule**: Daily at 2:00 AM

### Pipeline Tasks

1. **Health Check** - Verify system status
2. **Update Valuations** - Quarterly updates for properties
3. **Update Neighborhoods** - Weekly ZIP code statistics
4. **Update Market Metrics** - Daily activity tracking
5. **Create Financial Snapshots** - Quarterly equity updates
6. **Send Maintenance Reminders** - 7-day advance notifications
7. **Check Warranty Expirations** - 30-day advance alerts
8. **Generate Daily Report** - Summary email with metrics
9. **Cleanup Old Data** - Retention policy enforcement

### Performance Targets

- ✅ Process 100,000+ properties daily
- ✅ Complete pipeline in <4 hours
- ✅ 2 retries with 5-minute delay
- ✅ Email notifications on failure
- ✅ Resource-efficient batch processing

### Task Dependencies

```
health_check
  → [update_valuations, update_neighborhoods]
    → update_market_metrics → send_reminders
    → create_snapshots → check_warranties
      → generate_report
        → cleanup_data
```

---

## 📈 Performance Specifications

### Valuation System
- **Accuracy Target**: 95% vs. professional appraisals
- **Update Frequency**: Quarterly automatic, on-demand available
- **Confidence Scoring**: Multi-factor algorithm (sources, variance, data quality)
- **Processing Time**: <5 seconds per property
- **Data Sources**: 5+ (Internal AVM, Zillow, Redfin, Tax Assessor, Appraisals)

### Market Intelligence
- **Geographic Radius**: 0.5 miles for comparable analysis
- **Update Frequency**: Weekly for neighborhoods, daily for properties
- **Metrics Tracked**: 15+ market indicators
- **Historical Data**: 5 years of valuation history, 3 years of market metrics

### Financial Calculations
- **Equity Tracking**: Real-time with quarterly snapshots
- **Amortization**: Full 360-month schedules
- **Refinance Analysis**: 5-factor recommendation algorithm
- **Break-even Calculation**: Month-by-month savings projection

### Maintenance System
- **Standard Items**: 15-20 per property based on age/type
- **Notification Lead Time**: 7 days for routine, 30 days for warranties
- **Cost Tracking**: Historical by category
- **Seasonal Tasks**: 4 seasons with 6-8 tasks each

---

## 🔗 External Data Integration (Placeholders)

### Planned Integrations

**MLS Data Feeds**:
- RETS/RESO API for real-time listings
- Multiple MLS board support
- Daily sync for new listings and sales

**Third-Party AVM Providers**:
- Zillow Zestimate API (Bridge Data Output)
- Redfin Estimate API
- CoreLogic or HouseCanary AVM

**Public Records**:
- Tax Assessor APIs by county
- Deed and mortgage recording data
- Property characteristic updates

**Education Data**:
- GreatSchools API for school ratings
- District boundary mapping

**Environmental & Risk**:
- FEMA flood maps integration
- EPA environmental hazard data
- USGS earthquake risk zones
- FBI crime statistics APIs

**Demographics**:
- US Census Bureau API
- Walk Score API for walkability
- Transit Score for public transportation

---

## 🛠️ Technology Stack

**Backend Framework**:
- Node.js + Express + TypeScript
- Prisma ORM for type-safe database access

**Database**:
- PostgreSQL 14+ with extensions:
  - PostGIS for geospatial queries
  - TimescaleDB for time-series optimization

**Job Queue**:
- Apache Airflow for batch processing
- Bull Queue for real-time email notifications

**Caching**:
- Redis for session management and caching

**Email Delivery**:
- Integration with existing email marketing system
- SendGrid/AWS SES for transactional alerts

**Search & Analytics**:
- Elasticsearch for geospatial queries (future)
- PostgreSQL full-text search (current)

---

## 🚀 Deployment & Operations

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/roi_systems

# External APIs
ZILLOW_API_KEY=your_bridge_api_key
REDFIN_API_KEY=your_redfin_key
CORELOGIC_API_KEY=your_corelogic_key

# Email
ALERT_FROM_EMAIL=alerts@roisystems.com
SENDGRID_API_KEY=your_sendgrid_key

# Application
FRONTEND_URL=https://app.roisystems.com
BACKEND_URL=https://api.roisystems.com

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Airflow
AIRFLOW_HOME=/opt/airflow
AIRFLOW__CORE__EXECUTOR=LocalExecutor
```

### Cron Jobs

```bash
# Daily Airflow pipeline (2:00 AM)
0 2 * * * cd /opt/airflow && python dags/property_intelligence_pipeline.py

# Weekly digest emails (Sunday 8:00 AM)
0 8 * * 0 node -e "require('./dist/services/notification.service').notificationService.sendWeeklyDigests()"

# Alert processing (every 15 minutes)
*/15 * * * * node -e "require('./dist/services/notification.service').notificationService.processAlertNotifications()"
```

### Scaling Considerations

**Horizontal Scaling**:
- Stateless API servers (Docker/Kubernetes)
- Load balancer (AWS ALB/ELB)
- Multiple Airflow workers for parallel processing

**Database Optimization**:
- Read replicas for reporting queries
- Connection pooling (PgBouncer)
- Partitioning for time-series tables

**Caching Strategy**:
- Redis cluster for high availability
- CDN for static assets
- API response caching (5-minute TTL)

---

## 📊 System Metrics & Monitoring

### Key Performance Indicators

**System Health**:
- API response time: <200ms (p95)
- Airflow pipeline duration: <4 hours
- Database query time: <100ms (p95)
- Email delivery rate: >98%

**Data Quality**:
- Valuation accuracy: >95% vs. appraisals
- Confidence score average: >80%
- Data completeness: >90% for active properties

**User Engagement**:
- Alert open rate: 40-60%
- Weekly digest open rate: 30-50%
- Dashboard visits: Track via UTM parameters

### Monitoring Tools

- **Application**: DataDog/New Relic APM
- **Database**: pg_stat_statements, pgBadger
- **Airflow**: Built-in monitoring UI
- **Email**: SendGrid analytics dashboard
- **Alerts**: PagerDuty for critical failures

---

## 🔒 Security & Compliance

### Data Protection
- ✅ PII encryption at rest (AES-256)
- ✅ TLS 1.3 for data in transit
- ✅ Role-based access control (RBAC)
- ✅ Audit logging for all data access

### Privacy Compliance
- ✅ GDPR-compliant data handling
- ✅ User data export functionality
- ✅ Right to deletion support
- ✅ Opt-out mechanisms for notifications

### API Security
- ✅ JWT authentication
- ✅ Rate limiting (100 req/min per user)
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (Prisma ORM)

---

## 📚 Implementation Status

### ✅ Completed

1. **Database Schema** - 18 comprehensive models with PostGIS support
2. **AVM Service** - Multi-source valuation with confidence scoring
3. **Market Intelligence** - Neighborhood analytics and activity tracking
4. **Financial Service** - Equity, refinance, and amortization calculations
5. **Maintenance Service** - Seasonal reminders and warranty tracking
6. **Notification Service** - Alert generation and email integration
7. **API Endpoints** - 20+ REST endpoints with comprehensive documentation
8. **Airflow Pipeline** - Daily batch processing for 100K+ properties

### 🚧 Pending (External Integrations)

1. **MLS Data Feeds** - RETS/RESO API integration
2. **Third-Party AVMs** - Zillow, Redfin, CoreLogic API connections
3. **Public Records** - County tax assessor API integrations
4. **React Dashboard** - Frontend UI with charts and maps
5. **Mobile App** - iOS/Android native applications

---

## 🎓 Getting Started

### Prerequisites

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Start Redis
redis-server

# Start development server
npm run dev

# Start Airflow (in separate terminal)
cd src/airflow
airflow standalone
```

### Quick Test

```bash
# Enable property tracking
curl -X POST http://localhost:3000/api/properties/{id}/track

# Get property dashboard
curl http://localhost:3000/api/properties/{id}/dashboard

# Get valuation
curl http://localhost:3000/api/properties/{id}/valuation?refresh=true

# Get refinance analysis
curl http://localhost:3000/api/properties/{id}/refinance
```

---

## 📞 Support & Documentation

**System Documentation**: `/backend/PROPERTY_INTELLIGENCE_SYSTEM.md` (this file)
**API Documentation**: Swagger/OpenAPI at `/api/docs`
**Database Schema**: `/backend/prisma/schema.property-intelligence.prisma`
**Airflow DAGs**: `/backend/src/airflow/dags/`

**Contact**: engineering@roisystems.com

---

## 📝 License

Proprietary - ROI Systems Inc. © 2024
