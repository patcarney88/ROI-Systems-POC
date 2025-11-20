# DemoHeader Component - Code Reference Card

Quick reference for using the DemoHeader component in ROI Systems dashboards.

## Import Statement

```tsx
import DemoHeader from '../components/DemoHeader';
```

## Basic Usage

```tsx
<DemoHeader
  dashboardName="Title Agent Dashboard"
  isDemoMode={true}
/>
```

## Props Interface

```typescript
interface DemoHeaderProps {
  dashboardName: string;     // Required: Display name of dashboard
  isDemoMode?: boolean;       // Optional: Show/hide header (default: true)
}
```

## Available Dashboard Names

```tsx
"Title Agent Dashboard"      // /dashboard/title-agent
"Realtor Dashboard"          // /dashboard/realtor
"Homeowner Portal"           // /dashboard/homeowner
"Marketing Center"           // /dashboard/marketing
"Analytics Dashboard"        // /dashboard/realtor/analytics
"Communication Center"       // /dashboard/realtor/communications
```

## Full Integration Example

```tsx
import { useState } from 'react';
import DemoHeader from '../components/DemoHeader';
import Sidebar from '../components/Sidebar';

export default function TitleAgentDashboard() {
  return (
    <div className="dashboard-wrapper">
      {/* Add DemoHeader at top */}
      <DemoHeader
        dashboardName="Title Agent Dashboard"
        isDemoMode={true}
      />

      {/* Rest of dashboard layout */}
      <div className="dashboard-container">
        <Sidebar />
        <main className="main-content">
          <h1>Title Agent Dashboard</h1>
          {/* Dashboard content */}
        </main>
      </div>
    </div>
  );
}
```

## Router Integration

```tsx
import { Routes, Route } from 'react-router-dom';
import DemoHeader from '../components/DemoHeader';

function App() {
  return (
    <Routes>
      <Route
        path="/dashboard/title-agent"
        element={
          <>
            <DemoHeader dashboardName="Title Agent Dashboard" />
            <TitleAgentDashboard />
          </>
        }
      />
      <Route
        path="/dashboard/realtor"
        element={
          <>
            <DemoHeader dashboardName="Realtor Dashboard" />
            <RealtorDashboard />
          </>
        }
      />
      {/* More routes... */}
    </Routes>
  );
}
```

## Conditional Rendering

```tsx
// Show only in development
const isDemoMode = process.env.NODE_ENV !== 'production';

<DemoHeader
  dashboardName="Marketing Center"
  isDemoMode={isDemoMode}
/>
```

```tsx
// Show based on user role
const { user } = useAuth();
const isDemoMode = user?.role === 'demo';

<DemoHeader
  dashboardName="Homeowner Portal"
  isDemoMode={isDemoMode}
/>
```

```tsx
// Toggle with state
const [showDemo, setShowDemo] = useState(true);

<DemoHeader
  dashboardName="Analytics Dashboard"
  isDemoMode={showDemo}
/>
```

## Component Features

### Demo Badge
- Blue background (`--color-blue-50`)
- Blue border (`--color-blue-500`)
- Blue text (`--color-blue-700`)
- Pulsing play icon
- Shows: "Demo Mode: {dashboardName}"

### Switch Demo Dropdown
- Lists all other dashboards
- Excludes current dashboard
- Click to toggle open/close
- Click outside to close
- Escape key to close
- Keyboard navigable

### Exit Button
- Uses Button component (secondary, small)
- LogOut icon
- Navigates to "/"
- Full keyboard accessible

## CSS Classes

```css
.demo-header                  /* Main container (sticky) */
.demo-header-container        /* Inner flex container */
.demo-badge                   /* Demo mode badge */
.demo-badge-icon              /* Play icon */
.demo-badge-text              /* Badge text */
.demo-header-actions          /* Actions container */
.demo-dropdown                /* Dropdown wrapper */
.demo-dropdown-trigger        /* Dropdown button */
.demo-dropdown-icon           /* Chevron icon */
.demo-dropdown-menu           /* Dropdown menu */
.demo-dropdown-item           /* Menu item link */
.demo-exit-button             /* Exit button */
```

## Styling Override Example

```css
/* In your dashboard CSS */
.demo-header {
  background: var(--color-bg-secondary);
  /* Override header background */
}

.demo-badge {
  border-radius: var(--radius-lg);
  /* Override badge border radius */
}
```

## Accessibility Features

```tsx
// Component includes:
<div className="demo-header" role="banner">
  <div className="demo-badge" role="status" aria-live="polite">
    {/* Demo badge content */}
  </div>

  <button
    aria-haspopup="true"
    aria-expanded={isDropdownOpen}
    aria-label="Switch to another demo dashboard"
  >
    {/* Dropdown trigger */}
  </button>

  <div role="menu" aria-label="Available demo dashboards">
    <Link role="menuitem">
      {/* Menu items */}
    </Link>
  </div>

  <Button ariaLabel="Exit demo mode and return to landing page">
    Exit Demo
  </Button>
</div>
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Navigate through elements |
| Enter/Space | Activate button/link |
| Escape | Close dropdown |
| Arrow Keys | Navigate dropdown items |

## Responsive Breakpoints

```css
/* Mobile (< 768px) - Vertical Stack */
.demo-header-container {
  flex-direction: column;
}

