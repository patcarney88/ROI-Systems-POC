/**
 * Campaign API Integration Tests
 * Team Foxtrot: Quality Assurance
 */

import request from 'supertest';
import app from '../../index';
import { Campaign } from '../../models/Campaign';
import { User } from '../../models/User';
import sequelize from '../../config/database';

describe('Campaign API', () => {
  let authToken: string;
  let userId: string;
  let campaignId: string;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const user = await User.create({
      email: 'test@example.com',
      password: 'hashedpassword123',
      firstName: 'Test',
      lastName: 'User',
      role: 'agent'
    });
    userId = user.id;
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/v1/campaigns', () => {
    it('should create a new campaign', async () => {
      const campaignData = {
        name: 'Summer Newsletter',
        subject: 'Check out our summer deals!',
        template: 'newsletter',
        recipients: ['client1@example.com', 'client2@example.com'],
        schedule: 'scheduled',
        scheduleDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        message: 'Hello clients!'
      };

      const response = await request(app)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(campaignData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.campaign).toMatchObject({
        name: campaignData.name,
        subject: campaignData.subject,
        status: 'scheduled'
      });

      campaignId = response.body.data.campaign.id;
    });

    it('should require scheduleDate for scheduled campaigns', async () => {
      const campaignData = {
        name: 'Test Campaign',
        subject: 'Test',
        template: 'basic',
        recipients: ['test@example.com'],
        schedule: 'scheduled'
        // Missing scheduleDate
      };

      const response = await request(app)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(campaignData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/campaigns', () => {
    it('should get all campaigns with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.campaigns).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter campaigns by status', async () => {
      const response = await request(app)
        .get('/api/v1/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'scheduled' })
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.campaigns.forEach((campaign: any) => {
        expect(campaign.status).toBe('scheduled');
      });
    });
  });

  describe('GET /api/v1/campaigns/:id', () => {
    it('should get a single campaign', async () => {
      const response = await request(app)
        .get(`/api/v1/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.campaign.id).toBe(campaignId);
    });
  });

  describe('PUT /api/v1/campaigns/:id', () => {
    it('should update a campaign', async () => {
      const updateData = {
        name: 'Updated Campaign Name',
        subject: 'Updated Subject'
      };

      const response = await request(app)
        .put(`/api/v1/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.campaign.name).toBe(updateData.name);
    });

    it('should not allow editing sent campaigns', async () => {
      // First send the campaign
      await request(app)
        .post(`/api/v1/campaigns/${campaignId}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to update
      const response = await request(app)
        .put(`/api/v1/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Should Fail' })
        .expect(400);

      expect(response.body.error.code).toBe('CAMPAIGN_ALREADY_SENT');
    });
  });

  describe('POST /api/v1/campaigns/:id/send', () => {
    it('should send a campaign', async () => {
      // Create a new campaign for sending
      const campaign = await Campaign.create({
        userId,
        name: 'Test Send',
        subject: 'Test',
        template: 'basic',
        recipients: ['test@example.com'],
        schedule: 'now',
        status: 'draft'
      });

      const response = await request(app)
        .post(`/api/v1/campaigns/${campaign.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.campaign.status).toBe('sent');
      expect(response.body.data.campaign.sentAt).toBeDefined();
    });
  });

  describe('GET /api/v1/campaigns/:id/stats', () => {
    it('should get campaign statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/campaigns/${campaignId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toHaveProperty('sent');
      expect(response.body.data.stats).toHaveProperty('openRate');
      expect(response.body.data.stats).toHaveProperty('clickRate');
    });
  });

  describe('GET /api/v1/campaigns/stats', () => {
    it('should get aggregate campaign statistics', async () => {
      const response = await request(app)
        .get('/api/v1/campaigns/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('byStatus');
      expect(response.body.data).toHaveProperty('aggregateStats');
    });
  });

  describe('DELETE /api/v1/campaigns/:id', () => {
    it('should delete a draft campaign', async () => {
      const campaign = await Campaign.create({
        userId,
        name: 'To Delete',
        subject: 'Test',
        template: 'basic',
        recipients: [],
        schedule: 'now',
        status: 'draft'
      });

      const response = await request(app)
        .delete(`/api/v1/campaigns/${campaign.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify status changed to cancelled
      const deleted = await Campaign.findByPk(campaign.id);
      expect(deleted?.status).toBe('cancelled');
    });
  });
});
