# Security Deployment Checklist

**ROI Systems POC - Pre-Production Security Verification**

Use this checklist before deploying to production or any public-facing environment.

---

## Critical Security Requirements

### Authentication & Authorization

#### JWT Configuration
- [ ] JWT_SECRET is set and at least 64 characters (128 recommended)
- [ ] JWT_REFRESH_SECRET is set and different from JWT_SECRET
- [ ] No hardcoded JWT secrets in source code
- [ ] JWT algorithm explicitly set to HS256
- [ ] Token expiration times are appropriate (15m access, 30d refresh)
- [ ] Issuer and audience claims are validated
- [ ] Application fails to start if JWT secrets are missing/weak

#### Password Security
- [ ] Minimum password length: 12 characters
- [ ] Password complexity enforced (uppercase, lowercase, number, special char)
- [ ] Passwords hashed with bcrypt (cost factor 10+)
- [ ] No passwords stored in plain text
- [ ] Password reset functionality secure (if implemented)

#### Session Management
- [ ] Refresh token rotation enabled (Week 2 implementation)
- [ ] Session timeout configured
- [ ] Logout invalidates tokens
- [ ] No session fixation vulnerabilities

### Rate Limiting

#### Implemented
- [ ] Global API rate limiter active (100 req/15min)
- [ ] Authentication rate limiter active (5 failed attempts/15min)
- [ ] Upload rate limiter configured (20 uploads/hour)
- [ ] Sensitive operations limited (3 req/hour)
- [ ] AI operations limited (10 req/minute)

#### Monitoring
- [ ] Rate limit violations logged
- [ ] Alerts configured for excessive rate limit hits
- [ ] Rate limit headers exposed to clients

### CORS Configuration

- [ ] Allowed origins explicitly defined (no wildcards)
- [ ] CORS_ORIGINS environment variable set with production domains
- [ ] Credentials enabled only for trusted origins
- [ ] Unnecessary HTTP methods disabled (PATCH, OPTIONS removed)
- [ ] Preflight caching configured
- [ ] Rejected CORS requests logged

### Security Headers (Helmet)

- [ ] Content Security Policy configured
- [ ] HSTS enabled with preload
- [ ] X-Frame-Options set to DENY
- [ ] X-Content-Type-Options set to nosniff
- [ ] X-XSS-Protection enabled
- [ ] Referrer-Policy configured
- [ ] Permissions-Policy configured
- [ ] Powered-by header hidden

### Input Validation

#### Registration/Login
- [ ] Email validation with normalization
- [ ] Disposable email domains blocked
- [ ] Name fields sanitized (no special characters)
- [ ] Role whitelisting enforced
- [ ] SQL injection prevention (parameterized queries)

#### File Uploads (if applicable)
- [ ] File size limits enforced (10MB default)
- [ ] File type validation (MIME type + extension)
- [ ] Magic number validation
- [ ] Virus scanning enabled (Week 3)
- [ ] Secure filename generation
- [ ] Upload directory has restricted permissions

### Database Security

- [ ] Database password is strong (24+ characters)
- [ ] Database password stored in environment variable
- [ ] No default database passwords
- [ ] Database user has minimal required permissions
- [ ] Database connections encrypted (SSL/TLS)
- [ ] Database backup strategy in place
- [ ] SQL injection prevented (ORM/parameterized queries)

### Redis Security

- [ ] Redis password is strong (24+ characters)
- [ ] Redis password stored in environment variable
- [ ] No default Redis password
- [ ] Redis not exposed to public internet
- [ ] Redis persistence configured (AOF/RDB)

### Docker Security

#### Credentials
- [ ] No default passwords in docker-compose.yml
- [ ] All secrets required via environment variables
- [ ] Docker Compose fails without required secrets
- [ ] .env file not committed to git

#### Container Hardening
- [ ] Containers run as non-root user
- [ ] Read-only root filesystem where possible
- [ ] Unnecessary capabilities dropped
- [ ] Security options configured (no-new-privileges)
- [ ] Resource limits set (CPU, memory)
- [ ] Base images are up-to-date and scanned

