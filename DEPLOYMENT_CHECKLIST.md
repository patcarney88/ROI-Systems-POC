# AI Document Processing System - Deployment Checklist

**Project**: ROI Systems - AI Document Processing
**Version**: 1.0.0
**Date**: October 14, 2025
**Environment**: Production

---

## 📋 **Pre-Deployment Checklist**

### **1. Infrastructure Setup** ⏸️

#### **PostgreSQL Database (AWS RDS)**
- [ ] Create RDS PostgreSQL 14+ instance
- [ ] Configure security groups (allow backend + ML service)
- [ ] Enable automatic backups (retention: 30 days)
- [ ] Enable encryption at rest
- [ ] Create database: `roi_systems_prod`
- [ ] Create users:
  - [ ] `backend_user` (read/write)
  - [ ] `ml_service_user` (read/write)
  - [ ] `admin_user` (full access)
- [ ] Test connectivity from EC2 instances
- [ ] Configure connection pooling (PgBouncer recommended)

#### **S3 Buckets**
- [ ] Create `roi-documents-prod` bucket
- [ ] Enable versioning
- [ ] Configure lifecycle policies (30 days → Glacier, 7 years retention)
- [ ] Set bucket policies (restrict to backend + ML service)
- [ ] Enable server-side encryption (SSE-S3 or SSE-KMS)
- [ ] Create folders:
  - [ ] `/raw/` - Original uploads
  - [ ] `/processed/` - Processed documents
  - [ ] `/models/` - ML model artifacts
  - [ ] `/diffs/` - Visual diff PDFs

#### **EC2 Instances**

**Backend API Server**:
- [ ] Launch instance: `t3.xlarge` (4 vCPU, 16GB RAM)
- [ ] OS: Ubuntu 22.04 LTS
- [ ] Install Node.js 18+
- [ ] Configure security group (allow 80, 443, 3000)
- [ ] Attach IAM role for S3 access
- [ ] Configure auto-scaling group (min: 2, max: 10)
- [ ] Install CloudWatch agent

**ML Service Server**:
- [ ] Launch instance: `g4dn.xlarge` (GPU: 1 x NVIDIA T4)
- [ ] OS: Ubuntu 22.04 LTS with NVIDIA drivers
- [ ] Install CUDA 11.8+
- [ ] Install Python 3.9+
- [ ] Configure security group (allow 8000 from backend)
- [ ] Attach IAM role for S3 + Textract access
- [ ] Install CloudWatch agent
- [ ] Configure GPU monitoring

**Redis Instance**:
- [ ] Create ElastiCache Redis cluster (cache.t3.medium)
- [ ] Enable cluster mode (3 shards recommended)
- [ ] Configure security group (allow 6379 from backend + ML)
- [ ] Enable automatic failover
- [ ] Configure backups

#### **Load Balancer (ALB)**
- [ ] Create Application Load Balancer
- [ ] Configure target groups (backend API, ML service)
- [ ] Setup health checks (HTTP GET /health)
- [ ] Configure SSL certificate (ACM)
- [ ] Enable access logs → S3

#### **DNS & SSL**
- [ ] Configure Route 53 DNS records
  - [ ] `api.roisystems.com` → Backend ALB
  - [ ] `ml.roisystems.com` → ML Service ALB
- [ ] Request SSL certificates (ACM)
- [ ] Verify certificate validation

---

### **2. Environment Configuration** ⏸️

#### **Backend Environment Variables**
Create `/backend/.env.production`:

```bash
# Database
DATABASE_URL=postgresql://backend_user:PASSWORD@rds-endpoint:5432/roi_systems_prod

# ML Service
ML_API_URL=http://ml-internal.roisystems.com:8000

# AWS
AWS_REGION=us-east-1
AWS_S3_BUCKET=roi-documents-prod
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Redis
REDIS_HOST=redis-cluster.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=...

# API
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Security
JWT_SECRET=... (generate 64-char random string)
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=... (generate 32-byte hex)

# Frontend
FRONTEND_URL=https://app.roisystems.com

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
DD_API_KEY=... (DataDog)
```

#### **ML Service Environment Variables**
Create `/ml/.env.production`:

```bash
# Database
DATABASE_URL=postgresql://ml_service_user:PASSWORD@rds-endpoint:5432/roi_systems_prod

# AWS
AWS_REGION=us-east-1
AWS_S3_BUCKET=roi-documents-prod
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Model Configuration
MODEL_PATH=/models/document_classifier_v1.pth
MODEL_VERSION=1.0.0
DEVICE=cuda  # or 'cpu' if no GPU

# OCR
TEXTRACT_CONFIDENCE_THRESHOLD=0.85
TESSERACT_PATH=/usr/bin/tesseract
OCR_MODE=hybrid  # tesseract, textract, or hybrid

# API
PORT=8000
WORKERS=4
RELOAD=false
LOG_LEVEL=info

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

---

### **3. Database Migration** ⏸️

```bash
# On backend server
cd /opt/roi-systems/backend

