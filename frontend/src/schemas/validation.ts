import { z } from 'zod';

/**
 * Validation Schemas using Zod
 * Centralized validation for all forms across the application
 */

// ============================================================================
// Auth Schemas
// ============================================================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional()
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  phone: z
    .string()
    .regex(/^[\d\s\-\(\)]+$/, 'Phone number can only contain digits, spaces, dashes, and parentheses')
    .optional()
    .or(z.literal('')),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must agree to the Terms of Service'
    }),
  agreeToPrivacy: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must agree to the Privacy Policy'
    }),
  marketingConsent: z.boolean().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

// ============================================================================
// Client Schemas
// ============================================================================

export const clientSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  phone: z
    .string()
    .regex(/^[\d\s\-\(\)]+$/, 'Phone number can only contain digits, spaces, dashes, and parentheses')
    .min(10, 'Phone number must be at least 10 digits')
    .optional()
    .or(z.literal('')),
  properties: z
    .number()
    .int('Properties must be a whole number')
    .min(0, 'Properties cannot be negative')
    .optional(),
  status: z.enum(['active', 'at-risk', 'dormant']).optional(),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal(''))
});

// ============================================================================
// Campaign Schemas
// ============================================================================

export const campaignSchema = z.object({
  name: z
    .string()
    .min(1, 'Campaign name is required')
    .min(3, 'Campaign name must be at least 3 characters')
    .max(100, 'Campaign name must be less than 100 characters'),
  subject: z
    .string()
    .min(1, 'Email subject is required')
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be less than 5000 characters'),
  template: z.string().optional(),
  recipients: z
    .string()
    .min(1, 'Please select recipients'),
  schedule: z.enum(['now', 'scheduled']),
  scheduleDate: z.string().optional()
}).refine((data) => {
  // If scheduled, must have a date
  if (data.schedule === 'scheduled') {
    if (!data.scheduleDate) return false;
    // Ensure date is in the future
    const scheduledTime = new Date(data.scheduleDate).getTime();
    const now = new Date().getTime();
    return scheduledTime > now;
  }
  return true;
}, {
  message: 'Scheduled date must be in the future',
  path: ['scheduleDate']
});

// ============================================================================
// Document Upload Schemas
// ============================================================================

// File validation constants
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/jpg'
];

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export const documentUploadSchema = z.object({
  client: z
    .string()
    .min(1, 'Client name is required')
    .min(2, 'Client name must be at least 2 characters'),
  type: z
    .string()
    .min(1, 'Document type is required'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal(''))
});

// File validation helper
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_FILE_EXTENSIONS.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`
      };
    }
  }

  return { valid: true };
};

// Validate multiple files
export const validateFiles = (files: File[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (files.length === 0) {
    errors.push('Please select at least one file');
    return { valid: false, errors };
  }

  files.forEach((file, index) => {
    const result = validateFile(file);
    if (!result.valid && result.error) {
      errors.push(`File ${index + 1} (${file.name}): ${result.error}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

// ============================================================================
// Type exports for use with react-hook-form
// ============================================================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ClientFormData = z.infer<typeof clientSchema>;
export type CampaignFormData = z.infer<typeof campaignSchema>;
export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;
