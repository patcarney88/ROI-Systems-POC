# SoftPro 360 Integration - Quick Start Guide

**⏱️ Time to Complete:** 5 minutes
**📋 Prerequisites:** SoftPro 360 account, ROI Systems account

---

## 5-Minute Setup

### Step 1: Get SoftPro Credentials (2 minutes)

1. **Login to SoftPro Developer Portal**
   ```
   https://developer.softpro.com
   ```

2. **Create New Application**
   - Click "Create Application"
   - Name: "ROI Systems Integration"
   - Type: "Web Application"

3. **Configure Settings**
   - **Redirect URI:** `https://your-domain.com/api/v1/integrations/softpro/callback`
   - **Scopes:** Select all (read/write for transactions, contacts, documents)

4. **Copy Credentials to .env**
   ```bash
   # Add to .env file
   SOFTPRO_CLIENT_ID=your_client_id_here
   SOFTPRO_CLIENT_SECRET=your_client_secret_here
   SOFTPRO_REDIRECT_URI=https://your-domain.com/api/v1/integrations/softpro/callback
   SOFTPRO_WEBHOOK_SECRET=generate_random_secret_here
   ```

### Step 2: Connect Integration (1 minute)

**Option A: Via API**

```bash
curl -X POST https://your-domain.com/api/v1/integrations/softpro/connect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "redirectUri": "https://your-domain.com/callback"
  }'
```

**Response:**
```json
{
  "success": true,
  "authorizationUrl": "https://oauth.softpro.com/authorize?client_id=...",
  "state": "random_state_token"
}
```

**Option B: Via UI**

1. Navigate to: Settings → Integrations → SoftPro
2. Click "Connect to SoftPro"
3. Login and authorize

### Step 3: Complete OAuth (1 minute)

1. Visit the `authorizationUrl` from Step 2
2. Login to your SoftPro account
3. Click "Authorize" to grant access
4. You'll be redirected back automatically
5. ✅ Integration is now active!

### Step 4: Start Syncing (1 minute)

**Sync Transactions:**

```bash
curl -X POST https://your-domain.com/api/v1/integrations/softpro/sync/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "recordsProcessed": 45,
  "recordsSucceeded": 45,
  "recordsFailed": 0,
  "duration": 2340
}
```

✅ **Done!** Your integration is now active and syncing data.

---

## What's Next?

### Configure Webhooks (Optional but Recommended)

Real-time updates require webhook configuration:

```bash
curl -X POST https://api.softpro.com/v1/webhooks \
  -H "Authorization: Bearer YOUR_SOFTPRO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/v1/webhooks/softpro/{integrationId}",
    "events": ["transaction.*", "document.*", "closing.*"],
    "secret": "your_webhook_secret_from_env"
  }'
```

### Set Up Scheduled Sync (Optional)

Configure automatic background syncing:

```bash
# Add to crontab or scheduler
# Sync every hour
0 * * * * curl -X POST https://your-domain.com/api/v1/integrations/softpro/sync/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Customize Field Mappings (Optional)

Map custom fields between systems:

```bash
curl -X POST https://your-domain.com/api/v1/integrations/softpro/field-mappings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceField": "custom_field_1",
    "targetField": "metadata.specialField",
    "transformationType": "UPPERCASE"
  }'
```

---

## Verify Integration

### Check Health Status

```bash
curl https://your-domain.com/api/v1/integrations/softpro/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "status": "healthy",
  "integration": {
    "active": true,
    "lastSync": "2024-01-15T10:30:00Z",
    "tokenValid": true
  },
  "dependencies": {
    "database": "up",
    "redis": "up",
    "softproApi": "up"
  }
}
```

### View Sync History

```bash
curl https://your-domain.com/api/v1/integrations/softpro/sync-history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Webhook Reception

```bash
# Send test webhook to verify endpoint
curl -X POST https://your-domain.com/api/v1/webhooks/softpro/test \
  -H "Content-Type: application/json" \
  -H "x-softpro-signature: sha256=test" \
  -d '{
    "event": {
      "type": "test.ping",
      "data": {"test": true}
    }
  }'
```

---

## Common First-Time Issues

### Issue: "OAuth callback error"

**Solution:** Verify redirect URI matches exactly in both `.env` and SoftPro Developer Portal (including protocol, domain, and path).

### Issue: "Invalid client credentials"

**Solution:** Double-check Client ID and Secret are copied correctly from SoftPro Developer Portal. No extra spaces or line breaks.

### Issue: "Webhooks not working"

**Solution:**
1. Ensure webhook endpoint is publicly accessible (HTTPS required)
2. Verify webhook secret matches in both systems
3. Test endpoint manually with curl command above

### Issue: "No transactions syncing"

**Solution:** Check sync filters. By default, only active transactions sync. Use filters to include closed transactions if needed:

```bash
curl -X POST https://your-domain.com/api/v1/integrations/softpro/sync/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "filters": {
      "status": ["IN_PROGRESS", "PENDING_CLOSING", "CLOSED"]
    }
  }'
```

---

## Quick Reference

### Environment Variables

```bash
# Required
SOFTPRO_CLIENT_ID=your_client_id
SOFTPRO_CLIENT_SECRET=your_client_secret
SOFTPRO_REDIRECT_URI=https://your-domain.com/callback
SOFTPRO_WEBHOOK_SECRET=random_secret_here

# Optional
SOFTPRO_ENVIRONMENT=production  # or 'sandbox'
SOFTPRO_API_BASE_URL=https://api.softpro.com/v1
```

### Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/integrations/softpro/connect` | Initiate OAuth |
| `GET /api/v1/integrations/softpro/callback` | OAuth callback |
| `POST /api/v1/integrations/softpro/sync/transactions` | Sync transactions |
| `POST /api/v1/integrations/softpro/sync/contacts` | Sync contacts |
| `POST /api/v1/integrations/softpro/sync/documents` | Sync documents |
| `GET /api/v1/integrations/softpro/health` | Health check |
| `POST /api/v1/webhooks/softpro/{id}` | Webhook receiver |

### Sync Filters

```json
{
  "filters": {
    "status": ["IN_PROGRESS", "CLOSED"],
    "orderType": ["PURCHASE", "REFINANCE"],
    "openedDateFrom": "2024-01-01",
    "openedDateTo": "2024-12-31",
    "propertyState": ["CA", "NY"],
    "limit": 100
  }
}
```

---

## Need Help?

- 📖 **Full Documentation:** See [SOFTPRO_INTEGRATION_COMPLETE.md](../SOFTPRO_INTEGRATION_COMPLETE.md)
- 🐛 **Troubleshooting:** See [SOFTPRO_TROUBLESHOOTING.md](./SOFTPRO_TROUBLESHOOTING.md)
- 📧 **Email Support:** integrations@roisystems.com
- 💬 **Community:** [community.roisystems.com](https://community.roisystems.com)

---

**✅ You're all set!** The integration is now active and ready to sync data between SoftPro and ROI Systems.
