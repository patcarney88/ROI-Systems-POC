/**
 * Authentication Service Type Definitions
 * Designed by: Solution Architect + Security Specialist
 * 
 * Comprehensive type safety for enterprise authentication
 */

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  is_active: boolean;
  is_verified: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
  
  // Agency relationship
  agency_id?: string;
  role: UserRole;
  permissions: Permission[];
  
  // Security settings
  mfa_enabled: boolean;
  mfa_secret?: string;
  failed_login_attempts: number;
  locked_until?: Date;
  password_reset_token?: string;
  password_reset_expires?: Date;
  email_verification_token?: string;
  email_verification_expires?: Date;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  AGENCY_OWNER = 'agency_owner',
  AGENCY_ADMIN = 'agency_admin',
  AGENT = 'agent',
  ASSISTANT = 'assistant',
  VIEWER = 'viewer'
}

export enum Permission {
  // Agency permissions
  AGENCY_ADMIN = 'agency.admin',
  AGENCY_VIEW = 'agency.view',
  AGENCY_EDIT = 'agency.edit',
  
  // User management
  USER_CREATE = 'user.create',
  USER_VIEW = 'user.view',
  USER_EDIT = 'user.edit',
  USER_DELETE = 'user.delete',
  USER_MANAGE = 'user.manage',
  
  // Document permissions
  DOCUMENT_CREATE = 'document.create',
  DOCUMENT_VIEW = 'document.view',
  DOCUMENT_EDIT = 'document.edit',
  DOCUMENT_DELETE = 'document.delete',
  DOCUMENT_SHARE = 'document.share',
  DOCUMENT_ADMIN = 'document.admin',
  
  // Campaign permissions
  CAMPAIGN_CREATE = 'campaign.create',
  CAMPAIGN_VIEW = 'campaign.view',
  CAMPAIGN_EDIT = 'campaign.edit',
  CAMPAIGN_DELETE = 'campaign.delete',
  CAMPAIGN_MANAGE = 'campaign.manage',
  CAMPAIGN_ADMIN = 'campaign.admin',
  
  // Analytics permissions
  ANALYTICS_VIEW = 'analytics.view',
  ANALYTICS_EXPORT = 'analytics.export',
  ANALYTICS_ADMIN = 'analytics.admin',
  
  // System permissions
  SYSTEM_ADMIN = 'system.admin',
  BILLING_MANAGE = 'billing.manage',
  SETTINGS_ADMIN = 'settings.admin'
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
  device_fingerprint?: string;
}

export interface LoginResponse {
  user: PublicUser;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  mfa_required?: boolean;
  mfa_token?: string;
}

export interface PublicUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  agency_id?: string;
  role: UserRole;
  permissions: Permission[];
  mfa_enabled: boolean;
  is_verified: boolean;
  last_login?: Date;
  created_at: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  agency_id?: string;
  invite_token?: string;
}

export interface RegisterResponse {
  user: PublicUser;
  message: string;
  verification_required: boolean;
}

export interface MFASetupRequest {
  user_id: string;
}

export interface MFASetupResponse {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

export interface MFAVerifyRequest {
  user_id: string;
  token: string;
  type: 'setup' | 'login';
  mfa_token?: string;
}

export interface MFAVerifyResponse {
  verified: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  message: string;
  reset_token_expires: Date;
}

export interface PasswordUpdateRequest {
  reset_token: string;
  new_password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
}

export interface JWTPayload {
  sub: string; // user_id
  email: string;
  role: UserRole;
  permissions: Permission[];
  agency_id?: string;
  iat: number;
  exp: number;
  jti: string; // JWT ID for revocation
  type: 'access' | 'refresh' | 'mfa';
}

export interface Session {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  device_fingerprint?: string;
  ip_address: string;
  user_agent: string;
  is_active: boolean;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AuthContext {
  user: PublicUser;
  session_id: string;
  permissions: Permission[];
  is_authenticated: boolean;
}

export interface SecurityEvent {
  id: string;
  user_id?: string;
  event_type: SecurityEventType;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  risk_score: number;
  created_at: Date;
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGIN_BLOCKED = 'login_blocked',
  MFA_SETUP = 'mfa_setup',
  MFA_SUCCESS = 'mfa_success',
  MFA_FAILED = 'mfa_failed',
  PASSWORD_RESET = 'password_reset',
  PASSWORD_CHANGED = 'password_changed',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  TOKEN_REFRESH = 'token_refresh',
  LOGOUT = 'logout',
  PERMISSION_DENIED = 'permission_denied'
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface APIError {
  error: string;
  message: string;
  code: string;
  details?: ValidationError[];
  timestamp: string;
  path: string;
  method: string;
}