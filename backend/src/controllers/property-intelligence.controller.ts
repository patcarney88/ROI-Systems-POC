/**
 * Property Intelligence API Controller
 * Handles all property intelligence, market analysis, and financial calculation endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { avmService } from '../services/avm.service';
import { marketIntelligenceService } from '../services/market-intelligence.service';
import { financialService } from '../services/financial.service';
import { maintenanceService } from '../services/maintenance.service';
import { createLogger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const logger = createLogger('property-intelligence-controller');
const db = new PrismaClient();

/**
 * Get property valuation with confidence scoring
 * GET /api/properties/:id/valuation
 */
export const getPropertyValuation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const forceRefresh = req.query.refresh === 'true';

    logger.info(`Getting valuation for property ${id}`);

    const valuation = await avmService.getPropertyValuation({
      propertyId: id,
      forceRefresh
    });

    res.json({
      success: true,
      data: valuation
    });
  } catch (error: any) {
    logger.error('Failed to get property valuation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get comparable sales analysis
 * GET /api/properties/:id/comparables
 */
export const getComparableSales = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const comparables = await db.comparableSale.findMany({
      where: {
        propertyId: id,
        status: 'ACTIVE'
      },
      orderBy: [
        { similarityScore: 'desc' },
        { saleDate: 'desc' }
      ],
      take: limit
    });

    res.json({
      success: true,
      data: {
        comparables: comparables.map(c => ({
          address: c.address,
          city: c.city,
          state: c.state,
          zipCode: c.zipCode,
          distanceMiles: c.distanceMiles,
          saleDate: c.saleDate,
          salePrice: Number(c.salePrice),
          pricePerSqFt: Number(c.pricePerSqFt),
          squareFeet: c.squareFeet,
          bedrooms: c.bedrooms,
          bathrooms: c.bathrooms,
          daysOnMarket: c.daysOnMarket,
          similarityScore: c.similarityScore
        })),
        count: comparables.length
      }
    });
  } catch (error: any) {
    logger.error('Failed to get comparable sales:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get current equity snapshot
 * GET /api/properties/:id/equity
 */
export const getEquitySnapshot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const equity = await financialService.getEquitySnapshot(id);

    res.json({
      success: true,
      data: equity
    });
  } catch (error: any) {
    logger.error('Failed to get equity snapshot:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get refinance analysis
 * GET /api/properties/:id/refinance
 */
export const getRefinanceAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const newRate = req.query.rate ? parseFloat(req.query.rate as string) : undefined;

    const analysis = await financialService.analyzeRefinanceOpportunity(id, newRate);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    logger.error('Failed to get refinance analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get amortization schedule
 * GET /api/properties/:id/amortization
 */
export const getAmortizationSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const includeAll = req.query.all === 'true';

    const schedule = await financialService.generateAmortizationSchedule(id, includeAll);

    res.json({
      success: true,
      data: {
        schedule,
        count: schedule.length
      }
    });
  } catch (error: any) {
    logger.error('Failed to get amortization schedule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get monthly payment breakdown
 * GET /api/properties/:id/payment-breakdown
 */
export const getPaymentBreakdown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const breakdown = await financialService.getMonthlyPaymentBreakdown(id);

    res.json({
      success: true,
      data: breakdown
    });
  } catch (error: any) {
    logger.error('Failed to get payment breakdown:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get neighborhood activity
 * GET /api/neighborhoods/:id/activity
 */
export const getNeighborhoodActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const activity = await marketIntelligenceService.getNeighborhoodActivity(id);

    res.json({
      success: true,
      data: activity
    });
  } catch (error: any) {
    logger.error('Failed to get neighborhood activity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get neighborhood statistics
 * GET /api/neighborhoods/:zipCode/stats
 */
export const getNeighborhoodStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { zipCode } = req.params;

    const stats = await db.neighborhoodStats.findUnique({
      where: { zipCode }
    });

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Neighborhood statistics not found'
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Failed to get neighborhood stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get maintenance schedule
 * GET /api/properties/:id/maintenance
 */
export const getMaintenanceSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const schedule = await maintenanceService.getMaintenanceSchedule(id);

    res.json({
      success: true,
      data: schedule
    });
  } catch (error: any) {
    logger.error('Failed to get maintenance schedule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get seasonal maintenance reminders
 * GET /api/properties/:id/seasonal-reminders
 */
export const getSeasonalReminders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const reminders = await maintenanceService.getSeasonalReminders(id);

    res.json({
      success: true,
      data: reminders
    });
  } catch (error: any) {
    logger.error('Failed to get seasonal reminders:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Complete maintenance item
 * POST /api/maintenance/:id/complete
 */
export const completeMaintenanceItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { actualCost, notes } = req.body;

    await maintenanceService.completeMaintenanceItem(id, actualCost, notes);

    res.json({
      success: true,
      message: 'Maintenance item completed successfully'
    });
  } catch (error: any) {
    logger.error('Failed to complete maintenance item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Add custom maintenance item
 * POST /api/properties/:id/maintenance
 */
export const addMaintenanceItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const itemData = req.body;

    const itemId = await maintenanceService.addMaintenanceItem(id, itemData);

    res.status(201).json({
      success: true,
      data: { id: itemId },
      message: 'Maintenance item added successfully'
    });
  } catch (error: any) {
    logger.error('Failed to add maintenance item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Enable property tracking
 * POST /api/properties/:id/track
 */
export const enablePropertyTracking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Initialize property tracking
    await maintenanceService.initializePropertyMaintenance(id);

    // Update property tracking flag
    await db.property.update({
      where: { id },
      data: { trackingEnabled: true }
    });

    // Create initial valuation
    await avmService.getPropertyValuation({ propertyId: id, forceRefresh: true });

    // Create initial financial snapshot
    await financialService.createFinancialSnapshot(id);

    res.json({
      success: true,
      message: 'Property tracking enabled successfully'
    });
  } catch (error: any) {
    logger.error('Failed to enable property tracking:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get property alerts
 * GET /api/properties/:id/alerts
 */
export const getPropertyAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const status = req.query.status as string || 'ACTIVE';

    const alerts = await db.propertyAlert.findMany({
      where: {
        propertyId: id,
        status: status as any
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length
      }
    });
  } catch (error: any) {
    logger.error('Failed to get property alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Dismiss alert
 * POST /api/alerts/:id/dismiss
 */
export const dismissAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await db.propertyAlert.update({
      where: { id },
      data: {
        status: 'DISMISSED',
        dismissedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Alert dismissed successfully'
    });
  } catch (error: any) {
    logger.error('Failed to dismiss alert:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get property financial history
 * GET /api/properties/:id/financial-history
 */
export const getFinancialHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 12;

    const snapshots = await db.financialSnapshot.findMany({
      where: { propertyId: id },
      orderBy: { snapshotDate: 'desc' },
      take: limit
    });

    res.json({
      success: true,
      data: {
        snapshots: snapshots.reverse(), // Oldest first for charting
        count: snapshots.length
      }
    });
  } catch (error: any) {
    logger.error('Failed to get financial history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get property valuation history
 * GET /api/properties/:id/valuation-history
 */
export const getValuationHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const valuations = await db.propertyValuation.findMany({
      where: { propertyId: id },
      orderBy: { valuationDate: 'desc' },
      take: limit
    });

    res.json({
      success: true,
      data: {
        valuations: valuations.reverse().map(v => ({
          date: v.valuationDate,
          value: Number(v.estimatedValue),
          lowEstimate: Number(v.lowEstimate),
          highEstimate: Number(v.highEstimate),
          confidenceScore: v.confidenceScore,
          source: v.source,
          quarterOverQuarter: v.quarterOverQuarter,
          yearOverYear: v.yearOverYear
        })),
        count: valuations.length
      }
    });
  } catch (error: any) {
    logger.error('Failed to get valuation history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get maintenance cost history
 * GET /api/properties/:id/maintenance-costs
 */
export const getMaintenanceCostHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const history = await maintenanceService.getMaintenanceCostHistory(id);

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    logger.error('Failed to get maintenance cost history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get comprehensive property dashboard data
 * GET /api/properties/:id/dashboard
 */
export const getPropertyDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Fetch all dashboard data in parallel
    const [
      property,
      valuation,
      equity,
      refinance,
      neighborhood,
      maintenance,
      alerts
    ] = await Promise.all([
      db.property.findUnique({ where: { id } }),
      avmService.getPropertyValuation({ propertyId: id }),
      financialService.getEquitySnapshot(id),
      financialService.analyzeRefinanceOpportunity(id),
      marketIntelligenceService.getNeighborhoodActivity(id),
      maintenanceService.getMaintenanceSchedule(id),
      db.propertyAlert.findMany({
        where: { propertyId: id, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    res.json({
      success: true,
      data: {
        property: {
          id: property?.id,
          address: property?.address,
          city: property?.city,
          state: property?.state,
          zipCode: property?.zipCode,
          propertyType: property?.propertyType,
          yearBuilt: property?.yearBuilt,
          squareFeet: property?.squareFeet,
          bedrooms: property?.bedrooms,
          bathrooms: property?.bathrooms
        },
        valuation,
        equity,
        refinance,
        neighborhood: {
          zipCode: neighborhood.zipCode,
          newListings: neighborhood.newListings.length,
          recentSales: neighborhood.recentSales.length,
          marketMetrics: neighborhood.marketMetrics,
          priceTrends: neighborhood.priceTrends
        },
        maintenance: {
          upcoming: maintenance.upcoming.length,
          overdue: maintenance.overdue.length,
          totalEstimatedCost: maintenance.totalEstimatedCost
        },
        alerts: alerts.map(a => ({
          id: a.id,
          type: a.type,
          severity: a.severity,
          title: a.title,
          message: a.message,
          createdAt: a.createdAt
        }))
      }
    });
  } catch (error: any) {
    logger.error('Failed to get property dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
