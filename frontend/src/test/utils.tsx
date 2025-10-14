import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithRouter(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    ...options,
  });
}

/**
 * Mock localStorage for testing
 */
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

/**
 * Mock API response helper
 */
export const mockApiResponse = <T,>(data: T, success = true) => {
  return {
    ok: success,
    status: success ? 200 : 400,
    json: async () => ({
      success,
      data,
      error: success ? undefined : { code: 'ERROR', message: 'Error occurred' },
    }),
  } as Response;
};

/**
 * Create mock user for testing
 */
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'agent' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create mock document for testing
 */
export const createMockDocument = (overrides = {}) => ({
  id: 'test-doc-id',
  userId: 'test-user-id',
  clientId: 'test-client-id',
  title: 'Test Document',
  type: 'Purchase Agreement' as const,
  status: 'active' as const,
  fileUrl: 'https://example.com/document.pdf',
  fileSize: 1024,
  mimeType: 'application/pdf',
  uploadDate: new Date(),
  ...overrides,
});

/**
 * Create mock client for testing
 */
export const createMockClient = (overrides = {}) => ({
  id: 'test-client-id',
  userId: 'test-user-id',
  name: 'Test Client',
  email: 'client@example.com',
  phone: '123-456-7890',
  propertyCount: 5,
  lastContact: new Date(),
  engagementScore: 85,
  status: 'active' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Wait for async operations
 */
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock API error helper
 */
export const mockApiError = (message = 'API Error', code = 'API_ERROR') => {
  return {
    ok: false,
    status: 400,
    json: async () => ({
      success: false,
      error: {
        code,
        message,
      },
    }),
  } as Response;
};

// Export all testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
