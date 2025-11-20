# Bundle Optimization Guide

## Current Bundle Analysis

Run bundle analysis:
```bash
npm run build:analyze
```

This will:
1. Build the production bundle
2. Generate `dist/stats.html` with interactive treemap
3. Auto-open the visualization in your browser

## Quick Analysis

```bash
npm run analyze
```

Shows console output with:
- File sizes by bundle
- Budget status
- Actionable recommendations

## Optimization Strategies

### 1. Code Splitting

Split routes with React.lazy():
```typescript
// App.tsx - Lazy load route components
import { lazy, Suspense } from 'react';

const TitleAgentDashboard = lazy(() => import('./pages/TitleAgentDashboard'));
const RealtorDashboard = lazy(() => import('./pages/RealtorDashboard'));
const LoanOfficerDashboard = lazy(() => import('./pages/LoanOfficerDashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));

// Wrap routes with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/title-agent" element={<TitleAgentDashboard />} />
    <Route path="/realtor" element={<RealtorDashboard />} />
    // ...
  </Routes>
</Suspense>
```

### 2. Tree Shaking

Ensure proper imports:
```typescript
// ✅ Good - imports only what's needed
import { useState } from 'react';
import { Home, User } from 'lucide-react';

// ❌ Bad - imports entire package
import * as React from 'react';
import * as Icons from 'lucide-react';
```

### 3. Vendor Splitting

Already configured in `vite.config.ts`:
```typescript
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'ui-vendor': ['lucide-react'],
}
```

### 4. Lazy Load Heavy Components

For charts and large UI components:
```typescript
// Lazy load recharts components
const LineChart = lazy(() =>
  import('recharts').then(module => ({ default: module.LineChart }))
);

const BarChart = lazy(() =>
  import('recharts').then(module => ({ default: module.BarChart }))
);
```

### 5. Dynamic Icon Imports

Instead of importing all icons:
```typescript
// Create an icon loader utility
const iconLoader = {
  Home: () => import('lucide-react').then(m => m.Home),
  User: () => import('lucide-react').then(m => m.User),
  Settings: () => import('lucide-react').then(m => m.Settings),
};

// Use with dynamic component
const DynamicIcon = ({ name }: { name: string }) => {
  const [Icon, setIcon] = useState(null);

  useEffect(() => {
    iconLoader[name]?.().then(setIcon);
  }, [name]);

  return Icon ? <Icon /> : null;
};
```

### 6. Remove Unused Dependencies

Check for unused dependencies:
```bash
npx depcheck
```

Remove any unused packages:
```bash
npm uninstall package-name
```

## Performance Budgets

| Asset | Budget | Target | Critical |
|-------|--------|--------|----------|
| JavaScript | 500 KB | 400 KB | 600 KB |
| CSS | 150 KB | 100 KB | 200 KB |
| Total Bundle | 2 MB | 1.5 MB | 2.5 MB |
| Gzipped Total | 600 KB | 450 KB | 750 KB |

## Bundle Analysis Tools

### Treemap View (Default)
Shows overall bundle composition as nested rectangles
- Best for: Finding large dependencies
- Use when: Identifying what to optimize first

### Sunburst View
Shows hierarchical dependencies in circular layout
- Best for: Understanding dependency chains
- Use when: Analyzing nested imports

### Network View
Shows module relationships as a graph
- Best for: Finding circular dependencies
- Use when: Debugging import issues

## Optimization Checklist

### Before Release
- [ ] Run `npm run build:analyze`
- [ ] Check bundle size against budgets
- [ ] Ensure vendor chunks are created
- [ ] Verify code splitting is working
- [ ] Test lazy-loaded routes
- [ ] Remove console.logs and debug code
- [ ] Check for duplicate dependencies

### Monthly Review
- [ ] Analyze bundle growth trends
- [ ] Review new dependencies added
- [ ] Check for outdated packages
- [ ] Update optimization strategies
- [ ] Document any new large dependencies

## Common Issues & Solutions

### Issue: Large Main Bundle
**Solution**: Implement route-based code splitting

### Issue: Duplicate React Versions
**Solution**: Check with `npm ls react` and resolve conflicts

### Issue: Large Icon Bundle
**Solution**: Import icons individually, not entire library

### Issue: Unminified Code in Production
**Solution**: Ensure `NODE_ENV=production` during build

### Issue: Large CSS Bundle
**Solution**: Use CSS modules or CSS-in-JS for component-specific styles

## Targets for ROI Systems

### Initial Load (Phase 2)
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Bundle Size: < 500 KB gzipped

### Optimized (Phase 3)
- First Contentful Paint: < 1.0s
- Time to Interactive: < 2.5s
- Bundle Size: < 400 KB gzipped

## NPM Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run build` | Standard production build |
| `npm run build:analyze` | Build + open visual analyzer |
| `npm run build:report` | Build + console analysis |
| `npm run analyze` | Analyze existing build |

## Further Resources

- [Vite Performance Guide](https://vitejs.dev/guide/performance.html)
- [React Performance](https://react.dev/learn/render-and-commit#optimizing-performance)
- [Web.dev Performance](https://web.dev/performance/)
- [Bundle Phobia](https://bundlephobia.com/) - Check package sizes before installing