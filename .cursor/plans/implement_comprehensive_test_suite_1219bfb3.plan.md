---
name: Implement Comprehensive Test Suite
overview: Implement the comprehensive test suite outlined in TEST_PLAN.md, covering unit tests, integration tests, E2E tests, accessibility, performance, and security testing. The plan follows a phased approach starting with foundation setup and progressing through core features to advanced testing.
todos:
  - id: phase1-dependencies
    content: "Install missing dependencies: MSW, Playwright, @vitest/coverage-v8, jest-axe, @axe-core/playwright"
    status: pending
  - id: phase1-test-utilities
    content: "Create test utilities: test-helpers.tsx, mock-supabase.ts, browser-api-mocks.ts, msw-handlers.ts (optional), accessibility-helpers.ts"
    status: pending
  - id: phase1-test-notes
    content: Create tests/TEST_IMPLEMENTATION_NOTES.md to record doubts, discrepancies, and implementation decisions
    status: pending
  - id: phase1-config
    content: "Update test configuration: enhance tests/setup.ts, create playwright.config.ts, update vitest.config.ts"
    status: pending
  - id: phase2-capture-form
    content: "Complete CaptureForm tests: add missing test cases for horizon preservation, loading states, edge cases"
    status: pending
  - id: phase2-task-card
    content: "Create comprehensive TaskCard tests: rendering, editing, keyboard navigation, drag-drop, actions - test across all 3 viewport modalities (desktop wide, desktop narrow, mobile)"
    status: pending
  - id: phase2-horizons-view
    content: "Create comprehensive HorizonsView tests: rendering, organization, drag-drop, real-time updates, keyboard navigation - test across all 3 viewport modalities"
    status: pending
  - id: phase2-other-components
    content: Create tests for CompletedView, ShareSnapshotButton, and all UI components (Button, Input, Textarea, Checkbox, Label)
    status: pending
  - id: phase3-integration
    content: "Create integration tests: task management flow, bulk capture, real-time updates, authentication, snapshots"
    status: pending
  - id: phase4-e2e
    content: "Set up Playwright and create E2E tests for all user journeys: onboarding, task management, bulk capture, keyboard navigation (desktop), mobile touch, viewport responsive - test across all 3 viewport modalities"
    status: pending
  - id: phase5-api-database
    content: "Create API/Database tests: Supabase client, database operations, query performance"
    status: pending
  - id: phase6-accessibility
    content: "Create accessibility tests: keyboard navigation, screen reader support, visual accessibility"
    status: pending
  - id: phase7-performance
    content: "Create performance tests: component performance, bundle size, network performance"
    status: pending
  - id: phase8-security
    content: "Create security tests: authentication security, authorization, input validation"
    status: pending
  - id: phase9-error-edge
    content: "Create error handling and edge case tests: network errors, validation errors, database errors, edge cases"
    status: pending
  - id: phase10-cicd
    content: "Set up CI/CD pipeline: GitHub Actions workflow, pre-commit hooks, coverage configuration, update documentation"
    status: pending
---

# Implementation Plan: Comprehensive Test Suite

## Current State

- **Testing Infrastructure**: Vitest configured, React Testing Library installed, basic test setup exists
- **Existing Tests**: `capture-form.test.tsx` (partial), `utils.test.ts` (complete)
- **Missing Dependencies**: MSW (Mock Service Worker), Playwright, coverage tools

## Important Guidelines

### Source of Truth

**When in doubt during test implementation, use the current production code as the source of truth.**

- If TEST_PLAN.md expectations differ from actual code behavior, follow what the code actually does
- Test the code as it exists, not as it "should" be
- Document any discrepancies or concerns in `tests/TEST_IMPLEMENTATION_NOTES.md` for future review
- This ensures tests accurately reflect current functionality and catch regressions correctly

### Viewport Modalities

**The application must be tested across three distinct viewport modalities, each with different behaviors:**

1. **Desktop Wide View** (> 768px width)

    - Full keyboard shortcuts enabled
    - Hover effects and hover-revealed action buttons
    - Mouse pointer interactions
    - Desktop-optimized layouts
    - Drag and drop with mouse

