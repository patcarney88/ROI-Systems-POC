// Authentication System Types
// ROI Systems - Unified Authentication

export type UserRole = 'title_agent' | 'realtor' | 'loan_officer' | 'homeowner' | 'admin';

export type AuthProvider = 'email' | 'google' | 'microsoft' | 'apple';

export type MFAMethod = 'sms' | 'email' | 'authenticator' | 'backup_codes';

export type SessionStatus = 'active' | 'expired' | 'revoked' | 'suspicious';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'share' | 'export';

export type PermissionResource = 
  | 'documents'
  | 'clients'
  | 'transactions'
  | 'campaigns'
  | 'analytics'
  | 'settings'
  | 'users'
  | 'billing';

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  organizationId?: string;
  organization?: Organization;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  mfaMethods: MFAMethod[];
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
  permissions: Permission[];
}

export interface Organization {
  id: string;
  name: string;
  type: 'title_company' | 'brokerage' | 'lender' | 'individual';
  logo?: string;
  website?: string;
  phone?: string;
  address?: Address;
  settings: OrganizationSettings;
  memberCount: number;
  createdAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OrganizationSettings {
  allowSelfRegistration: boolean;
  requireEmailVerification: boolean;
  requireMFA: boolean;
  allowedDomains?: string[];
  ssoEnabled: boolean;
  ssoProvider?: string;
  branding: BrandingSettings;
}

export interface BrandingSettings {
  primaryColor: string;
  logo?: string;
  favicon?: string;
  customDomain?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
  digest: 'realtime' | 'daily' | 'weekly' | 'never';
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'organization' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  allowAnalytics: boolean;
}

export interface Permission {
  resource: PermissionResource;
  actions: PermissionAction[];
  scope: 'own' | 'organization' | 'all';
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in';
  value: any;
}

export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SSOCredentials {
  provider: AuthProvider;
  token: string;
  idToken?: string;
}

export interface MFACredentials {
  userId: string;
  code: string;
  method: MFAMethod;
  trustDevice?: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  tokens?: AuthTokens;
  requiresMFA?: boolean;
  mfaMethods?: MFAMethod[];
  error?: AuthError;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  tokenType: 'Bearer';
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
  retryAfter?: number; // seconds
}

export interface Session {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ipAddress: string;
  location?: SessionLocation;
  status: SessionStatus;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface SessionLocation {
  city?: string;
  region?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  marketingConsent?: boolean;
}

export interface RegistrationStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  fields: RegistrationField[];
}

export interface RegistrationField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'select' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: FieldValidation;
}

export interface FieldValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  custom?: (value: any) => boolean | string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface EmailVerification {
  token: string;
  userId: string;
}

export interface MFASetup {
  userId: string;
  method: MFAMethod;
  phoneNumber?: string;
  email?: string;
}

export interface MFASetupResponse {
  success: boolean;
  method: MFAMethod;
  qrCode?: string; // for authenticator apps
  secret?: string;
  backupCodes?: string[];
  error?: AuthError;
}

export interface SecurityEvent {
  id: string;
  userId: string;
  type: 'login' | 'logout' | 'password_change' | 'mfa_enabled' | 'mfa_disabled' | 'failed_login' | 'suspicious_activity';
  description: string;
  ipAddress: string;
  deviceInfo: string;
  location?: SessionLocation;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: AuditChange[];
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  status: 'success' | 'failure';
  errorMessage?: string;
}

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  trusted: boolean;
  lastUsed: string;
  createdAt: string;
}

export interface TrustedDevice {
  deviceId: string;
  deviceName: string;
  trustedAt: string;
  expiresAt: string;
}

export interface BruteForceProtection {
  attempts: number;
  maxAttempts: number;
  lockoutDuration: number; // minutes
  lockedUntil?: string;
  requiresCaptcha: boolean;
}

export interface CaptchaChallenge {
  token: string;
  siteKey: string;
  provider: 'recaptcha' | 'hcaptcha' | 'turnstile';
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  inheritsFrom?: UserRole[];
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  roles?: UserRole[];
  users?: string[];
  organizations?: string[];
  percentage?: number; // 0-100 for gradual rollout
}

export interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthCredentials) => Promise<AuthResponse>;
  loginWithSSO: (credentials: SSOCredentials) => Promise<AuthResponse>;
  verifyMFA: (credentials: MFACredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  register: (data: RegistrationData) => Promise<AuthResponse>;
  resetPassword: (request: PasswordResetRequest) => Promise<void>;
  changePassword: (reset: PasswordReset) => Promise<void>;
  verifyEmail: (verification: EmailVerification) => Promise<void>;
  refreshToken: () => Promise<AuthTokens>;
  hasPermission: (resource: PermissionResource, action: PermissionAction) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

// Default Role Permissions
export const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  title_agent: [
    { resource: 'documents', actions: ['create', 'read', 'update', 'delete', 'share'], scope: 'organization' },
    { resource: 'clients', actions: ['create', 'read', 'update', 'delete'], scope: 'organization' },
    { resource: 'transactions', actions: ['create', 'read', 'update', 'delete'], scope: 'organization' },
    { resource: 'campaigns', actions: ['create', 'read', 'update', 'delete'], scope: 'organization' },
    { resource: 'analytics', actions: ['read'], scope: 'organization' },
    { resource: 'settings', actions: ['read', 'update'], scope: 'own' }
  ],
  realtor: [
    { resource: 'documents', actions: ['create', 'read', 'update', 'delete', 'share'], scope: 'own' },
    { resource: 'clients', actions: ['create', 'read', 'update', 'delete'], scope: 'own' },
    { resource: 'transactions', actions: ['create', 'read', 'update'], scope: 'own' },
    { resource: 'campaigns', actions: ['create', 'read', 'update', 'delete'], scope: 'own' },
    { resource: 'analytics', actions: ['read'], scope: 'own' },
    { resource: 'settings', actions: ['read', 'update'], scope: 'own' }
  ],
  loan_officer: [
    { resource: 'documents', actions: ['create', 'read', 'update', 'share'], scope: 'own' },
    { resource: 'clients', actions: ['create', 'read', 'update'], scope: 'own' },
    { resource: 'transactions', actions: ['read', 'update'], scope: 'own' },
    { resource: 'analytics', actions: ['read'], scope: 'own' },
    { resource: 'settings', actions: ['read', 'update'], scope: 'own' }
  ],
  homeowner: [
    { resource: 'documents', actions: ['read', 'share'], scope: 'own' },
    { resource: 'analytics', actions: ['read'], scope: 'own' },
    { resource: 'settings', actions: ['read', 'update'], scope: 'own' }
  ],
  admin: [
    { resource: 'documents', actions: ['create', 'read', 'update', 'delete', 'share', 'export'], scope: 'all' },
    { resource: 'clients', actions: ['create', 'read', 'update', 'delete', 'export'], scope: 'all' },
    { resource: 'transactions', actions: ['create', 'read', 'update', 'delete', 'export'], scope: 'all' },
    { resource: 'campaigns', actions: ['create', 'read', 'update', 'delete', 'export'], scope: 'all' },
    { resource: 'analytics', actions: ['read', 'export'], scope: 'all' },
    { resource: 'settings', actions: ['create', 'read', 'update', 'delete'], scope: 'all' },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'], scope: 'all' },
    { resource: 'billing', actions: ['create', 'read', 'update', 'delete'], scope: 'all' }
  ]
};

// Role Display Names
export const ROLE_NAMES: Record<UserRole, string> = {
  title_agent: 'Title Agent',
  realtor: 'Realtor',
  loan_officer: 'Loan Officer',
  homeowner: 'Homeowner',
  admin: 'Administrator'
};

// Role Descriptions
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  title_agent: 'Manage transactions, documents, and client communications',
  realtor: 'Track leads, manage clients, and close deals',
  loan_officer: 'Process applications and manage loan pipelines',
  homeowner: 'Track your home value, documents, and maintenance',
  admin: 'Full system access and organization management'
};

// Role Icons
export const ROLE_ICONS: Record<UserRole, string> = {
  title_agent: '📋',
  realtor: '🏠',
  loan_officer: '💰',
  homeowner: '🔑',
  admin: '⚙️'
};

// Security Constants
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REQUIRE_UPPERCASE = true;
export const PASSWORD_REQUIRE_LOWERCASE = true;
export const PASSWORD_REQUIRE_NUMBER = true;
export const PASSWORD_REQUIRE_SPECIAL = true;

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION = 15; // minutes
export const SESSION_TIMEOUT = 24 * 60 * 60; // 24 hours in seconds
export const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds

export const MFA_CODE_LENGTH = 6;
export const MFA_CODE_EXPIRY = 5; // minutes
export const BACKUP_CODES_COUNT = 10;
