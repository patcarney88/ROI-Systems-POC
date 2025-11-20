# ROI Systems Frontend

React + TypeScript + Vite application for the ROI Systems POC.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Performance Tools

### Bundle Analysis

We use `rollup-plugin-visualizer` to analyze and optimize bundle sizes.

#### Visual Analysis
```bash
# Build and open interactive bundle visualization
npm run build:analyze
```

This generates an interactive treemap at `dist/stats.html` showing:
- Bundle composition by file/module
- Size breakdown with gzip/brotli estimates
- Dependency relationships

#### Console Analysis
```bash
# Quick console report of existing build
npm run analyze

# Build and generate console report
npm run build:report
```

Shows:
- File sizes by bundle
- Budget status (✅/❌)
- Optimization recommendations
- Vendor chunk analysis

### Performance Monitoring

#### Lighthouse CI
```bash
# Run full performance audit
npm run lighthouse

# Build and audit
npm run perf
```

Configured in `.lighthouserc.js` to check:
- Performance score
- Core Web Vitals (LCP, FID, CLS)
- Accessibility
- Best practices

#### Web Vitals
Real User Monitoring (RUM) integrated in the app:
- Automatic Core Web Vitals tracking
- Performance metrics logged to console
- Ready for analytics integration

### Accessibility Testing

Using `@axe-core/react` for development:
- Automatic accessibility checks in dev mode
- Console warnings for violations
- Detailed remediation guidance

## Bundle Optimization

### Current Status
- **Total Bundle**: ~1.2 MB (365 KB gzipped)
- **JavaScript**: 1,087 KB (exceeds 500 KB budget)
- **CSS**: 132 KB (within 150 KB budget)

### Optimization Guide
See [BUNDLE_OPTIMIZATION.md](./BUNDLE_OPTIMIZATION.md) for:
- Code splitting strategies
- Tree shaking tips
- Vendor chunk configuration
- Performance budgets
- Optimization checklist

### Quick Wins
1. **Route Splitting**: Use React.lazy() for dashboards
2. **Icon Optimization**: Import icons individually
3. **Chart Libraries**: Dynamic import for heavy components
4. **Compression**: Enable brotli/gzip in production

## Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (port 5050) |
| `npm run build` | Production build |
| `npm run build:analyze` | Build + open bundle visualizer |
| `npm run build:report` | Build + console analysis |
| `npm run preview` | Preview production build |
| `npm run analyze` | Analyze existing build |
| `npm run lighthouse` | Run Lighthouse audit |
| `npm run perf` | Build + Lighthouse audit |
| `npm test` | Run unit tests |
| `npm run test:coverage` | Test coverage report |

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Dashboard pages
│   ├── services/         # API services
│   ├── utils/            # Utility functions
│   ├── styles/           # Global styles & tokens
│   └── App.tsx          # Main app component
├── scripts/
│   └── analyze-bundle.js # Bundle analysis script
├── dist/                 # Production build output
│   └── stats.html       # Bundle visualization
├── vite.config.ts       # Vite configuration
├── .lighthouserc.js     # Lighthouse CI config
└── BUNDLE_OPTIMIZATION.md # Optimization guide
```

## Performance Targets

### Phase 2 (Current)
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Bundle Size: < 500 KB gzipped

### Phase 3 (Optimized)
- First Contentful Paint: < 1.0s
- Time to Interactive: < 2.5s
- Bundle Size: < 400 KB gzipped

## Build Configuration

### Vite Config
- **Vendor Splitting**: React, React Router, Lucide icons
- **Source Maps**: Enabled for bundle analysis
- **Bundle Visualizer**: Auto-generates on build

### TypeScript
- Strict mode enabled
- Path aliases configured
- Type checking on build

## CI/CD Integration

GitHub Actions workflow (`bundle-size.yml`) checks:
- Bundle size limits on PRs
- JavaScript budget (500 KB)
- CSS budget (150 KB)
- Automatic PR comments with analysis

## Resources

- [Bundle Analysis Results](./BUNDLE_ANALYSIS_RESULTS.md)
- [Bundle Optimization Guide](./BUNDLE_OPTIMIZATION.md)
- [Vite Documentation](https://vitejs.dev)
- [React Performance](https://react.dev/learn/render-and-commit#optimizing-performance)
- [Web.dev Performance](https://web.dev/performance/)