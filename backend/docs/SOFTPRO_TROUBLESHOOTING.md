# SoftPro Integration - Troubleshooting Guide

Comprehensive guide to diagnosing and resolving common issues with the SoftPro 360 integration.

---

## Table of Contents

1. [OAuth & Authentication Issues](#oauth--authentication-issues)
2. [Sync Problems](#sync-problems)
3. [Webhook Issues](#webhook-issues)
4. [API Errors](#api-errors)
5. [Performance Issues](#performance-issues)
6. [Data Conflicts](#data-conflicts)
7. [Diagnostic Tools](#diagnostic-tools)
8. [Getting Support](#getting-support)

---

## OAuth & Authentication Issues

### Issue: OAuth Connection Fails

**Symptoms:**
- Error: "OAuth connection failed"
- User redirected back with error parameter
- 401 Unauthorized errors

**Diagnostic Steps:**

1. **Verify Credentials**
   ```bash
   # Check environment variables are set
   echo $SOFTPRO_CLIENT_ID
   echo $SOFTPRO_CLIENT_SECRET
   echo $SOFTPRO_REDIRECT_URI
   ```

2. **Check Redirect URI Match**
   ```bash
   # Must match exactly in both systems
   # ROI Systems .env:
   SOFTPRO_REDIRECT_URI=https://your-domain.com/api/v1/integrations/softpro/callback

   # SoftPro Developer Portal:
   # Should show exact same URI
   ```

3. **Validate Client ID/Secret**
   ```bash
   curl -X POST https://oauth.softpro.com/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&client_id=$SOFTPRO_CLIENT_ID&client_secret=$SOFTPRO_CLIENT_SECRET"
   ```

**Solutions:**

✅ **Solution 1: Update Redirect URI**
- Login to SoftPro Developer Portal
- Update OAuth redirect URI to match your `.env` exactly
- Save changes and retry

✅ **Solution 2: Regenerate Client Secret**
- In SoftPro Developer Portal, regenerate client secret
- Update `.env` with new secret
- Restart application

✅ **Solution 3: Clear State Cache**
```bash
# Clear Redis state cache
redis-cli
> DEL oauth:state:*
> EXIT
```

---

### Issue: Access Token Expired

**Symptoms:**
- 401 Unauthorized errors on API calls
- Error: "Invalid or expired access token"
- Logs show: "Token expired"

**Diagnostic Steps:**

1. **Check Token Expiry**
   ```sql
   SELECT
     id,
     tokenExpiry,
     NOW() as current_time,
     (tokenExpiry < NOW()) as is_expired
   FROM softpro_integrations
   WHERE id = 'your_integration_id';
   ```

2. **Check Refresh Token**
   ```sql
   SELECT
     refreshToken IS NOT NULL as has_refresh_token,
     active
   FROM softpro_integrations
   WHERE id = 'your_integration_id';
   ```

**Solutions:**

✅ **Solution 1: Manual Token Refresh**
```bash
curl -X POST https://your-domain.com/api/v1/integrations/softpro/refresh-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

✅ **Solution 2: Re-Authenticate**
If refresh fails, re-authorize:
```bash
curl -X POST https://your-domain.com/api/v1/integrations/softpro/connect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Follow OAuth flow again
```

✅ **Solution 3: Enable Automatic Refresh**
Ensure automatic token refresh is enabled (should be by default):
```typescript
// In configuration
{
  autoRefreshTokens: true,
  refreshBeforeExpiry: 300  // Refresh 5 minutes before expiry
}
```

---

### Issue: "Invalid Grant" Error

**Symptoms:**
- OAuth flow fails at token exchange
- Error: "invalid_grant"
- Message: "Authorization code is invalid or expired"

**Diagnostic Steps:**

1. **Check Authorization Code Reuse**
   - Authorization codes can only be used once
   - Check if code is being reused accidentally

2. **Verify Timing**
   - Authorization codes expire after 10 minutes
   - Check system clock synchronization

**Solutions:**

✅ **Solution: Restart OAuth Flow**
- Authorization codes are single-use
- Start new OAuth flow from beginning
- Complete within 10-minute window

---

## Sync Problems

### Issue: Transactions Not Syncing

**Symptoms:**
- Sync completes but no transactions created
- `recordsProcessed: 0` in response
- Data exists in SoftPro but not in ROI

**Diagnostic Steps:**

1. **Check Sync Filters**
   ```bash
   curl https://your-domain.com/api/v1/integrations/softpro/config \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Verify API Access**
   ```bash
   # Test direct API access
   curl https://api.softpro.com/v1/transactions \
     -H "Authorization: Bearer ACCESS_TOKEN"
   ```

3. **Check Permissions**
   ```bash
   # Verify scopes include read:transactions
   curl https://api.softpro.com/v1/me \
     -H "Authorization: Bearer ACCESS_TOKEN"
   ```

**Solutions:**

✅ **Solution 1: Adjust Sync Filters**
```bash
# Sync all statuses
curl -X POST https://your-domain.com/api/v1/integrations/softpro/sync/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "filters": {
      "status": null,  // Remove status filter
      "openedDateFrom": "2020-01-01"  // Wider date range
    }
  }'
```

✅ **Solution 2: Request Additional Scopes**
- Login to SoftPro Developer Portal
- Add missing scopes (read:transactions, write:transactions)
- Re-authorize integration

✅ **Solution 3: Check Field Mappings**
```sql
-- Verify field mappings exist
SELECT * FROM field_mappings
WHERE integration_id = 'your_integration_id';
```

---

### Issue: Sync Failing with Validation Errors

**Symptoms:**
- Sync completes with failures
- Error: "VALIDATION_ERROR"
- Specific records fail to sync

**Diagnostic Steps:**

1. **Review Error Details**
   ```bash
   curl https://your-domain.com/api/v1/integrations/softpro/sync-history \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Check Failed Records**
   ```sql
   SELECT * FROM sync_errors
   WHERE integration_id = 'your_integration_id'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

**Solutions:**

✅ **Solution 1: Fix Data in SoftPro**
- Review error details for specific validation failures
- Correct data in SoftPro (e.g., invalid zip code, missing required fields)
- Re-sync specific records

✅ **Solution 2: Adjust Validation Rules**
```bash
# Relax validation for specific fields
curl -X PATCH https://your-domain.com/api/v1/integrations/softpro/field-mappings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "sourceField": "zipCode",
    "validationRules": [
      {"rule": "OPTIONAL"}  // Make optional instead of required
    ]
  }'
```

✅ **Solution 3: Skip Invalid Records**
```bash
# Configure to skip invalid records instead of failing
curl -X PATCH https://your-domain.com/api/v1/integrations/softpro/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "skipInvalidRecords": true,
    "notifyOnSkippedRecords": true
  }'
```

---

### Issue: Sync Taking Too Long

**Symptoms:**
- Sync operations timeout
- Extremely slow sync times (> 5 minutes for 100 records)
- High CPU/memory usage during sync

**Diagnostic Steps:**

1. **Check Sync Performance Metrics**
   ```bash
   curl https://your-domain.com/api/v1/integrations/softpro/metrics \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Monitor Database Performance**
   ```sql
   -- Check slow queries
   SELECT * FROM pg_stat_statements
   WHERE query LIKE '%softpro%'
   ORDER BY total_time DESC;
   ```

3. **Check Queue Depth**
   ```bash
   # Check Bull queue depth
   redis-cli
   > LLEN bull:softpro-sync:wait
   > LLEN bull:softpro-sync:active
   ```

**Solutions:**

✅ **Solution 1: Reduce Batch Size**
```bash
curl -X PATCH https://your-domain.com/api/v1/integrations/softpro/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "syncBatchSize": 25,  // Reduce from default 50
    "maxConcurrentJobs": 5  // Reduce concurrent processing
  }'
```

✅ **Solution 2: Optimize Database Queries**
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_transaction_integration_status
  ON transactions(integration_id, status);

CREATE INDEX CONCURRENTLY idx_transaction_external_id
  ON transactions(integration_id, external_id);
```

✅ **Solution 3: Enable Caching**
```bash
curl -X PATCH https://your-domain.com/api/v1/integrations/softpro/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "enableCaching": true,
    "cacheTTL": 3600  // 1 hour
  }'
```

---

## Webhook Issues

### Issue: Webhooks Not Being Received

**Symptoms:**
- No webhook events in database
- Real-time sync not working
- Webhook endpoint shows 0 requests

**Diagnostic Steps:**

1. **Verify Webhook Registration**
   ```bash
   # List registered webhooks in SoftPro
   curl https://api.softpro.com/v1/webhooks \
     -H "Authorization: Bearer YOUR_SOFTPRO_TOKEN"
   ```

2. **Check Webhook Endpoint Accessibility**
   ```bash
   # Test from external server (not localhost)
   curl -X POST https://your-domain.com/api/v1/webhooks/softpro/test \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

3. **Check Firewall/Security Groups**
   - Ensure port 443 is open
   - Check if IP is whitelisted (if using IP restrictions)
   - Verify SSL certificate is valid

**Solutions:**

✅ **Solution 1: Re-Register Webhook**
```bash
# Delete old webhook
curl -X DELETE https://api.softpro.com/v1/webhooks/{webhook_id} \
  -H "Authorization: Bearer YOUR_SOFTPRO_TOKEN"

# Register new webhook
curl -X POST https://api.softpro.com/v1/webhooks \
  -H "Authorization: Bearer YOUR_SOFTPRO_TOKEN" \
  -d '{
    "url": "https://your-domain.com/api/v1/webhooks/softpro/{integrationId}",
    "events": ["transaction.*", "document.*"],
    "secret": "your_webhook_secret"
  }'
```

✅ **Solution 2: Use Ngrok for Local Testing**
```bash
# Install ngrok
brew install ngrok  # macOS
# or download from ngrok.com

# Start tunnel
ngrok http 3000

# Use ngrok URL for webhook endpoint
# https://abc123.ngrok.io/api/v1/webhooks/softpro/{integrationId}
```

✅ **Solution 3: Check Application Logs**
```bash
# Check for webhook errors
tail -f logs/application.log | grep webhook

# Check for connection errors
tail -f logs/error.log | grep softpro
```

---

### Issue: Webhook Signature Validation Failing

**Symptoms:**
- Webhooks received but rejected
- 401 Unauthorized in webhook logs
- Error: "Invalid webhook signature"

**Diagnostic Steps:**

1. **Verify Webhook Secret**
   ```bash
   # Check secret in database matches SoftPro configuration
   echo $SOFTPRO_WEBHOOK_SECRET
   ```

2. **Test Signature Generation**
   ```bash
   # Generate test signature
   echo -n '{"test":"data"}' | openssl dgst -sha256 -hmac "your_webhook_secret"
   ```

3. **Check Raw Body Usage**
   - Signature must be computed on raw request body
   - Verify you're not parsing JSON before validation

**Solutions:**

✅ **Solution 1: Update Webhook Secret**
```bash
# Update in both systems
# 1. Update .env
SOFTPRO_WEBHOOK_SECRET=new_secret_here

# 2. Update in SoftPro
curl -X PATCH https://api.softpro.com/v1/webhooks/{webhook_id} \
  -H "Authorization: Bearer YOUR_SOFTPRO_TOKEN" \
  -d '{"secret": "new_secret_here"}'

# 3. Update in database
UPDATE softpro_integrations
SET webhook_secret = 'new_secret_here'
WHERE id = 'your_integration_id';
```

✅ **Solution 2: Fix Signature Validation Code**
```typescript
// Correct implementation
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-softpro-signature'].replace('sha256=', '');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.SOFTPRO_WEBHOOK_SECRET)
    .update(req.body)  // Raw buffer, not parsed JSON
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Parse JSON after validation
  const payload = JSON.parse(req.body);
  // Process webhook...
});
```

✅ **Solution 3: Disable Signature Validation (Testing Only)**
```bash
# ONLY for testing - not for production!
curl -X PATCH https://your-domain.com/api/v1/integrations/softpro/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "validateWebhookSignature": false
  }'
```

---

### Issue: Duplicate Webhook Events

**Symptoms:**
- Same event processed multiple times
- Duplicate transactions/documents created
- Logs show same event ID multiple times

**Diagnostic Steps:**

1. **Check Redis Deduplication**
   ```bash
   redis-cli
   > KEYS webhook:dedup:*
   > GET webhook:dedup:evt_12345
   ```

2. **Check Webhook Event History**
   ```sql
   SELECT event_id, COUNT(*) as count
   FROM webhook_events
   GROUP BY event_id
   HAVING COUNT(*) > 1;
   ```

**Solutions:**

✅ **Solution 1: Enable Deduplication**
```bash
# Should be enabled by default
curl -X PATCH https://your-domain.com/api/v1/integrations/softpro/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "enableWebhookDeduplication": true,
    "deduplicationTTL": 86400  // 24 hours
  }'
```

✅ **Solution 2: Check Redis Availability**
```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# If Redis is down, restart it
redis-server
```

✅ **Solution 3: Manual Cleanup**
```sql
-- Remove duplicate events (keep oldest)
DELETE FROM webhook_events
WHERE id NOT IN (
  SELECT MIN(id)
  FROM webhook_events
  GROUP BY event_id
);
```

---

## API Errors

### Issue: Rate Limit Errors (429)

**Symptoms:**
- Error: "RATE_LIMIT_EXCEEDED"
- 429 Too Many Requests
- Sync operations slow or failing

**Diagnostic Steps:**

1. **Check Rate Limit Headers**
   ```bash
   curl -I https://api.softpro.com/v1/transactions \
     -H "Authorization: Bearer YOUR_TOKEN"
   # Check X-RateLimit-* headers
   ```

2. **Monitor Request Frequency**
   ```bash
   # Check how many requests in last minute
   grep "softpro API" logs/application.log | grep "$(date '+%Y-%m-%d %H:%M')" | wc -l
   ```

**Solutions:**

✅ **Solution 1: Enable Request Throttling**
```bash
curl -X PATCH https://your-domain.com/api/v1/integrations/softpro/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "throttleRequests": true,
    "maxRequestsPerMinute": 50,  // Reduce from default
    "requestDelay": 1200  // Add 1.2s delay between requests
  }'
```

✅ **Solution 2: Implement Exponential Backoff**
```typescript
// Automatically implemented in integration
// Configure retry behavior
{
  enableRetry: true,
  maxRetries: 5,
  retryDelay: 1000,  // Start with 1s
  backoffMultiplier: 2  // Double each time
}
```

✅ **Solution 3: Upgrade SoftPro Plan**
- Contact SoftPro support to increase rate limits
- Upgrade to Professional or Enterprise tier

---

### Issue: Network Errors / Timeouts

**Symptoms:**
- Error: "ECONNREFUSED" or "ETIMEDOUT"
- Requests hanging or timing out
- Intermittent connection failures

**Diagnostic Steps:**

1. **Test Network Connectivity**
   ```bash
   # Test connection to SoftPro API
   curl -v https://api.softpro.com/v1/health

   # Check DNS resolution
   nslookup api.softpro.com

   # Check SSL certificate
   openssl s_client -connect api.softpro.com:443
   ```

2. **Check Firewall Rules**
   ```bash
   # Verify outbound HTTPS is allowed
   telnet api.softpro.com 443
   ```

**Solutions:**

✅ **Solution 1: Increase Timeout**
```bash
curl -X PATCH https://your-domain.com/api/v1/integrations/softpro/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "apiTimeout": 30000,  // Increase to 30 seconds
    "connectionTimeout": 10000  // Connection timeout 10s
  }'
