# Testimonials Component

Professional testimonials component for displaying customer reviews and social proof on the ROI Systems landing page.

## Overview

The Testimonials component displays customer testimonials in a responsive grid layout with star ratings, quotes, avatars, and author information. It's designed to build trust and credibility with potential customers.

## Features

- Responsive grid layout (2 columns on desktop, 1 on mobile)
- 5-star rating system
- Avatar support with automatic initials fallback
- Quote icon decoration
- Smooth hover animations
- Fully accessible (WCAG compliant)
- Mobile-first responsive design
- Print-friendly styles
- Respects user motion preferences

## Installation

```tsx
import Testimonials, { Testimonial, defaultTestimonials } from './components/Testimonials';
```

## Basic Usage

### With Default Data

```tsx
import Testimonials from './components/Testimonials';

function LandingPage() {
  return (
    <main>
      <Testimonials />
    </main>
  );
}
```

### With Custom Data

```tsx
import Testimonials, { Testimonial } from './components/Testimonials';

const myTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'John Doe',
    role: 'CEO',
    company: 'Tech Corp',
    quote: 'This product changed our business!',
    rating: 5
  }
];

function LandingPage() {
  return (
    <Testimonials
      testimonials={myTestimonials}
      title="Customer Success Stories"
      subtitle="See what our clients have to say"
    />
  );
}
```

### With Custom Styling

```tsx
<Testimonials
  testimonials={myTestimonials}
  className="my-custom-class"
  title="Testimonials"
/>
```

## API Reference

### Main Component Props

#### `TestimonialsProps`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `testimonials` | `Testimonial[]` | `defaultTestimonials` | Array of testimonial data |
| `title` | `string` | `"What Our Clients Say"` | Section title (optional) |
| `subtitle` | `string` | `"Trusted by title agents..."` | Section subtitle (optional) |
| `className` | `string` | `""` | Additional CSS classes |

### Testimonial Interface

```typescript
interface Testimonial {
  id: string;              // Unique identifier
  name: string;            // Customer name
  role: string;            // Job title
  company: string;         // Company name
  avatar?: string;         // Avatar image URL (optional)
  quote: string;           // Testimonial text
  rating: number;          // 1-5 stars
}
```

## Sub-Components

### StarRating

Displays a 5-star rating visualization.

```tsx
import { StarRating } from './components/Testimonials';

<StarRating rating={5} />
```

**Props:**
- `rating: number` - Rating value (1-5)
- `maxRating?: number` - Maximum stars (default: 5)
- `className?: string` - Additional CSS classes

### Avatar

Displays user avatar or initials fallback.

```tsx
import { Avatar } from './components/Testimonials';

<Avatar name="John Doe" avatar="/path/to/image.jpg" />
<Avatar name="Jane Smith" /> {/* Shows initials */}
```

**Props:**
- `name: string` - User's full name
- `avatar?: string` - Avatar image URL (optional)
- `className?: string` - Additional CSS classes

### TestimonialCard

Individual testimonial card component.

```tsx
import { TestimonialCard } from './components/Testimonials';

<TestimonialCard testimonial={testimonialData} />
```

**Props:**
- `testimonial: Testimonial` - Testimonial data object

## Default Testimonials

The component includes 4 default testimonials for title agents, realtors, and homeowners:

1. **Sarah Johnson** - Senior Title Agent, Premier Title Services
2. **Michael Chen** - Managing Broker, Evergreen Real Estate Group
3. **Emily Rodriguez** - Title Operations Manager, Coastal Title Company
4. **David Martinez** - Real Estate Agent, Martinez Realty

## Styling

### CSS Classes

- `.testimonials-section` - Main container
- `.testimonials-header` - Header section
- `.testimonials-title` - Title element
- `.testimonials-subtitle` - Subtitle element
- `.testimonials-grid` - Grid container
- `.testimonial-card` - Individual card
- `.testimonial-quote` - Quote text
- `.testimonial-footer` - Footer with author info
- `.testimonial-avatar` - Avatar container
- `.testimonial-author` - Author info container
- `.star-rating` - Star rating container
- `.quote-icon-wrapper` - Quote icon decoration

### Custom Styling

You can override styles by targeting the CSS classes:

```css
/* Custom card background */
.testimonials-section .testimonial-card {
  background: linear-gradient(to bottom right, #f9fafb, #ffffff);
}

/* Custom star color */
.testimonials-section .star-filled {
  fill: #ff6b6b;
  stroke: #ff6b6b;
}

/* Custom spacing */
.testimonials-section .testimonials-grid {
  gap: 2rem;
}
```

## Responsive Behavior

### Breakpoints

- **Mobile** (< 768px): 1 column layout
- **Tablet** (768px - 1024px): 2 columns
- **Desktop** (1024px+): 2 columns with larger gaps
- **Large Desktop** (1440px+): Max width constraint

### Mobile Optimizations

- Smaller font sizes for quotes
- Reduced avatar size (40px vs 48px)
- Reduced padding
- Single column layout

