/**
 * Client API Integration Tests
 * Team Foxtrot: Quality Assurance
 */

import request from 'supertest';
import app from '../../index';
import { Client } from '../../models/Client';
import { User } from '../../models/User';
import sequelize from '../../config/database';

describe('Client API', () => {
  let authToken: string;
  let userId: string;
  let clientId: string;

  beforeAll(async () => {
    // Connect to test database
    await sequelize.sync({ force: true });

    // Create test user
    const user = await User.create({
      email: 'test@example.com',
      password: 'hashedpassword123',
      firstName: 'Test',
      lastName: 'User',
      role: 'agent'
    });
    userId = user.id;

    // Mock authentication (in real tests, use actual login)
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/v1/clients', () => {
    it('should create a new client', async () => {
      const clientData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0100',
        propertyCount: 2,
        status: 'active',
        notes: 'Test client'
      };

      const response = await request(app)
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.client).toMatchObject({
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone
      });

      clientId = response.body.data.client.id;
    });

    it('should return 409 for duplicate email', async () => {
      const clientData = {
        name: 'Jane Doe',
        email: 'john@example.com', // Duplicate
        phone: '555-0101'
      };

      const response = await request(app)
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clientData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CLIENT_EXISTS');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/clients')
        .send({ name: 'Test', email: 'test@test.com' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/clients', () => {
    it('should get all clients with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.clients).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toHaveProperty('page');
      expect(response.body.data.pagination).toHaveProperty('total');
    });

    it('should filter clients by status', async () => {
      const response = await request(app)
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'active' })
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.clients.forEach((client: any) => {
        expect(client.status).toBe('active');
      });
    });

    it('should search clients by name', async () => {
      const response = await request(app)
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'John' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.clients.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/clients/:id', () => {
    it('should get a single client by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/clients/${clientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.client.id).toBe(clientId);
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .get('/api/v1/clients/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CLIENT_NOT_FOUND');
    });
  });

  describe('PUT /api/v1/clients/:id', () => {
    it('should update a client', async () => {
      const updateData = {
        name: 'John Updated',
        engagementScore: 75
      };

      const response = await request(app)
        .put(`/api/v1/clients/${clientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.client.name).toBe(updateData.name);
      expect(response.body.data.client.engagementScore).toBe(updateData.engagementScore);
    });
  });

  describe('GET /api/v1/clients/stats', () => {
    it('should get client statistics', async () => {
      const response = await request(app)
        .get('/api/v1/clients/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toHaveProperty('total');
      expect(response.body.data.stats).toHaveProperty('byStatus');
      expect(response.body.data.stats).toHaveProperty('averageEngagementScore');
    });
  });

  describe('DELETE /api/v1/clients/:id', () => {
    it('should soft delete a client', async () => {
      const response = await request(app)
        .delete(`/api/v1/clients/${clientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify client is marked as dormant
      const client = await Client.findByPk(clientId);
      expect(client?.status).toBe('dormant');
    });
  });
});