### HTTPS/TLS

- [ ] HTTPS enabled in production
- [ ] Valid SSL/TLS certificate installed
- [ ] HTTP redirects to HTTPS
- [ ] TLS 1.2+ only (no SSLv3, TLS 1.0, TLS 1.1)
- [ ] Strong cipher suites configured
- [ ] Certificate expiration monitoring in place

### Environment Variables

#### Required Variables Set
- [ ] NODE_ENV=production
- [ ] JWT_SECRET (64+ chars)
- [ ] JWT_REFRESH_SECRET (64+ chars, different from JWT_SECRET)
- [ ] DB_PASSWORD
- [ ] REDIS_PASSWORD
- [ ] CORS_ORIGINS (production domains)
- [ ] API keys (Anthropic, SendGrid, AWS, etc.)

#### .env File Security
- [ ] .env file excluded from git (.gitignore)
- [ ] .env.example has no real secrets
- [ ] No .env files in git history
- [ ] .env file has restricted permissions (chmod 600)
- [ ] Separate .env files for each environment

### API Security

- [ ] API versioning implemented (/api/v1)
- [ ] Request size limits configured (10MB)
- [ ] Timeout configured for external API calls
- [ ] API documentation doesn't expose sensitive info
- [ ] Error messages don't leak sensitive data
- [ ] API keys rotated regularly

### Logging & Monitoring

#### Logging
- [ ] Security events logged (login, logout, failures)
- [ ] Audit trail for sensitive operations
- [ ] No sensitive data in logs (passwords, tokens, etc.)
- [ ] Log rotation configured
- [ ] Logs stored securely with restricted access

#### Monitoring
- [ ] Health check endpoint configured
- [ ] Application metrics collected
- [ ] Error tracking enabled (Sentry, Datadog, etc.)
- [ ] Alerting configured for security events
- [ ] Performance monitoring active

### Dependency Security

- [ ] npm audit shows no critical vulnerabilities
- [ ] Dependencies are up-to-date
- [ ] Dependabot or similar configured
- [ ] Security advisories monitored
- [ ] Automated dependency updates configured

### Code Security

#### Source Code
- [ ] No hardcoded secrets in source code
- [ ] No commented-out security code
- [ ] No debug/development code in production
- [ ] Sensitive operations require authentication
- [ ] Authorization checks on all protected routes

#### Git Security
- [ ] No secrets in git history
- [ ] .gitignore properly configured
- [ ] Repository is private (if applicable)
- [ ] Commit signing enabled (optional)
- [ ] Branch protection rules configured

### Infrastructure Security

#### Network
- [ ] Firewall configured
- [ ] Only necessary ports exposed
- [ ] Database not accessible from public internet
- [ ] Internal services isolated
- [ ] Network segmentation implemented

#### Server
- [ ] OS and packages up-to-date
- [ ] SSH key-based authentication only
- [ ] Root login disabled
- [ ] Fail2ban or similar configured
- [ ] Automatic security updates enabled

### Backup & Recovery

- [ ] Database backup schedule defined
- [ ] Backup restoration tested
- [ ] Backups encrypted
- [ ] Backup retention policy defined
- [ ] Disaster recovery plan documented

### Compliance & Documentation

#### Documentation
- [ ] Security policy documented
- [ ] Incident response plan created
- [ ] Secret rotation schedule defined
- [ ] Team security training completed
- [ ] Security contacts documented

#### Compliance (if applicable)
- [ ] GDPR compliance verified
- [ ] CCPA compliance verified
- [ ] SOC 2 requirements met
- [ ] Privacy policy published
- [ ] Terms of service published

---

## Pre-Deployment Testing

### Manual Security Testing

