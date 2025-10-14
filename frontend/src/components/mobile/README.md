# Mobile UI Components

Native-like mobile components for the ROI Systems PWA, optimized for iOS and Android devices.

## 🎯 Overview

This collection of mobile-optimized components provides a native app experience with:
- **iOS safe-area support** for notch, home indicator, and status bar
- **Haptic feedback** for tactile responses
- **Touch-optimized gestures** (swipe, pinch, long-press, double-tap)
- **60fps animations** with smooth transitions
- **Material Design** on Android, iOS design patterns on iPhone
- **Dark mode support** throughout

## 📦 Components

### Navigation Components

#### BottomNavigation
Fixed bottom navigation bar with iOS safe-area support and badge notifications.

```tsx
import { BottomNavigation, BottomNavSpacer } from '@/components/mobile';

<BottomNavigation
  alertCount={5}
  onTabChange={(tab) => console.log(tab)}
/>

{/* Add spacer at bottom of content */}
<BottomNavSpacer />
```

**Features:**
- Auto-active tab detection from route
- Badge notifications with max count (99+)
- Haptic feedback on tap
- iOS safe-area-inset-bottom support
- Smooth scale animations

**Props:**
- `alertCount?: number` - Number of unread alerts
- `onTabChange?: (value: string) => void` - Tab change callback

---

#### MobileHeader
iOS-style header with back button, search, and collapsing on scroll.

```tsx
import { MobileHeader } from '@/components/mobile';

<MobileHeader
  title="Alerts"
  showBackButton
  showSearch
  searchValue={searchQuery}
  onSearchChange={setSearchQuery}
  collapseOnScroll
  actions={<IconButton>⋯</IconButton>}
/>
```

**Features:**
- Collapsing header on scroll
- Expandable search bar
- iOS safe-area-inset-top support
- Custom action buttons
- Smooth fade transitions

**Props:**
- `title: string` - Header title
- `showBackButton?: boolean` - Show back button (default: false)
- `onBackClick?: () => void` - Back button handler
- `showSearch?: boolean` - Show search functionality
- `searchValue?: string` - Controlled search value
- `onSearchChange?: (value: string) => void` - Search change handler
- `collapseOnScroll?: boolean` - Enable collapse on scroll
- `actions?: React.ReactNode` - Custom action buttons

---

### Gesture Components

#### PullToRefresh
Native-like pull-to-refresh gesture with haptic feedback.

```tsx
import { PullToRefresh } from '@/components/mobile';

<PullToRefresh
  onRefresh={async () => {
    await fetchData();
  }}
  pullDistance={80}
  refreshThreshold={70}
>
  <YourContent />
</PullToRefresh>
```

**Features:**
- Resistance curve for natural feel
- Haptic feedback at threshold
- Custom pull distance
- Loading and complete states
- Smooth spring animations

**Props:**
- `onRefresh: () => Promise<void>` - Refresh callback (async)
- `children: React.ReactNode` - Content to wrap
- `pullDistance?: number` - Distance to trigger (default: 80px)
- `maxPullDistance?: number` - Max pull allowed (default: 150px)
- `refreshThreshold?: number` - Threshold to trigger (default: 70px)
- `disabled?: boolean` - Disable gesture

---

#### SwipeableCard
Card with swipe-to-reveal actions (iOS Mail style).

```tsx
import { SwipeableCard } from '@/components/mobile';

const leftActions = [
  {
    icon: <CheckIcon />,
    label: 'Complete',
    color: '#fff',
    backgroundColor: '#4caf50',
    onClick: () => handleComplete()
  }
];

const rightActions = [
  {
    icon: <DeleteIcon />,
    label: 'Delete',
    color: '#fff',
    backgroundColor: '#f44336',
    onClick: () => handleDelete()
  }
];

<SwipeableCard
  leftActions={leftActions}
  rightActions={rightActions}
  swipeThreshold={60}
>
  <YourCardContent />
</SwipeableCard>
```

**Features:**
- Progressive action reveal
- Haptic feedback on threshold
- Snap-back animation
- Customizable action colors
- Swipe resistance curve

**Props:**
- `children: React.ReactNode` - Card content
- `leftActions?: SwipeAction[]` - Left swipe actions
- `rightActions?: SwipeAction[]` - Right swipe actions
- `swipeThreshold?: number` - Threshold to reveal (default: 60px)
- `maxSwipeDistance?: number` - Max swipe distance (default: 200px)
- `disabled?: boolean` - Disable swiping

---

### Modal Components

#### BottomSheet
iOS-style bottom sheet with drag-to-dismiss and snap points.

```tsx
import { BottomSheet, SnapPoint } from '@/components/mobile';

<BottomSheet
  open={open}
  onClose={() => setOpen(false)}
  title="Select Option"
  snapPoints={[SnapPoint.HALF, SnapPoint.FULL]}
  initialSnap={SnapPoint.HALF}
  showHandle
  keyboardAware
>
  <YourContent />
</BottomSheet>
```

