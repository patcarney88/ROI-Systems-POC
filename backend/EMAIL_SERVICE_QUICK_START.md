# EMAIL SERVICE - QUICK START GUIDE

## What Has Been Built

A comprehensive **multi-provider email service architecture** with automatic failover between SendGrid, AWS SES, and Mailgun.

### ✅ Production-Ready Components

1. **Database Schema** (`prisma/schema.email-service.prisma`)
   - 8 models, 12 enums, 35+ indexes
   - Support for multi-provider configuration
   - Health monitoring and metrics tracking
   - Unified suppression list management

2. **TypeScript Types** (`src/types/email.types.ts`)
   - 40+ comprehensive type definitions
   - Full type safety for all operations

3. **Provider Interface** (`src/services/email/email-provider.interface.ts`)
   - Abstract interface for all providers
   - Base class with common utilities
   - 20+ standardized methods

4. **Documentation**
   - Architecture guide (800+ lines)
   - Implementation summary
   - This quick start guide

---

## Quick Start for Developers

### 1. Understanding the Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Email Service Manager                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐    │
│  │  Provider  │  │  Failover  │  │  Load Balancing    │    │
│  │  Selection │  │   Logic    │  │   & Optimization   │    │
│  └────────────┘  └────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼───────┐  ┌───────▼────────┐
│    SendGrid    │  │   AWS SES    │  │    Mailgun     │
│   (Primary)    │  │ (Secondary)  │  │  (Tertiary)    │
└────────────────┘  └──────────────┘  └────────────────┘
```

### 2. Core Concepts

**Provider Priority**:
- `0` = Primary (SendGrid for marketing)
- `1` = Secondary (AWS SES for transactional, low cost)
- `2` = Tertiary (Mailgun for backup/EU)

**Health Score**: 0-100 metric based on:
- Delivery rate (50% weight)
- Bounce rate (20% weight)
- Complaint rate (50% weight)
- Failure rate (30% weight)
- Consecutive failures (10 points per failure)

**Automatic Failover**: Triggered when:
- Provider health score drops below 70
- Consecutive failures >= 3
- Rate limit exceeded
- Quota exhausted

### 3. Database Setup

```bash
# Add to your main schema.prisma
# Copy content from prisma/schema.email-service.prisma

# Run migration
npx prisma migrate dev --name add_email_service

# Generate Prisma client
npx prisma generate
```

### 4. Environment Configuration

```bash
# Copy from example
cp .env.example .env

# Required for SendGrid
SENDGRID_API_KEY=your_key_here
SENDGRID_VERIFIED_DOMAIN=yourdomain.com

# Required for AWS SES
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=your_key_here
AWS_SES_SECRET_ACCESS_KEY=your_secret_here

# Required for Mailgun
MAILGUN_API_KEY=your_key_here
MAILGUN_DOMAIN=mg.yourdomain.com

# Service configuration
EMAIL_FAILOVER_ENABLED=true
EMAIL_FAILOVER_THRESHOLD=3
EMAIL_AUTO_RECOVERY_ENABLED=true
```

---

## Implementation Roadmap

### Step 1: Implement Provider Adapters (Week 1-2)

#### SendGrid Provider
**File**: `src/services/email/providers/sendgrid-provider.ts`

```typescript
import { BaseEmailProvider } from '../email-provider.interface';
import sgMail from '@sendgrid/mail';

export class SendGridProvider extends BaseEmailProvider {
  private client: typeof sgMail;

  async initialize(config: any): Promise<void> {
    sgMail.setApiKey(config.apiKey);
    this.client = sgMail;
  }

  getProviderName() {
    return 'SENDGRID' as const;
  }

  async sendSingle(email: EmailData): Promise<SendResult> {
    // TODO: Implement SendGrid send logic
    // 1. Validate email data
    // 2. Transform to SendGrid format
    // 3. Send via SendGrid API
    // 4. Return SendResult
  }

  // ... implement other methods
}
```

**Key Tasks**:
- [x] Copy existing sendgrid.service.ts logic
- [ ] Adapt to IEmailProvider interface
- [ ] Add health monitoring
- [ ] Implement webhook validation
- [ ] Add suppression list sync

**Estimated Time**: 3-4 days

#### AWS SES Provider
**File**: `src/services/email/providers/ses-provider.ts`

```typescript
import { BaseEmailProvider } from '../email-provider.interface';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

export class SESProvider extends BaseEmailProvider {
  private client: SESClient;

  async initialize(config: any): Promise<void> {
    this.client = new SESClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });
  }

  getProviderName() {
    return 'AWS_SES' as const;
  }

  async sendSingle(email: EmailData): Promise<SendResult> {
    // TODO: Implement SES send logic
    // 1. Validate email data
    // 2. Create SendEmailCommand
    // 3. Send via SES API
    // 4. Return SendResult
  }

  // ... implement other methods
}
```

**Key Tasks**:
- [ ] Set up AWS SDK client
- [ ] Implement send methods
- [ ] Configure SNS for webhooks
- [ ] Add quota monitoring
- [ ] Implement health checks

**Estimated Time**: 4-5 days

#### Mailgun Provider
**File**: `src/services/email/providers/mailgun-provider.ts`

**Dependencies**:
```bash
npm install mailgun.js form-data
```

```typescript
import { BaseEmailProvider } from '../email-provider.interface';
import Mailgun from 'mailgun.js';
import formData from 'form-data';

