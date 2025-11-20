import React, { StrictMode } from 'react'
import ReactDOM, { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary'
import { reportWebVitals } from './utils/reportWebVitals'
import './index.css'
import App from './App.tsx'

// Configure axe-core for accessibility testing in development
if (import.meta.env.DEV) {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000, {
      rules: [
        {
          id: 'color-contrast',
          enabled: true,
        },
        {
          id: 'label',
          enabled: true,
        },
      ],
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
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
    </ErrorBoundary>
  </StrictMode>,
)

// Start monitoring web vitals
reportWebVitals()
