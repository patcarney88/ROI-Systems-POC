# Mobile Components - Quick Start Guide

Get your ROI Systems PWA mobile-ready in 30 minutes!

---

## 🚀 Quick Setup (5 minutes)

### 1. Import Components

```tsx
// In your page component
import {
  BottomNavigation,
  BottomNavSpacer,
  MobileHeader,
  PullToRefresh
} from '@/components/mobile';
```

### 2. Basic Layout

```tsx
function YourPage() {
  const handleRefresh = async () => {
    await fetchData();
  };

  return (
    <>
      {/* Header with search */}
      <MobileHeader
        title="Your Page"
        showSearch
        collapseOnScroll
      />

      {/* Content with pull-to-refresh */}
      <PullToRefresh onRefresh={handleRefresh}>
        <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
          {/* Your content here */}
        </Container>
      </PullToRefresh>

      {/* Bottom navigation */}
      <BottomNavigation />
      <BottomNavSpacer />
    </>
  );
}
```

✅ Done! You now have a mobile-optimized page.

---

## 📋 Common Use Cases

### Alert List with Swipe Actions

```tsx
import { MobileAlertCard } from '@/components/mobile';

{alerts.map(alert => (
  <MobileAlertCard
    key={alert.id}
    alert={alert}
    onAcknowledge={(id) => acknowledgeAlert(id)}
    onContact={(id, method) => contactUser(id, method)}
    onDismiss={(id) => dismissAlert(id)}
    onTap={(id) => viewAlertDetails(id)}
    showSwipeActions
  />
))}
```

**Actions:**
- Swipe right → Acknowledge or call
- Swipe left → Email or dismiss
- Tap → View details

---

### Document Gallery with Viewer

```tsx
import { MobileDocumentViewer } from '@/components/mobile';

// Document grid
<Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
  {documents.map((doc, index) => (
    <Box
      key={doc.id}
      onClick={() => {
        setSelectedIndex(index);
        setViewerOpen(true);
      }}
    >
      <img src={doc.url} alt={doc.title} />
    </Box>
  ))}
</Box>

// Full-screen viewer
<MobileDocumentViewer
  open={viewerOpen}
  onClose={() => setViewerOpen(false)}
  documents={documents}
  initialIndex={selectedIndex}
  onDownload={handleDownload}
  onShare={handleShare}
/>
```

**Gestures:**
- Pinch to zoom (1x-4x)
- Double-tap to zoom
- Swipe between docs
- Tap to show/hide controls

---

### Forms with Mobile Inputs

```tsx
import {
  MobileTextField,
  MobilePhoneInput,
  MobileEmailInput,
  MobileSelect,
  MobileDatePicker,
  MobileButton
} from '@/components/mobile';

<Box display="flex" flexDirection="column" gap={2}>
  <MobileTextField
    label="Name"
    value={name}
    onChange={e => setName(e.target.value)}
  />

  <MobilePhoneInput
    label="Phone"
    value={phone}
    onChange={e => setPhone(e.target.value)}
  />

  <MobileEmailInput
    label="Email"
    value={email}
    onChange={e => setEmail(e.target.value)}
  />

  <MobileSelect
    label="Priority"
    value={priority}
    onChange={e => setPriority(e.target.value)}
    options={[
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' }
    ]}
  />

  <MobileDatePicker
    label="Date"
    value={date}
    onDateChange={setDate}
  />

  <MobileButton variant="contained" fullWidth>
    Submit
  </MobileButton>
</Box>
```

**Features:**
- 48px tap targets
- Native keyboards (tel, email, numeric)
- Clear buttons
- Haptic feedback

---

### Bottom Sheet for Details

```tsx
import { BottomSheet, SnapPoint } from '@/components/mobile';

<BottomSheet
  open={open}
  onClose={() => setOpen(false)}
  title="Alert Details"
  snapPoints={[SnapPoint.HALF, SnapPoint.FULL]}
  initialSnap={SnapPoint.HALF}
>
  <Box p={2}>
    {/* Your content here */}
  </Box>
</BottomSheet>
```

**Gestures:**
- Drag handle to resize
- Drag down to dismiss
- Backdrop click to close
- Keyboard aware

---

### Confirmation Dialog

