# Email Analytics & Tracking System

Comprehensive email analytics and tracking system for the multi-provider email marketing platform.

## Overview

This system provides real-time email analytics, tracking, and reporting capabilities for high-volume email campaigns (10,000+ emails/hour).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Email Analytics System                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  Link Tracking   │  │  Open Tracking   │               │
│  └──────────────────┘  └──────────────────┘               │
│          │                      │                           │
│          v                      v                           │
│  ┌─────────────────────────────────────────┐               │
│  │        Email Analytics Service          │               │
│  │  - Real-time event processing           │               │
│  │  - Performance metrics                  │               │
│  │  - Engagement tracking                  │               │
│  └─────────────────────────────────────────┘               │
│          │                                                   │
│          v                                                   │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  User Agent      │  │  Geographic      │               │
│  │  Parser          │  │  Service         │               │
│  └──────────────────┘  └──────────────────┘               │
│          │                      │                           │
│          v                      v                           │
│  ┌─────────────────────────────────────────┐               │
│  │     Dashboard Analytics Service         │               │
│  │  - Real-time overview                   │               │
│  │  - Trends & metrics                     │               │
│  │  - Provider health                      │               │
│  └─────────────────────────────────────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Implemented Services

### 1. User Agent Parser Service
**File**: `/backend/src/services/email/user-agent-parser.service.ts`

**Features**:
- Device detection (desktop, mobile, tablet)
- Email client identification (Gmail, Outlook, Apple Mail, etc.)
- Browser detection
- Operating system detection
- Batch parsing optimization

**Key Methods**:
```typescript
parseUserAgent(userAgent: string): ParsedUserAgent
detectEmailClient(userAgent: string): EmailClient
categorizeDevice(userAgent: string): DeviceCategory
getDeviceBreakdown(userAgents: string[]): Record<string, number>
getEmailClientBreakdown(userAgents: string[]): Record<string, number>
```

**Supported Email Clients**:
- Gmail
- Outlook
- Apple Mail
- Yahoo Mail
- Thunderbird
- Samsung Mail
- Android Mail
- iOS Mail
- Windows Mail
- Webmail (browser-based)

### 2. Geographic Service
**File**: `/backend/src/services/email/geographic.service.ts`

**Features**:
- IP geolocation (country, region, city)
- Timezone detection
- Geographic distribution analysis
- Map visualization data generation
- Location clustering
- Distance calculations

**Key Methods**:
```typescript
getLocationFromIP(ipAddress: string): Promise<Location | null>
getTimeZone(ipAddress: string): Promise<string>
aggregateByLocation(ipAddresses: string[]): Promise<LocationStats[]>
getGeographicDistribution(ipAddresses: string[]): Promise<GeographicDistribution>
groupNearbyLocations(locations: Location[], threshold: number): Location[]
```

**Geographic Data**:
- Country/region/city detection
- Latitude/longitude coordinates
- Timezone identification
- Top countries/cities analysis
- Heat map data generation

### 3. Link Tracking Service
**File**: `/backend/src/services/email/link-tracking.service.ts`

**Features**:
- Trackable link generation
- Click tracking and attribution
- UTM parameter management
- Link performance analytics
- A/B testing support
- Automatic HTML link processing

**Key Methods**:
```typescript
generateTrackingLink(options: TrackingLinkOptions): Promise<string>
processClick(trackingId: string, userAgent: string, ipAddress: string): Promise<RedirectResponse>
getLinkPerformance(linkId: string, dateRange?: DateRange): Promise<LinkPerformance>
addUTMParameters(url: string, params: UTMParams): string
processLinksInHTML(html: string, options: TrackingOptions): Promise<string>
getTopLinks(campaignId: string, limit: number): Promise<LinkStats[]>
```

**UTM Parameters**:
- utm_source
- utm_medium
- utm_campaign
- utm_term
- utm_content

## Services To Be Implemented

