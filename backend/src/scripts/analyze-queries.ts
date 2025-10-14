#!/usr/bin/env ts-node

/**
 * Query Analysis Script
 * Analyzes database query performance and identifies slow queries
 *
 * Usage: npm run analyze:queries
 */

import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import { createLogger } from '../utils/logger';

const logger = createLogger('query-analyzer');

interface SlowQuery {
  query: string;
  calls: number;
  mean_exec_time: number;
  max_exec_time: number;
  total_exec_time: number;
  rows: number;
}

interface IndexUsage {
  schemaname: string;
  tablename: string;
  indexname: string;
  idx_scan: number;
  idx_tup_read: number;
  idx_tup_fetch: number;
}

interface TableStats {
  schemaname: string;
  tablename: string;
  seq_scan: number;
  seq_tup_read: number;
  idx_scan: number;
  idx_tup_fetch: number;
  n_tup_ins: number;
  n_tup_upd: number;
  n_tup_del: number;
  n_live_tup: number;
}

class QueryAnalyzer {
  /**
   * Enable pg_stat_statements extension if not already enabled
   */
  async enableStatStatements(): Promise<void> {
    try {
      await sequelize.query("CREATE EXTENSION IF NOT EXISTS pg_stat_statements;", {
        type: QueryTypes.RAW,
      });
      logger.info('pg_stat_statements extension enabled');
    } catch (error) {
      logger.error('Failed to enable pg_stat_statements:', error);
      logger.warn('Some analysis features may not be available');
    }
  }

  /**
   * Get slow queries (> 50ms mean execution time)
   */
  async getSlowQueries(limit: number = 20): Promise<SlowQuery[]> {
    try {
      const query = `
        SELECT
          query,
          calls,
          mean_exec_time::numeric(10,2) as mean_exec_time,
          max_exec_time::numeric(10,2) as max_exec_time,
          total_exec_time::numeric(10,2) as total_exec_time,
          rows
        FROM pg_stat_statements
        WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
          AND mean_exec_time > 50
        ORDER BY mean_exec_time DESC
        LIMIT $1;
      `;

      const results = await sequelize.query(query, {
        bind: [limit],
        type: QueryTypes.SELECT,
      });

      return results as SlowQuery[];
    } catch (error) {
      logger.error('Failed to get slow queries:', error);
      return [];
    }
  }

  /**
   * Get index usage statistics
   */
  async getIndexUsage(): Promise<IndexUsage[]> {
    try {
      const query = `
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC;
      `;

      const results = await sequelize.query(query, {
        type: QueryTypes.SELECT,
      });

      return results as IndexUsage[];
    } catch (error) {
      logger.error('Failed to get index usage:', error);
      return [];
    }
  }

  /**
   * Get unused indexes
   */
  async getUnusedIndexes(): Promise<IndexUsage[]> {
    try {
      const query = `
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND idx_scan = 0
          AND indexname NOT LIKE '%_pkey'
        ORDER BY pg_relation_size(indexrelid) DESC;
      `;

      const results = await sequelize.query(query, {
        type: QueryTypes.SELECT,
      });

      return results as IndexUsage[];
    } catch (error) {
      logger.error('Failed to get unused indexes:', error);
      return [];
    }
  }

  /**
   * Get table statistics
   */
  async getTableStats(): Promise<TableStats[]> {
    try {
      const query = `
        SELECT
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch,
          n_tup_ins,
          n_tup_upd,
          n_tup_del,
          n_live_tup
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY seq_scan DESC;
      `;

      const results = await sequelize.query(query, {
        type: QueryTypes.SELECT,
      });

      return results as TableStats[];
    } catch (error) {
      logger.error('Failed to get table stats:', error);
      return [];
    }
  }

  /**
   * Get cache hit rate
   */
  async getCacheHitRate(): Promise<number> {
    try {
      const query = `
        SELECT
          CASE
            WHEN (blks_hit + blks_read) > 0
            THEN (blks_hit::float / (blks_hit + blks_read) * 100)::numeric(5,2)
            ELSE 0
          END as cache_hit_rate
        FROM pg_stat_database
        WHERE datname = current_database();
      `;

      const result: any = await sequelize.query(query, {
        type: QueryTypes.SELECT,
      });

      return parseFloat(result[0]?.cache_hit_rate) || 0;
    } catch (error) {
      logger.error('Failed to get cache hit rate:', error);
      return 0;
    }
  }

