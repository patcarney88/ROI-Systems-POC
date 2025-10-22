# Error Handling & Validation Testing Guide

## Quick Start

```bash
cd frontend
npm run dev
```

Navigate to: http://localhost:5173

---

## Test Scenarios

### 1. Form Validation Testing

#### Login Form (http://localhost:5173/login)
1. **Test Invalid Email**
   - Go to login page
   - Enter "notanemail" in email field
   - Expected: Red error message "Invalid email address"

2. **Test Short Password**
   - Enter valid email
   - Enter "123" in password field
   - Expected: Error "Password must be at least 8 characters"

3. **Test Empty Fields**
   - Leave both fields empty
   - Try to submit
   - Expected: Submit button disabled, validation errors shown

4. **Test Valid Login**
   - Enter: test@example.com
   - Enter: Password123!
   - Expected: Login succeeds, success toast appears

#### Client Modal
1. **Open Client Modal**
   - Navigate to /clients
   - Click "Add New Client" button

2. **Test Empty Name**
   - Leave name field empty
   - Expected: Error "Name is required"

3. **Test Invalid Email**
   - Enter "invalid-email"
   - Expected: Error "Invalid email address"

4. **Test Invalid Phone**
   - Enter "abc123"
   - Expected: Error "Phone number can only contain digits..."

5. **Test Valid Client**
   - Name: John Doe
   - Email: john@example.com
   - Phone: 5551234567
   - Click Save
   - Expected: Success toast "Client added successfully"

#### Campaign Modal
1. **Open Campaign Modal**
   - Navigate to /campaigns
   - Click "Create Campaign"

2. **Test Empty Name**
   - Leave campaign name empty
   - Expected: Error "Campaign name is required"

3. **Test Short Subject**
   - Enter "Hi" in subject
   - Expected: Error "Subject must be at least 5 characters"

4. **Test Short Message**
   - Enter "Test" in message
   - Expected: Error "Message must be at least 10 characters"

5. **Test Scheduled Date**
   - Select "Schedule for Later"
   - Choose a past date
   - Expected: Error "Scheduled date must be in the future"

6. **Test Valid Campaign**
   - Name: Q1 2025 Update
   - Subject: Your Q1 Market Update
   - Message: Hello! Here's your quarterly update...
   - Recipients: All Clients
   - Schedule: Send Now
   - Click Send
   - Expected: Success toast "Campaign sent successfully!"

#### Document Upload Modal
1. **Open Document Upload Modal**
   - Navigate to /documents
   - Click "Upload Document"

2. **Test No Files**
   - Enter client name
   - Click Upload without selecting files
   - Expected: Error "Please select at least one file to upload"

3. **Test Large File**
   - Try to upload a file > 10MB
   - Expected: Error "File size must be less than 10MB"

4. **Test Invalid File Type**
   - Try to upload a .exe or .zip file
   - Expected: Error "File type not allowed..."

5. **Test Valid Upload**
   - Select a PDF file < 10MB
   - Client: Jane Smith
   - Type: Purchase Agreement
   - Click Upload
   - Expected: Success toast "1 document(s) uploaded successfully"

---

### 2. Error Handling Testing

#### Network Error
**Simulate Network Error:**
1. Open browser DevTools
2. Go to Network tab
3. Set throttling to "Offline"
4. Try any form submission
5. Expected: Error toast "Please check your internet connection"

#### API Error Simulation
Add temporary code to any component:

```tsx
// Throw error to test error handling
throw new Error('Test API error');
```

Expected: Toast notification with error message

#### Component Error (Error Boundary)
Add to any component temporarily:

```tsx
function TestComponent() {
  throw new Error('Test error boundary');
  return <div>Component</div>;
}
```

Expected: Error Boundary fallback UI with:
- Error icon
- "Oops! Something went wrong" message
- "Try Again" button
- "Go Home" button
- Error details (in development mode only)

---

### 3. Toast Notification Testing

#### Success Toast
```tsx
import { notify } from '../utils/notifications';
notify.success('Operation successful!');
```

Expected:
- Green toast appears top-right
- Success icon
- Auto-dismisses after 4 seconds

#### Error Toast
```tsx
notify.error('Operation failed!');
```

Expected:
- Red toast appears top-right
- Error icon
- Auto-dismisses after 5 seconds

#### Warning Toast
```tsx
notify.warning('Warning message');
```

