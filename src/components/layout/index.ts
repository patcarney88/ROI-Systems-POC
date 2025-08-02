/**
 * Layout Components Index
 * Designed by: Frontend Specialist + UX Designer
 * 
 * Central export point for layout components
 */

export { default as Layout } from './Layout';
export { default as Navbar } from './Navbar';
export { default as Sidebar } from './Sidebar';

// Layout utilities and configurations
export const LAYOUT_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const SIDEBAR_WIDTHS = {
  collapsed: 64, // 16 * 4px
  expanded: 256, // 64 * 4px
} as const;

export const NAVBAR_HEIGHT = 64; // 16 * 4px

// Common layout patterns
export const LayoutPatterns = {
  Dashboard: 'sidebar + navbar + main content',
  Landing: 'navbar + main content + footer',
  Auth: 'centered content only',
  Settings: 'sidebar + main content (no navbar)',
  Mobile: 'bottom navigation + main content',
} as const;