import DOMPurify from 'dompurify';

/**
 * Input Sanitization Utilities
 *
 * Provides functions to sanitize user input before sending to backend
 * or rendering in the DOM to prevent XSS attacks.
 *
 * OWASP Reference: A03:2021 - Injection
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this for any user-generated content that might contain HTML
 */
export function sanitizeHtml(dirty: string, options?: DOMPurify.Config): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ...options
  });
}

/**
 * Sanitize plain text input (removes all HTML)
 * Use this for inputs that should never contain HTML
 */
export function sanitizeText(input: string): string {
  // Remove all HTML tags and encode special characters
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  }).trim();
}

/**
 * Sanitize email input
 * Validates and sanitizes email addresses
 */
export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeText(email.toLowerCase().trim());

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }

  return sanitized;
}

/**
 * Sanitize phone number input
 * Removes non-numeric characters except common separators
 */
export function sanitizePhone(phone: string): string {
  // Keep only digits, spaces, hyphens, parentheses, and plus sign
  return phone.replace(/[^0-9\s\-()+ ]/g, '').trim();
}

/**
 * Sanitize URL input
 * Validates and sanitizes URLs to prevent JavaScript injection
 */
export function sanitizeUrl(url: string): string {
  const sanitized = sanitizeText(url.trim());

  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
  const lowerUrl = sanitized.toLowerCase();

  if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
    throw new Error('Invalid URL protocol');
  }

  // Ensure URL starts with http:// or https://
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
    return `https://${sanitized}`;
  }

  return sanitized;
}

/**
 * Sanitize file name
 * Removes potentially dangerous characters from file names
 */
export function sanitizeFileName(fileName: string): string {
  // Remove directory traversal attempts and dangerous characters
  return fileName
    .replace(/\.\./g, '')
    .replace(/[\/\\:*?"<>|]/g, '_')
    .trim();
}

/**
 * Sanitize numeric input
 * Ensures input is a valid number
 */
export function sanitizeNumber(input: string | number): number {
  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(num) || !isFinite(num)) {
    throw new Error('Invalid number');
  }

  return num;
}

/**
 * Sanitize JSON input
 * Safely parses JSON and removes dangerous content
 */
export function sanitizeJson<T = any>(jsonString: string): T {
  try {
    const parsed = JSON.parse(jsonString);
    // Recursively sanitize string values in the object
    return sanitizeObject(parsed);
  } catch (error) {
    throw new Error('Invalid JSON');
  }
}

/**
 * Recursively sanitize all string values in an object
 */
function sanitizeObject<T = any>(obj: any): T {
  if (typeof obj === 'string') {
    return sanitizeText(obj) as any;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as any;
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitize the key as well
        const sanitizedKey = sanitizeText(key);
        sanitized[sanitizedKey] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitize form data before submission
 * Use this to sanitize entire form objects
 */
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized: any = {};

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const value = data[key];

      // Skip null/undefined values
      if (value == null) {
        sanitized[key] = value;
        continue;
      }

      // Apply appropriate sanitization based on field name
      if (key.includes('email') || key.includes('Email')) {
        try {
          sanitized[key] = sanitizeEmail(value);
        } catch {
          sanitized[key] = '';
        }
      } else if (key.includes('phone') || key.includes('Phone')) {
        sanitized[key] = sanitizePhone(value);
      } else if (key.includes('url') || key.includes('Url') || key.includes('URL')) {
        try {
          sanitized[key] = sanitizeUrl(value);
        } catch {
          sanitized[key] = '';
        }
      } else if (typeof value === 'string') {
        sanitized[key] = sanitizeText(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized as T;
}

/**
 * Create a sanitized error message
 * Ensures error messages don't contain sensitive information
 */
export function sanitizeErrorMessage(error: any): string {
  const message = error?.message || error?.toString() || 'An error occurred';

  // Remove potentially sensitive information
  const sanitized = message
    .replace(/\/[^\s]+/g, '/***') // Hide file paths
    .replace(/\b\d{4,}\b/g, '****') // Hide long numbers
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***@***.***') // Hide emails
    .replace(/Bearer [^\s]+/g, 'Bearer ***') // Hide tokens
    .slice(0, 200); // Limit length

  return sanitizeText(sanitized);
}

/**
 * Validate and sanitize password
 * Note: Passwords should generally not be sanitized heavily
 * as it might break valid passwords
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  // Check for common weak passwords
  const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('Password is too common or weak');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Export all sanitization functions as a namespace
 */
export const Sanitize = {
  html: sanitizeHtml,
  text: sanitizeText,
  email: sanitizeEmail,
  phone: sanitizePhone,
  url: sanitizeUrl,
  fileName: sanitizeFileName,
  number: sanitizeNumber,
  json: sanitizeJson,
  formData: sanitizeFormData,
  errorMessage: sanitizeErrorMessage,
  validatePassword
};