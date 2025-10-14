# Secret Rotation Policy

## Document Control

| Field | Value |
|-------|-------|
| Document Version | 1.0.0 |
| Effective Date | 2025-10-14 |
| Review Cycle | Quarterly |
| Owner | Security Engineering Team |
| Approver | Chief Security Officer |
| Compliance | SOC2, PCI-DSS, HIPAA, NIST SP 800-63B |

## Table of Contents

- [Overview](#overview)
- [Policy Statement](#policy-statement)
- [Scope](#scope)
- [Rotation Requirements](#rotation-requirements)
- [Rotation Procedures](#rotation-procedures)
- [Emergency Rotation](#emergency-rotation)
- [Compliance and Audit](#compliance-and-audit)
- [Roles and Responsibilities](#roles-and-responsibilities)
- [Exceptions](#exceptions)
- [References](#references)

## Overview

This policy establishes requirements and procedures for the regular rotation of secrets, credentials, and cryptographic keys used in the ROI Systems POC application. Secret rotation is a critical security control that reduces the impact of credential compromise and meets compliance requirements for SOC2, PCI-DSS, and HIPAA.

### Purpose

- Limit the window of opportunity for compromised credentials
- Meet regulatory compliance requirements
- Reduce risk of credential reuse across systems
- Enable security audit trails
- Maintain security hygiene

### Benefits

- **Risk Reduction**: Compromised secrets have limited lifespan
- **Compliance**: Meets SOC2, PCI-DSS, HIPAA rotation requirements
- **Detection**: Rotation failures can indicate compromised systems
- **Recovery**: Regular rotation enables faster incident response
- **Best Practice**: Aligns with industry security standards

## Policy Statement

All secrets, credentials, and cryptographic keys used in the ROI Systems POC application **MUST** be rotated according to the schedules and procedures defined in this policy. Failure to rotate secrets according to policy constitutes a security policy violation and may result in:

- Automated alerts to security team
- Incident investigation
- Service suspension (for critical violations)
- Audit findings
- Compliance failures

## Scope

### In Scope

This policy applies to:

- **Application Secrets**
  - JWT signing keys
  - JWT refresh token keys
  - Session secrets
  - API keys
  - Webhook secrets
  - Internal service credentials

- **Infrastructure Credentials**
  - Database passwords
  - Redis passwords
  - Elasticsearch passwords
  - AWS access keys
  - Service account credentials

- **Encryption Keys**
  - Data encryption keys (DEK)
  - Key encryption keys (KEK)
  - TLS/SSL certificates
  - SSH keys

- **Environments**
  - Development
  - Staging
  - Production
  - Disaster Recovery

### Out of Scope

- Third-party API keys (managed by external vendors)
- User passwords (covered by separate password policy)
- Hardware security module (HSM) master keys
- Root CA private keys (follows separate PKI policy)

## Rotation Requirements

### Rotation Schedules

| Secret Type | Environment | Frequency | Max Age | Compliance |
|-------------|-------------|-----------|---------|------------|
| JWT Secrets | Development | As needed | 180 days | N/A |
| JWT Secrets | Staging | 90 days | 90 days | SOC2 |
| JWT Secrets | Production | 90 days | 90 days | SOC2, PCI-DSS |
| Database Passwords | Development | As needed | 180 days | N/A |
| Database Passwords | Staging | 90 days | 90 days | PCI-DSS |
| Database Passwords | Production | 90 days | 90 days | PCI-DSS, HIPAA |
| API Keys | Development | As needed | 180 days | N/A |
| API Keys | Staging | 90 days | 90 days | SOC2 |
| API Keys | Production | 90 days | 90 days | SOC2 |
| Encryption Keys | All | 180 days | 180 days | HIPAA, PCI-DSS |
| TLS Certificates | All | Annual | 397 days | Industry Standard |
| AWS Access Keys | All | 90 days | 90 days | AWS Best Practice |

### Rotation Windows

| Environment | Preferred Time | Backup Window | Blackout Periods |
|-------------|----------------|---------------|------------------|
| Development | Anytime | Anytime | None |
| Staging | Tuesday-Thursday, 10:00-16:00 EST | Saturday 08:00-12:00 EST | End of month, holidays |
| Production | Tuesday-Thursday, 02:00-04:00 EST | Saturday 02:00-06:00 EST | End of quarter, Black Friday, holiday weekends |

### Rotation Triggers

Secrets **MUST** be rotated when:

1. **Scheduled**: Regular rotation schedule reached
2. **Compromised**: Suspected or confirmed credential compromise
3. **Personnel Change**: Employee with access leaves or changes roles
4. **System Breach**: Any security incident affecting system
5. **Compliance Audit**: Requested by auditors
6. **Vulnerability**: CVE affects secret storage/transmission
7. **Policy Update**: New security requirements introduced

### Secret Strength Requirements

After rotation, all secrets **MUST** meet these minimum requirements:

| Secret Type | Min Length | Entropy | Complexity | Validation |
|-------------|------------|---------|------------|------------|
| JWT Secrets | 64 chars | 4.0 bits/char | N/A | Automated |
| Passwords | 32 chars | 3.5 bits/char | 3+ char types | Automated |
| API Keys | 48 chars | 4.0 bits/char | N/A | Automated |
| Encryption Keys | 64 chars | 4.5 bits/char | N/A | Automated |

**Complexity Requirements**:
- At least 3 of: uppercase, lowercase, numbers, special characters
- No dictionary words
- No sequential characters (abc, 123)
- No repeated characters (aaa, 111)
- No common patterns (password, admin, etc.)

### Secret Reuse Prevention

- **MUST NOT** reuse any of the last **4 secrets** for the same purpose
- **MUST NOT** reuse secrets across different environments
- **MUST NOT** reuse secrets across different secret types
- **MUST** maintain secret history in secure audit log

### Downtime Requirements

| Environment | Max Downtime | Recovery Time Objective (RTO) |
|-------------|--------------|-------------------------------|
| Development | Acceptable | 4 hours |
| Staging | < 5 minutes | 30 minutes |
| Production | Zero downtime required | 15 minutes |

Production rotations **MUST** be zero-downtime using dual-secret validation.

## Rotation Procedures

### Standard Rotation Process

#### Phase 1: Pre-Rotation (T-24 hours)

1. **Notification**
   ```
   - Send notification to: engineering@roi-systems.com, security@roi-systems.com
   - Include: Date, time, affected services, expected duration
   - Require: Acknowledgment from on-call engineer
   ```

2. **Pre-Checks**
   ```bash
   # Validate current secrets
   ./scripts/validate-secrets.sh production

   # Check service health
   curl https://api.roi-systems.com/health

   # Verify backup systems
   aws backup describe-recovery-point --recovery-point-arn <arn>

   # Review rotation schedule
   grep "SECRETS_ROTATION_DUE" .env.production
   ```

3. **Prepare Rollback**
   ```bash
   # Backup current secrets
   cp .env.production .env.production.backup-$(date +%Y%m%d)

   # Tag current deployment
   kubectl label deployment api rotation-backup=pre-rotation-$(date +%Y%m%d)

   # Document current state
   kubectl get all -n production > pre-rotation-state.txt
   ```

#### Phase 2: Rotation Execution (T-0)

1. **Generate New Secrets**
   ```bash
   ./scripts/rotate-secrets.sh production all
   ```

2. **Update Secret Stores**
   ```bash
   # AWS Secrets Manager (automatic via script)
   aws secretsmanager describe-secret \
       --secret-id roi-poc/production/app-secrets

   # Kubernetes (if applicable)
   kubectl create secret generic roi-poc-secrets-new \
       --from-env-file=.env.production \
       --namespace=production
   ```

3. **Deploy with Dual-Secret Support**
   ```bash
   # Services validate both old and new secrets
   # 1-hour grace period for transition
   kubectl set env deployment/api \
       JWT_SECRET_OLD=$OLD_JWT_SECRET \
       JWT_SECRET_NEW=$NEW_JWT_SECRET
   ```

4. **Rolling Update**
   ```bash
   # Kubernetes rolling update
   kubectl rollout restart deployment/api -n production
   kubectl rollout restart deployment/auth -n production

   # Monitor rollout
   kubectl rollout status deployment/api -n production
   ```

#### Phase 3: Validation (T+10 minutes)

1. **Health Checks**
   ```bash
   # API health
   curl https://api.roi-systems.com/health

   # Authentication test
   curl -X POST https://api.roi-systems.com/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com","password":"TestPass123!"}'

   # Database connectivity
   kubectl exec -it deployment/api -n production -- \
       node -e "require('./src/lib/database').testConnection()"
   ```

2. **Functional Tests**
   ```bash
   # Run smoke tests
   npm run test:smoke:production

   # Check error rates
   kubectl logs -l app=api -n production | grep ERROR | wc -l

   # Monitor metrics
   # - Request success rate should be > 99.9%
   # - Response time should be < 200ms p95
   # - Error rate should be < 0.1%
   ```

3. **Security Validation**
   ```bash
   # Verify new secrets active
   ./scripts/validate-secrets.sh production

   # Check no old secrets in use
   kubectl get secrets -n production -o yaml | grep -v "OLD"

   # Audit log review
   aws cloudtrail lookup-events \
       --lookup-attributes AttributeKey=EventName,AttributeValue=GetSecretValue \
       --max-results 10
   ```

#### Phase 4: Finalization (T+1 hour)

1. **Remove Old Secrets**
   ```bash
   # Remove dual-secret environment variables
   kubectl set env deployment/api JWT_SECRET_OLD- -n production

   # Verify old secrets no longer used
   kubectl exec -it deployment/api -n production -- printenv | grep -v "OLD"
   ```

2. **Update Documentation**
   ```bash
   # Update rotation date
   echo "Last rotation: $(date)" >> docs/ROTATION_LOG.md

   # Update next rotation date
   sed -i "s/SECRETS_ROTATION_DUE=.*/SECRETS_ROTATION_DUE=$(date -d "+90 days" +%Y-%m-%d)/" .env.production
   ```

3. **Cleanup**
   ```bash
   # Remove old Kubernetes secrets
   kubectl delete secret roi-poc-secrets-old -n production

   # Archive rotation logs
   mv .secrets-backup/rotation-log-*.log archive/$(date +%Y)/
   ```

4. **Post-Rotation Report**
   ```
   Send report to: engineering@roi-systems.com, security@roi-systems.com

   Include:
   - Rotation completion time
   - Services affected
   - Any issues encountered
   - Downtime (if any)
   - Next rotation date
   - Validation results
   ```

### Automated Rotation

For environments with mature automation:

```bash
# Cron job for automated rotation (staging)
0 2 * * 2 /opt/roi-systems/scripts/rotate-secrets.sh staging all && \
    /opt/roi-systems/scripts/validate-secrets.sh staging && \
    mail -s "Staging Secret Rotation Complete" security@roi-systems.com < rotation-report.txt
```

**Automated rotation requirements**:
- ✓ Comprehensive health checks
- ✓ Automatic rollback on failure
- ✓ Alerting on rotation failure
- ✓ Success notification
- ✓ Audit logging

### Database Password Rotation

Special procedure for database password rotation:

```bash
# 1. Create new database user (temporary)
docker-compose exec postgres psql -U roi_user -d roi_poc -c \
    "CREATE USER roi_user_new WITH PASSWORD '$NEW_DB_PASSWORD';"

# 2. Grant same permissions
docker-compose exec postgres psql -U roi_user -d roi_poc -c \
    "GRANT ALL PRIVILEGES ON DATABASE roi_poc TO roi_user_new;"

# 3. Update application to use new user
kubectl set env deployment/api DATABASE_URL="postgresql://roi_user_new:$NEW_DB_PASSWORD@postgres:5432/roi_poc"

# 4. Verify connectivity
kubectl exec -it deployment/api -n production -- node -e "require('./src/lib/database').testConnection()"

# 5. After grace period, drop old user
docker-compose exec postgres psql -U postgres -d roi_poc -c \
    "DROP USER roi_user;"

# 6. Rename new user to standard name
docker-compose exec postgres psql -U postgres -d roi_poc -c \
    "ALTER USER roi_user_new RENAME TO roi_user;"
```

### Encryption Key Rotation

Encryption key rotation requires data re-encryption:

```bash
# 1. Generate new encryption key
./scripts/rotate-secrets.sh production encryption

# 2. Run data migration script
node scripts/migrate-encryption.js \
    --old-key=$OLD_ENCRYPTION_KEY \
    --new-key=$NEW_ENCRYPTION_KEY \
    --batch-size=1000

# 3. Verify all data re-encrypted
node scripts/verify-encryption.js --key=$NEW_ENCRYPTION_KEY

# 4. Remove old key
# Only after 100% verification
```

## Emergency Rotation

### When to Execute Emergency Rotation

Immediate rotation required when:

- ✓ Secret found in public repository (GitHub, GitLab, etc.)
- ✓ Secret exposed in log files or error messages
- ✓ Employee with secret access terminated for cause
- ✓ Security breach or unauthorized access detected
- ✓ Secret transmitted over insecure channel
- ✓ Compliance violation detected

### Emergency Rotation Process

**Time-Critical Actions** (within 15 minutes):

```bash
# 1. IMMEDIATE: Revoke compromised credentials
aws iam delete-access-key --access-key-id $COMPROMISED_KEY

# 2. IMMEDIATE: Rotate all related secrets
./scripts/rotate-secrets.sh production all

# 3. IMMEDIATE: Deploy new secrets
kubectl rollout restart deployment --all -n production

# 4. IMMEDIATE: Alert security team
curl -X POST $SLACK_WEBHOOK_URL \
    -H 'Content-Type: application/json' \
    -d '{"text":"SECURITY ALERT: Emergency secret rotation initiated"}'

# 5. IMMEDIATE: Enable enhanced monitoring
aws cloudtrail lookup-events --lookup-attributes AttributeKey=Username,AttributeValue=compromised-user
```

**Follow-Up Actions** (within 1 hour):

1. Review all access logs for compromise window
2. Rotate secrets in all environments (dev, staging, prod)
3. Scan code repositories for other exposed secrets
4. Notify compliance team
5. Document incident in security log
6. Update threat models

**Post-Incident** (within 24 hours):

1. Conduct root cause analysis
2. Update security procedures to prevent recurrence
3. Brief security team on lessons learned
4. Update monitoring/alerting rules
5. Create incident report

### Emergency Contact Information

| Role | Contact | Phone | Email |
|------|---------|-------|-------|
| Security Team Lead | John Smith | +1-555-0100 | security@roi-systems.com |
| DevOps On-Call | Rotation | +1-555-0101 | devops@roi-systems.com |
| CTO | Jane Doe | +1-555-0102 | cto@roi-systems.com |
| Incident Commander | Rotation | +1-555-0103 | incidents@roi-systems.com |

## Compliance and Audit

### Audit Requirements

All secret rotations must be logged with:

- Timestamp (UTC)
- User/system performing rotation
- Environment affected
- Secrets rotated
- Success/failure status
- Validation results
- Downtime (if any)

### Audit Log Location

```
Production: AWS CloudWatch Logs: /roi-poc/production/secret-rotation
Staging: AWS CloudWatch Logs: /roi-poc/staging/secret-rotation
Development: Local: .secrets-backup/rotation-log-*.log
```

### Retention Requirements

| Log Type | Retention Period | Storage |
|----------|------------------|---------|
| Rotation Logs | 7 years | AWS CloudWatch + S3 Glacier |
| Audit Trails | 7 years | AWS CloudTrail + S3 Glacier |
| Backup Secrets | 90 days | Encrypted S3 bucket |
| Rotation Reports | 7 years | SharePoint/Confluence |

### Compliance Mapping

#### SOC 2 Type II

- **CC6.1**: Logical access controls
  - Implementation: Secret rotation enforces access control
  - Evidence: Rotation logs, validation reports

- **CC7.2**: System monitoring
  - Implementation: Automated monitoring of rotation schedule
  - Evidence: Monitoring dashboards, alert logs

#### PCI-DSS

- **Requirement 8.2.4**: Change user passwords at least every 90 days
  - Implementation: Automated 90-day rotation schedule
  - Evidence: Rotation logs, compliance reports

- **Requirement 10.2**: Audit trails for all access to cardholder data
  - Implementation: CloudTrail logging of secret access
  - Evidence: CloudTrail logs, audit reports

#### HIPAA

- **§164.312(a)(1)**: Access control
  - Implementation: Secret rotation limits access window
  - Evidence: Rotation logs, access reports

- **§164.312(b)**: Audit controls
  - Implementation: Comprehensive audit logging
  - Evidence: CloudTrail, CloudWatch logs

### Quarterly Compliance Review

Security team must review:

1. Rotation compliance rate (target: 100%)
2. Failed rotation incidents (target: 0)
3. Emergency rotation frequency (trend analysis)
4. Audit log completeness (target: 100%)
5. Policy violations (target: 0)

**Report Template**:
```
Q[X] 20XX Secret Rotation Compliance Report

Environment: [Production|Staging|Development]
Review Period: [Start Date] - [End Date]
Reviewer: [Name]

Metrics:
- Scheduled rotations: [X]
- Completed on-time: [X] ([X]%)
- Failed rotations: [X]
- Emergency rotations: [X]

Findings:
- [Finding 1]
- [Finding 2]

Recommendations:
- [Recommendation 1]
- [Recommendation 2]

Compliance Status: [COMPLIANT|NON-COMPLIANT|CONDITIONAL]
```

## Roles and Responsibilities

### Security Engineering Team

**Responsibilities**:
- Define and maintain rotation policy
- Develop rotation automation scripts
- Monitor rotation compliance
- Respond to rotation failures
- Conduct quarterly policy reviews
- Maintain rotation documentation

### DevOps Team

**Responsibilities**:
- Execute scheduled rotations
- Maintain rotation infrastructure
- Monitor service health during rotation
- Respond to rotation incidents
- Update rotation procedures
- Train team members on rotation process

### Development Team

**Responsibilities**:
- Design applications for zero-downtime rotation
- Implement dual-secret validation support
- Test rotation procedures in development
- Report rotation issues
- Follow security guidelines

### Compliance Team

**Responsibilities**:
- Audit rotation compliance
- Review rotation logs
- Report compliance status
- Coordinate with auditors
- Maintain compliance documentation

### Incident Response Team

**Responsibilities**:
- Coordinate emergency rotations
- Investigate security incidents
- Document incident response
- Update threat models
- Conduct post-mortems

## Exceptions

### Exception Process

Exceptions to this policy require:

1. **Written justification** explaining why standard policy cannot be followed
2. **Risk assessment** documenting additional risks
3. **Compensating controls** describing alternative security measures
4. **Approval** from Security Team Lead and CTO
5. **Time limit** - exceptions limited to 90 days maximum
6. **Review** - exception reviewed before expiration

### Exception Request Template

```
Secret Rotation Policy Exception Request

Requestor: [Name, Role]
Date: [YYYY-MM-DD]
Environment: [Production|Staging|Development]

Exception Details:
- Secret Type: [Type]
- Current Rotation Frequency: [Days]
- Requested Rotation Frequency: [Days]
- Duration of Exception: [Days]

Justification:
[Detailed explanation of why exception is needed]

Risk Assessment:
[Analysis of additional security risks]

Compensating Controls:
[Alternative security measures]

Approvals:
- Security Team Lead: _______________ Date: _______
- CTO: _______________ Date: _______
```

### Pre-Approved Exceptions

The following exceptions are pre-approved:

1. **Development Environment Extended Rotation**
   - Rotation frequency: 180 days (vs. standard 90 days)
   - Rationale: Lower risk environment
   - Compensating control: No production data, isolated network

2. **Encryption Key Extended Rotation**
   - Rotation frequency: 180 days (vs. standard 90 days)
   - Rationale: Data re-encryption complexity
   - Compensating control: Enhanced monitoring, KMS management

## References

### Internal Documentation

- [Secrets Management Guide](./SECRETS_MANAGEMENT.md)
- [Docker Secrets Implementation](./DOCKER_SECRETS.md)
- [Incident Response Plan](./INCIDENT_RESPONSE.md)
- [Security Best Practices](./SECURITY_BEST_PRACTICES.md)

### External Standards

- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html) - Digital Identity Guidelines
- [NIST SP 800-132](https://csrc.nist.gov/publications/detail/sp/800-132/final) - Password-Based Key Derivation
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [PCI DSS v4.0](https://www.pcisecuritystandards.org/document_library) - Requirement 8
- [SOC 2 Trust Service Criteria](https://us.aicpa.org/interestareas/frc/assuranceadvisoryservices/aicpasoc2report)

### Tools and Scripts

- `./scripts/generate-secrets.sh` - Generate new secrets
- `./scripts/rotate-secrets.sh` - Rotate existing secrets
- `./scripts/validate-secrets.sh` - Validate secret compliance

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-10-14 | Security Engineering Team | Initial policy creation |

## Acknowledgment

By deploying to or maintaining systems in the ROI Systems POC environment, you acknowledge that you have read, understood, and agree to comply with this Secret Rotation Policy.

---

**Next Review Date**: 2026-01-14
**Policy Owner**: security@roi-systems.com
**Questions**: Contact security@roi-systems.com
