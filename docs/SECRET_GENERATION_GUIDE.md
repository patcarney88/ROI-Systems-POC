# Secret Generation Guide

**ROI Systems POC - Cryptographically Secure Secret Management**

This guide provides step-by-step instructions for generating and managing secrets for the ROI Systems application.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [JWT Secrets Generation](#jwt-secrets-generation)
3. [Database Passwords](#database-passwords)
4. [Redis Passwords](#redis-passwords)
5. [API Keys](#api-keys)
6. [Secret Rotation](#secret-rotation)
7. [Production Deployment](#production-deployment)
8. [Secret Storage Best Practices](#secret-storage-best-practices)

---

## Quick Start

### Automated Secret Generation Script

Create a script to generate all required secrets:

```bash
#!/bin/bash
# generate-secrets.sh

echo "========================================="
echo "ROI Systems - Secret Generation"
echo "========================================="
echo ""

# Generate JWT secrets
echo "# JWT Authentication Secrets"
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
echo "JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
echo ""

# Generate database password
echo "# Database Password"
echo "DB_PASSWORD=$(openssl rand -base64 32)"
echo ""

# Generate Redis password
echo "# Redis Password"
echo "REDIS_PASSWORD=$(openssl rand -base64 32)"
echo ""

# Generate Elasticsearch password
echo "# Elasticsearch Password"
echo "ELASTIC_PASSWORD=$(openssl rand -base64 32)"
echo ""

echo "========================================="
echo "SECURITY WARNING:"
echo "- Copy these values to your .env file"
echo "- NEVER commit .env to version control"
echo "- Store production secrets in a vault"
echo "========================================="
```

**Usage:**
```bash
chmod +x generate-secrets.sh
./generate-secrets.sh > .env.generated
```

---

## JWT Secrets Generation

### Requirements

- **Minimum Length:** 64 characters (128 hex characters recommended)
- **Algorithm:** Cryptographically secure random bytes
- **Uniqueness:** JWT_SECRET and JWT_REFRESH_SECRET must be different

### Method 1: Node.js (Recommended)

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET (different value)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example Output:**
```
a3f9b2c8d5e6f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0
f8e7d6c5b4a3928170695847362514032918273645a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9
```

### Method 2: OpenSSL

```bash
# Generate JWT_SECRET
openssl rand -hex 64

# Generate JWT_REFRESH_SECRET
openssl rand -hex 64
```

### Method 3: Python

```python
import secrets

# Generate JWT_SECRET
print(secrets.token_hex(64))

# Generate JWT_REFRESH_SECRET
print(secrets.token_hex(64))
```

### Validation

After generation, verify your secrets:

```bash
# Check length (should be 128 for hex encoding)
echo -n "YOUR_SECRET_HERE" | wc -c

# Example with Node.js validation
node -e "
const secret = 'YOUR_SECRET_HERE';
console.log('Length:', secret.length);
console.log('Valid:', secret.length >= 64 ? 'YES' : 'NO');
"
```

---

## Database Passwords

### Requirements

- **Minimum Length:** 24 characters
- **Complexity:** Mix of uppercase, lowercase, numbers, special characters
- **Avoid:** Dictionary words, common patterns, personal information

### Method 1: OpenSSL (Recommended)

```bash
# PostgreSQL password
openssl rand -base64 32

# Example output:
# K7xP9zQ2mN5vB8wR4yT6uI3oL1aS0dF9j2hG7kE5nM8cV4bX3zQ6wR9tY2uI5oP==
```

### Method 2: Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Method 3: pwgen (Linux/Mac)

```bash
# Install pwgen
brew install pwgen   # macOS
apt-get install pwgen  # Ubuntu/Debian

# Generate password
pwgen -s 32 1
```

---

## Redis Passwords

Redis passwords follow the same requirements as database passwords.

### Generation

```bash
# Redis password
openssl rand -base64 32
```

### Configuration

Add to your `.env` file:
```
REDIS_PASSWORD=YOUR_GENERATED_PASSWORD_HERE
REDIS_URL=redis://default:YOUR_GENERATED_PASSWORD_HERE@localhost:6379
```

---

## API Keys

### Anthropic Claude API Key

1. Visit: https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Generate new API key
5. Copy the key (starts with `sk-ant-api03-`)

**Format:**
```
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### SendGrid API Key

1. Visit: https://sendgrid.com/
2. Sign up or log in
3. Navigate to Settings > API Keys
4. Create API Key with appropriate permissions
5. Copy the key (starts with `SG.`)

**Format:**
```
SENDGRID_API_KEY=SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### AWS Credentials

**For Development (LocalStack):**
```
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT=http://localhost:4566
```

**For Production (Real AWS):**
1. Log in to AWS Console
2. IAM > Users > Create User
3. Attach appropriate policies
4. Create access key
5. Download credentials (only shown once!)

```
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
```

---

## Secret Rotation

### Rotation Schedule

| Secret Type | Rotation Frequency | Priority |
|-------------|-------------------|----------|
| JWT Secrets | 90 days | High |
| Database Passwords | 180 days | High |
| API Keys | 180 days | Medium |
| Redis Passwords | 180 days | Medium |

### JWT Secret Rotation Procedure

**Step 1: Generate New Secrets**
```bash
NEW_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
NEW_JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
```

**Step 2: Update Environment**
```bash
# Backup current .env
cp .env .env.backup.$(date +%Y%m%d)

# Update .env with new secrets
# (Manual edit or use sed)
```

**Step 3: Graceful Migration**
```javascript
// For zero-downtime rotation, implement dual-secret support
// Allow both old and new secrets for a transition period
const JWT_SECRETS = [
  process.env.JWT_SECRET,      // New secret
  process.env.JWT_SECRET_OLD   // Old secret (temporary)
];

// Verify with both secrets
export const verifyAccessToken = (token: string): JWTPayload => {
  for (const secret of JWT_SECRETS) {
    try {
      return jwt.verify(token, secret, {
        algorithms: ['HS256'],
        issuer: 'roi-systems-api',
        audience: 'roi-systems-client'
      }) as JWTPayload;
    } catch (error) {
      continue;
    }
  }
  throw new Error('Invalid or expired access token');
};
```

**Step 4: Force Re-authentication**
```javascript
// After transition period, remove old secret support
// Force all users to re-authenticate
// Invalidate all existing refresh tokens
```

**Step 5: Remove Old Secret**
```bash
# After 24-48 hours, remove old secret from environment
unset JWT_SECRET_OLD
```

### Database Password Rotation

**Step 1: Create New User with New Password**
```sql
-- Connect to PostgreSQL
CREATE USER roi_user_new WITH PASSWORD 'NEW_GENERATED_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE roi_poc TO roi_user_new;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO roi_user_new;
```

**Step 2: Update Application Configuration**
```bash
# Update .env
DB_USER=roi_user_new
DB_PASSWORD=NEW_GENERATED_PASSWORD
```

**Step 3: Restart Application**
```bash
# Test connection with new credentials
npm run dev

# OR for Docker
docker-compose down
docker-compose up -d
```

**Step 4: Remove Old User**
```sql
-- After verifying new user works
DROP USER roi_user;
```

---

## Production Deployment

### AWS Secrets Manager (Recommended)

**Step 1: Store Secrets in AWS Secrets Manager**
```bash
# Install AWS CLI
brew install awscli  # macOS
pip install awscli   # Python

# Configure AWS CLI
aws configure

# Create secrets
aws secretsmanager create-secret \
  --name roi-systems/jwt-secret \
  --secret-string "YOUR_JWT_SECRET_HERE"

aws secretsmanager create-secret \
  --name roi-systems/jwt-refresh-secret \
  --secret-string "YOUR_JWT_REFRESH_SECRET_HERE"

aws secretsmanager create-secret \
  --name roi-systems/database-url \
  --secret-string "postgresql://user:pass@host:5432/dbname"
```

**Step 2: Load Secrets in Application**
```typescript
// backend/src/config/secrets.ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

export async function loadSecrets(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    // Load JWT_SECRET
    const jwtSecretResponse = await client.send(
      new GetSecretValueCommand({ SecretId: 'roi-systems/jwt-secret' })
    );
    process.env.JWT_SECRET = jwtSecretResponse.SecretString;

    // Load JWT_REFRESH_SECRET
    const jwtRefreshSecretResponse = await client.send(
      new GetSecretValueCommand({ SecretId: 'roi-systems/jwt-refresh-secret' })
    );
    process.env.JWT_REFRESH_SECRET = jwtRefreshSecretResponse.SecretString;

    // Load DATABASE_URL
    const dbUrlResponse = await client.send(
      new GetSecretValueCommand({ SecretId: 'roi-systems/database-url' })
    );
    process.env.DATABASE_URL = dbUrlResponse.SecretString;
  }
}
```

**Step 3: Call in Application Startup**
```typescript
// backend/src/index.ts
import { loadSecrets } from './config/secrets';

async function startServer() {
  // Load secrets before initializing app
  await loadSecrets();

  // Now start Express server
  const app = createApp();
  app.listen(PORT);
}

startServer().catch(console.error);
```

### HashiCorp Vault

**Step 1: Install Vault**
```bash
brew install vault  # macOS
```

**Step 2: Start Vault Server (Development)**
```bash
vault server -dev
```

**Step 3: Store Secrets**
```bash
# Set Vault address
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='YOUR_ROOT_TOKEN'

# Store secrets
vault kv put secret/roi-systems \
  jwt_secret="YOUR_JWT_SECRET" \
  jwt_refresh_secret="YOUR_JWT_REFRESH_SECRET" \
  db_password="YOUR_DB_PASSWORD"
```

**Step 4: Retrieve in Application**
```typescript
import vault from 'node-vault';

const client = vault({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

const secrets = await client.read('secret/data/roi-systems');
process.env.JWT_SECRET = secrets.data.data.jwt_secret;
```

### Environment Variables (Platform-Specific)

**Heroku**
```bash
heroku config:set JWT_SECRET="$(node -e 'console.log(require("crypto").randomBytes(64).toString("hex"))')"
heroku config:set JWT_REFRESH_SECRET="$(node -e 'console.log(require("crypto").randomBytes(64).toString("hex"))')"
heroku config:set DB_PASSWORD="$(openssl rand -base64 32)"
```

**AWS Elastic Beanstalk**
```bash
aws elasticbeanstalk create-environment \
  --environment-variables \
    JWT_SECRET=YOUR_SECRET,\
    JWT_REFRESH_SECRET=YOUR_SECRET,\
    DB_PASSWORD=YOUR_PASSWORD
```

**Docker Swarm**
```bash
# Create secrets
echo "YOUR_JWT_SECRET" | docker secret create jwt_secret -
echo "YOUR_JWT_REFRESH_SECRET" | docker secret create jwt_refresh_secret -
echo "YOUR_DB_PASSWORD" | docker secret create db_password -

# Reference in docker-compose
services:
  api:
    secrets:
      - jwt_secret
      - jwt_refresh_secret
```

---

## Secret Storage Best Practices

### DO

1. **Use Strong Entropy**
   - Use cryptographically secure random number generators
   - Never use predictable values or patterns

2. **Separate Secrets by Environment**
   - Development secrets != Production secrets
   - Never use production secrets in development

3. **Encrypt at Rest**
   - Store secrets encrypted in secret management systems
   - Use file-level encryption for .env files

4. **Limit Access**
   - Only necessary team members should have access
   - Use role-based access control (RBAC)

5. **Audit Access**
   - Log all secret access
   - Monitor for unauthorized access attempts

6. **Version Control Exclusion**
   - Always exclude .env files from git
   - Use .env.example as templates

7. **Use Secret Management Systems**
   - AWS Secrets Manager, HashiCorp Vault, Azure Key Vault
   - Never store secrets in application code

### DON'T

1. **Never Hardcode Secrets**
   ```typescript
   // BAD
   const JWT_SECRET = 'my-secret-key';

   // GOOD
   const JWT_SECRET = process.env.JWT_SECRET;
   ```

2. **Never Commit Secrets to Git**
   ```bash
   # Check git history for secrets
   git log --all --full-history --source -- '.env'
   ```

3. **Never Share Secrets via Email/Chat**
   - Use secure secret sharing tools
   - LastPass, 1Password, or similar

4. **Never Reuse Secrets Across Systems**
   - Each service should have unique credentials
   - Limit blast radius of compromised secrets

5. **Never Log Secrets**
   ```typescript
   // BAD
   console.log('JWT_SECRET:', process.env.JWT_SECRET);

   // GOOD
   console.log('JWT_SECRET: [REDACTED]');
   ```

---

## Emergency Procedures

### If Secrets are Compromised

**Immediate Actions (Within 1 Hour)**

1. **Generate New Secrets**
   ```bash
   ./generate-secrets.sh > .env.new
   ```

2. **Update Production Environment**
   ```bash
   # AWS
   aws secretsmanager update-secret \
     --secret-id roi-systems/jwt-secret \
     --secret-string "NEW_SECRET"

   # Heroku
   heroku config:set JWT_SECRET="NEW_SECRET"
   ```

3. **Restart All Services**
   ```bash
   # Force all users to re-authenticate
   # Invalidate all existing tokens
   ```

4. **Audit Access Logs**
   ```bash
   # Check for unauthorized access
   grep "UNAUTHORIZED" logs/*.log
   ```

5. **Notify Security Team**
   - Document incident
   - Determine scope of compromise
   - Implement additional monitoring

**Follow-up Actions (Within 24 Hours)**

1. **Rotate All Related Secrets**
2. **Review Access Controls**
3. **Update Security Documentation**
4. **Conduct Post-Mortem Analysis**
5. **Implement Additional Safeguards**

---

## Verification Checklist

Before deploying, verify:

- [ ] All secrets are cryptographically generated
- [ ] JWT_SECRET is at least 64 characters
- [ ] JWT_SECRET ≠ JWT_REFRESH_SECRET
- [ ] No secrets are hardcoded in source code
- [ ] .env file is in .gitignore
- [ ] No secrets in git history
- [ ] Production secrets stored in secret manager
- [ ] Secrets are different for each environment
- [ ] Team has access to secrets (via secure channel)
- [ ] Rotation schedule is documented
- [ ] Emergency procedures are understood

---

## Additional Resources

- **OWASP Secret Management Cheat Sheet:** https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- **NIST Password Guidelines:** https://pages.nist.gov/800-63-3/sp800-63b.html
- **JWT Security Best Practices:** https://tools.ietf.org/html/rfc8725
- **Node.js Crypto Documentation:** https://nodejs.org/api/crypto.html

---

**Document Version:** 1.0
**Last Updated:** October 14, 2025
**Maintained By:** ROI Systems Security Team
