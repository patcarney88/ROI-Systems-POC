# AnimatedStat Component - Quick Integration Guide

## Quick Start (5 Minutes)

### Step 1: Import the Component

```tsx
import AnimatedStat from './components/AnimatedStat';
import { FileText, Star, Clock, DollarSign } from 'lucide-react';
```

### Step 2: Add to Your Page

```tsx
<section className="stats-section" style={{
  padding: '4rem 2rem',
  background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
}}>
  <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
    {/* Section Header */}
    <h2 style={{
      textAlign: 'center',
      fontSize: '2.5rem',
      fontWeight: 700,
      marginBottom: '3rem'
    }}>
      Our Impact in Numbers
    </h2>

    {/* Stats Grid */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '2rem'
    }}>
      <AnimatedStat
        value={10000}
        label="Documents Processed Daily"
        suffix="+"
        icon={FileText}
      />
      <AnimatedStat
        value={95.5}
        label="Client Satisfaction Rate"
        suffix="%"
        decimals={1}
        icon={Star}
      />
      <AnimatedStat
        value={40}
        label="Hours Saved Per Month"
        suffix="hrs"
        icon={Clock}
      />
      <AnimatedStat
        value={250000}
        label="Average Annual Savings"
        prefix="$"
        icon={DollarSign}
      />
    </div>
  </div>
</section>
```

### Step 3: Done!

That's it! The component will automatically:
- Animate when scrolled into view
- Format numbers with thousand separators
- Display icons with gradient backgrounds
- Handle accessibility for screen readers
- Work responsively on all devices

---

## Landing Page Integration

### Add Stats Section to LandingPage.tsx

```tsx
import AnimatedStat from '../components/AnimatedStat';
import { FileText, Star, Clock, DollarSign, Users, TrendingUp } from 'lucide-react';

// Inside your LandingPage component, add after the features section:

{/* Stats Section */}
<section id="stats" className="stats-section">
  <div className="container">
    <div className="stats-header">
      <h2>Trusted by Industry Leaders</h2>
      <p>See the measurable impact we deliver every day</p>
    </div>

    <div className="stats-grid">
      <AnimatedStat
        value={10000}
        label="Documents Processed"
        suffix="+"
        icon={FileText}
        duration={2500}
      />
      <AnimatedStat
        value={95.5}
        label="Client Satisfaction"
        suffix="%"
        decimals={1}
        icon={Star}
        delay={200}
      />
      <AnimatedStat
        value={40}
        label="Hours Saved Monthly"
        suffix="hrs"
        icon={Clock}
        delay={400}
      />
      <AnimatedStat
        value={250000}
        label="Average Annual ROI"
        prefix="$"
        icon={DollarSign}
        delay={600}
      />
    </div>
  </div>
</section>
```

### Add CSS to LandingPage.css

```css
/* Stats Section */
.stats-section {
  padding: 6rem 2rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

.stats-header {
  text-align: center;
  margin-bottom: 4rem;
}

.stats-header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--color-text-primary);
}

.stats-header p {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-section {
    padding: 4rem 1.5rem;
  }

  .stats-header h2 {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
```

---

## Dashboard Integration

### Add Stats to Title Agent Dashboard

```tsx
import AnimatedStat from '../components/AnimatedStat';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

// In TitleAgentDashboard.tsx, add after the header:

<div className="dashboard-stats">
  <AnimatedStat
    value={124}
    label="Active Transactions"
    icon={FileText}
  />
  <AnimatedStat
    value={89}
    label="Completed This Month"
    icon={CheckCircle}
  />
  <AnimatedStat
    value={3.2}
    label="Avg Days to Close"
    decimals={1}
    icon={Clock}
  />
  <AnimatedStat
    value={5}
    label="Pending Reviews"
    icon={AlertCircle}
  />
</div>
```

### Add Dashboard Stats CSS

```css
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

@media (max-width: 768px) {
  .dashboard-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .dashboard-stats {
    grid-template-columns: 1fr;
  }
}
```

---

## Common Patterns

### Pattern 1: Staggered Animation

Create a cascading effect with delays:

```tsx
<AnimatedStat value={100} label="First" delay={0} />
<AnimatedStat value={200} label="Second" delay={200} />
<AnimatedStat value={300} label="Third" delay={400} />
<AnimatedStat value={400} label="Fourth" delay={600} />
```

### Pattern 2: Percentage Stats

Perfect for satisfaction rates, completion rates:

```tsx
<AnimatedStat
  value={95.5}
  label="Client Satisfaction"
  suffix="%"
  decimals={1}
  icon={Star}
/>
```

### Pattern 3: Currency Stats

For financial metrics:

```tsx
<AnimatedStat
  value={250000}
  label="Revenue"
  prefix="$"
  separator={true}
  icon={DollarSign}
/>
```

### Pattern 4: Time-based Stats

For efficiency metrics:

```tsx
<AnimatedStat
  value={40}
  label="Time Saved"
  suffix="hrs"
  icon={Clock}
/>
```

### Pattern 5: Count Stats

For items, users, documents:

```tsx
<AnimatedStat
  value={10000}
  label="Documents Processed"
  suffix="+"
  icon={FileText}
/>
```

---

## Customization Examples

### Custom Duration

Slower animation for dramatic effect:

```tsx
<AnimatedStat
  value={1000000}
  label="Total Revenue"
  prefix="$"
  duration={3000}  // 3 seconds
  icon={TrendingUp}
/>
```

### No Thousand Separator

For cleaner look with smaller numbers:

```tsx
<AnimatedSat
  value={12500}
  label="Users"
  separator={false}
  icon={Users}
/>
```