```

✅ **Solution 2: Configure Proxy (if behind firewall)**
```bash
# Add to .env
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080
NO_PROXY=localhost,127.0.0.1
```

✅ **Solution 3: Enable Connection Pooling**
```typescript
// In API client configuration
{
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  maxFreeSockets: 10
}
```

---

## Performance Issues

### Issue: High Memory Usage

**Symptoms:**
- Application crashes with out-of-memory errors
- Slow response times
- High memory usage in monitoring

**Diagnostic Steps:**

1. **Check Memory Usage**
   ```bash
   # Check Node.js process memory
   ps aux | grep node

   # Check heap usage
   node --expose-gc --max-old-space-size=4096 index.js
   ```

2. **Profile Memory**
   ```bash
   # Generate heap snapshot
   kill -USR2 <node_pid>
   ```

**Solutions:**

✅ **Solution 1: Reduce Batch Size**
```bash
curl -X PATCH https://your-domain.com/api/v1/integrations/softpro/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "syncBatchSize": 10,  // Reduce from 50
    "processInChunks": true
  }'
```

✅ **Solution 2: Increase Node.js Memory Limit**
```bash
# Update start script in package.json
node --max-old-space-size=4096 index.js
```

✅ **Solution 3: Enable Streaming for Large Responses**
```typescript
// Use streaming for large datasets
const stream = await softProAPI.getTransactionsStream();
stream.on('data', (transaction) => {
  processTransaction(transaction);
});
```

---

### Issue: Database Connection Pool Exhausted

**Symptoms:**
- Error: "Connection pool exhausted"
- Slow database queries
- Timeouts on database operations

**Diagnostic Steps:**

1. **Check Connection Pool Size**
   ```sql
   SELECT count(*) as active_connections
   FROM pg_stat_activity
   WHERE datname = 'roi_systems';
   ```

2. **Check for Connection Leaks**
   ```sql
   SELECT pid, state, query_start, state_change
   FROM pg_stat_activity
   WHERE datname = 'roi_systems'
   AND state = 'idle'
   AND state_change < NOW() - INTERVAL '5 minutes';
   ```

**Solutions:**

✅ **Solution 1: Increase Pool Size**
```bash
# Update DATABASE_URL
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=20
```

✅ **Solution 2: Implement Connection Pooling**
```typescript
// In Prisma configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["connectionPool"]
}
```

✅ **Solution 3: Close Idle Connections**
```sql
-- Kill idle connections older than 10 minutes
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'roi_systems'
AND state = 'idle'
AND state_change < NOW() - INTERVAL '10 minutes';
```

---

## Data Conflicts

### Issue: Conflict Resolution Not Working

**Symptoms:**
- Data not updating as expected
- Conflicts flagged but not resolved
- Wrong data version saved

**Diagnostic Steps:**

1. **Check Conflict Strategy**
   ```bash
   curl https://your-domain.com/api/v1/integrations/softpro/config \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   # Check conflictStrategy field
   ```

2. **Review Conflict Logs**
   ```sql
   SELECT * FROM data_conflicts
   WHERE integration_id = 'your_integration_id'
   AND resolution_status = 'UNRESOLVED'
   ORDER BY created_at DESC;
   ```

**Solutions:**

✅ **Solution 1: Change Conflict Strategy**
```bash
curl -X PATCH https://your-domain.com/api/v1/integrations/softpro/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "conflictStrategy": "NEWEST_WINS",  // or SOFTPRO_WINS, ROI_WINS
    "conflictNotifications": true
  }'