  /**
   * Analyze and print report
   */
  async analyze(): Promise<void> {
    logger.info('Starting query performance analysis...');

    // Enable pg_stat_statements
    await this.enableStatStatements();

    // Get slow queries
    logger.info('Fetching slow queries...');
    const slowQueries = await this.getSlowQueries();
    console.log('\n=== SLOW QUERIES (> 50ms) ===');
    if (slowQueries.length === 0) {
      console.log('No slow queries found!');
    } else {
      slowQueries.forEach((q, i) => {
        console.log(`\n${i + 1}. Query: ${q.query.substring(0, 100)}...`);
        console.log(`   Calls: ${q.calls}`);
        console.log(`   Mean Time: ${q.mean_exec_time}ms`);
        console.log(`   Max Time: ${q.max_exec_time}ms`);
        console.log(`   Total Time: ${q.total_exec_time}ms`);
      });
    }

    // Get index usage
    logger.info('Fetching index usage...');
    const indexUsage = await this.getIndexUsage();
    console.log('\n=== INDEX USAGE ===');
    if (indexUsage.length === 0) {
      console.log('No indexes found!');
    } else {
      indexUsage.slice(0, 10).forEach((idx, i) => {
        console.log(`${i + 1}. ${idx.tablename}.${idx.indexname}`);
        console.log(`   Scans: ${idx.idx_scan}`);
        console.log(`   Tuples Read: ${idx.idx_tup_read}`);
        console.log(`   Tuples Fetched: ${idx.idx_tup_fetch}`);
      });
    }

    // Get unused indexes
    logger.info('Fetching unused indexes...');
    const unusedIndexes = await this.getUnusedIndexes();
    console.log('\n=== UNUSED INDEXES ===');
    if (unusedIndexes.length === 0) {
      console.log('All indexes are being used!');
    } else {
      unusedIndexes.forEach((idx, i) => {
        console.log(`${i + 1}. ${idx.tablename}.${idx.indexname} (NEVER USED)`);
      });
    }

    // Get table stats
    logger.info('Fetching table statistics...');
    const tableStats = await this.getTableStats();
    console.log('\n=== TABLE STATISTICS ===');
    tableStats.forEach((table) => {
      const totalScans = table.seq_scan + (table.idx_scan || 0);
      const indexUsagePercent = totalScans > 0 ? ((table.idx_scan || 0) / totalScans * 100).toFixed(2) : '0.00';

      console.log(`\nTable: ${table.tablename}`);
      console.log(`  Sequential Scans: ${table.seq_scan}`);
      console.log(`  Index Scans: ${table.idx_scan || 0}`);
      console.log(`  Index Usage: ${indexUsagePercent}%`);
      console.log(`  Live Rows: ${table.n_live_tup}`);
      console.log(`  Inserts: ${table.n_tup_ins}`);
      console.log(`  Updates: ${table.n_tup_upd}`);
      console.log(`  Deletes: ${table.n_tup_del}`);

      if (table.seq_scan > table.idx_scan && table.n_live_tup > 1000) {
        console.log(`  ⚠️  WARNING: High sequential scans on large table!`);
      }
    });

    // Get cache hit rate
    logger.info('Fetching cache hit rate...');
    const cacheHitRate = await this.getCacheHitRate();
    console.log('\n=== CACHE PERFORMANCE ===');
    console.log(`Cache Hit Rate: ${cacheHitRate}%`);
    if (cacheHitRate < 90) {
      console.log('⚠️  WARNING: Cache hit rate is below 90%. Consider increasing shared_buffers.');
    } else {
      console.log('✅ Cache hit rate is good!');
    }

    console.log('\n=== ANALYSIS COMPLETE ===\n');
    logger.info('Query analysis completed');
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new QueryAnalyzer();

  analyzer
    .analyze()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Analysis failed:', error);
      process.exit(1);
    });
}

export default QueryAnalyzer;