# Run migrations
npx prisma migrate deploy

# Verify schema
npx prisma db pull

# Generate Prisma client
npx prisma generate

# Seed initial data (if needed)
npm run seed:production
```

**Verify Tables Created**:
- [ ] `DocumentClassification` (15 columns)
- [ ] `MLModelVersion` (18 columns)
- [ ] `DocumentOCR` (12 columns)
- [ ] `ExtractedEntity` (11 columns)
- [ ] `ExtractedKeyValue` (10 columns)
- [ ] `ExtractedTable` (9 columns)
- [ ] `SignatureDetection` (9 columns)
- [ ] `DocumentSummary` (12 columns)
- [ ] `DocumentVersion` (13 columns)
- [ ] `ComplianceCheck` (15 columns)
- [ ] `TransactionDocuments` (10 columns)
- [ ] `DocumentRelationship` (8 columns)
- [ ] `ComplianceRule` (10 columns)
- [ ] `DocumentIntelligenceJob` (11 columns)
- [ ] `DocumentProcessingLog` (8 columns)

---

### **4. Model Deployment** ⏸️

#### **Download Trained Models**
```bash
# On ML service server
cd /opt/roi-systems/ml

# Download classification model from S3
aws s3 cp s3://roi-models-prod/document_classifier_v1.pth /models/

# Download Hugging Face models
python -c "
from transformers import pipeline
pipeline('summarization', model='facebook/bart-large-cnn')
"

# Download spaCy models
python -m spacy download en_core_web_lg

# Verify model files
ls -lh /models/
```

#### **Test Model Loading**
```bash
python << EOF
from src.document_classification.classifier import DocumentClassifier
classifier = DocumentClassifier('/models/document_classifier_v1.pth')
print("✅ Classification model loaded successfully")
EOF
```

---

### **5. Service Deployment** ⏸️

#### **Backend API Deployment**

```bash
# On backend server
cd /opt/roi-systems/backend

# Install dependencies
npm ci --production

# Build TypeScript
npm run build

# Create systemd service
sudo nano /etc/systemd/system/roi-backend.service
```

**Service file** (`roi-backend.service`):
```ini
[Unit]
Description=ROI Systems Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=roi
WorkingDirectory=/opt/roi-systems/backend
EnvironmentFile=/opt/roi-systems/backend/.env.production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/roi/backend.log
StandardError=append:/var/log/roi/backend-error.log

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable roi-backend
sudo systemctl start roi-backend
sudo systemctl status roi-backend
```

#### **ML Service Deployment**

```bash
# On ML service server
cd /opt/roi-systems/ml

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create systemd service
sudo nano /etc/systemd/system/roi-ml.service
```

**Service file** (`roi-ml.service`):
```ini
[Unit]
Description=ROI Systems ML Service
After=network.target

[Service]
Type=simple
User=roi
WorkingDirectory=/opt/roi-systems/ml
EnvironmentFile=/opt/roi-systems/ml/.env.production
ExecStart=/opt/roi-systems/ml/venv/bin/uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10
StandardOutput=append:/var/log/roi/ml.log
StandardError=append:/var/log/roi/ml-error.log

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable roi-ml
sudo systemctl start roi-ml
sudo systemctl status roi-ml
```

---

### **6. Health Checks** ⏸️

#### **Backend API**
```bash
# Test health endpoint
curl https://api.roisystems.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-10-14T12:00:00Z",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected",
  "mlService": "connected"
}
```

#### **ML Service**
```bash
# Test health endpoint
curl http://ml.roisystems.com:8000/v1/health

# Expected response:
{
  "status": "healthy",
  "gpu_available": true,
  "models_loaded": {
    "classifier": true,
    "summarizer": true,
    "ocr": true
  },
  "memory_usage": {
    "used_gb": 4.2,
    "total_gb": 16.0,
    "percent": 26.25
  }
}
```

#### **Database**
```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"MLModelVersion\""

# Expected: 0 or more rows
```

#### **S3**
```bash
# Test S3 access
aws s3 ls s3://roi-documents-prod/

# Expected: List of folders
```

---

### **7. Integration Testing** ⏸️

#### **Test Document Processing Pipeline**

```bash
# Upload test document
curl -X POST https://api.roisystems.com/api/documents/upload \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@test_deed.pdf" \
  -F "transactionId=test-123"