```tsx
import { MobileConfirmModal } from '@/components/mobile';

<MobileConfirmModal
  open={confirmOpen}
  onClose={() => setConfirmOpen(false)}
  onConfirm={handleDelete}
  title="Delete Alert?"
  message="This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  confirmColor="error"
/>
```

---

## 🎯 Gestures Quick Reference

### Import Hooks

```tsx
import {
  useSwipe,
  SwipeDirection,
  usePinch,
  useLongPress,
  useDoubleTap,
  useHapticFeedback
} from '@/hooks/useGestures';
```

### Swipe Detection

```tsx
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
  Swipeable content
</div>
```

### Pinch to Zoom

```tsx
const { onTouchStart, onTouchMove, onTouchEnd, pinchData } = usePinch();

useEffect(() => {
  if (pinchData.scale !== 1) {
    setScale(baseScale * pinchData.scale);
  }
}, [pinchData.scale]);
```

### Haptic Feedback

```tsx
const { light, medium, heavy, success, error } = useHapticFeedback();

// On button click
onClick={() => {
  light(); // Light tap
  handleAction();
}}

// On success
success(); // Success pattern

// On error
error(); // Error pattern
```

---

## 🎨 Styling Tips

### iOS Safe Areas

Components handle this automatically, but for custom layouts:

```tsx
<Box
  sx={{
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)'
  }}
>
  Your content
</Box>
```

### Responsive Mobile-First

```tsx
<Box
  sx={{
    display: {
      xs: 'block',  // Mobile
      sm: 'flex',   // Tablet
      md: 'grid'    // Desktop
    },
    gap: { xs: 1, sm: 2, md: 3 },
    padding: { xs: 2, sm: 3, md: 4 }
  }}
>
  Your content
</Box>
```

### Dark Mode

All components support dark mode automatically. To toggle:

```tsx
const theme = createTheme({
  palette: {
    mode: isDarkMode ? 'dark' : 'light'
  }
});

<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>
```

---

## ⚡ Performance Tips

### 1. Lazy Load Heavy Components

```tsx
import { lazy, Suspense } from 'react';

const MobileDocumentViewer = lazy(() =>
  import('@/components/mobile').then(m => ({ default: m.MobileDocumentViewer }))
);

<Suspense fallback={<CircularProgress />}>
  <MobileDocumentViewer {...props} />
</Suspense>
```

### 2. Memoize List Items

```tsx
import { memo } from 'react';

const MemoizedAlertCard = memo(MobileAlertCard);

{alerts.map(alert => (
  <MemoizedAlertCard key={alert.id} alert={alert} {...handlers} />
))}
```

### 3. Virtual Scrolling for Long Lists

```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={alerts.length}
  itemSize={120}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <MobileAlertCard alert={alerts[index]} />
    </div>
  )}
</FixedSizeList>
```

---

## 🐛 Troubleshooting

### Components Not Rendering?

Check imports:
```tsx
// ✅ Correct
import { BottomNavigation } from '@/components/mobile';

// ❌ Wrong
import BottomNavigation from '@/components/mobile/BottomNavigation';
```

### Gestures Not Working?

Ensure touch-action CSS:
```tsx
<Box sx={{ touchAction: 'pan-y' }}>
  {/* Swipeable content */}
</Box>
```

### Safe Areas Not Applied?

Add viewport meta tag:
```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
```

### Haptic Feedback Not Working?

Check browser support:
```tsx
const { isSupported } = useHapticFeedback();

if (!isSupported) {
  console.log('Haptic feedback not supported');
}
```

---

## 📚 Next Steps

1. **Read the Full Documentation**
   - See `README.md` for complete API reference
   - Check `MobileExample.tsx` for detailed examples

2. **Test on Real Devices**
   - iOS: Safari on iPhone/iPad
   - Android: Chrome on various devices
   - Test portrait and landscape

3. **Optimize Performance**
   - Run Lighthouse mobile audit
   - Check bundle size
   - Test on 3G connection

4. **Customize Theme**
   - Configure colors, spacing, typography
   - Add your brand colors
   - Set up dark mode

---

## 🎉 You're Ready!

You now have all the tools to build a native-like mobile experience. Start with the basic layout, add components as needed, and test on real devices.

**Happy coding! 📱**

---

**Questions?** Check the comprehensive README.md or MobileExample.tsx for more details.

**Last Updated**: October 14, 2025
