/**
 * Mock API Layer for Demo Mode
 *
 * This file provides mock data and API responses when VITE_DEMO_MODE=true
 * Eliminates console errors from failed API calls during demos
 */

// Mock Documents
export const mockDocuments = [
  {
    id: '1',
    title: 'Property Title Insurance - 123 Main St',
    type: 'Title Insurance',
    status: 'active' as const,
    client: 'John Smith',
    uploadDate: '2025-01-15',
    expiryDate: '2026-01-15',
    size: '2.4 MB'
  },
  {
    id: '2',
    title: 'Escrow Agreement - 456 Oak Ave',
    type: 'Escrow',
    status: 'pending' as const,
    client: 'Sarah Johnson',
    uploadDate: '2025-01-14',
    expiryDate: '2025-02-14',
    size: '1.8 MB'
  },
  {
    id: '3',
    title: 'Deed of Trust - 789 Pine Rd',
    type: 'Deed',
    status: 'active' as const,
    client: 'Michael Chen',
    uploadDate: '2025-01-12',
    size: '1.2 MB'
  },
  {
    id: '4',
    title: 'Settlement Statement - 321 Elm St',
    type: 'Settlement',
    status: 'expiring' as const,
    client: 'Emily Rodriguez',
    uploadDate: '2024-12-20',
    expiryDate: '2025-01-20',
    size: '956 KB'
  },
  {
    id: '5',
    title: 'Title Report - 654 Maple Dr',
    type: 'Title Report',
    status: 'expired' as const,
    client: 'David Williams',
    uploadDate: '2024-11-15',
    expiryDate: '2024-12-15',
    size: '3.1 MB'
  }
];

// Mock Clients
export const mockClients = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    properties: 3,
    lastContact: '2025-01-15',
    engagementScore: 85,
    status: 'active' as const,
    notes: 'Preferred client, interested in investment properties'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '(555) 234-5678',
    properties: 1,
    lastContact: '2025-01-14',
    engagementScore: 72,
    status: 'active' as const,
    notes: 'First-time homebuyer'
  },
  {
    id: '3',
    name: 'Michael Chen',
    email: 'mchen@email.com',
    phone: '(555) 345-6789',
    properties: 2,
    lastContact: '2025-01-10',
    engagementScore: 65,
    status: 'at-risk' as const,
    notes: 'Has not responded to last 2 follow-ups'
  },
  {
    id: '4',
    name: 'Emily Rodriguez',
    email: 'emily.r@email.com',
    phone: '(555) 456-7890',
    properties: 5,
    lastContact: '2024-12-28',
    engagementScore: 45,
    status: 'at-risk' as const,
    notes: 'Previously active, engagement dropping'
  },
  {
    id: '5',
    name: 'David Williams',
    email: 'dwilliams@email.com',
    phone: '(555) 567-8901',
    properties: 1,
    lastContact: '2024-11-15',
    engagementScore: 25,
    status: 'dormant' as const,
    notes: 'No contact in 2+ months, needs re-engagement campaign'
  },
  {
    id: '6',
    name: 'Jennifer Martinez',
    email: 'jmartinez@email.com',
    phone: '(555) 678-9012',
    properties: 4,
    lastContact: '2025-01-16',
    engagementScore: 92,
    status: 'active' as const,
    notes: 'VIP client, real estate investor'
  }
];

// Mock Campaigns
export const mockCampaigns = [
  {
    id: '1',
    name: 'Spring 2025 Market Update',
    description: 'Monthly newsletter with local real estate trends and market insights',
    status: 'active' as const,
    targetAudience: 'All Active Clients',
    scheduledDate: '2025-02-01',
    metrics: {
      sent: 245,
      opens: 182,
      clicks: 67
    }
  },
  {
    id: '2',
    name: 'First-Time Homebuyer Guide',
    description: 'Educational content series for new homebuyers',
    status: 'scheduled' as const,
    targetAudience: 'First-Time Buyers',
    scheduledDate: '2025-01-25',
    metrics: {
      sent: 0,
      opens: 0,
      clicks: 0
    }
  },
  {
    id: '3',
    name: 'Re-engagement Campaign',
    description: 'Win-back campaign for dormant clients',
    status: 'paused' as const,
    targetAudience: 'Dormant Clients',
    scheduledDate: '2025-01-20',
    metrics: {
      sent: 48,
      opens: 12,
      clicks: 3
    }
  },
  {
    id: '4',
    name: 'Holiday Thank You',
    description: 'End-of-year appreciation message to all clients',
    status: 'completed' as const,
    targetAudience: 'All Clients',
    scheduledDate: '2024-12-15',
    metrics: {
      sent: 312,
      opens: 267,
      clicks: 89
    }
  }
];

// Mock Leads
export const mockLeads = [
  {
    id: '1',
    name: 'Robert Taylor',
    email: 'rtaylor@email.com',
    phone: '(555) 789-0123',
    source: 'Website Form',
    status: 'new',
    created_at: '2025-01-17',
    property: {
      address: '888 Cherry Ln',
      price: 425000,
      type: 'Single Family'
    }
  },
  {
    id: '2',
    name: 'Lisa Anderson',
    email: 'landerson@email.com',
    phone: '(555) 890-1234',
    source: 'Referral',
    status: 'contacted',
    created_at: '2025-01-16',
    property: {
      address: '999 Birch St',
      price: 315000,
      type: 'Condo'
    }
  }
];

