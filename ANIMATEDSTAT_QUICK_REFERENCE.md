# AnimatedStat Component - Quick Reference Card

## One-Line Import

```tsx
import AnimatedStat from './components/AnimatedStat';
import { FileText, Star, Clock, DollarSign } from 'lucide-react';
```

## Basic Usage

```tsx
<AnimatedStat value={10000} label="Documents Processed" suffix="+" icon={FileText} />
```

## Visual Preview

```
┌─────────────────────────────────┐
│                                 │
│         ┌─────────┐             │
│         │   📄    │             │ ← Icon (optional)
│         └─────────┘             │   64x64px, gradient bg
│                                 │
│         10,000+                 │ ← Animated Number
│                                 │   2.5rem, gradient text
│                                 │   Counts from 0 to value
│    Documents Processed          │ ← Label
│                                 │   1rem, secondary color
│                                 │
└─────────────────────────────────┘
     Fades in when scrolled into view
     Animation: 2 seconds (default)
```

## Props Cheat Sheet

| Prop | Type | Default | Example |
|------|------|---------|---------|
| `value` | number | required | `10000` |
| `label` | string | required | `"Documents"` |
| `suffix` | string | `''` | `"+"`, `"%"`, `"hrs"` |
| `prefix` | string | `''` | `"$"` |
| `duration` | number | `2000` | `3000` (3 seconds) |
| `delay` | number | `0` | `200` (0.2 seconds) |
| `icon` | Component | `undefined` | `FileText` |
| `decimals` | number | `0` | `1` (for 95.5) |
| `separator` | boolean | `true` | `false` (10000 vs 10,000) |
| `className` | string | `''` | `"custom-stat"` |

## Common Patterns

### Percentage
```tsx
<AnimatedStat value={95.5} label="Satisfaction" suffix="%" decimals={1} icon={Star} />
// Shows: 95.5%
```

### Currency
```tsx
<AnimatedStat value={250000} label="Revenue" prefix="$" icon={DollarSign} />
// Shows: $250,000
```

### Time
```tsx
<AnimatedStat value={40} label="Hours Saved" suffix="hrs" icon={Clock} />
// Shows: 40hrs
```

### Count
```tsx
<AnimatedStat value={10000} label="Documents" suffix="+" icon={FileText} />
// Shows: 10,000+
```

## Grid Layout (4 Columns)

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '2rem'
}}>
  <AnimatedStat value={10000} label="Documents" suffix="+" icon={FileText} />
  <AnimatedStat value={95.5} label="Satisfaction" suffix="%" decimals={1} icon={Star} />
  <AnimatedStat value={40} label="Hours Saved" suffix="hrs" icon={Clock} />
  <AnimatedStat value={250000} label="Revenue" prefix="$" icon={DollarSign} />
