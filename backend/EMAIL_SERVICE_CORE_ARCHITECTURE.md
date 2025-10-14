# EMAIL SERVICE CORE ARCHITECTURE

## Overview

Comprehensive multi-provider email service with automatic failover for the ROI Systems platform. Supports SendGrid, AWS SES, and Mailgun with intelligent provider selection, health monitoring, and cost optimization.

## Architecture Components

### ✅ COMPLETED COMPONENTS

#### 1. Database Schema (`prisma/schema.email-service.prisma`)
**Status**: ✅ Complete

Enhanced schema with:
- **EmailProvider**: Multi-provider configuration, health monitoring, quota management
- **Email**: Enhanced email queue with failover tracking
- **EmailEvent**: Comprehensive event tracking with device/browser data
- **EmailSuppressionList**: Unified suppression across providers
- **EmailTemplate**: Reusable templates with provider optimizations
- **ProviderHealthLog**: Health check history for monitoring

**Key Features**:
- Priority-based provider selection (0=primary, 1=secondary, 2=tertiary)
- Health scoring (0-100) with automatic degradation
- Daily quota tracking and rate limiting
- Performance metrics (delivery rate, bounce rate, complaint rate)
- Cost tracking per email and total cost
- Automatic failover configuration
- Suppression list with cross-provider sync

#### 2. TypeScript Types (`src/types/email.types.ts`)
**Status**: ✅ Complete

Comprehensive type definitions including:
- **Core Types**: EmailData, EmailAddress, Attachment
- **Provider Types**: ProviderConfig, ProviderHealthStatus, ProviderScore
- **Result Types**: SendResult, BulkSendResult
- **Selection Types**: SelectionCriteria, ProviderScore
- **Retry & Failover**: RetryConfig, FailoverAttempt
- **Suppression**: SuppressionEntry, SuppressionCheckResult
- **Events**: EmailEvent, WebhookPayload
- **Statistics**: EmailMetrics, ProviderMetrics, OrganizationEmailStats
- **Configuration**: EmailServiceConfig, SendOptions, BulkSendOptions

#### 3. Provider Interface (`src/services/email/email-provider.interface.ts`)
**Status**: ✅ Complete

Abstract interface with:
- **IEmailProvider**: Core interface all providers must implement
- **BaseEmailProvider**: Abstract base class with common utilities
- **IProviderFactory**: Factory pattern for provider creation

**Core Methods**:
- `sendSingle()`, `sendBulk()`, `sendWithTemplate()`
- `checkHealth()`, `ping()`, `getRateLimit()`, `checkQuota()`
- `validateWebhook()`, `parseWebhook()`
- `addToSuppression()`, `checkSuppression()`, `getSuppresionList()`
- `getStats()`, `createTemplate()`, `updateTemplate()`
- Error handling: `isRetryableError()`, `isPermanentError()`, `parseError()`

---

## 🚧 IMPLEMENTATION ROADMAP

### Phase 1: Provider Adapters (High Priority)

#### SendGrid Provider (`src/services/email/providers/sendgrid-provider.ts`)
**Dependencies**: `@sendgrid/mail`

**Implementation Requirements**:
```typescript
import sgMail from '@sendgrid/mail';
import { BaseEmailProvider } from '../email-provider.interface';

export class SendGridProvider extends BaseEmailProvider {
  private client: typeof sgMail;

  async initialize(config: any): Promise<void> {
    sgMail.setApiKey(config.apiKey);
    this.client = sgMail;
  }

  async sendSingle(email: EmailData): Promise<SendResult> {
    // Implement SendGrid v3 API send
    // Handle tracking pixel injection
    // Process links for click tracking
    // Add unsubscribe links
  }

  async sendBulk(emails: EmailData[]): Promise<BulkSendResult> {
    // Use SendGrid batch API
    // Handle up to 1000 emails per batch
  }

  async checkHealth(): Promise<ProviderHealthStatus> {
    // Ping SendGrid API
    // Check rate limits
    // Calculate health score
  }

  validateWebhook(payload: any, signature: string): boolean {
    // Verify SendGrid webhook signature
    // Use HMAC SHA-256 validation
  }

  parseWebhook(payload: any): EmailEvent[] {
    // Parse SendGrid event types:
    // processed, dropped, delivered, deferred, bounce, open, click, spam_report, unsubscribe
  }
}
```

