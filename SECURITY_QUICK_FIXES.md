# Security Quick Fixes - Copy & Paste Guide

**Critical security fixes you can implement right now (< 30 minutes)**

---

## 1. Generate Secure Secrets (5 minutes)

### Create production .env file

```bash
cd /Users/patcarney88/Development/superforge-workspace/projects/ROI-Systems/ROI-Systems-POC/backend

# Create .env file (NEVER COMMIT THIS)
cat > .env << 'EOF'
# Server Configuration
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=roi_systems
DB_USER=roi_user
DB_PASSWORD=REPLACE_ME

# JWT Configuration - GENERATED BELOW
JWT_SECRET=REPLACE_ME
JWT_REFRESH_SECRET=REPLACE_ME
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Claude AI Configuration
ANTHROPIC_API_KEY=your_key_here

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png

# Email Configuration
SENDGRID_API_KEY=your_key_here
FROM_EMAIL=noreply@roisystems.com

# CORS Configuration
CORS_ORIGIN=http://localhost:5051

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
EOF

# Generate secure secrets and update .env
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" >> .env
echo "JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" >> .env

# Generate database password
echo "DB_PASSWORD=$(openssl rand -base64 32)" >> .env

echo "✅ Secure .env file created!"
echo "⚠️  NEVER commit this file to git!"
```

---

## 2. Fix JWT Implementation (10 minutes)

### Update `/backend/src/utils/jwt.ts`

Replace the entire file with this secure version:

```typescript
import jwt from 'jsonwebtoken';
import { JWTPayload, AuthTokens } from '../types';

// SECURE: No fallback defaults
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// Validate secrets on startup
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}

if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32) {
  throw new Error('JWT_REFRESH_SECRET must be set and at least 32 characters long');
}

if (JWT_SECRET === JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
}

/**
 * Generate access and refresh tokens
 */
export const generateTokens = (payload: Omit<JWTPayload, 'iat' | 'exp'>): AuthTokens => {
  const accessToken = jwt.sign(payload, JWT_SECRET!, {
    algorithm: 'HS256',
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'roi-systems',
    audience: 'roi-api'
  });

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET!, {
    algorithm: 'HS256',
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'roi-systems',
    audience: 'roi-api'
  });

  return { accessToken, refreshToken };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET!, {
      algorithms: ['HS256'],
      issuer: 'roi-systems',
      audience: 'roi-api'
    }) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET!, {
      algorithms: ['HS256'],
      issuer: 'roi-systems',
      audience: 'roi-api'
    }) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};
```

**Test it:**
```bash
cd backend
npm run dev
# Should throw error if secrets not set
```

---

## 3. Secure Docker Compose (5 minutes)

### Create `/docker-compose.production.yml`

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    container_name: roi-prod-postgres
    environment:
      POSTGRES_DB: roi_systems
      # SECURE: Require secrets, no defaults
      POSTGRES_USER: ${DB_USER:?Database user required}
      POSTGRES_PASSWORD: ${DB_PASSWORD:?Database password required}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - roi-network
    security_opt:
      - no-new-privileges:true
    user: postgres

  redis:
    image: redis:7-alpine
    container_name: roi-prod-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:?Redis password required}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - roi-network
    security_opt:
      - no-new-privileges:true

volumes:
  postgres_data:
  redis_data:

networks:
  roi-network:
    driver: bridge
```

### Create `.env.docker`

```bash
cd /Users/patcarney88/Development/superforge-workspace/projects/ROI-Systems/ROI-Systems-POC

cat > .env.docker << 'EOF'
# Docker Production Secrets
# NEVER COMMIT THIS FILE

DB_USER=roi_prod_user
DB_PASSWORD=REPLACE_ME
REDIS_PASSWORD=REPLACE_ME
JWT_SECRET=REPLACE_ME
JWT_REFRESH_SECRET=REPLACE_ME
EOF

# Generate secure passwords
echo "DB_PASSWORD=$(openssl rand -base64 32)" >> .env.docker
echo "REDIS_PASSWORD=$(openssl rand -base64 32)" >> .env.docker
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" >> .env.docker
echo "JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" >> .env.docker

echo "✅ Docker secrets created!"
```

**Use it:**
```bash
docker-compose -f docker-compose.production.yml --env-file .env.docker up -d
```

---

## 4. Add Rate Limiting (10 minutes)

### Install dependencies

```bash
cd backend
npm install express-rate-limit --save
```

### Create `/backend/src/middleware/rate-limit.middleware.ts`

```typescript
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('rate-limit');

// Global rate limiter - 100 requests per 15 minutes
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.userId
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.'
      }
    });
  }
});

