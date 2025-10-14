/**
 * Property Intelligence API Routes
 * Comprehensive routes for property valuation, market intelligence, and financial calculations
 */

import { Router } from 'express';
import * as controller from '../controllers/property-intelligence.controller';

const router = Router();

// ============================================================================
// PROPERTY VALUATION ROUTES
// ============================================================================

/**
 * @route   GET /api/properties/:id/valuation
 * @desc    Get property valuation with confidence scoring
 * @query   refresh=true to force new valuation
 * @access  Private
 */
router.get('/properties/:id/valuation', controller.getPropertyValuation);

/**
 * @route   GET /api/properties/:id/valuation-history
 * @desc    Get historical valuations for property
 * @query   limit=20 (default)
 * @access  Private
 */
router.get('/properties/:id/valuation-history', controller.getValuationHistory);

/**
 * @route   GET /api/properties/:id/comparables
 * @desc    Get comparable sales analysis
 * @query   limit=10 (default)
 * @access  Private
 */
router.get('/properties/:id/comparables', controller.getComparableSales);

// ============================================================================
// FINANCIAL CALCULATION ROUTES
// ============================================================================

/**
 * @route   GET /api/properties/:id/equity
 * @desc    Get current equity snapshot
 * @access  Private
 */
router.get('/properties/:id/equity', controller.getEquitySnapshot);

/**
 * @route   GET /api/properties/:id/refinance
 * @desc    Get refinance analysis and recommendations
 * @query   rate=4.5 (optional custom rate)
 * @access  Private
 */
router.get('/properties/:id/refinance', controller.getRefinanceAnalysis);

/**
 * @route   GET /api/properties/:id/amortization
 * @desc    Get mortgage amortization schedule
 * @query   all=true to include past payments
 * @access  Private
 */
router.get('/properties/:id/amortization', controller.getAmortizationSchedule);

/**
 * @route   GET /api/properties/:id/payment-breakdown
 * @desc    Get monthly payment breakdown (P&I, taxes, insurance, HOA)
 * @access  Private
 */
router.get('/properties/:id/payment-breakdown', controller.getPaymentBreakdown);

/**
 * @route   GET /api/properties/:id/financial-history
 * @desc    Get historical financial snapshots
 * @query   limit=12 (default)
 * @access  Private
 */
router.get('/properties/:id/financial-history', controller.getFinancialHistory);

// ============================================================================
// MARKET INTELLIGENCE ROUTES
// ============================================================================

/**
 * @route   GET /api/neighborhoods/:id/activity
 * @desc    Get neighborhood activity (new listings, sales, metrics)
 * @access  Private
 */
router.get('/neighborhoods/:id/activity', controller.getNeighborhoodActivity);

/**
 * @route   GET /api/neighborhoods/:zipCode/stats
 * @desc    Get neighborhood statistics by ZIP code
 * @access  Public
 */
router.get('/neighborhoods/:zipCode/stats', controller.getNeighborhoodStats);

// ============================================================================
// MAINTENANCE TRACKING ROUTES
// ============================================================================

/**
 * @route   GET /api/properties/:id/maintenance
 * @desc    Get maintenance schedule for property
 * @access  Private
 */
router.get('/properties/:id/maintenance', controller.getMaintenanceSchedule);

/**
 * @route   GET /api/properties/:id/seasonal-reminders
 * @desc    Get seasonal maintenance reminders
 * @access  Private
 */
router.get('/properties/:id/seasonal-reminders', controller.getSeasonalReminders);

/**
 * @route   POST /api/properties/:id/maintenance
 * @desc    Add custom maintenance item
 * @body    { title, description, category, priority, frequency, nextDueDate, estimatedCost }
 * @access  Private
 */
router.post('/properties/:id/maintenance', controller.addMaintenanceItem);

/**
 * @route   POST /api/maintenance/:id/complete
 * @desc    Mark maintenance item as completed
 * @body    { actualCost, notes }
 * @access  Private
 */
router.post('/maintenance/:id/complete', controller.completeMaintenanceItem);

/**
 * @route   GET /api/properties/:id/maintenance-costs
 * @desc    Get maintenance cost history
 * @access  Private
 */
router.get('/properties/:id/maintenance-costs', controller.getMaintenanceCostHistory);

// ============================================================================
// PROPERTY TRACKING & ALERTS
// ============================================================================

/**
 * @route   POST /api/properties/:id/track
 * @desc    Enable comprehensive property tracking
 * @access  Private
 */
router.post('/properties/:id/track', controller.enablePropertyTracking);

/**
 * @route   GET /api/properties/:id/alerts
 * @desc    Get property alerts
 * @query   status=ACTIVE (default)
 * @access  Private
 */
router.get('/properties/:id/alerts', controller.getPropertyAlerts);

/**
 * @route   POST /api/alerts/:id/dismiss
 * @desc    Dismiss an alert
 * @access  Private
 */
router.post('/alerts/:id/dismiss', controller.dismissAlert);

// ============================================================================
// DASHBOARD ROUTES
// ============================================================================

/**
 * @route   GET /api/properties/:id/dashboard
 * @desc    Get comprehensive property dashboard data
 * @returns Property details, valuation, equity, refinance, neighborhood, maintenance, alerts
 * @access  Private
 */
router.get('/properties/:id/dashboard', controller.getPropertyDashboard);

export default router;