**Key Features**:
- Personalization (merge tags)
- Custom arguments for webhook tracking
- Categories for filtering
- ASM (Advanced Suppression Management)
- Template API integration
- Tracking settings configuration

#### AWS SES Provider (`src/services/email/providers/ses-provider.ts`)
**Dependencies**: `@aws-sdk/client-ses`

**Implementation Requirements**:
```typescript
import { SESClient, SendEmailCommand, SendBulkEmailCommand } from '@aws-sdk/client-ses';
import { BaseEmailProvider } from '../email-provider.interface';

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

  async sendSingle(email: EmailData): Promise<SendResult> {
    // Use SendEmailCommand
    // Configure configuration sets
    // Add custom headers for tracking
  }

  async sendBulk(emails: EmailData[]): Promise<BulkSendResult> {
    // Use SendBulkEmailCommand
    // Handle up to 50 destinations per call
    // Batch multiple calls for larger volumes
  }

  async checkHealth(): Promise<ProviderHealthStatus> {
    // Check sending quota with GetSendQuotaCommand
    // Check account status with GetAccountSendingEnabledCommand
  }

  validateWebhook(payload: any, signature: string): boolean {
    // Verify SNS message signature
    // Validate certificate URL
  }

  parseWebhook(payload: any): EmailEvent[] {
    // Parse SNS notifications:
    // Bounce, Complaint, Delivery notifications
  }
}
```

**Key Features**:
- Configuration sets for tracking
- SNS topic integration for events
- Reputation dashboard metrics
- Dedicated IP support
- Email sending limits management

#### Mailgun Provider (`src/services/email/providers/mailgun-provider.ts`)
**Dependencies**: `mailgun.js`

**Implementation Requirements**:
```typescript
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { BaseEmailProvider } from '../email-provider.interface';

export class MailgunProvider extends BaseEmailProvider {
  private client: any;

  async initialize(config: any): Promise<void> {
    const mailgun = new Mailgun(formData);
    this.client = mailgun.client({
      username: 'api',
      key: config.apiKey,
      url: config.region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
    });
  }

  async sendSingle(email: EmailData): Promise<SendResult> {
    // Use messages.create()
    // Add tracking variables
    // Configure recipient variables for personalization
  }

  async sendBulk(emails: EmailData[]): Promise<BulkSendResult> {
    // Use batch sending API
    // Handle recipient variables for personalization
  }

  async checkHealth(): Promise<ProviderHealthStatus> {
    // Check domain stats
    // Verify domain status
  }

  validateWebhook(payload: any, signature: string, timestamp: number): boolean {
    // Verify Mailgun webhook signature
    // Use HMAC SHA-256 with timestamp
  }

  parseWebhook(payload: any): EmailEvent[] {
    // Parse Mailgun events:
    // delivered, failed, opened, clicked, unsubscribed, complained
  }
}
```

**Key Features**:
- Tag-based tracking
- Recipient variables for batch personalization
- Template variables
- European data residency option
- Powerful routing and validation

### Phase 2: Email Service Manager (Critical)

#### Email Service Manager (`src/services/email/email-service-manager.ts`)

**Core Responsibilities**:
1. **Provider Selection Algorithm**:
   ```typescript
   async selectProvider(criteria: SelectionCriteria): Promise<EmailProvider> {
     // 1. Filter enabled providers
     // 2. Check health scores (>70 required)
     // 3. Check rate limits and quotas
     // 4. Sort by priority
     // 5. Apply cost optimization if bulk send
     // 6. Return best provider
   }
   ```

