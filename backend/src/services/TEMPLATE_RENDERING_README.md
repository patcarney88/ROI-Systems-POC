# Template Rendering Service

High-performance email template rendering service that converts React Email templates to HTML for SendGrid delivery.

## Features

- **Template Registry**: Centralized management of email templates
- **React Email Integration**: Seamless conversion of React components to HTML
- **Merge Tag Support**: Dynamic personalization using subscriber data
- **High-Performance Caching**: Redis-based caching with 1-hour TTL
- **Batch Processing**: Efficient rendering for campaigns (10,000+ emails/hour)
- **Plain Text Generation**: Automatic HTML-to-text conversion
- **Preview Mode**: Test templates with sample data
- **Graceful Fallbacks**: Automatic error recovery with fallback templates

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Template Rendering Service                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Template   │  │   React      │  │  Personalization│  │
│  │   Registry   │─▶│   Email      │─▶│     Engine      │  │
│  └──────────────┘  │   Renderer   │  └─────────────────┘  │
│                    └──────────────┘           │            │
│                           │                   │            │
│                           ▼                   ▼            │
│                    ┌──────────────┐  ┌─────────────────┐  │
│                    │    Redis     │  │   HTML → Text   │  │
│                    │    Cache     │  │   Converter     │  │
│                    └──────────────┘  └─────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   SendGrid   │
                    │   Delivery   │
                    └──────────────┘
```

## Performance Metrics

- **Single Email Render**: <100ms (target)
- **Batch Processing**: 10,000+ emails/hour
- **Cache Hit Rate**: >90% (typical)
- **Memory Footprint**: <50MB per 1,000 emails
- **Cache TTL**: 1 hour (configurable)

## API Reference

### Core Methods

#### `renderTemplate(options: TemplateRenderOptions): Promise<RenderedTemplate>`

Render a single personalized email template.

```typescript
const rendered = await templateRenderingService.renderTemplate({
  templateId: 'welcome-email',
  campaignType: 'WELCOME',
  subscriberId: 'subscriber-uuid',
  customData: { specialOffer: '20% off' },
  preview: false,
});
```

**Parameters:**
- `templateId` (string): Template identifier
- `campaignType` (string): Campaign type (alternative to templateId)
- `subscriberId` (string): Subscriber UUID
- `customData` (optional): Additional merge tag data
- `preview` (optional): Skip caching for preview mode

**Returns:**
```typescript
{
  html: string;      // Rendered HTML
  text: string;      // Plain text version
  subject: string;   // Personalized subject line
  previewText?: string; // Email preview text
}
```

#### `renderBatch(subscribers: string[], templateId: string): Promise<Map<string, RenderedTemplate>>`

Batch render emails for multiple subscribers with controlled concurrency.

```typescript
const subscriberIds = ['sub-1', 'sub-2', 'sub-3'];
const rendered = await templateRenderingService.renderBatch(
  subscriberIds,
  'home-value-update'
);

// Process results
for (const [subscriberId, email] of rendered.entries()) {
  await sendEmail(subscriberId, email);
}
```

**Parameters:**
- `subscribers` (string[]): Array of subscriber UUIDs
- `templateId` (string): Template identifier

**Returns:** Map of subscriber ID → rendered template

**Performance:** Processes in chunks of 10 for optimal concurrency.

#### `previewTemplate(templateId: string, previewData?: MergeTagData): Promise<RenderedTemplate>`

Generate preview with sample data for testing.

```typescript
// With default sample data
const preview = await templateRenderingService.previewTemplate('welcome-email');

// With custom data
const customPreview = await templateRenderingService.previewTemplate('welcome-email', {
  subscriber: { firstName: 'John', lastName: 'Doe' },
  company: { name: 'Acme Realty' }
});
```

#### `registerTemplate(metadata: TemplateMetadata): void`

Register a new template in the registry.

```typescript
templateRenderingService.registerTemplate({
  id: 'welcome-email',
  name: 'Welcome Email',
  campaignType: 'WELCOME',
  subject: 'Welcome to {{company.name}}, {{subscriber.firstName}}!',
  previewText: 'Thank you for joining',
  component: WelcomeEmailTemplate,
});
```

### Cache Management

#### `updateTemplateCache(templateId: string): Promise<void>`

Invalidate cached renders for a template after updates.

```typescript
await templateRenderingService.updateTemplateCache('welcome-email');
```

#### `getStatistics(): Promise<Statistics>`

Get rendering and cache statistics.

```typescript
const stats = await templateRenderingService.getStatistics();
console.log(`Templates: ${stats.registeredTemplates}`);
console.log(`Cache size: ${stats.cacheSize}`);
console.log(`Cache type: ${stats.cacheType}`);
```

#### `getAvailableTemplates(): string[]`

List all registered template IDs.

```typescript
const templates = templateRenderingService.getAvailableTemplates();
// ['welcome-email', 'home-value-update', ...]
```

## Template Development

### Creating React Email Templates

Templates are React components that accept merge data as props:

```typescript
import { Html, Head, Body, Container, Heading, Text } from '@react-email/components';

