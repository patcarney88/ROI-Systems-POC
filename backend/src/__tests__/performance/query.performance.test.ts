import { QueryTypes } from 'sequelize';
import sequelize from '../../config/database';
import { User } from '../../models/User';
import { Client } from '../../models/Client';
import { Document } from '../../models/Document';
import { Campaign } from '../../models/Campaign';

describe('Query Performance Tests', () => {
  let queryCount = 0;
  let testUser: User;
  let testClient: Client;

  beforeAll(async () => {
    // Create test data
    testUser = await User.create({
      email: 'perf-test@example.com',
      password: 'password123',
      firstName: 'Performance',
      lastName: 'Test',
      role: 'agent',
      status: 'active',
    });

    testClient = await Client.create({
      userId: testUser.id,
      name: 'Test Client',
      email: 'client@example.com',
      phone: '555-0100',
      properties: 5,
      engagementScore: 85,
      status: 'active',
    });

    // Create multiple documents for testing
    const documentPromises = Array.from({ length: 20 }, (_, i) =>
      Document.create({
        userId: testUser.id,
        clientId: testClient.id,
        title: `Test Document ${i + 1}`,
        type: 'purchase-agreement',
        status: 'active',
        fileUrl: `/uploads/test-${i + 1}.pdf`,
        size: 1024 * (i + 1),
        uploadDate: new Date(),
        metadata: { test: true },
      })
    );

    await Promise.all(documentPromises);
  });

  afterAll(async () => {
    // Clean up test data
    await Document.destroy({ where: { userId: testUser.id } });
    await Client.destroy({ where: { userId: testUser.id } });
    await User.destroy({ where: { id: testUser.id } });
  });

  beforeEach(() => {
    queryCount = 0;
  });

  /**
   * Track number of queries executed
   */
  const trackQueries = async (fn: () => Promise<any>): Promise<number> => {
    let count = 0;

    const originalQuery = sequelize.query.bind(sequelize);
    sequelize.query = async (...args: any[]) => {
      count++;
      return originalQuery(...args);
    };

    await fn();

    sequelize.query = originalQuery;
    return count;
  };

  /**
   * Measure execution time
   */
  const measureTime = async (fn: () => Promise<any>): Promise<number> => {
    const start = Date.now();
    await fn();
    return Date.now() - start;
  };

  describe('N+1 Query Prevention', () => {
    it('should fetch documents with client and user in a single query (no N+1)', async () => {
      const queryCount = await trackQueries(async () => {
        const documents = await Document.findAll({
          where: { userId: testUser.id },
          include: [
            { model: Client, as: 'client', attributes: ['id', 'name', 'email'] },
            { model: User, as: 'uploader', attributes: ['id', 'email', 'firstName', 'lastName'] },
          ],
          limit: 20,
        });

        // Access associations (should not trigger additional queries)
        documents.forEach((doc: any) => {
          const clientName = doc.client?.name;
          const uploaderEmail = doc.uploader?.email;
        });
      });

      // Should be only 1 query with proper eager loading
      expect(queryCount).toBeLessThanOrEqual(2); // Allow 1-2 queries max
    });

    it('should fetch clients with document count without N+1', async () => {
      const queryCount = await trackQueries(async () => {
        const clients = await Client.findAll({
          where: { userId: testUser.id },
          include: [
            {
              model: Document,
              as: 'documents',
              attributes: ['id'],
              required: false,
            },
          ],
        });

        // Access document count
        clients.forEach((client: any) => {
          const docCount = client.documents?.length || 0;
        });
      });

      // Should be 1-2 queries maximum
      expect(queryCount).toBeLessThanOrEqual(2);
    });

    it('should fetch user with related data efficiently', async () => {
      const queryCount = await trackQueries(async () => {
        const user = await User.findByPk(testUser.id, {
          include: [
            {
              model: Client,
              as: 'clients',
              include: [
                {
                  model: Document,
                  as: 'documents',
                  limit: 5,
                },
              ],
            },
          ],
        });

        // Access nested data
        const clientCount = user?.clients?.length || 0;
      });

      // Should be 1-2 queries with proper includes
      expect(queryCount).toBeLessThanOrEqual(2);
    });
  });

  describe('Query Performance (<50ms p95)', () => {
    it('should fetch documents in <50ms', async () => {
      const duration = await measureTime(async () => {
        await Document.findAll({
          where: { userId: testUser.id },
          limit: 20,
        });
      });

      expect(duration).toBeLessThan(50);
    });

    it('should fetch documents with includes in <100ms', async () => {
      const duration = await measureTime(async () => {
        await Document.findAll({
          where: { userId: testUser.id },
          include: [
            { model: Client, as: 'client' },
            { model: User, as: 'uploader' },
          ],
          limit: 20,
        });
      });

      expect(duration).toBeLessThan(100);
    });

    it('should count documents in <30ms', async () => {
      const duration = await measureTime(async () => {
        await Document.count({
          where: { userId: testUser.id },
        });
      });

      expect(duration).toBeLessThan(30);
    });

    it('should perform paginated query in <100ms', async () => {
      const duration = await measureTime(async () => {
        await Document.findAndCountAll({
          where: { userId: testUser.id },
          include: [
            { model: Client, as: 'client', attributes: ['id', 'name'] },
          ],
          limit: 20,
          offset: 0,
          order: [['uploadDate', 'DESC']],
        });
      });

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Index Usage', () => {
    it('should use index for user_id queries', async () => {
      const explainResult: any = await sequelize.query(
        `EXPLAIN (FORMAT JSON) SELECT * FROM documents WHERE user_id = :userId LIMIT 20`,
        {
          replacements: { userId: testUser.id },
          type: QueryTypes.SELECT,
        }
      );

      const plan = explainResult[0]['QUERY PLAN'][0];
      const planStr = JSON.stringify(plan);

      // Should use index scan, not sequential scan
      expect(planStr).toContain('Index');
      expect(planStr).not.toContain('Seq Scan');
    });

    it('should use index for status queries', async () => {
      const explainResult: any = await sequelize.query(
        `EXPLAIN (FORMAT JSON) SELECT * FROM documents WHERE status = 'active' LIMIT 20`,
        {
          type: QueryTypes.SELECT,
        }
      );

      const plan = explainResult[0]['QUERY PLAN'][0];
      const planStr = JSON.stringify(plan);

      // Should use index for status column
      expect(planStr).toMatch(/Index|Bitmap/);
    });

    it('should use composite index for user_id + status', async () => {
      const explainResult: any = await sequelize.query(
        `EXPLAIN (FORMAT JSON) SELECT * FROM documents WHERE user_id = :userId AND status = 'active' LIMIT 20`,
        {
          replacements: { userId: testUser.id },
          type: QueryTypes.SELECT,
        }
      );

      const plan = explainResult[0]['QUERY PLAN'][0];
      const planStr = JSON.stringify(plan);

      // Should use index
      expect(planStr).toContain('Index');
    });
  });

  describe('Aggregation Performance', () => {
    it('should aggregate document stats efficiently', async () => {
      const duration = await measureTime(async () => {
        await sequelize.query(
          `
          SELECT
            status,
            COUNT(*) as count,
            SUM(size) as total_size
          FROM documents
          WHERE user_id = :userId
          GROUP BY status
        `,
          {
            replacements: { userId: testUser.id },
            type: QueryTypes.SELECT,
          }
        );
      });

      expect(duration).toBeLessThan(50);
    });

    it('should calculate engagement scores efficiently', async () => {
      const duration = await measureTime(async () => {
        await sequelize.query(
          `
          SELECT
            id,
            name,
            engagement_score,
            (
              CASE
                WHEN last_contact > NOW() - INTERVAL '7 days' THEN 100
                WHEN last_contact > NOW() - INTERVAL '14 days' THEN 75
                ELSE 50
              END
            ) as calculated_score
          FROM clients
          WHERE user_id = :userId
        `,
          {
            replacements: { userId: testUser.id },
            type: QueryTypes.SELECT,
          }
        );
      });

      expect(duration).toBeLessThan(50);
    });
  });

  describe('Pagination Performance', () => {
    it('should paginate efficiently with proper offset', async () => {
      const duration = await measureTime(async () => {
        await Document.findAndCountAll({
          where: { userId: testUser.id },
          limit: 10,
          offset: 0,
          order: [['createdAt', 'DESC']],
        });
      });

      expect(duration).toBeLessThan(50);
    });

    it('should handle deep pagination without performance degradation', async () => {
      const duration = await measureTime(async () => {
        await Document.findAndCountAll({
          where: { userId: testUser.id },
          limit: 10,
          offset: 100,
          order: [['createdAt', 'DESC']],
        });
      });

      // Deep pagination might be slightly slower, but should still be reasonable
      expect(duration).toBeLessThan(100);
    });
  });
});
