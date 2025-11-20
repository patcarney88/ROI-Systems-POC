# AnimatedStat Component

A production-ready React component that displays animated statistics with smooth counting animations, intersection observer triggers, and comprehensive accessibility support.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Props API](#props-api)
- [Examples](#examples)
- [Styling](#styling)
- [Accessibility](#accessibility)
- [Performance](#performance)
- [Browser Support](#browser-support)

## Features

- **Smooth Animations**: Numbers count up with easeOutQuart easing function
- **Intersection Observer**: Animations trigger when component enters viewport
- **Number Formatting**: Automatic thousand separators, decimal support, prefix/suffix
- **Accessibility**: Screen reader support, ARIA attributes, reduced motion support
- **Performance**: Uses requestAnimationFrame, cleans up resources properly
- **Responsive**: Mobile-first design with breakpoint adjustments
- **Icons**: Optional icon support from lucide-react
- **TypeScript**: Full type safety with comprehensive interfaces
- **Customizable**: Animation duration, delays, formatting options

## Installation

The component is already included in the project. Import it directly:

```tsx
import AnimatedStat from './components/AnimatedStat';
import { FileText } from 'lucide-react';
```

## Basic Usage

```tsx
import AnimatedStat from './components/AnimatedStat';
import { FileText } from 'lucide-react';

function MyPage() {
  return (
    <AnimatedStat
      value={10000}
      label="Documents Processed"
      suffix="+"
      icon={FileText}
    />
  );
}
```

## Props API

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `value` | `number` | The final value to count up to |
| `label` | `string` | Label text displayed below the number |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `suffix` | `string` | `''` | Text to append after the number (e.g., "+", "%", "hrs") |
| `prefix` | `string` | `''` | Text to prepend before the number (e.g., "$") |
| `duration` | `number` | `2000` | Animation duration in milliseconds |
| `delay` | `number` | `0` | Delay before starting animation in milliseconds |
| `icon` | `React.ComponentType` | `undefined` | Optional icon component from lucide-react |
| `decimals` | `number` | `0` | Number of decimal places to display |
| `separator` | `boolean` | `true` | Whether to use thousand separators (10,000) |
| `className` | `string` | `''` | Additional CSS classes |

## Examples

### Basic Stat

```tsx
<AnimatedStat
  value={5000}
  label="Active Users"
/>
```

### Percentage with Decimals

```tsx
<AnimatedStat
  value={95.5}
  label="Client Satisfaction"
  suffix="%"
  decimals={1}
  icon={Star}
/>
```

### Currency

```tsx
<AnimatedStat
  value={250000}
  label="Annual Savings"
  prefix="$"
  icon={DollarSign}
/>
```

### Time-based

```tsx
<AnimatedStat
  value={40}
  label="Hours Saved Per Month"
  suffix="hrs"
  icon={Clock}
/>
```

### With Custom Duration

```tsx
<AnimatedStat
  value={1000000}
  label="Total Revenue"
  prefix="$"
  duration={3000}
  icon={TrendingUp}
/>
```

### Stats Grid Layout

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '2rem'
}}>
  <AnimatedStat value={10000} label="Documents" suffix="+" icon={FileText} />
  <AnimatedStat value={95.5} label="Satisfaction" suffix="%" decimals={1} icon={Star} />
  <AnimatedStat value={40} label="Hours Saved" suffix="hrs" icon={Clock} />
  <AnimatedStat value={250000} label="Savings" prefix="$" icon={DollarSign} />
</div>
```

### Staggered Animations

```tsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
  <AnimatedStat value={100} label="Stat 1" delay={0} />
  <AnimatedStat value={200} label="Stat 2" delay={200} />
  <AnimatedStat value={300} label="Stat 3" delay={400} />
  <AnimatedStat value={400} label="Stat 4" delay={600} />
</div>
```

## Styling

### Design Tokens

The component uses CSS custom properties (design tokens) for consistent theming:

- `--space-*`: Spacing values
- `--text-*`: Font sizes
- `--font-*`: Font weights
- `--color-*`: Color palette
- `--radius-*`: Border radius
- `--gradient-brand`: Brand gradient
- `--transition-*`: Transition timings

### Custom Styling

You can override styles using the `className` prop:

```tsx
<AnimatedStat
  value={500}
  label="Projects"
  className="my-custom-stat"
/>
```

```css
.my-custom-stat .animated-stat__value {
  font-size: 3rem;
}

.my-custom-stat .animated-stat__label {
  color: #667eea;
}
```

### CSS Classes

Available classes for targeting:

- `.animated-stat`: Main container
- `.animated-stat--visible`: Applied when visible
- `.animated-stat__icon-wrapper`: Icon container
- `.animated-stat__icon`: Icon element
- `.animated-stat__value`: Animated number
- `.animated-stat__label`: Label text

## Accessibility

### Screen Readers

- `aria-label`: Provides full context with final value
- `aria-live="polite"`: Announces value changes during animation
- `aria-atomic="true"`: Reads entire value on update
- `.animated-stat__sr-only`: Provides final value immediately for screen readers

### Keyboard Navigation

- Component is focusable with visible focus outline
- Focus styles use brand colors with 4px offset

### Reduced Motion

Automatically respects `prefers-reduced-motion` preference:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations disabled, shows final value immediately */
}
```

### High Contrast Mode

Special styling for high contrast mode:

```css
@media (prefers-contrast: high) {
  /* Enhanced contrast for visibility */
}
```

## Performance

### Optimization Techniques

1. **Intersection Observer**: Only animates when visible in viewport
2. **requestAnimationFrame**: Smooth 60fps animations
3. **useMemo**: Memoizes formatNumber function
4. **Cleanup**: Properly cancels animations and observers on unmount
5. **Single Animation**: Only animates once per mount (no re-animation on scroll)

### Memory Management

```typescript
useEffect(() => {
  // ... setup observer

  return () => {
    observer.disconnect(); // Clean up observer
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current); // Cancel animation
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current); // Cancel timeout
    }
  };
}, []);
```

### Best Practices

- **Grid Layouts**: Use `auto-fit` and `minmax()` for responsive grids
- **Staggered Delays**: Add 200-600ms delays for cascading effect
- **Animation Duration**: 2000-3000ms works well for most numbers
- **Viewport Threshold**: Default 0.3 (30% visible) triggers animation

## Browser Support

- **Chrome**: 51+
- **Firefox**: 55+
- **Safari**: 12.1+
- **Edge**: 15+
- **Mobile**: iOS Safari 12.2+, Chrome Android 51+

### Required Features

- Intersection Observer API
- requestAnimationFrame
- CSS Custom Properties
- CSS Grid
- Modern ES6+ JavaScript

### Polyfills

Not required for modern browsers. If supporting older browsers:

```bash
npm install intersection-observer
```

```tsx
import 'intersection-observer';
```

## Advanced Usage

### Dynamic Values

```tsx
const [stats, setStats] = useState({ users: 100, revenue: 50000 });

<AnimatedStat value={stats.users} label="Users" />
<AnimatedStat value={stats.revenue} label="Revenue" prefix="$" />
```

### Conditional Rendering

```tsx
{isLoading ? (
  <Skeleton />
) : (
  <AnimatedStat value={data.count} label="Total" />
)}
```

### Error Handling

```tsx
<AnimatedStat
  value={isNaN(apiData) ? 0 : apiData}
  label="Metric"
/>
```

## Troubleshooting

### Animation Not Triggering

1. Check element is in viewport
2. Verify `hasAnimated` state is working
3. Check Intersection Observer support
4. Ensure component is mounted

### Numbers Not Formatting

1. Verify `separator` prop is true
2. Check `decimals` value
3. Ensure `value` is a number, not string

### Performance Issues

1. Reduce animation duration
2. Limit number of concurrent animations
3. Use staggered delays
4. Check for memory leaks in console

## Files

- `AnimatedStat.tsx`: Main component
- `AnimatedStat.css`: Styles and animations
- `AnimatedStat.example.tsx`: Usage examples
- `AnimatedStat.README.md`: This documentation

## License

Part of ROI Systems project.

---

**Created**: 2025-11-20
**Version**: 1.0.0
**Phase**: 2.2.3 - Social Proof & Credibility
