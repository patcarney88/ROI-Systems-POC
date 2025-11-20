/**
 * DemoHeader Component - Usage Examples
 *
 * This file demonstrates how to integrate the DemoHeader component
 * into various dashboard pages in the ROI Systems application.
 */

import DemoHeader from './DemoHeader';

/* ===== BASIC USAGE ===== */

// Example 1: Title Agent Dashboard
function TitleAgentDashboardWithDemo() {
  return (
    <div className="dashboard">
      <DemoHeader
        dashboardName="Title Agent Dashboard"
        isDemoMode={true}
      />
      {/* Rest of dashboard content */}
    </div>
  );
}

// Example 2: Realtor Dashboard
function RealtorDashboardWithDemo() {
  return (
    <div className="dashboard">
      <DemoHeader
        dashboardName="Realtor Dashboard"
      />
      {/* isDemoMode defaults to true, so it can be omitted */}
      {/* Rest of dashboard content */}
    </div>
  );
}

// Example 3: Homeowner Portal
function HomeownerPortalWithDemo() {
  return (
    <div className="dashboard">
      <DemoHeader
        dashboardName="Homeowner Portal"
        isDemoMode={true}
      />
      {/* Rest of dashboard content */}
    </div>
  );
}

/* ===== CONDITIONAL RENDERING ===== */

// Example 4: Show demo header only in demo mode
function DashboardWithConditionalDemo({ isDemo }: { isDemo: boolean }) {
  return (
    <div className="dashboard">
      <DemoHeader
        dashboardName="Marketing Center"
        isDemoMode={isDemo}
      />
      {/* When isDemoMode is false, header won't render */}
      {/* Rest of dashboard content */}
    </div>
  );
}

/* ===== FULL INTEGRATION EXAMPLE ===== */

// Example 5: Complete dashboard integration with existing layout
function CompleteDashboardExample() {
  return (
    <div className="dashboard-wrapper">
      {/* Demo Header - Sticky at top */}
      <DemoHeader
        dashboardName="Analytics Dashboard"
        isDemoMode={true}
      />

      {/* Main Dashboard Layout */}
      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          {/* Sidebar content */}
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          <header className="dashboard-header">
            <h1>Analytics Dashboard</h1>
          </header>

          <div className="dashboard-content">
            {/* Stats, charts, tables, etc. */}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ===== INTEGRATION WITH ROUTER ===== */

// Example 6: Using with React Router for different routes
import { Routes, Route } from 'react-router-dom';

function DemoDashboardRoutes() {
  return (
    <Routes>
      <Route
        path="/dashboard/title-agent"
        element={
          <div>
            <DemoHeader dashboardName="Title Agent Dashboard" />
            {/* Title Agent Dashboard Content */}
          </div>
        }
      />
      <Route
        path="/dashboard/realtor"
        element={
          <div>
            <DemoHeader dashboardName="Realtor Dashboard" />
            {/* Realtor Dashboard Content */}
          </div>
        }
      />
      <Route
        path="/dashboard/realtor/analytics"
        element={
          <div>
            <DemoHeader dashboardName="Analytics Dashboard" />
            {/* Analytics Dashboard Content */}
          </div>
        }
      />
      <Route
        path="/dashboard/realtor/communications"
        element={
          <div>
            <DemoHeader dashboardName="Communication Center" />
            {/* Communication Center Content */}
          </div>
        }
      />
      <Route
        path="/dashboard/homeowner"
        element={
          <div>
            <DemoHeader dashboardName="Homeowner Portal" />
            {/* Homeowner Portal Content */}
          </div>
        }
      />
      <Route
        path="/dashboard/marketing"
        element={
          <div>
            <DemoHeader dashboardName="Marketing Center" />
            {/* Marketing Center Content */}
          </div>
        }
      />
    </Routes>
  );
}

/* ===== STYLING INTEGRATION ===== */

// Example 7: Custom CSS for dashboard with DemoHeader
const dashboardStyles = `
  .dashboard-wrapper {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--color-bg-secondary);
  }

  /* Ensure content doesn't overlap with sticky header */
  .dashboard-layout {
    flex: 1;
    display: flex;
    /* Add top padding if needed when header is sticky */
    margin-top: 0; /* DemoHeader handles its own spacing */
  }

  .dashboard-sidebar {
    width: var(--width-sidebar);
    background: var(--color-bg-primary);
    border-right: var(--border-1) solid var(--color-border-primary);
  }

  .dashboard-main {
    flex: 1;
    padding: var(--space-6);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .dashboard-main {
      padding: var(--space-4);
    }
  }
`;

/* ===== ACCESSIBILITY EXAMPLE ===== */

// Example 8: Ensuring proper accessibility with DemoHeader
function AccessibleDashboard() {
  return (
    <>
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Demo Header - includes proper ARIA labels and roles */}
      <DemoHeader
        dashboardName="Title Agent Dashboard"
        isDemoMode={true}
      />

      {/* Main content with proper landmark */}
      <main id="main-content" role="main" aria-label="Dashboard content">
        {/* Dashboard content */}
      </main>
    </>
  );
}

/* ===== TESTING EXAMPLE ===== */

// Example 9: Unit test structure for DemoHeader integration
const testExample = `
  import { render, screen } from '@testing-library/react';
  import { BrowserRouter } from 'react-router-dom';
  import DemoHeader from './DemoHeader';

  describe('DemoHeader', () => {
    test('renders with dashboard name', () => {
      render(
        <BrowserRouter>
          <DemoHeader dashboardName="Title Agent Dashboard" />
        </BrowserRouter>
      );

      expect(screen.getByText(/Title Agent Dashboard/)).toBeInTheDocument();
    });

    test('does not render when isDemoMode is false', () => {
      const { container } = render(
        <BrowserRouter>
          <DemoHeader dashboardName="Test Dashboard" isDemoMode={false} />
        </BrowserRouter>
      );

      expect(container.firstChild).toBeNull();
    });

    test('exit button navigates to landing page', () => {
      // Test implementation
    });
  });
`;

/* ===== PERFORMANCE OPTIMIZATION ===== */

// Example 10: Memoized component to prevent unnecessary re-renders
import { memo } from 'react';

const OptimizedDashboard = memo(function OptimizedDashboard({
  dashboardName
}: {
  dashboardName: string;
}) {
  return (
    <div>
      <DemoHeader dashboardName={dashboardName} />
      {/* Heavy dashboard content */}
    </div>
  );
});

export {
  TitleAgentDashboardWithDemo,
  RealtorDashboardWithDemo,
  HomeownerPortalWithDemo,
  DashboardWithConditionalDemo,
  CompleteDashboardExample,
  DemoDashboardRoutes,
  AccessibleDashboard,
  OptimizedDashboard
};