### 4. Open Tracking Service
**File**: `/backend/src/services/email/open-tracking.service.ts`

**Features**:
- Tracking pixel generation
- Open event processing
- Unique opens detection
- Open rate calculation
- Timing analytics

### 5. Email Analytics Service
**File**: `/backend/src/services/email/email-analytics.service.ts`

**Features**:
- Real-time analytics processing
- Event aggregation
- Performance metrics calculation
- Geographic analysis
- Device/client detection
- Conversion tracking
- Campaign comparison

**Key Metrics**:
- Delivery rate
- Open rate
- Click rate
- Click-to-open rate
- Bounce rate
- Unsubscribe rate
- Spam complaint rate
- Average delivery time
- Average open time
- Average click time

### 6. Dashboard Analytics Service
**File**: `/backend/src/services/email/dashboard-analytics.service.ts`

**Features**:
- Real-time overview metrics
- Today's performance summary
- Trend analysis (7d, 30d, 90d)
- Provider health monitoring
- Recent activity feed
- Comparative analytics

**Dashboard Data**:
```typescript
interface RealtimeOverview {
  emailsInQueue: number;
  emailsSentLast5Min: number;
  activeProviders: number;
  currentDeliveryRate: number;
  avgResponseTime: number;
  recentActivity: RecentActivity[];
}

interface DailyMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  comparedToYesterday: {
    sent: number;
    openRate: number;
    clickRate: number;
  };
}
```

### 7. Reporting Service
**File**: `/backend/src/services/email/reporting.service.ts`

**Features**:
- PDF report generation
- CSV export
- Excel export
- Scheduled reports
- Custom report templates
- Email report delivery

**Report Types**:
- Daily summary
- Weekly digest
- Monthly overview
- Campaign performance
- Provider comparison
- Deliverability report
- Custom reports

## Controllers

### Analytics Controller
**File**: `/backend/src/controllers/email-analytics.controller.ts`

**Endpoints**:
```
GET  /api/v1/email/:id/analytics          - Email-specific analytics
GET  /api/v1/email/:id/events             - Email event history
GET  /api/v1/email/:id/clicks             - Click analytics
GET  /api/v1/email/:id/opens              - Open analytics

GET  /api/v1/email/analytics/campaign     - Campaign analytics
GET  /api/v1/email/analytics/providers    - Provider comparison
GET  /api/v1/email/analytics/geographic   - Geographic distribution
GET  /api/v1/email/analytics/devices      - Device breakdown

GET  /api/v1/email/analytics/dashboard/realtime  - Real-time overview
GET  /api/v1/email/analytics/dashboard/today     - Today's metrics
GET  /api/v1/email/analytics/dashboard/trends    - Trend analysis

GET  /api/v1/email/analytics/export       - Export analytics data
```

### Tracking Controller
**File**: `/backend/src/controllers/email-tracking.controller.ts`

**Public Endpoints** (no authentication):
```
GET  /track/open/:emailId                 - Open tracking pixel
GET  /track/click/:trackingId             - Click tracking & redirect
GET  /unsubscribe/:token                  - Unsubscribe page
POST /unsubscribe/:token                  - Process unsubscribe
```

## Database Schema Extensions

### Email Link Tracking Table
```sql
CREATE TABLE email_link_tracking (
  tracking_id VARCHAR(32) PRIMARY KEY,
  campaign_id UUID NOT NULL,
  subscriber_id UUID NOT NULL,
  email_id UUID NOT NULL,
  original_url TEXT NOT NULL,
  final_url TEXT NOT NULL,
  link_id VARCHAR(50),
  link_category VARCHAR(50),
  click_count INT DEFAULT 0,
  last_clicked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id),
  FOREIGN KEY (subscriber_id) REFERENCES email_subscribers(id)
);

CREATE INDEX idx_link_tracking_campaign ON email_link_tracking(campaign_id);
CREATE INDEX idx_link_tracking_subscriber ON email_link_tracking(subscriber_id);
```