export class MailgunProvider extends BaseEmailProvider {
  private client: any;

  async initialize(config: any): Promise<void> {
    const mailgun = new Mailgun(formData);
    this.client = mailgun.client({
      username: 'api',
      key: config.apiKey,
      url: config.region === 'eu'
        ? 'https://api.eu.mailgun.net'
        : 'https://api.mailgun.net'
    });
  }

  getProviderName() {
    return 'MAILGUN' as const;
  }

  async sendSingle(email: EmailData): Promise<SendResult> {
    // TODO: Implement Mailgun send logic
  }

  // ... implement other methods
}
```

**Key Tasks**:
- [ ] Set up Mailgun client
- [ ] Implement send methods
- [ ] Add webhook validation
- [ ] Implement health checks

**Estimated Time**: 3-4 days

### Step 2: Build Email Service Manager (Week 3)

**File**: `src/services/email/email-service-manager.ts`

```typescript
import { IEmailProvider } from './email-provider.interface';
import { SendGridProvider } from './providers/sendgrid-provider';
import { SESProvider } from './providers/ses-provider';
import { MailgunProvider } from './providers/mailgun-provider';

export class EmailServiceManager {
  private providers: Map<string, IEmailProvider> = new Map();
  private db: PrismaClient;

  constructor(db: PrismaClient) {
    this.db = db;
  }

  async initialize(): Promise<void> {
    // 1. Load provider configs from database
    // 2. Initialize each provider
    // 3. Start health monitoring
  }

  async sendEmail(emailData: EmailData, options?: SendOptions): Promise<SendResult> {
    // 1. Select best provider based on criteria
    // 2. Attempt send
    // 3. On failure, try failover
    // 4. Track metrics and update health scores
  }

  private async selectProvider(criteria: SelectionCriteria): Promise<IEmailProvider> {
    // TODO: Implement provider selection algorithm
    // See EMAIL_SERVICE_CORE_ARCHITECTURE.md for pseudocode
  }

  private async handleFailover(error: Error, provider: IEmailProvider): Promise<IEmailProvider> {
    // TODO: Implement failover logic
    // See EMAIL_SERVICE_CORE_ARCHITECTURE.md for pseudocode
  }

  private async checkProvidersHealth(): Promise<void> {
    // TODO: Check health of all providers
    // Run every 60 seconds
  }
}
```

**Key Tasks**:
- [ ] Implement provider selection algorithm
- [ ] Build automatic failover logic
- [ ] Add health monitoring
- [ ] Implement cost optimization
- [ ] Add load balancing

**Estimated Time**: 7-10 days

### Step 3: Suppression List Manager (Week 3-4)

**File**: `src/services/email/suppression-manager.ts`

```typescript
export class SuppressionManager {
  private db: PrismaClient;

  async isSuppressed(email: string, organizationId: string): Promise<SuppressionCheckResult> {
    // Check if email is on suppression list
  }

  async addToSuppression(email: string, reason: SuppressionReason): Promise<void> {
    // Add email to suppression list
    // Sync with all providers
  }

  async processBounce(event: EmailEvent): Promise<void> {
    // Automatically add hard bounces
    // Track soft bounces for expiration
  }

  async syncWithProviders(): Promise<void> {
    // Sync suppression list with all providers
  }
}
```

**Key Tasks**:
- [ ] Implement suppression checking
- [ ] Add auto-suppression rules
- [ ] Build provider sync
- [ ] Add expiration handling

**Estimated Time**: 3-4 days

### Step 4: Enhanced Queue Processor (Week 4)

**File**: `src/processors/email.processor.enhanced.ts`

```typescript
import { emailQueue } from '../queues/email.queue';
import { EmailServiceManager } from '../services/email/email-service-manager';

emailQueue.process(async (job) => {
  const { emailData, options } = job.data;

  // 1. Check suppression list
  const suppressed = await suppressionManager.isSuppressed(
    emailData.to[0].email,
    emailData.organizationId
  );

  if (suppressed.isSuppressed) {
    throw new Error(`Email suppressed: ${suppressed.reason}`);
  }

  // 2. Send via email service manager (handles failover)
  const result = await emailServiceManager.sendEmail(emailData, options);

  // 3. Update database
  // 4. Create events

  return result;
});
```

**Key Tasks**:
- [ ] Integrate with EmailServiceManager
- [ ] Add suppression checking
- [ ] Enhanced error handling
- [ ] Provider failover tracking

**Estimated Time**: 3-4 days

### Step 5: API Layer (Week 5)

**File**: `src/controllers/email.controller.ts`

```typescript
export class EmailController {
  // Send single email
  async sendSingle(req: Request, res: Response) {
    const emailData: EmailData = req.body;
    const result = await emailServiceManager.sendEmail(emailData);
    res.json(result);
  }