```

✅ **Solution 2: Manually Resolve Conflicts**
```bash
curl -X POST https://your-domain.com/api/v1/integrations/softpro/conflicts/resolve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "conflictId": "conflict_123",
    "resolution": "USE_SOFTPRO"  // or USE_ROI, MERGE
  }'
```

✅ **Solution 3: Configure Field-Level Resolution**
```bash
curl -X PATCH https://your-domain.com/api/v1/integrations/softpro/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fieldConflictStrategies": {
      "status": "SOFTPRO_WINS",
      "closingDate": "NEWEST_WINS",
      "notes": "MERGE"
    }
  }'
```

---

## Diagnostic Tools

### Health Check Script

```bash
#!/bin/bash
# save as: check_softpro_health.sh

echo "=== SoftPro Integration Health Check ==="

# Check environment variables
echo "\n1. Environment Variables:"
[ -n "$SOFTPRO_CLIENT_ID" ] && echo "✅ SOFTPRO_CLIENT_ID set" || echo "❌ SOFTPRO_CLIENT_ID missing"
[ -n "$SOFTPRO_CLIENT_SECRET" ] && echo "✅ SOFTPRO_CLIENT_SECRET set" || echo "❌ SOFTPRO_CLIENT_SECRET missing"
[ -n "$SOFTPRO_WEBHOOK_SECRET" ] && echo "✅ SOFTPRO_WEBHOOK_SECRET set" || echo "❌ SOFTPRO_WEBHOOK_SECRET missing"