2. **Desktop Narrow View** (≤ 768px width, browser mobile emulator)

    - Touch-optimized interactions
    - Compact layouts (`isCompactLayout` = true)
    - Action buttons visible in edit mode (not hover-based)
    - Touch pointer interactions
    - Long press for drag initiation
    - Buttons view opens on tap without keyboard
    - Edit via double-tap or tap on text when buttons view is open

3. **Mobile View** (actual mobile device)

    - Same as Desktop Narrow View but with actual touch events
    - Mobile browser-specific behaviors
    - Touch-friendly button sizes
    - Viewport-specific optimizations

**Breakpoint**: The application uses `max-width: 768px` as the breakpoint between desktop and mobile/compact layouts.**Key Differences to Test:**

- Keyboard shortcuts (desktop only)
- Hover effects and hover-revealed UI (desktop only)
- Action button visibility patterns (hover on desktop, always visible in edit mode on mobile)
- Edit mode triggers (double-click on desktop mouse; mobile uses buttons view first)
- Drag initiation (mouse drag on desktop, long press on mobile)
- Pointer type detection (mouse vs touch)
- Layout compactness (`isCompactLayout` state)

### Recording Doubts and Discrepancies

**File: `tests/TEST_IMPLEMENTATION_NOTES.md`** (new)Create this file to record:

- Discrepancies between TEST_PLAN.md and actual code behavior
- Ambiguous test requirements that need clarification
- Questions about expected behavior
- Edge cases discovered during implementation
- Test implementation decisions and rationale
- Areas that may need code refactoring based on test findings

This file serves as a living document for review and future improvements.

## Phase 1: Foundation & Infrastructure (Priority: High)

### 1.1 Install Missing Dependencies

Add to `package.json` devDependencies:

- `msw` - Mock Service Worker for fetch-based API mocking (limited use - see mocking strategy below)
- `@playwright/test` - E2E testing framework
- `@vitest/coverage-v8` - Coverage reporting
- `jest-axe` - Accessibility testing for unit/integration tests (Vitest compatible)
- `@axe-core/playwright` - Accessibility testing for E2E tests
- `@testing-library/jest-dom` - Already installed ✓

### 1.2 Create Test Utilities

**File: `tests/utils/test-helpers.tsx`**

- Task factory function for creating test tasks
- Snapshot factory function
- Mock Supabase client helpers
- Test data fixtures
- Common render wrappers with providers
- Viewport helpers for testing different screen sizes:
    - `renderWithViewport(component, viewport)` - Render with specific viewport size
    - `setViewport(width, height)` - Set viewport dimensions
    - Viewport presets: `DESKTOP_WIDE`, `DESKTOP_NARROW`, `MOBILE`
    - Pointer type helpers: `setPointerType('mouse' | 'touch')`

**File: `tests/utils/mock-supabase.ts`**

- Enhanced Supabase client mock setup (primary mocking strategy)
- Reusable mock implementations for common operations:
    - `from()` query builder chain mocks
    - `select()`, `insert()`, `update()`, `delete()` operations
    - `eq()`, `order()`, `limit()` query modifiers
- Real-time subscription/channel mocks:
    - `channel()` mock with subscription simulation
    - `on('postgres_changes')` event handlers
    - `subscribe()` and `unsubscribe()` methods
    - Channel event emission helpers for testing real-time updates
- Mock session management
- Mock authentication methods

**File: `tests/utils/browser-api-mocks.ts`** (new)

- Centralized browser API mock implementations
- `mockMatchMedia(viewportWidth)` - Mock media queries for viewport testing
- `mockResizeObserver()` - Mock ResizeObserver with callback support
- `mockPointerEvent()` - Mock PointerEvent with pointer type support
- `mockIntersectionObserver()` - Mock IntersectionObserver if needed
- Reusable across all test files

**File: `tests/utils/msw-handlers.ts`** (optional, limited use)

