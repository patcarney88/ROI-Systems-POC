/**
 * Template Rendering Service - Usage Examples
 *
 * This file demonstrates how to use the Template Rendering Service
 * to convert React Email templates to HTML for SendGrid delivery.
 */

import { templateRenderingService } from './template-rendering.service';
import type { ReactElement } from 'react';

/**
 * EXAMPLE 1: Creating and Registering a Simple React Email Template
 *
 * Templates should be React components that accept merge data as props.
 * They can be created in a separate file and imported here.
 */

// Example template component (would normally be in a separate file)
const WelcomeEmailTemplate = (props: any): ReactElement => {
  const { subscriber, company } = props;

  // This would normally use @react-email/components
  // For this example, we're showing the structure
  return {
    type: 'html',
    props: {
      children: [
        {
          type: 'body',
          props: {
            children: `
              <h1>Welcome ${subscriber?.firstName}!</h1>
              <p>Thank you for joining ${company?.name}.</p>
            `,
          },
        },
      ],
    },
  } as ReactElement;
};

/**
 * EXAMPLE 2: Registering a Template
 *
 * Before rendering, templates must be registered with metadata.
 */
export function registerExampleTemplates(): void {
  // Register the welcome email template
  templateRenderingService.registerTemplate({
    id: 'welcome-email',
    name: 'Welcome Email',
    campaignType: 'WELCOME',
    subject: 'Welcome to {{company.name}}, {{subscriber.firstName}}!',
    previewText: 'Thank you for joining our community',
    component: WelcomeEmailTemplate,
  });

  // Register a home value update template
  // (Component would be defined elsewhere)
  /*
  templateRenderingService.registerTemplate({
    id: 'home-value-update',
    name: 'Home Value Update',
    campaignType: 'HOME_VALUE_UPDATE',
    subject: 'Your home at {{client.propertyAddress}} has {{property.valueDirection}}!',
    previewText: 'See how much your property value has changed',
    component: HomeValueUpdateTemplate,
  });
  */
}

/**
 * EXAMPLE 3: Rendering a Single Email
 *
 * Render a personalized email for a specific subscriber.
 */
export async function renderSingleEmailExample(): Promise<void> {
  try {
    const rendered = await templateRenderingService.renderTemplate({
      templateId: 'welcome-email',
      campaignType: 'WELCOME', // Can use either templateId or campaignType
      subscriberId: 'subscriber-uuid-here',
      customData: {
        specialOffer: '20% off',
      },
      preview: false,
    });

    console.log('Rendered Email:');
    console.log('Subject:', rendered.subject);
    console.log('Preview Text:', rendered.previewText);
    console.log('HTML Length:', rendered.html.length);
    console.log('Plain Text Length:', rendered.text.length);

    // Use with SendGrid
    /*
    await sgMail.send({
      to: 'subscriber@example.com',
      from: 'noreply@example.com',
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
    */
  } catch (error) {
    console.error('Failed to render email:', error);
  }
}

/**
 * EXAMPLE 4: Batch Rendering for Campaign
 *
 * Efficiently render emails for multiple subscribers.
 * Ideal for sending campaigns to large lists.
 */
export async function renderBatchEmailsExample(): Promise<void> {
  try {
    const subscriberIds = [
      'subscriber-1-uuid',
      'subscriber-2-uuid',
      'subscriber-3-uuid',
      // ... up to thousands
    ];

    console.log(`Starting batch render for ${subscriberIds.length} subscribers...`);

    const batchResults = await templateRenderingService.renderBatch(
      subscriberIds,
      'home-value-update'
    );

    console.log(`Successfully rendered ${batchResults.size} emails`);

    // Process each rendered email
    for (const [subscriberId, rendered] of batchResults.entries()) {
      // Queue for sending via SendGrid
      console.log(`Queued email for subscriber: ${subscriberId}`);

      /*
      await emailQueue.add('send-email', {
        subscriberId,
        to: rendered.to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });
      */
    }
  } catch (error) {
    console.error('Batch render failed:', error);
  }
}

/**
 * EXAMPLE 5: Generating Email Previews
 *
 * Preview templates with sample data for testing/design.
 */
export async function previewTemplateExample(): Promise<void> {
  try {
    // Preview with default sample data
    const defaultPreview = await templateRenderingService.previewTemplate('welcome-email');

    console.log('Default Preview:');
    console.log('Subject:', defaultPreview.subject);
    console.log('HTML:', defaultPreview.html.substring(0, 200) + '...');

    // Preview with custom data
    const customPreview = await templateRenderingService.previewTemplate('welcome-email', {
      subscriber: {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
      },
      company: {
        name: 'Acme Real Estate',
        logo: 'https://example.com/logo.png',
        website: 'https://acme-realestate.com',
        phone: '(555) 123-4567',
        address: '123 Business St',
      },
    });

    console.log('\nCustom Preview:');
    console.log('Subject:', customPreview.subject);

    // Save preview HTML to file for inspection
    /*
    import { writeFileSync } from 'fs';
    writeFileSync('./preview.html', customPreview.html);
    console.log('Preview saved to preview.html');
    */
  } catch (error) {
    console.error('Preview generation failed:', error);
  }
}

/**
 * EXAMPLE 6: Cache Management
 *
 * Manage template cache for performance optimization.
 */
export async function cacheManagementExample(): Promise<void> {
  try {
    // Get cache statistics
    const stats = await templateRenderingService.getStatistics();
    console.log('Cache Statistics:');
    console.log('- Registered Templates:', stats.registeredTemplates);
    console.log('- Cached Renders:', stats.cacheSize);
    console.log('- Cache Type:', stats.cacheType);

    // Invalidate cache after template update
    await templateRenderingService.updateTemplateCache('welcome-email');
    console.log('Cache invalidated for template: welcome-email');

    // Get available templates
    const templates = templateRenderingService.getAvailableTemplates();
    console.log('Available Templates:', templates);
  } catch (error) {
    console.error('Cache management failed:', error);
  }
}

