# Middleware & Routes Quick Reference

Quick reference guide for using the implemented middleware and routes.

---

## 🔐 Auth Middleware

### Import
```typescript
import {
  authenticate,
  requireAuth,
  optionalAuth,
  requireRole,
  requirePermission,
  requireEmailVerified,
  requireMFAVerified,
  requireOrganization,
  standardProtection,
  enhancedProtection,
  adminProtection,
} from './middleware/auth.middleware.enhanced';
```

### Usage
```typescript
// Basic authentication
router.get('/protected', authenticate, handler);

// Role-based
router.get('/admin', authenticate, requireRole('ADMIN'), handler);

// Permission-based
router.delete('/users/:id', authenticate, requirePermission('users', 'delete'), handler);

// Composite (recommended)
router.get('/profile', ...standardProtection, handler);
router.post('/sensitive', ...enhancedProtection, handler);
router.get('/admin', ...adminProtection, handler);
```

---

## ⏱️ Rate Limiting

### Import
```typescript
import {
  globalRateLimiter,
  authRateLimiter,
  mfaRateLimiter,
  createAccountLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  apiEndpointLimiter,
} from './middleware/rate-limit.middleware';
```

### Usage
```typescript
// Pre-configured limiters
router.post('/login', authRateLimiter, handler);
router.post('/register', createAccountLimiter, handler);
router.post('/mfa/verify', mfaRateLimiter, handler);

// Custom rate limiter
const customLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests
  prefix: 'custom',
  message: 'Too many requests',
});

router.post('/custom', customLimiter, handler);
```

### Sliding Window (Advanced)
```typescript
import { SlidingWindowRateLimiter } from './middleware/rate-limit.middleware';

const limiter = new SlidingWindowRateLimiter(
  'api:endpoint',
  60000, // 1 minute window
  20 // 20 requests
);

router.post('/endpoint',
  limiter.middleware(
    (req) => req.user?.userId || req.ip,
    'Too many requests'
  ),
  handler
);
```

---

## 🛡️ CSRF Protection

### Import
```typescript
import {
  generateCSRFMiddleware,
  csrfProtection,
  getCSRFToken,
} from './middleware/csrf.middleware';
```

### Usage
```typescript
// Generate token (GET requests)
router.get('/form', generateCSRFMiddleware, renderForm);

// Validate token (POST/PUT/DELETE)
router.post('/submit', generateCSRFMiddleware, csrfProtection, handler);

// Token endpoint
router.get('/csrf-token', generateCSRFMiddleware, getCSRFToken);
```

### Frontend Integration
```javascript
// Get token
const response = await fetch('/api/v1/auth/csrf-token');
const { csrfToken } = await response.json();

// Use in requests
fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

---

## 📝 Audit Logging

### Import
```typescript
import {
  logAuthEvent,
  logPermissionCheck,
  logSensitiveOperation,
  logMFAEvent,
} from './middleware/audit.middleware';
```

### Usage
```typescript
// Authentication events
router.post('/login', logAuthEvent('LOGIN'), handler);
router.post('/logout', authenticate, logAuthEvent('LOGOUT'), handler);

// Permission checks
router.delete('/users/:id',
  authenticate,
  logPermissionCheck('users', 'delete'),
  requirePermission('users', 'delete'),
  handler
);

// Sensitive operations
router.put('/users/:id',
  authenticate,
  logSensitiveOperation('USER_UPDATE', 'user'),
  handler
);

// MFA events
router.post('/mfa/setup', authenticate, logMFAEvent('MFA_ENABLE'), handler);
```

---

## 🔗 Complete Route Example

### Secure Route with All Features
```typescript
import { Router } from 'express';
import {
  authenticate,
  requireRole,
  requirePermission,
  standardProtection,
} from './middleware/auth.middleware.enhanced';
import { apiEndpointLimiter } from './middleware/rate-limit.middleware';
import { generateCSRFMiddleware, csrfProtection } from './middleware/csrf.middleware';
import { logSensitiveOperation } from './middleware/audit.middleware';
import { body } from 'express-validator';

const router = Router();

// GET - Public endpoint (rate limited)
router.get('/public',
  apiEndpointLimiter,
  handler
);

// GET - Protected endpoint
router.get('/protected',
  ...standardProtection, // authenticate + requireEmailVerified
  handler
);

// POST - Secure write endpoint
router.post('/secure',
  ...standardProtection,
  generateCSRFMiddleware,
  csrfProtection,
  apiEndpointLimiter,
  [
    body('email').isEmail(),
    body('name').notEmpty(),
  ],
  logSensitiveOperation('CREATE', 'resource'),
  handler
);

