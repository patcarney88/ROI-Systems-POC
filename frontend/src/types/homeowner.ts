// Homeowner Dashboard Types
// ROI Systems - Consumer-Grade Homeowner Portal

export type ValueTrend = 'up' | 'down' | 'stable';

export type TimeRange = '1M' | '6M' | '1Y' | 'ALL';

export type DocumentCategory = 
  | 'Closing Documents'
  | 'Tax Documents'
  | 'Insurance'
  | 'Warranties'
  | 'Improvements'
  | 'Other';

export type NotificationType = 
  | 'maintenance'
  | 'insurance_renewal'
  | 'tax_due'
  | 'warranty_expiration'
  | 'market_opportunity'
  | 'milestone';

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  imageUrl?: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lotSize?: number;
  yearBuilt: number;
  propertyType: 'Single Family' | 'Condo' | 'Townhouse' | 'Multi-Family';
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  lastUpdated: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ValueData {
  date: string;
  value: number;
  source: 'automated' | 'manual' | 'appraisal';
}

export interface EquityData {
  date: string;
  equity: number;
  mortgageBalance: number;
  homeValue: number;
  equityPercentage: number;
}

export interface ValueTracker {
  property: Property;
  currentValue: number;
  previousValue: number;
  valueChange: number;
  valueChangePercentage: number;
  trend: ValueTrend;
  monthlyChange: number;
  yearlyChange: number;
  valueHistory: ValueData[];
  equityHistory: EquityData[];
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  type: 'equity_20' | 'equity_50' | 'value_increase' | 'refinance_opportunity' | 'market_peak' | 'market_valley';
  title: string;
  description: string;
  achievedAt?: string;
  targetValue?: number;
  currentValue?: number;
  progress?: number; // percentage
  icon: string;
  color: string;
  actionable: boolean;
  action?: string;
}

export interface MortgageInfo {
  lender: string;
  loanType: string;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  monthlyPayment: number;
  startDate: string;
  maturityDate: string;
  remainingPayments: number;
  principalPaid: number;
  interestPaid: number;
  pmiRequired: boolean;
  pmiAmount?: number;
}

export interface DocumentVault {
  categories: DocumentCategoryData[];
  recentDocuments: Document[];
  totalDocuments: number;
  storageUsed: number; // bytes
  storageLimit: number; // bytes
}

export interface DocumentCategoryData {
  category: DocumentCategory;
  count: number;
  icon: string;
  color: string;
  documents: Document[];
  lastUpdated?: string;
}

export interface Document {
  id: string;
  name: string;
  category: DocumentCategory;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  url: string;
  thumbnailUrl?: string;
  tags: string[];
  isShared: boolean;
  sharedWith?: string[];
}

export interface NeighborhoodInsights {
  property: Property;
  recentSales: RecentSale[];
  marketTrends: MarketTrend;
  schoolRatings: SchoolRating[];
  upcomingDevelopments: Development[];
  walkScore?: number;
  transitScore?: number;
  bikeScore?: number;
}

export interface RecentSale {
  id: string;
  address: string;
  salePrice: number;
  saleDate: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  pricePerSqft: number;
  daysOnMarket: number;
  distance: number; // miles
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface MarketTrend {
  radius: number; // miles
  avgSalePrice: number;
  avgPricePerSqft: number;
  avgDaysOnMarket: number;
  totalSales: number;
  priceChange30Days: number; // percentage
  priceChange90Days: number; // percentage
  priceChange1Year: number; // percentage
  inventoryLevel: 'low' | 'medium' | 'high';
  marketType: 'sellers' | 'balanced' | 'buyers';
  trendDirection: ValueTrend;
}

export interface SchoolRating {
  name: string;
  type: 'Elementary' | 'Middle' | 'High';
  rating: number; // 1-10
  distance: number; // miles
  enrollment: number;
  studentTeacherRatio: number;
}

export interface Development {
  id: string;
  name: string;
  type: 'residential' | 'commercial' | 'infrastructure' | 'park';
  description: string;
  status: 'planned' | 'approved' | 'under_construction' | 'completed';
  estimatedCompletion?: string;
  distance: number; // miles
  impact: 'positive' | 'neutral' | 'negative';
}

export interface ProfessionalTeam {
  realEstateAgent?: TeamMember;
  titleCompany?: TeamMember;
  lender?: TeamMember;
  insuranceAgent?: TeamMember;
  homeInspector?: TeamMember;
  attorney?: TeamMember;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  company: string;
  photo?: string;
  phone: string;
  email: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  specialties?: string[];
}

export interface SmartNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate?: string;
  actionRequired: boolean;
  action?: NotificationAction;
  isRead: boolean;
  createdAt: string;
  icon: string;
  color: string;
}

