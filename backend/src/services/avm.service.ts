/**
 * Automated Valuation Model (AVM) Service
 * Provides property valuations with confidence scoring and multiple data source aggregation
 * Target: 95% accuracy vs. appraisals
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import axios from 'axios';

const logger = createLogger('avm-service');
const db = new PrismaClient();

export interface ValuationRequest {
  propertyId: string;
  forceRefresh?: boolean;
}

export interface ValuationResult {
  estimatedValue: number;
  lowEstimate: number;
  highEstimate: number;
  confidenceScore: number;
  sources: ValuationSource[];
  factors: ValuationFactors;
  comparables: ComparableProperty[];
}

export interface ValuationSource {
  source: string;
  value: number;
  weight: number;
  confidence: number;
  timestamp: Date;
}

export interface ValuationFactors {
  comparableCount: number;
  averageDaysOnMarket: number;
  pricePerSqFt: number;
  quarterOverQuarter: number;
  yearOverYear: number;
  neighborhoodTrend: number;
}

export interface ComparableProperty {
  address: string;
  distanceMiles: number;
  saleDate: Date;
  salePrice: number;
  pricePerSqFt: number;
  similarityScore: number;
  adjustedValue: number;
}

export class AVMService {
  /**
   * Get property valuation with multi-source aggregation
   */
  async getPropertyValuation(request: ValuationRequest): Promise<ValuationResult> {
    try {
      const property = await db.property.findUnique({
        where: { id: request.propertyId },
        include: {
          valuations: {
            orderBy: { valuationDate: 'desc' },
            take: 1
          },
          comparables: {
            where: { status: 'ACTIVE' },
            orderBy: { saleDate: 'desc' },
            take: 10
          }
        }
      });

      if (!property) {
        throw new Error(`Property not found: ${request.propertyId}`);
      }

      // Check if we need to refresh valuation (quarterly updates)
      const needsRefresh = this.needsValuationRefresh(
        property.valuations[0]?.valuationDate,
        request.forceRefresh
      );

      if (!needsRefresh && property.valuations[0]) {
        logger.info(`Using cached valuation for property ${request.propertyId}`);
        return this.formatValuationResult(property, property.valuations[0]);
      }

      logger.info(`Calculating new valuation for property ${request.propertyId}`);

      // Gather valuations from multiple sources
      const sources: ValuationSource[] = [];

      // 1. Internal AVM (Comparable Sales Analysis)
      const internalAVM = await this.calculateInternalAVM(property);
      if (internalAVM) {
        sources.push({
          source: 'INTERNAL_AVM',
          value: internalAVM.value,
          weight: 0.30,
          confidence: internalAVM.confidence,
          timestamp: new Date()
        });
      }

      // 2. Zillow Zestimate (if API available)
      const zillowEstimate = await this.getZillowEstimate(property);
      if (zillowEstimate) {
        sources.push({
          source: 'ZILLOW',
          value: zillowEstimate.value,
          weight: 0.20,
          confidence: zillowEstimate.confidence,
          timestamp: new Date()
        });
      }

      // 3. Redfin Estimate (if API available)
      const redfinEstimate = await this.getRedfinEstimate(property);
      if (redfinEstimate) {
        sources.push({
          source: 'REDFIN',
          value: redfinEstimate.value,
          weight: 0.20,
          confidence: redfinEstimate.confidence,
          timestamp: new Date()
        });
      }

      // 4. Tax Assessor Value
      const taxAssessorValue = await this.getTaxAssessorValue(property);
      if (taxAssessorValue) {
        sources.push({
          source: 'TAX_ASSESSOR',
          value: taxAssessorValue.value,
          weight: 0.15,
          confidence: taxAssessorValue.confidence,
          timestamp: new Date()
        });
      }

      // 5. Manual Appraisal (if available within 6 months)
      const recentAppraisal = await this.getRecentAppraisal(property);
      if (recentAppraisal) {
        sources.push({
          source: 'MANUAL_APPRAISAL',
          value: recentAppraisal.value,
          weight: 0.40, // Highest weight for professional appraisal
          confidence: 95,
          timestamp: recentAppraisal.timestamp
        });
      }

      // Calculate weighted average valuation
      const valuation = this.calculateWeightedValuation(sources);

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(sources, property);

      // Get valuation factors
      const factors = await this.calculateValuationFactors(property);

      // Get comparable properties
      const comparables = await this.getComparableProperties(property);

      // Save valuation to database
      await this.saveValuation(property.id, valuation, confidenceScore, factors, sources);

      // Check for significant value changes and create alerts
      await this.checkForValueChangeAlerts(property, valuation.estimatedValue);

      return {
        ...valuation,
        confidenceScore,
        sources,
        factors,
        comparables
      };
    } catch (error: any) {
      logger.error(`Failed to get property valuation for ${request.propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate internal AVM using comparable sales analysis
   */
  private async calculateInternalAVM(property: any): Promise<{ value: number; confidence: number } | null> {
    try {
      // Get recent comparable sales within 0.5 miles
      const comparables = await this.findComparableSales(property, 0.5, 90); // 90 days

      if (comparables.length < 3) {
        logger.warn(`Insufficient comparables for property ${property.id}`);
        return null;
      }

      // Calculate weighted average based on similarity and recency
      let totalWeight = 0;
      let weightedSum = 0;

      for (const comp of comparables) {
        // Adjust for square footage difference
        const sqftAdjustment = property.squareFeet ? property.squareFeet / comp.squareFeet : 1;
        const adjustedPrice = comp.salePrice * sqftAdjustment;

        // Weight based on similarity score and recency
        const recencyWeight = this.calculateRecencyWeight(comp.saleDate);
        const weight = comp.similarityScore * recencyWeight;

        weightedSum += adjustedPrice * weight;
        totalWeight += weight;
      }

      const estimatedValue = totalWeight > 0 ? weightedSum / totalWeight : 0;

      // Calculate confidence based on comparable count and similarity
      const avgSimilarity = comparables.reduce((sum, c) => sum + c.similarityScore, 0) / comparables.length;
      const confidence = Math.min(50 + (comparables.length * 5) + (avgSimilarity * 20), 85);

      return { value: estimatedValue, confidence };
    } catch (error) {
      logger.error('Internal AVM calculation failed:', error);
      return null;
    }
  }

  /**
   * Find comparable sales within radius and time period
   */
  private async findComparableSales(property: any, radiusMiles: number, daysBack: number): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const comparables = await db.comparableSale.findMany({
      where: {
        propertyId: property.id,
        saleDate: { gte: cutoffDate },
        distanceMiles: { lte: radiusMiles },
        status: 'ACTIVE'
      },
      orderBy: [
        { similarityScore: 'desc' },
        { saleDate: 'desc' }
      ],
      take: 10
    });

    return comparables;
  }

  /**
   * Calculate recency weight (more recent sales get higher weight)
   */
  private calculateRecencyWeight(saleDate: Date): number {
    const daysOld = (Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0.5, 1 - (daysOld / 180)); // Linear decay over 180 days
  }

  /**
   * Get Zillow Zestimate
   */
  private async getZillowEstimate(property: any): Promise<{ value: number; confidence: number } | null> {
    try {
      // Note: Requires Zillow API access (Bridge API or scraping)
      // This is a placeholder implementation
      const apiKey = process.env.ZILLOW_API_KEY;
      if (!apiKey) return null;

      const response = await axios.get('https://api.bridgedataoutput.com/api/v2/zestimates', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        params: {
          address: property.address,
          city: property.city,
          state: property.state,
          zipCode: property.zipCode
        },
        timeout: 10000
      });

      if (response.data?.zestimate) {
        return {
          value: response.data.zestimate,
          confidence: response.data.zestimateConfidence || 70
        };
      }

      return null;
    } catch (error) {
      logger.warn('Zillow estimate failed:', error);
      return null;
    }
  }

  /**
   * Get Redfin Estimate
   */
  private async getRedfinEstimate(property: any): Promise<{ value: number; confidence: number } | null> {
    try {
      // Note: Requires Redfin API or data partnership
      // This is a placeholder implementation
      return null;
    } catch (error) {
      logger.warn('Redfin estimate failed:', error);
      return null;
    }
  }

  /**
   * Get Tax Assessor Value
   */
  private async getTaxAssessorValue(property: any): Promise<{ value: number; confidence: number } | null> {
    try {
      // Note: Requires public records API integration
      // This is a placeholder implementation
      return null;
    } catch (error) {
      logger.warn('Tax assessor value failed:', error);
      return null;
    }
  }

  /**
   * Get recent manual appraisal (within 6 months)
   */
  private async getRecentAppraisal(property: any): Promise<{ value: number; timestamp: Date } | null> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const appraisal = await db.propertyValuation.findFirst({
      where: {
        propertyId: property.id,
        source: 'MANUAL_APPRAISAL',
        valuationDate: { gte: sixMonthsAgo }
      },
      orderBy: { valuationDate: 'desc' }
    });

    if (appraisal) {
      return {
        value: Number(appraisal.estimatedValue),
        timestamp: appraisal.valuationDate
      };
    }

    return null;
  }

  /**
   * Calculate weighted average valuation from multiple sources
   */
  private calculateWeightedValuation(sources: ValuationSource[]): {
    estimatedValue: number;
    lowEstimate: number;
    highEstimate: number;
  } {
    if (sources.length === 0) {
      throw new Error('No valuation sources available');
    }

    // Normalize weights to sum to 1
    const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);
    const normalizedSources = sources.map(s => ({
      ...s,
      weight: s.weight / totalWeight
    }));

    // Calculate weighted average
    const estimatedValue = normalizedSources.reduce(
      (sum, s) => sum + (s.value * s.weight),
      0
    );

    // Calculate standard deviation for confidence interval
    const variance = normalizedSources.reduce(
      (sum, s) => sum + (Math.pow(s.value - estimatedValue, 2) * s.weight),
      0
    );
    const stdDev = Math.sqrt(variance);

    // 95% confidence interval (±2 standard deviations)
    const lowEstimate = estimatedValue - (2 * stdDev);
    const highEstimate = estimatedValue + (2 * stdDev);

    return {
      estimatedValue: Math.round(estimatedValue),
      lowEstimate: Math.round(Math.max(lowEstimate, estimatedValue * 0.85)),
      highEstimate: Math.round(Math.min(highEstimate, estimatedValue * 1.15))
    };
  }

  /**
   * Calculate overall confidence score (0-100)
   */
  private calculateConfidenceScore(sources: ValuationSource[], property: any): number {
    if (sources.length === 0) return 0;

    // Factor 1: Number of sources (more is better)
    const sourceScore = Math.min(sources.length * 15, 40);

    // Factor 2: Average source confidence
    const avgConfidence = sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length;
    const confidenceScore = avgConfidence * 0.35;

    // Factor 3: Data quality
    const dataQualityScore = (property.dataQualityScore || 70) * 0.15;

    // Factor 4: Valuation variance (lower is better)
    const values = sources.map(s => s.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    const varianceScore = Math.max(0, 10 - (coefficientOfVariation * 100));

    const totalScore = sourceScore + confidenceScore + dataQualityScore + varianceScore;

    return Math.min(Math.round(totalScore), 100);
  }

  /**
   * Calculate valuation factors
   */
  private async calculateValuationFactors(property: any): Promise<ValuationFactors> {
    // Get comparable sales statistics
    const comparables = await db.comparableSale.findMany({
      where: {
        propertyId: property.id,
        status: 'ACTIVE'
      }
    });

    const comparableCount = comparables.length;
    const averageDaysOnMarket = comparables.length > 0
      ? comparables.reduce((sum, c) => sum + (c.daysOnMarket || 0), 0) / comparables.length
      : 0;

    const avgPricePerSqFt = comparables.length > 0
      ? comparables.reduce((sum, c) => sum + Number(c.pricePerSqFt), 0) / comparables.length
      : 0;

    // Get historical valuations for trends
    const historicalValuations = await db.propertyValuation.findMany({
      where: { propertyId: property.id },
      orderBy: { valuationDate: 'desc' },
      take: 5
    });

    let quarterOverQuarter = 0;
    let yearOverYear = 0;

    if (historicalValuations.length >= 2) {
      const current = Number(historicalValuations[0].estimatedValue);
      const quarter = Number(historicalValuations[1].estimatedValue);
      quarterOverQuarter = ((current - quarter) / quarter) * 100;
    }

    if (historicalValuations.length >= 5) {
      const current = Number(historicalValuations[0].estimatedValue);
      const year = Number(historicalValuations[4].estimatedValue);
      yearOverYear = ((current - year) / year) * 100;
    }

    // Get neighborhood trend
    const neighborhoodStats = await db.neighborhoodStats.findUnique({
      where: { zipCode: property.zipCode }
    });

    const neighborhoodTrend = neighborhoodStats?.priceChangeYoY || 0;

    return {
      comparableCount,
      averageDaysOnMarket: Math.round(averageDaysOnMarket),
      pricePerSqFt: Math.round(avgPricePerSqFt),
      quarterOverQuarter: Math.round(quarterOverQuarter * 100) / 100,
      yearOverYear: Math.round(yearOverYear * 100) / 100,
      neighborhoodTrend: Math.round((neighborhoodTrend || 0) * 100) / 100
    };
  }

  /**
   * Get comparable properties for display
   */
  private async getComparableProperties(property: any): Promise<ComparableProperty[]> {
    const comparables = await db.comparableSale.findMany({
      where: {
        propertyId: property.id,
        status: 'ACTIVE'
      },
      orderBy: [
        { similarityScore: 'desc' },
        { saleDate: 'desc' }
      ],
      take: 5
    });

    return comparables.map(c => ({
      address: c.address,
      distanceMiles: c.distanceMiles,
      saleDate: c.saleDate,
      salePrice: Number(c.salePrice),
      pricePerSqFt: Number(c.pricePerSqFt),
      similarityScore: c.similarityScore,
      adjustedValue: Number(c.adjustedValue || c.salePrice)
    }));
  }

  /**
   * Save valuation to database
   */
  private async saveValuation(
    propertyId: string,
    valuation: { estimatedValue: number; lowEstimate: number; highEstimate: number },
    confidenceScore: number,
    factors: ValuationFactors,
    sources: ValuationSource[]
  ): Promise<void> {
    try {
      // Get previous valuation for change calculation
      const previousValuation = await db.propertyValuation.findFirst({
        where: { propertyId },
        orderBy: { valuationDate: 'desc' }
      });

      let valueChange = 0;
      let valueChangePercent = 0;

      if (previousValuation) {
        valueChange = valuation.estimatedValue - Number(previousValuation.estimatedValue);
        valueChangePercent = (valueChange / Number(previousValuation.estimatedValue)) * 100;
      }

      // Create new valuation record
      await db.propertyValuation.create({
        data: {
          propertyId,
          estimatedValue: valuation.estimatedValue,
          lowEstimate: valuation.lowEstimate,
          highEstimate: valuation.highEstimate,
          confidenceScore,
          valuationDate: new Date(),
          source: 'INTERNAL_AVM',
          comparableCount: factors.comparableCount,
          averageDaysOnMarket: factors.averageDaysOnMarket,
          pricePerSqFt: factors.pricePerSqFt,
          valueChange,
          valueChangePercent,
          quarterOverQuarter: factors.quarterOverQuarter,
          yearOverYear: factors.yearOverYear,
          modelVersion: '1.0',
          calculationMethod: 'Weighted Multi-Source AVM',
          metadata: {
            sources: sources.map(s => ({
              source: s.source,
              value: s.value,
              weight: s.weight,
              confidence: s.confidence
            }))
          }
        }
      });

      // Update property current value
      await db.property.update({
        where: { id: propertyId },
        data: {
          currentValue: valuation.estimatedValue,
          lastValuationDate: new Date(),
          valuationConfidence: confidenceScore,
          lastDataUpdate: new Date()
        }
      });

      logger.info(`Saved valuation for property ${propertyId}: $${valuation.estimatedValue}`);
    } catch (error) {
      logger.error('Failed to save valuation:', error);
      throw error;
    }
  }

  /**
   * Check if property valuation needs refresh (quarterly)
   */
  private needsValuationRefresh(lastValuationDate?: Date, forceRefresh?: boolean): boolean {
    if (forceRefresh) return true;
    if (!lastValuationDate) return true;

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return lastValuationDate < threeMonthsAgo;
  }

  /**
   * Check for significant value changes and create alerts
   */
  private async checkForValueChangeAlerts(property: any, newValue: number): Promise<void> {
    if (!property.currentValue) return;

    const oldValue = Number(property.currentValue);
    const changePercent = ((newValue - oldValue) / oldValue) * 100;

    // Create alert if change is ±5% or more
    if (Math.abs(changePercent) >= 5) {
      const alertType = changePercent > 0 ? 'VALUE_INCREASE' : 'VALUE_DECREASE';
      const severity = Math.abs(changePercent) >= 10 ? 'WARNING' : 'INFO';

      await db.propertyAlert.create({
        data: {
          propertyId: property.id,
          subscriberId: property.subscriberId,
          type: alertType,
          severity: severity as any,
          title: `Property Value ${changePercent > 0 ? 'Increased' : 'Decreased'}`,
          message: `Your property at ${property.address} has ${changePercent > 0 ? 'increased' : 'decreased'} in value by ${Math.abs(changePercent).toFixed(1)}% (from $${oldValue.toLocaleString()} to $${newValue.toLocaleString()}).`,
          triggerValue: newValue,
          thresholdValue: oldValue,
          changePercent,
          status: 'ACTIVE'
        }
      });

      logger.info(`Created value change alert for property ${property.id}: ${changePercent.toFixed(1)}%`);
    }
  }

  /**
   * Format valuation result for API response
   */
  private formatValuationResult(property: any, valuation: any): ValuationResult {
    return {
      estimatedValue: Number(valuation.estimatedValue),
      lowEstimate: Number(valuation.lowEstimate),
      highEstimate: Number(valuation.highEstimate),
      confidenceScore: valuation.confidenceScore,
      sources: valuation.metadata?.sources || [],
      factors: {
        comparableCount: valuation.comparableCount || 0,
        averageDaysOnMarket: valuation.averageDaysOnMarket || 0,
        pricePerSqFt: Number(valuation.pricePerSqFt || 0),
        quarterOverQuarter: valuation.quarterOverQuarter || 0,
        yearOverYear: valuation.yearOverYear || 0,
        neighborhoodTrend: 0
      },
      comparables: []
    };
  }

  /**
   * Batch update valuations for multiple properties
   */
  async batchUpdateValuations(propertyIds: string[]): Promise<void> {
    logger.info(`Starting batch valuation update for ${propertyIds.length} properties`);

    for (const propertyId of propertyIds) {
      try {
        await this.getPropertyValuation({ propertyId, forceRefresh: true });
      } catch (error) {
        logger.error(`Failed to update valuation for property ${propertyId}:`, error);
      }
    }

    logger.info(`Completed batch valuation update`);
  }
}

// Export singleton instance
export const avmService = new AVMService();
