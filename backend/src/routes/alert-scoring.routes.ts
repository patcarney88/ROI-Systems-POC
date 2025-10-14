/**
 * Alert Scoring Routes
 * API routes for ML-powered alert generation and management
 */

import { Router } from 'express';
import * as alertScoringController from '../controllers/alert-scoring.controller';

const router = Router();

// Signal Processing & Scoring
router.post('/process-signals', alertScoringController.processUnprocessedSignals);
router.post('/score-user', alertScoringController.scoreUser);

// Alert Management
router.get('/user/:userId', alertScoringController.getUserAlerts);
router.get('/:id', alertScoringController.getAlert);
router.patch('/:id/status', alertScoringController.updateAlertStatus);
router.post('/:id/outcome', alertScoringController.recordAlertOutcome);

// Statistics & Analytics
router.get('/stats', alertScoringController.getAlertStats);

// Model Management
router.get('/models/performance', alertScoringController.getModelPerformance);
router.post('/models/reload', alertScoringController.reloadModels);

export default router;
