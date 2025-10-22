# API Integration - Quick Start Guide

## 5-Minute Setup

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env.development

# Update API URL (if different from default)
# Edit .env.development and set VITE_API_URL=http://localhost:3000
```

### 2. Basic Usage

```typescript
import { api } from './services/api';

// Login
const response = await api.auth.login({
  email: 'user@example.com',
  password: 'password123'
});

// List documents
const docs = await api.documents.list({ type: 'Deed' });

// Create client
const client = await api.clients.create({
  name: 'John Doe',
  email: 'john@example.com'
});
```

### 3. Using React Hooks

```typescript
import { useApi } from './hooks/useApi';
import { api } from './services/api';

function MyComponent() {
  const { data, loading, error } = useApi(
    () => api.clients.list({ status: 'active' })
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.clients.map(client => (
        <div key={client.id}>{client.name}</div>
      ))}
    </div>
  );
}
```

## Available APIs

### Authentication
- `api.auth.login(credentials)` - Login
- `api.auth.register(data)` - Register
- `api.auth.logout()` - Logout
- `api.auth.getProfile()` - Get user profile
- `api.auth.updateProfile(data)` - Update profile

### Documents
- `api.documents.list(params)` - List documents
- `api.documents.get(id)` - Get document
- `api.documents.upload(request)` - Upload document
- `api.documents.update(id, data)` - Update document
- `api.documents.delete(id)` - Delete document
- `api.documents.share(id, data)` - Share document

### Clients
- `api.clients.list(params)` - List clients
- `api.clients.get(id)` - Get client
- `api.clients.create(data)` - Create client
- `api.clients.update(id, data)` - Update client
- `api.clients.delete(id)` - Delete client
- `api.clients.search(query)` - Search clients

### Campaigns
- `api.campaigns.list(params)` - List campaigns
- `api.campaigns.create(data)` - Create campaign
- `api.campaigns.send(id)` - Send campaign
- `api.campaigns.getStats(id)` - Get campaign stats
- `api.campaigns.sendTest(id, emails)` - Send test email

### Analytics
- `api.analytics.getDashboard(params)` - Dashboard metrics
- `api.analytics.getAlertPerformance(params)` - Alert metrics
- `api.analytics.getClientLifecycle(params)` - Client analytics
- `api.analytics.getRevenueAttribution(params)` - Revenue data

## Common Patterns

### Creating a Resource

```typescript
import { useMutation } from './hooks/useApi';
import { api } from './services/api';

function CreateClientForm() {
  const { execute, loading, error } = useMutation(
    (data) => api.clients.create(data),
    {
      onSuccess: () => {
        alert('Client created!');
      },
    }
  );

  const handleSubmit = (formData) => {
    execute(formData);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Pagination

```typescript
import { usePaginatedApi } from './hooks/useApi';
import { api } from './services/api';

function PaginatedList() {
  const {
    data,
    pagination,
    nextPage,
    prevPage,
    setFilters
  } = usePaginatedApi(
    (params) => api.clients.list(params),
    { page: 1, limit: 20 }
  );

  return (
    <div>
      {data.map(item => <Item key={item.id} {...item} />)}
      <button onClick={prevPage} disabled={!pagination.hasPrev}>
        Previous
      </button>
      <button onClick={nextPage} disabled={!pagination.hasNext}>
        Next
      </button>
    </div>
  );
}
```

### File Upload

```typescript
import { useMutation } from './hooks/useApi';
import { api } from './services/api';

function FileUpload() {
  const { execute, loading } = useMutation(
    (file: File) => api.documents.upload({ file, type: 'Deed' })
  );

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) execute(file);
  };

  return (
    <input
      type="file"
      onChange={handleChange}
      disabled={loading}
    />
  );
}
```

### Error Handling

```typescript
import { parseApiError, isAuthError } from './utils/api-errors';

const { error } = useApi(() => api.clients.list(), {
  onError: (error) => {
    if (isAuthError(error)) {
      // Redirect to login
      router.push('/login');
    } else {
      // Show error message
      alert(parseApiError(error));
    }
  },
});
```

## Environment Variables

### Required
- `VITE_API_URL` - Backend API URL

### Optional
- `VITE_API_VERSION` - API version (default: v1)
- `VITE_API_TIMEOUT` - Request timeout in ms (default: 30000)
- `VITE_ENABLE_API_LOGGING` - Enable request/response logging

## Troubleshooting

### "Network Error"
- Check if backend is running
- Verify VITE_API_URL in .env file
- Check browser console for CORS errors

### "Unauthorized"
- Token might be expired
- Try logging in again
- Check if token is being sent in headers

### TypeScript Errors
- Run `npm run build:check` to verify types
- Ensure API response matches type definitions
- Check `/types/api.ts` for type definitions

## Full Documentation

See `/frontend/src/services/README.md` for complete documentation.

## File Locations

- **API Services**: `/frontend/src/services/api.ts`
- **API Client**: `/frontend/src/services/api.client.ts`
- **React Hooks**: `/frontend/src/hooks/useApi.ts`
- **Type Definitions**: `/frontend/src/types/api.ts`
- **Error Utilities**: `/frontend/src/utils/api-errors.ts`
- **Environment**: `/frontend/.env.development`

---

**Last Updated:** 2025-10-21