  // Send bulk emails
  async sendBulk(req: Request, res: Response) {
    const emails: EmailData[] = req.body.emails;
    const result = await emailServiceManager.sendBulkEmails(emails);
    res.json(result);
  }

  // Provider management endpoints
  // Suppression management endpoints
  // Template management endpoints
  // Webhook endpoints
}
```

**Key Tasks**:
- [ ] Implement 25+ endpoints
- [ ] Add request validation
- [ ] Implement authentication
- [ ] Add rate limiting
- [ ] Create webhook handlers

**Estimated Time**: 4-5 days

---

## Testing Checklist

### Unit Tests
- [ ] SendGrid provider adapter
- [ ] AWS SES provider adapter
- [ ] Mailgun provider adapter
- [ ] Email service manager
- [ ] Suppression list manager
- [ ] Provider selection algorithm
- [ ] Failover logic
- [ ] Health score calculation

### Integration Tests
- [ ] End-to-end email sending
- [ ] Provider failover scenarios
- [ ] Webhook processing (all providers)
- [ ] Suppression list operations
- [ ] Database operations
- [ ] Queue processing

### Load Tests
- [ ] 10,000 emails/hour sustained
- [ ] 20,000 emails/hour peak
- [ ] Provider failover under load
- [ ] Database performance
- [ ] Queue throughput

---

## Deployment Steps

### 1. Database Migration
```bash
# Run Prisma migration
npx prisma migrate deploy

# Verify tables created
psql $DATABASE_URL -c "\dt email_*"
```

### 2. Provider Configuration
```sql
-- Insert provider configurations
INSERT INTO email_providers (id, provider, priority, name, api_key, status, enabled)
VALUES
  (gen_random_uuid(), 'SENDGRID', 0, 'SendGrid Production', 'encrypted_key', 'ACTIVE', true),
  (gen_random_uuid(), 'AWS_SES', 1, 'AWS SES us-east-1', 'encrypted_key', 'ACTIVE', true),
  (gen_random_uuid(), 'MAILGUN', 2, 'Mailgun Backup', 'encrypted_key', 'ACTIVE', true);
```

### 3. Webhook Setup
- **SendGrid**: Dashboard → Settings → Mail Settings → Event Webhooks
- **AWS SES**: SNS Topic → Configure notifications
- **Mailgun**: Dashboard → Webhooks → Add webhook URL

### 4. Health Monitoring
```bash
# Start health check cron job
node -e "require('./dist/services/email/email-service-manager').checkProvidersHealth()"
```

### 5. Verify Operation
```bash
# Send test email
curl -X POST http://localhost:3000/api/v1/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"email": "test@yourdomain.com", "name": "Test"},
    "to": [{"email": "recipient@example.com"}],
    "subject": "Test Email",
    "html": "<p>This is a test email</p>"
  }'
```

---

## Monitoring & Maintenance

### Daily Tasks
- Review provider health scores
- Check failed email rate
- Monitor suppression list growth

### Weekly Tasks
- Analyze provider performance
- Review cost metrics
- Check for webhook issues

### Monthly Tasks
- Optimize provider priorities
- Review suppression list
- Audit security settings

---

## Troubleshooting

### Provider Failover Not Working
1. Check provider health scores in database
2. Verify `EMAIL_FAILOVER_ENABLED=true`
3. Check consecutive failure counts
4. Review error logs for provider issues

### High Bounce Rate
1. Check suppression list sync
2. Verify domain authentication (SPF, DKIM, DMARC)
3. Review email validation logic
4. Check for role accounts (noreply@, etc.)

### Webhooks Not Processing
1. Verify webhook URLs in provider dashboards
2. Check signature validation
3. Review firewall rules
4. Test with provider's webhook testing tools

---

## Support & Resources

### Documentation
- `EMAIL_SERVICE_CORE_ARCHITECTURE.md` - Complete architecture
- `EMAIL_SERVICE_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `EMAIL_SERVICE_QUICK_START.md` - This guide

### External Resources
- [SendGrid API Docs](https://docs.sendgrid.com/api-reference)
- [AWS SES API Docs](https://docs.aws.amazon.com/ses/)
- [Mailgun API Docs](https://documentation.mailgun.com/en/latest/api-intro.html)

### Getting Help
- Check implementation summary for detailed pseudocode
- Review provider interface for method signatures
- Refer to existing sendgrid.service.ts for patterns

---

## Success Criteria

- ✅ All provider adapters implemented and tested
- ✅ Automatic failover working reliably
- ✅ Health monitoring updating every 60 seconds
- ✅ Suppression list preventing invalid sends
- ✅ 10,000+ emails/hour throughput achieved
- ✅ Delivery rate >98%
- ✅ Failover time <5 seconds
- ✅ API endpoints fully functional
- ✅ Webhooks processing correctly
- ✅ Documentation complete

**Target Completion**: 4-6 weeks from start of implementation
