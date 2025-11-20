/**
 * Testimonials Component - Usage Examples
 *
 * This file demonstrates various ways to use the Testimonials component
 * in different scenarios and configurations.
 */

import Testimonials, { Testimonial, defaultTestimonials } from './Testimonials';

// ===== EXAMPLE 1: Basic Usage with Default Data =====

export function BasicTestimonialsExample() {
  return (
    <div className="page">
      <Testimonials />
    </div>
  );
}

// ===== EXAMPLE 2: Custom Title and Subtitle =====

export function CustomHeaderExample() {
  return (
    <Testimonials
      title="Success Stories"
      subtitle="See how we've helped businesses like yours"
    />
  );
}

// ===== EXAMPLE 3: Custom Testimonials Data =====

const customTestimonials: Testimonial[] = [
  {
    id: 'custom-1',
    name: 'Jennifer Williams',
    role: 'VP of Operations',
    company: 'National Title Group',
    avatar: '/avatars/jennifer.jpg', // Optional
    quote: 'ROI Systems streamlined our entire workflow. We\'ve reduced processing time by 60% and our team is more productive than ever.',
    rating: 5
  },
  {
    id: 'custom-2',
    name: 'Robert Chen',
    role: 'Independent Realtor',
    company: 'Chen Properties',
    quote: 'As a solo realtor, I need tools that work as hard as I do. ROI Systems keeps me organized and helps me stay connected with my clients effortlessly.',
    rating: 5
  }
];

export function CustomDataExample() {
  return (
    <Testimonials
      testimonials={customTestimonials}
      title="Real Results from Real Clients"
      subtitle="Join hundreds of satisfied customers"
    />
  );
}

// ===== EXAMPLE 4: Landing Page Integration =====

export function LandingPageExample() {
  return (
    <main className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <h1>Transform Your Title Business</h1>
        <p>Automate workflows, engage clients, grow revenue</p>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Features</h2>
        {/* Feature cards... */}
      </section>

      {/* Testimonials Section */}
      <Testimonials
        title="Trusted by Industry Leaders"
        subtitle="See why title agents and realtors choose ROI Systems"
      />

      {/* CTA Section */}
      <section className="cta">
        <h2>Ready to Get Started?</h2>
        <button>Start Free Trial</button>
      </section>
    </main>
  );
}

// ===== EXAMPLE 5: With Custom Styling =====

export function CustomStyledExample() {
  return (
    <div style={{ background: '#f9fafb', padding: '4rem 0' }}>
      <Testimonials
        className="dark-theme-testimonials"
        title="What People Are Saying"
      />
    </div>
  );
}

// ===== EXAMPLE 6: Loading State =====

export function LoadingStateExample() {
  // In a real app, you'd fetch data and show loading state
  const isLoading = false;
  const testimonials = isLoading ? [] : defaultTestimonials;

  if (isLoading) {
    return (
      <div className="testimonials-loading">
        <p>Loading testimonials...</p>
      </div>
    );
  }

  return <Testimonials testimonials={testimonials} />;
}

// ===== EXAMPLE 7: Dynamic Data from API =====

export function DynamicDataExample() {
  // Example with React hooks (in a real component)
  /*
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/testimonials')
      .then(res => res.json())
      .then(data => {
        setTestimonials(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <Testimonials testimonials={testimonials} />;
  */

  // Static example
  return <Testimonials />;
}

// ===== EXAMPLE 8: Filtered Testimonials =====

export function FilteredTestimonialsExample() {
  // Show only 5-star testimonials
  const fiveStarTestimonials = defaultTestimonials.filter(
    (t) => t.rating === 5
  );

  return (
    <Testimonials
      testimonials={fiveStarTestimonials}
      title="5-Star Reviews"
      subtitle="Our highest-rated testimonials"
    />
  );
}

// ===== EXAMPLE 9: Industry-Specific Testimonials =====

export function IndustrySpecificExample() {
  // Filter by role/industry
  const titleAgentTestimonials = defaultTestimonials.filter((t) =>
    t.role.toLowerCase().includes('title')
  );

  return (
    <Testimonials
      testimonials={titleAgentTestimonials}
      title="Title Agent Success Stories"
      subtitle="See how ROI Systems helps title professionals"
    />
  );
}

// ===== EXAMPLE 10: Minimal Layout (No Header) =====

export function MinimalExample() {
  return (
    <Testimonials
      testimonials={defaultTestimonials.slice(0, 2)} // Show only 2
      title=""
      subtitle=""
    />
  );
}

// ===== EXAMPLE 11: Full Page Testimonials =====

export function FullPageExample() {
  return (
    <div className="testimonials-page">
      <header className="page-header">
        <h1>Customer Testimonials</h1>
        <p>Real stories from real customers</p>
      </header>

      <Testimonials
        title="What Our Clients Say"
        subtitle="Trusted by professionals across the industry"
      />

      <div className="cta-section">
        <h2>Join Them Today</h2>
        <button>Get Started</button>
      </div>
    </div>
  );
}

// ===== EXAMPLE 12: With Additional Content =====

