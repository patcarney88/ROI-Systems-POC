# Authentication & Security Usage Guide

## Quick Start

### 1. Protected Routes
Wrap any route that requires authentication with the `ProtectedRoute` component:

```tsx
import ProtectedRoute from './components/ProtectedRoute';

// Basic protection - requires any authenticated user
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// Role-based protection
<Route path="/admin" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminPanel />
  </ProtectedRoute>
} />

// Require email verification
<Route path="/sensitive" element={
  <ProtectedRoute requireEmailVerified={true}>
    <SensitiveContent />
  </ProtectedRoute>
} />
```

### 2. Using Authentication in Components

```tsx
import { useAuth } from '../contexts/AuthContext';
import { sanitizeFormData } from '../utils/sanitize';

function LoginForm() {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Sanitize form data before submission
    const sanitized = sanitizeFormData({
      email: e.target.email.value,
      password: e.target.password.value,
      rememberMe: e.target.rememberMe.checked
    });

    try {
      const response = await login(sanitized);

      if (response.success) {
        // Redirect on success
        navigate('/dashboard');
      } else {
        setError(response.error.message);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### 3. Making Authenticated API Calls

```tsx
import { authApi, documentsApi, handleApiError } from '../services/api.service';

// Get user profile
const fetchProfile = async () => {
  try {
    const profile = await authApi.getProfile();
    console.log('User profile:', profile);
  } catch (error) {
    const message = handleApiError(error);
    console.error(message);
  }
};

// Create a document with automatic CSRF protection
const createDocument = async (documentData) => {
  try {
    const result = await documentsApi.create(documentData);
    console.log('Document created:', result);
  } catch (error) {
    const message = handleApiError(error);
    console.error(message);
  }
};
```

### 4. Logout Implementation

```tsx
import { useAuth } from '../contexts/AuthContext';

function ProfileMenu() {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Automatic redirect to landing page
  };

  return (
    <div>
      <p>Welcome, {user?.firstName}</p>
      <button onClick={handleLogout}>Sign Out</button>
    </div>
  );
}
```

### 5. Input Sanitization Examples

```tsx
import { Sanitize } from '../utils/sanitize';

// Sanitize different input types
const email = Sanitize.email('USER@EXAMPLE.COM  '); // Returns: user@example.com
const phone = Sanitize.phone('(555) 123-4567'); // Returns: (555) 123-4567
const url = Sanitize.url('example.com'); // Returns: https://example.com
const html = Sanitize.html('<script>alert("xss")</script><b>Bold</b>'); // Returns: <b>Bold</b>

// Validate password
const passwordCheck = Sanitize.validatePassword('MyP@ssw0rd123');
if (!passwordCheck.isValid) {
  console.error('Password errors:', passwordCheck.errors);
}

// Sanitize entire form
const formData = {
  email: 'user@example.com',
  phone: '555-1234',
  bio: '<p>Hello <script>alert("xss")</script></p>'
};
const sanitized = Sanitize.formData(formData);
```

### 6. Registration with Validation

```tsx
import { useAuth } from '../contexts/AuthContext';
import { Sanitize } from '../utils/sanitize';

function RegisterForm() {
  const { register } = useAuth();
  const [errors, setErrors] = useState({});

  const handleSubmit = async (formData) => {
    // Validate password
    const passwordCheck = Sanitize.validatePassword(formData.password);
    if (!passwordCheck.isValid) {
      setErrors({ password: passwordCheck.errors.join(', ') });
      return;
    }

    // Sanitize and submit
    const sanitized = Sanitize.formData(formData);

    try {
      const response = await register(sanitized);
      if (response.success) {
        navigate('/verify-email');
      }
    } catch (error) {
      // Handle error
    }
  };

  return (
    // Registration form JSX
  );
}
```

## Security Best Practices

### DO's
- Always sanitize user input before sending to backend
- Use the provided API service for all backend calls
- Store tokens in localStorage (they're httpOnly in production)
- Check user permissions before showing sensitive UI elements
- Use ProtectedRoute for all authenticated pages
- Handle token expiration gracefully

### DON'Ts
- Never log passwords or tokens to console
- Don't bypass input sanitization
- Don't store sensitive data in component state
- Don't make direct fetch calls - use the API service
- Don't disable CSRF protection
- Don't trust client-side validation alone

## Environment Configuration

### Development (.env.local)
```env
VITE_API_URL=http://localhost:3000
```

### Production (.env.production)
```env
VITE_API_URL=https://api.roisystems.com
VITE_ENABLE_HTTPS=true
```

## Token Management

Tokens are automatically managed by the AuthContext:
- Access token expires in 15 minutes
- Refresh token expires in 7 days
- Automatic refresh 5 minutes before expiry
- Token validation on every protected route

## Error Handling

```tsx
import { handleApiError } from '../services/api.service';

try {
  const data = await apiCall();
} catch (error) {
  const userMessage = handleApiError(error);
  // Display userMessage to user

  // Log sanitized error for debugging
  console.error('API Error:', {
    code: error.code,
    status: error.status,
    message: userMessage
  });
}
```

## CSRF Protection

CSRF tokens are automatically handled by the API service:
1. Token fetched on first state-changing operation
2. Cached for 10 minutes
3. Automatically included in POST/PUT/DELETE requests
4. No manual token management needed

## Rate Limiting

Be aware of rate limits:
- Login: 5 attempts per 15 minutes
- Registration: 5 attempts per 15 minutes
- Profile updates: 3 per hour
- Global API: 100 requests per 15 minutes

Handle rate limit errors:
```tsx
if (error.status === 429) {
  // Show "Too many requests" message
  // Implement exponential backoff
}
```

## Testing Authentication

```tsx
// Mock auth context for testing
const mockAuth = {
  user: { id: '1', email: 'test@example.com', role: 'admin' },
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  hasRole: jest.fn((role) => role === 'admin'),
  hasPermission: jest.fn(() => true)
};

// Use in tests
<AuthContext.Provider value={mockAuth}>
  <YourComponent />
</AuthContext.Provider>
```

## Troubleshooting

### Common Issues

1. **"CSRF token validation failed"**
   - Clear browser cookies and localStorage
   - Ensure credentials: 'include' in API calls
   - Check CORS configuration

2. **"Token expired"**
   - Tokens auto-refresh, but if it fails, user must re-login
   - Check network connectivity
   - Verify refresh token hasn't expired

3. **"Unauthorized" errors**
   - Check if token exists in localStorage
   - Verify token hasn't been tampered with
   - Ensure Authorization header is being sent

4. **Input validation errors**
   - Check sanitization rules
   - Ensure password meets requirements
   - Verify email format

## Support

For authentication issues or security concerns:
- Check the console for detailed error messages
- Review the SECURITY.md documentation
- Contact the security team for vulnerabilities