- MSW request handlers for any fetch-based endpoints (if used)
- Note: Most task flows use Supabase client directly, not fetch
- Primary mocking should use Supabase client mocks, not MSW
- Only use MSW if there are actual fetch() calls to external APIs

**File: `tests/utils/accessibility-helpers.ts`**

- Jest-axe setup and helpers for unit/integration tests
- Common accessibility assertions using `toHaveNoViolations()`
- Screen reader testing utilities
- Helper functions for running axe checks in Vitest

### 1.3 Update Test Setup

**File: `tests/setup.ts`** (enhance existing - Vitest only, no Playwright)

- Enhance Supabase client mocks (primary mocking strategy)
- Import and initialize browser API mocks from `tests/utils/browser-api-mocks.ts`:
    - `window.matchMedia` - For responsive breakpoints (already partially mocked, enhance for viewport testing)
    - `ResizeObserver` - For component resize detection (required for responsive layouts)
    - `PointerEvent` - For pointer type detection (mouse vs touch) - critical for viewport modality testing
    - `IntersectionObserver` - For visibility/lazy loading if used
- Add MSW server setup (if needed for fetch-based endpoints, optional)
- Add jest-axe setup for accessibility testing
- Do NOT include Playwright global setup (that belongs in playwright.config.ts)

**File: `playwright.config.ts`** (new)

- Configure Playwright for E2E tests
- Set up test environment
- Configure browsers (Chromium, Firefox, WebKit)
- Set up test fixtures
- Configure `globalSetup` for Playwright-specific setup (not in tests/setup.ts)
- Configure viewport presets:
    - Desktop wide: 1920x1080 or 1440x900
    - Desktop narrow: 768x1024 (mobile emulator)
    - Mobile: 375x667 (iPhone SE), 390x844 (iPhone 12/13)
- Set up device emulation for mobile tests
- Configure @axe-core/playwright for E2E accessibility tests

**File: `vitest.config.ts`** (update)

- Add coverage configuration
- Configure test environment variables
- Set up test timeouts

## Phase 2: Component Unit Tests (Priority: High)

### 2.1 Complete CaptureForm Tests

**File: `tests/components/capture-form.test.tsx`** (enhance existing)

- Add missing test cases from TEST_PLAN.md:
    - Preserves task horizon assignments when text changes
    - Handles loading state during submission
    - Edge cases (empty lines, special characters)

### 2.2 TaskCard Component Tests

**File: `tests/components/task-card.test.tsx`** (new)Test all functionality from TEST_PLAN.md across all three viewport modalities:**Desktop Wide View (> 768px):**

- Rendering and display states
- Edit mode (Enter, double-click with mouse, blur, Escape)
- Completion toggle
- Keyboard navigation (Arrow keys, Space, Delete, S for subtask)
- Drag and drop with mouse (start, end, preview)
- Action buttons visibility on hover (desktop only)
- Move operations (up/down, horizon movement)
- Delete confirmation flow
- Disabled states for completed tasks
- Subtask input handling
- Hover effects (`hover:bg-accent/30`)
- Action buttons hidden until hover (`md:invisible md:group-hover:visible`)

**Desktop Narrow View (≤ 768px, mobile emulator):**

- Compact layout rendering (`isCompactLayout` = true)
- Buttons view opens on tap without keyboard
- Edit mode opens via double-tap or tap on text when buttons view is open
- Touch pointer interactions
- Long press for drag initiation (220ms threshold)
- Action buttons visible in edit mode (not hover-based)
- Action buttons in rows on mobile (`md:hidden`)
- Touch-friendly button sizes
- No hover effects
- Different edit trigger behavior (buttons view then edit)

**Mobile View (actual mobile device):**

- Same as Desktop Narrow View
- Actual touch events (not emulated)
- Mobile browser-specific behaviors
- Viewport-specific optimizations

**Cross-viewport tests:**

- Viewport resize handling
- Pointer type detection (mouse vs touch)
- `isCompactLayout` state changes on resize
- Responsive behavior at 768px breakpoint

### 2.3 HorizonsView Component Tests