export const WelcomeEmail = (props: any) => {
  const { subscriber, company } = props;

  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Heading>Welcome {subscriber?.firstName}!</Heading>
          <Text>
            Thank you for joining {company?.name}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
```

### Template Registration

Register templates on application startup:

```typescript
// templates/index.ts
import { WelcomeEmail } from './welcome-email';
import { HomeValueUpdate } from './home-value-update';
import { templateRenderingService } from '../services/template-rendering.service';

export function registerAllTemplates() {
  templateRenderingService.registerTemplate({
    id: 'welcome-email',
    name: 'Welcome Email',
    campaignType: 'WELCOME',
    subject: 'Welcome to {{company.name}}!',
    previewText: 'Thank you for joining our community',
    component: WelcomeEmail,
  });

  templateRenderingService.registerTemplate({
    id: 'home-value-update',
    name: 'Home Value Update',
    campaignType: 'HOME_VALUE_UPDATE',
    subject: 'Your home has {{property.valueDirection}} by {{property.valueChangePercent}}!',
    previewText: 'See your latest property value estimate',
    component: HomeValueUpdate,
  });
}
```

## Merge Tag System

### Available Merge Tags

Templates have access to comprehensive merge tag data:

**Subscriber Data:**
- `{{subscriber.firstName}}`
- `{{subscriber.lastName}}`
- `{{subscriber.fullName}}`
- `{{subscriber.email}}`
- `{{subscriber.phone}}`

**Client/Property Data:**
- `{{client.propertyAddress}}`
- `{{client.closingDate}}`
- `{{client.purchasePrice}}`
- `{{property.currentValue}}`
- `{{property.valueChange}}`
- `{{property.valueChangePercent}}`
- `{{property.valueDirection}}` (increased/decreased)

**Agent Data:**
- `{{agent.name}}`
- `{{agent.email}}`
- `{{agent.phone}}`
- `{{agent.title}}`

**Company Data:**
- `{{company.name}}`
- `{{company.logo}}`
- `{{company.website}}`
- `{{company.phone}}`

**Neighborhood Data:**
- `{{neighborhood.name}}`
- `{{neighborhood.medianPrice}}`
- `{{neighborhood.averageDaysOnMarket}}`

**Date Helpers:**
- `{{today}}` - Current date
- `{{year}}` - Current year
- `{{month}}` - Current month

**Custom Data:**
- `{{custom.anyKey}}` - Any custom data passed in

### Using Merge Tags in Templates

```typescript
// In React Email component props
<Text>
  Hi {subscriber?.firstName}, your home at {client?.propertyAddress}
  has {property?.valueDirection} by {property?.valueChangePercent}!
</Text>

// In template subject line (registered with metadata)
subject: 'Hi {{subscriber.firstName}}, your home value update is here!'

// In preview text
previewText: 'Your home has {{property.valueDirection}} by {{property.valueChangePercent}}'
```

## Caching Strategy

### Redis-Based Caching

- **Cache Key Format**: `template:rendered:{templateId}:{subscriberId}`
- **TTL**: 1 hour (3600 seconds)
- **Cache on**: All non-preview renders
- **Cache invalidation**: Manual via `updateTemplateCache()`

### In-Memory Fallback

When Redis is unavailable:
- Falls back to in-memory Map cache
- LRU eviction when size >1,000 entries
- No TTL (cleared on restart)

### Cache Benefits

- **Cold cache**: ~80-150ms render time
- **Warm cache**: <5ms render time
- **Cache hit rate**: >90% for typical campaigns
- **Memory efficient**: ~2KB per cached email

## Error Handling

### Automatic Fallback

Service provides graceful degradation:

1. **Template Not Found**: Uses fallback template with minimal personalization
2. **Rendering Errors**: Returns basic HTML template with contact info
3. **Cache Errors**: Continues without caching (non-fatal)
4. **Merge Tag Errors**: Replaces with empty string

### Error Recovery Example

```typescript
try {
  const rendered = await templateRenderingService.renderTemplate({
    templateId: 'non-existent-template',
    campaignType: 'UNKNOWN',
    subscriberId: 'subscriber-uuid',
  });

  // Service automatically provides fallback
  console.log('Using fallback template');
} catch (error) {
  // Even fallback failed - log and alert
  console.error('Critical rendering failure:', error);
}
```

## Integration Examples

### SendGrid Integration

```typescript
import sgMail from '@sendgrid/mail';
import { templateRenderingService } from './services/template-rendering.service';

async function sendCampaignEmail(subscriberId: string, templateId: string) {
  // Render template
  const rendered = await templateRenderingService.renderTemplate({
    templateId,
    campaignType: '',
    subscriberId,
  });

  // Get subscriber email
  const subscriber = await db.emailSubscriber.findUnique({
    where: { id: subscriberId },
  });

  // Send via SendGrid
  await sgMail.send({
    to: subscriber.email,
    from: 'noreply@example.com',
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });
}
```

### Campaign Queue Integration

```typescript
import { emailQueue } from './queues/email.queue';
import { templateRenderingService } from './services/template-rendering.service';

async function queueCampaign(campaignId: string, subscriberIds: string[]) {
  // Batch render all emails
  const rendered = await templateRenderingService.renderBatch(
    subscriberIds,
    'home-value-update'
  );

  // Queue each email
  for (const [subscriberId, email] of rendered.entries()) {
    await emailQueue.add('send-email', {
      campaignId,
      subscriberId,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  }
}
```

## Testing

### Unit Tests

```typescript
import { templateRenderingService } from './template-rendering.service';

describe('TemplateRenderingService', () => {
  it('should render template with personalization', async () => {
    const rendered = await templateRenderingService.renderTemplate({
      templateId: 'welcome-email',
      campaignType: 'WELCOME',
      subscriberId: 'test-subscriber',
    });

    expect(rendered.html).toContain('Welcome');
    expect(rendered.subject).toBeTruthy();
    expect(rendered.text).toBeTruthy();
  });

  it('should cache rendered templates', async () => {
    const options = {
      templateId: 'welcome-email',
      campaignType: 'WELCOME',
      subscriberId: 'test-subscriber',
    };

    // First render (cold cache)
    const start1 = Date.now();
    await templateRenderingService.renderTemplate(options);
    const time1 = Date.now() - start1;

    // Second render (warm cache)
    const start2 = Date.now();
    await templateRenderingService.renderTemplate(options);
    const time2 = Date.now() - start2;

    expect(time2).toBeLessThan(time1);
    expect(time2).toBeLessThan(10); // Should be <10ms from cache
  });
});
```

## Monitoring & Observability

### Key Metrics to Track

```typescript
// Rendering performance
const renderTime = Date.now() - startTime;
logger.info(`Template rendered in ${renderTime}ms`);

// Cache effectiveness
const stats = await templateRenderingService.getStatistics();
logger.info(`Cache size: ${stats.cacheSize}, Type: ${stats.cacheType}`);

// Batch performance
const avgTime = totalTime / subscribers.length;
logger.info(`Batch avg: ${avgTime.toFixed(2)}ms/email`);
```

### Performance Alerts

Set up alerts for:
- Render time >100ms (p95)
- Cache hit rate <80%
- Batch processing >360ms/email avg
- Memory usage >500MB

## Best Practices

1. **Template Registration**: Register all templates on app startup
2. **Cache Invalidation**: Invalidate cache after template updates
3. **Batch Processing**: Use batch rendering for campaigns >10 subscribers
4. **Preview Mode**: Always test templates in preview mode first
5. **Error Handling**: Monitor fallback template usage rates
6. **Performance Testing**: Benchmark templates before production use
7. **Merge Tags**: Validate merge tags during template development
8. **Plain Text**: Always generate plain text versions for deliverability

## Troubleshooting

### Template Not Found

```
Error: Template not found: welcome-email
```

**Solution**: Ensure template is registered before rendering:
```typescript
templateRenderingService.registerTemplate({ ... });
```

### Slow Rendering

**Symptoms**: Render times >100ms consistently

**Solutions**:
1. Check Redis connection: `redis.ping()`
2. Enable caching if disabled
3. Reduce template complexity
4. Use batch rendering for multiple emails

### Cache Not Working

**Check:**
```typescript
const stats = await templateRenderingService.getStatistics();
console.log('Cache type:', stats.cacheType);
// Should be 'redis', not 'memory'
```

**Solution**: Verify Redis connection in logs

### Memory Issues

**Symptoms**: High memory usage during batch processing

**Solutions**:
1. Reduce batch concurrency (default: 10)
2. Clear cache periodically
3. Use streaming for very large batches

## Future Enhancements

- [ ] Template versioning support
- [ ] A/B testing framework
- [ ] Multi-language template support
- [ ] Template analytics integration
- [ ] Visual template editor
- [ ] Advanced merge tag expressions
- [ ] Template inheritance/composition

## Support

For issues or questions:
- Check logs: `logger.createLogger('template-rendering')`
- Review examples: `template-rendering.example.ts`
- Performance benchmarks: Run `performanceBenchmark()`
