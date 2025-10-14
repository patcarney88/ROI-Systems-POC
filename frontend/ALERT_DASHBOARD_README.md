# Alert Dashboard - Technical Documentation

## Overview

The Alert Dashboard is a real-time, AI-powered business intelligence system for identifying and acting on high-value opportunities. It provides agents with actionable alerts based on ML model predictions and enables efficient tracking, assignment, and conversion management.

## Architecture

### Technology Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **State Management**: React Hooks + Local State
- **Data Visualization**: Recharts
- **Real-time Communication**: Socket.io-client
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Build Tool**: Vite

### Component Structure

```
frontend/src/
├── pages/
│   └── AlertDashboard.tsx         # Main dashboard page
├── components/
│   ├── AlertCard.tsx              # Individual alert card
│   ├── AlertFilters.tsx           # Filter controls
│   ├── AlertStats.tsx             # Statistics and charts
│   └── AlertDetailModal.tsx       # Detailed alert view
├── hooks/
│   └── useAlertWebSocket.ts       # WebSocket connection hook
├── services/
│   └── alert.service.ts           # API service layer
└── types/
    └── alert.types.ts             # TypeScript definitions
```

## Features

### 1. Real-time Alert Feed
- **WebSocket Integration**: Live updates without page refresh
- **Priority-based Display**: Visual hierarchy with color-coded badges
- **Confidence Scoring**: ML confidence displayed with progress bars
- **Smart Filtering**: Multi-dimensional filtering system
- **Bulk Actions**: Select multiple alerts for batch operations

### 2. Alert Types
- **Likely to Sell**: Users showing selling intent signals
- **Likely to Buy**: Users demonstrating buying behavior
- **Refinance Opportunity**: Candidates for refinancing
- **Investment Opportunity**: Potential investment prospects

### 3. Priority Levels
- **CRITICAL** (Red): Immediate action required
- **HIGH** (Orange): Urgent attention needed
- **MEDIUM** (Blue): Standard priority
- **LOW** (Gray): Low priority follow-up

### 4. Alert Lifecycle

```
NEW → ACKNOWLEDGED → IN_PROGRESS → CONTACTED → CONVERTED/DISMISSED
```

### 5. Statistics Dashboard
- **Overview Metrics**: Total alerts, conversion rate, avg confidence, response time
- **Alert Type Distribution**: Pie chart showing type breakdown
- **Priority Distribution**: Pie chart showing priority breakdown
- **Volume Over Time**: Line chart showing alert trends
- **Conversion Funnel**: Bar chart showing conversion stages
- **Top Performing Agents**: Leaderboard with performance metrics

### 6. Advanced Filtering
- **Alert Type**: Multi-select checkboxes
- **Priority**: Multi-select checkboxes
- **Status**: Multi-select checkboxes
- **Confidence Range**: Dual-handle slider (0-100%)
- **Date Range**: From/To date pickers
- **Assigned Agent**: Dropdown selection
- **Search**: Text search across name, email, property
- **Filter Presets**: Save and load common filter combinations

### 7. Alert Detail View
- **Overview Tab**: User and property information
- **Signals Tab**: Contributing ML signals with strength indicators
- **Contact Tab**: Quick call/email actions with note-taking
- **Actions Tab**: Outcome recording and agent reassignment

## API Integration

### Base Configuration
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_VERSION = '/api/v1';
```

### Endpoints Used

#### Alert Management
```
GET    /api/v1/alerts/user/:userId      # Get user alerts with filters
GET    /api/v1/alerts/:id                # Get single alert
PATCH  /api/v1/alerts/:id/status        # Update alert status
POST   /api/v1/alerts/:id/outcome       # Record outcome
```

#### Statistics
```
GET    /api/v1/alerts/stats              # Get statistics
```

#### Agent Management
```
GET    /api/v1/alerts/routing/agents    # Get available agents
POST   /api/v1/alerts/routing/assign    # Assign alert to agent
```

#### Bulk Operations
```
PATCH  /api/v1/alerts/bulk/status       # Bulk status update
POST   /api/v1/alerts/bulk/assign       # Bulk assignment
POST   /api/v1/alerts/bulk/dismiss      # Bulk dismiss
```

## WebSocket Integration

### Connection Management
- **Auto-reconnection**: Exponential backoff with configurable attempts
- **Connection Status**: Visual indicator in UI
- **Event Handling**: Type-safe event listeners

### Events Supported
```typescript
enum WebSocketEventType {
  NEW_ALERT = 'NEW_ALERT',           // New alert created
  ALERT_UPDATED = 'ALERT_UPDATED',   // Alert modified
  ALERT_ASSIGNED = 'ALERT_ASSIGNED', // Alert assigned to agent
  ALERT_DELETED = 'ALERT_DELETED',   // Alert deleted
  CONNECTION_STATUS = 'CONNECTION_STATUS' // Connection state change
}
```

### Browser Notifications
- **Critical/High Priority**: Desktop notifications for important alerts
- **Permission Handling**: Automatic permission request
- **Click Actions**: Navigate to alert details on notification click
- **Configurable**: Can be enabled/disabled per priority level

## Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3000

# WebSocket Configuration
VITE_WS_URL=http://localhost:3000

# Optional: Authentication
# VITE_AUTH_DOMAIN=your-auth-domain.com
# VITE_AUTH_CLIENT_ID=your-client-id
```

## Installation

### Install Dependencies
```bash
cd frontend
npm install
```

### Required Packages
```json
{
  "@mui/material": "^7.3.4",
  "@emotion/react": "^11.14.0",
  "@emotion/styled": "^11.14.1",
  "socket.io-client": "^4.8.1",
  "axios": "^1.12.2",
  "recharts": "^3.2.1",
  "date-fns": "^4.1.0"
}
```