2. **Automatic Failover**:
   ```typescript
   async handleFailover(error: Error, attemptedProvider: EmailProvider): Promise<EmailProvider> {
     // 1. Mark provider as degraded
     // 2. Increment consecutive failures
     // 3. Update health score
     // 4. Select next available provider by priority
     // 5. Retry with new provider
     // 6. If all fail, queue for later retry
   }
   ```

3. **Load Balancing**:
   ```typescript
   async distributeLoad(emails: EmailData[]): Promise<Map<string, EmailData[]>> {
     // 1. Get all healthy providers
     // 2. Calculate capacity for each
     // 3. Distribute emails based on quota and rate limits
     // 4. Return distribution map
   }
   ```

4. **Cost Optimization**:
   ```typescript
   async selectCostOptimalProvider(emailCount: number): Promise<EmailProvider> {
     // 1. Calculate cost per provider
     // 2. Factor in current usage and quotas
     // 3. Select most cost-effective option
   }
   ```

5. **Health Monitoring**:
   ```typescript
   async checkProvidersHealth(): Promise<ProviderHealthMap> {
     // 1. Ping all providers
     // 2. Check quotas and limits
     // 3. Calculate health scores
     // 4. Update provider status
     // 5. Trigger auto-recovery if needed
   }
   ```

**Retry Logic**:
```typescript
async sendEmailWithRetry(emailData: EmailData, options?: SendOptions): Promise<SendResult> {
  let lastError: Error;
  let attempts = 0;
  const maxAttempts = options?.maxAttempts || 3;

  while (attempts < maxAttempts) {
    try {
      const provider = await this.selectProvider({
        organizationId: emailData.organizationId,
        priority: emailData.priority
      });

      const result = await provider.sendSingle(emailData);

      if (result.success) {
        await this.updateProviderMetrics(provider.getProviderId(), 'success');
        return result;
      }

      throw new Error(result.error?.message || 'Send failed');
    } catch (error) {
      lastError = error;
      attempts++;

      if (this.isRetryableError(error) && attempts < maxAttempts) {
        await this.handleFailover(error, provider);
        await this.delay(this.calculateBackoff(attempts));
        continue;
      }

      break;
    }
  }

  throw lastError;
}
```

### Phase 3: Suppression List Manager

#### Suppression Manager (`src/services/email/suppression-manager.ts`)

**Key Methods**:
```typescript
class SuppressionManager {
  async isSuppressed(email: string, organizationId: string): Promise<SuppressionCheckResult>;

  async addToSuppression(email: string, reason: SuppressionReason, details?: string): Promise<void>;

  async removeFromSuppression(email: string): Promise<void>;

  async syncWithProviders(): Promise<void>;

  async processBounce(emailEvent: EmailEvent): Promise<void>;

  async processComplaint(emailEvent: EmailEvent): Promise<void>;

  async cleanupExpired(): Promise<void>;
}
```

**Auto-Suppression Rules**:
- Hard bounces → Permanent suppression
- Soft bounces (3+ consecutive) → Temporary suppression (30 days)
- Spam complaints → Permanent suppression
- Unsubscribes → Permanent suppression
- Invalid emails → Permanent suppression

### Phase 4: Enhanced Email Queue Processor

#### Update Email Processor (`src/processors/email.processor.enhanced.ts`)

**Enhancements**:
1. Multi-provider support with fallback
2. Real-time failover on errors
3. Suppression list checking before send
4. Provider performance tracking
5. Enhanced error handling and retry logic

**Implementation**:
```typescript
emailQueue.process(async (job: Job<EmailJobData>) => {
  const { emailData, options } = job.data;

  try {
    // 1. Check suppression list
    const suppressed = await suppressionManager.isSuppressed(
      emailData.to[0].email,
      emailData.organizationId
    );

    if (suppressed.isSuppressed) {
      throw new Error(`Email suppressed: ${suppressed.reason}`);
    }

    // 2. Send via email service manager (handles provider selection and failover)
    const result = await emailServiceManager.sendEmail(emailData, options);

    // 3. Update database
    await db.email.update({
      where: { id: emailData.id },
      data: {
        status: 'SENT',
        providerId: result.providerId,
        providerMessageId: result.messageId,
        sentAt: result.sentAt
      }
    });

    // 4. Create delivery event
    await db.emailEvent.create({
      data: {
        emailId: emailData.id,
        providerId: result.providerId,
        eventType: 'SENT',
        timestamp: result.sentAt
      }
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    // Enhanced error handling with provider failover tracking
    await handleEmailError(error, emailData);
    throw error;
  }
});
```