**File: `tests/components/horizons-view.test.tsx`** (new)Test all functionality from TEST_PLAN.md across all three viewport modalities:**Desktop Wide View (> 768px):**

- Rendering all four horizon columns
- Task organization and sorting
- Subtask grouping
- Completed tasks filter toggle
- localStorage persistence
- Keyboard shortcuts (Cmd/Ctrl+Shift+H) - desktop only
- Task creation (new task, subtask)
- Drag and drop with mouse (reordering, between horizons, subtasks)
- Position updates
- Drop indicators
- Real-time updates from Supabase
- Focus management
- Keyboard navigation (between tasks, between horizons) - desktop only
- Help dialog
- Delete confirmation modal
- Move operations
- Optimistic update error handling
- Hover interactions

**Desktop Narrow View (≤ 768px, mobile emulator):**

- Compact layout rendering
- Touch-optimized drag and drop
- Long press for drag initiation
- Touch-friendly interactions
- No keyboard shortcuts (or limited)
- Different navigation patterns
- Mobile-optimized layouts

**Mobile View (actual mobile device):**

- Same as Desktop Narrow View
- Actual touch events
- Mobile browser optimizations

**Cross-viewport tests:**

- Responsive layout changes at breakpoint
- Viewport resize handling
- Touch vs mouse interaction detection

### 2.4 CompletedView Component Tests

**File: `tests/components/completed-view.test.tsx`** (new)

- Renders completed tasks
- Shows subtasks of completed parents
- Groups tasks by completion date
- Handles snapshot creation
- Navigates to snapshots page
- Real-time updates

### 2.5 ShareSnapshotButton Component Tests

**File: `tests/components/share-snapshot-button.test.tsx`** (new)

- Creates snapshot with correct data
- Shows loading state
- Handles errors gracefully
- Navigates to snapshot page after creation
- Copies link to clipboard
- Shows copied state

### 2.6 UI Component Tests

**File: `tests/components/ui/button.test.tsx`** (new)

- Renders with correct variants
- Handles disabled state
- Handles click events

**File: `tests/components/ui/input.test.tsx`** (new)

- Handles value changes
- Shows validation errors
- Handles focus/blur

**File: `tests/components/ui/textarea.test.tsx`** (new)

- Handles multi-line input
- Handles value changes

**File: `tests/components/ui/checkbox.test.tsx`** (new)

- Toggles checked state
- Handles disabled state

**File: `tests/components/ui/label.test.tsx`** (new)

- Associates with form controls
- Handles click events

## Phase 3: Integration Tests (Priority: High)

### 3.1 Task Management Flow Tests

**File: `tests/integration/task-management.test.tsx`** (new)

- Create task → appears in correct horizon
- Create subtask → appears under parent
- Edit task → updates in database
- Complete task → moves to completed view
- Delete task → removes from view
- Delete parent task → removes subtasks (cascade)
- Reorder tasks → positions update correctly
- Move task between horizons → updates correctly
- Move parent task → moves subtasks with it

### 3.2 Bulk Capture Flow Tests

**File: `tests/integration/bulk-capture.test.tsx`** (new)

- Paste multiple tasks → parses correctly
- Assign horizons → saves with correct assignments
- Submit → all tasks created in database
- Position calculation → tasks get sequential positions

### 3.3 Real-time Updates Tests

**File: `tests/integration/realtime-updates.test.tsx`** (new)

- Create task in one tab → appears in other tab
- Update task in one tab → updates in other tab
- Delete task in one tab → removes in other tab
- Handles connection errors gracefully
- Reconnects after connection loss

### 3.4 Authentication Flow Tests

**File: `tests/integration/auth.test.tsx`** (new)

- Login with email/password → redirects to horizons
- Login with Google OAuth → redirects to horizons
- Sign up → creates account
- Email confirmation → activates account
- Logout → redirects to home
- Protected routes → redirect unauthenticated users
- Session refresh → maintains authentication

### 3.5 Snapshot Flow Tests

**File: `tests/integration/snapshot.test.tsx`** (new)

