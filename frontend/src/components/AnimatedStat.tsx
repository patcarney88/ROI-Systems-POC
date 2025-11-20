import React, { useEffect, useRef, useState, useMemo } from 'react';
import './AnimatedStat.css';

/**
 * AnimatedStat Component Props Interface
 *
 * Example usage:
 * <AnimatedStat
 *   value={10000}
 *   label="Documents Processed"
 *   suffix="+"
 *   icon={FileText}
 * />
 */
interface AnimatedStatProps {
  /** Final value to count to */
  value: number;
  /** Label text (e.g., "Documents Processed") */
  label: string;
  /** Optional suffix (e.g., "+", "%", "hrs") */
  suffix?: string;
  /** Optional prefix (e.g., "$") */
  prefix?: string;
  /** Animation duration in ms (default: 2000) */
  duration?: number;
  /** Delay before starting animation in ms (default: 0) */
  delay?: number;
  /** Optional icon component from lucide-react */
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  /** Number of decimal places (default: 0) */
  decimals?: number;
  /** Use thousand separator (default: true) */
  separator?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Easing function for smooth deceleration
 * Uses easeOutQuart for natural-feeling animation
 */
const easeOutQuart = (t: number): number => {
  return 1 - Math.pow(1 - t, 4);
};

/**
 * AnimatedStat Component
 *
 * Displays a statistic with an animated counter that triggers when the element
 * comes into view. Features include:
 * - Intersection Observer for viewport detection
 * - Smooth easing animation
 * - Number formatting with separators and decimals
 * - Accessibility support
 * - Reduced motion support
 * - Optional icon display
 *
 * @example
 * <AnimatedStat
 *   value={95.5}
 *   label="Client Satisfaction"
 *   suffix="%"
 *   decimals={1}
 *   icon={Star}
 * />
 */
const AnimatedStat: React.FC<AnimatedStatProps> = ({
  value,
  label,
  suffix = '',
  prefix = '',
  duration = 2000,
  delay = 0,
  icon: Icon,
  decimals = 0,
  separator = true,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Format number with thousands separator and decimals
   */
  const formatNumber = useMemo(() => {
    return (num: number): string => {
      let formatted = num.toFixed(decimals);

      if (separator) {
        const parts = formatted.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        formatted = parts.join('.');
      }

      return `${prefix}${formatted}${suffix}`;
    };
  }, [decimals, separator, prefix, suffix]);

  /**
   * Check for reduced motion preference
   */
  const prefersReducedMotion = useMemo(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  /**
   * Start the counting animation
   */
  const startAnimation = () => {
    // If reduced motion is preferred, show final value immediately
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const currentValue = easedProgress * value;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure final value is exact
        setDisplayValue(value);
      }
    };

    // Apply delay before starting animation
    timeoutRef.current = setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(animate);
    }, delay);
  };

  /**
   * Set up Intersection Observer to trigger animation when in viewport
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setIsVisible(true);
            setHasAnimated(true);
            startAnimation();
          }
        });
      },
      {
        threshold: 0.3, // Trigger when 30% of element is visible
        rootMargin: '0px 0px -50px 0px', // Slight offset from bottom
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Cleanup function
    return () => {
      observer.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [hasAnimated]); // Only run once

  return (
    <div
      ref={containerRef}
      className={`animated-stat ${isVisible ? 'animated-stat--visible' : ''} ${className}`}
      role="region"
      aria-label={`${label}: ${formatNumber(value)}`}
    >
      {/* Icon */}
      {Icon && (
        <div className="animated-stat__icon-wrapper">
          <Icon size={32} className="animated-stat__icon" />
        </div>
      )}

      {/* Animated Number */}
      <div
        className="animated-stat__value"
        aria-live="polite"
        aria-atomic="true"
      >
        {formatNumber(displayValue)}
      </div>

      {/* Screen reader only: Provide final value immediately */}
      <span className="animated-stat__sr-only">
        {formatNumber(value)}
      </span>

      {/* Label */}
      <div className="animated-stat__label">{label}</div>
    </div>
  );
};

export default AnimatedStat;
