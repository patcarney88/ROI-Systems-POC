# Docker Secrets Implementation Guide

## Table of Contents

- [Overview](#overview)
- [Docker Swarm Secrets](#docker-swarm-secrets)
- [Docker Compose Production](#docker-compose-production)
- [Setup Instructions](#setup-instructions)
- [Secret Management](#secret-management)
- [Application Integration](#application-integration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

Docker secrets provide a secure way to store and manage sensitive data (passwords, API keys, certificates) used by Docker services. Secrets are encrypted during transit and at rest in Docker Swarm, and are only made available to services that have been granted explicit access.

### Why Docker Secrets?

**Security Benefits**:
- ✓ Encrypted at rest in Swarm's Raft log
- ✓ Encrypted in transit between nodes
- ✓ Only mounted to authorized containers
- ✓ Never stored in images or containers
- ✓ Immutable (versioned, not updated)
- ✓ Access controlled via RBAC

**Operational Benefits**:
- ✓ Centralized secret management
- ✓ Zero-downtime secret rotation
- ✓ Audit trail for secret access
- ✓ Integration with CI/CD pipelines
- ✓ Native Docker tooling

### Docker Secrets vs Environment Variables

| Feature | Docker Secrets | Environment Variables |
|---------|----------------|----------------------|
| Security | Encrypted at rest | Plaintext |
| Visibility | Not in `docker inspect` | Visible in `docker inspect` |
| Storage | Encrypted Raft log | Container metadata |
| Access | File system mount | Environment |
| Rotation | Versioned, immutable | Requires container restart |
| Audit | Full audit trail | Limited |

**Recommendation**: Use Docker secrets for production, environment variables for development only.

## Docker Swarm Secrets

### Prerequisites

```bash
# Check if Swarm is initialized
docker info | grep "Swarm:"

# Initialize Swarm if not already done
docker swarm init

# Check Swarm status
docker node ls
```

### Creating Secrets

#### Method 1: From Environment Variables

```bash
# Create secret from environment variable
echo "$JWT_SECRET" | docker secret create jwt_secret -

# Create multiple secrets
echo "$JWT_REFRESH_SECRET" | docker secret create jwt_refresh_secret -
echo "$DB_PASSWORD" | docker secret create db_password -
echo "$REDIS_PASSWORD" | docker secret create redis_password -
echo "$SESSION_SECRET" | docker secret create session_secret -
echo "$ENCRYPTION_KEY" | docker secret create encryption_key -
```

#### Method 2: From Files

```bash
# Create secret from file
docker secret create jwt_secret /path/to/secret-file

# Create from .env file (one secret at a time)
grep "^JWT_SECRET=" .env.production | cut -d'=' -f2 | docker secret create jwt_secret -
```

#### Method 3: Automated Script

Create `scripts/setup-docker-secrets.sh`:

```bash
#!/bin/bash

set -euo pipefail

ENVIRONMENT="${1:-production}"
ENV_FILE=".env.$ENVIRONMENT"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Environment file not found: $ENV_FILE"
    exit 1
fi

# Load environment file
source "$ENV_FILE"

# Create versioned secrets
VERSION="v1"

echo "Creating Docker secrets for $ENVIRONMENT environment..."

# JWT Secrets
echo "$JWT_SECRET" | docker secret create "roi-poc-jwt-secret-$VERSION" - 2>/dev/null || echo "Secret already exists"
echo "$JWT_REFRESH_SECRET" | docker secret create "roi-poc-jwt-refresh-secret-$VERSION" - 2>/dev/null || echo "Secret already exists"

# Database Secrets
echo "$DB_PASSWORD" | docker secret create "roi-poc-db-password-$VERSION" - 2>/dev/null || echo "Secret already exists"

# Redis Secrets
echo "$REDIS_PASSWORD" | docker secret create "roi-poc-redis-password-$VERSION" - 2>/dev/null || echo "Secret already exists"

# Application Secrets
echo "$SESSION_SECRET" | docker secret create "roi-poc-session-secret-$VERSION" - 2>/dev/null || echo "Secret already exists"
echo "$ENCRYPTION_KEY" | docker secret create "roi-poc-encryption-key-$VERSION" - 2>/dev/null || echo "Secret already exists"

# AWS Secrets (if production)
if [ "$ENVIRONMENT" = "production" ]; then
    echo "$AWS_ACCESS_KEY_ID" | docker secret create "roi-poc-aws-access-key-id-$VERSION" - 2>/dev/null || echo "Secret already exists"
    echo "$AWS_SECRET_ACCESS_KEY" | docker secret create "roi-poc-aws-secret-access-key-$VERSION" - 2>/dev/null || echo "Secret already exists"
fi

echo "✓ Docker secrets created successfully"
docker secret ls | grep roi-poc
```

### Listing Secrets

```bash
# List all secrets
docker secret ls

# Filter by name
docker secret ls | grep roi-poc

# Inspect secret metadata (not content)
docker secret inspect jwt_secret

# Get secret in JSON format
docker secret inspect jwt_secret --format '{{json .}}'
```

### Updating Secrets (Rotation)

Docker secrets are immutable. To rotate:

```bash
# 1. Create new secret with new version
echo "$NEW_JWT_SECRET" | docker secret create jwt_secret-v2 -

# 2. Update service to use new secret
docker service update \
    --secret-rm jwt_secret-v1 \
    --secret-add source=jwt_secret-v2,target=jwt_secret \
    roi-poc_api

# 3. Remove old secret (after grace period)
docker secret rm jwt_secret-v1
```

### Removing Secrets

```bash
# Remove a single secret
docker secret rm jwt_secret

# Remove multiple secrets
docker secret rm jwt_secret db_password redis_password

# Remove all roi-poc secrets (careful!)
docker secret ls -q | grep roi-poc | xargs docker secret rm
```

## Docker Compose Production

### Production Compose File Structure

The production Docker Compose file (`docker-compose.prod.yml`) uses Docker secrets instead of environment variables:

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
      # Use _FILE suffix to read from secret file
      JWT_SECRET_FILE: /run/secrets/jwt_secret
      JWT_REFRESH_SECRET_FILE: /run/secrets/jwt_refresh_secret
      DB_PASSWORD_FILE: /run/secrets/db_password
      REDIS_PASSWORD_FILE: /run/secrets/redis_password

secrets:
  jwt_secret:
    external: true
    name: roi-poc-jwt-secret-v1
  jwt_refresh_secret:
    external: true
    name: roi-poc-jwt-refresh-secret-v1
  db_password:
    external: true
    name: roi-poc-db-password-v1
  redis_password:
    external: true
    name: roi-poc-redis-password-v1
```

### Secret Mounting

Secrets are mounted as read-only files in `/run/secrets/`:

```bash
# Inside container
ls -la /run/secrets/
# -r--r--r-- 1 root root 64 Oct 14 12:00 jwt_secret
# -r--r--r-- 1 root root 64 Oct 14 12:00 jwt_refresh_secret
# -r--r--r-- 1 root root 32 Oct 14 12:00 db_password

# Read secret
cat /run/secrets/jwt_secret
```

## Setup Instructions

### Initial Setup

```bash
# Step 1: Initialize Docker Swarm
docker swarm init

# Step 2: Generate secrets
./scripts/generate-secrets.sh production

# Step 3: Create Docker secrets
./scripts/setup-docker-secrets.sh production

# Step 4: Verify secrets created
docker secret ls | grep roi-poc

# Step 5: Deploy stack
docker stack deploy -c docker-compose.prod.yml roi-poc

# Step 6: Verify services running
docker stack services roi-poc

# Step 7: Check service logs
docker service logs roi-poc_api
```

### Deployment Process

```bash
# 1. Build images
docker-compose -f docker-compose.prod.yml build

# 2. Tag images (if using registry)
docker tag roi-poc-api:latest registry.example.com/roi-poc-api:v1.0.0

# 3. Push to registry
docker push registry.example.com/roi-poc-api:v1.0.0

# 4. Deploy/update stack
docker stack deploy -c docker-compose.prod.yml roi-poc

# 5. Monitor deployment
watch docker stack ps roi-poc

# 6. Verify health
curl https://api.roi-systems.com/health
```

### Updating Secrets

```bash
# 1. Generate new secrets
./scripts/rotate-secrets.sh production all

# 2. Create new Docker secrets (with v2 suffix)
echo "$NEW_JWT_SECRET" | docker secret create roi-poc-jwt-secret-v2 -

# 3. Update docker-compose.prod.yml to reference v2 secrets
sed -i 's/-v1/-v2/g' docker-compose.prod.yml

# 4. Deploy updated stack (rolling update)
docker stack deploy -c docker-compose.prod.yml roi-poc

# 5. Wait for rollout to complete
docker service ls | grep roi-poc

# 6. Remove old secrets
docker secret rm roi-poc-jwt-secret-v1
```

## Secret Management

### Secret Versioning Strategy

```bash
# Naming convention: {app}-{secret-type}-{version}
roi-poc-jwt-secret-v1
roi-poc-jwt-secret-v2
roi-poc-db-password-v1
roi-poc-db-password-v2

# Version in metadata
docker secret create \
    --label version=v1 \
    --label created=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
    --label rotation-due=$(date -u -d "+90 days" +%Y-%m-%d) \
    roi-poc-jwt-secret-v1 - < secret.txt
```

### Secret Backup

```bash
# Create backup directory
mkdir -p secret-backups/$(date +%Y%m%d)

# Backup secret metadata (not values)
docker secret ls --format '{{.ID}}\t{{.Name}}\t{{.CreatedAt}}' > \
    secret-backups/$(date +%Y%m%d)/secrets-metadata.txt

# Backup secret names and versions
docker secret ls --format '{{.Name}}' | grep roi-poc > \
    secret-backups/$(date +%Y%m%d)/secret-names.txt

# Note: Secret values cannot be retrieved from Docker
# Keep original .env.production file as backup (encrypted)
```

### Secret Audit

```bash
# List all secrets with metadata
docker secret ls --format 'table {{.Name}}\t{{.CreatedAt}}\t{{.UpdatedAt}}'

# Inspect secret details
docker secret inspect roi-poc-jwt-secret-v1

# List services using a secret
docker secret inspect roi-poc-jwt-secret-v1 \
    --format '{{range .Spec.TaskTemplate.ContainerSpec.Secrets}}{{.SecretName}} used by {{.Target}}{{"\n"}}{{end}}'

# Check which services have access to secrets
docker service ps $(docker service ls -q) --format 'table {{.Name}}\t{{.Node}}\t{{.CurrentState}}'
```

### Secret Rotation Schedule

```bash
# Create cron job for automated secret rotation
cat > /etc/cron.d/docker-secret-rotation << 'EOF'
# Rotate Docker secrets every 90 days
0 2 1 */3 * /opt/roi-systems/scripts/rotate-docker-secrets.sh production
EOF

# Manual rotation script
cat > scripts/rotate-docker-secrets.sh << 'SCRIPT'
#!/bin/bash
set -euo pipefail

ENVIRONMENT="$1"
DATE=$(date +%Y%m%d)
NEW_VERSION="v$DATE"

# Generate new secrets
./scripts/rotate-secrets.sh "$ENVIRONMENT" all

# Create new Docker secrets
./scripts/setup-docker-secrets.sh "$ENVIRONMENT" "$NEW_VERSION"

# Update compose file
sed -i "s/-v[0-9]*/-$NEW_VERSION/g" docker-compose.prod.yml

# Deploy with rolling update
docker stack deploy -c docker-compose.prod.yml roi-poc

# Wait for deployment
sleep 60

# Verify health
curl -sf https://api.roi-systems.com/health || exit 1

# Remove old secrets (after grace period)
OLD_SECRETS=$(docker secret ls --format '{{.Name}}' | grep roi-poc | grep -v "$NEW_VERSION")
echo "Removing old secrets: $OLD_SECRETS"
echo "$OLD_SECRETS" | xargs docker secret rm

echo "✓ Secret rotation completed successfully"
SCRIPT

chmod +x scripts/rotate-docker-secrets.sh
```

## Application Integration

### Reading Secrets in Node.js

```javascript
// lib/secrets.js
const fs = require('fs');
const path = require('path');

/**
 * Read secret from Docker secret file or environment variable
 * @param {string} secretName - Name of the secret
 * @returns {string} Secret value
 */
function getSecret(secretName) {
  // Try to read from Docker secret file first
  const secretFilePath = process.env[`${secretName}_FILE`];

  if (secretFilePath && fs.existsSync(secretFilePath)) {
    try {
      const secret = fs.readFileSync(secretFilePath, 'utf8').trim();
      console.log(`✓ Loaded ${secretName} from Docker secret`);
      return secret;
    } catch (error) {
      console.error(`Error reading Docker secret ${secretName}:`, error);
      throw error;
    }
  }

  // Fallback to environment variable (for development)
  const envValue = process.env[secretName];
  if (envValue) {
    console.log(`✓ Loaded ${secretName} from environment variable`);
    return envValue;
  }

  throw new Error(`Secret ${secretName} not found in Docker secrets or environment variables`);
}

/**
 * Load all required secrets
 * @returns {object} Object containing all secrets
 */
function loadSecrets() {
  const secrets = {
    jwtSecret: getSecret('JWT_SECRET'),
    jwtRefreshSecret: getSecret('JWT_REFRESH_SECRET'),
    dbPassword: getSecret('DB_PASSWORD'),
    redisPassword: getSecret('REDIS_PASSWORD'),
    sessionSecret: getSecret('SESSION_SECRET'),
    encryptionKey: getSecret('ENCRYPTION_KEY'),
  };

  // Validate secrets
  Object.entries(secrets).forEach(([key, value]) => {
    if (!value || value.length < 16) {
      throw new Error(`Invalid secret: ${key} is too short or empty`);
    }
  });

  return secrets;
}

/**
 * Build database URL with password from secret
 * @returns {string} Database connection URL
 */
function getDatabaseUrl() {
  const dbUser = process.env.DB_USER || 'roi_user';
  const dbPassword = getSecret('DB_PASSWORD');
  const dbHost = process.env.DB_HOST || 'postgres';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'roi_poc';

  return `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
}

/**
 * Build Redis URL with password from secret
 * @returns {string} Redis connection URL
 */
function getRedisUrl() {
  const redisPassword = getSecret('REDIS_PASSWORD');
  const redisHost = process.env.REDIS_HOST || 'redis';
  const redisPort = process.env.REDIS_PORT || '6379';

  return `redis://default:${redisPassword}@${redisHost}:${redisPort}`;
}

module.exports = {
  getSecret,
  loadSecrets,
  getDatabaseUrl,
  getRedisUrl,
};
```

### Usage in Application

```javascript
// app.js
const { loadSecrets, getDatabaseUrl, getRedisUrl } = require('./lib/secrets');

// Load secrets on application startup
let secrets;
try {
  secrets = loadSecrets();
  console.log('✓ All secrets loaded successfully');
} catch (error) {
  console.error('✗ Failed to load secrets:', error);
  process.exit(1);
}

// Configure services with secrets
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const Redis = require('ioredis');

// JWT configuration
const jwtConfig = {
  secret: secrets.jwtSecret,
  refreshSecret: secrets.jwtRefreshSecret,
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
};

// Database connection
const pool = new Pool({
  connectionString: getDatabaseUrl(),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Redis connection
const redis = new Redis(getRedisUrl());

// Encryption setup
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secrets.encryptionKey, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedData) {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secrets.encryptionKey, 'hex'), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = {
  jwtConfig,
  pool,
  redis,
  encrypt,
  decrypt,
};
```

### Python Implementation

```python
# lib/secrets.py
import os
from pathlib import Path
from typing import Dict

def get_secret(secret_name: str) -> str:
    """
    Read secret from Docker secret file or environment variable.

    Args:
        secret_name: Name of the secret

    Returns:
        Secret value

    Raises:
        ValueError: If secret not found
    """
    # Try to read from Docker secret file first
    secret_file_path = os.environ.get(f"{secret_name}_FILE")

    if secret_file_path:
        secret_path = Path(secret_file_path)
        if secret_path.exists():
            try:
                secret_value = secret_path.read_text().strip()
                print(f"✓ Loaded {secret_name} from Docker secret")
                return secret_value
            except Exception as e:
                print(f"Error reading Docker secret {secret_name}: {e}")
                raise

    # Fallback to environment variable
    env_value = os.environ.get(secret_name)
    if env_value:
        print(f"✓ Loaded {secret_name} from environment variable")
        return env_value

    raise ValueError(f"Secret {secret_name} not found in Docker secrets or environment variables")

def load_secrets() -> Dict[str, str]:
    """Load all required secrets."""
    secrets = {
        'db_password': get_secret('DB_PASSWORD'),
        'redis_password': get_secret('REDIS_PASSWORD'),
    }

    # Validate secrets
    for key, value in secrets.items():
        if not value or len(value) < 16:
            raise ValueError(f"Invalid secret: {key} is too short or empty")

    return secrets

def get_database_url() -> str:
    """Build database URL with password from secret."""
    db_user = os.environ.get('DB_USER', 'roi_user')
    db_password = get_secret('DB_PASSWORD')
    db_host = os.environ.get('DB_HOST', 'postgres')
    db_port = os.environ.get('DB_PORT', '5432')
    db_name = os.environ.get('DB_NAME', 'roi_poc')

    return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

# Usage
if __name__ == "__main__":
    try:
        secrets = load_secrets()
        print("✓ All secrets loaded successfully")
    except Exception as e:
        print(f"✗ Failed to load secrets: {e}")
        exit(1)
```

## Troubleshooting

### Common Issues

#### Issue: "secret not found"

**Symptoms**:
```
Error response from daemon: secret not found: jwt_secret
```

**Solution**:
```bash
# Verify secret exists
docker secret ls | grep jwt_secret

# If not, create it
echo "$JWT_SECRET" | docker secret create jwt_secret -

# Verify again
docker secret inspect jwt_secret
```

#### Issue: "service update failed: secret is in use"

**Symptoms**:
```
Error response from daemon: rpc error: code = InvalidArgument desc = secret 'jwt_secret' is in use by service 'roi-poc_api'
```

**Solution**:
```bash
# Cannot remove secret while in use
# Update service to use new secret first
docker service update \
    --secret-rm jwt_secret-v1 \
    --secret-add source=jwt_secret-v2,target=jwt_secret \
    roi-poc_api

# Then remove old secret
docker secret rm jwt_secret-v1
```

#### Issue: "cannot read secret file"

**Symptoms**:
```
Error: ENOENT: no such file or directory, open '/run/secrets/jwt_secret'
```

**Solution**:
```bash
# Verify secret is mounted
docker exec <container-id> ls -la /run/secrets/

# Check if secret is declared in service
docker service inspect roi-poc_api --format '{{json .Spec.TaskTemplate.ContainerSpec.Secrets}}'

# Verify secret name matches
docker secret ls
```

#### Issue: "permission denied reading secret"

**Symptoms**:
```
Error: EACCES: permission denied, open '/run/secrets/jwt_secret'
```

**Solution**:
```bash
# Check container user
docker exec <container-id> whoami

# Secrets are readable by all users, but check SELinux/AppArmor
# Run container with correct security context
docker service update \
    --security-opt label=level:s0:c100,c200 \
    roi-poc_api
```

### Debugging Commands

```bash
# List all secrets
docker secret ls

# Inspect secret metadata
docker secret inspect jwt_secret

# List services using secret
docker service ls --filter "label=secret=jwt_secret"

# Check container mounts
docker exec <container-id> mount | grep secrets

# Verify secret file contents (inside container)
docker exec <container-id> cat /run/secrets/jwt_secret

# Check service configuration
docker service inspect roi-poc_api --pretty

# View service logs
docker service logs roi-poc_api | grep -i secret

# Check Swarm status
docker node ls
docker info | grep Swarm
```

## Best Practices

### Security Best Practices

1. **Never Log Secrets**
   ```javascript
   // ❌ BAD
   console.log('JWT Secret:', jwtSecret);

   // ✅ GOOD
   console.log('JWT Secret: [REDACTED]');
   ```

2. **Validate Secrets on Startup**
   ```javascript
   function validateSecrets(secrets) {
     const required = ['jwtSecret', 'dbPassword', 'redisPassword'];

     required.forEach(key => {
       if (!secrets[key] || secrets[key].length < 16) {
         throw new Error(`Invalid or missing secret: ${key}`);
       }
     });
   }
   ```

3. **Use Secret Files, Not Environment Variables in Production**
   ```yaml
   # ✅ GOOD - Docker secrets
   secrets:
     - jwt_secret
   environment:
     JWT_SECRET_FILE: /run/secrets/jwt_secret

   # ❌ BAD - Environment variables
   environment:
     JWT_SECRET: hardcoded_secret_value
   ```

4. **Implement Secret Rotation**
   - Rotate secrets every 90 days
   - Use versioned secret names
   - Implement zero-downtime rotation
   - Test rotation process regularly

5. **Monitor Secret Access**
   ```bash
   # Enable Docker audit logging
   dockerd --log-level=debug

   # Monitor secret access
   journalctl -u docker | grep secret
   ```

### Operational Best Practices

1. **Version Secret Names**
   ```bash
   jwt_secret-v1
   jwt_secret-v2
   db_password-20251014
   ```

2. **Use Labels for Metadata**
   ```bash
   docker secret create \
       --label version=v1 \
       --label environment=production \
       --label rotation-due=2025-01-14 \
       jwt_secret-v1 - < secret.txt
   ```

3. **Implement Health Checks**
   ```yaml
   healthcheck:
     test: ["CMD", "node", "healthcheck.js"]
     interval: 30s
     timeout: 10s
     retries: 3
     start_period: 40s
   ```

4. **Use Rolling Updates**
   ```yaml
   deploy:
     update_config:
       parallelism: 1
       delay: 10s
       failure_action: rollback
       order: start-first
   ```

5. **Document Secret Dependencies**
   ```yaml
   # Document which secrets are required
   x-secret-dependencies:
     - jwt_secret-v1
     - db_password-v1
     - redis_password-v1
   ```

### Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Secret Storage | .env file | Docker secrets |
| Access Method | Environment variables | Secret files |
| Encryption | Not required | Required |
| Rotation | Manual/as-needed | Automated/90 days |
| Monitoring | Minimal | Comprehensive |
| Audit Logging | Optional | Required |

---

## Additional Resources

- [Docker Secrets Documentation](https://docs.docker.com/engine/swarm/secrets/)
- [Docker Swarm Security](https://docs.docker.com/engine/swarm/swarm-tutorial/)
- [Secret Rotation Best Practices](./SECRET_ROTATION_POLICY.md)
- [Secrets Management Guide](./SECRETS_MANAGEMENT.md)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-14
**Owner**: Security Engineering Team
