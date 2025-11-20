# Testimonials Component - Integration Guide

Quick guide for integrating the Testimonials component into the ROI Systems landing page.

---

## Quick Start (5 minutes)

### 1. Import the Component

```tsx
import Testimonials from './components/Testimonials';
```

### 2. Add to Your Page

```tsx
function LandingPage() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />

      {/* Add testimonials here */}
      <Testimonials />

      <CTASection />
    </main>
  );
}
```

### 3. Done!

The component will render with default testimonials and styling.

---

## Common Integration Patterns

### Pattern 1: Landing Page (Recommended)

```tsx
// src/pages/LandingPage.tsx
import Testimonials from '../components/Testimonials';

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <h1>Transform Your Title Business</h1>
        <p>Automate workflows, engage clients, grow revenue</p>
        <button>Get Started</button>
      </section>

      {/* Features Grid */}
      <section className="features">
        <h2>Key Features</h2>
        {/* Feature cards... */}
      </section>

      {/* Testimonials - Social Proof */}
      <Testimonials
        title="Trusted by Industry Leaders"
        subtitle="See why title agents and realtors choose ROI Systems"
      />

      {/* Call to Action */}
      <section className="cta">
        <h2>Ready to Get Started?</h2>
        <button>Start Free Trial</button>
      </section>
    </div>
  );
}
```

### Pattern 2: Dedicated Testimonials Page

```tsx
// src/pages/TestimonialsPage.tsx
import Testimonials from '../components/Testimonials';

export default function TestimonialsPage() {
  return (
    <div className="testimonials-page">
      <header className="page-header">
        <h1>Customer Success Stories</h1>
        <p>Real results from real estate professionals</p>
      </header>

      <Testimonials />

      <section className="cta">
        <h2>Join Them Today</h2>
        <button>Get Started</button>
      </section>
    </div>
  );
}
```

### Pattern 3: Multiple Sections

```tsx
// Different testimonials for different industries
export default function LandingPage() {
  return (
    <>
      {/* Title Agents Section */}
      <section>
        <h2>For Title Agents</h2>
        <Testimonials
          testimonials={titleAgentTestimonials}
          title="Title Agent Success Stories"
        />
      </section>

      {/* Realtors Section */}
      <section>
        <h2>For Realtors</h2>
        <Testimonials
          testimonials={realtorTestimonials}
          title="Realtor Success Stories"
        />
      </section>
    </>
  );
}
```

---

## Styling Integration

### Option 1: Use Default Styles (Recommended)

The component uses design tokens from `tokens.css` and matches the existing design system.

```tsx
// No additional styling needed
<Testimonials />
```

### Option 2: Custom Background

```tsx
<section style={{ background: 'var(--color-bg-secondary)', padding: '4rem 0' }}>
  <Testimonials />
</section>
```

### Option 3: Custom Container Width

```tsx
<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
  <Testimonials />
</div>
```

### Option 4: Custom Styling

```css
/* In your custom CSS file */
.my-testimonials-section {
  background: linear-gradient(to bottom, #ffffff, #f9fafb);
  padding: 5rem 0;
}

.my-testimonials-section .testimonial-card {
  border-color: #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.my-testimonials-section .testimonial-card:hover {
  border-color: #667eea;
}
```

```tsx
<Testimonials className="my-testimonials-section" />
```

---

## Data Integration

### Option 1: Use Default Data (Recommended for MVP)

```tsx
<Testimonials />
```

### Option 2: Custom Static Data

```tsx
import Testimonials, { Testimonial } from './components/Testimonials';

const myTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Jane Doe',
    role: 'CEO',
    company: 'Example Corp',
    quote: 'Amazing product!',
    rating: 5
  }
];

<Testimonials testimonials={myTestimonials} />
```

### Option 3: Dynamic Data from API

```tsx
import { useState, useEffect } from 'react';
import Testimonials, { Testimonial } from './components/Testimonials';

export default function DynamicTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/testimonials')
      .then(res => res.json())
      .then(data => {
        setTestimonials(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load testimonials:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading">Loading testimonials...</div>;
  }

  return <Testimonials testimonials={testimonials} />;
}
```

### Option 4: CMS Integration (Contentful, Sanity, etc.)

```tsx
import { useEffect, useState } from 'react';
import { client } from './lib/contentful';
import Testimonials, { Testimonial } from './components/Testimonials';

export default function CMSTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    client.getEntries({ content_type: 'testimonial' })
      .then(response => {
        const mapped = response.items.map(item => ({
          id: item.sys.id,
          name: item.fields.name,
          role: item.fields.role,
          company: item.fields.company,
          avatar: item.fields.avatar?.fields.file.url,
          quote: item.fields.quote,
          rating: item.fields.rating
        }));
        setTestimonials(mapped);
      });
  }, []);

  return <Testimonials testimonials={testimonials} />;
}
```

---

## Responsive Behavior

The component is fully responsive out of the box:

- **Mobile (< 768px):** 1 column, optimized spacing
- **Tablet (768px - 1024px):** 2 columns
- **Desktop (> 1024px):** 2 columns, larger gaps

No additional configuration needed.

---

## Performance Optimization

### For Above-the-Fold Content

```tsx
// Render immediately
<Testimonials />
```

### For Below-the-Fold Content (Recommended)

```tsx
import { lazy, Suspense } from 'react';

const Testimonials = lazy(() => import('./components/Testimonials'));

function LandingPage() {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />

      {/* Lazy load testimonials */}
      <Suspense fallback={<div className="loading">Loading...</div>}>
        <Testimonials />
      </Suspense>
    </div>
  );
}
```

---

## SEO Optimization

### Add Structured Data

```tsx
export default function TestimonialsWithSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "SoftwareApplication",
      "name": "ROI Systems"
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "5",
      "bestRating": "5"
    },
    "author": {
      "@type": "Person",
      "name": "Sarah Johnson"
    },
    "reviewBody": "ROI Systems has transformed how we manage documents..."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Testimonials />
    </>
  );
}
```

---

## Common Customizations

### Change Section Title

```tsx
<Testimonials
  title="Success Stories"
  subtitle="See how we've helped businesses like yours"
/>
```

### Hide Title/Subtitle

```tsx
<Testimonials title="" subtitle="" />
```

### Show Only Some Testimonials

```tsx
import { defaultTestimonials } from './components/Testimonials';

const featured = defaultTestimonials.slice(0, 2); // First 2

<Testimonials testimonials={featured} />
```

### Filter by Rating

```tsx
const topRated = defaultTestimonials.filter(t => t.rating === 5);

<Testimonials testimonials={topRated} />
```

### Custom Order

```tsx
const ordered = [...defaultTestimonials].reverse();

<Testimonials testimonials={ordered} />
```

---

## Troubleshooting

### Issue: Testimonials not showing

**Check:**
1. Component imported correctly?
2. testimonials prop has data?
3. CSS file imported?

```tsx
// Make sure both are imported
import Testimonials from './components/Testimonials';
import './components/Testimonials.css'; // If not auto-imported
```

### Issue: Styles not applied

**Solution:** Ensure `tokens.css` is imported in your app:

```tsx
// In App.tsx or main.tsx
import './styles/tokens.css';
```

### Issue: Icons not showing

**Solution:** Install lucide-react:

```bash
npm install lucide-react
```

### Issue: Layout broken on mobile

**Solution:** Ensure viewport meta tag:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

---

## Testing Integration

### Manual Testing Checklist

- [ ] Component renders on page
- [ ] All testimonials visible
- [ ] Star ratings display correctly
- [ ] Avatars or initials show
- [ ] Responsive on mobile
- [ ] Hover effects work
- [ ] No console errors

### Automated Testing

```tsx
// Integration test
import { render, screen } from '@testing-library/react';
import LandingPage from './LandingPage';

test('landing page includes testimonials', () => {
  render(<LandingPage />);
  expect(screen.getByText(/What Our Clients Say/i)).toBeInTheDocument();
  expect(screen.getByText(/Sarah Johnson/i)).toBeInTheDocument();
});
```

---

## Migration from Existing Component

If you have an existing testimonials component:

### Step 1: Install New Component

```bash
# Files already in your project:
# - Testimonials.tsx
# - Testimonials.css
# - tokens.css (already exists)
```

### Step 2: Update Imports

```tsx
// Old
import OldTestimonials from './OldTestimonials';

// New
import Testimonials from './components/Testimonials';
```

### Step 3: Update Props

```tsx
// Old format
<OldTestimonials data={testimonialData} />

// New format
<Testimonials testimonials={testimonialData} />
```

### Step 4: Update Data Structure

```tsx
// Old
{
  name: 'John Doe',
  text: 'Great product!',
  stars: 5
}

// New
{
  id: '1',
  name: 'John Doe',
  role: 'CEO',
  company: 'Company Name',
  quote: 'Great product!',
  rating: 5
}
```

---

## Next Steps

1. **Add to Landing Page:** Integrate into your main landing page
2. **Customize Content:** Update testimonials with real customer quotes
3. **Add Images:** Upload customer avatars
4. **Test Responsive:** Verify on mobile/tablet/desktop
5. **Deploy:** Push to production

---

## Support

Need help? Check:
- Full documentation: `Testimonials.md`
- Accessibility guide: `Testimonials.accessibility.md`
- Performance guide: `Testimonials.performance.md`
- Examples: `Testimonials.example.tsx`
- Tests: `Testimonials.test.tsx`

---

## Quick Reference

### Minimal Usage
```tsx
<Testimonials />
```

### With Custom Title
```tsx
<Testimonials title="Success Stories" />
```

### With Custom Data
```tsx
<Testimonials testimonials={myData} />
```

### Full Custom
```tsx
<Testimonials
  testimonials={myData}
  title="Customer Reviews"
  subtitle="See what people say"
  className="my-custom-class"
/>
```

---

**That's it! You're ready to add testimonials to your landing page.**