/**
 * EXAMPLE 7: Integration with Campaign Sending
 *
 * Complete workflow for sending a campaign.
 */
export async function campaignSendingWorkflow(): Promise<void> {
  try {
    // 1. Get campaign details
    const campaignId = 'campaign-uuid';
    const templateId = 'home-value-update';

    // 2. Get target subscribers (would come from database)
    const subscribers = [
      { id: 'sub-1', email: 'user1@example.com' },
      { id: 'sub-2', email: 'user2@example.com' },
      // ...
    ];

    console.log(`Starting campaign ${campaignId} for ${subscribers.length} subscribers...`);

    // 3. Batch render all emails
    const subscriberIds = subscribers.map((s) => s.id);
    const rendered = await templateRenderingService.renderBatch(subscriberIds, templateId);

    // 4. Queue each email for sending
    let successCount = 0;
    let failCount = 0;

    for (const subscriber of subscribers) {
      const email = rendered.get(subscriber.id);

      if (!email) {
        console.error(`No rendered email for subscriber: ${subscriber.id}`);
        failCount++;
        continue;
      }

      try {
        // Queue email for sending
        /*
        await emailQueue.add('send-email', {
          campaignId,
          subscriberId: subscriber.id,
          to: subscriber.email,
          subject: email.subject,
          html: email.html,
          text: email.text,
          previewText: email.previewText,
        });
        */

        successCount++;
      } catch (error) {
        console.error(`Failed to queue email for ${subscriber.id}:`, error);
        failCount++;
      }
    }

    console.log(`Campaign queued: ${successCount} success, ${failCount} failed`);

    // 5. Update campaign status
    /*
    await db.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'QUEUED',
        totalRecipients: subscribers.length,
        queuedAt: new Date(),
      },
    });
    */
  } catch (error) {
    console.error('Campaign workflow failed:', error);
  }
}

/**
 * EXAMPLE 8: Error Handling and Fallback
 *
 * Graceful error handling with fallback templates.
 */
export async function errorHandlingExample(): Promise<void> {
  try {
    // Try to render with invalid template
    const rendered = await templateRenderingService.renderTemplate({
      templateId: 'non-existent-template',
      campaignType: 'UNKNOWN',
      subscriberId: 'subscriber-uuid',
    });

    // Service automatically provides fallback template
    console.log('Fallback template used');
    console.log('Subject:', rendered.subject);
  } catch (error) {
    console.error('Even fallback failed:', error);
  }

  try {
    // Try to render with invalid subscriber
    const rendered = await templateRenderingService.renderTemplate({
      templateId: 'welcome-email',
      campaignType: 'WELCOME',
      subscriberId: 'non-existent-subscriber',
    });

    // Service attempts fallback with minimal personalization
    console.log('Fallback with minimal personalization used');
  } catch (error) {
    console.error('Subscriber lookup failed:', error);
  }
}

/**
 * EXAMPLE 9: Performance Benchmarking
 *
 * Test rendering performance for optimization.
 */
export async function performanceBenchmark(): Promise<void> {
  console.log('Starting performance benchmark...\n');

  // Test 1: Single render performance (cold cache)
  const start1 = Date.now();
  await templateRenderingService.renderTemplate({
    templateId: 'welcome-email',
    campaignType: 'WELCOME',
    subscriberId: 'test-subscriber-1',
  });
  const time1 = Date.now() - start1;
  console.log(`Single render (cold cache): ${time1}ms`);

  // Test 2: Single render performance (warm cache)
  const start2 = Date.now();
  await templateRenderingService.renderTemplate({
    templateId: 'welcome-email',
    campaignType: 'WELCOME',
    subscriberId: 'test-subscriber-1',
  });
  const time2 = Date.now() - start2;
  console.log(`Single render (warm cache): ${time2}ms`);

  // Test 3: Batch render performance
  const testSubscribers = Array.from({ length: 100 }, (_, i) => `test-subscriber-${i}`);
  const start3 = Date.now();
  await templateRenderingService.renderBatch(testSubscribers, 'welcome-email');
  const time3 = Date.now() - start3;
  const avgTime = time3 / testSubscribers.length;
  console.log(`Batch render 100 emails: ${time3}ms (avg: ${avgTime.toFixed(2)}ms/email)`);

  // Test 4: Large batch
  const largeSubscribers = Array.from({ length: 1000 }, (_, i) => `test-subscriber-${i}`);
  const start4 = Date.now();
  await templateRenderingService.renderBatch(largeSubscribers, 'welcome-email');
  const time4 = Date.now() - start4;
  const avgTime4 = time4 / largeSubscribers.length;
  console.log(`Batch render 1000 emails: ${time4}ms (avg: ${avgTime4.toFixed(2)}ms/email)`);

  // Performance targets check
  console.log('\nPerformance Target Validation:');
  console.log(`✓ Sub-100ms render time: ${avgTime < 100 ? 'PASS' : 'FAIL'} (${avgTime.toFixed(2)}ms)`);
  console.log(`✓ 10,000+ emails/hour: ${avgTime4 < 360 ? 'PASS' : 'FAIL'} (capacity: ${Math.floor(3600000 / avgTime4)}/hour)`);
}

// Export all examples for testing
export const examples = {
  registerExampleTemplates,
  renderSingleEmailExample,
  renderBatchEmailsExample,
  previewTemplateExample,
  cacheManagementExample,
  campaignSendingWorkflow,
  errorHandlingExample,
  performanceBenchmark,
};
