/**
 * Market Intelligence Service
 * Provides neighborhood analytics, market trends, and activity tracking
 * Monitors listings within 0.5 miles and generates market insights
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { addDays, subDays, differenceInDays, startOfQuarter, endOfQuarter } from 'date-fns';

const logger = createLogger('market-intelligence');
const db = new PrismaClient();

export interface NeighborhoodActivity {
  zipCode: string;
  newListings: PropertyListing[];
  recentSales: RecentSale[];
  marketMetrics: MarketMetrics;
  priceTrends: PriceTrends;
  demographics: Demographics;
}

export interface PropertyListing {
  address: string;
  listPrice: number;
  pricePerSqFt: number;
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  daysOnMarket: number;
  distanceMiles: number;
  listDate: Date;
}

export interface RecentSale {
  address: string;
  salePrice: number;
  pricePerSqFt: number;
  saleDate: Date;
  daysOnMarket: number;
  distanceMiles: number;
}

export interface MarketMetrics {
  activeListings: number;
  pendingListings: number;
  averageListPrice: number;
  averageSalePrice: number;
  averageDaysOnMarket: number;
  listToSaleRatio: number;
  inventoryMonths: number;
}

export interface PriceTrends {
  medianHomePrice: number;
  priceChangeQoQ: number;
  priceChangeYoY: number;
  appreciationRate: number;
  pricePerSqFt: number;
}

export interface Demographics {
  population: number;
  medianIncome: number;
  schoolRating: number;
  crimeIndex: number;
  walkScore: number;
}

export class MarketIntelligenceService {
  /**
   * Get comprehensive neighborhood activity for a property
   */
  async getNeighborhoodActivity(propertyId: string): Promise<NeighborhoodActivity> {
    try {
      const property = await db.property.findUnique({
        where: { id: propertyId }
      });

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      logger.info(`Fetching neighborhood activity for ${property.address}`);

      // Get neighborhood statistics
      const neighborhoodStats = await this.getNeighborhoodStats(property.zipCode);

      // Get new listings within 0.5 miles (last 30 days)
      const newListings = await this.getNewListingsNearby(property, 0.5, 30);

      // Get recent sales within 0.5 miles (last 90 days)
      const recentSales = await this.getRecentSalesNearby(property, 0.5, 90);

      // Calculate current market metrics
      const marketMetrics = await this.calculateMarketMetrics(property.zipCode);

      // Get price trends
      const priceTrends = await this.getPriceTrends(property.zipCode);

      // Get demographics
      const demographics = await this.getDemographics(property.zipCode);

      // Update market metrics for property
      await this.updatePropertyMarketMetrics(propertyId, newListings.length, recentSales.length);

      return {
        zipCode: property.zipCode,
        newListings,
        recentSales,
        marketMetrics,
        priceTrends,
        demographics
      };
    } catch (error: any) {
      logger.error(`Failed to get neighborhood activity for ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Get neighborhood statistics
   */
  private async getNeighborhoodStats(zipCode: string): Promise<any> {
    let stats = await db.neighborhoodStats.findUnique({
      where: { zipCode }
    });

    if (!stats) {
      // Create placeholder stats
      stats = await db.neighborhoodStats.create({
        data: {
          zipCode,
          city: '',
          state: '',
          centerLatitude: 0,
          centerLongitude: 0,
          lastUpdated: new Date(),
          dataQualityScore: 50
        }
      });
    }

    return stats;
  }

  /**
   * Get new listings within radius (last N days)
   */
  private async getNewListingsNearby(
    property: any,
    radiusMiles: number,
    daysBack: number
  ): Promise<PropertyListing[]> {
    const cutoffDate = subDays(new Date(), daysBack);

    // Note: In production, this would query MLS data via RETS/RESO API
    // For now, we'll use comparable sales as a proxy
    const listings = await db.comparableSale.findMany({
      where: {
        zipCode: property.zipCode,
        distanceMiles: { lte: radiusMiles },
        saleDate: { gte: cutoffDate },
        status: 'ACTIVE'
      },
      orderBy: { saleDate: 'desc' },
      take: 20
    });

    return listings.map(listing => ({
      address: listing.address,
      listPrice: Number(listing.salePrice),
      pricePerSqFt: Number(listing.pricePerSqFt),
      squareFeet: listing.squareFeet || 0,
      bedrooms: listing.bedrooms || 0,
      bathrooms: listing.bathrooms || 0,
      daysOnMarket: listing.daysOnMarket || 0,
      distanceMiles: listing.distanceMiles,
      listDate: listing.saleDate
    }));
  }

  /**
   * Get recent sales within radius
   */
  private async getRecentSalesNearby(
    property: any,
    radiusMiles: number,
    daysBack: number
  ): Promise<RecentSale[]> {
    const cutoffDate = subDays(new Date(), daysBack);

    const sales = await db.comparableSale.findMany({
      where: {
        zipCode: property.zipCode,
        distanceMiles: { lte: radiusMiles },
        saleDate: { gte: cutoffDate },
        status: 'ACTIVE'
      },
      orderBy: { saleDate: 'desc' },
      take: 20
    });

    return sales.map(sale => ({
      address: sale.address,
      salePrice: Number(sale.salePrice),
      pricePerSqFt: Number(sale.pricePerSqFt),
      saleDate: sale.saleDate,
      daysOnMarket: sale.daysOnMarket || 0,
      distanceMiles: sale.distanceMiles
    }));
  }

  /**
   * Calculate current market metrics for zip code
   */
  private async calculateMarketMetrics(zipCode: string): Promise<MarketMetrics> {
    const last30Days = subDays(new Date(), 30);
    const last90Days = subDays(new Date(), 90);

    // Get recent activity
    const recentSales = await db.comparableSale.findMany({
      where: {
        zipCode,
        saleDate: { gte: last90Days },
        status: 'ACTIVE'
      }
    });

    const activeListings = await db.comparableSale.count({
      where: {
        zipCode,
        saleDate: { gte: last30Days },
        status: 'ACTIVE'
      }
    });

    // Calculate averages
    const averageListPrice = recentSales.length > 0
      ? recentSales.reduce((sum, s) => sum + Number(s.salePrice), 0) / recentSales.length
      : 0;

    const averageSalePrice = averageListPrice; // In production, differentiate list vs sale

    const averageDaysOnMarket = recentSales.length > 0
      ? recentSales.reduce((sum, s) => sum + (s.daysOnMarket || 0), 0) / recentSales.length
      : 0;

    // List-to-sale ratio (typically 97-99%)
    const listToSaleRatio = 0.98;

    // Inventory months (months of supply at current sales pace)
    const salesPerMonth = recentSales.length / 3; // Last 90 days = 3 months
    const inventoryMonths = salesPerMonth > 0 ? activeListings / salesPerMonth : 0;

    return {
      activeListings,
      pendingListings: Math.floor(activeListings * 0.3), // Estimate 30% pending
      averageListPrice: Math.round(averageListPrice),
      averageSalePrice: Math.round(averageSalePrice),
      averageDaysOnMarket: Math.round(averageDaysOnMarket),
      listToSaleRatio: Math.round(listToSaleRatio * 100) / 100,
      inventoryMonths: Math.round(inventoryMonths * 10) / 10
    };
  }

  /**
   * Get price trends for zip code
   */
  private async getPriceTrends(zipCode: string): Promise<PriceTrends> {
    const stats = await db.neighborhoodStats.findUnique({
      where: { zipCode }
    });

    if (!stats) {
      return {
        medianHomePrice: 0,
        priceChangeQoQ: 0,
        priceChangeYoY: 0,
        appreciationRate: 0,
        pricePerSqFt: 0
      };
    }

    return {
      medianHomePrice: Number(stats.medianHomePrice || 0),
      priceChangeQoQ: stats.priceChangeQoQ || 0,
      priceChangeYoY: stats.priceChangeYoY || 0,
      appreciationRate: stats.appreciationRate || 0,
      pricePerSqFt: Number(stats.pricePerSqFt || 0)
    };
  }

  /**
   * Get demographics for zip code
   */
  private async getDemographics(zipCode: string): Promise<Demographics> {
    const stats = await db.neighborhoodStats.findUnique({
      where: { zipCode }
    });

    if (!stats) {
      return {
        population: 0,
        medianIncome: 0,
        schoolRating: 0,
        crimeIndex: 0,
        walkScore: 0
      };
    }

    return {
      population: stats.population || 0,
      medianIncome: Number(stats.medianHouseholdIncome || 0),
      schoolRating: stats.schoolRating || 0,
      crimeIndex: stats.crimeIndex || 0,
      walkScore: stats.walkScore || 0
    };
  }

  /**
   * Update property market metrics
   */
  private async updatePropertyMarketMetrics(
    propertyId: string,
    newListingsCount: number,
    newSalesCount: number
  ): Promise<void> {
    const property = await db.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) return;

    const now = new Date();
    const quarter = Math.floor((now.getMonth() / 3)) + 1;
    const year = now.getFullYear();

    // Check if metric already exists for this period
    const existingMetric = await db.marketMetric.findUnique({
      where: {
        propertyId_metricDate: {
          propertyId,
          metricDate: startOfQuarter(now)
        }
      }
    });

    if (existingMetric) {
      // Update existing metric
      await db.marketMetric.update({
        where: { id: existingMetric.id },
        data: {
          newListingsCount,
          newSalesCount
        }
      });
    } else {
      // Create new metric
      await db.marketMetric.create({
        data: {
          propertyId,
          zipCode: property.zipCode,
          metricDate: startOfQuarter(now),
          quarter,
          year,
          newListingsCount,
          newSalesCount,
          priceReductionsCount: 0
        }
      });
    }
  }

  /**
   * Update neighborhood statistics (called by batch job)
   */
  async updateNeighborhoodStatistics(zipCode: string): Promise<void> {
    try {
      logger.info(`Updating neighborhood statistics for ${zipCode}`);

      // Get all comparable sales in this zip code (last 12 months)
      const oneYearAgo = subDays(new Date(), 365);
      const sales = await db.comparableSale.findMany({
        where: {
          zipCode,
          saleDate: { gte: oneYearAgo },
          status: 'ACTIVE'
        },
        orderBy: { saleDate: 'desc' }
      });

      if (sales.length === 0) {
        logger.warn(`No sales data for ${zipCode}`);
        return;
      }

      // Calculate median home price
      const prices = sales.map(s => Number(s.salePrice)).sort((a, b) => a - b);
      const medianHomePrice = prices[Math.floor(prices.length / 2)];

      // Calculate average home price
      const averageHomePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

      // Calculate price per sqft
      const pricesPerSqFt = sales
        .filter(s => s.squareFeet && s.squareFeet > 0)
        .map(s => Number(s.pricePerSqFt));
      const avgPricePerSqFt = pricesPerSqFt.length > 0
        ? pricesPerSqFt.reduce((sum, p) => sum + p, 0) / pricesPerSqFt.length
        : 0;

      // Calculate price changes (QoQ and YoY)
      const currentQuarter = this.getQuarterSales(sales, 0);
      const lastQuarter = this.getQuarterSales(sales, 1);
      const lastYear = this.getQuarterSales(sales, 4);

      const priceChangeQoQ = this.calculatePriceChange(currentQuarter, lastQuarter);
      const priceChangeYoY = this.calculatePriceChange(currentQuarter, lastYear);

      // Calculate days on market
      const daysOnMarket = sales
        .filter(s => s.daysOnMarket)
        .map(s => s.daysOnMarket!);
      const avgDaysOnMarket = daysOnMarket.length > 0
        ? Math.round(daysOnMarket.reduce((sum, d) => sum + d, 0) / daysOnMarket.length)
        : 0;

      // Calculate inventory metrics
      const last30DaysSales = sales.filter(s =>
        differenceInDays(new Date(), s.saleDate) <= 30
      ).length;

      const activeListings = sales.filter(s =>
        differenceInDays(new Date(), s.saleDate) <= 30
      ).length;

      const inventoryMonths = last30DaysSales > 0
        ? (activeListings / last30DaysSales) * 1 // Monthly rate
        : 0;

      // Update or create neighborhood stats
      await db.neighborhoodStats.upsert({
        where: { zipCode },
        create: {
          zipCode,
          city: sales[0].city,
          state: sales[0].state,
          centerLatitude: sales[0].latitude,
          centerLongitude: sales[0].longitude,
          medianHomePrice,
          averageHomePrice,
          pricePerSqFt: avgPricePerSqFt,
          totalListings: activeListings,
          newListings30Days: last30DaysSales,
          soldListings30Days: last30DaysSales,
          averageDaysOnMarket: avgDaysOnMarket,
          inventoryMonths,
          priceChangeQoQ,
          priceChangeYoY,
          appreciationRate: priceChangeYoY, // Annual appreciation
          lastUpdated: new Date(),
          dataQualityScore: this.calculateDataQuality(sales.length, avgDaysOnMarket)
        },
        update: {
          medianHomePrice,
          averageHomePrice,
          pricePerSqFt: avgPricePerSqFt,
          totalListings: activeListings,
          newListings30Days: last30DaysSales,
          soldListings30Days: last30DaysSales,
          averageDaysOnMarket: avgDaysOnMarket,
          inventoryMonths,
          priceChangeQoQ,
          priceChangeYoY,
          appreciationRate: priceChangeYoY,
          lastUpdated: new Date(),
          dataQualityScore: this.calculateDataQuality(sales.length, avgDaysOnMarket)
        }
      });

      logger.info(`Updated neighborhood statistics for ${zipCode}: median $${medianHomePrice.toLocaleString()}`);
    } catch (error: any) {
      logger.error(`Failed to update neighborhood statistics for ${zipCode}:`, error);
      throw error;
    }
  }

  /**
   * Get sales for a specific quarter (0 = current, 1 = last quarter, etc.)
   */
  private getQuarterSales(sales: any[], quartersBack: number): number[] {
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setMonth(targetDate.getMonth() - (quartersBack * 3));

    const quarterStart = startOfQuarter(targetDate);
    const quarterEnd = endOfQuarter(targetDate);

    return sales
      .filter(s => s.saleDate >= quarterStart && s.saleDate <= quarterEnd)
      .map(s => Number(s.salePrice));
  }

  /**
   * Calculate price change percentage between two periods
   */
  private calculatePriceChange(currentPrices: number[], previousPrices: number[]): number {
    if (currentPrices.length === 0 || previousPrices.length === 0) return 0;

    const currentAvg = currentPrices.reduce((sum, p) => sum + p, 0) / currentPrices.length;
    const previousAvg = previousPrices.reduce((sum, p) => sum + p, 0) / previousPrices.length;

    return ((currentAvg - previousAvg) / previousAvg) * 100;
  }

  /**
   * Calculate data quality score based on sample size and recency
   */
  private calculateDataQuality(salesCount: number, avgDaysOnMarket: number): number {
    // Factor 1: Sample size (more sales = higher quality)
    const sampleScore = Math.min((salesCount / 50) * 50, 50);

    // Factor 2: Market liquidity (faster sales = more accurate pricing)
    const liquidityScore = avgDaysOnMarket > 0
      ? Math.max(0, 50 - (avgDaysOnMarket / 10))
      : 25;

    return Math.min(Math.round(sampleScore + liquidityScore), 100);
  }

  /**
   * Create neighborhood activity alert
   */
  async createNeighborhoodAlert(propertyId: string): Promise<void> {
    const activity = await this.getNeighborhoodActivity(propertyId);

    if (activity.newListings.length >= 5 || activity.recentSales.length >= 5) {
      const property = await db.property.findUnique({
        where: { id: propertyId }
      });

      if (!property) return;

      await db.propertyAlert.create({
        data: {
          propertyId,
          subscriberId: property.subscriberId || undefined,
          type: 'NEIGHBORHOOD_ACTIVITY',
          severity: 'INFO',
          title: 'High Activity in Your Neighborhood',
          message: `There have been ${activity.newListings.length} new listings and ${activity.recentSales.length} recent sales near ${property.address} in the last 30 days.`,
          status: 'ACTIVE',
          metadata: {
            newListings: activity.newListings.length,
            recentSales: activity.recentSales.length,
            avgSalePrice: activity.marketMetrics.averageSalePrice
          }
        }
      });
    }
  }

  /**
   * Batch update all neighborhoods
   */
  async batchUpdateNeighborhoods(zipCodes: string[]): Promise<void> {
    logger.info(`Starting batch neighborhood update for ${zipCodes.length} zip codes`);

    for (const zipCode of zipCodes) {
      try {
        await this.updateNeighborhoodStatistics(zipCode);
      } catch (error) {
        logger.error(`Failed to update neighborhood ${zipCode}:`, error);
      }
    }

    logger.info(`Completed batch neighborhood update`);
  }
}

// Export singleton instance
export const marketIntelligenceService = new MarketIntelligenceService();