### Phase 5: Email Controller & Routes

#### Email Controller (`src/controllers/email.controller.ts`)

**Endpoints**:
```typescript
// Email sending
POST   /api/v1/email/send              - Send single email
POST   /api/v1/email/send-bulk         - Send bulk emails
POST   /api/v1/email/send-template     - Send using template
POST   /api/v1/email/schedule          - Schedule email for later

// Email tracking
GET    /api/v1/email/:id               - Get email status
GET    /api/v1/email/:id/events        - Get email events
GET    /api/v1/email/:id/analytics     - Get email analytics

// Provider management
GET    /api/v1/email/providers         - List all providers
POST   /api/v1/email/providers         - Add new provider
GET    /api/v1/email/providers/:id     - Get provider details
PUT    /api/v1/email/providers/:id     - Update provider config
DELETE /api/v1/email/providers/:id     - Delete provider
POST   /api/v1/email/providers/:id/test - Test provider connection
GET    /api/v1/email/providers/:id/health - Get provider health

// Suppression management
GET    /api/v1/email/suppression       - Get suppression list
POST   /api/v1/email/suppression       - Add to suppression
DELETE /api/v1/email/suppression/:email - Remove from suppression
GET    /api/v1/email/suppression/:email - Check if email is suppressed

// Template management
GET    /api/v1/email/templates         - List templates
POST   /api/v1/email/templates         - Create template
GET    /api/v1/email/templates/:id     - Get template
PUT    /api/v1/email/templates/:id     - Update template
DELETE /api/v1/email/templates/:id     - Delete template
POST   /api/v1/email/templates/:id/test - Send test email

// Webhooks
POST   /api/v1/email/webhooks/sendgrid - SendGrid webhook endpoint
POST   /api/v1/email/webhooks/ses      - AWS SES SNS endpoint
POST   /api/v1/email/webhooks/mailgun  - Mailgun webhook endpoint

// Analytics
GET    /api/v1/email/analytics         - Overall email analytics
GET    /api/v1/email/analytics/providers - Provider comparison
GET    /api/v1/email/analytics/campaigns - Campaign analytics
```

### Phase 6: Environment Configuration

#### Environment Variables (`.env.example`)

