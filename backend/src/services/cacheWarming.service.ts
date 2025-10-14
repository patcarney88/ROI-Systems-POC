import { cacheService } from './cache.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('cache-warming');

/**
 * Cache Warming Service
 * PERFORMANCE: Pre-loads frequently accessed data into cache on startup
 * Reduces cold start latency and improves initial response times
 */

interface WarmingConfig {
  enabled: boolean;
  warmOnStartup: boolean;
  warmInterval?: number; // in milliseconds
}

const config: WarmingConfig = {
  enabled: process.env.CACHE_WARMING_ENABLED !== 'false',
  warmOnStartup: process.env.CACHE_WARMING_ON_STARTUP !== 'false',
  warmInterval: parseInt(process.env.CACHE_WARMING_INTERVAL || '0', 10)
};

/**
 * Warm frequently accessed user data
 * This is a placeholder - in production, connect to your database
 */
async function warmUserData(): Promise<number> {
  try {
    let warmedCount = 0;

    // TODO: Fetch active users from database (last 24 hours)
    // For now, this is a placeholder
    logger.debug('Warming user data cache...');

    // Example: Cache active user sessions
    // const activeUsers = await User.findAll({
    //   where: {
    //     lastLoginAt: {
    //       [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
    //     }
    //   }
    // });
    //
    // for (const user of activeUsers) {
    //   const cacheKey = `user:session:${user.id}`;
    //   await cacheService.set(cacheKey, {
    //     id: user.id,
    //     email: user.email,
    //     firstName: user.firstName,
    //     lastName: user.lastName,
    //     role: user.role
    //   }, 3600); // 1 hour
    //   warmedCount++;
    // }

    logger.info('User data cache warmed', { count: warmedCount });
    return warmedCount;
  } catch (error) {
    logger.error('Failed to warm user data cache', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return 0;
  }
}

/**
 * Warm recent document data
 */
async function warmDocumentData(): Promise<number> {
  try {
    let warmedCount = 0;

    logger.debug('Warming document data cache...');

    // TODO: Fetch recent documents from database (last 7 days)
    // Example:
    // const recentDocs = await Document.findAll({
    //   where: {
    //     createdAt: {
    //       [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    //     }
    //   },
    //   limit: 100,
    //   order: [['createdAt', 'DESC']]
    // });
    //
    // for (const doc of recentDocs) {
    //   const cacheKey = `document:${doc.id}`;
    //   await cacheService.set(cacheKey, doc, 900); // 15 minutes
    //   warmedCount++;
    // }

    logger.info('Document data cache warmed', { count: warmedCount });
    return warmedCount;
  } catch (error) {
    logger.error('Failed to warm document data cache', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return 0;
  }
}

/**
 * Warm active campaign data
 */
async function warmCampaignData(): Promise<number> {
  try {
    let warmedCount = 0;

    logger.debug('Warming campaign data cache...');

    // TODO: Fetch active campaigns from database
    // Example:
    // const activeCampaigns = await Campaign.findAll({
    //   where: {
    //     status: 'active'
    //   }
    // });
    //
    // if (activeCampaigns.length > 0) {
    //   await cacheService.set('campaigns:active', activeCampaigns, 300); // 5 minutes
    //   warmedCount = activeCampaigns.length;
    // }

    logger.info('Campaign data cache warmed', { count: warmedCount });
    return warmedCount;
  } catch (error) {
    logger.error('Failed to warm campaign data cache', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return 0;
  }
}

/**
 * Warm client engagement scores (expensive calculation)
 */
async function warmClientEngagementScores(): Promise<number> {
  try {
    let warmedCount = 0;

    logger.debug('Warming client engagement scores cache...');

    // TODO: Calculate and cache engagement scores for top clients
    // Example:
    // const topClients = await Client.findAll({
    //   limit: 50,
    //   order: [['propertyCount', 'DESC']]
    // });
    //
    // for (const client of topClients) {
    //   // Calculate expensive engagement score
    //   const score = await calculateEngagementScore(client.id);
    //   const cacheKey = `client:engagement:${client.id}`;
    //   await cacheService.set(cacheKey, score, 3600); // 1 hour
    //   warmedCount++;
    // }

    logger.info('Client engagement scores cache warmed', { count: warmedCount });
    return warmedCount;
  } catch (error) {
    logger.error('Failed to warm client engagement scores cache', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return 0;
  }
}

/**
 * Warm frequently accessed static data
 */
async function warmStaticData(): Promise<number> {
  try {
    let warmedCount = 0;

    logger.debug('Warming static data cache...');

    // Example: Cache document types, property types, etc.
    const documentTypes = [
      'Purchase Agreement',
      'Lease Agreement',
      'Title Deed',
      'Inspection Report',
      'Disclosure Form',
      'HOA Documents'
    ];

    await cacheService.set('config:document:types', documentTypes, 86400); // 24 hours
    warmedCount++;

    const clientStatuses = ['active', 'at-risk', 'dormant'];
    await cacheService.set('config:client:statuses', clientStatuses, 86400); // 24 hours
    warmedCount++;

    logger.info('Static data cache warmed', { count: warmedCount });
    return warmedCount;
  } catch (error) {
    logger.error('Failed to warm static data cache', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return 0;
  }
}

/**
 * Warm all caches
 * Run this on application startup or periodically
 */
export async function warmAllCaches(): Promise<void> {
  if (!config.enabled) {
    logger.info('Cache warming is disabled');
    return;
  }

  const startTime = Date.now();
  logger.info('Starting cache warming...');

  try {
    const results = await Promise.allSettled([
      warmUserData(),
      warmDocumentData(),
      warmCampaignData(),
      warmClientEngagementScores(),
      warmStaticData()
    ]);

    const totalWarmed = results.reduce((sum, result) => {
      if (result.status === 'fulfilled') {
        return sum + result.value;
      }
      return sum;
    }, 0);

    const duration = Date.now() - startTime;
    logger.info('Cache warming completed', {
      totalItems: totalWarmed,
      duration: `${duration}ms`
    });
  } catch (error) {
    logger.error('Cache warming failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Initialize cache warming
 * Call this from your application startup
 */
export async function initializeCacheWarming(): Promise<void> {
  if (!config.enabled) {
    logger.info('Cache warming is disabled');
    return;
  }

  // Warm cache on startup
  if (config.warmOnStartup) {
    logger.info('Warming cache on startup...');
    await warmAllCaches();
  }

  // Set up periodic warming if interval is configured
  if (config.warmInterval && config.warmInterval > 0) {
    logger.info('Setting up periodic cache warming', {
      interval: `${config.warmInterval}ms`
    });

    setInterval(() => {
      logger.info('Starting periodic cache warming...');
      warmAllCaches();
    }, config.warmInterval);
  }
}

/**
 * Warm specific cache by key pattern
 * Useful for warming specific data on-demand
 */
export async function warmCachePattern(
  pattern: string,
  dataFetcher: () => Promise<any[]>,
  keyGenerator: (item: any) => string,
  ttl: number = 3600
): Promise<number> {
  try {
    logger.debug('Warming cache pattern', { pattern });

    const data = await dataFetcher();
    let warmedCount = 0;

    for (const item of data) {
      const cacheKey = keyGenerator(item);
      await cacheService.set(cacheKey, item, ttl);
      warmedCount++;
    }

    logger.info('Cache pattern warmed', { pattern, count: warmedCount });
    return warmedCount;
  } catch (error) {
    logger.error('Failed to warm cache pattern', {
      pattern,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return 0;
  }
}

/**
 * Warm cache for specific user
 * Call this when user logs in
 */
export async function warmUserCache(userId: string): Promise<void> {
  try {
    logger.debug('Warming cache for user', { userId });

    // TODO: Fetch user data and their recent documents, clients, etc.
    // Example:
    // const user = await User.findByPk(userId);
    // if (user) {
    //   await cacheService.set(`user:session:${userId}`, {
    //     id: user.id,
    //     email: user.email,
    //     firstName: user.firstName,
    //     lastName: user.lastName,
    //     role: user.role
    //   }, 3600);
    // }
    //
    // const recentDocs = await Document.findAll({
    //   where: { userId },
    //   limit: 20,
    //   order: [['createdAt', 'DESC']]
    // });
    // await cacheService.set(`documents:user:${userId}`, recentDocs, 600);

    logger.info('User cache warmed', { userId });
  } catch (error) {
    logger.error('Failed to warm user cache', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default {
  warmAllCaches,
  initializeCacheWarming,
  warmCachePattern,
  warmUserCache
};
