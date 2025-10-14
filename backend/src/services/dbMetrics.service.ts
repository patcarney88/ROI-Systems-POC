import { QueryTypes } from 'sequelize';
import sequelize, { getDatabaseStats } from '../config/database';
import { createLogger } from '../utils/logger';

const logger = createLogger('db-metrics');

export interface DatabaseMetrics {
  connections: {
    active: number;
    idle: number;
    waiting: number;
    total: number;
    max: number;
    min: number;
  };
  queries: {
    total: number;
    slow: number;
    avgTime: number;
    maxTime: number;
    totalTime: number;
  };
  tables: {
    users: number;
    clients: number;
    documents: number;
    campaigns: number;
  };
  performance: {
    cacheHitRate: number;
    indexUsage: number;
    deadlocks: number;
  };
}

/**
 * Database metrics service for monitoring and performance tracking
 */
export class DatabaseMetricsService {
  /**
   * Get current connection pool statistics
   */
  async getConnectionStats() {
    try {
      const poolStats = getDatabaseStats();

      // Get active connections from PostgreSQL
      const activeConnQuery = `
        SELECT
          COUNT(*) FILTER (WHERE state = 'active') as active,
          COUNT(*) FILTER (WHERE state = 'idle') as idle,
          COUNT(*) FILTER (WHERE wait_event_type IS NOT NULL) as waiting,
          COUNT(*) as total
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid != pg_backend_pid();
      `;

      const result: any = await sequelize.query(activeConnQuery, {
        type: QueryTypes.SELECT,
        raw: true,
      });

      const pgStats = result[0] || {};

      return {
        active: parseInt(pgStats.active) || 0,
        idle: parseInt(pgStats.idle) || 0,
        waiting: parseInt(pgStats.waiting) || 0,
        total: parseInt(pgStats.total) || 0,
        max: poolStats.max,
        min: poolStats.min,
      };
    } catch (error) {
      logger.error('Error getting connection stats:', error);
      return {
        active: 0,
        idle: 0,
        waiting: 0,
        total: 0,
        max: 0,
        min: 0,
      };
    }
  }

  /**
   * Get query performance statistics
   * Requires pg_stat_statements extension
   */
  async getQueryStats() {
    try {
      // Check if pg_stat_statements is available
      const extensionCheck = await sequelize.query(
        "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') as exists",
        { type: QueryTypes.SELECT, raw: true }
      );

      if (!(extensionCheck[0] as any).exists) {
        logger.warn('pg_stat_statements extension not available');
        return {
          total: 0,
          slow: 0,
          avgTime: 0,
          maxTime: 0,
          totalTime: 0,
        };
      }

      const queryStatsQuery = `
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE mean_exec_time > 50) as slow,
          AVG(mean_exec_time)::numeric(10,2) as avg_time,
          MAX(max_exec_time)::numeric(10,2) as max_time,
          SUM(total_exec_time)::numeric(10,2) as total_time
        FROM pg_stat_statements
        WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database());
      `;

      const result: any = await sequelize.query(queryStatsQuery, {
        type: QueryTypes.SELECT,
        raw: true,
      });

      const stats = result[0] || {};

      return {
        total: parseInt(stats.total) || 0,
        slow: parseInt(stats.slow) || 0,
        avgTime: parseFloat(stats.avg_time) || 0,
        maxTime: parseFloat(stats.max_time) || 0,
        totalTime: parseFloat(stats.total_time) || 0,
      };
    } catch (error) {
      logger.error('Error getting query stats:', error);
      return {
        total: 0,
        slow: 0,
        avgTime: 0,
        maxTime: 0,
        totalTime: 0,
      };
    }
  }

