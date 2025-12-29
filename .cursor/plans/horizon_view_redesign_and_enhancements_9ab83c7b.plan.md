---
name: Horizon view redesign and enhancements
overview: Redesign the main horizons view into a single-column list with improved task management, add subtasks support, update the retrospective view to show monthly groupings, and simplify the capture form to support multi-task input.
todos:
  - id: db-migration
    content: Create migration script to add position and parent_task_id fields to tasks table
    status: pending
  - id: update-types
    content: Update Task interface in lib/types.ts to include position and parent_task_id
    status: pending
  - id: horizon-labels
    content: Update horizon labels from 'now/soon/later' to '7 days/30 days/180 days' in components
    status: pending
  - id: refactor-horizons-layout
    content: Transform horizons-view.tsx from grid to single-column list layout with section headings
    status: pending
  - id: update-queries
    content: Update database queries to order by position and include parent_task_id
    status: pending
  - id: task-card-redesign
    content: "Redesign TaskCard component: remove borders, add action buttons (up/down/delete/move/edit)"
    status: pending
  - id: implement-ordering
    content: Implement task reordering logic with position field updates
    status: pending
  - id: completed-styling
    content: Style completed tasks with strikethrough, grey color, and green checkmarks
    status: pending
  - id: subtask-support
    content: Add subtask rendering, creation, and ensure they move with parent tasks
    status: pending
  - id: inline-editing
    content: Implement inline task title editing functionality
    status: pending
  - id: inline-creation
    content: Add inline task creation inputs at end of each horizon section
    status: pending
  - id: retrospective-refactor
    content: Refactor retrospective view to show monthly groupings in descending order
    status: pending
  - id: capture-form-simplify
    content: Simplify capture form to multi-line textarea with batch task creation
    status: pending
---

# Horizon View Redesign and Enhancements

## Overview

This plan implements a major redesign of the horizons view, converting from a 4-column grid to a single unified list, while adding task ordering, subtasks, improved UI controls, and enhanced views for retrospective and capture.

## Key Decisions and Clarifications

1. **Per-task horizon selector**: Initial implementation uses a single horizon selector for all tasks in a batch. Per-task selection deferred to future enhancement.
2. **Subtask ordering**: Subtasks are contiguous under parent, excluded from top-level ordering, and always move with parent.
3. **Position backfill**: Migration assigns positions separately for top-level tasks (by horizon) and subtasks (by parent).
4. **Completed_at null handling**: Retrospective view uses `updated_at` as fallback for grouping tasks without `completed_at`.
5. **Checkbox visibility**: Uncompleted checkboxes use size-5 (20px) with prominent border (muted-foreground, 0.8 opacity).

## Database Schema Changes

### Migration Script

Create a new migration file `scripts/003_add_task_ordering_and_subtasks.sql`:

- Add `position` integer field to `tasks` table (defaults to 0, used for ordering within horizon)
- Add `parent_task_id` uuid field to `tasks` table (nullable foreign key to tasks.id for subtasks, self-referential)
- Add foreign key constraint: `parent_task_id references tasks(id) on delete cascade`
- Add index on `position` and `parent_task_id` for query performance
- Add check constraint to prevent circular references (parent_task_id != id)
- **Position backfill strategy**:
  - For top-level tasks (parent_task_id IS NULL): Assign positions 0, 1, 2... based on `created_at` (ascending) within each `time_horizon`
  - For subtasks: Assign positions 0, 1, 2... based on `created_at` (ascending) within each parent task group
  - Use window functions (ROW_NUMBER() - 1) to assign positions efficiently

### Types Update

Update `lib/types.ts`:

- Add `position: number` to `Task` interface
- Add `parent_task_id: string | null` to `Task` interface

## Main View (Horizons) Changes

### Horizon Labels

Update horizon labels in `components/horizons-view.tsx` and `components/capture-form.tsx`:

- "now" → "7 days"
- "soon" → "30 days"  
- "later" → "180 days"
- "someday" → "someday" (unchanged)

