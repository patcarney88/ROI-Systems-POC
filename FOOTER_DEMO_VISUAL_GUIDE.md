# Footer Demo Mode Indicator - Visual Guide

A visual reference for the Footer component's demo mode indicator.

---

## Desktop View (1440px+)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  [Main Page Content Above]                                              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│              🎬 Demo Mode Active - Using mock data                      │
│                   (Blue background #eff6ff)                             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │                         │  │                                      │ │
│  │  🏠 ROI Systems          │  │  Platform    Resources    Company   │ │
│  │                         │  │  ─────────   ─────────    ────────  │ │
│  │  Real Estate Document   │  │  Dashboard   Documentation  About   │ │
│  │  Management & Client    │  │  Documents   API Reference  Blog    │ │
│  │  Retention Platform     │  │  Clients     Support        Careers │ │
│  │                         │  │  Analytics   Status         Contact │ │
│  │                         │  │                                      │ │
│  └─────────────────────────┘  └──────────────────────────────────────┘ │
│                                                                          │
│  ────────────────────────────────────────────────────────────────────── │
│                                                                          │
│  © 2025 ROI Systems. All rights reserved.                               │
│                                 Privacy Policy    Terms of Service      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Tablet View (768px - 1139px)

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  [Main Page Content Above]                      │
│                                                  │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│                                                  │
│    🎬 Demo Mode Active - Using mock data        │
│          (Blue background #eff6ff)              │
│                                                  │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│                                                  │
│  🏠 ROI Systems                                   │
│  Real Estate Document Management &               │
│  Client Retention Platform                       │
│                                                  │
│  ────────────────────────────────────────────  │
│                                                  │
│  Platform        Resources       Company        │
│  ─────────       ─────────       ────────       │
│  Dashboard       Documentation   About          │
│  Documents       API Reference   Blog           │
│  Clients         Support          Careers       │
│  Analytics       Status           Contact       │
│                                                  │
│  ────────────────────────────────────────────  │
│                                                  │
│  © 2025 ROI Systems. All rights reserved.       │
│                                                  │
│  Privacy Policy    Terms of Service             │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Mobile View (< 768px)

```
┌────────────────────────────────┐
│                                │
│  [Main Page Content Above]    │
│                                │
└────────────────────────────────┘

┌────────────────────────────────┐
│                                │
│          🎬                     │
│    Demo Mode Active            │
│    Using mock data             │
│   (Blue background #eff6ff)    │
│                                │
└────────────────────────────────┘

┌────────────────────────────────┐
│                                │
│  🏠 ROI Systems                 │
│                                │
│  Real Estate Document          │
│  Management & Client           │
│  Retention Platform            │
│                                │
│  ──────────────────────────  │
│                                │
│  Platform                      │
│  ─────────                     │
│  Dashboard                     │
│  Documents                     │
│  Clients                       │
│  Analytics                     │
│                                │
│  Resources                     │
│  ─────────                     │
│  Documentation                 │
│  API Reference                 │
│  Support                       │
│  Status                        │
│                                │
│  Company                       │
│  ────────                      │
│  About                         │
│  Blog                          │
│  Careers                       │
│  Contact                       │
│                                │
│  ──────────────────────────  │
│                                │
│  © 2025 ROI Systems.           │
│  All rights reserved.          │
│                                │
│  Privacy Policy                │
│  Terms of Service              │
│                                │
└────────────────────────────────┘
```

---

## Demo Mode Indicator - Detailed View

### Visual Elements

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   🎬  Demo Mode Active - Using mock data                   │
│   ↑                                                         │
│   │                                                         │
│   PlayCircle Icon (18px)                                    │
│   - Color: #2563eb (--color-blue-600)                      │
│   - Animation: Pulse (2s ease-in-out infinite)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
   ↑                                                           ↑
   │                                                           │
   Padding: 12px 24px                                         │
   Background: #eff6ff (--color-blue-50)                      │
   Border-top: 2px solid #3b82f6 (--color-blue-500)          │
                                                              │
                                    Text: #1e40af (--color-blue-700)
                                    Font: 14px medium weight
```

---

## Color Palette

### Demo Indicator Colors
```css
Background:   #eff6ff   (--color-blue-50)    Light blue
Border:       #3b82f6   (--color-blue-500)   Blue
Icon:         #2563eb   (--color-blue-600)   Medium blue
Text:         #1e40af   (--color-blue-700)   Dark blue
```

### Footer Colors
```css
Background:   #1f2937   (--gray-900)         Dark gray
Text:         #ffffff                         White
Text Muted:   rgba(255, 255, 255, 0.7)       70% white
Text Subtle:  rgba(255, 255, 255, 0.6)       60% white
Border:       rgba(255, 255, 255, 0.1)       10% white
```

---

## Animation

### Pulse Effect (Demo Icon)

```
Keyframes:
  0%     opacity: 1.0   ●
  50%    opacity: 0.6   ○
  100%   opacity: 1.0   ●

Duration: 2 seconds
Timing: ease-in-out
Loop: infinite
```

Visual representation:
```
Time:   0s     0.5s    1.0s    1.5s    2.0s
Icon:   ●      ◐       ○       ◑       ●
        Full   Fading  Light   Fading  Full
```

---

## Spacing & Layout

### Demo Indicator
```
Padding (Desktop):  12px 24px (vertical horizontal)
Padding (Mobile):   12px 16px
Margin (Top):       Negative to overlap footer padding
Margin (Bottom):    32px (--space-8)
Text Alignment:     Center (flexbox)
Gap:                8px (--space-2) between icon and text
```

### Footer Main
```
Padding (Desktop):  64px 24px 32px (top horizontal bottom)
Padding (Mobile):   48px 16px 24px
Max Width:          1440px
Margin:             0 auto
```

---

## Typography

### Demo Indicator Text
```
Font Size:     14px (--text-sm)
Font Weight:   500 (--font-medium)
Line Height:   1.25 (--leading-tight)
Color:         #1e40af (--color-blue-700)
```

### Footer Logo
```
Font Size:     20px (--font-xl)
Font Weight:   700 (--font-bold)
Color:         #ffffff (white)
```

### Footer Tagline
```
Font Size:     14px (--font-sm)
Font Weight:   300 (--font-light)
Line Height:   1.625 (--leading-relaxed)
Color:         rgba(255, 255, 255, 0.7)
```

### Footer Column Headers
```
Font Size:     14px (--font-sm)
Font Weight:   600 (--font-semibold)
Transform:     uppercase
Letter Space:  0.05em
Color:         #ffffff (white)
```

### Footer Links
```
Font Size:     14px (--font-sm)
Font Weight:   400 (--font-normal)
Color:         rgba(255, 255, 255, 0.7)
Hover Color:   #ffffff (white)
```

---

## Interactive States

### Links

#### Default State
```
Color: rgba(255, 255, 255, 0.7)
Text Decoration: none
```

#### Hover State
```
Color: #ffffff
Transition: 200ms ease
```

#### Focus State
```
Outline: 2px solid #ffffff
Outline Offset: 2px
Border Radius: 4px
```

---

## Accessibility Features

### Semantic HTML
```html
<footer>           Landmark role
  <div role="status" aria-live="polite">  Status region
    <PlayCircle aria-hidden="true" />     Decorative
    <span>Demo Mode Active...</span>      Announced
  </div>
  <nav>            Navigation region
    <Link>         Interactive elements
  </nav>
</footer>
```

### Keyboard Navigation
```
Tab:         Move focus to next link
Shift+Tab:   Move focus to previous link
Enter:       Activate focused link
```

### Screen Reader
```
Announces: "Footer landmark"
Announces: "Demo Mode Active - Using mock data" (status)
Announces: "Navigation" for each column
Announces: Link text + destination
```

---

## Responsive Behavior

### Breakpoints

```
Desktop:    1440px+     2-column layout, centered demo
Tablet:     768-1139px  1-column layout, centered demo
Mobile:     < 768px     Stacked, centered demo
Small:      < 568px     Reduced spacing, smaller logo
```

### Grid Layout

```css
Desktop:
  footer-container: grid-template-columns: 1fr 2fr
  footer-links:     grid-template-columns: repeat(3, 1fr)

Tablet:
  footer-container: grid-template-columns: 1fr
  footer-links:     grid-template-columns: repeat(3, 1fr)

Mobile:
  footer-container: grid-template-columns: 1fr
  footer-links:     grid-template-columns: 1fr
```

---

## Comparison with DemoHeader

### Similarities
- Same blue color scheme (#eff6ff, #3b82f6, #2563eb, #1e40af)
- Same PlayCircle icon (lucide-react)
- Same pulse animation
- Same font styles (14px medium)
- Same accessibility features

### Differences
- **Position:** Header at top, Footer at bottom
- **Content:** Header has dashboard name and actions, Footer has company info
- **Layout:** Header is horizontal bar, Footer is full content section
- **Demo Indicator:** Header is inline, Footer is full-width banner
- **Background:** Header is white/blur, Footer is dark gray

---

## Print Styles

When printing:
```
Demo Indicator:   display: none
Footer:           Simplified (no links, just copyright)
Colors:           Converted to black/white
Spacing:          Reduced padding
```

---

## Browser Support

Tested and working in:
- Chrome 120+
- Firefox 121+
- Safari 17+
- Edge 120+
- Mobile Safari (iOS 16+)
- Chrome Mobile (Android 12+)

---

## Implementation Code Reference

### Basic Usage
```tsx
import Footer from './components/Footer';

// Production mode
<Footer />

// Demo mode
<Footer isDemoMode={true} />

// With environment variable
<Footer isDemoMode={import.meta.env.VITE_DEMO_MODE === 'true'} />
```

### Custom Styling
```tsx
<Footer
  isDemoMode={true}
  className="custom-footer-styles"
/>
```

### CSS Customization
```css
/* Override demo indicator styles */
.footer-demo-indicator {
  background: var(--custom-color);
  padding: var(--custom-padding);
}

/* Override demo text styles */
.footer-demo-text {
  color: var(--custom-text-color);
  font-size: var(--custom-font-size);
}
```

---

## Testing Scenarios

### Visual Regression Testing
1. Render footer in demo mode
2. Capture screenshot at 1440px
3. Capture screenshot at 768px
4. Capture screenshot at 375px
5. Compare with baseline

### Functional Testing
1. Toggle `isDemoMode` prop
2. Verify indicator shows/hides
3. Check animation plays
4. Test all links navigate
5. Verify responsive breakpoints

### Accessibility Testing
1. Keyboard navigation through all links
2. Screen reader announcement verification
3. Color contrast validation (WCAG AA)
4. Focus visible state testing
5. ARIA attribute verification

---

## Performance Notes

- CSS animations use GPU acceleration (`will-change: opacity`)
- Conditional rendering prevents unnecessary DOM nodes
- Static assets (SVG logo) cached by browser
- No runtime JavaScript animations
- Optimized CSS with design tokens

---

This visual guide provides a comprehensive reference for the Footer component's demo mode indicator, ensuring consistent implementation and maintenance.