Expected:
- Orange toast appears top-right
- Warning icon
- Auto-dismisses after 4 seconds

#### Info Toast
```tsx
notify.info('Information message');
```

Expected:
- Blue toast appears top-right
- Info icon
- Auto-dismisses after 4 seconds

---

### 4. 404 Page Testing

1. **Navigate to Invalid Route**
   - Go to: http://localhost:5173/invalid-route
   - Expected: 404 Not Found page with:
     - Large "404" text
     - "Page Not Found" heading
     - Description message
     - "Go Back" button
     - "Go to Dashboard" button
     - Links to popular pages

2. **Test Go Back Button**
   - Click "Go Back"
   - Expected: Navigate to previous page

3. **Test Go Home Button**
   - Click "Go to Dashboard"
   - Expected: Navigate to main dashboard

4. **Test Popular Links**
   - Click any link in Popular Pages section
   - Expected: Navigate to that page

---

### 5. User Experience Testing

#### Field-Level Errors
1. **Test Real-Time Validation**
   - Open any form
   - Start typing in email field
   - Type "invalid"
   - Expected: Error appears immediately below field

2. **Test Error Clearing**
   - Continue typing valid email
   - Expected: Error disappears when valid

#### Submit Button State
1. **Test Disabled State**
   - Open any form
   - Submit button should be disabled initially
   - Fill form with invalid data
   - Expected: Button stays disabled

2. **Test Enabled State**
   - Fill form with valid data
   - Expected: Button becomes enabled

#### Loading States
1. **Test Form Submission**
   - Fill valid data
   - Click submit
   - Expected:
     - Button shows spinner
     - Button text changes to "Saving..." or "Uploading..."
     - Button is disabled during submission

---

### 6. Accessibility Testing

#### Keyboard Navigation
1. **Test Tab Navigation**
   - Open any form
   - Use Tab key to navigate
   - Expected: All fields accessible via keyboard

2. **Test Enter Submit**
   - Fill form
   - Press Enter
   - Expected: Form submits

#### Screen Reader Testing
1. **Test Error Announcements**
   - Use screen reader (NVDA, JAWS, VoiceOver)
   - Submit invalid form
   - Expected: Errors are announced

---

### 7. Mobile Testing

#### Responsive Forms
1. **Test on Mobile Viewport**
   - Open DevTools
   - Switch to mobile viewport
   - Open any form
   - Expected: Form is fully functional and readable

#### Touch Interactions
1. **Test Touch Events**
   - Use mobile device or DevTools touch emulation
   - Test drag-and-drop for file upload
   - Expected: Works with touch events

---

## Automated Testing (Future)

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

---

## Common Issues & Solutions

### Issue: Validation not triggering
**Solution:** Check that schema is imported correctly and resolver is set

### Issue: Toast not appearing
**Solution:** Ensure Toaster component is in main.tsx

### Issue: Error Boundary not catching error
**Solution:** Make sure error is thrown during render, not in event handler

### Issue: Submit button always disabled
**Solution:** Check form validity - use `isValid` from formState

---

## Performance Testing

### Check Bundle Size
```bash
npm run build
```

Expected: ~1MB total, ~287KB gzipped

### Check Validation Speed
Use browser DevTools Performance tab:
- Record typing in form field
- Check validation time
- Should be < 50ms

### Check Toast Animation
Use browser DevTools:
- Record toast appearing
- Check frame rate
- Should maintain 60fps

---

## Browser Testing Matrix

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | Latest  | ✅     |
| Firefox | Latest  | ✅     |
| Safari  | Latest  | ✅     |
| Edge    | Latest  | ✅     |
| Mobile Safari | Latest | ✅ |
| Chrome Mobile | Latest | ✅ |

---

## Regression Testing Checklist

Before any major release, verify:

- [ ] All forms validate correctly
- [ ] Error messages are user-friendly
- [ ] Toasts appear and dismiss correctly
- [ ] 404 page displays for invalid routes
- [ ] Error Boundary catches component errors
- [ ] Submit buttons disable appropriately
- [ ] Loading states show during operations
- [ ] Keyboard navigation works
- [ ] Mobile responsive works
- [ ] No console errors
- [ ] Build succeeds without errors

---

## Report Issues

If you find any issues during testing:

1. Note the steps to reproduce
2. Screenshot the error
3. Check browser console for errors
4. Check Network tab for failed requests
5. Document expected vs actual behavior
