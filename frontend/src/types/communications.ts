// Communication Center Types
// ROI Systems - Realtor Communication Platform

export type MessageChannel = 'in_app' | 'sms' | 'email' | 'voice';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export type ConversationStatus = 'active' | 'archived' | 'muted';

export type MediaType = 'image' | 'document' | 'voice' | 'video' | 'property_listing';

export interface Conversation {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  clientPhone?: string;
  clientEmail?: string;
  isOnline: boolean;
  lastSeen?: string;
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  status: ConversationStatus;
  channel: MessageChannel;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  propertyId?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: 'agent' | 'client';
  content: string;
  channel: MessageChannel;
  status: MessageStatus;
  timestamp: string;
  readAt?: string;
  deliveredAt?: string;
  media?: MessageMedia[];
  replyTo?: string; // message id
  isTemplate: boolean;
  templateId?: string;
  metadata?: Record<string, any>;
}

export interface MessageMedia {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  filename?: string;
  fileSize?: number;
  duration?: number; // for voice/video
  mimeType?: string;
  propertyDetails?: PropertyListing;
}

export interface PropertyListing {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  imageUrl: string;
  listingUrl: string;
  status: 'active' | 'pending' | 'sold';
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: 'follow_up' | 'scheduling' | 'property_info' | 'thank_you' | 'market_update' | 'custom';
  channel: MessageChannel[];
  subject?: string; // for email
  content: string;
  variables: TemplateVariable[];
  usageCount: number;
  avgResponseRate?: number;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
}

export interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'property' | 'client';
  required: boolean;
  defaultValue?: string;
}

export interface QuickReply {
  id: string;
  text: string;
  category: string;
  usageCount: number;
}

export interface SMSMessage extends Message {
  phoneNumber: string;
  segments: number;
  cost?: number;
  optOutStatus: boolean;
  complianceChecked: boolean;
}