// Mock Stats
export const mockStats = {
  totalDocuments: 247,
  activeClients: 183,
  emailEngagement: 74.5,
  emailOpenRate: 68.2,
  timeSaved: 127,
  retentionRate: 85.3
};

// Simulate API delay for realism
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API Endpoints
export const mockApi = {
  // Document API
  documents: {
    getAll: async () => {
      await delay();
      return {
        success: true,
        data: mockDocuments
      };
    },
    getById: async (id: string) => {
      await delay();
      const doc = mockDocuments.find(d => d.id === id);
      return {
        success: !!doc,
        data: doc || null
      };
    },
    create: async (data: any) => {
      await delay();
      const newDoc = {
        id: String(mockDocuments.length + 1),
        ...data,
        uploadDate: new Date().toISOString().split('T')[0]
      };
      mockDocuments.push(newDoc);
      return {
        success: true,
        data: newDoc
      };
    },
    update: async (id: string, data: any) => {
      await delay();
      const index = mockDocuments.findIndex(d => d.id === id);
      if (index !== -1) {
        mockDocuments[index] = { ...mockDocuments[index], ...data };
        return {
          success: true,
          data: mockDocuments[index]
        };
      }
      return {
        success: false,
        error: 'Document not found'
      };
    },
    delete: async (id: string) => {
      await delay();
      const index = mockDocuments.findIndex(d => d.id === id);
      if (index !== -1) {
        mockDocuments.splice(index, 1);
        return {
          success: true
        };
      }
      return {
        success: false,
        error: 'Document not found'
      };
    }
  },

  // Client API
  clients: {
    getAll: async () => {
      await delay();
      return {
        success: true,
        data: mockClients
      };
    },
    getById: async (id: string) => {
      await delay();
      const client = mockClients.find(c => c.id === id);
      return {
        success: !!client,
        data: client || null
      };
    },
    create: async (data: any) => {
      await delay();
      const newClient = {
        id: String(mockClients.length + 1),
        ...data,
        lastContact: new Date().toISOString().split('T')[0],
        engagementScore: 75,
        status: 'active' as const
      };
      mockClients.push(newClient);
      return {
        success: true,
        data: newClient
      };
    },
    update: async (id: string, data: any) => {
      await delay();
      const index = mockClients.findIndex(c => c.id === id);
      if (index !== -1) {
        mockClients[index] = { ...mockClients[index], ...data };
        return {
          success: true,
          data: mockClients[index]
        };
      }
      return {
        success: false,
        error: 'Client not found'
      };
    },
    delete: async (id: string) => {
      await delay();
      const index = mockClients.findIndex(c => c.id === id);
      if (index !== -1) {
        mockClients.splice(index, 1);
        return {
          success: true
        };
      }
      return {
        success: false,
        error: 'Client not found'
      };
    }
  },

  // Campaign API
  campaigns: {
    getAll: async () => {
      await delay();
      return {
        success: true,
        data: mockCampaigns
      };
    },
    getById: async (id: string) => {
      await delay();
      const campaign = mockCampaigns.find(c => c.id === id);
      return {
        success: !!campaign,
        data: campaign || null
      };
    },
    create: async (data: any) => {
      await delay();
      const newCampaign = {
        id: String(mockCampaigns.length + 1),
        ...data,
        metrics: { sent: 0, opens: 0, clicks: 0 }
      };
      mockCampaigns.push(newCampaign);
      return {
        success: true,
        data: newCampaign
      };
    },
    update: async (id: string, data: any) => {
      await delay();
      const index = mockCampaigns.findIndex(c => c.id === id);
      if (index !== -1) {
        mockCampaigns[index] = { ...mockCampaigns[index], ...data };
        return {
          success: true,
          data: mockCampaigns[index]
        };
      }
      return {
        success: false,
        error: 'Campaign not found'
      };
    },
    launch: async (id: string) => {
      await delay();
      const index = mockCampaigns.findIndex(c => c.id === id);
      if (index !== -1) {
        mockCampaigns[index].status = 'active';
        return {
          success: true,
          data: mockCampaigns[index]
        };
      }
      return {
        success: false,
        error: 'Campaign not found'
      };
    }
  },

  // Leads API
  leads: {
    getAll: async () => {
      await delay();
      return {
        success: true,
        data: mockLeads
      };
    }
  },

  // Stats API
  stats: {
    get: async () => {
      await delay();
      return {
        success: true,
        data: mockStats
      };
    }
  },

  // Subscription API (for the Supabase errors)
  subscription: {
    getStatus: async () => {
      await delay();
      return {
        success: true,
        data: {
          subscription_tier: 'professional',
          subscription_status: 'active',
          features: ['documents', 'clients', 'campaigns', 'analytics']
        }
      };
    }
  },

  // Notifications API
  notifications: {
    getAll: async () => {
      await delay();
      return {
        success: true,
        data: [
          {
            id: '1',
            title: 'New lead added',
            message: 'Robert Taylor submitted a contact form',
            type: 'info',
            read: false,
            created_at: '2025-01-17T10:30:00Z'
          },
          {
            id: '2',
            title: 'Document expiring soon',
            message: 'Settlement Statement for 321 Elm St expires in 3 days',
            type: 'warning',
            read: false,
            created_at: '2025-01-17T09:15:00Z'
          }
        ]
      };
    }
  }
};

export default mockApi;
