# Error Handling & Form Validation Documentation

## Overview

This document describes the comprehensive error handling and form validation implementation across the ROI Systems frontend application.

## Table of Contents

1. [Error Boundary](#error-boundary)
2. [Form Validation](#form-validation)
3. [Error Handler Utilities](#error-handler-utilities)
4. [Notification System](#notification-system)
5. [404 Page](#404-page)
6. [Usage Examples](#usage-examples)
7. [Testing](#testing)

---

## Error Boundary

### Location
`/frontend/src/components/ErrorBoundary.tsx`

### Purpose
Catches React component errors and displays a user-friendly fallback UI instead of crashing the entire application.

### Features
- Catches all React component tree errors
- Displays user-friendly error page
- Shows error details in development mode
- Provides "Try Again" and "Go Home" actions
- Logs errors to console (can be extended to error tracking services)

### Usage
Already implemented in `/frontend/src/main.tsx`:

```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Testing Error Boundary
To test the error boundary, you can temporarily throw an error in any component:

```tsx
// Add to any component to test
throw new Error('Test error boundary');
```

---

## Form Validation

### Validation Library: Zod + React Hook Form

### Validation Schemas
Location: `/frontend/src/schemas/validation.ts`

### Available Schemas

#### 1. Login Schema
```typescript
loginSchema: {
  email: string (required, valid email)
  password: string (min 8 chars)
  rememberMe: boolean (optional)
}
```

#### 2. Register Schema
```typescript
registerSchema: {
  email: string (required, valid email)
  password: string (min 8, uppercase, lowercase, number, special char)
  confirmPassword: string (must match password)
  firstName: string (2-50 chars)
  lastName: string (2-50 chars)
  phone: string (optional, digits/spaces/dashes only)
  agreeToTerms: boolean (must be true)
  agreeToPrivacy: boolean (must be true)
  marketingConsent: boolean (optional)
}
```

#### 3. Client Schema
```typescript
clientSchema: {
  name: string (2-100 chars)
  email: string (required, valid email)
  phone: string (optional, min 10 digits)
  properties: number (optional, >= 0)
  status: 'active' | 'at-risk' | 'dormant'
  notes: string (optional, max 500 chars)
}
```

#### 4. Campaign Schema
```typescript
campaignSchema: {
  name: string (3-100 chars)
  subject: string (5-200 chars)
  message: string (10-5000 chars)
  template: string (optional)
  recipients: string (required)
  schedule: 'now' | 'scheduled'
  scheduleDate: string (optional, must be future date if scheduled)
}
```

#### 5. Document Upload Schema
```typescript
documentUploadSchema: {
  client: string (min 2 chars)
  type: string (required)
  description: string (optional, max 500 chars)
}
```

### File Validation

```typescript
// File validation constants
MAX_FILE_SIZE = 10MB
ALLOWED_FILE_TYPES = [PDF, DOC, DOCX, JPG, JPEG, PNG]

// Validation functions
validateFile(file: File): { valid: boolean; error?: string }
validateFiles(files: File[]): { valid: boolean; errors: string[] }
```

### Form Implementation Pattern

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../schemas/validation';

const {
  register,
  handleSubmit,
  formState: { errors, isValid },
  watch,
  reset
} = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
  mode: 'onChange',
  defaultValues: {
    email: '',
    password: ''
  }
});

const onSubmit = async (data: LoginFormData) => {
  // Handle form submission
};

// In JSX
<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('email')} />
  {errors.email && <span>{errors.email.message}</span>}
</form>
```

---

## Error Handler Utilities

### Location
`/frontend/src/utils/error-handler.ts`

### Functions

#### `parseApiError(error: unknown): ErrorDetails`
Parses errors from API calls and returns user-friendly messages.

#### `handleApiError(error: unknown, customMessage?: string): void`
Handles API errors and shows toast notifications.

#### `handleValidationError(errors: Record<string, any>): void`
Handles form validation errors.

#### `logError(error: unknown, context?: Record<string, any>): void`
Logs errors (can be extended to send to error tracking services).

#### `isNetworkError(error: unknown): boolean`
Checks if error is a network error.

#### `isAuthError(error: unknown): boolean`
Checks if error is an authentication error (401).

#### `isPermissionError(error: unknown): boolean`
Checks if error is a permission error (403).

#### `retryRequest<T>(fn: () => Promise<T>, maxRetries?: number, delay?: number): Promise<T>`
Retry helper for failed requests.

### HTTP Status Code Mapping

```typescript
400: "Please check your input and try again"
401: "Please log in to continue"
403: "You don't have permission to do that"
404: "We couldn't find what you're looking for"
409: "This item already exists"
422: "Please check your input and try again"
429: "Too many requests. Please try again later"
500: "Something went wrong. Please try again later"
502/503: "Service temporarily unavailable"
504: "Request timeout. Please try again"
Network error: "Please check your internet connection"
```

### Usage

```tsx
import { handleApiError } from '../utils/error-handler';

try {
  await apiCall();
} catch (error) {
  handleApiError(error); // Shows toast with appropriate message
}
```

---

## Notification System

### Location
`/frontend/src/utils/notifications.ts`

### Functions

#### `showSuccess(message: string, options?: ToastOptions): void`
Display success notification (green).

#### `showError(message: string, options?: ToastOptions): void`
Display error notification (red).

#### `showWarning(message: string, options?: ToastOptions): void`
Display warning notification (orange).

#### `showInfo(message: string, options?: ToastOptions): void`
Display info notification (blue).

#### `showPromiseToast<T>(promise: Promise<T>, messages: {...}): Promise<T>`
Automatically shows loading, success, and error states.

#### `dismissToast(toastId?: string): void`
Dismiss specific or all toasts.

### Usage

```tsx
import { notify } from '../utils/notifications';

// Success
notify.success('Client added successfully!');

// Error
notify.error('Failed to save client');

// Warning
notify.warning('Changes not saved');

// Info
notify.info('Processing...');

// Promise
notify.promise(
  apiCall(),
  {
    loading: 'Uploading...',
    success: 'Upload complete!',
    error: 'Upload failed'
  }
);
```

### Toast Configuration
Location: `/frontend/src/main.tsx`

```tsx
<Toaster
  position="top-right"
  reverseOrder={false}
  gutter={8}
  toastOptions={{
    duration: 4000,
    style: {
      background: '#363636',
      color: '#fff',
      borderRadius: '8px',
      padding: '16px',
    }
  }}
/>
```

---

## 404 Page

### Location
`/frontend/src/pages/NotFound.tsx`

### Features
- User-friendly 404 design
- "Go Back" and "Go Home" buttons
- Links to popular pages
- Responsive layout

### Route Configuration
Location: `/frontend/src/App.tsx`

```tsx
{/* 404 Catch-all Route - Must be last */}
<Route path="*" element={<NotFound />} />
```

---

## Usage Examples

### Example 1: Form with Validation

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema, type ClientFormData } from '../schemas/validation';
import { notify } from '../utils/notifications';
import { handleApiError } from '../utils/error-handler';

function ClientForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    mode: 'onChange'
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      await saveClient(data);
      notify.success('Client saved successfully!');
    } catch (error) {
      handleApiError(error, 'Failed to save client');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <button type="submit" disabled={!isValid}>
        Save
      </button>
    </form>
  );
}
```

### Example 2: API Call with Error Handling

```tsx
import { handleApiError } from '../utils/error-handler';
import { notify } from '../utils/notifications';

async function deleteClient(id: string) {
  try {
    await clientApi.delete(id);
    notify.success('Client deleted successfully');
  } catch (error) {
    handleApiError(error); // Automatic user-friendly message
  }
}
```

### Example 3: File Upload with Validation

```tsx
import { validateFiles } from '../schemas/validation';
import { notify } from '../utils/notifications';

function handleFileUpload(files: File[]) {
  const validation = validateFiles(files);

  if (!validation.valid) {
    notify.error(validation.errors[0]);
    return;
  }

  // Proceed with upload
  notify.success('Files validated successfully');
}
```

---

## Testing

### Test Invalid Form Submissions

1. **Login Form**
   - Try empty email
   - Try invalid email format
   - Try password < 8 characters
   - Verify error messages appear

2. **Client Modal**
   - Try empty name
   - Try invalid email
   - Try invalid phone number
   - Verify validation messages

3. **Campaign Modal**
   - Try empty name/subject/message
   - Try scheduled date in the past
   - Verify validation works

4. **Document Upload**
   - Try uploading file > 10MB
   - Try uploading unsupported file type
   - Try uploading without files
   - Verify error messages

### Test Network Errors

```tsx
// Simulate network error
try {
  throw new Error('Network error');
} catch (error) {
  handleApiError(error);
}
```

### Test Component Errors

```tsx
// In any component
function TestComponent() {
  // Uncomment to test ErrorBoundary
  // throw new Error('Test error');

  return <div>Component</div>;
}
```

### Test 404 Page

Navigate to any non-existent route:
- `/this-does-not-exist`
- `/random-path`
- Verify NotFound page appears

---

## Summary

### Implemented Features

✅ **Error Boundary** - Catches React component errors
✅ **Form Validation** - Zod schemas for all forms
✅ **Login Validation** - Email and password validation
✅ **Register Validation** - Full registration with password strength
✅ **Client Modal Validation** - Name, email, phone validation
✅ **Campaign Modal Validation** - Campaign fields and schedule validation
✅ **Document Upload Validation** - File type and size validation
✅ **Global Error Handler** - Centralized API error handling
✅ **Toast Notifications** - Success, error, warning, info
✅ **404 Page** - User-friendly not found page
✅ **HTTP Status Mapping** - User-friendly error messages

### Files Modified

- `/frontend/src/components/ErrorBoundary.tsx` (new)
- `/frontend/src/schemas/validation.ts` (new)
- `/frontend/src/utils/error-handler.ts` (new)
- `/frontend/src/utils/notifications.ts` (new)
- `/frontend/src/pages/NotFound.tsx` (new)
- `/frontend/src/pages/Login.tsx` (updated)
- `/frontend/src/modals/ClientModal.tsx` (updated)
- `/frontend/src/modals/CampaignModal.tsx` (updated)
- `/frontend/src/modals/DocumentUploadModal.tsx` (updated)
- `/frontend/src/main.tsx` (updated)
- `/frontend/src/App.tsx` (updated)

### Dependencies Installed

- `zod` - Schema validation
- `react-hook-form` - Form management
- `@hookform/resolvers` - Zod resolver for react-hook-form
- `react-hot-toast` - Toast notifications

---

## Best Practices

1. **Always use validation schemas** for forms
2. **Use handleApiError** for API calls
3. **Use notify functions** for user feedback
4. **Keep error messages user-friendly**
5. **Test edge cases** and error scenarios
6. **Log errors** for debugging (extend to error tracking service)
7. **Disable submit buttons** when form is invalid
8. **Show field-level errors** for better UX

---

## Future Enhancements

- [ ] Integrate with error tracking service (Sentry, LogRocket)
- [ ] Add analytics for error tracking
- [ ] Add retry logic for failed API calls
- [ ] Add offline detection and handling
- [ ] Add more comprehensive file validation
- [ ] Add custom error pages for different error types
- [ ] Add error recovery suggestions
