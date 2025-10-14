# ROI Systems - AWS Infrastructure as Code

Production-ready Terraform configuration for ROI Systems platform deployment on AWS.

## 📁 Project Structure

```
terraform/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── prod/
│       ├── main.tf
│       ├── terraform.tfvars
│       └── backend.tf
├── modules/
│   ├── networking/
│   ├── compute/
│   ├── database/
│   ├── storage/
│   ├── security/
│   ├── monitoring/
│   └── cdn/
├── scripts/
│   ├── init.sh
│   ├── deploy.sh
│   └── destroy.sh
└── docs/
    ├── ARCHITECTURE.md
    ├── DEPLOYMENT.md
    └── COST_ESTIMATION.md
```

## 🚀 Quick Start

### Prerequisites

1. **AWS CLI configured**:
```bash
aws configure
# Enter AWS Access Key ID, Secret Access Key, Region
```

2. **Terraform installed** (v1.6+):
```bash
brew install terraform  # macOS
# or
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
```

3. **Environment variables**:
```bash
export TF_VAR_db_password="your-secure-password"
export TF_VAR_jwt_secret="your-jwt-secret"
```

### Initialize Terraform

```bash
cd terraform/environments/dev
terraform init
```

### Plan Infrastructure

```bash
terraform plan -out=tfplan
```

### Apply Infrastructure

```bash
terraform apply tfplan
```

### Destroy Infrastructure

```bash
terraform destroy
```

## 🏗️ Architecture Overview

### Network Architecture
- **VPC**: Multi-AZ with public and private subnets
- **NAT Gateway**: High availability with one per AZ
- **Load Balancer**: Application Load Balancer with SSL termination
- **CloudFront**: CDN for static assets and API caching

### Compute Architecture
- **ECS Fargate**: Containerized backend and ML services
- **Lambda**: Serverless functions for event processing
- **EC2 (optional)**: GPU instances for ML training

### Database Architecture
- **RDS PostgreSQL**: Multi-AZ with read replicas
- **ElastiCache Redis**: Cluster mode for caching and queues
- **DynamoDB**: Session storage (if needed)

### Security Architecture
- **WAF**: Web application firewall
- **Secrets Manager**: Credential management
- **KMS**: Encryption key management
- **IAM**: Least privilege access

## 📊 Environments

### Development
- **Purpose**: Feature development and testing
- **Cost**: ~$300/month
- **Instances**: Single AZ, smaller instance sizes
- **Auto-scaling**: Disabled

### Staging
- **Purpose**: Pre-production validation
- **Cost**: ~$800/month
- **Instances**: Multi-AZ, production-like
- **Auto-scaling**: Enabled

### Production
- **Purpose**: Live customer traffic
- **Cost**: ~$2,500/month
- **Instances**: Multi-AZ, high availability
- **Auto-scaling**: Enabled with aggressive policies

## 🔐 Security Best Practices

1. **Secrets Management**:
   - All secrets in AWS Secrets Manager
   - KMS encryption for all data at rest
   - TLS 1.3 for data in transit

2. **Network Security**:
   - Private subnets for databases and application servers
   - Security groups with least privilege
   - WAF rules for common attacks

3. **Access Control**:
   - IAM roles with temporary credentials
   - MFA required for production access
   - CloudTrail logging enabled

## 📈 Monitoring & Alerting

### CloudWatch Dashboards
- **Backend API**: Request rate, latency, errors
- **ML Service**: GPU utilization, inference latency
- **Database**: CPU, connections, replication lag
- **Cost**: Daily spend by service

### Alerts
- **Critical**: PagerDuty integration
  - API error rate > 1%
  - Database CPU > 80%
  - ECS task failures

- **Warning**: Slack integration
  - API latency p95 > 500ms
  - Memory usage > 80%
  - Cost increase > 20%

## 💰 Cost Optimization

### Strategies Implemented
1. **Compute**:
   - Fargate Spot for non-critical workloads (70% savings)
   - Auto-scaling based on metrics
   - Reserved Instances for predictable workloads

2. **Storage**:
   - S3 Intelligent-Tiering
   - Lifecycle policies (30 days → Glacier)
   - CloudFront caching (reduced origin requests)

3. **Database**:
   - Read replicas for read-heavy workloads
   - Connection pooling (RDS Proxy)
   - Automated snapshots cleanup

### Monthly Cost Breakdown (Production)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| ECS Fargate | 4 vCPU, 8GB RAM × 3 | $450 |
| RDS PostgreSQL | db.r5.large Multi-AZ | $380 |
| ElastiCache | cache.r5.large × 2 | $280 |
| S3 + CloudFront | 1TB storage, 10TB transfer | $180 |
| ALB | 2 load balancers | $40 |
| NAT Gateway | 2 gateways | $90 |
| CloudWatch + X-Ray | Logs + tracing | $120 |
| Secrets Manager | 50 secrets | $20 |
| **Total** | | **~$1,560/month** |

**Note**: Costs scale with usage. Actual production costs may be $2,000-$3,000/month with auto-scaling.

## 🔄 Backup & Disaster Recovery

### RDS Backups
- **Automated backups**: Daily snapshots, 30-day retention
- **Manual snapshots**: Before major deployments
- **Cross-region replication**: us-west-2 (DR region)
- **Point-in-time recovery**: Up to 35 days

### S3 Backups
- **Versioning**: Enabled on all critical buckets
- **Cross-region replication**: Enabled for documents
- **Glacier archival**: 90-day lifecycle policy

### Recovery Objectives
- **RTO** (Recovery Time Objective): 1 hour
- **RPO** (Recovery Point Objective): 5 minutes

## 📝 Deployment Process

### Step 1: Plan
```bash
cd terraform/environments/prod
terraform plan -out=tfplan
```

### Step 2: Review
- Review terraform plan output
- Check cost estimation
- Verify security groups
- Confirm backup policies

### Step 3: Apply
```bash
terraform apply tfplan
```

### Step 4: Validate
```bash
# Test endpoints
curl https://api.roisystems.com/health

# Check database
aws rds describe-db-instances

# Verify monitoring
aws cloudwatch get-dashboard --dashboard-name roi-systems-prod
```

### Step 5: Document
- Update architecture diagrams
- Record deployed versions
- Document any manual steps

## 🛠️ Maintenance

### Daily
- [ ] Review CloudWatch alarms
- [ ] Check cost anomalies
- [ ] Review security findings (Security Hub)

### Weekly
- [ ] Review auto-scaling metrics
- [ ] Check backup completeness
- [ ] Review access logs

### Monthly
- [ ] Cost optimization review
- [ ] Security audit
- [ ] Update Terraform modules
- [ ] Review and rotate secrets

## 🚨 Troubleshooting

### Common Issues

**Issue**: Terraform state lock
```bash
# Force unlock (use with caution)
terraform force-unlock <lock-id>
```

**Issue**: ECS tasks failing to start
```bash
# Check task logs
aws logs tail /ecs/roi-systems-backend --follow
```

**Issue**: Database connection failures
```bash
# Verify security group rules
aws ec2 describe-security-groups --group-ids <sg-id>

# Test connectivity
nc -zv <rds-endpoint> 5432
```

**Issue**: High costs
```bash
# Check cost by service
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

## 📚 Additional Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)

## 🤝 Support

- **Technical Issues**: devops@roisystems.com
- **Cost Questions**: finance@roisystems.com
- **Security Concerns**: security@roisystems.com

---

**Version**: 1.0.0
**Last Updated**: October 14, 2025
**Maintained by**: DevOps Team
