# API Integration Examples

This document shows how to integrate the new API service layer into existing components.

## Table of Contents
1. [Before & After Examples](#before--after-examples)
2. [Component Integration Patterns](#component-integration-patterns)
3. [Common Use Cases](#common-use-cases)

---

## Before & After Examples

### Example 1: Document List Component

#### BEFORE (Mock Data)
```typescript
import { useState, useEffect } from 'react';

function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setTimeout(() => {
      setDocuments([
        { id: '1', name: 'Document 1', type: 'Deed' },
        { id: '2', name: 'Document 2', type: 'Title Policy' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {documents.map(doc => (
        <div key={doc.id}>{doc.name}</div>
      ))}
    </div>
  );
}
```

#### AFTER (Real API)
```typescript
import { useApi } from './hooks/useApi';
import { api } from './services';

function DocumentList() {
  const { data, loading, error } = useApi(() =>
    api.documents.list({ status: 'ready' })
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.documents.map(doc => (
        <div key={doc.id}>{doc.name}</div>
      ))}
    </div>
  );
}
```

---

### Example 2: Client Creation Form

#### BEFORE (Mock)
```typescript
function CreateClientForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setTimeout(() => {
      console.log('Created:', formData);
      setLoading(false);
    }, 1000);
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

#### AFTER (Real API)
```typescript
import { useMutation } from './hooks/useApi';
import { api } from './services';

function CreateClientForm() {
  const { execute, loading, error } = useMutation(
    (data) => api.clients.create(data),
    {
      onSuccess: (data) => {
        console.log('Client created:', data.client);
        // Navigate or show success message
      },
      showErrorToast: true,
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
      {error && <div className="error">{error.message}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Client'}
      </button>
    </form>
  );
}
```

---

### Example 3: File Upload

#### BEFORE (Mock)
```typescript
function DocumentUpload() {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploading(true);
    setTimeout(() => {
      console.log('Uploaded:', file.name);
      setUploading(false);
    }, 2000);
  };

  return (
    <input
      type="file"
      onChange={handleFileChange}
      disabled={uploading}
    />
  );
}
```

#### AFTER (Real API)
```typescript
import { useMutation } from './hooks/useApi';
import { api } from './services';

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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
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
      {loading && <div>Uploading...</div>}
      {error && <div className="error">{error.message}</div>}
      {data && <div>Uploaded: {data.document.name}</div>}
    </div>
  );
}
```

---

## Component Integration Patterns

### Pattern 1: List with Filters

```typescript
import { useState } from 'react';
import { useApi } from './hooks/useApi';
import { api } from './services';

function ClientListWithFilters() {
  const [filters, setFilters] = useState({ status: 'active' });

  const { data, loading, error, refresh } = useApi(
    () => api.clients.list(filters),
    {
      // Re-fetch when filters change
      cacheKey: `clients-${JSON.stringify(filters)}`,
    }
  );

  // Re-fetch when filters change
  useEffect(() => {
    refresh();
  }, [filters, refresh]);

  return (
    <div>
      <select
        value={filters.status}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {loading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {data?.clients.map(client => (
        <div key={client.id}>{client.name}</div>
      ))}
    </div>
  );
}
```

### Pattern 2: Paginated List

```typescript
import { usePaginatedApi } from './hooks/useApi';
import { api } from './services';

function PaginatedClientList() {
  const {
    data,
    pagination,
    loading,
    nextPage,
    prevPage,
    setPage,
    setFilters,
  } = usePaginatedApi(
    (params) => api.clients.list(params),
    { page: 1, limit: 20, status: 'active' }
  );

  return (
    <div>
      {loading && <div>Loading...</div>}

      <div className="list">
        {data.map(client => (
          <div key={client.id}>{client.name}</div>
        ))}
      </div>

      <div className="pagination">
        <button onClick={prevPage} disabled={!pagination?.hasPrev}>
          Previous
        </button>
        <span>
          Page {pagination?.page} of {pagination?.pages}
        </span>
        <button onClick={nextPage} disabled={!pagination?.hasNext}>
          Next
        </button>
      </div>
    </div>
  );
}
```

### Pattern 3: CRUD Operations

```typescript
import { useApi, useMutation } from './hooks/useApi';
import { api } from './services';

function ClientManager() {
  // List clients
  const { data: clients, refresh } = useApi(() => api.clients.list());

  // Create client
  const { execute: createClient, loading: creating } = useMutation(
    (data) => api.clients.create(data),
    { onSuccess: () => refresh() }
  );

  // Update client
  const { execute: updateClient } = useMutation(
    ({ id, data }) => api.clients.update(id, data),
    { onSuccess: () => refresh() }
  );

  // Delete client
  const { execute: deleteClient } = useMutation(
    (id) => api.clients.delete(id),
    { onSuccess: () => refresh() }
  );

  const handleCreate = async () => {
    await createClient({
      name: 'New Client',
      email: 'new@example.com',
    });
  };

  const handleUpdate = async (id) => {
    await updateClient({
      id,
      data: { status: 'inactive' },
    });
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure?')) {
      await deleteClient(id);
    }
  };

  return (
    <div>
      <button onClick={handleCreate} disabled={creating}>
        Create Client
      </button>
      {clients?.clients.map(client => (
        <div key={client.id}>
          {client.name}
          <button onClick={() => handleUpdate(client.id)}>
            Deactivate
          </button>
          <button onClick={() => handleDelete(client.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Pattern 4: Dependent Data Loading

```typescript
import { useApi } from './hooks/useApi';
import { api } from './services';

function ClientDetails({ clientId }) {
  // Load client
  const {
    data: client,
    loading: clientLoading,
  } = useApi(() => api.clients.get(clientId));

  // Load client documents (only after client is loaded)
  const {
    data: documents,
    loading: documentsLoading,
  } = useApi(
    () => api.clients.getDocuments(clientId),
    {
      immediate: !!client, // Only load if client exists
    }
  );

  if (clientLoading) return <div>Loading client...</div>;
  if (!client) return <div>Client not found</div>;

  return (
    <div>
      <h1>{client.client.name}</h1>

      <h2>Documents</h2>
      {documentsLoading ? (
        <div>Loading documents...</div>
      ) : (
        <div>
          {documents?.documents.map(doc => (
            <div key={doc.id}>{doc.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Common Use Cases

### Use Case 1: Authentication Flow

```typescript
import { api, TokenManager } from './services';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  const { execute, loading, error } = useMutation(
    (credentials) => api.auth.login(credentials),
    {
      onSuccess: (data) => {
        // Tokens are automatically stored by TokenManager
        TokenManager.setToken(data.tokens.accessToken);
        TokenManager.setRefreshToken(data.tokens.refreshToken);

        // Navigate to dashboard
        navigate('/dashboard');
      },
    }
  );

  const handleLogin = async (email, password) => {
    await execute({ email, password });
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleLogin(e.target.email.value, e.target.password.value);
    }}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      {error && <div className="error">{error.message}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Use Case 2: Search with Debounce

```typescript
import { useState, useEffect } from 'react';
import { useApi } from './hooks/useApi';
import { api } from './services';

function SearchClients() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, loading } = useApi(
    () => api.clients.search(debouncedQuery),
    {
      immediate: debouncedQuery.length > 0,
      cacheKey: `search-${debouncedQuery}`,
    }
  );

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search clients..."
      />
      {loading && <div>Searching...</div>}
      {data?.clients.map(client => (
        <div key={client.id}>{client.name}</div>
      ))}
    </div>
  );
}
```

### Use Case 3: Form Validation with Field Errors

```typescript
import { useMutation, formatFormError } from './services';
import { api } from './services';

function ClientForm() {
  const [fieldErrors, setFieldErrors] = useState({});

  const { execute, loading, error } = useMutation(
    (data) => api.clients.create(data),
    {
      onError: (error) => {
        const { fields } = formatFormError(error);
        setFieldErrors(fields);
      },
      onSuccess: () => {
        setFieldErrors({});
      },
    }
  );

  const handleSubmit = async (formData) => {
    await execute(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input name="email" type="email" />
        {fieldErrors.email && (
          <span className="error">{fieldErrors.email}</span>
        )}
      </div>
      <div>
        <input name="name" type="text" />
        {fieldErrors.name && (
          <span className="error">{fieldErrors.name}</span>
        )}
      </div>
      <button type="submit" disabled={loading}>
        Submit
      </button>
    </form>
  );
}
```

### Use Case 4: Optimistic Updates

```typescript
import { useState } from 'react';
import { useApi, useMutation } from './hooks/useApi';
import { api } from './services';

function TodoList() {
  const { data: todos, refresh } = useApi(() => api.todos.list());
  const [optimisticTodos, setOptimisticTodos] = useState([]);

  const { execute: toggleTodo } = useMutation(
    ({ id, completed }) => api.todos.update(id, { completed }),
    {
      onSuccess: () => refresh(),
      onError: () => {
        // Revert optimistic update on error
        setOptimisticTodos([]);
      },
    }
  );

  const handleToggle = async (todo) => {
    // Optimistic update
    setOptimisticTodos(prev => [
      ...prev,
      { ...todo, completed: !todo.completed }
    ]);

    await toggleTodo({
      id: todo.id,
      completed: !todo.completed
    });
  };

  const displayTodos = optimisticTodos.length > 0
    ? optimisticTodos
    : todos?.items || [];

  return (
    <div>
      {displayTodos.map(todo => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => handleToggle(todo)}
          />
          {todo.title}
        </div>
      ))}
    </div>
  );
}
```

---

## Tips for Integration

### 1. Replace Mock Data Gradually
Start with one component at a time. Don't try to replace everything at once.

### 2. Use TypeScript
Let TypeScript guide you with IntelliSense and type checking.

### 3. Handle Loading States
Always show appropriate loading indicators for better UX.

### 4. Handle Errors Gracefully
Use the error utilities to show user-friendly error messages.

### 5. Use Deduplication
Set `cacheKey` to prevent duplicate requests for the same data.

### 6. Use Callbacks
Leverage `onSuccess`, `onError`, and `onComplete` callbacks for side effects.

### 7. Test Incrementally
Test each integrated component thoroughly before moving to the next.

---

**Last Updated:** 2025-10-21
