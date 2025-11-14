/**
 * Campaign Routes - Demo API Endpoints
 *
 * RESTful API endpoints for campaign management demo.
 */

import { Router, Request, Response } from 'express';
import { CampaignEngine, CampaignType, CampaignChannel, CampaignStatus } from '../services/campaign/campaign.engine';
import { mockEmailService } from '../services/email/email.service.mock';
import { mockSMSService } from '../services/sms/sms.service.mock';

const router = Router();

// Initialize campaign engine with mock services
const campaignEngine = new CampaignEngine(
  mockEmailService as any,
  mockSMSService as any
);

// Demo data - realistic recipients
const demoRecipients = [
  {
    id: 'rec_001',
    email: 'john.smith@example.com',
    phone: '+14155551001',
    firstName: 'John',
    lastName: 'Smith',
    timezone: 'America/Los_Angeles',
    metadata: {
      location: 'San Francisco, CA',
      propertyCount: 3,
      lastActivity: '2025-01-10'
    },
    preferences: {
      emailEnabled: true,
      smsEnabled: true,
      preferredTime: 'morning'
    }
  },
  {
    id: 'rec_002',
    email: 'sarah.johnson@example.com',
    phone: '+14155551002',
    firstName: 'Sarah',
    lastName: 'Johnson',
    timezone: 'America/New_York',
    metadata: {
      location: 'New York, NY',
      propertyCount: 5,
      lastActivity: '2025-01-12'
    },
    preferences: {
      emailEnabled: true,
      smsEnabled: false,
      preferredTime: 'afternoon'
    }
  },
  {
    id: 'rec_003',
    email: 'michael.chen@example.com',
    phone: '+14155551003',
    firstName: 'Michael',
    lastName: 'Chen',
    timezone: 'America/Los_Angeles',
    metadata: {
      location: 'Los Angeles, CA',
      propertyCount: 2,
      lastActivity: '2025-01-11'
    },
    preferences: {
      emailEnabled: true,
      smsEnabled: true,
      preferredTime: 'evening'
    }
  }
];

/**
 * GET /api/v1/campaigns
 * List all campaigns
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const campaigns = campaignEngine.getAllCampaigns();

    res.json({
      success: true,
      data: campaigns,
      meta: {
        total: campaigns.length,
        page: 1,
        limit: 20
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CAMPAIGN_LIST_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/v1/campaigns
 * Create a new campaign
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      type = CampaignType.PROPERTY_UPDATES,
      channel = CampaignChannel.EMAIL,
      useSmartTiming = true,
      personalizationLevel = 'ai-powered',
      targetOpenRate = 0.50
    } = req.body;

    const campaignId = `campaign_${Date.now()}`;

    await campaignEngine.createCampaign({
      id: campaignId,
      name,
      description,
      type,
      channel,
      useSmartTiming,
      enablePersonalization: true,
      personalizationLevel,
      templateId: `${type}-v1`,
      recipients: demoRecipients,
      targetOpenRate,
      targetClickRate: 0.15,
      trackOpens: true,
      trackClicks: true,
      trackConversions: true,
      maxSendsPerHour: 1000,
      batchSize: 100,
      status: CampaignStatus.RUNNING
    });

    res.status(201).json({
      success: true,
      data: {
        campaignId,
        status: 'created',
        message: 'Campaign created and started successfully'
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CAMPAIGN_CREATE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/v1/campaigns/demo/quick-start
 * Quick demo campaign creation
 */
router.get('/quick-start', async (req: Request, res: Response) => {
  try {
    const campaignId = `demo_${Date.now()}`;

    // Create a demo property updates campaign
    await campaignEngine.createCampaign({
      id: campaignId,
      name: 'Demo: Weekly Property Updates',
      description: 'Automated weekly property updates for demo',
      type: CampaignType.PROPERTY_UPDATES,
      channel: CampaignChannel.EMAIL,
      useSmartTiming: true,
      enablePersonalization: true,
      personalizationLevel: 'ai-powered',
      templateId: 'property-updates-v1',
      recipients: demoRecipients,
      targetOpenRate: 0.52,
      targetClickRate: 0.15,
      trackOpens: true,
      trackClicks: true,
      trackConversions: true,
      maxSendsPerHour: 1000,
      batchSize: 100,
      status: CampaignStatus.RUNNING
    });

    // Wait a moment for some events to process
    await new Promise(resolve => setTimeout(resolve, 500));

    const metrics = await campaignEngine.getCampaignMetrics(campaignId);

    res.json({
      success: true,
      data: {
        campaignId,
        metrics,
        message: 'Demo campaign created and running'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DEMO_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/v1/campaigns/demo/stats/overview
 * Get overall campaign statistics
 */
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const campaigns = campaignEngine.getAllCampaigns();

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === CampaignStatus.RUNNING).length;
    const completedCampaigns = campaigns.filter(c => c.status === CampaignStatus.COMPLETED).length;

    // Aggregate metrics across all campaigns
    let totalSent = 0;
    let totalOpened = 0;
    let totalClicked = 0;

    for (const campaign of campaigns) {
      const metrics = await campaignEngine.getCampaignMetrics(campaign.id);
      totalSent += metrics.sent;
      totalOpened += metrics.opened;
      totalClicked += metrics.clicked;
    }

    const avgOpenRate = totalSent > 0 ? totalOpened / totalSent : 0;
    const avgClickRate = totalSent > 0 ? totalClicked / totalSent : 0;

    res.json({
      success: true,
      data: {
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
        totalSent,
        totalOpened,
        totalClicked,
        avgOpenRate,
        avgClickRate
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/v1/campaigns/:id
 * Get campaign details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaigns = campaignEngine.getAllCampaigns();
    const campaign = campaigns.find(c => c.id === id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CAMPAIGN_NOT_FOUND',
          message: `Campaign ${id} not found`
        }
      });
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CAMPAIGN_FETCH_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/v1/campaigns/:id/metrics
 * Get campaign performance metrics
 */
router.get('/:id/metrics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const metrics = await campaignEngine.getCampaignMetrics(id);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_FETCH_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/v1/campaigns/:id/pause
 * Pause a running campaign
 */
router.post('/:id/pause', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await campaignEngine.pauseCampaign(id);

    res.json({
      success: true,
      data: {
        campaignId: id,
        status: 'paused'
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CAMPAIGN_PAUSE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/v1/campaigns/:id/resume
 * Resume a paused campaign
 */
router.post('/:id/resume', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await campaignEngine.resumeCampaign(id);

    res.json({
      success: true,
      data: {
        campaignId: id,
        status: 'running'
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CAMPAIGN_RESUME_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * DELETE /api/v1/campaigns/:id
 * Cancel a campaign
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await campaignEngine.cancelCampaign(id);

    res.json({
      success: true,
      data: {
        campaignId: id,
        status: 'cancelled'
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CAMPAIGN_CANCEL_ERROR',
        message: error.message
      }
    });
  }
});

export default router;