export interface EmailMessage extends Message {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlContent: string;
  textContent: string;
  attachments?: EmailAttachment[];
  trackingPixel?: string;
  openedAt?: string;
  clickedAt?: string;
  openCount: number;
  clickCount: number;
  scheduledFor?: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

export interface VoiceMessage {
  id: string;
  conversationId: string;
  duration: number;
  audioUrl: string;
  transcription?: string;
  timestamp: string;
  isPlaying?: boolean;
}

export interface AutomatedFollowUp {
  id: string;
  name: string;
  description?: string;
  trigger: FollowUpTrigger;
  sequence: FollowUpStep[];
  status: 'active' | 'paused' | 'completed';
  enrolledCount: number;
  completedCount: number;
  conversionRate: number;
  createdAt: string;
  lastModified: string;
}

export interface FollowUpTrigger {
  type: 'alert_created' | 'no_response' | 'date_based' | 'behavior' | 'manual';
  conditions: TriggerCondition[];
  delay?: number; // minutes
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface FollowUpStep {
  id: string;
  order: number;
  name: string;
  channel: MessageChannel;
  templateId: string;
  delay: number; // days from previous step
  delayUnit: 'hours' | 'days' | 'weeks';
  conditions?: TriggerCondition[];
  sent: number;
  opened?: number;
  responded?: number;
}

export interface CommunicationAnalytics {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: string;
  endDate: string;
  totalMessages: number;
  messagesByChannel: ChannelMetrics[];
  responseRates: ResponseRateData[];
  bestContactTimes: ContactTimeData[];
  templatePerformance: TemplatePerformance[];
  clientPreferences: ClientPreferenceData[];
  avgResponseTime: number; // minutes
  conversionRate: number;
}

export interface ChannelMetrics {
  channel: MessageChannel;
  sent: number;
  delivered: number;
  opened?: number;
  responded: number;
  responseRate: number;
  avgResponseTime: number;
}

export interface ResponseRateData {
  date: string;
  channel: MessageChannel;
  sent: number;
  responded: number;
  responseRate: number;
}

export interface ContactTimeData {
  dayOfWeek: string;
  hour: number;
  messagesSent: number;
  responseRate: number;
  avgResponseTime: number;
  recommended: boolean;
}

export interface TemplatePerformance {
  templateId: string;
  templateName: string;
  channel: MessageChannel;
  sent: number;
  opened?: number;
  responded: number;
  responseRate: number;
  avgResponseTime: number;
  conversionRate?: number;
}

export interface ClientPreferenceData {
  clientId: string;
  clientName: string;
  preferredChannel: MessageChannel;
  preferredTime: string;
  responseRate: number;
  avgResponseTime: number;
}

export interface ComplianceSettings {
  tcpaCompliance: boolean;
  optOutKeywords: string[];
  requiredDisclaimer?: string;
  messageRetentionDays: number;
  autoArchiveAfterDays: number;
  requireConsent: boolean;
}

export interface OptOutRecord {
  clientId: string;
  clientName: string;
  phoneNumber?: string;
  email?: string;
  channel: MessageChannel;
  optedOutAt: string;
  reason?: string;
  canReOptIn: boolean;
}

export interface TwilioConfig {
  accountSid?: string;
  authToken?: string;
  phoneNumber: string;
  messagingServiceSid?: string;
  statusCallback?: string;
  webhookUrl?: string;
}

export interface SendGridConfig {
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  trackOpens: boolean;
  trackClicks: boolean;
  unsubscribeGroup?: number;
}

export interface SocketConfig {
  url: string;
  reconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
}

// Message Templates
export const SMS_TEMPLATES: MessageTemplate[] = [
  {
    id: 'sms-1',
    name: 'Alert Follow-up',
    category: 'follow_up',
    channel: ['sms'],
    content: 'Hi {{client_name}}! I noticed you checked your home value recently. Would you like to discuss your options? I have some great insights to share!',
    variables: [
      { key: 'client_name', label: 'Client Name', type: 'client', required: true }
    ],
    usageCount: 0,
    isDefault: true,
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sms-2',
    name: 'Schedule Showing',
    category: 'scheduling',
    channel: ['sms'],
    content: 'Hi {{client_name}}! I have a showing available for {{property_address}} on {{date}}. Does {{time}} work for you?',
    variables: [
      { key: 'client_name', label: 'Client Name', type: 'client', required: true },
      { key: 'property_address', label: 'Property Address', type: 'property', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'time', label: 'Time', type: 'text', required: true }
    ],
    usageCount: 0,
    isDefault: true,
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sms-3',
    name: 'Property Info Share',
    category: 'property_info',
    channel: ['sms'],
    content: 'Check out this property I think you\'ll love! {{property_address}} - {{bedrooms}}bd/{{bathrooms}}ba, ${{price}}. View details: {{listing_url}}',
    variables: [
      { key: 'property_address', label: 'Property Address', type: 'property', required: true },
      { key: 'bedrooms', label: 'Bedrooms', type: 'number', required: true },
      { key: 'bathrooms', label: 'Bathrooms', type: 'number', required: true },
      { key: 'price', label: 'Price', type: 'number', required: true },
      { key: 'listing_url', label: 'Listing URL', type: 'text', required: true }
    ],
    usageCount: 0,
    isDefault: true,
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sms-4',
    name: 'Thank You',
    category: 'thank_you',
    channel: ['sms'],
    content: 'Thank you for your time today, {{client_name}}! It was great meeting with you. Let me know if you have any questions!',
    variables: [
      { key: 'client_name', label: 'Client Name', type: 'client', required: true }
    ],
    usageCount: 0,
    isDefault: true,
    createdBy: 'system',
    createdAt: new Date().toISOString()
  }
];

export const EMAIL_TEMPLATES: MessageTemplate[] = [
  {
    id: 'email-1',
    name: 'Initial Outreach',
    category: 'follow_up',
    channel: ['email'],
    subject: 'Great to connect, {{client_name}}!',
    content: 'Hi {{client_name}},\n\nIt was wonderful connecting with you! I wanted to reach out and see how I can help with your real estate needs.\n\nI specialize in {{area}} and have helped many clients find their dream homes. Would you be open to a quick call this week?\n\nBest regards,\n{{agent_name}}',
    variables: [
      { key: 'client_name', label: 'Client Name', type: 'client', required: true },
      { key: 'area', label: 'Area', type: 'text', required: true },
      { key: 'agent_name', label: 'Agent Name', type: 'text', required: true }
    ],
    usageCount: 0,
    isDefault: true,
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: 'email-2',
    name: 'Market Update',
    category: 'market_update',
    channel: ['email'],
    subject: 'Your {{area}} Market Update - {{month}}',
    content: 'Hi {{client_name}},\n\nHere\'s your monthly market update for {{area}}:\n\n• Average home price: ${{avg_price}}\n• Days on market: {{days_on_market}}\n• Homes sold: {{homes_sold}}\n\nYour home value has {{change_direction}} to approximately ${{current_value}}.\n\nLet me know if you\'d like to discuss what this means for you!\n\nBest,\n{{agent_name}}',
    variables: [
      { key: 'client_name', label: 'Client Name', type: 'client', required: true },
      { key: 'area', label: 'Area', type: 'text', required: true },
      { key: 'month', label: 'Month', type: 'text', required: true },
      { key: 'avg_price', label: 'Average Price', type: 'number', required: true },
      { key: 'days_on_market', label: 'Days on Market', type: 'number', required: true },
      { key: 'homes_sold', label: 'Homes Sold', type: 'number', required: true },
      { key: 'change_direction', label: 'Change Direction', type: 'text', required: true },
      { key: 'current_value', label: 'Current Value', type: 'number', required: true },
      { key: 'agent_name', label: 'Agent Name', type: 'text', required: true }
    ],
    usageCount: 0,
    isDefault: true,
    createdBy: 'system',
    createdAt: new Date().toISOString()
  }
];

export const QUICK_REPLIES: QuickReply[] = [
  { id: 'qr-1', text: 'Thanks for reaching out! I\'ll get back to you shortly.', category: 'acknowledgment', usageCount: 0 },
  { id: 'qr-2', text: 'I\'d love to schedule a call. When works best for you?', category: 'scheduling', usageCount: 0 },
  { id: 'qr-3', text: 'Let me send you some properties that match your criteria.', category: 'property', usageCount: 0 },
  { id: 'qr-4', text: 'Great question! Let me look into that and get back to you.', category: 'response', usageCount: 0 },
  { id: 'qr-5', text: 'Absolutely! I can help with that. Let\'s discuss the details.', category: 'affirmative', usageCount: 0 }
];

export const OPT_OUT_KEYWORDS = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'OPTOUT'];

export const COMPLIANCE_DISCLAIMER = 'Reply STOP to unsubscribe. Msg & data rates may apply.';
