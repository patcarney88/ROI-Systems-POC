/**
 * SoftPro Integration Controller
 *
 * Endpoints:
 * - POST /api/v1/integrations/softpro/connect - Initiate OAuth
 * - GET /api/v1/integrations/softpro/callback - OAuth callback
 * - DELETE /api/v1/integrations/softpro/disconnect - Revoke access
 * - GET /api/v1/integrations/softpro/status - Get connection status
 * - POST /api/v1/integrations/softpro/sync/transactions - Manual sync transactions
 * - POST /api/v1/integrations/softpro/sync/contacts - Manual sync contacts
 * - GET /api/v1/integrations/softpro/sync/logs - Get sync logs
 * - PUT /api/v1/integrations/softpro/mappings - Update field mappings
 * - GET /api/v1/integrations/softpro/mappings - Get field mappings
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { createLogger } from '../utils/logger';
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  revokeAccess,
} from '../services/softpro-oauth.service';
import {
  syncAllTransactions,
  syncAllContacts,
} from '../services/softpro-sync.service';

const logger = createLogger('softpro-integration-controller');
const prisma = new PrismaClient();

/**
 * Initiate OAuth connection
 * POST /api/v1/integrations/softpro/connect
 */
export const connectSoftPro = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.body;
  const userId = (req as any).user?.userId;

  if (!organizationId) {
    throw new AppError(400, 'MISSING_ORGANIZATION_ID', 'Organization ID is required');
  }

  const authUrl = await getAuthorizationUrl(organizationId);

  res.json({
    success: true,
    data: {
      authorizationUrl: authUrl,
    },
  });
});

/**
 * OAuth callback
 * GET /api/v1/integrations/softpro/callback
 */
export const softProCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    throw new AppError(400, 'OAUTH_ERROR', `OAuth error: ${error}`);
  }

  if (!code || !state) {
    throw new AppError(400, 'INVALID_CALLBACK', 'Missing code or state parameter');
  }

  const stateData = await exchangeCodeForTokens(
    code as string,
    state as string
  );

  const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:5051');
  redirectUrl.searchParams.set('integration', 'softpro');
  redirectUrl.searchParams.set('status', 'connected');

  res.redirect(redirectUrl.toString());
});

/**
 * Disconnect integration
 * DELETE /api/v1/integrations/softpro/disconnect
 */
export const disconnectSoftPro = asyncHandler(
  async (req: Request, res: Response) => {
    const { integrationId } = req.params;

    await revokeAccess(integrationId);

    res.json({
      success: true,
      message: 'Integration disconnected successfully',
    });
  }
);

/**
 * Get integration status
 * GET /api/v1/integrations/softpro/status
 */
export const getIntegrationStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { organizationId } = req.query;

    const integration = await prisma.softProIntegration.findUnique({
      where: { organizationId: organizationId as string },
      select: {
        id: true,
        status: true,
        environment: true,
        lastSyncAt: true,
        lastErrorAt: true,
        lastErrorMessage: true,
        syncEnabled: true,
        syncFrequency: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: integration || { status: 'DISCONNECTED' },
    });
  }
);

/**
 * Manual sync transactions
 * POST /api/v1/integrations/softpro/sync/transactions
 */
export const syncTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const { integrationId } = req.body;

    const result = await syncAllTransactions(integrationId);

    res.json({
      success: true,
      data: result,
    });
  }
);

/**
 * Manual sync contacts
 * POST /api/v1/integrations/softpro/sync/contacts
 */
export const syncContacts = asyncHandler(async (req: Request, res: Response) => {
  const { integrationId } = req.body;

  const result = await syncAllContacts(integrationId);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get sync logs
 * GET /api/v1/integrations/softpro/sync/logs
 */
export const getSyncLogs = asyncHandler(async (req: Request, res: Response) => {
  const { integrationId } = req.query;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const logs = await prisma.syncLog.findMany({
    where: { integrationId: integrationId as string },
    orderBy: { startedAt: 'desc' },
    take: limit,
    skip: offset,
  });

  const total = await prisma.syncLog.count({
    where: { integrationId: integrationId as string },
  });

  res.json({
    success: true,
    data: logs,
    meta: {
      total,
      limit,
      offset,
    },
  });
});

/**
 * Update field mappings
 * PUT /api/v1/integrations/softpro/mappings
 */
export const updateMappings = asyncHandler(async (req: Request, res: Response) => {
  const { integrationId, mappings } = req.body;

  // Delete existing mappings
  await prisma.integrationMapping.deleteMany({
    where: { integrationId },
  });

  // Create new mappings
  const createdMappings = await prisma.integrationMapping.createMany({
    data: mappings.map((m: any) => ({
      integrationId,
      ...m,
    })),
  });

  res.json({
    success: true,
    message: 'Mappings updated successfully',
    data: createdMappings,
  });
});

/**
 * Get field mappings
 * GET /api/v1/integrations/softpro/mappings
 */
export const getMappings = asyncHandler(async (req: Request, res: Response) => {
  const { integrationId } = req.query;

  const mappings = await prisma.integrationMapping.findMany({
    where: { integrationId: integrationId as string },
    orderBy: [{ entityType: 'asc' }, { softproField: 'asc' }],
  });

  res.json({
    success: true,
    data: mappings,
  });
});
