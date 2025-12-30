---
name: Task UI/UX improvements
overview: Improve task UI to be more text-like, replace horizon movement dropdown with directional arrows, enhance inline editing and task creation behaviors, and adjust interaction patterns for better UX.
todos:
  - id: compact-task-styling
    content: "Make tasks more compact and text-like: reduce padding, minimize card appearance, smaller gaps"
    status: pending
  - id: horizon-directional-arrows
    content: Replace horizon dropdown with up/down arrow buttons for moving between horizons
    status: pending
  - id: inline-task-creation-enter
    content: "Update inline task creation: Enter creates task and starts next, Escape cancels empty"
    status: pending
  - id: subtask-creation-sibling
    content: "Update subtask creation: Enter creates sibling subtask and focuses new input"
    status: pending
  - id: click-to-edit
    content: Make task title clickable to edit, remove edit button, Enter or blur saves, Escape cancels
    status: pending
  - id: always-show-horizons
    content: Always show all 4 horizons even when empty
    status: pending
  - id: completed-24h-rule
    content: Completed tasks stay in horizon for 24 hours, then move to retrospective
    status: pending
  - id: remove-strikethrough
    content: Remove strikethrough from completed tasks, use greyed-out text only
    status: pending
---

# Task UI/UX Improvements

## Overview

Make tasks more compact and text-like, improve horizon movement controls, enhance inline editing behavior, and refine task/subtask creation interactions.

## Changes Required

### 1. Task Card Styling - Make Tasks More Text-like

**File: `components/task-card.tsx`**

- Reduce vertical padding: Change from `p-3` to `py-1.5 px-2` or similar (minimal padding)
- Remove or reduce card-like appearance: Remove `rounded-lg` or make it more subtle
- Make checkbox smaller or inline: Consider reducing checkbox size or making it more subtle
- Reduce gap between checkbox and text: Change `gap-3` to `gap-2`
- Remove or minimize background hover effects: Make hover more subtle (maybe just underline or color change)
- Style to look more like a list item with text, less like a card

### 2. Horizon Movement - Replace Dropdown with Directional Arrows

**File: `components/task-card.tsx`**

- Remove the horizon dropdown menu (the `MoveRight` button with popover)
- Add two new buttons: `ChevronUp` and `ChevronDown` for horizon movement
- Horizon order: 7 days (now) → 30 days (soon) → 180 days (later) → someday
- Up arrow moves to earlier horizon (7d → 30d → 180d → someday)
- Down arrow moves to later horizon (someday → 180d → 30d → 7d)
- Disable up arrow when task is in "7 days" horizon
- Disable down arrow when task is in "someday" horizon
- Only show these buttons for top-level tasks (not subtasks)
- Update `onMoveHorizon` prop usage to accept direction or target horizon

**File: `components/horizons-view.tsx`**

- Update `handleMoveHorizon` to handle direction-based movement
- Create helper function to get next/previous horizon in sequence
- Remove the check `if (horizonTasks.length === 0) return null` to always show all 4 horizons, even when empty
- Show empty horizon sections with just the heading and inline task creation input

### 3. Inline Task Creation - Enhanced Keyboard Behavior

**File: `components/horizons-view.tsx`**

- When user presses Enter or keyboard "Done"/"Return" in inline task input:
    - If input has text: Create the task and immediately create a new empty input (focus it)
    - If input is empty: Do nothing
- When user presses Escape:
    - Clear the input and remove focus
- When user navigates away (blur):
    - If input has text: Create the task (same as Enter)
    - If input is empty: Clear the input state (cancel)
- Add visible "Add" button next to input (mobile-friendly alternative to Enter)
- Add small "X" cancel button next to input when it's focused/has content (mobile-friendly alternative to Escape)
- Track which horizon section has focus to handle navigation properly

### 4. Subtask Creation - Enter Creates Sibling

**File: `components/task-card.tsx`**

- In the subtask input field, when Enter or keyboard "Done"/"Return" is pressed:
    - Create the subtask
    - Immediately show a new empty subtask input field (sibling to the one just created)
    - Focus the new input
- When Escape is pressed:
    - Cancel subtask creation (hide input)
- When input blurs:
    - If input has text: Create the subtask (same as Enter)
    - If input is empty: Cancel subtask creation (hide input)
- Add visible "Add" button next to subtask input (mobile-friendly)
- Add small "X" cancel button next to subtask input (mobile-friendly)
- Update `handleAddSubtask` in `components/horizons-view.tsx` to handle this flow
- Position the new subtask input correctly as a sibling

### 5. Edit Mode - Click to Edit, Enter or Blur to Save

**File: `components/task-card.tsx`**

- Remove the edit button (Pencil icon)
- Make the task title text clickable to enter edit mode
- When clicking on task title:
    - Enter edit mode (show input field)
    - Focus the input
    - Select all text for easy replacement