### Layout Transformation

Refactor `components/horizons-view.tsx`:

1. **Single Column Layout**: Remove the grid layout, replace with a single centered column (max-width ~800px)
2. **Grouped List Structure**: 

    - Render tasks grouped by horizon with section headings
    - Order: 7 days, 30 days, 180 days, someday
    - Within each horizon, sort by `position` (ascending)
    - Show headings as sticky or prominent section headers

3. **Task Card Redesign** (`components/task-card.tsx`):

    - Remove visible border (keep draggable functionality)
    - Add up/down arrow buttons for reordering
    - Add delete button (always visible or on hover)
    - Add horizon selector buttons (move to different horizon)
    - Add edit button/functionality (inline editing)
   - Style completed tasks: strikethrough text, greyed out, green checkmark
   - **Uncompleted checkbox visibility**: 
     - Increase checkbox size from default (4x4) to `size-5` (20px)
     - Use a more prominent border color: `border-muted-foreground` (instead of `border-input`)
     - Ensure sufficient contrast: border opacity 0.7-0.9 (not just 0.3-0.5)
     - Optionally add a subtle background: `bg-card` or `bg-background` (not transparent)
    - Support subtasks: indented rendering, checkbox, always move with parent

4. **Task Ordering Logic**:

   - Implement `handleMoveUp` and `handleMoveDown` functions
   - **Only allow reordering for top-level tasks** (parent_task_id IS NULL)
   - When moving a task up/down, swap positions with adjacent top-level task in same horizon
   - When moving a parent task, all subtasks move with it (they maintain relative positions)
   - Update positions in database when tasks are reordered (batch update for swaps)
   - Handle position updates optimistically with rollback on error
   - Handle boundary cases: disable up arrow for first task, disable down arrow for last task in horizon

