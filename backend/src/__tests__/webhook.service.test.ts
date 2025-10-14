/**
 * Webhook Service Tests
 * Tests for SendGrid webhook event processing
 */

import { WebhookService } from '../services/webhook.service';
import { db } from '../config/database';
import { redis } from '../config/redis';

// Mock dependencies
jest.mock('../config/database');
jest.mock('../config/redis');
jest.mock('../utils/logger');

describe('WebhookService', () => {
  let webhookService: WebhookService;

  beforeEach(() => {
    webhookService = new WebhookService();
    jest.clearAllMocks();
  });

  describe('processEvent', () => {
    it('should process delivered event', async () => {
      const event = {
        event: 'delivered',
        email: 'test@example.com',
        timestamp: Math.floor(Date.now() / 1000),
        sg_message_id: 'msg-123',
        subscriberId: 'sub-123',
        campaignId: 'campaign-123',
      };

      (db.emailSubscriber.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-123',
      });

      (db.emailEvent.create as jest.Mock).mockResolvedValue({});
      (db.emailQueue.updateMany as jest.Mock).mockResolvedValue({});
      (db.emailCampaign.update as jest.Mock).mockResolvedValue({});

      await webhookService.processEvent(event);

      expect(db.emailEvent.create).toHaveBeenCalled();
      expect(db.emailCampaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deliveredCount: { increment: 1 },
          }),
        })
      );
    });

    it('should process open event and update engagement', async () => {
      const event = {
        event: 'open',
        email: 'test@example.com',
        timestamp: Math.floor(Date.now() / 1000),
        sg_message_id: 'msg-123',
        subscriberId: 'sub-123',
        campaignId: 'campaign-123',
      };

      (redis.get as jest.Mock).mockResolvedValue(null);
      (redis.setex as jest.Mock).mockResolvedValue('OK');
      (db.emailSubscriber.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-123',
      });
      (db.emailEvent.create as jest.Mock).mockResolvedValue({});
      (db.emailCampaign.update as jest.Mock).mockResolvedValue({});
      (db.emailSubscriber.update as jest.Mock).mockResolvedValue({});
      (db.emailEngagement.upsert as jest.Mock).mockResolvedValue({
        id: 'engagement-123',
        engagementScore: 55,
      });

      await webhookService.processEvent(event);

      expect(db.emailEvent.create).toHaveBeenCalled();
      expect(db.emailCampaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            openCount: { increment: 1 },
            uniqueOpenCount: { increment: 1 },
          }),
        })
      );
      expect(db.emailEngagement.upsert).toHaveBeenCalled();
    });

    it('should process click event and track URL', async () => {
      const event = {
        event: 'click',
        email: 'test@example.com',
        timestamp: Math.floor(Date.now() / 1000),
        sg_message_id: 'msg-123',
        subscriberId: 'sub-123',
        campaignId: 'campaign-123',
        url: 'https://example.com',
      };

      (redis.get as jest.Mock).mockResolvedValue(null);
      (redis.setex as jest.Mock).mockResolvedValue('OK');
      (db.emailSubscriber.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-123',
      });
      (db.emailEvent.create as jest.Mock).mockResolvedValue({});
      (db.emailCampaign.update as jest.Mock).mockResolvedValue({});
      (db.emailEngagement.upsert as jest.Mock).mockResolvedValue({
        id: 'engagement-123',
        engagementScore: 60,
      });

      await webhookService.processEvent(event);

      expect(db.emailEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            linkUrl: 'https://example.com',
          }),
        })
      );
      expect(db.emailCampaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clickCount: { increment: 1 },
          }),
        })
      );
    });

    it('should process bounce event and add to suppression list for hard bounces', async () => {
      const event = {
        event: 'bounce',
        email: 'test@example.com',
        timestamp: Math.floor(Date.now() / 1000),
        sg_message_id: 'msg-123',
        subscriberId: 'sub-123',
        campaignId: 'campaign-123',
        bounce_classification: 'hard',
        reason: 'Invalid email address',
      };

      (db.emailSubscriber.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-123',
      });
      (db.emailEvent.create as jest.Mock).mockResolvedValue({});
      (db.emailQueue.updateMany as jest.Mock).mockResolvedValue({});
      (db.emailCampaign.update as jest.Mock).mockResolvedValue({});
      (db.emailSubscriber.update as jest.Mock).mockResolvedValue({});
      (db.suppressionList.upsert as jest.Mock).mockResolvedValue({});

      await webhookService.processEvent(event);

      expect(db.emailSubscriber.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'BOUNCED',
          }),
        })
      );
      expect(db.suppressionList.upsert).toHaveBeenCalled();
    });

    it('should process unsubscribe event', async () => {
      const event = {
        event: 'unsubscribe',
        email: 'test@example.com',
        timestamp: Math.floor(Date.now() / 1000),
        sg_message_id: 'msg-123',
        subscriberId: 'sub-123',
        campaignId: 'campaign-123',
      };

      (db.emailSubscriber.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-123',
      });
      (db.emailEvent.create as jest.Mock).mockResolvedValue({});
      (db.emailCampaign.update as jest.Mock).mockResolvedValue({});
      (db.emailSubscriber.update as jest.Mock).mockResolvedValue({});
      (db.unsubscribeRecord.create as jest.Mock).mockResolvedValue({});
      (db.emailEngagement.upsert as jest.Mock).mockResolvedValue({
        id: 'engagement-123',
        engagementScore: 0,
      });

      await webhookService.processEvent(event);

      expect(db.emailSubscriber.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'UNSUBSCRIBED',
          }),
        })
      );
      expect(db.unsubscribeRecord.create).toHaveBeenCalled();
    });

    it('should process spam report and add to suppression list', async () => {
      const event = {
        event: 'spamreport',
        email: 'test@example.com',
        timestamp: Math.floor(Date.now() / 1000),
        sg_message_id: 'msg-123',
        subscriberId: 'sub-123',
        campaignId: 'campaign-123',
      };

      (db.emailSubscriber.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-123',
      });
      (db.emailEvent.create as jest.Mock).mockResolvedValue({});
      (db.emailCampaign.update as jest.Mock).mockResolvedValue({});
      (db.emailSubscriber.update as jest.Mock).mockResolvedValue({});
      (db.suppressionList.upsert as jest.Mock).mockResolvedValue({});
      (db.emailEngagement.upsert as jest.Mock).mockResolvedValue({
        id: 'engagement-123',
        engagementScore: 0,
      });

      await webhookService.processEvent(event);

      expect(db.emailSubscriber.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLAINED',
          }),
        })
      );
      expect(db.suppressionList.upsert).toHaveBeenCalled();
    });
  });

  describe('recordOpen', () => {
    it('should record open event and update stats', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (redis.setex as jest.Mock).mockResolvedValue('OK');
      (db.emailEvent.create as jest.Mock).mockResolvedValue({});
      (db.emailCampaign.update as jest.Mock).mockResolvedValue({});
      (db.emailEngagement.upsert as jest.Mock).mockResolvedValue({
        id: 'engagement-123',
        engagementScore: 55,
      });

      await webhookService.recordOpen('sub-123', 'campaign-123', 'msg-123');

      expect(db.emailEvent.create).toHaveBeenCalled();
      expect(db.emailCampaign.update).toHaveBeenCalled();
    });

    it('should detect duplicate opens', async () => {
      (redis.get as jest.Mock).mockResolvedValue('1');
      (db.emailEvent.create as jest.Mock).mockResolvedValue({});
      (db.emailCampaign.update as jest.Mock).mockResolvedValue({});
      (db.emailEngagement.upsert as jest.Mock).mockResolvedValue({
        id: 'engagement-123',
        engagementScore: 55,
      });

      await webhookService.recordOpen('sub-123', 'campaign-123', 'msg-123');

      expect(db.emailCampaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            uniqueOpenCount: expect.anything(),
          }),
        })
      );
    });
  });

  describe('recordClick', () => {
    it('should record click event with URL', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (redis.setex as jest.Mock).mockResolvedValue('OK');
      (db.emailEvent.create as jest.Mock).mockResolvedValue({});
      (db.emailCampaign.update as jest.Mock).mockResolvedValue({});
      (db.emailEngagement.upsert as jest.Mock).mockResolvedValue({
        id: 'engagement-123',
        engagementScore: 60,
      });

      await webhookService.recordClick(
        'sub-123',
        'campaign-123',
        'msg-123',
        'https://example.com'
      );

      expect(db.emailEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            linkUrl: 'https://example.com',
          }),
        })
      );
    });
  });

  describe('updateEngagementScore', () => {
    it('should increase score for opens', async () => {
      (db.emailEngagement.upsert as jest.Mock).mockResolvedValue({
        id: 'engagement-123',
        engagementScore: 55,
      });
      (redis.del as jest.Mock).mockResolvedValue(1);

      await webhookService.updateEngagementScore('sub-123', 'open');

      expect(db.emailEngagement.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            engagementScore: { increment: 5 },
          }),
        })
      );
    });

    it('should increase score more for clicks', async () => {
      (db.emailEngagement.upsert as jest.Mock).mockResolvedValue({
        id: 'engagement-123',
        engagementScore: 60,
      });
      (redis.del as jest.Mock).mockResolvedValue(1);

      await webhookService.updateEngagementScore('sub-123', 'click');

      expect(db.emailEngagement.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            engagementScore: { increment: 10 },
          }),
        })
      );
    });

    it('should decrease score for unsubscribes', async () => {
      (db.emailEngagement.upsert as jest.Mock).mockResolvedValue({
        id: 'engagement-123',
        engagementScore: 0,
      });
      (redis.del as jest.Mock).mockResolvedValue(1);

      await webhookService.updateEngagementScore('sub-123', 'unsubscribe');

      expect(db.emailEngagement.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            engagementScore: { increment: -50 },
          }),
        })
      );
    });

    it('should set score to 0 for spam reports', async () => {
      (db.emailEngagement.upsert as jest.Mock).mockResolvedValue({
        id: 'engagement-123',
        engagementScore: 0,
      });
      (db.emailEngagement.update as jest.Mock).mockResolvedValue({});
      (redis.del as jest.Mock).mockResolvedValue(1);

      await webhookService.updateEngagementScore('sub-123', 'spam');

      expect(db.emailEngagement.upsert).toHaveBeenCalled();
    });

    it('should cap engagement score at 100', async () => {
      (db.emailEngagement.upsert as jest.Mock).mockResolvedValue({
        id: 'engagement-123',
        engagementScore: 105,
      });
      (db.emailEngagement.update as jest.Mock).mockResolvedValue({});
      (redis.del as jest.Mock).mockResolvedValue(1);

      await webhookService.updateEngagementScore('sub-123', 'click');

      expect(db.emailEngagement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { engagementScore: 100 },
        })
      );
    });
  });
});
