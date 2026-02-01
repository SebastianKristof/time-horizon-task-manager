---
name: Fix mobile view bugs
overview: "Fix 8 reported mobile UI/UX bugs plus 3 additional improvements, all mobile-only (max-width: 768px). Desktop behavior remains unchanged."
todos:
  - id: fade-out-animation
    content: Add fade-out animation for completed tasks when showCompletedTasks is false
    status: completed
  - id: drag-line-cleanup
    content: Fix drag line cleanup delay - clear dropIndicator immediately
    status: completed
  - id: subtask-persistence
    content: Fix subtask disappearing after creation - verify optimistic updates and real-time sync
    status: completed
  - id: blur-save
    content: Verify and fix save-on-blur for new tasks/subtasks (mobile only)
    status: completed
  - id: subtask-accept-button
    content: Add accept button for subtask input (mobile only)
    status: completed
  - id: completed-delete-refresh
    content: Fix delete in completed view - ensure UI updates immediately
    status: completed
  - id: drag-visual-feedback
    content: Improve drag visual feedback - whole card should move
    status: completed
  - id: hide-buttons-edit
    content: Hide action buttons in edit mode on mobile
    status: completed
  - id: regular-task-accept
    content: Add accept button for regular task input (mobile only)
    status: completed
  - id: fix-subtask-placeholder
    content: Fix subtask placeholder text - should say 'Subtask title...' not 'Task title...'
    status: completed
  - id: verify-enter-continuous
    content: Verify Enter key allows continuous task creation for all inputs
    status: completed
---

# Fix Mobile View Bugs

## Overview

Fix all reported mobile bugs and additional improvements, ensuring changes only affect mobile view (max-width: 768px). Desktop behavior remains unchanged.

## Files to Modify

- `components/task-card.tsx` - Task card component with edit mode

and drag handling

- `components/horizons-view.tsx` - Main view with task creation, subtask handling, and drag-drop
- `components/completed-view.tsx` - Completed tasks view with delete functionality
- `app/globals.css` - CSS animations for fade-out effects

## Bug Fixes

### 1. Checked tasks fade-out animation

**Location:** `components/horizons-view.tsx` - `handleToggleComplete` and task rendering

- Add CSS transition class for fade-out when `showCompletedTasks` is false
- Apply animation class to task card when task becomes completed
- Use `opacity` and `transform` transitions with ~300ms duration
- Remove from DOM after animation completes

### 2. Drag line cleanup delay

**Location:** `components/horizons-view.tsx` - `handleDragEnd` and drop indicator state

- Clear `dropIndicator` immediately in `handleDragEnd` (not just in useEffect)
- Add explicit cleanup in `handleDropOnTask` and `handleDrop` functions
- Ensure `lastDropIndicatorRef` is also cleared synchronously

### 3. Subtask disappears after creation

**Location:** `components/horizons-view.tsx` - `handleAddSubtask` and real-time subscription

- Verify optimistic update includes subtask in correct position
- Check real-time subscription handles INSERT events correctly
- Ensure subtask is added to parent's children list immediately
- Fix any race conditions between optimistic update and server response

### 4. Save new tasks/subtasks on blur

**Location:** `components/horizons-view.tsx` - Input `onBlur` handlers

- Verify subtask input `onBlur` (line 1700) saves correctly
- Verify sibling input `onBlur` (line 1750) saves correctly  
- Verify regular task input `onBlur` (line 1795) saves correctly
- Ensure empty inputs don't create tasks but still close input
- Mobile-only: ensure blur behavior works correctly on touch devices

### 5. Add accept button for subtasks

**Location:** `components/horizons-view.tsx` - Subtask input section (line 1678-1729)

- Add Check/accept button next to cancel button (mobile-only, use `md:hidden`)
- Button should call `handleAddSubtask` with `keepInputOpen: false`
- Match styling of existing cancel button

### 6. Fix delete in completed view

**Location:** `components/completed-view.tsx` - `confirmDelete` function

- Verify optimistic update removes task correctly
- Check real-time subscription handles DELETE events
- Ensure UI refreshes immediately after delete
- May need to trigger a state update or force re-render

### 7. Whole task card moves during drag

**Location:** `components/task-card.tsx` - `onDragStart` handler (line 328-365)

- Improve drag image to show full task card appearance
- Add visual feedback to original card (opacity reduction, scale)
- Ensure drag image matches actual card size and styling
- Mobile-only: ensure touch drag shows proper visual feedback

### 8. Hide buttons in edit mode (mobile)

**Location:** `components/task-card.tsx` - Mobile action buttons section (line 501-593)

- Add condition to hide action buttons when `isEditing` is true
- Currently only desktop buttons are hidden (line 686)
- Mobile buttons in `showCompactActions` section should also be hidden during edit

## Additional Improvements

### 9. Accept button for regular tasks (mobile)

**Location:** `components/horizons-view.tsx` - Regular task input (line 1783-1814)

- Add Check/accept button next to cancel button (mobile-only, use `md:hidden`)
- Button should call `handleCreateTask` with `keepInputOpen: true` to allow continuous entry
- Match styling of existing cancel button

### 10. Fix subtask placeholder text

**Location:** `components/horizons-view.tsx` - Sibling input (line 1757)

- Change placeholder from "Task title..." to "Subtask title..." when `siblingTarget.parent_task_id` exists
- Or create separate placeholder logic based on whether it's a subtask or regular task

### 11. Verify Enter key continues task creation

**Location:** `components/horizons-view.tsx` - All input `onKeyDown` handlers

- Verify subtask input Enter (line 1686) calls `handleAddSubtask` with `keepInputOpen: true` ✓ (already correct)
- Verify sibling input Enter (line 1738) calls `handleAddSibling` with `keepInputOpen: true` ✓ (already correct)
- Verify regular task input Enter (line 1808) calls `handleCreateTask` with `keepInputOpen: true` ✓ (already correct)
- Test that inputs remain focused after Enter press
- Ensure `requestAnimationFrame` focus calls work correctly

## Implementation Notes

### Mobile Detection

- Use `isCompactLayout` state (max-width: 768px) from `task-card.tsx`
- For `horizons-view.tsx`, check `window.matchMedia("(max-width: 768px)")` or add similar state
- Use `md:hidden` and `md:flex` Tailwind classes for mobile-only elements
- Use `md:` prefix for desktop-only styles

### CSS Animations

- Add fade-out animation class in `app/globals.css`
- Use CSS transitions: `transition: opacity 300ms ease-out, transform 300ms ease-out`
- Apply `opacity-0` and `scale-95` for fade-out effect

### Testing Checklist

- [ ] Completed tasks fade out smoothly when `showCompletedTasks` is false
- [ ] Drop indicator disappears immediately on drag end
- [ ] New subtasks appear and stay visible
- [ ] New tasks/subtasks save on blur
- [ ] Accept buttons appear for subtasks and regular tasks (mobi

le only)

- [ ] Delete in completed view updates UI immediately
- [ ] Full task card moves during drag
- [ ] Buttons hide in edit mode (mobile)
- [ ] Placeholder text correct for subtasks
- [ ] Enter key allows continuous task creation
- [ ] Desktop behavior unchanged