import { redisClient } from '../config/redis';
import { createLogger } from '../utils/logger';

const logger = createLogger('cache-service');

/**
 * Cache Service
 * PERFORMANCE: Central cache management with TTL, fallback, and pattern-based operations
 * TARGET: 70%+ cache hit rate, 60% faster API responses
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for grouped invalidation
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  keys: number;
  memoryUsed: string;
}

class CacheService {
  private hitCount = 0;
  private missCount = 0;

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Parsed value or null if not found
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);

      if (value === null) {
        this.missCount++;
        logger.debug('Cache miss', { key });
        return null;
      }

      this.hitCount++;
      logger.debug('Cache hit', { key });

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache (will be JSON stringified)
   * @param ttl Time to live in seconds (optional)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);

      if (ttl) {
        await redisClient.setex(key, ttl, serialized);
        logger.debug('Cache set with TTL', { key, ttl });
      } else {
        await redisClient.set(key, serialized);
        logger.debug('Cache set', { key });
      }
    } catch (error) {
      logger.error('Cache set error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete one or more keys from cache
   * @param keys Single key or array of keys
   */
  async del(keys: string | string[]): Promise<void> {
    try {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      if (keysArray.length > 0) {
        await redisClient.del(...keysArray);
        logger.debug('Cache delete', { keys: keysArray });
      }
    } catch (error) {
      logger.error('Cache delete error', {
        keys,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check if key exists in cache
   * @param key Cache key
   * @returns True if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Set expiration time for key
   * @param key Cache key
   * @param ttl Time to live in seconds
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await redisClient.expire(key, ttl);
      logger.debug('Cache expire set', { key, ttl });
    } catch (error) {
      logger.error('Cache expire error', {
        key,
        ttl,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get remaining TTL for key
   * @param key Cache key
   * @returns TTL in seconds, -1 if no expiry, -2 if key doesn't exist
   */
  async ttl(key: string): Promise<number> {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      logger.error('Cache TTL error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return -2;
    }
  }

  /**
   * Clear all keys matching pattern
   * @param pattern Redis key pattern (e.g., 'documents:*')
   */
  async clearPattern(pattern: string): Promise<void> {
    try {
      // Remove prefix from pattern if present
      const fullPattern = pattern.startsWith('roi:') ? pattern : `roi:${pattern}`;

      let cursor = '0';
      let deletedCount = 0;

      do {
        const [newCursor, keys] = await redisClient.scan(
          cursor,
          'MATCH',
          fullPattern,
          'COUNT',
          100
        );
        cursor = newCursor;

        if (keys.length > 0) {
          // Remove prefix before deletion since client adds it automatically
          const keysWithoutPrefix = keys.map(k => k.replace('roi:', ''));
          await redisClient.del(...keysWithoutPrefix);
          deletedCount += keys.length;
        }
      } while (cursor !== '0');

      logger.info('Cache pattern cleared', { pattern, deletedCount });
    } catch (error) {
      logger.error('Cache clear pattern error', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get value from cache, or fetch and cache if not found
   * @param key Cache key
   * @param fallback Function to fetch value if not in cache
   * @param ttl Time to live in seconds (optional)
   * @returns Cached or fetched value
   */
  async getWithFallback<T = any>(
    key: string,
    fallback: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Cache miss - fetch from fallback
      logger.debug('Cache miss, fetching from fallback', { key });
      const value = await fallback();

      // Cache the result
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }

      return value;
    } catch (error) {
      logger.error('Cache getWithFallback error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // On error, try to fetch from fallback
      return await fallback();
    }
  }

  /**
   * Increment a counter in cache
   * @param key Cache key
   * @param by Amount to increment by (default: 1)
   * @returns New value
   */
  async increment(key: string, by: number = 1): Promise<number> {
    try {
      return await redisClient.incrby(key, by);
    } catch (error) {
      logger.error('Cache increment error', {
        key,
        by,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Decrement a counter in cache
   * @param key Cache key
   * @param by Amount to decrement by (default: 1)
   * @returns New value
   */
  async decrement(key: string, by: number = 1): Promise<number> {
    try {
      return await redisClient.decrby(key, by);
    } catch (error) {
      logger.error('Cache decrement error', {
        key,
        by,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Get multiple keys at once
   * @param keys Array of cache keys
   * @returns Array of values (null for missing keys)
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) return [];

      const values = await redisClient.mget(...keys);

      return values.map((value, index) => {
        if (value === null) {
          this.missCount++;
          logger.debug('Cache miss', { key: keys[index] });
          return null;
        }
        this.hitCount++;
        logger.debug('Cache hit', { key: keys[index] });
        return JSON.parse(value) as T;
      });
    } catch (error) {
      logger.error('Cache mget error', {
        keys,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple key-value pairs at once
   * @param entries Object with key-value pairs
   * @param ttl Time to live in seconds (applied to all keys)
   */
  async mset(entries: Record<string, any>, ttl?: number): Promise<void> {
    try {
      const pipeline = redisClient.pipeline();

      Object.entries(entries).forEach(([key, value]) => {
        const serialized = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      });

      await pipeline.exec();
      logger.debug('Cache mset', { count: Object.keys(entries).length, ttl });
    } catch (error) {
      logger.error('Cache mset error', {
        count: Object.keys(entries).length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Flush all cache data (use with caution!)
   */
  async flush(): Promise<void> {
    try {
      await redisClient.flushdb();
      this.hitCount = 0;
      this.missCount = 0;
      logger.warn('Cache flushed - all data deleted');
    } catch (error) {
      logger.error('Cache flush error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get cache statistics
   * @returns Cache hit rate and other metrics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const info = await redisClient.info('stats');
      const keyspace = await redisClient.info('keyspace');

      // Parse keyspace hits/misses from Redis INFO
      const hitsMatch = info.match(/keyspace_hits:(\d+)/);
      const missesMatch = info.match(/keyspace_misses:(\d+)/);
      const memoryMatch = info.match(/used_memory_human:(.+)/);

      const redisHits = hitsMatch ? parseInt(hitsMatch[1], 10) : 0;
      const redisMisses = missesMatch ? parseInt(missesMatch[1], 10) : 0;
      const memory = memoryMatch ? memoryMatch[1].trim() : '0B';

      // Parse number of keys
      const keysMatch = keyspace.match(/keys=(\d+)/);
      const keys = keysMatch ? parseInt(keysMatch[1], 10) : 0;

      const totalHits = this.hitCount + redisHits;
      const totalMisses = this.missCount + redisMisses;
      const total = totalHits + totalMisses;
      const hitRate = total > 0 ? (totalHits / total) * 100 : 0;

      return {
        hits: totalHits,
        misses: totalMisses,
        hitRate: Math.round(hitRate * 100) / 100,
        keys,
        memoryUsed: memory
      };
    } catch (error) {
      logger.error('Cache getStats error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        hits: this.hitCount,
        misses: this.missCount,
        hitRate: 0,
        keys: 0,
        memoryUsed: '0B'
      };
    }
  }

  /**
   * Reset local statistics counters
   */
  resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
    logger.info('Cache stats reset');
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;