- When in edit mode:
    - Enter key or keyboard "Done"/"Return": Save the changes (call `onEdit` if title changed)
    - Escape key: Cancel edit (revert to original title, exit edit mode)
    - Blur (clicking away): Save the changes (call `onEdit` if title changed)
- Add visible "Save" button when in edit mode (mobile-friendly alternative to Enter)
- Add small "X" cancel button when in edit mode (mobile-friendly alternative to Escape)
- Update state management to track original title for canceling

### 6. Completed Tasks - 24 Hour Rule

**Database Status:**

- The `completed_at timestamptz` field already exists in the database
- It's already being set when tasks are marked as completed (in `handleToggleComplete`)
- No database migration needed

**Implementation Approach:**The 24-hour rule will be enforced via query filtering:**File: `app/horizons/page.tsx`**

- Update query to include tasks that are:
    - Not completed (`completed = false`), OR
    - Completed within the last 24 hours (`completed = true AND completed_at > now() - interval '24 hours'`)
- Since Supabase PostgREST supports `.or()` filters, we can use:
  ```typescript
    .or(`completed.eq.false,and(completed.eq.true,completed_at.gt.${twentyFourHoursAgo.toISOString()})`)
  ```




- Or alternatively, calculate cutoff time in JavaScript and use filters:
  ```typescript
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    .or(`completed.eq.false,and(completed.eq.true,completed_at.gte.${twentyFourHoursAgo})`)
  ```




- Note: For simplicity, we might fetch all tasks and filter client-side, or use a more explicit filter structure

**File: `app/retrospective/page.tsx`**

- Update query to include only tasks that are:
    - Completed (`completed = true`), AND
    - Completed more than 24 hours ago or have null `completed_at` (`completed_at IS NULL OR completed_at <= now() - interval '24 hours'`)
- Use filter:
  ```typescript
    .eq("completed", true)
    .or(`completed_at.is.null,completed_at.lte.${twentyFourHoursAgo.toISOString()}`)
  ```


**Important Notes:**

- Tasks stay in horizon view for exactly 24 hours after `completed_at` timestamp
- If a task is unchecked, `completed_at` is set to `null`, so it will appear in horizon view
- The filtering happens at query time, so tasks automatically "move" to retrospective after 24 hours without any background jobs
- No database triggers or scheduled tasks needed - it's purely query-based filtering

### Implementation Details

**Horizon Movement Logic:**

```typescript
const horizonOrder: TimeHorizon[] = ['now', 'soon', 'later', 'someday']
const currentIndex = horizonOrder.indexOf(task.time_horizon)
const nextHorizon = horizonOrder[currentIndex + 1] // for down arrow
const prevHorizon = horizonOrder[currentIndex - 1] // for up arrow
```

**Task Creation State:**

- Track focus state for inline task inputs per horizon
- Handle Enter key or keyboard "Done" to create and continue
- Handle Escape or cancel button to cancel
- Handle blur: save if has content, cancel if empty
- Show "Add" and "X" buttons for mobile accessibility

**Edit Mode State:**

- Track `isEditing` state per task
- Store `originalTitle` when entering edit mode
- Save on Enter, keyboard "Done", or blur (if content exists)
- Cancel on Escape, cancel button, or blur (if empty)
- Show visible Save and Cancel buttons for mobile
- Save on Enter, keyboard "Done", or blur (if content exists)
- Cancel on Escape, cancel button, or blur (if empty)
- Show visible Save and Cancel buttons for mobile

## Files to Modify

1. `components/task-card.tsx` - Main task card component with all interaction changes, remove strikethrough styling
2. `components/horizons-view.tsx` - Horizon movement logic, inline creation behavior, always show all horizons
3. `app/horizons/page.tsx` - Update query to include completed tasks within 24h window
4. `app/retrospective/page.tsx` - Update query to exclude tasks completed within last 24h
5. Potentially adjust spacing in `components/horizons-view.tsx` for the compact task list

## Testing Considerations

- Test horizon movement at boundaries (first/last horizon)
- Test Enter key behavior in task creation (creates and continues)
- Test Escape key behavior (cancels empty inputs)
- Test clicking task title to edit
- Test Enter/Escape in edit mode
- Test blur behavior in edit mode (saves changes)
- Test subtask creation with Enter creating siblings
- Test visible buttons work on mobile (Add, Save, Cancel/X buttons)
- Test blur behavior: saves if content, cancels if empty (for task/subtask creation)
- Verify visual appearance is more text-like and compact
- Verify all 4 horizons are always visible, even when empty
- Verify completed tasks have NO strikethrough, only greyed-out text
- Verify completed tasks remain in horizon for 24 hours after checking
- Verify tasks move to retrospective after 24 hours
- Test unchecking a task within 24h window (should stay in horizon)