</div>
```

## Staggered Animation

```tsx
<AnimatedStat value={100} label="First" delay={0} />
<AnimatedStat value={200} label="Second" delay={200} />
<AnimatedStat value={300} label="Third" delay={400} />
<AnimatedStat value={400} label="Fourth" delay={600} />
```

## Popular Icons (from lucide-react)

```tsx
import {
  FileText,      // Documents, files
  Star,          // Ratings, satisfaction
  Clock,         // Time, duration
  DollarSign,    // Money, revenue
  Users,         // People, team
  TrendingUp,    // Growth, metrics
  CheckCircle,   // Success, completion
  AlertCircle,   // Alerts, pending
  Target,        // Goals, objectives
  Award,         // Achievements
  BarChart3,     // Analytics
  Shield,        // Security, protection
} from 'lucide-react';
```

## Number Formatting Examples

```
Input              Output (separator=true)    Output (separator=false)
─────────────────────────────────────────────────────────────────────
1000               1,000                      1000
10000              10,000                     10000
1000000            1,000,000                  1000000
95.5 (decimals=1)  95.5                       95.5
95.5 (decimals=2)  95.50                      95.50
```

## Responsive Breakpoints

```
Desktop (> 768px)     Tablet (≤ 768px)      Mobile (≤ 480px)
────────────────────────────────────────────────────────────
Icon: 64x64          Icon: 56x56           Icon: 48x48
Number: 2.5rem       Number: 1.875rem      Number: 1.5rem
Label: 1rem          Label: 0.875rem       Label: 0.875rem
Padding: 1.5rem      Padding: 1rem         Padding: 1rem
```

## Animation Timeline

```
Time        Progress    Display (for value=10000)
──────────────────────────────────────────────────
0ms         0%          0
500ms       25%         2,500
1000ms      50%         5,000
1500ms      75%         7,500
2000ms      100%        10,000 (final)
```

## Features Checklist

- ✅ Smooth 60fps animation
- ✅ Auto-triggers on scroll into view
- ✅ Thousand separator formatting
- ✅ Decimal support
- ✅ Prefix/suffix support
- ✅ Optional icons
- ✅ Responsive design
- ✅ Accessibility (WCAG AA)
- ✅ Screen reader support
- ✅ Keyboard navigation
- ✅ Reduced motion support
- ✅ High contrast mode
- ✅ TypeScript types
- ✅ Zero dependencies (except lucide-react for icons)

## Accessibility

```tsx
// Automatic features:
- ARIA labels with full context
- aria-live="polite" for updates
- Screen reader gets final value immediately
- Focus indicators
- Respects prefers-reduced-motion
- Keyboard accessible
```

## Performance

```
- Uses requestAnimationFrame (60fps)
- Intersection Observer (only animates when visible)
- Automatic cleanup on unmount
- Single animation per mount
- Memoized functions
- Minimal re-renders
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Not animating | Check if element is in viewport |
| No icon showing | Import from lucide-react: `import { Icon } from 'lucide-react'` |
| Wrong format | Ensure `value` is number, not string |
| Styling issues | Check tokens.css is imported |

## File Locations

```
Component:      /frontend/src/components/AnimatedStat.tsx
Styles:         /frontend/src/components/AnimatedStat.css
Tests:          /frontend/src/components/AnimatedStat.test.tsx
Examples:       /frontend/src/components/AnimatedStat.example.tsx
Documentation:  /frontend/src/components/AnimatedStat.README.md
Visual Guide:   /frontend/src/components/AnimatedStat.VISUAL.md
```

## Quick Copy-Paste Examples

### Landing Page Stats

```tsx
<section style={{ padding: '4rem 2rem', background: '#f9fafb' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
    <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem' }}>
      Our Impact in Numbers
    </h2>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '2rem'
    }}>
      <AnimatedStat value={10000} label="Documents Processed" suffix="+" icon={FileText} />
      <AnimatedStat value={95.5} label="Client Satisfaction" suffix="%" decimals={1} icon={Star} />
      <AnimatedStat value={40} label="Hours Saved Monthly" suffix="hrs" icon={Clock} />
      <AnimatedStat value={250000} label="Average Annual ROI" prefix="$" icon={DollarSign} />
    </div>
  </div>
</section>
```

### Dashboard Metrics

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2rem'
}}>
  <AnimatedStat value={124} label="Active Transactions" icon={FileText} />
  <AnimatedStat value={89} label="Completed This Month" icon={CheckCircle} />
  <AnimatedStat value={3.2} label="Avg Days to Close" decimals={1} icon={Clock} />
  <AnimatedStat value={5} label="Pending Reviews" icon={AlertCircle} />
</div>
```

## Testing

```bash
# Run tests
npm test -- AnimatedStat.test.tsx

# Run with coverage
npm test -- --coverage AnimatedStat.test.tsx
```

## Size

- Component: 5.5 KB
- Styles: 4.5 KB
- Total: 10 KB (minified: ~3 KB)

## Browser Support

- Chrome 51+
- Firefox 55+
- Safari 12.1+
- Edge 15+

## Dependencies

```json
{
  "react": "^18.0.0",
  "lucide-react": "^0.263.0" // Optional, only for icons
}
```

## Status

✅ **Production Ready**
- Fully tested (30+ tests)
- Documented
- Accessible
- Performant
- Responsive

---

**Last Updated**: November 20, 2025
**Version**: 1.0.0
**Phase**: 2.2.3 - Social Proof & Credibility