- Create snapshot → saves task data
- View snapshot → displays correctly
- Share snapshot → generates shareable link
- Public snapshot → accessible without auth
- Private snapshot → requires auth

## Phase 4: End-to-End Tests (Priority: High)

### 4.1 Setup Playwright

**File: `tests/e2e/setup.ts`** (new)

- Test environment setup
- Authentication helpers
- Database seeding helpers
- Cleanup utilities

### 4.2 User Journey Tests

**File: `tests/e2e/journeys/new-user-onboarding.spec.ts`** (new)

- Visit home page
- Click "Create Account"
- Sign up with email
- Confirm email
- Login
- See empty horizons view
- Create first task
- Task appears in "now" horizon

**File: `tests/e2e/journeys/task-management.spec.ts`** (new)

- Login as existing user
- Create multiple tasks in different horizons
- Create subtasks
- Reorder tasks via drag and drop
- Move task between horizons
- Complete a task
- View completed tasks
- Create snapshot from completed tasks

**File: `tests/e2e/journeys/bulk-capture.spec.ts`** (new)

- Navigate to capture page
- Paste list of tasks
- Assign horizons to tasks
- Submit
- Verify all tasks appear in horizons view

**File: `tests/e2e/journeys/keyboard-navigation.spec.ts`** (new)**Desktop Wide View only:**

- Navigate between tasks with arrow keys
- Navigate between horizons with left/right arrows
- Edit task with Enter key
- Complete task with Space key
- Add subtask with "S" key
- Add task with "A" key
- Delete task with Delete key
- Move task with Alt+Arrow keys
- Keyboard shortcuts (Cmd/Ctrl+Shift+H for completed toggle)

**File: `tests/e2e/journeys/mobile-touch.spec.ts`** (new)**Desktop Narrow View and Mobile View:**

- Long press task to start drag (220ms threshold)
- Drag task to reorder
- Tap task to open buttons view (no keyboard)
- Double-tap task to edit (keyboard)
- Tap text in buttons view to edit
- Touch-friendly button sizes
- Action buttons visible in edit mode
- No hover effects
- Compact layout rendering
- Touch pointer interactions

**File: `tests/e2e/journeys/viewport-responsive.spec.ts`** (new)

- Test viewport resize from desktop to mobile
- Test viewport resize from mobile to desktop
- Verify layout changes at 768px breakpoint
- Test pointer type detection on resize
- Verify `isCompactLayout` state changes
- Test interaction mode switching (mouse to touch)

## Phase 5: API/Database Tests (Priority: High)

### 5.1 Supabase Client Tests

**File: `tests/api/supabase-client.test.ts`** (new)

- Client creation with environment variables
- Server client creation
- Proxy client creation
- Session management
- Error handling

### 5.2 Database Operations Tests

**File: `tests/api/database-operations.test.ts`** (new)

- Task CRUD operations
- Snapshot CRUD operations
- Position updates (batch operations)
- Cascade delete (parent → subtasks)
- RLS (Row Level Security) policies
- User isolation (users can't see other users' tasks)
- Public snapshot access

### 5.3 Query Performance Tests

**File: `tests/api/performance.test.ts`** (new)

- Task fetching performance
- Snapshot fetching performance
- Real-time subscription performance
- Position recalculation performance

## Phase 6: Accessibility Tests (Priority: High)

### 6.1 Keyboard Navigation Tests

**File: `tests/accessibility/keyboard-navigation.test.tsx`** (new)**Desktop Wide View:**

- All interactive elements are keyboard accessible
- Focus indicators are visible
- Tab order is logical
- Escape key closes modals/dialogs
- Enter key submits forms
- Arrow keys navigate lists
- Keyboard shortcuts work (Cmd/Ctrl+Shift+H, etc.)
- Hover-revealed elements are keyboard accessible

**Desktop Narrow View and Mobile View:**

- All interactive elements are keyboard accessible (when keyboard is available)
- Focus indicators are visible
- Tab order is logical
- Touch targets are appropriately sized (minimum 44x44px)
- No reliance on hover for critical functionality

### 6.2 Screen Reader Tests