## Integration with Existing System

### SendGrid Service Integration
The analytics system integrates seamlessly with the existing SendGrid service:

```typescript
// In sendgrid.service.ts

// Add tracking pixel
html = sendGridService.addTrackingPixel(html, messageId, subscriberId);

// Process links for tracking
html = await linkTrackingService.processLinksInHTML(html, {
  emailId: messageId,
  campaignId,
  subscriberId,
  utmParams: {
    source: 'email',
    medium: 'campaign',
    campaign: campaignName
  }
});
```

### Email Processor Integration
Track events in the email processor:

```typescript
// In email.processor.ts

// Track delivery
await emailAnalyticsService.trackEvent({
  campaignId,
  subscriberId,
  messageId,
  eventType: 'DELIVERED',
  timestamp: new Date()
});

// Track opens (webhook)
await openTrackingService.processOpen(messageId, userAgent, ipAddress);

// Track clicks (webhook)
await linkTrackingService.processClick(trackingId, userAgent, ipAddress);
```

## Webhook Configuration

### SendGrid Webhook Events
Configure SendGrid to send webhook events to your backend:

**Webhook URL**: `https://your-domain.com/api/webhooks/sendgrid`

**Events to Track**:
- `delivered` - Email delivered successfully
- `open` - Email opened (tracking pixel loaded)
- `click` - Link clicked in email
- `bounce` - Email bounced (hard or soft)
- `dropped` - Email dropped by SendGrid
- `spamreport` - Recipient marked as spam
- `unsubscribe` - Recipient unsubscribed

**Webhook Handler**:
```typescript
async handleSendGridWebhook(events: SendGridEvent[]) {
  for (const event of events) {
    await emailAnalyticsService.trackEvent({
      messageId: event.sg_message_id,
      eventType: event.event,
      timestamp: new Date(event.timestamp * 1000),
      email: event.email,
      userAgent: event.useragent,
      ipAddress: event.ip,
      url: event.url // for click events
    });
  }
}
```

## Performance Optimizations

### 1. Database Indexes
- Campaign ID indexes for fast campaign queries
- Timestamp indexes for time-range queries
- Composite indexes for common query patterns

### 2. Caching Strategy
```typescript
// Redis caching for frequently accessed data
- Campaign metrics (5 minute TTL)
- Dashboard overview (1 minute TTL)
- Geographic data (1 hour TTL)
```

### 3. Batch Processing
```typescript
// Process events in batches
await emailAnalyticsService.trackEventsBatch(events);

// Aggregate metrics asynchronously
await dashboardAnalyticsService.recalculateMetrics(campaignId);
```

### 4. Query Optimization
```typescript
// Use materialized views for complex aggregations
CREATE MATERIALIZED VIEW campaign_metrics_daily AS
SELECT
  campaign_id,
  DATE(event_timestamp) as date,
  COUNT(*) FILTER (WHERE event_type = 'DELIVERED') as delivered,
  COUNT(*) FILTER (WHERE event_type = 'OPENED') as opened,
  COUNT(*) FILTER (WHERE event_type = 'CLICKED') as clicked
FROM email_events
GROUP BY campaign_id, DATE(event_timestamp);
```

## Real-time Analytics with WebSocket

### WebSocket Events
```typescript
// Subscribe to campaign updates
socket.on('subscribe:campaign', (campaignId) => {
  // Join campaign room
  socket.join(`campaign:${campaignId}`);
});

// Broadcast real-time events
io.to(`campaign:${campaignId}`).emit('campaign:event', {
  type: 'OPENED',
  timestamp: Date.now(),
  metrics: { /* current metrics */ }
});
```

## API Response Examples

