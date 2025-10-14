# Mobile Component Architecture Tree

```
ROI Systems PWA - Mobile Components
│
├── 📱 Navigation Components
│   ├── BottomNavigation
│   │   ├── Props: alertCount, onTabChange
│   │   ├── Features: iOS safe-area, badges, haptic feedback
│   │   └── NavItems: Dashboard, Alerts, Documents, Properties, More
│   │
│   ├── MobileHeader
│   │   ├── Props: title, showBackButton, showSearch, collapseOnScroll
│   │   ├── Features: Collapsing, expandable search, custom actions
│   │   └── Safe-area: Top (status bar/notch)
│   │
│   └── Spacers
│       ├── BottomNavSpacer (56px + safe-area-bottom)
│       └── HeaderSpacer (56-64px + safe-area-top)
│
├── 👆 Gesture Components
│   ├── PullToRefresh
│   │   ├── Props: onRefresh, pullDistance, refreshThreshold
│   │   ├── States: idle, pulling, ready, refreshing, complete
│   │   └── Features: Resistance curve, haptic feedback, smooth animations
│   │
│   └── SwipeableCard
│       ├── Props: leftActions, rightActions, swipeThreshold
│       ├── Actions: Customizable action buttons with colors
│       └── Features: Progressive reveal, snap-back, haptic feedback
│
├── 🪟 Modal Components
│   ├── BottomSheet
│   │   ├── Props: open, onClose, snapPoints, title
│   │   ├── SnapPoints: COLLAPSED (30%), HALF (50%), FULL (90%)
│   │   ├── Features: Drag handle, drag-to-dismiss, keyboard aware
│   │   └── Safe-area: Bottom (home indicator)
│   │
│   └── MobileModal
│       ├── Props: open, onClose, title, actions
│       ├── Variants: Standard, Confirm, Loading
│       ├── Features: Full-screen, slide-up, iOS close button
│       └── Safe-area: Top & bottom
│
├── ⌨️ Input Components
│   ├── MobileTextField
│   │   ├── Features: 48px min height, clear button
│   │   └── Props: label, value, onChange, onClear
│   │
│   ├── Specialized Inputs
│   │   ├── MobilePhoneInput (tel keyboard, pattern: [0-9]*)
│   │   ├── MobileEmailInput (email keyboard, no autocapitalize)
│   │   ├── MobileNumberInput (numeric keyboard, min/max/step)
│   │   └── MobileSearchInput (search type, clear button)
│   │
│   ├── Pickers
│   │   ├── MobileDatePicker (native date picker, calendar icon)
│   │   ├── MobileTimePicker (native time picker, clock icon)
│   │   └── MobileSelect (touch-friendly dropdown, 48px items)
│   │
│   ├── Text Areas
│   │   └── MobileTextArea (multiline, auto-resize)
│   │
│   └── Buttons
│       ├── MobileButton (48px min, haptic feedback)
│       └── MobileChipButton (filter/tag style, 36px min)
│
├── 📄 Viewer Components
│   ├── MobileDocumentViewer
│   │   ├── Props: documents, initialIndex, onDownload, onShare
│   │   ├── Features:
│   │   │   ├── Pinch-to-zoom (1x-4x scale)
│   │   │   ├── Double-tap to zoom
│   │   │   ├── Swipe between documents
│   │   │   ├── Auto-hide controls (3s)
│   │   │   └── Full-screen with safe areas
│   │   ├── Actions: Download, Share, Print
│   │   └── Supported: Images, PDFs, Documents
│   │
│   └── MobileAlertCard
│       ├── Props: alert, onAcknowledge, onContact, onDismiss, onTap
│       ├── Features:
│       │   ├── Swipe left → Dismiss
│       │   ├── Swipe right → Acknowledge
│       │   ├── Quick actions: Call, Email
│       │   └── Priority colors, confidence bar
│       ├── Variants:
│       │   ├── Full (detailed view)
│       │   └── Compact (list view)
│       └── Touch: 48px tap targets
│
└── 🎯 Gesture Hooks (useGestures.ts)
    ├── useSwipe
    │   ├── Detects: LEFT, RIGHT, UP, DOWN
    │   ├── Config: minSwipeDistance, maxSwipeTime
    │   └── Returns: onTouchStart/Move/End, swipeDirection
    │
    ├── usePinch
    │   ├── Detects: Two-finger pinch gestures
    │   ├── Returns: onTouchStart/Move/End, pinchData (scale, center)
    │   └── Features: Distance calculation, center point
    │
    ├── useLongPress
    │   ├── Detects: Long-press (default 500ms)
    │   ├── Callback: Triggers on duration completion
    │   └── Features: Haptic feedback, cancellable
    │
    ├── useDoubleTap
    │   ├── Detects: Double-tap (default 300ms threshold)
    │   ├── Callback: Triggers on second tap
    │   └── Features: Haptic pattern, preventDefault
    │
    ├── useHapticFeedback
    │   ├── Methods:
    │   │   ├── light() - 10ms vibration
    │   │   ├── medium() - 30ms vibration
    │   │   ├── heavy() - 50ms vibration
    │   │   ├── success() - Pattern [10,30,10]
    │   │   └── error() - Pattern [30,50,30,50,30]
    │   └── isSupported - Browser capability check
    │
    └── useTouchScroll
        ├── Detects: Touch scroll with momentum
        ├── Returns: onScroll, isScrolling, scrollDirection
        └── Features: Debounced scroll end (150ms)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Component Statistics
├── Total Components: 10
├── Gesture Hooks: 6
├── Input Variants: 11
├── Modal Variants: 4
├── Total Lines of Code: 3,585
└── Documentation: 13,984 characters

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎨 Design System
├── Tap Targets: ≥44px × 44px
├── Typography:
│   ├── Headers: 1.1rem - 1.25rem
│   ├── Body: 1rem
│   └── Captions: 0.65rem - 0.75rem
├── Spacing:
│   ├── Component padding: 12px - 16px
│   ├── Element gap: 8px - 16px
│   └── Safe areas: env(safe-area-inset-*)
└── Colors:
    ├── Primary: #2196f3
    ├── Success: #4caf50
    ├── Warning: #ff9800
    └── Error: #f44336

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Performance Targets
├── Animations: 60fps (16.67ms frame budget)
├── Bundle Size: <25KB gzipped (all components)
├── First Contentful Paint: <1.2s
├── Time to Interactive: <3s
└── Lighthouse Mobile Score: >95

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 Device Support
├── iOS
│   ├── iPhone SE (4.7") ✓
│   ├── iPhone 13 (6.1") ✓
│   ├── iPhone 13 Pro Max (6.7") ✓
│   ├── iPad Air (10.9") ✓
│   └── iPad Pro (12.9") ✓
├── Android
│   ├── Small phones (5.0" - 5.5") ✓
│   ├── Standard phones (5.5" - 6.5") ✓
│   ├── Large phones (6.5"+) ✓
│   └── Tablets (7" - 10") ✓
└── Browsers
    ├── Safari iOS 14+ ✓
    ├── Chrome Android 10+ ✓
    ├── Firefox Mobile ✓
    └── Samsung Internet ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Responsive Breakpoints
├── mobile: 0px - 599px (primary target)
├── tablet: 600px - 959px (adapted layouts)
└── desktop: 960px+ (desktop components)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

♿ Accessibility Features
├── WCAG 2.1 AA Compliance ✓
├── Minimum 44px × 44px tap targets ✓
├── Semantic HTML elements ✓
├── ARIA labels where needed ✓
├── Keyboard navigation support ✓
├── Screen reader friendly ✓
└── High contrast support (dark mode) ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 Integration Points

App.tsx
├── Import: BottomNavigation, MobileHeader
├── Layout: Wrap content in PullToRefresh
└── Add: BottomNavSpacer at content end

AlertDashboard.tsx
├── Import: MobileAlertCard, BottomSheet
├── Replace: AlertCard with MobileAlertCard (mobile view)
└── Add: BottomSheet for alert details

Documents.tsx
├── Import: MobileDocumentViewer
├── Add: Document thumbnails grid
└── Handle: Open viewer on tap

Forms
├── Import: Mobile input components
├── Replace: TextField → MobileTextField
└── Add: Native pickers (date/time)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Import Pattern

// Centralized imports
import {
  BottomNavigation,
  MobileHeader,
  PullToRefresh,
  MobileAlertCard,
  MobileTextField,
  MobileButton
} from '@/components/mobile';

// Hook imports
import {
  useSwipe,
  usePinch,
  useHapticFeedback
} from '@/hooks/useGestures';

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Usage Example

function MobileApp() {
  const [alerts, setAlerts] = useState([]);

  return (
    <>
      <MobileHeader
        title="Alerts"
        showSearch
        collapseOnScroll
      />

      <PullToRefresh onRefresh={fetchAlerts}>
        {alerts.map(alert => (
          <MobileAlertCard
            key={alert.id}
            alert={alert}
            onAcknowledge={handleAck}
            onContact={handleContact}
            onDismiss={handleDismiss}
            showSwipeActions
          />
        ))}
      </PullToRefresh>

      <BottomNavigation alertCount={alerts.length} />
      <BottomNavSpacer />
    </>
  );
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Status: Complete & Ready for Integration

📅 Last Updated: October 14, 2025
```
