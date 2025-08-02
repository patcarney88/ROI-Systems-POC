/** @type {import('tailwindcss').Config} */

const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './stories/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ROI Systems Brand Colors - Dark Teal Primary
      colors: {
        // Primary Brand Color - Dark Teal (replaces Stavvy's purple)
        primary: {
          50: '#f0fdfc',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Main primary color
          600: '#0d9488', // Dark Teal - Our primary
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        
        // Secondary Colors (adapted from Stavvy's palette)
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        
        // Accent Colors
        accent: {
          peach: {
            50: '#fef7ed',
            100: '#fdedd5',
            200: '#fbd8aa',
            300: '#f9bc74', // Peach accent (from Stavvy)
            400: '#ffbc9d', // Original Stavvy peach
            500: '#f97316',
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
          },
          orange: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#f97316',
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
          }
        },
        
        // Semantic Colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        
        // Text Colors (Stavvy-inspired)
        text: {
          primary: '#1a1c44', // Dark navy for headings
          secondary: '#64748b', // Medium gray for body text  
          tertiary: '#a0a8bd', // Light gray for supporting text
          inverse: '#ffffff', // White text on colored backgrounds
          muted: '#6b7280',
        },
        
        // Background Colors
        background: {
          primary: '#ffffff',
          secondary: '#f7f9fc', // Light gray/blue (from Stavvy)
          tertiary: '#f1f5f9',
          accent: '#fff4f0', // Light peach background
          card: '#ffffff',
          overlay: 'rgba(0, 0, 0, 0.5)',
        },
        
        // Border Colors
        border: {
          primary: '#e2e8f0',
          secondary: '#cbd5e1',
          focus: '#0d9488', // Dark teal for focus states
          error: '#ef4444',
          success: '#22c55e',
        }
      },
      
      // Typography Scale (Stavvy-inspired)
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }], // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        'base': ['1rem', { lineHeight: '1.6875rem' }], // 16px, 27px line height
        'lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        'xl': ['1.25rem', { lineHeight: '1.875rem' }], // 20px
        '2xl': ['1.5rem', { lineHeight: '2.25rem' }], // 24px
        '3xl': ['2.0625rem', { lineHeight: '2.27rem' }], // 33px, 36.3px line height
        '4xl': ['3rem', { lineHeight: '3rem' }], // 48px
        '5xl': ['4.5rem', { lineHeight: '4.5rem' }], // 72px
      },
      
      // Font Families
      fontFamily: {
        sans: ['Inter', 'system-ui', ...fontFamily.sans], // Clean modern sans-serif
        heading: ['Inter', 'system-ui', ...fontFamily.sans], // Consistent with body
        mono: ['JetBrains Mono', 'Menlo', ...fontFamily.mono],
      },
      
      // Font Weights (Stavvy uses light weights)
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300', // Emphasized in Stavvy
        normal: '400',
        medium: '500', // Used for headings in Stavvy
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      
      // Spacing System (Stavvy-inspired)
      spacing: {
        '0': '0px',
        'px': '1px',
        '0.5': '2px',
        '1': '4px',
        '2': '8px', // Micro spacing
        '3': '12px',
        '4': '16px', // Small spacing
        '5': '20px', // Medium spacing (primary in Stavvy)
        '6': '24px', // Component separation (primary in Stavvy)
        '7': '28px',
        '8': '32px',
        '9': '36px', // Large spacing
        '10': '40px',
        '11': '44px',
        '12': '48px', // Section separation
        '14': '56px', // Extra large spacing
        '16': '64px',
        '20': '80px', // Major section divisions
        '24': '96px',
        '28': '112px',
        '32': '128px',
        '36': '144px',
        '40': '160px',
        '44': '176px',
        '48': '192px',
        '52': '208px',
        '56': '224px',
        '60': '240px',
        '64': '256px',
        '72': '288px',
        '80': '320px',
        '96': '384px',
      },
      
      // Border Radius (Stavvy uses rounded elements)
      borderRadius: {
        'none': '0px',
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px', // Stavvy's button radius
        'full': '9999px',
      },
      
      // Box Shadows (Stavvy's subtle shadows)
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'card': 'rgba(20, 20, 43, 0.06) 0px 8px 28px 0px', // Stavvy's card shadow
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'none': 'none',
      },
      
      // Breakpoints (Mobile-first, Stavvy-compatible)
      screens: {
        'xs': '320px', // Small mobile
        'sm': '568px', // Large mobile (Stavvy breakpoint)
        'md': '768px', // Tablet (Stavvy breakpoint)
        'lg': '1024px', // Small desktop
        'xl': '1280px', // Desktop (Stavvy breakpoint)
        '2xl': '1380px', // Large desktop (Stavvy breakpoint)
        '3xl': '1536px', // Extra large
      },
      
      // Animation (Stavvy's smooth transitions)
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-up': 'scaleUp 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      // Custom animations
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      
      // Transitions (Stavvy's 0.3s ease timing)
      transitionTimingFunction: {
        'ease-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)', // Stavvy's easing
      },
      transitionDuration: {
        '150': '150ms', // Fast
        '300': '300ms', // Normal (Stavvy default)
        '500': '500ms', // Slow
      },
      
      // Grid
      gridTemplateColumns: {
        'auto-fit': 'repeat(auto-fit, minmax(0, 1fr))',
        'auto-fill': 'repeat(auto-fill, minmax(0, 1fr))',
      },
      
      // Max Width (Container widths)
      maxWidth: {
        'xs': '20rem',   // 320px
        'sm': '24rem',   // 384px
        'md': '28rem',   // 448px
        'lg': '32rem',   // 512px
        'xl': '36rem',   // 576px
        '2xl': '42rem',  // 672px
        '3xl': '48rem',  // 768px
        '4xl': '56rem',  // 896px
        '5xl': '64rem',  // 1024px
        '6xl': '72rem',  // 1152px
        '7xl': '79rem',  // 1264px (Stavvy container)
        '8xl': '90rem',  // 1440px (Stavvy max)
        'container': '79rem', // 1264px primary container
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class', // Use class-based form styling
    }),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    
    // Custom plugin for Stavvy-inspired utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Stavvy-style button utilities
        '.btn-primary': {
          backgroundColor: theme('colors.primary.600'),
          color: theme('colors.white'),
          padding: `${theme('spacing.4')} ${theme('spacing.6')}`,
          borderRadius: theme('borderRadius.3xl'),
          fontWeight: theme('fontWeight.light'),
          transition: `all ${theme('transitionDuration.300')} ${theme('transitionTimingFunction.ease-smooth')}`,
          '&:hover': {
            backgroundColor: theme('colors.primary.700'),
            transform: 'scale(1.05)',
          },
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme('colors.primary.200')}`,
          },
        },
        
        '.btn-outline': {
          backgroundColor: 'transparent',
          color: theme('colors.primary.600'),
          padding: `${theme('spacing.4')} ${theme('spacing.6')}`,
          borderRadius: theme('borderRadius.3xl'),
          border: `2px solid ${theme('colors.primary.600')}`,
          fontWeight: theme('fontWeight.light'),
          transition: `all ${theme('transitionDuration.300')} ${theme('transitionTimingFunction.ease-smooth')}`,
          '&:hover': {
            backgroundColor: theme('colors.primary.600'),
            color: theme('colors.white'),
            transform: 'scale(1.05)',
          },
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme('colors.primary.200')}`,
          },
        },
        
        // Stavvy-style card utilities
        '.card': {
          backgroundColor: theme('colors.background.card'),
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.card'),
          padding: theme('spacing.6'),
        },
        
        // Stavvy-style text utilities
        '.text-heading': {
          color: theme('colors.text.primary'),
          fontWeight: theme('fontWeight.medium'),
        },
        '.text-body': {
          color: theme('colors.text.secondary'),
          fontWeight: theme('fontWeight.light'),
          lineHeight: theme('lineHeight.relaxed'),
        },
        
        // Container utilities
        '.container-responsive': {
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          '@screen sm': {
            paddingLeft: theme('spacing.6'),
            paddingRight: theme('spacing.6'),
          },
          '@screen lg': {
            paddingLeft: theme('spacing.8'),
            paddingRight: theme('spacing.8'),
          },
          '@screen xl': {
            maxWidth: theme('maxWidth.container'),
          },
        },
      };
      
      addUtilities(newUtilities);
    },
  ],
};