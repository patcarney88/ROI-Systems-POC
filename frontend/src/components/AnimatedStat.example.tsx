/**
 * AnimatedStat Component - Usage Examples
 *
 * This file demonstrates various ways to use the AnimatedStat component.
 * Copy these examples into your page components as needed.
 */

import React from 'react';
import AnimatedStat from './AnimatedStat';
import { FileText, Star, Clock, DollarSign, Users, TrendingUp } from 'lucide-react';

/**
 * Example 1: Basic Usage
 * Simple stat with number and label
 */
export const BasicExample: React.FC = () => (
  <AnimatedStat
    value={10000}
    label="Documents Processed"
  />
);

/**
 * Example 2: With Icon and Suffix
 * Includes icon from lucide-react and "+" suffix
 */
export const WithIconExample: React.FC = () => (
  <AnimatedStat
    value={10000}
    label="Documents Processed"
    suffix="+"
    icon={FileText}
  />
);

/**
 * Example 3: Percentage with Decimals
 * Shows decimal values for percentages
 */
export const PercentageExample: React.FC = () => (
  <AnimatedStat
    value={95.5}
    label="Client Satisfaction"
    suffix="%"
    decimals={1}
    icon={Star}
  />
);

/**
 * Example 4: Time-based Stat
 * Using suffix for hours saved
 */
export const TimeExample: React.FC = () => (
  <AnimatedStat
    value={40}
    label="Hours Saved Per Month"
    suffix="hrs"
    icon={Clock}
  />
);

/**
 * Example 5: Currency with Prefix
 * Dollar sign prefix with thousand separator
 */
export const CurrencyExample: React.FC = () => (
  <AnimatedStat
    value={250000}
    label="Annual Savings"
    prefix="$"
    icon={DollarSign}
  />
);

/**
 * Example 6: Large Number without Separator
 * Disable thousand separator for cleaner look
 */
export const NoSeparatorExample: React.FC = () => (
  <AnimatedStat
    value={12500}
    label="Active Users"
    separator={false}
    icon={Users}
  />
);

/**
 * Example 7: Custom Animation Duration
 * Slower animation for dramatic effect
 */
export const CustomDurationExample: React.FC = () => (
  <AnimatedStat
    value={1000000}
    label="Total Revenue"
    prefix="$"
    duration={3000}
    icon={TrendingUp}
  />
);

/**
 * Example 8: Delayed Animation
 * Start animation 500ms after becoming visible
 */
export const DelayedExample: React.FC = () => (
  <AnimatedStat
    value={99.9}
    label="Uptime"
    suffix="%"
    decimals={1}
    delay={500}
    icon={TrendingUp}
  />
);

/**
 * Example 9: Stats Grid Layout
 * Multiple stats in a responsive grid
 */
export const StatsGridExample: React.FC = () => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2rem',
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto'
  }}>
    <AnimatedStat
      value={10000}
      label="Documents Processed"
      suffix="+"
      icon={FileText}
    />
    <AnimatedStat
      value={95.5}
      label="Client Satisfaction"
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
      label="Annual Savings"
      prefix="$"
      icon={DollarSign}
    />
  </div>
);

/**
 * Example 10: With Custom CSS Classes
 * Apply additional styling via className
 */
export const CustomClassExample: React.FC = () => (
  <AnimatedStat
    value={500}
    label="Projects Completed"
    suffix="+"
    icon={FileText}
    className="custom-stat-style"
  />
);

/**
 * Real-World Example: Homepage Stats Section
 *
 * This is how you'd typically use AnimatedStat on a landing page
 */
export const HomepageStatsSection: React.FC = () => (
  <section style={{
    padding: '4rem 2rem',
    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
  }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{
        textAlign: 'center',
        fontSize: '2.5rem',
        fontWeight: 700,
        marginBottom: '1rem'
      }}>
        Our Impact in Numbers
      </h2>
      <p style={{
        textAlign: 'center',
        fontSize: '1.125rem',
        color: '#6b7280',
        marginBottom: '3rem'
      }}>
        See how we're helping businesses transform their operations
      </p>

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
          duration={2500}
        />
        <AnimatedStat
          value={95.5}
          label="Client Satisfaction Rate"
          suffix="%"
          decimals={1}
          icon={Star}
          delay={200}
        />
        <AnimatedStat
          value={40}
          label="Average Hours Saved Monthly"
          suffix="hrs"
          icon={Clock}
          delay={400}
        />
        <AnimatedStat
          value={250000}
          label="Average Annual Savings"
          prefix="$"
          icon={DollarSign}
          delay={600}
        />
      </div>
    </div>
  </section>
);

/**
 * Integration Tips:
 *
 * 1. Grid Layout:
 *    - Use CSS Grid with auto-fit for responsive layouts
 *    - Minimum column width of 200-250px works well
 *    - 2rem gap provides good spacing
 *
 * 2. Animation Timing:
 *    - Default 2000ms duration works for most cases
 *    - Add delays (200-600ms) for staggered effects
 *    - Use longer duration (3000ms) for very large numbers
 *
 * 3. Icons:
 *    - Import from lucide-react
 *    - Keep icons relevant to the statistic
 *    - Optional but recommended for visual interest
 *
 * 4. Number Formatting:
 *    - Use separator=true for large numbers (10,000)
 *    - Add decimals for precision (95.5%)
 *    - Choose appropriate prefix/suffix ($, %, +, hrs, etc.)
 *
 * 5. Accessibility:
 *    - Component handles screen readers automatically
 *    - Respects prefers-reduced-motion
 *    - No additional ARIA needed
 *
 * 6. Performance:
 *    - Uses Intersection Observer to only animate when visible
 *    - Animations use requestAnimationFrame
 *    - Cleans up resources on unmount
 */