**File: `tests/accessibility/screen-reader.test.tsx`** (new)

- All interactive elements have ARIA labels
- Form inputs have associated labels
- Error messages are announced
- Status changes are announced
- Modal dialogs have proper ARIA attributes
- Lists have proper ARIA roles

### 6.3 Visual Accessibility Tests

**File: `tests/accessibility/visual.test.tsx`** (new)

- Color contrast meets WCAG AA standards
- Focus indicators are visible
- Text is readable at different zoom levels
- Icons have text alternatives
- Error states are visually clear

## Phase 7: Performance Tests (Priority: Medium)

### 7.1 Component Performance Tests

**File: `tests/performance/component-performance.test.tsx`** (new)**All viewport modalities:**

- Large task lists render efficiently
- Drag and drop is smooth (mouse on desktop, touch on mobile)
- Real-time updates don't cause lag
- Optimistic updates are instant
- No unnecessary re-renders (use React DevTools Profiler)
- Viewport resize performance
- Layout recalculation performance on resize

### 7.2 Bundle Size Tests

**File: `tests/performance/bundle-size.test.ts`** (new)

- Initial bundle size is reasonable
- Code splitting is effective
- Unused dependencies are removed

### 7.3 Network Performance Tests

**File: `tests/performance/network.test.ts`** (new)

- API calls are optimized
- Batch operations are used where possible
- Real-time subscriptions are efficient
- Error retry logic works correctly

## Phase 8: Security Tests (Priority: High)

### 8.1 Authentication Security Tests

**File: `tests/security/auth.test.ts`** (new)

- Passwords are not exposed
- Sessions expire correctly
- CSRF protection works
- OAuth flow is secure

### 8.2 Authorization Security Tests

**File: `tests/security/authorization.test.ts`** (new)

- Users can only access their own tasks
- RLS policies are enforced
- Public snapshots are truly public
- Private snapshots require authentication

### 8.3 Input Validation Security Tests

**File: `tests/security/input-validation.test.ts`** (new)

- SQL injection prevention
- XSS prevention
- Input sanitization
- File upload validation (if applicable)

## Phase 9: Error Handling & Edge Cases (Priority: Medium)

### 9.1 Error Handling Tests

**File: `tests/error-handling/network-errors.test.tsx`** (new)

- Handles network failures gracefully
- Shows user-friendly error messages
- Retries failed operations
- Offline state is handled

**File: `tests/error-handling/validation-errors.test.tsx`** (new)

- Form validation errors are clear
- Required fields are marked
- Invalid input is rejected
- Error messages are helpful

**File: `tests/error-handling/database-errors.test.tsx`** (new)

- Handles constraint violations
- Handles connection errors
- Handles timeout errors
- Optimistic updates revert on error

### 9.2 Edge Cases Tests

**File: `tests/edge-cases/task-management.test.tsx`** (new)

- Empty task list
- Very long task titles
- Tasks with special characters
- Tasks with emojis
- Maximum number of tasks
- Maximum nesting depth for subtasks
- Concurrent edits
- Rapid task creation/deletion

**File: `tests/edge-cases/data-consistency.test.tsx`** (new)

- Position gaps after deletion
- Position conflicts
- Orphaned subtasks
- Circular parent references (prevented)

**File: `tests/edge-cases/user-experience.test.tsx`** (new)**All viewport modalities:**

- Very slow network connection
- Interrupted operations
- Browser back/forward navigation
- Page refresh during operations
- Multiple tabs open

**Viewport-specific edge cases:**

- Rapid viewport resize
- Orientation change (mobile)
- Viewport resize during drag operation
- Switching between mouse and touch input
- Browser zoom at different viewport sizes

## Phase 10: CI/CD & Test Infrastructure (Priority: Medium)

### 10.1 CI/CD Configuration

**File: `.github/workflows/test.yml`** (new, if using GitHub Actions)

- Run linting
- Run type checking
- Run unit tests
- Run integration tests
- Run E2E tests
- Check test coverage
- Performance benchmarks