# Check API health
echo "\n2. API Health:"
curl -s https://your-domain.com/api/v1/health | jq '.'

# Check database connection
echo "\n3. Database:"
psql $DATABASE_URL -c "SELECT 1" > /dev/null && echo "✅ Database connected" || echo "❌ Database connection failed"

# Check Redis
echo "\n4. Redis:"
redis-cli ping > /dev/null && echo "✅ Redis connected" || echo "❌ Redis connection failed"

# Check SoftPro API
echo "\n5. SoftPro API:"
curl -s https://api.softpro.com/health | jq '.'

# Check integration status
echo "\n6. Integration Status:"
curl -s -H "Authorization: Bearer $JWT_TOKEN" \
  https://your-domain.com/api/v1/integrations/softpro/health | jq '.'

echo "\n=== Health Check Complete ==="
```

### Log Analysis Script

```bash
#!/bin/bash
# save as: analyze_softpro_logs.sh

LOG_FILE="logs/application.log"

echo "=== SoftPro Integration Log Analysis ==="

# Count errors
echo "\n1. Error Summary:"
echo "Total errors: $(grep -c "ERROR.*softpro" $LOG_FILE)"
echo "Auth errors: $(grep -c "AUTHENTICATION_ERROR" $LOG_FILE)"
echo "Rate limit errors: $(grep -c "RATE_LIMIT" $LOG_FILE)"
echo "Validation errors: $(grep -c "VALIDATION_ERROR" $LOG_FILE)"