### Campaign Analytics
```json
{
  "campaignId": "abc123",
  "totalSent": 10000,
  "totalDelivered": 9850,
  "totalOpened": 3940,
  "totalClicked": 1180,
  "totalBounced": 150,
  "totalComplaints": 5,

  "deliveryRate": 98.5,
  "openRate": 40.0,
  "clickRate": 12.0,
  "bounceRate": 1.5,
  "complaintRate": 0.05,

  "avgDeliveryTime": 2.3,
  "avgOpenTime": 3600,
  "avgClickTime": 7200,

  "topLinks": [
    {
      "url": "https://example.com/cta",
      "clicks": 450,
      "uniqueClicks": 380
    }
  ],

  "topDevices": [
    { "device": "mobile", "count": 2100 },
    { "device": "desktop", "count": 1840 }
  ],

  "topLocations": [
    { "location": "New York, US", "count": 1200 },
    { "location": "Los Angeles, US", "count": 890 }
  ],

  "timeSeriesData": [
    { "hour": "2025-01-15T09:00:00Z", "sent": 500, "opened": 200, "clicked": 60 }
  ]
}
```

### Real-time Dashboard
```json
{
  "emailsInQueue": 1250,
  "emailsSentLast5Min": 143,
  "activeProviders": 3,
  "currentDeliveryRate": 98.7,
  "avgResponseTime": 2.1,

  "recentActivity": [
    {
      "timestamp": "2025-01-15T10:23:45Z",
      "type": "CLICKED",
      "email": "user@example.com",
      "campaign": "Home Value Update Q1"
    }
  ]
}
```

## Security Considerations

### 1. Tracking Pixel Privacy
- Use SHA-256 hashed identifiers
- No PII in URLs
- HTTPS-only tracking endpoints

### 2. Link Tracking Security
- Short-lived tracking tokens
- Rate limiting on redirect endpoints
- Malware/phishing URL scanning

### 3. Data Retention
- Event data: 90 days
- Aggregated metrics: 2 years
- Archived reports: 7 years

### 4. GDPR Compliance
- Right to access analytics data
- Right to delete tracking data
- Anonymization after retention period

## Testing

### Unit Tests
```bash
npm test services/email/user-agent-parser.service.test.ts
npm test services/email/geographic.service.test.ts
npm test services/email/link-tracking.service.test.ts
```

### Integration Tests
```bash
npm test integration/email-analytics.test.ts
```

### Performance Tests
```bash
npm test performance/analytics-load.test.ts
```

## Monitoring & Alerts

### Metrics to Monitor
- Event processing latency
- Database query performance
- Webhook processing time
- Cache hit/miss rates
- Error rates by service

### Alerts
- High bounce rate (>5%)
- High spam complaint rate (>0.1%)
- Low delivery rate (<95%)
- Slow event processing (>5s)
- Webhook processing failures

## Deployment

### Environment Variables
```env
# Backend URL for tracking links
BACKEND_URL=https://api.yourdomain.com

# Redis for caching
REDIS_URL=redis://localhost:6379

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# SendGrid
SENDGRID_API_KEY=your_api_key
SENDGRID_WEBHOOK_KEY=your_webhook_key
```

### Production Checklist
- [ ] Configure webhook endpoints
- [ ] Set up database indexes
- [ ] Configure Redis caching
- [ ] Enable WebSocket for real-time updates
- [ ] Set up monitoring and alerts
- [ ] Configure data retention policies
- [ ] Test geographic service with production IPs
- [ ] Verify tracking pixel loads correctly
- [ ] Test link redirects work properly
- [ ] Load test with 10,000+ events

## Future Enhancements

### Phase 2
- Machine learning for send time optimization
- Predictive churn modeling
- Advanced A/B testing framework
- Multi-variate testing
- Revenue attribution
- Conversion tracking

### Phase 3
- AI-powered content optimization
- Sentiment analysis on replies
- Engagement score prediction
- Automated campaign optimization
- Advanced segmentation engine

## Support & Documentation

For questions or issues:
- **Email**: dev-team@roisystems.com
- **Slack**: #email-analytics
- **Wiki**: https://wiki.roisystems.com/email-analytics

## License

Proprietary - ROI Systems © 2025