  /**
   * Get table row counts
   */
  async getTableStats() {
    try {
      const tableStatsQuery = `
        SELECT
          (SELECT COUNT(*) FROM users) as users,
          (SELECT COUNT(*) FROM clients) as clients,
          (SELECT COUNT(*) FROM documents) as documents,
          (SELECT COUNT(*) FROM campaigns) as campaigns;
      `;

      const result: any = await sequelize.query(tableStatsQuery, {
        type: QueryTypes.SELECT,
        raw: true,
      });

      const stats = result[0] || {};

      return {
        users: parseInt(stats.users) || 0,
        clients: parseInt(stats.clients) || 0,
        documents: parseInt(stats.documents) || 0,
        campaigns: parseInt(stats.campaigns) || 0,
      };
    } catch (error) {
      logger.error('Error getting table stats:', error);
      return {
        users: 0,
        clients: 0,
        documents: 0,
        campaigns: 0,
      };
    }
  }

  /**
   * Get cache hit rate and performance metrics
   */
  async getPerformanceStats() {
    try {
      const perfStatsQuery = `
        SELECT
          -- Cache hit rate
          CASE
            WHEN (blks_hit + blks_read) > 0
            THEN (blks_hit::float / (blks_hit + blks_read) * 100)::numeric(5,2)
            ELSE 0
          END as cache_hit_rate,
          -- Index usage rate
          CASE
            WHEN (idx_scan + seq_scan) > 0
            THEN (idx_scan::float / (idx_scan + seq_scan) * 100)::numeric(5,2)
            ELSE 0
          END as index_usage
        FROM pg_stat_database
        WHERE datname = current_database();
      `;

      const result: any = await sequelize.query(perfStatsQuery, {
        type: QueryTypes.SELECT,
        raw: true,
      });

      const stats = result[0] || {};

      // Get deadlock count
      const deadlockQuery = `
        SELECT deadlocks FROM pg_stat_database WHERE datname = current_database();
      `;

      const deadlockResult: any = await sequelize.query(deadlockQuery, {
        type: QueryTypes.SELECT,
        raw: true,
      });

      return {
        cacheHitRate: parseFloat(stats.cache_hit_rate) || 0,
        indexUsage: parseFloat(stats.index_usage) || 0,
        deadlocks: parseInt((deadlockResult[0] as any)?.deadlocks) || 0,
      };
    } catch (error) {
      logger.error('Error getting performance stats:', error);
      return {
        cacheHitRate: 0,
        indexUsage: 0,
        deadlocks: 0,
      };
    }
  }

  /**
   * Get slow queries
   */
  async getSlowQueries(limit: number = 10) {
    try {
      const slowQueriesQuery = `
        SELECT
          query,
          calls,
          mean_exec_time::numeric(10,2) as avg_time,
          max_exec_time::numeric(10,2) as max_time,
          total_exec_time::numeric(10,2) as total_time
        FROM pg_stat_statements
        WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
          AND mean_exec_time > 50
        ORDER BY mean_exec_time DESC
        LIMIT $1;
      `;

      return await sequelize.query(slowQueriesQuery, {
        bind: [limit],
        type: QueryTypes.SELECT,
      });
    } catch (error) {
      logger.warn('Could not fetch slow queries (pg_stat_statements may not be enabled)');
      return [];
    }
  }

  /**
   * Get index usage statistics
   */
  async getIndexStats() {
    try {
      const indexStatsQuery = `
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan as scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
        LIMIT 20;
      `;

      return await sequelize.query(indexStatsQuery, {
        type: QueryTypes.SELECT,
      });
    } catch (error) {
      logger.error('Error getting index stats:', error);
      return [];
    }
  }

  /**
   * Collect all metrics
   */
  async collectMetrics(): Promise<DatabaseMetrics> {
    const [connections, queries, tables, performance] = await Promise.all([
      this.getConnectionStats(),
      this.getQueryStats(),
      this.getTableStats(),
      this.getPerformanceStats(),
    ]);

    return {
      connections,
      queries,
      tables,
      performance,
    };
  }

  /**
   * Reset query statistics
   * Use with caution - this clears pg_stat_statements
   */
  async resetQueryStats() {
    try {
      await sequelize.query('SELECT pg_stat_statements_reset();', {
        type: QueryTypes.SELECT,
      });
      logger.info('Query statistics reset');
    } catch (error) {
      logger.error('Error resetting query stats:', error);
      throw error;
    }
  }
}

export const dbMetricsService = new DatabaseMetricsService();
export default dbMetricsService;