# Recent errors (last 24 hours)
echo "\n2. Recent Errors (last 24h):"
grep "ERROR.*softpro" $LOG_FILE | grep "$(date '+%Y-%m-%d')" | tail -10

# Sync performance
echo "\n3. Sync Performance:"
grep "Sync completed" $LOG_FILE | tail -5 | grep -oP 'duration: \K[0-9]+'

# Webhook stats
echo "\n4. Webhook Statistics:"
echo "Total webhooks: $(grep -c "Webhook received" $LOG_FILE)"
echo "Failed webhooks: $(grep -c "Webhook processing failed" $LOG_FILE)"

echo "\n=== Analysis Complete ==="
```

---

## Getting Support

### Before Contacting Support

Please gather the following information:

1. **Error Details**
   - Full error message
   - Error code
   - Request ID (from API response)
   - Timestamp

2. **Environment Information**
   ```bash
   node --version
   npm --version
   psql --version
   redis-cli --version
   ```

3. **Integration Configuration**
   ```bash
   curl https://your-domain.com/api/v1/integrations/softpro/config \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

4. **Recent Logs**
   ```bash
   tail -100 logs/application.log | grep softpro > softpro_logs.txt
   ```

### Support Channels

- **📧 Email:** integrations@roisystems.com
- **💬 Community Forum:** [community.roisystems.com](https://community.roisystems.com)
- **📞 Phone:** 1-800-ROI-SUPPORT (Enterprise plans only)
- **🎫 Support Portal:** [support.roisystems.com](https://support.roisystems.com)

### SoftPro Support

For issues with SoftPro API or services:
- **📧 Email:** support@softpro.com
- **📞 Phone:** Check SoftPro website
- **📚 Documentation:** [developer.softpro.com](https://developer.softpro.com)

---

## Quick Reference

### Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 401 | Authentication failed | Refresh token or re-authenticate |
| 403 | Insufficient permissions | Check OAuth scopes |
| 404 | Resource not found | Verify resource ID |
| 409 | Data conflict | Review conflict strategy |
| 429 | Rate limit exceeded | Enable throttling or upgrade plan |
| 500 | Server error | Retry with backoff |
| 503 | Service unavailable | Wait and retry |

### Useful Commands

```bash
# Check integration status
curl https://your-domain.com/api/v1/integrations/softpro/health \
  -H "Authorization: Bearer $JWT_TOKEN"

# Trigger manual sync
curl -X POST https://your-domain.com/api/v1/integrations/softpro/sync/all \
  -H "Authorization: Bearer $JWT_TOKEN"

# View sync history
curl https://your-domain.com/api/v1/integrations/softpro/sync-history \
  -H "Authorization: Bearer $JWT_TOKEN"

# Check queue depth
redis-cli LLEN bull:softpro-sync:wait

# View recent errors
grep "ERROR.*softpro" logs/application.log | tail -20

# Restart integration (if needed)
curl -X POST https://your-domain.com/api/v1/integrations/softpro/restart \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

**Still having issues?** Contact our support team at integrations@roisystems.com with your diagnostic information.
