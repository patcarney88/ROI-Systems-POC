/**
 * SoftPro Integration Routes
 *
 * All routes for SoftPro 360 integration management
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.enhanced';
import {
  connectSoftPro,
  softProCallback,
  disconnectSoftPro,
  getIntegrationStatus,
  syncTransactions,
  syncContacts,
  getSyncLogs,
  updateMappings,
  getMappings,
} from '../controllers/softpro-integration.controller';

const router = Router();

// OAuth flow
router.post('/connect', authenticateToken, connectSoftPro);
router.get('/callback', softProCallback);
router.delete('/disconnect/:integrationId', authenticateToken, disconnectSoftPro);

// Status and configuration
router.get('/status', authenticateToken, getIntegrationStatus);
router.get('/mappings', authenticateToken, getMappings);
router.put('/mappings', authenticateToken, updateMappings);

// Manual sync operations
router.post('/sync/transactions', authenticateToken, syncTransactions);
router.post('/sync/contacts', authenticateToken, syncContacts);
router.get('/sync/logs', authenticateToken, getSyncLogs);

export default router;
