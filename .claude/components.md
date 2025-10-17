# UI Components Documentation

This document contains information about reusable UI components available in the project.

## AlertDialog Component

**Location:** `src/components/ui/alert-dialog.tsx`

A modal dialog component for confirmation actions (delete, destructive actions, etc.).

### Usage Example

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Components

- `AlertDialog` - Root component, controls open state
- `AlertDialogContent` - The dialog content wrapper
- `AlertDialogHeader` - Header section for title and description
- `AlertDialogTitle` - Dialog title
- `AlertDialogDescription` - Description text
- `AlertDialogFooter` - Footer section for action buttons
- `AlertDialogCancel` - Cancel button (closes dialog)
- `AlertDialogAction` - Confirm/action button

### Props

**AlertDialog:**
- `open` (boolean): Controls dialog visibility
- `onOpenChange` (function): Callback when open state changes

**AlertDialogAction:**
- Can accept any button props
- Style with className or use variant props

### Best Practices

1. Always provide a clear title and description
2. Use destructive styling (red) for dangerous actions
3. Disable buttons during async operations
4. Close dialog after action completes
5. Use translations for all text content

### Real-World Example

See `src/app/(dashboard)/bills/_components/BillsList.tsx` for a complete implementation with delete confirmation.