export interface NotificationAction {
  label: string;
  type: 'link' | 'button' | 'modal';
  url?: string;
  handler?: string;
}

export interface MaintenanceReminder {
  id: string;
  task: string;
  description: string;
  frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  lastCompleted?: string;
  nextDue: string;
  priority: 'high' | 'medium' | 'low';
  estimatedCost?: number;
  category: 'hvac' | 'plumbing' | 'electrical' | 'exterior' | 'interior' | 'landscaping' | 'appliances';
  completed: boolean;
}

export interface InsurancePolicy {
  id: string;
  provider: string;
  policyNumber: string;
  type: 'homeowners' | 'flood' | 'earthquake' | 'umbrella';
  coverage: number;
  premium: number;
  deductible: number;
  startDate: string;
  renewalDate: string;
  autoRenew: boolean;
  agentName?: string;
  agentPhone?: string;
}

export interface TaxInfo {
  year: number;
  assessedValue: number;
  taxAmount: number;
  taxRate: number;
  dueDate: string;
  paid: boolean;
  paidDate?: string;
  exemptions?: string[];
}

export interface Warranty {
  id: string;
  item: string;
  provider: string;
  startDate: string;
  expirationDate: string;
  coverage: string;
  documentUrl?: string;
  claimPhone?: string;
  isExpired: boolean;
}

export interface HomeImprovement {
  id: string;
  project: string;
  description: string;
  cost: number;
  completedDate: string;
  contractor?: string;
  valueAdded?: number;
  category: 'kitchen' | 'bathroom' | 'flooring' | 'roof' | 'hvac' | 'windows' | 'landscaping' | 'other';
  photos?: string[];
  documents?: string[];
}

export interface ReferralProgram {
  enabled: boolean;
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  successfulReferrals: number;
  rewards: Reward[];
  pendingRewards: number;
}

export interface Reward {
  id: string;
  type: 'cash' | 'gift_card' | 'service_credit';
  amount: number;
  earnedDate: string;
  status: 'pending' | 'approved' | 'redeemed';
  referredClient: string;
}

export interface DashboardStats {
  homeValue: number;
  valueChange: number;
  equity: number;
  equityPercentage: number;
  mortgageBalance: number;
  monthsOwned: number;
  totalDocuments: number;
  upcomingTasks: number;
  unreadNotifications: number;
}

// Chart Data
export interface ValueChartData {
  labels: string[];
  homeValue: number[];
  mortgageBalance: number[];
  equity: number[];
}

export interface NeighborhoodChartData {
  labels: string[];
  avgPrice: number[];
  yourHomeValue: number[];
}

// Map Data
export interface MapMarker {
  id: string;
  type: 'property' | 'sale' | 'school' | 'development';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  data: any;
  icon: string;
  color: string;
}

// Constants
export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'Closing Documents',
  'Tax Documents',
  'Insurance',
  'Warranties',
  'Improvements',
  'Other'
];

export const CATEGORY_ICONS: Record<DocumentCategory, string> = {
  'Closing Documents': '📄',
  'Tax Documents': '💰',
  'Insurance': '🛡️',
  'Warranties': '✅',
  'Improvements': '🔨',
  'Other': '📁'
};

export const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  'Closing Documents': '#2563eb',
  'Tax Documents': '#10b981',
  'Insurance': '#f59e0b',
  'Warranties': '#8b5cf6',
  'Improvements': '#ec4899',
  'Other': '#64748b'
};

export const MAINTENANCE_SCHEDULE: MaintenanceReminder[] = [
  {
    id: 'm1',
    task: 'HVAC Filter Change',
    description: 'Replace air filters for optimal efficiency',
    frequency: 'quarterly',
    nextDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    estimatedCost: 30,
    category: 'hvac',
    completed: false
  },
  {
    id: 'm2',
    task: 'Gutter Cleaning',
    description: 'Clean gutters and downspouts',
    frequency: 'biannual',
    nextDue: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
    estimatedCost: 150,
    category: 'exterior',
    completed: false
  },
  {
    id: 'm3',
    task: 'HVAC Service',
    description: 'Annual HVAC system inspection and service',
    frequency: 'annual',
    nextDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    estimatedCost: 200,
    category: 'hvac',
    completed: false
  }
];

export const PMI_THRESHOLD = 20; // percentage equity
export const REFINANCE_RATE_THRESHOLD = 0.75; // percentage points