## Usage

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Navigate to Alert Dashboard
```
http://localhost:5173/alerts
```

## Component Usage Examples

### AlertCard
```typescript
<AlertCard
  alert={alert}
  selected={false}
  onAcknowledge={(id) => handleAcknowledge(id)}
  onContact={(id, method) => handleContact(id, method)}
  onDismiss={(id) => handleDismiss(id)}
  onViewDetails={(id) => handleViewDetails(id)}
/>
```

### AlertFilters
```typescript
<AlertFilters
  filters={filters}
  agents={agents}
  onFiltersChange={(newFilters) => setFilters(newFilters)}
  onSavePreset={(name, filters) => savePreset(name, filters)}
/>
```

### AlertStats
```typescript
<AlertStats
  statistics={statistics}
  loading={loading}
/>
```

### AlertDetailModal
```typescript
<AlertDetailModal
  alert={selectedAlert}
  open={modalOpen}
  agents={agents}
  onClose={() => setModalOpen(false)}
  onRecordOutcome={(id, outcome) => recordOutcome(id, outcome)}
  onReassign={(id, agentId) => reassign(id, agentId)}
/>
```

### WebSocket Hook
```typescript
const {
  connectionStatus,
  isConnected,
  lastMessage
} = useAlertWebSocket({
  userId: 'user-123',
  enabled: true,
  onNewAlert: (alert) => {
    setAlerts((prev) => [alert, ...prev]);
  },
  showNotifications: true,
  notificationPriorities: [AlertPriority.CRITICAL, AlertPriority.HIGH]
});
```

## Performance Optimization

### Implemented Optimizations
1. **Virtual Scrolling**: Efficient rendering of large alert lists
2. **Pagination**: Load more pattern with configurable page size
3. **Memoization**: React.memo on card components
4. **Debounced Filters**: 300ms debounce on search inputs
5. **WebSocket Reconnection**: Smart retry with exponential backoff
6. **Lazy Loading**: Route-based code splitting
7. **Image Optimization**: Avatar lazy loading

### Performance Budgets
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size**: < 500KB (initial load)
- **Lighthouse Score**: > 90

## Accessibility

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: Full keyboard support for all actions
- **Screen Reader**: ARIA labels and live regions
- **Color Contrast**: 4.5:1 minimum contrast ratio
- **Focus Indicators**: Visible focus states
- **Semantic HTML**: Proper heading hierarchy

### Keyboard Shortcuts
- `Tab/Shift+Tab`: Navigate between elements
- `Enter/Space`: Activate buttons and links
- `Escape`: Close modals and dialogs
- `Arrow Keys`: Navigate within lists and dropdowns

## Error Handling

### API Errors
- **Network Errors**: Retry with exponential backoff
- **401 Unauthorized**: Redirect to login
- **500 Server Errors**: User-friendly error message
- **Timeout**: Configurable timeout with retry option

### WebSocket Errors
- **Connection Failed**: Auto-reconnection with status indicator
- **Message Parse Errors**: Graceful degradation
- **Authentication Errors**: Re-authentication flow

## Testing

### Test Coverage Requirements
- **Unit Tests**: 95% coverage minimum
- **Component Tests**: All UI components
- **Integration Tests**: API service layer
- **E2E Tests**: Critical user paths

### Example Test Structure
```typescript
describe('AlertDashboard', () => {
  it('should load alerts on mount', async () => {
    // Test implementation
  });

  it('should filter alerts based on selected criteria', () => {
    // Test implementation
  });

  it('should handle WebSocket updates', () => {
    // Test implementation
  });
});
```

## Security

### Implemented Security Measures
1. **Authentication**: Bearer token in Authorization header
2. **XSS Prevention**: React's built-in escaping
3. **CSRF Protection**: Token-based validation
4. **Input Validation**: Client-side validation + server validation
5. **Secure WebSocket**: WSS protocol in production
6. **Content Security Policy**: Restrictive CSP headers

## Troubleshooting

### Common Issues

#### WebSocket Connection Failed
```typescript
// Check WebSocket URL configuration
console.log(import.meta.env.VITE_WS_URL);

// Verify backend WebSocket server is running
// Check browser console for connection errors
```

#### API Requests Failing
```typescript
// Check API base URL
console.log(import.meta.env.VITE_API_BASE_URL);

// Verify authentication token
console.log(localStorage.getItem('auth_token'));

// Check CORS configuration on backend
```

#### Notifications Not Showing
```typescript
// Check browser notification permissions
if (Notification.permission !== 'granted') {
  Notification.requestPermission();
}

// Verify notification priorities configuration
```

## Future Enhancements

### Planned Features
1. **Advanced Analytics**: Predictive analytics dashboard
2. **Custom Workflows**: Configurable alert routing rules
3. **Mobile App**: React Native mobile application
4. **Voice Notifications**: Text-to-speech for critical alerts
5. **AI Recommendations**: Next-best-action suggestions
6. **Calendar Integration**: Sync with Outlook/Google Calendar
7. **CRM Integration**: Two-way sync with major CRMs
8. **Automated Follow-ups**: Smart reminder system
9. **Performance Reports**: Agent performance insights
10. **A/B Testing**: Test different alert strategies

## Support

### Documentation
- API Documentation: `/backend/docs/api.md`
- Component Storybook: `npm run storybook`
- TypeScript Definitions: `/frontend/src/types/`

### Contact
- Technical Support: support@roi-systems.com
- Bug Reports: GitHub Issues
- Feature Requests: Product Roadmap

## License

Copyright © 2025 ROI Systems. All rights reserved.