// Strict limiter for auth endpoints - 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts. Please try again later.',
  handler: (req: Request, res: Response) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body.email
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts. Please wait 15 minutes.'
      }
    });
  }
});

// Upload limiter - 20 uploads per hour
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req: Request) => req.user?.userId || req.ip,
  message: 'Too many file uploads. Please try again later.',
});
```

### Update `/backend/src/index.ts`

Add after line 39 (after morgan middleware):

```typescript
// Import rate limiters
import { globalLimiter, authLimiter } from './middleware/rate-limit.middleware';

// Apply global rate limiting
app.use('/api/', globalLimiter);
```

### Update `/backend/src/routes/auth.routes.ts`

Add after line 5:

```typescript
import { authLimiter } from '../middleware/rate-limit.middleware';

// Apply to login and register
router.post('/login', authLimiter, [...], authController.login);
router.post('/register', authLimiter, [...], authController.register);
```

**Test it:**
```bash
# Make 6 requests quickly
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
done
# 6th request should return 429 Too Many Requests
```

---

## 5. Enhanced Password Validation (5 minutes)

### Update `/backend/src/routes/auth.routes.ts`

Replace password validation (line 18) with:

```typescript
body('password')
  .isLength({ min: 12 })
  .withMessage('Password must be at least 12 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must contain uppercase, lowercase, number, and special character'),
```

---

## 6. Update .gitignore (1 minute)

Make sure these lines are in `.gitignore`:

```bash
# Ensure secrets are never committed
cat >> .gitignore << 'EOF'

# Security - CRITICAL
.env
.env.*
!.env.example
*.pem
*.key
*.crt
secrets/
.env.docker
EOF
```

---

## 7. Verify Security (5 minutes)

### Run security checks

```bash
# Check for hardcoded secrets
cd /Users/patcarney88/Development/superforge-workspace/projects/ROI-Systems/ROI-Systems-POC
grep -r "secret.*=.*['\"]" --include="*.ts" --include="*.js" backend/src/

# Check npm vulnerabilities
cd backend
npm audit

# Check frontend
cd ../frontend
npm audit

# Check for committed secrets
git log --all --full-history --source --pretty=format: -- '.env' '.env.docker' | wc -l
# Should be 0

echo "✅ Security checks complete!"
```

---

## 8. Test Everything (5 minutes)

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Test endpoints
# Health check
curl http://localhost:3000/health

# Try to register (should fail with rate limit after 5 attempts)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# Check JWT is working
# Should see proper error messages, not hardcoded secrets

echo "✅ All tests passed!"
```

---

## 9. Deployment Checklist

Before deploying to production:

```bash
# 1. Verify all secrets are set
cd backend
node -e "
  require('dotenv').config();
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DB_PASSWORD'];
  required.forEach(key => {
    if (!process.env[key] || process.env[key].length < 32) {
      console.error('❌', key, 'not set or too short');
      process.exit(1);
    } else {
      console.log('✅', key, 'is set');
    }
  });
  console.log('✅ All required secrets configured!');
"

# 2. Build production
npm run build

# 3. Check for vulnerabilities
npm audit --audit-level=moderate

# 4. Verify HTTPS
# MUST use HTTPS in production

# 5. Update CORS_ORIGIN
# Set to actual production domain
```

---

## 10. Emergency Procedures

### If secrets are compromised:

```bash
# 1. Generate new secrets immediately
cd backend
node -e "console.log('NEW_JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('NEW_JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# 2. Update .env file

# 3. Restart all services
pm2 restart all

# 4. Invalidate all existing tokens
# Implement token blacklist or change JWT version

# 5. Force all users to re-login

# 6. Audit access logs for unauthorized access
grep "UNAUTHORIZED" logs/application-*.log

# 7. Notify security team
```

### If rate limit is too strict:

```typescript
// Temporarily increase limits in rate-limit.middleware.ts
export const authLimiter = rateLimit({
  max: 10,  // Increase from 5 to 10
  // ... rest of config
});
```

---

## Additional Resources

- **Full Audit Report:** `SECURITY_AUDIT_REPORT.md`
- **Executive Summary:** `SECURITY_AUDIT_SUMMARY.md`
- **OWASP Top 10:** https://owasp.org/Top10/

---

## Support

**Questions?** Review the full security audit report for detailed explanations.

**Security Issues?** Never commit secrets, always use environment variables.

**Production Deployment?** Complete all 4 phases of remediation first.

---

**✅ All fixes applied? Run full test suite and review SECURITY_AUDIT_REPORT.md for remaining items.**
