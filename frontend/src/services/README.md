# API Service Layer Documentation

Complete API integration infrastructure for ROI Systems frontend application.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [File Structure](#file-structure)
4. [API Services](#api-services)
5. [Using Hooks](#using-hooks)
6. [Error Handling](#error-handling)
7. [Environment Configuration](#environment-configuration)
8. [Examples](#examples)
9. [Best Practices](#best-practices)

---

## Overview

The API service layer provides:

- **Type-safe API calls** with full TypeScript support
- **Automatic authentication** handling with JWT tokens
- **Request/response interceptors** for logging and error handling
- **Token refresh** mechanism for seamless authentication
- **Error handling utilities** with user-friendly messages
- **React hooks** for easy integration with components
- **Request deduplication** to prevent duplicate API calls
- **Automatic retry** for failed requests

---

## Quick Start

### Basic API Call

```typescript
import { api } from './services/api';

// Authentication
const response = await api.auth.login({
  email: 'user@example.com',
  password: 'password123'
});

if (response.success) {
  console.log('User:', response.data.user);
  console.log('Token:', response.data.tokens.accessToken);
}
```

### Using React Hook

```typescript
import { useApi } from './hooks/useApi';
import { api } from './services/api';

function ClientList() {
  const { data, loading, error } = useApi(
    () => api.clients.list({ status: 'active' })
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.clients.map(client => (
        <li key={client.id}>{client.name}</li>
      ))}
    </ul>
  );
}
```

---

## File Structure

```
frontend/src/
├── services/
│   ├── api.ts              # Main API service with all endpoints
│   ├── api.client.ts       # Axios client with interceptors
│   └── api.services.ts     # Legacy service (can be removed)
├── types/
│   └── api.ts              # TypeScript type definitions
├── hooks/
│   └── useApi.ts           # React hooks for API calls
└── utils/
    └── api-errors.ts       # Error handling utilities
```

---

## API Services

### Authentication API (`api.auth`)

```typescript
// Login
await api.auth.login({ email, password });

// Register
await api.auth.register({ email, password, firstName, lastName });

// Logout
await api.auth.logout();

// Get profile
await api.auth.getProfile();

// Update profile
await api.auth.updateProfile({ firstName, lastName });

// Change password
await api.auth.changePassword({ currentPassword, newPassword, confirmPassword });

// MFA
await api.auth.enableMFA();
await api.auth.verifyMFA({ userId, code, method });

// Sessions
await api.auth.getSessions();
await api.auth.revokeSession(sessionId);
```

### Document API (`api.documents`)

```typescript
// List documents
await api.documents.list({ type: 'Deed', status: 'ready' });

// Get single document
await api.documents.get(documentId);

// Upload document
await api.documents.upload({
  file: fileObject,
  type: 'Deed',
  clientId: 'client-123',
  tags: ['important']
});

// Upload multiple documents
await api.documents.uploadMultiple([file1, file2], {
  type: 'Deed',
  clientId: 'client-123'
});

// Update document
await api.documents.update(documentId, { status: 'archived' });

// Delete document
await api.documents.delete(documentId);

// Bulk actions
await api.documents.bulkAction({
  documentIds: ['doc1', 'doc2'],
  action: 'delete'
});

// Share document
await api.documents.share(documentId, {
  emails: ['user@example.com'],
  message: 'Check this out'
});

// Get statistics
await api.documents.getStats();
```

### Client API (`api.clients`)

```typescript
// List clients
await api.clients.list({ status: 'active', page: 1, limit: 20 });

// Get single client
await api.clients.get(clientId);

// Create client
await api.clients.create({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234'
});

// Update client
await api.clients.update(clientId, { status: 'inactive' });

// Delete client
await api.clients.delete(clientId);

// Get client documents
await api.clients.getDocuments(clientId);

// Get client campaigns
await api.clients.getCampaigns(clientId);

// Get client activity
await api.clients.getActivity(clientId);

// Search clients
await api.clients.search('john doe');
```

### Campaign API (`api.campaigns`)

```typescript
// List campaigns
await api.campaigns.list({ status: 'sent' });

// Create campaign
await api.campaigns.create({
  name: 'Summer Newsletter',
  subject: 'Hot Market Update',
  templateId: 'template-123',
  recipients: [
    { email: 'user@example.com', name: 'John Doe' }
  ]
});

// Send campaign
await api.campaigns.send(campaignId);

// Send test
await api.campaigns.sendTest(campaignId, ['test@example.com']);

// Get statistics
await api.campaigns.getStats(campaignId);

// Preview campaign
await api.campaigns.preview(campaignId);

// Clone campaign
await api.campaigns.clone(campaignId);
```

### Analytics API (`api.analytics`)

```typescript
// Dashboard metrics
await api.analytics.getDashboard({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Alert performance
await api.analytics.getAlertPerformance({ period: 'month' });

// Client lifecycle
await api.analytics.getClientLifecycle({ period: 'quarter' });

// Revenue attribution
await api.analytics.getRevenueAttribution({ period: 'year' });

// Competitive insights
await api.analytics.getCompetitiveInsights();

// Predictive analytics
await api.analytics.getPredictiveAnalytics();
```

---

## Using Hooks

### `useApi` - Basic Hook

```typescript
import { useApi } from './hooks/useApi';
import { api } from './services/api';

function Example() {
  const { data, loading, error, execute, refresh, reset } = useApi(
    () => api.clients.list(),
    {
      immediate: true,        // Execute on mount (default: true)
      onSuccess: (data) => console.log('Success!', data),
      onError: (error) => console.error('Error!', error),
      retry: true,            // Auto-retry on failure
      maxRetries: 3,          // Max retry attempts
      showErrorToast: true,   // Show error notifications
    }
  );

  return (
    <div>
      {loading && <Spinner />}
      {error && <Error message={error.message} />}
      {data && <DataDisplay data={data} />}
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### `usePaginatedApi` - Pagination Hook

```typescript
import { usePaginatedApi } from './hooks/useApi';
import { api } from './services/api';

function PaginatedList() {
  const {
    data,           // Current page items
    pagination,     // Pagination info
    loading,
    error,
    setPage,        // Go to specific page
    nextPage,       // Go to next page
    prevPage,       // Go to previous page
    setFilters,     // Update filters
    refresh,        // Reload current page
  } = usePaginatedApi(
    (params) => api.clients.list(params),
    { page: 1, limit: 20, status: 'active' }
  );

  return (
    <div>
      {data.map(item => <Item key={item.id} data={item} />)}
      <Pagination
        current={pagination.page}
        total={pagination.pages}
        onNext={nextPage}
        onPrev={prevPage}
        onPage={setPage}
      />
    </div>
  );
}
```

### `useMutation` - Create/Update/Delete Hook

```typescript
import { useMutation } from './hooks/useApi';
import { api } from './services/api';

function CreateClient() {
  const { execute, loading, error } = useMutation(
    (data) => api.clients.create(data),
    {
      onSuccess: () => {
        console.log('Client created!');
        // Refresh client list, etc.
      },
      showSuccessToast: true,
      successMessage: 'Client created successfully!',
    }
  );

  const handleSubmit = async (formData) => {
    await execute(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Client'}
      </button>
    </form>
  );
}
```

---

## Error Handling

### Using Error Utilities

```typescript
import {
  parseApiError,
  isAuthError,
  isValidationError,
  extractFieldErrors,
  createErrorToast,
} from './utils/api-errors';

// Parse error for display
const message = parseApiError(error);

// Check error type
if (isAuthError(error)) {
  // Redirect to login
}

if (isValidationError(error)) {
  // Show form errors
  const fieldErrors = extractFieldErrors(error);
  fieldErrors.forEach(({ field, message }) => {
    console.log(`${field}: ${message}`);
  });
}

// Create toast notification
const toast = createErrorToast(error);
showToast(toast);
```

### Error Codes

Common error codes:

- `NETWORK_ERROR` - Network connection issue
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `FILE_TOO_LARGE` - File exceeds size limit
- `INTERNAL_SERVER_ERROR` - Server error

See `/utils/api-errors.ts` for complete list.

---

## Environment Configuration

### Environment Variables

Create `.env.development` or `.env.production`:

```bash
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_API_VERSION=v1
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_API_LOGGING=true
VITE_ENABLE_ERROR_LOGGING=true

# File Upload
VITE_MAX_FILE_SIZE=25
VITE_ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png
```

See `.env.example` for complete list of variables.

---

## Examples

### Complete CRUD Example

```typescript
import { useState } from 'react';
import { useApi, useMutation } from './hooks/useApi';
import { api } from './services/api';

function ClientManager() {
  // List clients
  const {
    data: clients,
    loading: listLoading,
    refresh
  } = useApi(() => api.clients.list());

  // Create client
  const {
    execute: createClient,
    loading: createLoading
  } = useMutation((data) => api.clients.create(data), {
    onSuccess: () => refresh(),
  });

  // Update client
  const {
    execute: updateClient,
    loading: updateLoading
  } = useMutation(
    ({ id, data }) => api.clients.update(id, data),
    { onSuccess: () => refresh() }
  );

  // Delete client
  const {
    execute: deleteClient
  } = useMutation((id) => api.clients.delete(id), {
    onSuccess: () => refresh(),
  });

  const handleCreate = async (formData) => {
    await createClient(formData);
  };

  const handleUpdate = async (id, formData) => {
    await updateClient({ id, data: formData });
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure?')) {
      await deleteClient(id);
    }
  };

  return (
    <div>
      {/* Client list and forms */}
    </div>
  );
}
```

### File Upload Example

```typescript
import { useMutation } from './hooks/useApi';
import { api } from './services/api';

function DocumentUpload() {
  const { execute, loading, error, data } = useMutation(
    (file: File) => api.documents.upload({
      file,
      type: 'Deed',
      tags: ['important']
    }),
    {
      showSuccessToast: true,
      successMessage: 'Document uploaded successfully!',
    }
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await execute(file);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={loading}
      />
      {loading && <p>Uploading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && <p>Upload complete! Document ID: {data.document.id}</p>}
    </div>
  );
}
```

---

## Best Practices

### 1. Always Handle Loading and Error States

```typescript
if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return null;

return <DataDisplay data={data} />;
```

### 2. Use Mutations for Create/Update/Delete

```typescript
// Good
const { execute } = useMutation((data) => api.clients.create(data));

// Bad - using useApi for mutations
const { execute } = useApi((data) => api.clients.create(data), { immediate: false });
```

### 3. Refresh Data After Mutations

```typescript
const { refresh: refreshList } = useApi(() => api.clients.list());
const { execute: createClient } = useMutation(
  (data) => api.clients.create(data),
  { onSuccess: () => refreshList() }
);
```

### 4. Use Request Deduplication

```typescript
// Multiple components requesting same data will only make one API call
const { data } = useApi(() => api.clients.get(clientId), {
  cacheKey: `client-${clientId}`,
  deduplicate: true,
});
```

### 5. Handle Errors Gracefully

```typescript
const { error } = useApi(() => api.clients.list(), {
  onError: (error) => {
    if (isAuthError(error)) {
      // Redirect to login
      router.push('/login');
    } else {
      // Show error toast
      showToast(createErrorToast(error));
    }
  },
});
```

### 6. Type Safety

```typescript
// Always use TypeScript types for type safety
const { data } = useApi<ClientListResponse>(
  () => api.clients.list({ status: 'active' })
);

// data is properly typed as ClientListResponse
const clients = data?.clients; // Client[]
```

### 7. Environment Variables

```typescript
// Don't hardcode API URLs
// Bad
const API_URL = 'http://localhost:3000';

// Good - use environment variables
const API_URL = import.meta.env.VITE_API_URL;
```

---

## Testing

### Mock API Calls

```typescript
import { vi } from 'vitest';
import { api } from './services/api';

// Mock API response
vi.spyOn(api.clients, 'list').mockResolvedValue({
  success: true,
  data: {
    clients: [{ id: '1', name: 'Test Client', email: 'test@example.com' }],
    pagination: { page: 1, limit: 20, total: 1, pages: 1 }
  }
});

// Test component
const { getByText } = render(<ClientList />);
expect(getByText('Test Client')).toBeInTheDocument();
```

---

## Troubleshooting

### Common Issues

**Issue: "Network Error"**
- Check if backend is running on correct port
- Verify VITE_API_URL in .env file
- Check CORS configuration on backend

**Issue: "Token Expired"**
- Token refresh should be automatic
- Check if refresh token is valid
- Verify token expiry times match backend

**Issue: "Type errors"**
- Ensure API response matches TypeScript types
- Update types in `/types/api.ts` if API changes
- Run `npm run build:check` to verify types

**Issue: "Request not being made"**
- Check if `immediate: true` in useApi options
- Verify no conditional rendering preventing component mount
- Check browser network tab for blocked requests

---

## Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Axios Documentation](https://axios-http.com/)
- [React Hooks Guide](https://react.dev/reference/react)

---

**Last Updated:** 2025-10-21
**Version:** 1.0.0