**Features:**
- Drag handle with gesture
- Multiple snap points (collapsed, half, full)
- Backdrop click to close
- Keyboard awareness
- Smooth spring animations
- iOS safe-area support

**Props:**
- `open: boolean` - Sheet visibility
- `onClose: () => void` - Close callback
- `children: React.ReactNode` - Sheet content
- `title?: string` - Optional title
- `snapPoints?: SnapPoint[]` - Snap positions (default: [HALF, FULL])
- `initialSnap?: SnapPoint` - Initial position
- `showHandle?: boolean` - Show drag handle (default: true)
- `showCloseButton?: boolean` - Show close button (default: true)
- `disableDrag?: boolean` - Disable dragging
- `keyboardAware?: boolean` - Adjust for keyboard (default: true)

---

#### MobileModal
Full-screen modal with slide-up animation.

```tsx
import { MobileModal, MobileConfirmModal } from '@/components/mobile';

<MobileModal
  open={open}
  onClose={() => setOpen(false)}
  title="Edit Property"
  actions={
    <>
      <Button onClick={handleCancel}>Cancel</Button>
      <Button variant="contained" onClick={handleSave}>Save</Button>
    </>
  }
>
  <FormContent />
</MobileModal>

{/* Confirmation Dialog */}
<MobileConfirmModal
  open={confirmOpen}
  onClose={() => setConfirmOpen(false)}
  onConfirm={handleDelete}
  title="Delete Alert?"
  message="This action cannot be undone."
  confirmText="Delete"
  confirmColor="error"
/>
```

**Features:**
- Full-screen on mobile
- Slide-up transition
- iOS-style close button
- Prevent body scroll
- Custom footer actions
- Loading variant available

**Props:**
- `open: boolean` - Modal visibility
- `onClose: () => void` - Close callback
- `title?: string` - Modal title
- `children: React.ReactNode` - Modal content
- `actions?: React.ReactNode` - Footer action buttons
- `fullScreen?: boolean` - Force full-screen (default: auto)
- `showCloseButton?: boolean` - Show close button (default: true)
- `preventClose?: boolean` - Prevent closing

---

### Input Components

#### Touch-Friendly Inputs
Large tap target inputs optimized for mobile keyboards.

```tsx
import {
  MobileTextField,
  MobilePhoneInput,
  MobileEmailInput,
  MobileNumberInput,
  MobileSelect,
  MobileDatePicker,
  MobileTimePicker,
  MobileSearchInput,
  MobileButton
} from '@/components/mobile';

{/* Text Input */}
<MobileTextField
  label="Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  onClear={() => setName('')}
/>

{/* Phone Input (tel keyboard) */}
<MobilePhoneInput
  label="Phone"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
/>

{/* Email Input (email keyboard) */}
<MobileEmailInput
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

{/* Select Dropdown */}
<MobileSelect
  label="Priority"
  value={priority}
  onChange={(e) => setPriority(e.target.value)}
  options={[
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ]}
/>

{/* Date Picker (native) */}
<MobileDatePicker
  label="Date"
  value={date}
  onDateChange={setDate}
/>

{/* Button */}
<MobileButton
  variant="contained"
  fullWidth
  onClick={handleSubmit}
  haptic
>
  Submit
</MobileButton>
```

**Features:**
- Minimum 48px tap targets
- Native mobile keyboards (tel, email, numeric)
- Clear buttons on text inputs
- Native date/time pickers
- Haptic feedback on buttons
- Large, readable fonts

---

### Viewer Components

#### MobileDocumentViewer
Full-screen document viewer with pinch-to-zoom and swipe navigation.

```tsx
import { MobileDocumentViewer } from '@/components/mobile';

const documents = [
  {
    id: '1',
    title: 'Purchase Agreement',
    url: '/docs/agreement.pdf',
    type: 'pdf'
  },
  {
    id: '2',
    title: 'Property Photo',
    url: '/images/property.jpg',
    type: 'image'
  }
];

<MobileDocumentViewer
  open={open}
  onClose={() => setOpen(false)}
  documents={documents}
  initialIndex={0}
  onDownload={(doc) => downloadDocument(doc)}
  onShare={(doc) => shareDocument(doc)}
/>
```

**Features:**
- Pinch-to-zoom for images (1x-4x)
- Double-tap to zoom
- Swipe between documents
- Download for offline
- Native share functionality
- Auto-hide controls (3s)
- Full-screen with safe areas

**Props:**
- `open: boolean` - Viewer visibility
- `onClose: () => void` - Close callback
- `documents: Document[]` - Array of documents
- `initialIndex?: number` - Starting document (default: 0)
- `onDownload?: (doc: Document) => void` - Download handler
- `onShare?: (doc: Document) => void` - Share handler
- `onPrint?: (doc: Document) => void` - Print handler

---

#### MobileAlertCard
Touch-optimized alert card with swipe actions.

