/**
 * Testimonials Component Tests
 *
 * Comprehensive test suite for the Testimonials component
 * covering functionality, accessibility, and edge cases.
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Testimonials, {
  StarRating,
  Avatar,
  TestimonialCard,
  Testimonial,
  defaultTestimonials
} from './Testimonials';

// ===== MOCK DATA =====

const mockTestimonial: Testimonial = {
  id: 'test-1',
  name: 'John Doe',
  role: 'CEO',
  company: 'Test Corp',
  quote: 'This is a test testimonial quote.',
  rating: 5
};

const mockTestimonialWithAvatar: Testimonial = {
  ...mockTestimonial,
  id: 'test-2',
  avatar: '/path/to/avatar.jpg'
};

const mockTestimonials: Testimonial[] = [
  {
    id: 'test-1',
    name: 'Alice Johnson',
    role: 'Product Manager',
    company: 'TechStart',
    quote: 'Great product!',
    rating: 5
  },
  {
    id: 'test-2',
    name: 'Bob Smith',
    role: 'Developer',
    company: 'DevCo',
    quote: 'Highly recommended.',
    rating: 4
  }
];

// ===== TESTIMONIALS COMPONENT TESTS =====

describe('Testimonials Component', () => {
  describe('Rendering', () => {
    test('renders with default testimonials', () => {
      render(<Testimonials />);
      expect(screen.getByText(/Sarah Johnson/i)).toBeInTheDocument();
      expect(screen.getByText(/Michael Chen/i)).toBeInTheDocument();
    });

    test('renders with custom testimonials', () => {
      render(<Testimonials testimonials={mockTestimonials} />);
      expect(screen.getByText(/Alice Johnson/i)).toBeInTheDocument();
      expect(screen.getByText(/Bob Smith/i)).toBeInTheDocument();
    });

    test('renders custom title and subtitle', () => {
      render(
        <Testimonials
          title="Custom Title"
          subtitle="Custom Subtitle"
        />
      );
      expect(screen.getByText(/Custom Title/i)).toBeInTheDocument();
      expect(screen.getByText(/Custom Subtitle/i)).toBeInTheDocument();
    });

    test('renders default title and subtitle', () => {
      render(<Testimonials />);
      expect(screen.getByText(/What Our Clients Say/i)).toBeInTheDocument();
      expect(screen.getByText(/Trusted by title agents/i)).toBeInTheDocument();
    });

    test('applies custom className', () => {
      const { container } = render(
        <Testimonials className="custom-class" />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    test('renders nothing when testimonials array is empty', () => {
      const { container } = render(<Testimonials testimonials={[]} />);
      expect(container.querySelector('.testimonials-section')).not.toBeInTheDocument();
    });

    test('renders nothing when testimonials is null', () => {
      const { container } = render(<Testimonials testimonials={undefined} />);
      // Should use default testimonials instead
      expect(container.querySelector('.testimonials-section')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels for section', () => {
      render(<Testimonials />);
      const section = screen.getByRole('region', { name: /What Our Clients Say/i });
      expect(section).toBeInTheDocument();
    });

    test('uses semantic HTML elements', () => {
      const { container } = render(<Testimonials testimonials={mockTestimonials} />);
      expect(container.querySelector('section')).toBeInTheDocument();
      expect(container.querySelector('article')).toBeInTheDocument();
      expect(container.querySelector('blockquote')).toBeInTheDocument();
      expect(container.querySelector('cite')).toBeInTheDocument();
    });

    test('has proper heading hierarchy', () => {
      render(<Testimonials />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(/What Our Clients Say/i);
    });
  });
});

// ===== STAR RATING TESTS =====

describe('StarRating Component', () => {
  test('renders correct number of stars', () => {
    const { container } = render(<StarRating rating={3} />);
    const stars = container.querySelectorAll('svg');
    expect(stars).toHaveLength(5);
  });

  test('fills correct number of stars', () => {
    const { container } = render(<StarRating rating={3} />);
    const filledStars = container.querySelectorAll('.star-filled');
    const emptyStars = container.querySelectorAll('.star-empty');
    expect(filledStars).toHaveLength(3);
    expect(emptyStars).toHaveLength(2);
  });

  test('has proper ARIA label', () => {
    render(<StarRating rating={4} />);
    expect(screen.getByRole('img', { name: /4 out of 5 stars/i })).toBeInTheDocument();
  });

  test('supports custom max rating', () => {
    const { container } = render(<StarRating rating={3} maxRating={10} />);
    const stars = container.querySelectorAll('svg');
    expect(stars).toHaveLength(10);
  });

  test('applies custom className', () => {
    const { container } = render(<StarRating rating={5} className="custom-rating" />);
    expect(container.querySelector('.custom-rating')).toBeInTheDocument();
  });

  test('handles edge case: 0 rating', () => {
    const { container } = render(<StarRating rating={0} />);
    const filledStars = container.querySelectorAll('.star-filled');
    expect(filledStars).toHaveLength(0);
  });

  test('handles edge case: maximum rating', () => {
    const { container } = render(<StarRating rating={5} />);
    const filledStars = container.querySelectorAll('.star-filled');
    expect(filledStars).toHaveLength(5);
  });
});

// ===== AVATAR TESTS =====

describe('Avatar Component', () => {
  test('renders image when avatar URL provided', () => {
    render(<Avatar name="John Doe" avatar="/path/to/avatar.jpg" />);
    const img = screen.getByRole('img', { name: /John Doe's profile/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/path/to/avatar.jpg');
  });

  test('renders initials when no avatar URL', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText(/JD/i)).toBeInTheDocument();
  });

  test('generates correct initials for single name', () => {
    render(<Avatar name="Madonna" />);
    expect(screen.getByText(/M/i)).toBeInTheDocument();
  });

  test('generates correct initials for multi-part name', () => {
    render(<Avatar name="John Michael Doe" />);
    expect(screen.getByText(/JD/i)).toBeInTheDocument();
  });

  test('handles name with extra spaces', () => {
    render(<Avatar name="  John   Doe  " />);
    expect(screen.getByText(/JD/i)).toBeInTheDocument();
  });

  test('applies custom className', () => {
    const { container } = render(<Avatar name="John Doe" className="custom-avatar" />);
    expect(container.querySelector('.custom-avatar')).toBeInTheDocument();
  });

  test('has proper ARIA label for initials', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByLabelText(/John Doe's initials/i)).toBeInTheDocument();
  });
});

// ===== TESTIMONIAL CARD TESTS =====

describe('TestimonialCard Component', () => {
  test('renders all testimonial content', () => {
    render(<TestimonialCard testimonial={mockTestimonial} />);
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/CEO/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Corp/i)).toBeInTheDocument();
    expect(screen.getByText(/This is a test testimonial quote/i)).toBeInTheDocument();
  });

  test('renders star rating', () => {
    render(<TestimonialCard testimonial={mockTestimonial} />);
    expect(screen.getByRole('img', { name: /5 out of 5 stars/i })).toBeInTheDocument();
  });

  test('renders quote with proper formatting', () => {
    render(<TestimonialCard testimonial={mockTestimonial} />);
    const quote = screen.getByText(/This is a test testimonial quote/i);
    expect(quote.textContent).toContain('"');
  });

  test('uses article element for semantic HTML', () => {
    const { container } = render(<TestimonialCard testimonial={mockTestimonial} />);
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  test('uses blockquote for quote', () => {
    const { container } = render(<TestimonialCard testimonial={mockTestimonial} />);
    expect(container.querySelector('blockquote')).toBeInTheDocument();
  });

  test('uses cite for author name', () => {
    const { container } = render(<TestimonialCard testimonial={mockTestimonial} />);
    const cite = container.querySelector('cite');
    expect(cite).toBeInTheDocument();
    expect(cite).toHaveTextContent(/John Doe/i);
  });

  test('renders quote icon', () => {
    const { container } = render(<TestimonialCard testimonial={mockTestimonial} />);
    expect(container.querySelector('.quote-icon')).toBeInTheDocument();
  });

  test('renders avatar component', () => {
    render(<TestimonialCard testimonial={mockTestimonial} />);
    expect(screen.getByText(/JD/i)).toBeInTheDocument();
  });

  test('renders avatar image when provided', () => {
    render(<TestimonialCard testimonial={mockTestimonialWithAvatar} />);
    const img = screen.getByRole('img', { name: /John Doe's profile/i });
    expect(img).toHaveAttribute('src', '/path/to/avatar.jpg');
  });
});

// ===== INTEGRATION TESTS =====

describe('Testimonials Integration', () => {
  test('renders correct number of cards', () => {
    const { container } = render(<Testimonials testimonials={mockTestimonials} />);
    const cards = container.querySelectorAll('.testimonial-card');
    expect(cards).toHaveLength(2);
  });

  test('each card has unique content', () => {
    render(<Testimonials testimonials={mockTestimonials} />);
    expect(screen.getByText(/Alice Johnson/i)).toBeInTheDocument();
    expect(screen.getByText(/Bob Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/Great product/i)).toBeInTheDocument();
    expect(screen.getByText(/Highly recommended/i)).toBeInTheDocument();
  });

  test('renders different ratings correctly', () => {
    render(<Testimonials testimonials={mockTestimonials} />);
    expect(screen.getByRole('img', { name: /5 out of 5 stars/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /4 out of 5 stars/i })).toBeInTheDocument();
  });
});

// ===== DEFAULT DATA TESTS =====

describe('Default Testimonials Data', () => {
  test('has correct number of default testimonials', () => {
    expect(defaultTestimonials).toHaveLength(4);
  });

  test('each default testimonial has required fields', () => {
    defaultTestimonials.forEach((testimonial) => {
      expect(testimonial.id).toBeDefined();
      expect(testimonial.name).toBeDefined();
      expect(testimonial.role).toBeDefined();
      expect(testimonial.company).toBeDefined();
      expect(testimonial.quote).toBeDefined();
      expect(testimonial.rating).toBeGreaterThanOrEqual(1);
      expect(testimonial.rating).toBeLessThanOrEqual(5);
    });
  });

  test('default testimonials have unique IDs', () => {
    const ids = defaultTestimonials.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('default testimonials have realistic content', () => {
    defaultTestimonials.forEach((testimonial) => {
      expect(testimonial.quote.length).toBeGreaterThan(50);
      expect(testimonial.name.split(' ')).toHaveLength(2);
    });
  });
});

// ===== SNAPSHOT TESTS =====

describe('Snapshots', () => {
  test('matches snapshot with default props', () => {
    const { container } = render(<Testimonials />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot with custom props', () => {
    const { container } = render(
      <Testimonials
        testimonials={mockTestimonials}
        title="Custom Title"
        subtitle="Custom Subtitle"
        className="custom-class"
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