export function EnhancedExample() {
  return (
    <section className="testimonials-wrapper">
      {/* Pre-testimonials content */}
      <div className="testimonials-intro">
        <h2>Don't Just Take Our Word For It</h2>
        <p>
          Over 500+ title agents, realtors, and real estate professionals
          trust ROI Systems to grow their business.
        </p>
      </div>

      {/* Testimonials */}
      <Testimonials title="" subtitle="" />

      {/* Post-testimonials content */}
      <div className="testimonials-stats">
        <div className="stat">
          <strong>500+</strong>
          <span>Happy Clients</span>
        </div>
        <div className="stat">
          <strong>4.9/5</strong>
          <span>Average Rating</span>
        </div>
        <div className="stat">
          <strong>98%</strong>
          <span>Satisfaction Rate</span>
        </div>
      </div>
    </section>
  );
}

// ===== EXAMPLE 13: Lazy Loading =====

export function LazyLoadExample() {
  /*
  import { lazy, Suspense } from 'react';

  const Testimonials = lazy(() => import('./components/Testimonials'));

  return (
    <Suspense fallback={<div>Loading testimonials...</div>}>
      <Testimonials />
    </Suspense>
  );
  */

  return <Testimonials />;
}

// ===== EXAMPLE 14: With Analytics Tracking =====

export function AnalyticsExample() {
  const testimonials = defaultTestimonials.map((t) => ({
    ...t,
    // Could add onClick handlers for tracking
  }));

  /*
  const handleTestimonialView = (testimonialId: string) => {
    // Track testimonial view
    analytics.track('Testimonial Viewed', { testimonialId });
  };
  */

  return (
    <Testimonials
      testimonials={testimonials}
      title="Customer Success Stories"
    />
  );
}

// ===== EXAMPLE 15: Responsive Sections =====

export function ResponsiveSectionsExample() {
  return (
    <div className="marketing-page">
      {/* Desktop: Full layout */}
      <div className="desktop-only">
        <Testimonials
          title="What Industry Leaders Are Saying"
          subtitle="Join the professionals who trust ROI Systems"
        />
      </div>

      {/* Mobile: Simplified */}
      <div className="mobile-only">
        <Testimonials
          testimonials={defaultTestimonials.slice(0, 2)}
          title="Client Reviews"
          subtitle="See what people are saying"
        />
      </div>
    </div>
  );
}

// ===== EXAMPLE 16: A/B Testing Variations =====

export function ABTestExample() {
  const variant = 'A'; // Could come from A/B testing service

  const variantA = {
    title: 'What Our Clients Say',
    subtitle: 'Trusted by title agents and realtors nationwide'
  };

  const variantB = {
    title: 'Success Stories',
    subtitle: 'Real results from real estate professionals'
  };

  const config = variant === 'A' ? variantA : variantB;

  return (
    <Testimonials
      title={config.title}
      subtitle={config.subtitle}
    />
  );
}

// ===== EXAMPLE 17: Themed Variations =====

export function ThemedExample() {
  return (
    <>
      {/* Light theme (default) */}
      <Testimonials
        title="Customer Testimonials"
        className="light-theme"
      />

      {/* Could add dark theme support */}
      {/*
      <Testimonials
        title="Customer Testimonials"
        className="dark-theme"
      />
      */}
    </>
  );
}

// ===== EXAMPLE 18: Integration with Other Components =====

export function IntegratedExample() {
  return (
    <div className="content-section">
      {/* Stats */}
      <div className="stats-grid">
        {/* StatCard components */}
      </div>

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Button */}
      <div className="cta-container">
        <button className="btn btn-primary">
          Start Your Free Trial
        </button>
      </div>
    </div>
  );
}

// ===== EXAMPLE 19: SEO Optimized =====

export function SEOOptimizedExample() {
  return (
    <>
      {/* Add structured data for rich snippets */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Review',
          itemReviewed: {
            '@type': 'Product',
            name: 'ROI Systems'
          },
          reviewRating: {
            '@type': 'Rating',
            ratingValue: '5',
            bestRating: '5'
          },
          author: {
            '@type': 'Person',
            name: 'Sarah Johnson'
          }
        })}
      </script>

      <Testimonials
        title="Customer Reviews"
        subtitle="See what professionals are saying about ROI Systems"
      />
    </>
  );
}

// ===== EXAMPLE 20: Print-Friendly Version =====

export function PrintFriendlyExample() {
  return (
    <div className="printable-testimonials">
      <style>{`
        @media print {
          .testimonial-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <Testimonials
        title="ROI Systems Customer Testimonials"
        subtitle="Printed on ${new Date().toLocaleDateString()}"
      />
    </div>
  );
}

// ===== Export All Examples =====

export default {
  BasicTestimonialsExample,
  CustomHeaderExample,
  CustomDataExample,
  LandingPageExample,
  CustomStyledExample,
  LoadingStateExample,
  DynamicDataExample,
  FilteredTestimonialsExample,
  IndustrySpecificExample,
  MinimalExample,
  FullPageExample,
  EnhancedExample,
  LazyLoadExample,
  AnalyticsExample,
  ResponsiveSectionsExample,
  ABTestExample,
  ThemedExample,
  IntegratedExample,
  SEOOptimizedExample,
  PrintFriendlyExample
};