5. **Subtask Support**:

   - **Ordering Semantics**:
     - Subtasks are always rendered immediately after their parent task, contiguously
     - Subtasks are excluded from top-level position ordering (they have their own position sequence relative to their parent)
     - When querying tasks, order by: `time_horizon`, then `parent_task_id NULLS FIRST`, then `position`
     - Within a parent task group, subtasks are ordered by their own `position` field (0, 1, 2...)
     - When moving a parent task up/down, only swap positions with other top-level tasks (parent_task_id IS NULL)
     - Subtasks cannot be reordered independently of their parent (they move as a unit)

   - Filter and group tasks by parent_task_id when rendering
   - Render subtasks indented under parent tasks (e.g., `ml-6` or `pl-6` for indentation)
   - Ensure drag operations move parent and all children together (update all child tasks' time_horizon when parent is moved)
   - Add UI to create new subtasks (button or inline input on parent task)
   - When deleting a parent task, handle children: either cascade delete (via DB constraint) or move to top-level

6. **Inline Task Creation**:

    - Add "Add task" input at the end of each horizon section
    - Allow quick task creation without navigating to capture page

### Query Updates

Update `app/horizons/page.tsx`:

- Fetch tasks ordered by: `time_horizon`, then `parent_task_id NULLS FIRST`, then `position ASC`
- Include parent_task_id in queries
- This ensures top-level tasks appear first within each horizon, followed by their subtasks in order

## Retrospective View Changes

Update `components/retrospective-view.tsx`:

1. **Monthly Grouping**: 

   - Group completed tasks by month based on `completed_at`
   - **Handle null completed_at**: Tasks with `completed=true` but `completed_at IS NULL` should be grouped into an "Unknown Date" or "No Date" section at the end
   - **Fallback logic**: If `completed_at` is null, use `updated_at` as fallback for grouping (when task was last updated, which likely reflects completion time if marked complete)
   - Display months in descending order (most recent first)
   - Use format "December 2025", "November 2025", etc. (via `format(completed_at, "MMMM yyyy")` from date-fns)
   - Remove the time frame selector (week/month/all)
   - Remove the custom date picker
   - Show all completed tasks grouped by month

2. **List Layout**:

   - Convert to similar list structure as main view
   - Use month headings as section headers
   - Tasks within each month sorted by `completed_at` (descending), with null handling using COALESCE(completed_at, updated_at)

## Capture Form Simplification

Update `components/capture-form.tsx`:

1. **Multi-line Input**:

    - Replace title and description fields with a single textarea
    - Allow users to type multiple tasks separated by newlines
    - Parse newlines to create multiple tasks on submit

2. **Horizon Selector**:

   - **Decision: One horizon selector applies to all tasks** (simpler initial implementation)
   - After parsing newlines into individual task titles, all tasks are assigned the same selected horizon
   - **Future enhancement note**: Per-task horizon selection could be added later by:
     - Parsing each line and detecting inline horizon markers (e.g., "Task title @7days")
     - Or showing inline dropdown selectors after parsing (more complex UI)
   - For now, document this limitation and implement single-horizon-per-batch approach

3. **Simplified UI**:

    - Remove description field
    - Cleaner, more minimal design
    - Single "Add Tasks" button

4. **Multi-task Creation**:

    - Update `handleSubmit` to split input by newlines
    - Create multiple task records in a batch insert
    - Handle errors gracefully (show which tasks failed)

## UI Components

### New Components Needed

- **TaskActions**: Component for up/down arrows, delete, horizon move buttons
- **InlineTaskEditor**: Component for editing task title inline
- **SubtaskInput**: Component for adding subtasks to a task

### Icon Imports

Add icons from lucide-react:

- `ChevronUp`, `ChevronDown` for reordering
- `Edit` or `Pencil` for editing
- `MoveRight`, `MoveLeft` or horizon-specific icons for moving between horizons
- `Plus` for adding subtasks

## Styling Updates

### Global Styles

Update task card styling:

- Remove border classes from task cards (keep padding for spacing)
- Add strikethrough styles for completed tasks: `line-through` class on title text
- **Completed checkbox**: Use green color `bg-green-600` or `data-[state=checked]:bg-green-600`, `border-green-600`
- **Uncompleted checkbox**: 
  - Size: `size-5` (20px instead of default 16px)
  - Border: `border-muted-foreground` with opacity 0.8
  - Background: `bg-card` (subtle, not transparent)
- Add indentation styles for subtasks: `ml-6` or `pl-6` class on subtask container

### Layout Styles

- Center content with max-width constraint
- Add spacing between horizon sections
- Style section headings consistently

## Implementation Order

1. Database migration (position, parent_task_id with position backfill)
2. Type definitions update (position, parent_task_id)
3. Horizon label updates (display labels only, keep DB values)
4. Query updates (ordering: time_horizon, parent_task_id NULLS FIRST, position)
5. Main view layout refactor (single column)
6. Task card redesign (remove borders, add actions)
7. Completed task styling (strikethrough, grey, green checkbox)
8. Uncompleted checkbox visibility (size-5, prominent border)
9. Task ordering implementation (up/down arrows, top-level only)
10. Horizon movement buttons (move between horizons)
11. Delete button enhancement
12. Inline editing
13. Subtask rendering (indented, contiguous under parent)
14. Subtask creation (add subtask UI)
15. Subtask ordering logic (excluded from top-level, move with parent)
16. Inline task creation in horizons view
17. Retrospective view refactor (monthly grouping with null handling)
18. Capture form simplification (multi-line input, single horizon selector)

## Testing Considerations

- Test task reordering with position updates (top-level tasks only)
- Test drag-and-drop still works without borders
- Test subtask creation and movement with parent
- Test multi-task creation in capture form (all get same horizon)
- Test edge cases: 
  - Deleting parent with subtasks (cascade delete behavior)
  - Reordering at boundaries (first/last task in horizon)
  - Moving task between horizons preserves subtasks
  - Tasks with null completed_at in retrospective view
- Verify real-time updates still work with new structure
- Test position backfill migration on existing data
- Test null handling in retrospective monthly grouping