### Custom Styling

Apply custom classes:

```tsx
<AnimatedStat
  value={100}
  label="Score"
  className="large-stat highlight"
/>
```

```css
.large-stat .animated-stat__value {
  font-size: 3rem !important;
}

.highlight .animated-stat__icon-wrapper {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}
```

---

## Best Practices

### 1. Grid Layout

Use CSS Grid with auto-fit for responsive layouts:

```css
.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}
```

### 2. Meaningful Icons

Choose icons that represent the metric:

- `FileText`: Documents, files, content
- `Star`: Ratings, satisfaction, reviews
- `Clock`: Time, duration, speed
- `DollarSign`: Money, revenue, savings
- `Users`: People, clients, team members
- `TrendingUp`: Growth, performance, metrics
- `CheckCircle`: Completion, success, verification
- `AlertCircle`: Pending, attention needed

### 3. Appropriate Formatting

- **Large numbers**: Use thousand separator (10,000)
- **Percentages**: Use 1 decimal place (95.5%)
- **Currency**: Use prefix and separator ($250,000)
- **Time**: Use appropriate suffix (40hrs, 3.2 days)

### 4. Stagger for Impact

Add 200-600ms delays for cascading effect:

```tsx
delay={index * 200}
```

### 5. Section Context

Always provide context with a heading:

```tsx
<section>
  <h2>Our Impact in Numbers</h2>
  <p>Real results from real clients</p>
  {/* Stats here */}
</section>
```

---

## Troubleshooting

### Stats Not Animating

1. Check if Intersection Observer is supported
2. Verify component is in viewport
3. Check console for errors

### Numbers Not Formatting

1. Ensure `value` is a number, not string
2. Check `separator` prop (default: true)
3. Verify `decimals` prop for decimal places

### Icons Not Showing

1. Install lucide-react: `npm install lucide-react`
2. Import icon: `import { FileText } from 'lucide-react'`
3. Pass as prop: `icon={FileText}` (not `icon="FileText"`)

### Styling Issues

1. Verify tokens.css is imported in root
2. Check CSS custom properties are defined
3. Ensure no conflicting styles

---

## Performance Tips

### 1. Limit Concurrent Animations

Don't animate more than 6-8 stats at once:

```tsx
// Good: 4 stats
<div className="stats-grid">
  <AnimatedStat ... />
  <AnimatedStat ... />
  <AnimatedStat ... />
  <AnimatedStat ... />
</div>
```

### 2. Use Delays for Staggering

Spread animations over time:

```tsx
delay={0}    // First stat
delay={200}  // Second stat
delay={400}  // Third stat
delay={600}  // Fourth stat
```

### 3. Reasonable Durations

Keep animations between 2-3 seconds:

```tsx
duration={2000}  // Good
duration={5000}  // Too slow
duration={500}   // Too fast
```

---

## Accessibility Checklist

- ✅ Component provides ARIA labels automatically
- ✅ Screen readers get final value immediately
- ✅ Respects prefers-reduced-motion
- ✅ Keyboard navigable
- ✅ Focus indicators visible
- ✅ High contrast mode supported

No additional accessibility work needed!

---

## Real-World Examples

### Example 1: SaaS Landing Page

```tsx
<section className="social-proof">
  <h2>Join Thousands of Satisfied Customers</h2>
  <div className="stats">
    <AnimatedStat value={50000} label="Active Users" suffix="+" icon={Users} />
    <AnimatedStat value={99.9} label="Uptime" suffix="%" decimals={1} icon={TrendingUp} />
    <AnimatedStat value={24} label="Support" suffix="/7" icon={Clock} />
    <AnimatedStat value={4.9} label="Rating" decimals={1} icon={Star} />
  </div>
</section>
```

### Example 2: Dashboard Overview

```tsx
<div className="dashboard-overview">
  <AnimatedStat value={234} label="Active Projects" icon={FileText} />
  <AnimatedStat value={89} label="Completion Rate" suffix="%" icon={CheckCircle} />
  <AnimatedStat value={1234567} label="Revenue" prefix="$" icon={DollarSign} />
  <AnimatedStat value={42} label="Team Members" icon={Users} />
</div>
```

### Example 3: Marketing Page

```tsx
<section className="impact-metrics">
  <h2>Our Impact</h2>
  <div className="metrics">
    <AnimatedStat value={10000} label="Documents Processed" suffix="+" icon={FileText} />
    <AnimatedStat value={95.5} label="Satisfaction" suffix="%" decimals={1} icon={Star} />
    <AnimatedStat value={40} label="Hours Saved" suffix="/mo" icon={Clock} />
    <AnimatedStat value={250000} label="ROI" prefix="$" icon={DollarSign} />
  </div>
</section>
```

---

## Summary

### What You Get

- ✅ Smooth counting animations
- ✅ Automatic viewport detection
- ✅ Number formatting (1,000s separator)
- ✅ Prefix/suffix support
- ✅ Optional icons
- ✅ Full accessibility
- ✅ Responsive design
- ✅ Performance optimized

### Installation Time

- **5 minutes** for basic integration
- **15 minutes** for styled section
- **30 minutes** for full page integration

### Support

- See `AnimatedStat.README.md` for full documentation
- See `AnimatedStat.VISUAL.md` for visual guide
- See `AnimatedStat.example.tsx` for more examples

---

**Quick Start Completed!**

You now have a production-ready animated stats component. Start by copying the Quick Start example and customize from there.

**Files**: `/frontend/src/components/AnimatedStat.tsx`
**Status**: Ready to use ✅