/* Tablet (768px - 1024px) - Adjusted Spacing */
.demo-badge {
  flex: 1;
}

/* Desktop (> 1024px) - Horizontal Layout */
.demo-header-container {
  flex-direction: row;
  justify-content: space-between;
}
```

## Testing Example

```tsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DemoHeader from './DemoHeader';

test('renders with dashboard name', () => {
  render(
    <BrowserRouter>
      <DemoHeader dashboardName="Title Agent Dashboard" />
    </BrowserRouter>
  );

  expect(screen.getByText(/Title Agent Dashboard/)).toBeInTheDocument();
});
```

## Common Patterns

### Pattern 1: Standard Dashboard
```tsx
function Dashboard() {
  return (
    <>
      <DemoHeader dashboardName="Dashboard Name" />
      <DashboardContent />
    </>
  );
}
```

### Pattern 2: Conditional Demo Mode
```tsx
function Dashboard({ isDemoMode }: { isDemoMode: boolean }) {
  return (
    <>
      <DemoHeader dashboardName="Dashboard Name" isDemoMode={isDemoMode} />
      <DashboardContent />
    </>
  );
}
```

### Pattern 3: Environment-Based
```tsx
function Dashboard() {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <>
      <DemoHeader dashboardName="Dashboard Name" isDemoMode={isDev} />
      <DashboardContent />
    </>
  );
}
```

## Design Token Reference

```css
/* Colors */
--color-blue-50: #eff6ff;       /* Badge background */
--color-blue-500: #3b82f6;      /* Badge border */
--color-blue-600: #2563eb;      /* Badge icon */
--color-blue-700: #1d4ed8;      /* Badge text */
--color-border-primary: #e5e7eb; /* Component borders */

/* Spacing */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */

/* Typography */
--text-sm: 0.875rem;      /* 14px */
--font-medium: 500;
--font-semibold: 600;

/* Effects */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-dropdown: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--transition-base: 200ms ease;
--z-sticky: 1100;
```

## File Locations

```
/frontend/src/components/
├── DemoHeader.tsx           # Main component
├── DemoHeader.css           # Styles
├── DemoHeader.test.tsx      # Tests
├── DemoHeader.example.tsx   # Examples
├── DemoHeader.README.md     # Full docs
└── DemoHeader.ARCHITECTURE.md  # Architecture
```

## Dependencies

```json
{
  "react": "^18.0.0",
  "react-router-dom": "^6.0.0",
  "lucide-react": "^0.263.0"
}
```

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Component not sticky | Remove `overflow: hidden` from parent |
| Dropdown cut off | Check parent `overflow` and `z-index` |
| Navigation fails | Wrap app in `<BrowserRouter>` |
| Icons missing | Run `npm install lucide-react` |
| Tests fail | Mock `useNavigate` from react-router-dom |

## Performance Tips

1. **Minimal Re-renders**: Component only re-renders on dropdown toggle
2. **Event Listeners**: Added only when dropdown is open
3. **Memoization**: Can wrap in React.memo if needed
4. **Bundle Size**: Only ~2KB gzipped

```tsx
import { memo } from 'react';

const MemoizedDashboard = memo(function Dashboard() {
  return (
    <>
      <DemoHeader dashboardName="Dashboard" />
      <HeavyContent />
    </>
  );
});
```

## Best Practices

1. **Use Exact Names**: Match dashboard names exactly as shown
2. **Consistent Placement**: Always place at top of dashboard
3. **Test Navigation**: Verify all links work before deployment
4. **Check Mobile**: Test responsive layout on mobile devices
5. **Keyboard Test**: Verify all features work with keyboard only
6. **Screen Reader**: Test with NVDA/JAWS/VoiceOver

## Component Checklist

- [ ] Imported DemoHeader component
- [ ] Added to dashboard with correct name
- [ ] Tested dropdown opens/closes
- [ ] Verified navigation works
- [ ] Checked mobile responsiveness
- [ ] Tested keyboard navigation
- [ ] Verified exit button works
- [ ] No console errors
- [ ] Passes accessibility audit

---

**Quick Links:**
- Full Docs: `/frontend/src/components/DemoHeader.README.md`
- Integration Guide: `/DEMOHEADER_INTEGRATION_GUIDE.md`
- Architecture: `/frontend/src/components/DemoHeader.ARCHITECTURE.md`
- Examples: `/frontend/src/components/DemoHeader.example.tsx`

**Version**: 1.0.0 | **Created**: 2025-11-19