# Expected response:
{
  "documentId": "doc-abc123",
  "status": "processing",
  "estimatedTime": "30s"
}

# Check processing status
curl https://api.roisystems.com/api/documents/doc-abc123/status \
  -H "Authorization: Bearer $JWT_TOKEN"

# Expected response after ~30s:
{
  "documentId": "doc-abc123",
  "status": "completed",
  "classification": {
    "category": "DEED",
    "confidence": 0.98
  },
  "ocr": {
    "status": "completed",
    "entities": 15,
    "tables": 2,
    "signatures": 3
  },
  "intelligence": {
    "summary": "Grant deed transferring property from John Smith to Jane Doe...",
    "compliance": "COMPLIANT"
  }
}
```

#### **Run Test Suite**
```bash
cd /opt/roi-systems/ml
pytest tests/ -v --tb=short

# Expected: All tests pass
```

---

### **8. Monitoring Setup** ⏸️

#### **CloudWatch Dashboards**

**Backend API Dashboard**:
- [ ] Create dashboard: `ROI-Backend-Production`
- [ ] Add widgets:
  - [ ] API request rate (requests/min)
  - [ ] API error rate (%)
  - [ ] API latency p50, p95, p99 (ms)
  - [ ] Database connection pool
  - [ ] Memory usage (%)
  - [ ] CPU usage (%)

**ML Service Dashboard**:
- [ ] Create dashboard: `ROI-ML-Production`
- [ ] Add widgets:
  - [ ] Classification requests/min
  - [ ] OCR requests/min
  - [ ] GPU utilization (%)
  - [ ] GPU memory usage (GB)
  - [ ] Model inference latency (ms)
  - [ ] Queue depth

#### **CloudWatch Alarms**

**Critical Alarms** (PagerDuty):
- [ ] Backend API: Error rate > 5% for 5 minutes
- [ ] Backend API: Latency p95 > 500ms for 5 minutes
- [ ] ML Service: GPU memory > 90% for 5 minutes
- [ ] Database: CPU > 80% for 10 minutes
- [ ] Database: Connections > 80% of max

**Warning Alarms** (Slack):
- [ ] Backend API: Latency p95 > 300ms for 5 minutes
- [ ] ML Service: Queue depth > 100 for 5 minutes
- [ ] Classification accuracy < 95% (daily check)
- [ ] OCR confidence < 0.80 average (daily check)

#### **Log Aggregation**

**CloudWatch Logs**:
- [ ] Create log groups:
  - [ ] `/aws/roi-systems/backend`
  - [ ] `/aws/roi-systems/ml`
  - [ ] `/aws/rds/postgresql`
- [ ] Configure log retention: 90 days
- [ ] Setup log insights queries:
  - [ ] Error analysis
  - [ ] Slow query detection
  - [ ] User activity tracking

---

### **9. Security Hardening** ⏸️

#### **Network Security**
- [ ] Configure security groups (least privilege)
- [ ] Enable VPC flow logs
- [ ] Setup WAF rules on ALB
- [ ] Enable DDoS protection (Shield Standard)

#### **Application Security**
- [ ] Enable rate limiting (API: 100 req/min/IP)
- [ ] Configure CORS policies
- [ ] Enable request signing (API Gateway)
- [ ] Setup API key rotation (every 90 days)

#### **Data Security**
- [ ] Verify encryption at rest (RDS, S3)
- [ ] Verify encryption in transit (TLS 1.3)
- [ ] Configure backup encryption
- [ ] Setup KMS key rotation

#### **Access Control**
- [ ] Configure IAM roles (least privilege)
- [ ] Enable MFA for admin users
- [ ] Setup AWS SSO
- [ ] Configure audit logging (CloudTrail)

---

### **10. Backup & Disaster Recovery** ⏸️

#### **Database Backups**
- [ ] Enable automated backups (daily)
- [ ] Configure backup retention: 30 days
- [ ] Setup snapshot to S3 (weekly)
- [ ] Test restore procedure
- [ ] Document RTO: 1 hour, RPO: 1 hour

#### **S3 Backups**
- [ ] Enable versioning
- [ ] Configure cross-region replication (us-west-2)
- [ ] Setup lifecycle policies
- [ ] Test restore procedure

#### **Disaster Recovery Plan**
- [ ] Document failover procedures
- [ ] Setup standby RDS instance (us-west-2)
- [ ] Configure Route 53 health checks
- [ ] Test DR failover (quarterly)

---

### **11. Performance Optimization** ⏸️

#### **Database Optimization**
- [ ] Create indexes on frequently queried columns
- [ ] Configure connection pooling (max: 100)
- [ ] Enable query plan caching
- [ ] Setup read replicas (if needed)

#### **API Optimization**
- [ ] Enable response compression (gzip)
- [ ] Configure API caching (CloudFront)
- [ ] Optimize payload sizes
- [ ] Enable HTTP/2

#### **ML Service Optimization**
- [ ] Enable batch inference
- [ ] Configure model caching
- [ ] Optimize GPU utilization (target: 60-80%)
- [ ] Setup model versioning

---

### **12. Documentation** ⏸️

- [ ] Update runbook with production endpoints
- [ ] Document deployment procedures
- [ ] Create troubleshooting guide
- [ ] Document monitoring dashboards
- [ ] Update API documentation
- [ ] Create user guide

---

## 🚀 **Deployment Execution**

### **Stage 1: Pre-Production Validation** (Week 1)
- [ ] Complete all infrastructure setup
- [ ] Deploy to staging environment
- [ ] Run full test suite
- [ ] Perform load testing
- [ ] Security audit
- [ ] Stakeholder sign-off

### **Stage 2: Production Deployment** (Week 2)
- [ ] Schedule maintenance window
- [ ] Deploy database migrations
- [ ] Deploy backend API
- [ ] Deploy ML service
- [ ] Verify health checks
- [ ] Run smoke tests

### **Stage 3: Monitoring & Validation** (Week 3)
- [ ] Monitor error rates (target: <0.1%)
- [ ] Monitor performance (target: p95 <200ms)
- [ ] Monitor costs
- [ ] Gather user feedback
- [ ] Fine-tune configurations

### **Stage 4: Full Production** (Week 4)
- [ ] Remove maintenance mode
- [ ] Enable auto-scaling
- [ ] Configure alerts
- [ ] Schedule regular reviews
- [ ] Celebrate launch! 🎉

---

## 📊 **Success Criteria**

### **Performance Metrics**
- ✅ API latency p95 < 200ms
- ✅ Classification accuracy > 99%
- ✅ OCR confidence > 0.85 average
- ✅ Processing time < 30s per document
- ✅ Throughput > 1000 docs/hour
- ✅ Error rate < 0.1%

### **Availability Metrics**
- ✅ Uptime > 99.9% (SLA)
- ✅ Database availability > 99.95%
- ✅ Mean time to recovery (MTTR) < 15 minutes

### **Cost Metrics**
- ✅ Processing cost < $0.50 per 1000 documents
- ✅ Monthly AWS cost < $5,000
- ✅ Cost per transaction < $0.10

---

## 📝 **Post-Deployment Tasks**

### **Week 1**
- [ ] Monitor all metrics daily
- [ ] Review logs for anomalies
- [ ] Gather user feedback
- [ ] Address any critical issues

### **Week 2-4**
- [ ] Performance tuning
- [ ] Cost optimization
- [ ] Feature enhancements
- [ ] Documentation updates

### **Month 2-3**
- [ ] Quarterly DR test
- [ ] Security audit
- [ ] Capacity planning
- [ ] Model retraining (if needed)

---

## 🆘 **Rollback Procedure**

**If critical issues occur**:

1. **Stop Traffic**:
   ```bash
   # Update ALB target group health check to fail
   aws elbv2 modify-target-group --target-group-arn $TG_ARN --health-check-path /maintenance
   ```

2. **Revert Code**:
   ```bash
   # Backend
   cd /opt/roi-systems/backend
   git checkout tags/v0.9.0  # Previous stable version
   npm run build
   sudo systemctl restart roi-backend

   # ML Service
   cd /opt/roi-systems/ml
   git checkout tags/v0.9.0
   sudo systemctl restart roi-ml
   ```

3. **Revert Database** (if migrations ran):
   ```bash
   npx prisma migrate resolve --rolled-back <migration_name>
   ```

4. **Verify Rollback**:
   ```bash
   curl https://api.roisystems.com/health
   ```

5. **Restore Traffic**:
   ```bash
   # Restore health check
   aws elbv2 modify-target-group --target-group-arn $TG_ARN --health-check-path /health
   ```

6. **Post-Mortem**:
   - Document issue
   - Identify root cause
   - Create action items
   - Update runbook

---

## ✅ **Sign-Off**

**Deployment approved by**:
- [ ] Technical Lead: _________________  Date: _______
- [ ] DevOps Lead: _________________  Date: _______
- [ ] Security Lead: _________________  Date: _______
- [ ] Product Manager: _________________  Date: _______

**Deployment Status**: ⏸️ **READY FOR EXECUTION**

---

**Document Version**: 1.0
**Last Updated**: October 14, 2025
**Next Review**: November 14, 2025