## Accessibility

### WCAG Compliance

- Semantic HTML structure (`<article>`, `<blockquote>`, `<cite>`)
- ARIA labels for star ratings
- Alt text for avatar images
- Proper heading hierarchy
- Keyboard accessible
- Focus visible indicators
- Sufficient color contrast
- Screen reader friendly

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Focus states clearly visible
- Logical tab order

### Screen Readers

- Star ratings announced as "X out of 5 stars"
- Avatar images have descriptive alt text
- Proper semantic structure for quotes and citations

### Motion Preferences

The component respects the `prefers-reduced-motion` media query:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations disabled */
}
```

## Performance Considerations

### Optimizations

1. **CSS Grid**: Efficient layout without JavaScript
2. **No External Dependencies**: Only uses lucide-react icons
3. **Efficient Re-renders**: React memo can be applied if needed
4. **Lazy Loading**: Can be lazy loaded with React.lazy()
5. **Small Bundle Size**: Minimal CSS and code

### Bundle Size

- Component: ~2KB (minified)
- CSS: ~3KB (minified)
- Total: ~5KB

### Loading Strategy

```tsx
// Lazy load for below-the-fold content
const Testimonials = lazy(() => import('./components/Testimonials'));

function LandingPage() {
  return (
    <Suspense fallback={<div>Loading testimonials...</div>}>
      <Testimonials />
    </Suspense>
  );
}
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Android

## Examples

### Minimal Example

```tsx
<Testimonials />
```

### Full Featured Example

```tsx
const customTestimonials: Testimonial[] = [
  {
    id: 'test-1',
    name: 'Alice Johnson',
    role: 'Product Manager',
    company: 'TechStart Inc',
    avatar: '/avatars/alice.jpg',
    quote: 'Exceptional service and support. Highly recommend!',
    rating: 5
  },
  {
    id: 'test-2',
    name: 'Bob Williams',
    role: 'CTO',
    company: 'Innovation Labs',
    quote: 'Game-changer for our workflow. Saved us countless hours.',
    rating: 5
  }
];

<Testimonials
  testimonials={customTestimonials}
  title="Success Stories"
  subtitle="Hear from our satisfied customers"
  className="landing-testimonials"
/>
```

### Integration with Landing Page

```tsx
import Testimonials from './components/Testimonials';

function LandingPage() {
  return (
    <div className="landing-page">
      <Hero />
      <Features />
      <Testimonials
        title="Loved by Thousands"
        subtitle="Join the companies that trust ROI Systems"
      />
      <CTA />
    </div>
  );
}
```

## Testing

### Unit Tests

```tsx
import { render, screen } from '@testing-library/react';
import Testimonials from './Testimonials';

test('renders testimonials with default data', () => {
  render(<Testimonials />);
  expect(screen.getByText(/Sarah Johnson/i)).toBeInTheDocument();
});

test('renders custom title', () => {
  render(<Testimonials title="Custom Title" />);
  expect(screen.getByText(/Custom Title/i)).toBeInTheDocument();
});

test('displays correct star rating', () => {
  render(<Testimonials />);
  const ratings = screen.getAllByRole('img', { name: /5 out of 5 stars/i });
  expect(ratings).toHaveLength(4);
});
```

### Accessibility Tests

```tsx
import { axe } from 'jest-axe';

test('has no accessibility violations', async () => {
  const { container } = render(<Testimonials />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Troubleshooting

### Common Issues

**Issue**: Avatar images not loading
- **Solution**: Check image URLs are correct and accessible

**Issue**: Stars not displaying correctly
- **Solution**: Ensure lucide-react is installed: `npm install lucide-react`

**Issue**: Layout breaks on mobile
- **Solution**: Verify tokens.css is imported in your app

**Issue**: Hover effects not working
- **Solution**: Check that transitions are not disabled globally

## Migration Guide

### From Previous Version

If migrating from a custom implementation:

```tsx
// Old
<TestimonialSection data={data} />

// New
<Testimonials testimonials={data} />
```

### Data Format Changes

Ensure your data matches the `Testimonial` interface:

```typescript
// Old format
{ name: 'John', text: 'Great!', stars: 5 }

// New format
{
  id: '1',
  name: 'John',
  role: 'CEO',
  company: 'Company',
  quote: 'Great!',
  rating: 5
}
```

## Best Practices

1. **Data Quality**: Use authentic, detailed testimonials
2. **Image Optimization**: Compress avatar images
3. **Loading State**: Show skeleton while loading async data
4. **Update Frequency**: Refresh testimonials regularly
5. **A/B Testing**: Test different testimonials for conversion
6. **Social Proof**: Include diverse roles and companies
7. **Length**: Keep quotes concise (2-3 sentences ideal)
8. **Verification**: Consider adding verification badges

## Related Components

- `StatCard` - For displaying statistics
- `Button` - For CTA buttons
- `Modal` - For expanded testimonial views

## License

Part of the ROI Systems project. All rights reserved.

## Support

For issues or questions, contact the development team.
