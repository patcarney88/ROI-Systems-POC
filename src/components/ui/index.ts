/**
 * UI Components Index
 * Designed by: Frontend Specialist + UX Designer
 * 
 * Central export point for all UI components in the ROI Systems design system
 */

// Core Components
export { Button, buttonVariants } from './Button';
export type { ButtonProps } from './Button';

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  cardVariants 
} from './Card';
export type { CardProps } from './Card';

export { Input, Textarea, inputVariants } from './Input';
export type { InputProps } from './Input';

export {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ConfirmationModal,
  modalVariants,
} from './Modal';
export type { ModalProps } from './Modal';

export { Badge, StatusBadge, PriorityBadge, badgeVariants } from './Badge';
export type { BadgeProps } from './Badge';

// Component Categories for Easy Reference
// Note: Components are imported above and can be accessed directly

// Re-export utility functions
export { cn } from '@/lib/utils';

// Note: Types are already exported above with their respective components

// Design System Metadata
export const DESIGN_SYSTEM_VERSION = '1.0.0';
export const THEME_NAME = 'ROI Systems Dark Teal';
export const COMPONENT_COUNT = 5;

// Usage Guide
/*
## Usage Examples

### Import individual components:
```tsx
import { Button, Card, Input } from '@/components/ui';
```

### Import specific variants:
```tsx
import { Button, buttonVariants } from '@/components/ui';
```

### Import component categories:
```tsx
import { FormComponents, FeedbackComponents } from '@/components/ui';
```

### Import with types:
```tsx
import { Button, type ButtonProps } from '@/components/ui';
```

## Component Overview

### Core Components (5)
- **Button**: Primary interaction element with multiple variants
- **Card**: Container component for content grouping
- **Input**: Form input with validation and accessibility
- **Modal**: Overlay component for focused interactions
- **Badge**: Status and label indicator component

### Design Principles
- Stavvy-inspired visual design with Dark Teal primary color
- Enterprise-grade accessibility (WCAG 2.1 AA)
- Mobile-first responsive design
- Consistent spacing and typography scale
- Smooth animations and transitions

### Theme Integration
- Primary color: Dark Teal (#0d9488)
- Typography: Inter font family
- Spacing: 4px base unit with 1.5x scale
- Border radius: Rounded corners with 2xl for buttons
- Shadows: Subtle depth with card shadow pattern
*/