```bash
# ============================================================================
# EMAIL SERVICE CONFIGURATION
# ============================================================================

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_VERIFIED_DOMAIN=yourdomain.com
SENDGRID_WEBHOOK_SECRET=your_webhook_secret_here
SENDGRID_DEFAULT_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_DEFAULT_FROM_NAME="Your Company"

# AWS SES Configuration
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SES_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_SES_CONFIGURATION_SET=your_config_set_name
AWS_SES_SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:ses-events

# Mailgun Configuration
MAILGUN_API_KEY=your_mailgun_api_key_here
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_REGION=us  # or 'eu' for European servers
MAILGUN_WEBHOOK_SECRET=your_webhook_secret_here

# Email Service Settings
EMAIL_DEFAULT_FROM=noreply@yourdomain.com
EMAIL_DEFAULT_FROM_NAME="Your Company"
EMAIL_DEFAULT_REPLY_TO=support@yourdomain.com

# Retry Configuration
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_INITIAL_DELAY=2000  # ms
EMAIL_RETRY_MAX_DELAY=60000     # ms
EMAIL_RETRY_BACKOFF_MULTIPLIER=2

# Rate Limiting
EMAIL_RATE_LIMIT_PER_SECOND=10
EMAIL_RATE_LIMIT_PER_MINUTE=600
EMAIL_RATE_LIMIT_PER_HOUR=10000
EMAIL_RATE_LIMIT_PER_DAY=100000

# Failover Configuration
EMAIL_FAILOVER_ENABLED=true
EMAIL_FAILOVER_THRESHOLD=3      # Consecutive failures before failover
EMAIL_AUTO_RECOVERY_ENABLED=true
EMAIL_RECOVERY_INTERVAL=300     # Seconds before retry after failure

# Health Monitoring
EMAIL_HEALTH_CHECK_ENABLED=true
EMAIL_HEALTH_CHECK_INTERVAL=60  # Seconds
EMAIL_HEALTH_CHECK_TIMEOUT=5000 # ms
EMAIL_MIN_HEALTH_SCORE=70       # Minimum score to use provider

# Suppression Management
EMAIL_AUTO_SUPPRESS_BOUNCES=true
EMAIL_AUTO_SUPPRESS_COMPLAINTS=true
EMAIL_SOFT_BOUNCE_EXPIRATION=30 # Days
EMAIL_SYNC_SUPPRESSION_LISTS=true

# Tracking Settings
EMAIL_TRACK_OPENS=true
EMAIL_TRACK_CLICKS=true
EMAIL_TRACK_UNSUBSCRIBE=true

# Backend URL (for tracking pixels and links)
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

---

## Implementation Priority

### Phase 1 (Week 1): Core Infrastructure ✅
- [x] Database schema design
- [x] TypeScript types and interfaces
- [x] Provider interface abstraction

### Phase 2 (Week 2): Provider Implementations 🚧
- [ ] SendGrid provider adapter
- [ ] AWS SES provider adapter
- [ ] Mailgun provider adapter
- [ ] Provider factory pattern

### Phase 3 (Week 3): Service Manager 🚧
- [ ] Provider selection algorithm
- [ ] Automatic failover logic
- [ ] Health monitoring system
- [ ] Cost optimization engine
- [ ] Suppression list manager

### Phase 4 (Week 4): Integration 🚧
- [ ] Enhanced email queue processor
- [ ] Webhook handlers for all providers
- [ ] Email controller with full API
- [ ] Route definitions with auth/rate limiting

### Phase 5 (Week 5): Testing & Documentation 📝
- [ ] Unit tests for all components
- [ ] Integration tests
- [ ] Load testing (10,000+ emails/hour)
- [ ] API documentation
- [ ] Deployment guides

---

## Performance Targets

- **Throughput**: 10,000+ emails per hour
- **Latency**: <500ms per email send
- **Failover Time**: <5 seconds
- **Health Check Interval**: 60 seconds
- **Delivery Rate**: >98%
- **Uptime**: 99.9%

## Cost Optimization

**Provider Cost Comparison** (approximate):
- SendGrid: $0.0003/email (100k+ volume)
- AWS SES: $0.0001/email
- Mailgun: $0.0008/email (5k+ volume)

**Optimization Strategy**:
1. Use AWS SES for high-volume transactional emails (lowest cost)
2. Use SendGrid for marketing campaigns (best deliverability)
3. Use Mailgun for backup/failover (EU data residency option)

## Security Considerations

1. **API Key Management**:
   - Store encrypted in database
   - Rotate keys regularly
   - Use environment variables for configuration

2. **Webhook Security**:
   - Verify signatures for all webhooks
   - Use HTTPS only
   - Implement replay attack prevention

3. **Data Privacy**:
   - Hash email addresses in suppression lists
   - Implement GDPR right to erasure
   - Secure personal data in transit and at rest

4. **Rate Limiting**:
   - Per-organization limits
   - Per-user limits
   - Global system limits

---

## Next Steps

1. **Implement Provider Adapters**: Complete SendGrid, AWS SES, and Mailgun providers
2. **Build Email Service Manager**: Implement provider selection and failover logic
3. **Create Suppression Manager**: Build unified suppression list management
4. **Enhance Queue Processor**: Update with multi-provider support
5. **Build API Layer**: Create controller and routes
6. **Testing**: Comprehensive testing at scale
7. **Documentation**: Complete API docs and deployment guides

This architecture provides a robust, scalable, and cost-effective email service with automatic failover capabilities.