- [ ] Attempted login with wrong password (rate limited after 5 attempts)
- [ ] Attempted access to protected routes without token (401 Unauthorized)
- [ ] Attempted access with expired token (401 Unauthorized)
- [ ] Attempted token forgery (401 Unauthorized)
- [ ] Attempted SQL injection (blocked/sanitized)
- [ ] Attempted XSS in input fields (blocked/sanitized)
- [ ] Attempted file upload of disallowed type (rejected)
- [ ] Attempted file upload exceeding size limit (rejected)
- [ ] Verified CORS blocks unauthorized origins
- [ ] Verified rate limiting works across endpoints

### Automated Security Testing

- [ ] npm audit passed (no high/critical vulnerabilities)
- [ ] Static code analysis passed (ESLint security rules)
- [ ] Dependency scanning passed (Snyk, WhiteSource, etc.)
- [ ] Container scanning passed (Trivy, Clair, etc.)
- [ ] Unit tests for security functions passed
- [ ] Integration tests for auth flows passed

### Performance Testing

- [ ] Load testing completed
- [ ] Stress testing completed
- [ ] Rate limiting effective under load
- [ ] Application scales horizontally
- [ ] Database connection pooling works

---

## Post-Deployment Verification

### Immediate (Within 1 Hour)

- [ ] Application starts successfully
- [ ] Health check endpoint responds
- [ ] Authentication works
- [ ] Database connectivity verified
- [ ] Redis connectivity verified
- [ ] Logs are being generated
- [ ] Monitoring shows green status
- [ ] SSL certificate valid
- [ ] No errors in application logs

### Short-term (Within 24 Hours)

- [ ] No security alerts triggered
- [ ] Performance metrics within acceptable range
- [ ] Error rate acceptable (<1%)
- [ ] User feedback positive
- [ ] No unauthorized access attempts
- [ ] Backup completed successfully

### Medium-term (Within 1 Week)

- [ ] Security scanning completed
- [ ] Penetration testing scheduled
- [ ] Team familiar with incident response
- [ ] Monitoring and alerts tuned
- [ ] Documentation updated

---

## Security Incident Response

### If Security Issue Detected

1. **Immediate Actions**
   - [ ] Assess severity and scope
   - [ ] Contain the incident
   - [ ] Preserve evidence
   - [ ] Notify security team

2. **Investigation**
   - [ ] Review logs
   - [ ] Identify affected systems
   - [ ] Determine root cause
   - [ ] Document findings

3. **Remediation**
   - [ ] Patch vulnerability
   - [ ] Rotate compromised secrets
   - [ ] Force password resets (if needed)
   - [ ] Update security measures

4. **Recovery**
   - [ ] Restore from backups (if needed)
   - [ ] Verify system integrity
   - [ ] Resume normal operations
   - [ ] Monitor for reoccurrence

5. **Post-Incident**
   - [ ] Conduct post-mortem
   - [ ] Update documentation
   - [ ] Improve security measures
   - [ ] Train team on lessons learned

---

## Contacts

### Security Team
- **Email:** security@roisystems.com
- **Emergency:** incidents@roisystems.com
- **Phone:** [Emergency Contact Number]

### Escalation
1. Development Lead
2. Security Officer
3. CTO
4. Legal (for data breaches)

---

## Additional Resources

- [SECURITY_FIXES_APPLIED.md](../SECURITY_FIXES_APPLIED.md) - Applied security fixes
- [SECRET_GENERATION_GUIDE.md](SECRET_GENERATION_GUIDE.md) - Secret generation guide
- [SECURITY_AUDIT_REPORT.md](../SECURITY_AUDIT_REPORT.md) - Full security audit
- [SECURITY_QUICK_FIXES.md](../SECURITY_QUICK_FIXES.md) - Quick security wins

---

## Sign-Off

Before deploying to production, the following team members must approve:

- [ ] **Developer:** ___________________ Date: ___________
- [ ] **Security Lead:** ___________________ Date: ___________
- [ ] **DevOps Lead:** ___________________ Date: ___________
- [ ] **Technical Lead:** ___________________ Date: ___________

**Deployment Approved:** [ ] YES [ ] NO

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

**Checklist Version:** 1.0
**Last Updated:** October 14, 2025
**Next Review:** After Week 2 implementation