**File: `.husky/pre-commit`** (new, if using Husky)

- Run linting
- Run type checking
- Run unit tests

### 10.2 Test Coverage Configuration

**File: `vitest.config.ts`** (update)

- Configure coverage thresholds (80%+)
- Exclude patterns
- Coverage reporters

### 10.3 Test Documentation

**File: `tests/README.md`** (update existing)

- Document test utilities
- Document test data setup
- Document known issues/limitations
- Update with new test structure

**File: `tests/TEST_IMPLEMENTATION_NOTES.md`** (new)

- Record discrepancies between TEST_PLAN.md and production code
- Document ambiguous requirements and questions
- Track test implementation decisions
- Note areas needing code review or refactoring

## Implementation Order

1. **Week 1**: Phase 1 (Foundation) + Phase 2.1-2.2 (Complete CaptureForm, Start TaskCard)
2. **Week 2**: Phase 2.3-2.6 (Complete all component tests)
3. **Week 3**: Phase 3 (Integration tests)
4. **Week 4**: Phase 4 (E2E tests)
5. **Week 5**: Phase 5-6 (API/Database + Accessibility)
6. **Week 6**: Phase 7-8 (Performance + Security)
7. **Week 7**: Phase 9 (Error handling + Edge cases)
8. **Week 8**: Phase 10 (CI/CD) + Polish + Fix issues

## Key Files to Create/Modify

### New Test Files (40+ files)

- Test utilities and helpers
- Component tests (8 files)
- Integration tests (5 files)
- E2E tests (5 files)
- API/Database tests (3 files)
- Accessibility tests (3 files)
- Performance tests (3 files)
- Security tests (3 files)
- Error handling tests (3 files)
- Edge cases tests (3 files)

### Configuration Files

- `playwright.config.ts`
- `.github/workflows/test.yml` (optional)
- Update `vitest.config.ts`
- Update `tests/setup.ts`
- Update `package.json`

### Documentation Files

- `tests/TEST_IMPLEMENTATION_NOTES.md` - Record doubts, discrepancies, and implementation decisions

## Dependencies to Add

```json
{
  "devDependencies": {
    "msw": "^2.0.0",
    "@playwright/test": "^1.40.0",
    "@vitest/coverage-v8": "^1.0.4",
    "jest-axe": "^8.0.0",
    "@axe-core/playwright": "^4.8.0"
  }
}
```

## Mocking Strategy

**Primary Strategy: Supabase Client Mocking**The application primarily uses the Supabase client for data operations, not fetch-based REST APIs. Therefore:

1. **Use Supabase client mocks** (`tests/utils/mock-supabase.ts`) as the primary mocking strategy
2. **Mock Supabase channels** for real-time subscription testing:

    - Simulate `channel().on('postgres_changes')` events
    - Test real-time update handling
    - Verify subscription/unsubscription behavior

3. **MSW is optional** and only needed if there are actual `fetch()` calls to external APIs
4. **Do not use MSW for Supabase operations** - mock the Supabase client directly

This approach is more accurate because:

- It matches how the application actually works (Supabase client, not REST)
- It allows testing real-time channel behavior
- It's simpler and more maintainable
- It avoids the complexity of mocking HTTP requests that don't exist

## Success Criteria

- 80%+ code coverage for unit tests
- All critical user flows covered by integration tests
- All major user journeys covered by E2E tests
- WCAG AA compliance for accessibility
- All security requirements met
- Tests run in CI/CD pipeline
- Test execution time < 5 minutes for unit tests

**Viewport Testing Requirements:**

- All component tests must verify behavior across three viewport modalities:
    - Desktop Wide View (> 768px)
    - Desktop Narrow View (≤ 768px, mobile emulator)
    - Mobile View (actual mobile device)
- E2E tests must run on all three viewport sizes
- Viewport-specific behaviors must be tested:
    - Keyboard shortcuts (desktop only)
    - Hover effects (desktop only)
    - Touch interactions (mobile/narrow)
    - Layout responsiveness at 768px breakpoint
    - Pointer type detection (mouse vs touch)