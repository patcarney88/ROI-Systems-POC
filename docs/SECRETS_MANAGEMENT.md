# Secrets Management Guide

## Table of Contents
- [Overview](#overview)
- [Security Architecture](#security-architecture)
- [Secret Types and Requirements](#secret-types-and-requirements)
- [Development Workflow](#development-workflow)
- [Production Workflow](#production-workflow)
- [Secret Rotation](#secret-rotation)
- [AWS Secrets Manager Integration](#aws-secrets-manager-integration)
- [Docker Secrets](#docker-secrets)
- [Kubernetes Secrets](#kubernetes-secrets)
- [Security Best Practices](#security-best-practices)
- [Compliance Requirements](#compliance-requirements)
- [Troubleshooting](#troubleshooting)

## Overview

The ROI Systems POC implements enterprise-grade secrets management following zero-trust principles and industry security standards (NIST SP 800-63B, OWASP, SOC2, PCI-DSS).

### Key Features

- **Cryptographically Secure Generation**: All secrets generated using OpenSSL and /dev/urandom
- **Automated Rotation**: Built-in secret rotation with zero-downtime
- **Environment Isolation**: Separate secrets for dev, staging, and production
- **AWS Integration**: Native AWS Secrets Manager and KMS support
- **Compliance Validated**: Automated validation against security standards
- **Zero Default Secrets**: No hardcoded credentials or defaults

## Security Architecture

### Defense in Depth Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  - JWT validation with dual-key support                     │
│  - Encrypted sensitive data (AES-256-GCM)                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Secret Storage Layer                       │
│  Development:  .env files (600 permissions)                 │
│  Staging:      AWS Secrets Manager + KMS                    │
│  Production:   AWS Secrets Manager + KMS + HSM             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
│  - Encrypted EBS volumes                                    │
│  - VPC private subnets                                      │
│  - Security groups with least privilege                    │
└─────────────────────────────────────────────────────────────┘
```

### Secret Categories

| Category | Purpose | Min Length | Rotation Period | Compliance |
|----------|---------|------------|-----------------|------------|
| JWT Tokens | Authentication | 64 chars | 90 days | SOC2, OWASP |
| Database | Data access | 32 chars | 90 days | PCI-DSS |
| API Keys | Service auth | 48 chars | 90 days | SOC2 |
| Encryption | Data protection | 64 chars | 180 days | HIPAA, PCI-DSS |
| Session | User sessions | 64 chars | 90 days | OWASP |

## Secret Types and Requirements

### 1. JWT Secrets

**Purpose**: Sign and verify JSON Web Tokens for authentication

```bash
# Generation
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
```

**Requirements**:
- Minimum 64 characters (512 bits)
- Cryptographically random
- Different secrets for access and refresh tokens
- High entropy (>4.0 bits/char)

**Validation Checks**:
- ✓ Length >= 64 characters
- ✓ Shannon entropy >= 4.0
- ✓ No common patterns
- ✓ Different from refresh secret

### 2. Database Passwords

**Purpose**: Authenticate to PostgreSQL database

```bash
# Generation
DB_PASSWORD=$(LC_ALL=C tr -dc 'A-Za-z0-9!@#$%^&*()_+=-' < /dev/urandom | head -c 32)
```

**Requirements**:
- Minimum 32 characters
- Mixed case, numbers, special characters
- No dictionary words
- Unique per environment

**PCI-DSS Requirements**:
- Change every 90 days
- Cannot reuse last 4 passwords
- Must meet complexity requirements

### 3. Redis Passwords

**Purpose**: Secure Redis cache access

```bash
# Generation
REDIS_PASSWORD=$(LC_ALL=C tr -dc 'A-Za-z0-9!@#$%^&*()_+=-' < /dev/urandom | head -c 32)
```

**Requirements**:
- Minimum 32 characters
- High complexity
- Protected in transit (TLS)

### 4. Encryption Keys

**Purpose**: Encrypt sensitive data at rest

```bash
# Generation
ENCRYPTION_KEY=$(openssl rand -base64 64)
```

**Requirements**:
- Minimum 64 characters (512 bits)
- AES-256-GCM compatible
- Stored in KMS for production
- Versioned for key rotation

**HIPAA/PCI-DSS Requirements**:
- AES-256 encryption
- Key rotation every 180 days
- Secure key storage (HSM/KMS)
- Audit logging

### 5. API Keys

**Purpose**: Internal service authentication

```bash
# Generation
INTERNAL_API_KEY=$(openssl rand -base64 48)
WEBHOOK_SECRET=$(openssl rand -base64 48)
```

**Requirements**:
- Minimum 48 characters (384 bits)
- Unique per service
- Rate limiting enforced

## Development Workflow

### Quick Start (First Time Setup)

```bash
# 1. Generate secrets for development
./scripts/generate-secrets.sh development

# 2. Validate generated secrets
./scripts/validate-secrets.sh development

# 3. Start services with secrets
docker-compose --env-file .env.development up -d

# 4. Verify services are healthy
docker-compose ps
```

### Step-by-Step Process

#### Step 1: Generate Secrets

```bash
cd /path/to/roi-systems-poc
./scripts/generate-secrets.sh development
```

**What it does**:
- Generates all required secrets using cryptographically secure methods
- Creates `.env.development` file with secure file permissions (600)
- Backs up existing secrets if present
- Prompts for external service credentials (Anthropic API, etc.)
- Validates secret strength automatically

**Output**:
```
================================================================================
ROI Systems POC - Secure Secret Generation
================================================================================

Environment: development
Output File: /path/to/.env.development

Generated Secrets:
  - JWT_SECRET (64 chars)
  - JWT_REFRESH_SECRET (64 chars)
  - DB_PASSWORD (32 chars)
  - REDIS_PASSWORD (32 chars)
  - SESSION_SECRET (64 chars)
  - ENCRYPTION_KEY (64 chars)
  - INTERNAL_API_KEY (48 chars)
  - WEBHOOK_SECRET (48 chars)

✓ All secrets generated successfully
```

#### Step 2: Validate Secrets

```bash
./scripts/validate-secrets.sh development
```

**Validation Checks**:
- ✓ Secret existence
- ✓ Minimum length requirements
- ✓ Shannon entropy calculation
- ✓ Character complexity
- ✓ No common patterns
- ✓ File permissions
- ✓ Rotation status
- ✓ Production requirements (if applicable)

**Expected Output**:
```
================================================================================
Secret Validation Report
================================================================================

Environment: development
File: .env.development
Validated: 2025-10-14 12:00:00

Results:
  Total Checks: 42
  Passed: 42
  Failed: 0
  Warnings: 0

  Pass Rate: 100.0%

✓ All critical validations passed

Status: COMPLIANT
```

#### Step 3: Secure the Secrets File

```bash
# Set restrictive permissions
chmod 600 .env.development

# Verify permissions
ls -la .env.development
# Should show: -rw------- (owner read/write only)

# Add to .gitignore (already included)
grep ".env" .gitignore
```

#### Step 4: Use Secrets in Application

```bash
# Start services with environment file
docker-compose --env-file .env.development up -d

# Or for specific services
docker-compose --env-file .env.development up -d api auth

# Check logs for any secret-related errors
docker-compose logs api | grep -i "secret\|jwt\|auth"
```

### Daily Development

```bash
# Start services (uses .env.development by default)
docker-compose up -d

# Check service health
curl http://localhost:4000/health

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### Adding New Secrets

1. **Add to generation script** (`scripts/generate-secrets.sh`):
```bash
# Add new secret generation
NEW_SECRET=$(generate_secret 48)
```

2. **Add to validation script** (`scripts/validate-secrets.sh`):
```bash
# Add to MIN_LENGTHS array
declare -A MIN_LENGTHS=(
    ["NEW_SECRET"]=48
)
```

3. **Update documentation** (this file)

4. **Regenerate secrets**:
```bash
./scripts/generate-secrets.sh development
```

## Production Workflow

### Prerequisites

- AWS CLI configured with appropriate credentials
- Access to AWS Secrets Manager
- KMS key created for encryption
- Production environment approved

### Production Secret Generation

```bash
# Generate production secrets
./scripts/generate-secrets.sh production

# IMPORTANT: You will be prompted for:
# - Anthropic API Key
# - AWS Access Key ID
# - AWS Secret Access Key
```

**Production-Specific Features**:
- Longer secret lengths
- Additional entropy validation
- Mandatory external service credentials
- AWS Secrets Manager integration
- Automatic KMS encryption

### Uploading to AWS Secrets Manager

#### Manual Upload

```bash
# Set AWS region
export AWS_REGION=us-east-1

# Create secret in AWS Secrets Manager
aws secretsmanager create-secret \
    --name roi-poc/production/app-secrets \
    --description "ROI Systems POC production secrets" \
    --secret-string file://.env.production \
    --kms-key-id alias/roi-poc-secrets

# Verify secret created
aws secretsmanager describe-secret \
    --secret-id roi-poc/production/app-secrets
```

#### Automatic Upload (via rotation script)

```bash
# Rotation script automatically uploads to Secrets Manager
./scripts/rotate-secrets.sh production all
```

### Retrieving Secrets in Production

#### Option 1: ECS Task Definition

```json
{
  "secrets": [
    {
      "name": "JWT_SECRET",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:roi-poc/production/app-secrets:JWT_SECRET::"
    },
    {
      "name": "DB_PASSWORD",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:roi-poc/production/app-secrets:DB_PASSWORD::"
    }
  ]
}
```

#### Option 2: Kubernetes External Secrets

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: roi-poc-secrets
  data:
  - secretKey: JWT_SECRET
    remoteRef:
      key: roi-poc/production/app-secrets
      property: JWT_SECRET
```

#### Option 3: Runtime Retrieval (Node.js)

```javascript
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

async function getSecrets() {
  const client = new SecretsManagerClient({ region: "us-east-1" });

  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: "roi-poc/production/app-secrets",
    })
  );

  return JSON.parse(response.SecretString);
}
```

## Secret Rotation

### Rotation Policy

| Environment | Frequency | Method | Downtime |
|-------------|-----------|--------|----------|
| Development | As needed | Manual/Automated | Acceptable |
| Staging | 90 days | Automated | Zero |
| Production | 90 days | Automated | Zero |

### Automated Rotation Process

#### Rotate All Secrets

```bash
# Development
./scripts/rotate-secrets.sh development all

# Production (requires confirmation)
./scripts/rotate-secrets.sh production all
```

#### Rotate Specific Secret Types

```bash
# JWT tokens only
./scripts/rotate-secrets.sh production jwt

# Database password only
./scripts/rotate-secrets.sh production database

# Redis password only
./scripts/rotate-secrets.sh production redis

# API keys only
./scripts/rotate-secrets.sh production api_keys

# Encryption keys only (requires data re-encryption)
./scripts/rotate-secrets.sh production encryption
```

### Zero-Downtime Rotation Strategy

The rotation process implements a dual-secret validation period:

```
1. Generate new secrets
2. Add new secrets alongside old secrets (1 hour grace period)
3. Update services to use new secrets
4. Verify service health
5. Remove old secrets after grace period
```

**Timeline**:
```
T+0min:   New secrets generated
T+0min:   Old secrets still valid
T+5min:   Services updated with new secrets
T+10min:  Health checks pass
T+60min:  Old secrets retired
```

### Manual Rotation Steps

If automated rotation fails or manual intervention is required:

```bash
# 1. Backup current secrets
cp .env.production .env.production.backup-$(date +%Y%m%d)

# 2. Generate new individual secrets
NEW_JWT_SECRET=$(openssl rand -base64 64)

# 3. Update .env.production manually
sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" .env.production

# 4. Update AWS Secrets Manager
aws secretsmanager update-secret \
    --secret-id roi-poc/production/app-secrets \
    --secret-string file://.env.production

# 5. Update running services (Kubernetes)
kubectl rollout restart deployment/api -n production

# 6. Verify service health
kubectl get pods -n production
curl https://api.roi-systems.com/health

# 7. Monitor logs for errors
kubectl logs -f deployment/api -n production
```

### Rotation Verification

```bash
# Validate rotated secrets
./scripts/validate-secrets.sh production

# Check rotation metadata
grep "SECRETS_ROTATION_DUE" .env.production

# Review rotation log
cat .secrets-backup/rotation-log-*.log
```

## AWS Secrets Manager Integration

### Setup

#### 1. Create KMS Key

```bash
# Create KMS key for secret encryption
aws kms create-key \
    --description "ROI Systems POC secrets encryption key" \
    --key-policy file://kms-key-policy.json

# Create alias
aws kms create-alias \
    --alias-name alias/roi-poc-secrets \
    --target-key-id <key-id>
```

**kms-key-policy.json**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM policies",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow secrets manager",
      "Effect": "Allow",
      "Principal": {
        "Service": "secretsmanager.amazonaws.com"
      },
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "*"
    }
  ]
}
```

#### 2. Create IAM Policy

```bash
aws iam create-policy \
    --policy-name roi-poc-secrets-access \
    --policy-document file://secrets-policy.json
```

**secrets-policy.json**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:123456789012:secret:roi-poc/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "arn:aws:kms:us-east-1:123456789012:key/*"
    }
  ]
}
```

#### 3. Attach Policy to Role

```bash
# For ECS tasks
aws iam attach-role-policy \
    --role-name roi-poc-ecs-task-role \
    --policy-arn arn:aws:iam::123456789012:policy/roi-poc-secrets-access

# For Kubernetes (via IRSA)
aws iam attach-role-policy \
    --role-name roi-poc-k8s-sa-role \
    --policy-arn arn:aws:iam::123456789012:policy/roi-poc-secrets-access
```

### Automatic Rotation with Lambda

**Lambda Function** (secrets-rotation-lambda):
```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

exports.handler = async (event) => {
  const secretId = event.SecretId;
  const token = event.ClientRequestToken;
  const step = event.Step;

  switch (step) {
    case 'createSecret':
      // Generate new secret
      const newSecret = require('crypto').randomBytes(32).toString('base64');
      await secretsManager.putSecretValue({
        SecretId: secretId,
        SecretString: newSecret,
        VersionStages: ['AWSPENDING'],
        ClientRequestToken: token
      }).promise();
      break;

    case 'setSecret':
      // Update application to use new secret
      // This would trigger deployment update
      break;

    case 'testSecret':
      // Verify new secret works
      break;

    case 'finishSecret':
      // Finalize rotation
      await secretsManager.updateSecretVersionStage({
        SecretId: secretId,
        VersionStage: 'AWSCURRENT',
        MoveToVersionId: token,
        RemoveFromVersionId: event.PreviousVersion
      }).promise();
      break;
  }

  return { statusCode: 200 };
};
```

## Docker Secrets

### Production Docker Compose with Secrets

Create `docker-compose.prod.yml`:

```yaml
version: '3.9'

services:
  api:
    image: roi-poc-api:latest
    secrets:
      - jwt_secret
      - jwt_refresh_secret
      - db_password
      - redis_password
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret
      JWT_REFRESH_SECRET_FILE: /run/secrets/jwt_refresh_secret
      DB_PASSWORD_FILE: /run/secrets/db_password
      REDIS_PASSWORD_FILE: /run/secrets/redis_password

secrets:
  jwt_secret:
    external: true
  jwt_refresh_secret:
    external: true
  db_password:
    external: true
  redis_password:
    external: true
```

### Creating Docker Secrets

```bash
# Create secrets from files
echo "$JWT_SECRET" | docker secret create jwt_secret -
echo "$JWT_REFRESH_SECRET" | docker secret create jwt_refresh_secret -
echo "$DB_PASSWORD" | docker secret create db_password -
echo "$REDIS_PASSWORD" | docker secret create redis_password -

# Verify secrets created
docker secret ls
```

### Reading Secrets in Application

```javascript
const fs = require('fs');

function getSecret(secretName) {
  const secretFile = process.env[`${secretName}_FILE`];

  if (secretFile && fs.existsSync(secretFile)) {
    return fs.readFileSync(secretFile, 'utf8').trim();
  }

  // Fallback to environment variable
  return process.env[secretName];
}

const jwtSecret = getSecret('JWT_SECRET');
```

## Kubernetes Secrets

### Create Kubernetes Secrets

#### From Environment File

```bash
# Create secret from .env file
kubectl create secret generic roi-poc-secrets \
    --from-env-file=.env.production \
    --namespace=production

# Verify secret created
kubectl get secrets -n production
kubectl describe secret roi-poc-secrets -n production
```

#### From Individual Values

```bash
kubectl create secret generic roi-poc-secrets \
    --from-literal=JWT_SECRET="$JWT_SECRET" \
    --from-literal=JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
    --from-literal=DB_PASSWORD="$DB_PASSWORD" \
    --from-literal=REDIS_PASSWORD="$REDIS_PASSWORD" \
    --namespace=production
```

### Kubernetes Secret Template

Create `k8s/secrets.yaml.template`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: roi-poc-secrets
  namespace: production
type: Opaque
stringData:
  JWT_SECRET: "<JWT_SECRET>"
  JWT_REFRESH_SECRET: "<JWT_REFRESH_SECRET>"
  DB_PASSWORD: "<DB_PASSWORD>"
  REDIS_PASSWORD: "<REDIS_PASSWORD>"
  ENCRYPTION_KEY: "<ENCRYPTION_KEY>"
  INTERNAL_API_KEY: "<INTERNAL_API_KEY>"
```

**Usage**:
```bash
# Replace placeholders with actual secrets
envsubst < k8s/secrets.yaml.template > k8s/secrets.yaml

# Apply secrets
kubectl apply -f k8s/secrets.yaml

# Delete template file (contains actual secrets)
rm k8s/secrets.yaml
```

### Using Secrets in Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: production
spec:
  template:
    spec:
      containers:
      - name: api
        image: roi-poc-api:latest
        envFrom:
        - secretRef:
            name: roi-poc-secrets
        # Or individual secrets
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: roi-poc-secrets
              key: JWT_SECRET
```

### Sealed Secrets (GitOps)

For storing encrypted secrets in Git:

```bash
# Install Sealed Secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.18.0/controller.yaml

# Create sealed secret
kubeseal --format=yaml < k8s/secrets.yaml > k8s/sealed-secrets.yaml

# Commit sealed secret to Git (it's encrypted)
git add k8s/sealed-secrets.yaml
git commit -m "Add sealed secrets"

# Controller automatically decrypts in cluster
```

## Security Best Practices

### Secret Generation

✓ **DO**:
- Use cryptographically secure random number generators
- Generate secrets programmatically, never manually
- Use appropriate length for secret type (minimum 32 chars for passwords)
- Validate generated secrets before use
- Document secret purpose and requirements

✗ **DON'T**:
- Use predictable patterns or sequences
- Reuse secrets across environments
- Use dictionary words or personal information
- Store secrets in plaintext anywhere
- Share secrets via email or chat

### Secret Storage

✓ **DO**:
- Encrypt secrets at rest (KMS, Vault, Secrets Manager)
- Use file permissions 600 for local secret files
- Store production secrets in dedicated secret management systems
- Implement secrets versioning
- Enable audit logging for secret access

✗ **DON'T**:
- Commit secrets to version control
- Store secrets in application logs
- Include secrets in error messages
- Share secret files via insecure channels
- Use publicly accessible storage

### Secret Access

✓ **DO**:
- Implement least privilege access
- Use short-lived credentials when possible
- Rotate secrets regularly (90 days)
- Monitor secret access patterns
- Require MFA for production secret access

✗ **DON'T**:
- Grant broad secret access permissions
- Use long-lived credentials unnecessarily
- Allow anonymous secret access
- Skip access logging
- Share administrator credentials

### Secret Rotation

✓ **DO**:
- Rotate secrets every 90 days (minimum)
- Implement automated rotation where possible
- Use dual-secret validation during rotation
- Test rotation process regularly
- Document rotation procedures

✗ **DON'T**:
- Delay rotation past due date
- Skip rotation testing
- Cause downtime during rotation
- Forget to update dependent systems
- Reuse previous secret values

### Incident Response

✓ **DO**:
- Have a secret compromise response plan
- Rotate all secrets immediately if compromised
- Audit all systems for unauthorized access
- Document incident and remediation
- Conduct post-mortem review

✗ **DON'T**:
- Delay response to potential compromise
- Assume only one secret is compromised
- Skip security audit after incident
- Ignore lessons learned
- Resume operations without verification

## Compliance Requirements

### SOC 2 Type II

**Control Requirements**:
- CC6.1: Logical and physical access controls
- CC6.2: Prior authorization before granting access
- CC6.3: Access provision and de-provisioning
- CC7.2: System monitoring

**Implementation**:
- ✓ All secrets stored encrypted
- ✓ Access requires authentication
- ✓ Audit logging enabled
- ✓ Regular secret rotation
- ✓ Automated compliance validation

### PCI-DSS

**Requirement 8**: Identify and authenticate access to system components

**Implementation**:
- ✓ Unique credentials per environment
- ✓ Strong authentication (multi-factor for production)
- ✓ 90-day password rotation
- ✓ Password complexity requirements
- ✓ Cannot reuse last 4 passwords

### HIPAA

**Technical Safeguards** (45 CFR § 164.312):
- Access control
- Audit controls
- Integrity controls
- Transmission security

**Implementation**:
- ✓ Encrypted storage (AES-256)
- ✓ Access logging and monitoring
- ✓ Data integrity validation
- ✓ TLS for transmission
- ✓ Key management procedures

### NIST SP 800-63B

**Authenticator Assurance Levels**:
- AAL1: Single-factor authentication
- AAL2: Multi-factor authentication (MFA)
- AAL3: Multi-factor with hardware token

**Implementation**:
- ✓ Development: AAL1 (password-based)
- ✓ Staging: AAL2 (MFA required)
- ✓ Production: AAL2+ (MFA + IP restrictions)

## Troubleshooting

### Common Issues

#### Issue: "DB_PASSWORD environment variable required"

**Cause**: Environment file not loaded or secret not set

**Solution**:
```bash
# Verify environment file exists
ls -la .env.development

# Validate secrets
./scripts/validate-secrets.sh development

# Regenerate if needed
./scripts/generate-secrets.sh development

# Start with explicit env file
docker-compose --env-file .env.development up
```

#### Issue: "JWT signature verification failed"

**Cause**: JWT_SECRET mismatch between services

**Solution**:
```bash
# Check all services use same secret
docker-compose exec api printenv JWT_SECRET
docker-compose exec auth printenv JWT_SECRET

# If different, recreate services
docker-compose down
docker-compose --env-file .env.development up -d
```

#### Issue: "Secrets rotation failed"

**Cause**: Service health check failed with new secrets

**Solution**:
```bash
# Check rotation log
cat .secrets-backup/rotation-log-*.log

# Rollback to previous secrets
cp .env.production.backup .env.production

# Restart services
docker-compose --env-file .env.production up -d

# Investigate root cause
docker-compose logs api
```

#### Issue: "AWS Secrets Manager access denied"

**Cause**: Insufficient IAM permissions

**Solution**:
```bash
# Verify IAM role/policy
aws iam get-role --role-name roi-poc-ecs-task-role

# Test secret access
aws secretsmanager get-secret-value \
    --secret-id roi-poc/production/app-secrets

# Add required permissions if missing
aws iam attach-role-policy \
    --role-name roi-poc-ecs-task-role \
    --policy-arn arn:aws:iam::123456789012:policy/roi-poc-secrets-access
```

### Debug Commands

```bash
# View all environment variables (BE CAREFUL - shows secrets!)
docker-compose exec api printenv | sort

# Check secret file permissions
ls -la .env.*

# Validate specific secret
./scripts/validate-secrets.sh production 2>&1 | grep JWT_SECRET

# Test database connection with secret
docker-compose exec postgres psql -U $DB_USER -d roi_poc -c "SELECT 1"

# Test Redis connection with secret
docker-compose exec redis redis-cli -a $REDIS_PASSWORD ping
```

### Getting Help

- **Security Team**: security@roi-systems.com
- **DevOps Team**: devops@roi-systems.com
- **Emergency Rotation**: Run `./scripts/rotate-secrets.sh <env> all`
- **Documentation**: `/docs/SECRETS_MANAGEMENT.md` (this file)

## Additional Resources

- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html) - Authentication Guidelines
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
- [Kubernetes Secrets Security](https://kubernetes.io/docs/concepts/security/secrets-good-practices/)
- [Docker Secrets](https://docs.docker.com/engine/swarm/secrets/)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-14
**Owner**: Security Engineering Team
**Review Cycle**: Quarterly
