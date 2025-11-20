# Performance Monitoring Guide

## Overview

This guide documents the performance monitoring tools and practices implemented in the ROI Systems frontend application.

## Tools Installed

### 1. **Lighthouse CI**
Automated performance audits for CI/CD pipelines with performance budget enforcement.

### 2. **web-vitals**
Real-time Core Web Vitals monitoring for measuring user-centric performance metrics.

### 3. **axe-core/react**
Automated accessibility testing during development to ensure WCAG compliance.

## Usage Instructions

### Running Performance Audits

#### Full Performance Audit
```bash
# Build and run Lighthouse audit
npm run perf
```

#### Lighthouse Only
```bash
# Run Lighthouse without rebuilding
npm run lighthouse
```

#### Lighthouse Collection
```bash
# Collect metrics without assertions
npm run lighthouse:collect
```

#### Lighthouse Assertions
```bash
# Check metrics against budgets
npm run lighthouse:assert
```

### Monitoring Web Vitals

Web Vitals are automatically tracked and reported:

- **Development**: Metrics logged to browser console
- **Production**: Metrics sent to analytics endpoint

#### Tracked Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Loading performance |
| **INP** (Interaction to Next Paint) | < 200ms | Interactivity responsiveness |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Visual stability |
| **FCP** (First Contentful Paint) | < 1.8s | First render |
| **TTFB** (Time to First Byte) | < 600ms | Server response |

### Accessibility Testing

During development, axe-core automatically runs and reports accessibility violations in the browser console.

#### Common Issues Checked
- Color contrast ratios
- Missing form labels
- ARIA attributes
- Keyboard navigation
- Screen reader compatibility

## Performance Budgets

### Resource Budgets
- **JavaScript**: < 500 KB
- **CSS**: < 150 KB
- **Images**: < 1 MB
- **Total Page Weight**: < 2 MB

### Lighthouse Score Targets
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 90
- **SEO**: > 90

## Development Workflow

### 1. During Development

```bash
# Start dev server with monitoring
npm run dev
```

- Check browser console for Web Vitals logs
- Monitor axe-core warnings for accessibility issues
- Use Performance Monitor component (visible in dev mode)

### 2. Before Committing

```bash
# Run performance audit
npm run perf
```

Review Lighthouse report for:
- Performance regressions
- Accessibility violations
- Best practice issues

### 3. In CI/CD Pipeline

Lighthouse CI runs automatically on:
- Pull requests
- Main branch commits

Failed assertions will block deployment if:
- Performance score < 90
- Accessibility score < 95
- Resource budgets exceeded

## Configuration Files

### Lighthouse Configuration
`frontend/lighthouserc.js`
- URLs to test
- Performance budgets
- Score thresholds
- Test settings

### Environment Variables
`frontend/.env.development`
```bash
VITE_ANALYTICS_ID=roi-systems-dev
VITE_ENABLE_WEB_VITALS=true
VITE_ENABLE_AXE=true
```

`frontend/.env.production`
```bash
VITE_ANALYTICS_ID=roi-systems-prod
VITE_ENABLE_WEB_VITALS=true
VITE_ENABLE_AXE=false
```

## Performance Monitor Component

Optional visual performance monitor available in development:

```tsx
import { PerformanceMonitor } from './components/PerformanceMonitor';

// In your App component
function App() {
  return (
    <>
      {/* Your app content */}
      {import.meta.env.DEV && <PerformanceMonitor />}
    </>
  );
}
```

## Best Practices

### 1. Image Optimization
- Use WebP format where supported
- Implement lazy loading
- Specify dimensions to prevent layout shift
- Use responsive images with srcset

### 2. Code Splitting
- Implement route-based splitting
- Lazy load heavy components
- Use dynamic imports for optional features

### 3. Caching Strategy
- Implement service worker caching
- Use proper cache headers
- Version static assets

### 4. Bundle Optimization
- Tree shake unused code
- Minimize and compress assets
- Use CDN for static resources

## Troubleshooting

### Lighthouse Fails to Start Server
```bash
# Ensure build is complete
npm run build

# Then run Lighthouse
npm run lighthouse
```

### Web Vitals Not Reporting
1. Check browser console for errors
2. Verify environment variables are set
3. Ensure reportWebVitals() is called in main.tsx

### Axe-core Not Running
1. Verify DEV environment
2. Check browser console for import errors
3. Ensure React and ReactDOM are properly imported

## Analytics Integration

Web Vitals data can be sent to your analytics platform:

1. Update `VITE_ANALYTICS_ID` in environment files
2. Modify `vitalsUrl` in `reportWebVitals.ts`
3. Implement custom analytics handler

Example integration:
```typescript
export function sendToAnalytics(metric: Metric) {
  // Send to Google Analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      metric_delta: metric.delta,
    });
  }
}
```

## Further Resources

- [Web Vitals Documentation](https://web.dev/vitals/)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Axe-core Documentation](https://www.deque.com/axe/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

## Support

For performance-related issues or questions:
- Create an issue in the project repository
- Contact the development team
- Review performance reports in CI/CD dashboard