```tsx
import { MobileAlertCard, MobileAlertCardCompact } from '@/components/mobile';

{/* Full Card */}
<MobileAlertCard
  alert={alert}
  onAcknowledge={(id) => handleAcknowledge(id)}
  onContact={(id, method) => handleContact(id, method)}
  onDismiss={(id) => handleDismiss(id)}
  onTap={(id) => handleViewDetails(id)}
  showSwipeActions
/>

{/* Compact Version */}
<MobileAlertCardCompact
  alert={alert}
  onTap={(id) => handleViewDetails(id)}
/>
```

**Features:**
- Swipe left to dismiss
- Swipe right to acknowledge
- Quick action buttons (call, email)
- Priority color indicators
- Confidence progress bar
- Compact variant for lists

**Props:**
- `alert: Alert` - Alert data object
- `onAcknowledge?: (id: string) => void` - Acknowledge handler
- `onContact?: (id: string, method: 'phone' | 'email') => void` - Contact handler
- `onDismiss?: (id: string) => void` - Dismiss handler
- `onTap?: (id: string) => void` - Tap handler
- `showSwipeActions?: boolean` - Enable swipe actions (default: true)

---

## 🎨 Gesture Hooks

### useSwipe
Detects swipe gestures in all directions.

```tsx
import { useSwipe, SwipeDirection } from '@/hooks/useGestures';

const { onTouchStart, onTouchMove, onTouchEnd, swipeDirection } = useSwipe({
  minSwipeDistance: 50,
  maxSwipeTime: 300
});

useEffect(() => {
  if (swipeDirection === SwipeDirection.LEFT) {
    handleSwipeLeft();
  }
}, [swipeDirection]);

<div
  onTouchStart={onTouchStart}
  onTouchMove={onTouchMove}
  onTouchEnd={onTouchEnd}
>
  Swipeable Content
</div>
```

---

### usePinch
Detects pinch-to-zoom gestures.

```tsx
import { usePinch } from '@/hooks/useGestures';

const { onTouchStart, onTouchMove, onTouchEnd, pinchData } = usePinch();

useEffect(() => {
  if (pinchData.scale !== 1) {
    const newScale = baseScale * pinchData.scale;
    setScale(newScale);
  }
}, [pinchData.scale]);
```

---

### useLongPress
Detects long-press gestures.

```tsx
import { useLongPress } from '@/hooks/useGestures';

const { onTouchStart, onTouchMove, onTouchEnd } = useLongPress(() => {
  showContextMenu();
}, 500);
```

---

### useDoubleTap
Detects double-tap gestures.

```tsx
import { useDoubleTap } from '@/hooks/useGestures';

const { onClick } = useDoubleTap(() => {
  toggleZoom();
}, 300);
```

---

### useHapticFeedback
Provides haptic feedback on supported devices.

```tsx
import { useHapticFeedback } from '@/hooks/useGestures';

const { light, medium, heavy, success, error, isSupported } = useHapticFeedback();

// Usage
light(); // Light tap
medium(); // Medium impact
heavy(); // Heavy impact
success(); // Success pattern
error(); // Error pattern
```

---

## 📱 iOS Safe Area Support

All components respect iOS safe areas (notch, home indicator, status bar):

```css
/* Automatically handled by components */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```

---

## 🎯 Responsive Breakpoints

Components adapt to screen sizes:

```typescript
const breakpoints = {
  mobile: '0px',      // < 600px
  tablet: '600px',    // 600-960px
  desktop: '960px'    // > 960px
};
```

---

## 🌙 Dark Mode Support

All components support dark mode out of the box via Material-UI theme.

---

## ⚡ Performance

- **60fps animations** using CSS transforms and GPU acceleration
- **Lazy loading** for heavy components
- **Touch event optimization** with passive listeners
- **Bundle size optimized** with tree shaking

---

## 📱 PWA Integration

Components are designed for PWA standalone mode:

```json
// manifest.json
{
  "display": "standalone",
  "theme_color": "#1976d2",
  "background_color": "#ffffff"
}
```

---

## 🧪 Testing

All components include:
- Unit tests with React Testing Library
- Accessibility tests with axe-core
- Touch gesture simulation tests
- Cross-browser compatibility tests

---

## 📚 Examples

See `/examples` directory for complete usage examples:
- Alert List with Pull-to-Refresh
- Document Gallery with Viewer
- Form with Mobile Inputs
- Navigation with Bottom Bar

---

## 🔧 Configuration

### Custom Theme

```tsx
import { createTheme } from '@mui/material';

const theme = createTheme({
  components: {
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          paddingBottom: 'env(safe-area-inset-bottom)'
        }
      }
    }
  }
});
```

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🤝 Contributing

Contributions welcome! Please follow the component development guidelines:

1. Follow Material Design principles
2. Support iOS safe areas
3. Include haptic feedback where appropriate
4. Write comprehensive tests
5. Document props and usage
6. Optimize for 60fps performance
