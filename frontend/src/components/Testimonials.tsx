import { Star, Quote } from 'lucide-react';
import './Testimonials.css';

/**
 * Testimonials Component
 *
 * Displays customer testimonials in a professional grid layout.
 * Features star ratings, quotes, and customer information.
 *
 * @component
 * @example
 * ```tsx
 * <Testimonials
 *   testimonials={testimonialData}
 *   title="What Our Clients Say"
 *   subtitle="Trusted by title agents, realtors, and homeowners"
 * />
 * ```
 */

// ===== TYPES =====

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar?: string;
  quote: string;
  rating: number; // 1-5 stars
}

export interface TestimonialsProps {
  testimonials?: Testimonial[];
  title?: string;
  subtitle?: string;
  className?: string;
}

// ===== DEFAULT DATA =====

export const defaultTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Senior Title Agent',
    company: 'Premier Title Services',
    quote: 'ROI Systems has transformed how we manage documents and client relationships. What used to take hours now takes minutes. Our client retention rate has increased by 35% since implementation.',
    rating: 5
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Managing Broker',
    company: 'Evergreen Real Estate Group',
    quote: 'The automated marketing campaigns have been a game-changer. We\'re staying top-of-mind with past clients without the manual work. The analytics dashboard shows exactly what\'s working.',
    rating: 5
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    role: 'Title Operations Manager',
    company: 'Coastal Title Company',
    quote: 'Document processing that used to be error-prone and time-consuming is now automated and accurate. Our team saves over 20 hours per week, allowing us to focus on client relationships.',
    rating: 5
  },
  {
    id: '4',
    name: 'David Martinez',
    role: 'Real Estate Agent',
    company: 'Martinez Realty',
    quote: 'As a solo agent, ROI Systems gives me the automation tools of a large brokerage. The client engagement tracking helps me identify who needs attention before they go dormant.',
    rating: 5
  }
];

// ===== SUB-COMPONENTS =====

/**
 * StarRating Component
 * Displays a 5-star rating with filled/unfilled stars
 */
interface StarRatingProps {
  rating: number;
  maxRating?: number;
  className?: string;
}

function StarRating({ rating, maxRating = 5, className = '' }: StarRatingProps) {
  const stars = Array.from({ length: maxRating }, (_, index) => index + 1);

  return (
    <div
      className={`star-rating ${className}`}
      role="img"
      aria-label={`${rating} out of ${maxRating} stars`}
    >
      {stars.map((star) => (
        <Star
          key={star}
          size={16}
          className={star <= rating ? 'star-filled' : 'star-empty'}
          fill={star <= rating ? '#FFB800' : 'none'}
          stroke={star <= rating ? '#FFB800' : '#D1D5DB'}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/**
 * Avatar Component
 * Displays user avatar or initials fallback
 */
interface AvatarProps {
  name: string;
  avatar?: string;
  className?: string;
}

function Avatar({ name, avatar, className = '' }: AvatarProps) {
  // Generate initials from name (first letter of first and last name)
  const getInitials = (fullName: string): string => {
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return (
      nameParts[0].charAt(0).toUpperCase() +
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };

  return (
    <div className={`testimonial-avatar ${className}`}>
      {avatar ? (
        <img
          src={avatar}
          alt={`${name}'s profile`}
          className="avatar-image"
        />
      ) : (
        <div className="avatar-initials" aria-label={`${name}'s initials`}>
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}

/**
 * TestimonialCard Component
 * Individual testimonial card with quote, rating, and user info
 */
interface TestimonialCardProps {
  testimonial: Testimonial;
}

function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const { name, role, company, avatar, quote, rating } = testimonial;

  return (
    <article className="testimonial-card">
      {/* Quote Icon */}
      <div className="quote-icon-wrapper">
        <Quote
          size={24}
          className="quote-icon"
          aria-hidden="true"
        />
      </div>

      {/* Star Rating */}
      <StarRating rating={rating} className="testimonial-rating" />

      {/* Quote Text */}
      <blockquote className="testimonial-quote">
        "{quote}"
      </blockquote>

      {/* User Info */}
      <footer className="testimonial-footer">
        <Avatar name={name} avatar={avatar} />
        <div className="testimonial-author">
          <cite className="author-name">{name}</cite>
          <p className="author-role">
            {role} at {company}
          </p>
        </div>
      </footer>
    </article>
  );
}

// ===== MAIN COMPONENT =====

/**
 * Testimonials Component
 * Main component that displays a grid of testimonial cards
 */
export default function Testimonials({
  testimonials = defaultTestimonials,
  title = 'What Our Clients Say',
  subtitle = 'Trusted by title agents, realtors, and homeowners across the country',
  className = ''
}: TestimonialsProps) {
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section
      className={`testimonials-section ${className}`}
      aria-labelledby="testimonials-title"
    >
      {/* Section Header */}
      {(title || subtitle) && (
        <header className="testimonials-header">
          {title && (
            <h2 id="testimonials-title" className="testimonials-title">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="testimonials-subtitle">
              {subtitle}
            </p>
          )}
        </header>
      )}

      {/* Testimonials Grid */}
      <div className="testimonials-grid">
        {testimonials.map((testimonial) => (
          <TestimonialCard
            key={testimonial.id}
            testimonial={testimonial}
          />
        ))}
      </div>
    </section>
  );
}

// ===== EXPORTS =====

export { StarRating, Avatar, TestimonialCard };