// DELETE - Admin only
router.delete('/admin/:id',
  authenticate,
  requireRole('ADMIN'),
  requirePermission('resources', 'delete'),
  generateCSRFMiddleware,
  csrfProtection,
  logSensitiveOperation('DELETE', 'resource'),
  handler
);

export default router;
```

---

## 🎯 Common Patterns

### 1. Standard Protected Endpoint
```typescript
router.get('/profile',
  ...standardProtection,
  getProfile
);
```

### 2. Write Operation with CSRF
```typescript
router.post('/update',
  ...standardProtection,
  generateCSRFMiddleware,
  csrfProtection,
  validation,
  handler
);
```

### 3. Admin Operation
```typescript
router.delete('/users/:id',
  authenticate,
  requireRole('ADMIN'),
  requirePermission('users', 'delete'),
  generateCSRFMiddleware,
  csrfProtection,
  logSensitiveOperation('USER_DELETE', 'user'),
  handler
);
```

### 4. Rate-Limited Auth Endpoint
```typescript
router.post('/login',
  generateCSRFMiddleware,
  csrfProtection,
  authRateLimiter,
  validation,
  logAuthEvent('LOGIN'),
  handler
);
```

### 5. MFA Setup
```typescript
router.post('/mfa/setup',
  ...standardProtection,
  generateCSRFMiddleware,
  csrfProtection,
  logMFAEvent('MFA_ENABLE'),
  handler
);
```

### 6. OAuth Callback
```typescript
router.get('/oauth/google/callback',
  passport.authenticate('google', { session: false }),
  logAuthEvent('OAUTH_LOGIN'),
  handler
);
```

---

## 🚦 Middleware Order

**Recommended Order:**
1. Rate limiting
2. Authentication
3. Authorization (roles/permissions)
4. CSRF generation
5. CSRF validation
6. Input validation
7. Audit logging
8. Business logic handler

**Example:**
```typescript
router.post('/endpoint',
  apiEndpointLimiter,              // 1. Rate limit
  authenticate,                     // 2. Auth
  requireRole('USER'),             // 3. Role check
  requirePermission('resource', 'write'), // 3. Permission
  generateCSRFMiddleware,          // 4. CSRF gen
  csrfProtection,                  // 5. CSRF validate
  validation,                      // 6. Input validation
  logSensitiveOperation('CREATE', 'resource'), // 7. Audit
  handler                          // 8. Business logic
);
```

---

## 📋 Request Object Extensions

### User Object
```typescript
req.user = {
  userId: string;
  email: string;
  role: string;
  organizationId?: string;
  sessionId?: string;
  permissions?: string[];
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  mfaVerified?: boolean;
};
```

### Usage in Handlers
```typescript
const handler = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;
  const permissions = req.user?.permissions || [];

  // Business logic
};
```

---

## 🔍 Error Responses

### Authentication Error
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No authentication token provided"
  }
}
```

### Authorization Error
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions - users:delete required"
  }
}
```

### Rate Limit Error
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": "2024-01-15T10:30:00Z"
  }
}
```

### CSRF Error
```json
{
  "success": false,
  "error": {
    "code": "CSRF_TOKEN_INVALID",
    "message": "Invalid CSRF token. Please refresh the page and try again."
  }
}
```

---

## ⚙️ Environment Variables

```bash
# CSRF
COOKIE_SECRET=your-secret-key

# Rate Limiting (Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0

# OAuth
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
MICROSOFT_CLIENT_ID=your-id
MICROSOFT_CLIENT_SECRET=your-secret
FACEBOOK_CLIENT_ID=your-id
FACEBOOK_CLIENT_SECRET=your-secret

# MFA (Twilio for SMS)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🧪 Testing

### Test Authentication
```typescript
import request from 'supertest';
import app from './index.enhanced';

describe('Authentication', () => {
  it('should require authentication', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .expect(401);

    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should authenticate with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});
```

### Test Rate Limiting
```typescript
describe('Rate Limiting', () => {
  it('should rate limit after 5 attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' })
        .expect(401);
    }

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' })
      .expect(429);

    expect(res.body.error.code).toBe('TOO_MANY_AUTH_ATTEMPTS');
  });
});
```

### Test CSRF
```typescript
describe('CSRF Protection', () => {
  it('should reject requests without CSRF token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'Password123' })
      .expect(403);

    expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
  });
});
```

---

## 💡 Best Practices

1. **Always use composite middleware** (standardProtection, enhancedProtection)
2. **Apply rate limiting** to all public endpoints
3. **Use CSRF protection** for state-changing operations
4. **Log sensitive operations** for audit trail
5. **Validate input** with express-validator
6. **Handle errors** consistently with AppError
7. **Test thoroughly** with different scenarios
8. **Monitor logs** for suspicious activity
9. **Configure Redis** for production use
10. **Set up OAuth** credentials securely

---

**End of Quick Reference**
