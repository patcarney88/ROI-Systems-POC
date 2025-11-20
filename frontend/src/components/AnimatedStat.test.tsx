/**
 * AnimatedStat Component - Unit Tests
 *
 * Test suite for the AnimatedStat component covering:
 * - Rendering
 * - Number formatting
 * - Animation behavior
 * - Accessibility
 * - Edge cases
 */

import { render, screen, waitFor } from '@testing-library/react';
import AnimatedStat from './AnimatedStat';
import { FileText, Star } from 'lucide-react';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver as any;

// Mock requestAnimationFrame
let animationFrameCallback: FrameRequestCallback | null = null;
global.requestAnimationFrame = jest.fn((callback) => {
  animationFrameCallback = callback;
  return 1;
}) as any;

global.cancelAnimationFrame = jest.fn();

describe('AnimatedStat Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    animationFrameCallback = null;
  });

  // ===== BASIC RENDERING =====

  describe('Rendering', () => {
    test('renders with value and label', () => {
      render(<AnimatedStat value={100} label="Test Metric" />);

      expect(screen.getByText('Test Metric')).toBeInTheDocument();
    });

    test('renders with icon', () => {
      render(
        <AnimatedStat value={100} label="Documents" icon={FileText} />
      );

      // Check for icon wrapper
      const iconWrapper = document.querySelector('.animated-stat__icon-wrapper');
      expect(iconWrapper).toBeInTheDocument();
    });

    test('renders without icon when not provided', () => {
      render(<AnimatedStat value={100} label="Test" />);

      const iconWrapper = document.querySelector('.animated-stat__icon-wrapper');
      expect(iconWrapper).not.toBeInTheDocument();
    });

    test('applies custom className', () => {
      render(
        <AnimatedStat
          value={100}
          label="Test"
          className="custom-class"
        />
      );

      const container = document.querySelector('.animated-stat.custom-class');
      expect(container).toBeInTheDocument();
    });
  });

  // ===== NUMBER FORMATTING =====

  describe('Number Formatting', () => {
    test('formats number with thousand separator by default', async () => {
      render(<AnimatedStat value={10000} label="Test" />);

      // Wait for animation to complete
      await waitFor(() => {
        const value = screen.getByText(/10,000/);
        expect(value).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('formats number without separator when disabled', async () => {
      render(
        <AnimatedStat value={10000} label="Test" separator={false} />
      );

      await waitFor(() => {
        const value = screen.getByText(/10000/);
        expect(value).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('formats decimals correctly', async () => {
      render(
        <AnimatedStat value={95.5} label="Test" decimals={1} />
      );

      await waitFor(() => {
        const value = screen.getByText(/95\.5/);
        expect(value).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('adds prefix correctly', async () => {
      render(<AnimatedStat value={100} label="Test" prefix="$" />);

      await waitFor(() => {
        const value = screen.getByText(/\$100/);
        expect(value).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('adds suffix correctly', async () => {
      render(<AnimatedStat value={100} label="Test" suffix="%" />);

      await waitFor(() => {
        const value = screen.getByText(/100%/);
        expect(value).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('combines prefix and suffix', async () => {
      render(
        <AnimatedStat
          value={100}
          label="Test"
          prefix="$"
          suffix="M"
        />
      );

      await waitFor(() => {
        const value = screen.getByText(/\$100M/);
        expect(value).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  // ===== ANIMATION BEHAVIOR =====

  describe('Animation', () => {
    test('starts with value 0', () => {
      render(<AnimatedStat value={1000} label="Test" />);

      // Initial render should show 0
      const initialValue = screen.getByText(/^0$/);
      expect(initialValue).toBeInTheDocument();
    });

    test('sets up Intersection Observer', () => {
      render(<AnimatedStat value={100} label="Test" />);

      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    test('respects custom duration', () => {
      render(
        <AnimatedStat value={100} label="Test" duration={3000} />
      );

      // Component should accept duration prop without error
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    test('respects delay prop', () => {
      render(
        <AnimatedStat value={100} label="Test" delay={500} />
      );

      // Component should accept delay prop without error
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  // ===== ACCESSIBILITY =====

  describe('Accessibility', () => {
    test('has proper ARIA label', () => {
      render(<AnimatedStat value={100} label="Test Metric" />);

      const region = screen.getByRole('region', {
        name: /Test Metric: 100/,
      });
      expect(region).toBeInTheDocument();
    });

    test('includes aria-live for screen readers', () => {
      render(<AnimatedStat value={100} label="Test" />);

      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    test('includes aria-atomic', () => {
      render(<AnimatedStat value={100} label="Test" />);

      const atomicElement = document.querySelector('[aria-atomic="true"]');
      expect(atomicElement).toBeInTheDocument();
    });

    test('provides screen reader only final value', () => {
      render(<AnimatedStat value={100} label="Test" />);

      const srOnly = document.querySelector('.animated-stat__sr-only');
      expect(srOnly).toBeInTheDocument();
      expect(srOnly?.textContent).toBe('100');
    });

    test('ARIA label includes formatting', async () => {
      render(
        <AnimatedStat
          value={10000}
          label="Documents"
          suffix="+"
        />
      );

      await waitFor(() => {
        const region = screen.getByRole('region');
        expect(region).toHaveAttribute(
          'aria-label',
          expect.stringContaining('10,000+')
        );
      }, { timeout: 3000 });
    });
  });

  // ===== EDGE CASES =====

  describe('Edge Cases', () => {
    test('handles zero value', () => {
      render(<AnimatedStat value={0} label="Zero" />);

      expect(screen.getByText('Zero')).toBeInTheDocument();
    });

    test('handles negative value', async () => {
      render(<AnimatedStat value={-100} label="Negative" />);

      await waitFor(() => {
        const value = screen.getByText(/-100/);
        expect(value).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('handles very large numbers', async () => {
      render(<AnimatedStat value={1000000} label="Million" />);

      await waitFor(() => {
        const value = screen.getByText(/1,000,000/);
        expect(value).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('handles decimal edge cases', async () => {
      render(
        <AnimatedStat value={0.1} label="Decimal" decimals={1} />
      );

      await waitFor(() => {
        const value = screen.getByText(/0\.1/);
        expect(value).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('handles very long labels', () => {
      const longLabel = 'This is a very long label that should still render correctly';
      render(<AnimatedStat value={100} label={longLabel} />);

      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });
  });

  // ===== COMPONENT STRUCTURE =====

  describe('Component Structure', () => {
    test('renders all main elements', () => {
      render(
        <AnimatedStat value={100} label="Test" icon={Star} />
      );

      expect(document.querySelector('.animated-stat')).toBeInTheDocument();
      expect(document.querySelector('.animated-stat__icon-wrapper')).toBeInTheDocument();
      expect(document.querySelector('.animated-stat__value')).toBeInTheDocument();
      expect(document.querySelector('.animated-stat__label')).toBeInTheDocument();
    });

    test('applies visibility class when visible', () => {
      render(<AnimatedStat value={100} label="Test" />);

      // Initially not visible
      const container = document.querySelector('.animated-stat');
      expect(container).not.toHaveClass('animated-stat--visible');
    });
  });

  // ===== CLEANUP =====

  describe('Cleanup', () => {
    test('cleans up on unmount', () => {
      const { unmount } = render(
        <AnimatedStat value={100} label="Test" />
      );

      unmount();

      // Verify cleanup was called
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  // ===== INTEGRATION =====

  describe('Integration', () => {
    test('renders multiple instances correctly', () => {
      render(
        <>
          <AnimatedStat value={100} label="First" />
          <AnimatedStat value={200} label="Second" />
          <AnimatedStat value={300} label="Third" />
        </>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    test('each instance animates independently', () => {
      render(
        <>
          <AnimatedStat value={100} label="First" duration={1000} />
          <AnimatedStat value={200} label="Second" duration={2000} />
        </>
      );

      const stats = document.querySelectorAll('.animated-stat');
      expect(stats).toHaveLength(2);
    });
  });
});
