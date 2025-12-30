# Test Plan for Time Horizon Task Manager

## Overview

This document outlines a comprehensive testing strategy for the Time Horizon Task Manager application. The plan covers unit tests, integration tests, end-to-end tests, and other testing categories to ensure reliability, maintainability, and user experience.

## Testing Stack Recommendations

### Unit & Integration Tests
- **Vitest** - Fast unit testing framework (works well with Next.js)
- **React Testing Library** - Component testing with focus on user behavior
- **@testing-library/user-event** - Simulate user interactions
- **MSW (Mock Service Worker)** - Mock API calls for integration tests

### End-to-End Tests
- **Playwright** - Cross-browser E2E testing (recommended for Next.js)
- Alternative: **Cypress** if preferred

### Test Utilities
- **@supabase/supabase-js** - Mock Supabase client for testing
- **jsdom** - DOM environment for React components (included with Vitest)

## Test Categories

### 1. Unit Tests

#### 1.1 Component Tests

**Priority: High**

##### `components/capture-form.tsx`
- [ ] Renders textarea and paste button
- [ ] Parses multi-line input into task entries
- [ ] Preserves task horizon assignments when text changes
- [ ] Shows task preview with horizon selector buttons
- [ ] Validates empty input (submit disabled)
- [ ] Handles paste from clipboard
- [ ] Handles paste errors gracefully
- [ ] Submits tasks with correct horizon assignments
- [ ] Calculates correct position for new tasks
- [ ] Redirects to horizons page after successful submission
- [ ] Shows error messages on submission failure
- [ ] Handles loading state during submission

##### `components/task-card.tsx`
- [ ] Renders task title correctly
- [ ] Shows completed state with checkmark
- [ ] Toggles completion on checkbox click
- [ ] Enters edit mode on Enter key
- [ ] Enters edit mode on double-click (mouse only)
- [ ] Enters edit mode on tap (touch devices)
- [ ] Saves edit on Enter key
- [ ] Cancels edit on Escape key
- [ ] Saves edit on blur
- [ ] Prevents editing completed tasks
- [ ] Shows action buttons on hover (desktop)
- [ ] Handles keyboard navigation (Arrow keys, Space, Delete, etc.)
- [ ] Shows subtask input when "S" key pressed
- [ ] Handles drag start/end events
- [ ] Shows correct drag preview
- [ ] Handles long press for touch devices
- [ ] Shows move up/down buttons with correct disabled states
- [ ] Shows horizon move buttons with correct disabled states
- [ ] Handles delete confirmation flow

##### `components/horizons-view.tsx`
- [ ] Renders all four horizon columns
- [ ] Organizes tasks by horizon correctly
- [ ] Sorts tasks by position within horizon
- [ ] Groups subtasks under parent tasks
- [ ] Filters completed tasks based on toggle
- [ ] Persists completed tasks visibility to localStorage
- [ ] Handles keyboard shortcut (Cmd/Ctrl+Shift+H) for toggle
- [ ] Creates new task in correct horizon
- [ ] Creates subtask under parent task
- [ ] Handles drag and drop reordering
- [ ] Handles drag and drop between horizons
- [ ] Handles drag and drop for subtasks
- [ ] Updates positions correctly after reordering
- [ ] Shows drop indicators during drag
- [ ] Handles real-time updates from Supabase
- [ ] Focuses correct task after operations
- [ ] Handles keyboard navigation between tasks
- [ ] Handles keyboard navigation between horizons
- [ ] Shows help dialog with keyboard shortcuts
- [ ] Handles delete confirmation modal
- [ ] Handles move up/down operations
- [ ] Handles horizon movement operations
- [ ] Optimistic updates revert on error

##### `components/completed-view.tsx`
- [ ] Renders completed tasks
- [ ] Shows subtasks of completed parents
- [ ] Groups tasks by completion date
- [ ] Handles snapshot creation
- [ ] Navigates to snapshots page

##### `components/share-snapshot-button.tsx`
- [ ] Creates snapshot with correct data
- [ ] Shows loading state
- [ ] Handles errors gracefully
- [ ] Navigates to snapshot page after creation

##### UI Components (`components/ui/*`)
- [ ] Button: Renders with correct variants
- [ ] Button: Handles disabled state
- [ ] Input: Handles value changes
- [ ] Input: Shows validation errors
- [ ] Textarea: Handles multi-line input
- [ ] Checkbox: Toggles checked state
- [ ] Label: Associates with form controls

#### 1.2 Utility Function Tests

**Priority: Medium**

##### `lib/utils.ts`
- [ ] `cn()` function merges class names correctly
- [ ] Handles undefined/null values
- [ ] Handles conditional classes

#### 1.3 Type Tests

**Priority: Low**

##### `lib/types.ts`
- [ ] Type definitions are correct (TypeScript compile-time)
- [ ] TimeHorizon union type is valid
- [ ] Task interface matches database schema
- [ ] Snapshot interface matches database schema

### 2. Integration Tests

**Priority: High**

#### 2.1 Task Management Flow
- [ ] Create task → appears in correct horizon
- [ ] Create subtask → appears under parent
- [ ] Edit task → updates in database
- [ ] Complete task → moves to completed view
- [ ] Delete task → removes from view
- [ ] Delete parent task → removes subtasks (cascade)
- [ ] Reorder tasks → positions update correctly
- [ ] Move task between horizons → updates correctly
- [ ] Move parent task → moves subtasks with it

#### 2.2 Bulk Capture Flow
- [ ] Paste multiple tasks → parses correctly
- [ ] Assign horizons → saves with correct assignments
- [ ] Submit → all tasks created in database
- [ ] Position calculation → tasks get sequential positions

#### 2.3 Real-time Updates
- [ ] Create task in one tab → appears in other tab
- [ ] Update task in one tab → updates in other tab
- [ ] Delete task in one tab → removes in other tab
- [ ] Handles connection errors gracefully
- [ ] Reconnects after connection loss

#### 2.4 Authentication Flow
- [ ] Login with email/password → redirects to horizons
- [ ] Login with Google OAuth → redirects to horizons
- [ ] Sign up → creates account
- [ ] Email confirmation → activates account
- [ ] Logout → redirects to home
- [ ] Protected routes → redirect unauthenticated users
- [ ] Session refresh → maintains authentication

#### 2.5 Snapshot Flow
- [ ] Create snapshot → saves task data
- [ ] View snapshot → displays correctly
- [ ] Share snapshot → generates shareable link
- [ ] Public snapshot → accessible without auth
- [ ] Private snapshot → requires auth

### 3. End-to-End Tests

**Priority: High**

#### 3.1 User Journeys

##### Journey 1: New User Onboarding
1. [ ] Visit home page
2. [ ] Click "Create Account"
3. [ ] Sign up with email
4. [ ] Confirm email
5. [ ] Login
6. [ ] See empty horizons view
7. [ ] Create first task
8. [ ] Task appears in "now" horizon

##### Journey 2: Task Management
1. [ ] Login as existing user
2. [ ] Create multiple tasks in different horizons
3. [ ] Create subtasks
4. [ ] Reorder tasks via drag and drop
5. [ ] Move task between horizons
6. [ ] Complete a task
7. [ ] View completed tasks
8. [ ] Create snapshot from completed tasks

##### Journey 3: Bulk Task Capture
1. [ ] Navigate to capture page
2. [ ] Paste list of tasks
3. [ ] Assign horizons to tasks
4. [ ] Submit
5. [ ] Verify all tasks appear in horizons view

##### Journey 4: Keyboard Navigation
1. [ ] Navigate between tasks with arrow keys
2. [ ] Navigate between horizons with left/right arrows
3. [ ] Edit task with Enter key
4. [ ] Complete task with Space key
5. [ ] Add subtask with "S" key
6. [ ] Add task with "A" key
7. [ ] Delete task with Delete key
8. [ ] Move task with Alt+Arrow keys

##### Journey 5: Mobile/Touch Interaction
1. [ ] Long press task to start drag
2. [ ] Drag task to reorder
3. [ ] Tap task to edit
4. [ ] Swipe gestures (if implemented)
5. [ ] Touch-friendly button sizes

### 4. API/Database Tests

**Priority: High**

#### 4.1 Supabase Client Tests
- [ ] Client creation with environment variables
- [ ] Server client creation
- [ ] Proxy client creation
- [ ] Session management
- [ ] Error handling

#### 4.2 Database Operations
- [ ] Task CRUD operations
- [ ] Snapshot CRUD operations
- [ ] Position updates (batch operations)
- [ ] Cascade delete (parent → subtasks)
- [ ] RLS (Row Level Security) policies
- [ ] User isolation (users can't see other users' tasks)
- [ ] Public snapshot access

#### 4.3 Query Performance
- [ ] Task fetching performance
- [ ] Snapshot fetching performance
- [ ] Real-time subscription performance
- [ ] Position recalculation performance

### 5. Accessibility Tests

**Priority: High**

#### 5.1 Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Tab order is logical
- [ ] Escape key closes modals/dialogs
- [ ] Enter key submits forms
- [ ] Arrow keys navigate lists

#### 5.2 Screen Reader Support
- [ ] All interactive elements have ARIA labels
- [ ] Form inputs have associated labels
- [ ] Error messages are announced
- [ ] Status changes are announced
- [ ] Modal dialogs have proper ARIA attributes
- [ ] Lists have proper ARIA roles

#### 5.3 Visual Accessibility
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators are visible
- [ ] Text is readable at different zoom levels
- [ ] Icons have text alternatives
- [ ] Error states are visually clear

### 6. Performance Tests

**Priority: Medium**

#### 6.1 Component Performance
- [ ] Large task lists render efficiently
- [ ] Drag and drop is smooth
- [ ] Real-time updates don't cause lag
- [ ] Optimistic updates are instant
- [ ] No unnecessary re-renders

#### 6.2 Bundle Size
- [ ] Initial bundle size is reasonable
- [ ] Code splitting is effective
- [ ] Unused dependencies are removed

#### 6.3 Network Performance
- [ ] API calls are optimized
- [ ] Batch operations are used where possible
- [ ] Real-time subscriptions are efficient
- [ ] Error retry logic works correctly

### 7. Security Tests

**Priority: High**

#### 7.1 Authentication
- [ ] Passwords are not exposed
- [ ] Sessions expire correctly
- [ ] CSRF protection works
- [ ] OAuth flow is secure

#### 7.2 Authorization
- [ ] Users can only access their own tasks
- [ ] RLS policies are enforced
- [ ] Public snapshots are truly public
- [ ] Private snapshots require authentication

#### 7.3 Input Validation
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Input sanitization
- [ ] File upload validation (if applicable)

### 8. Cross-Browser Tests

**Priority: Medium**

#### 8.1 Browser Compatibility
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

#### 8.2 Feature Support
- [ ] Drag and drop works in all browsers
- [ ] Touch events work on mobile
- [ ] CSS features are supported
- [ ] JavaScript features are supported

### 9. Error Handling Tests

**Priority: High**

#### 9.1 Network Errors
- [ ] Handles network failures gracefully
- [ ] Shows user-friendly error messages
- [ ] Retries failed operations
- [ ] Offline state is handled

#### 9.2 Validation Errors
- [ ] Form validation errors are clear
- [ ] Required fields are marked
- [ ] Invalid input is rejected
- [ ] Error messages are helpful

#### 9.3 Database Errors
- [ ] Handles constraint violations
- [ ] Handles connection errors
- [ ] Handles timeout errors
- [ ] Optimistic updates revert on error

### 10. Edge Cases

**Priority: Medium**

#### 10.1 Task Management
- [ ] Empty task list
- [ ] Very long task titles
- [ ] Tasks with special characters
- [ ] Tasks with emojis
- [ ] Maximum number of tasks
- [ ] Maximum nesting depth for subtasks
- [ ] Concurrent edits
- [ ] Rapid task creation/deletion

#### 10.2 Data Consistency
- [ ] Position gaps after deletion
- [ ] Position conflicts
- [ ] Orphaned subtasks
- [ ] Circular parent references (prevented)

#### 10.3 User Experience
- [ ] Very slow network connection
- [ ] Interrupted operations
- [ ] Browser back/forward navigation
- [ ] Page refresh during operations
- [ ] Multiple tabs open

## Test Implementation Strategy

### Phase 1: Foundation (Week 1-2)
1. Set up testing infrastructure (Vitest, React Testing Library, Playwright)
2. Write utility function tests
3. Write basic component tests for UI components
4. Set up CI/CD pipeline for tests

### Phase 2: Core Features (Week 3-4)
1. Write tests for task management components
2. Write integration tests for task CRUD operations
3. Write tests for authentication flow
4. Write E2E tests for critical user journeys

### Phase 3: Advanced Features (Week 5-6)
1. Write tests for drag and drop functionality
2. Write tests for real-time updates
3. Write tests for keyboard navigation
4. Write tests for snapshots feature

### Phase 4: Polish (Week 7-8)
1. Write accessibility tests
2. Write performance tests
3. Write security tests
4. Write cross-browser tests
5. Fix any issues found

## Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: All critical user flows covered
- **E2E Tests**: All major user journeys covered
- **Accessibility**: WCAG AA compliance

## Continuous Integration

### Pre-commit Hooks
- Run linting
- Run type checking
- Run unit tests

### Pull Request Checks
- Run full test suite
- Check test coverage
- Run E2E tests on staging

### Deployment Checks
- Run full test suite
- Run E2E tests on production build
- Performance benchmarks

## Test Data Management

### Unit Tests
- Use factories for creating test data
- Mock Supabase client
- Use MSW for API mocking

### Integration Tests
- Use test database
- Clean up after each test
- Use fixtures for consistent data

### E2E Tests
- Use separate test environment
- Seed test data before test runs
- Clean up after test suite

## Maintenance

### Regular Tasks
- Review and update tests when features change
- Remove obsolete tests
- Update test data as needed
- Monitor test execution time
- Review test coverage reports

### Test Documentation
- Keep test plan updated
- Document test utilities
- Document test data setup
- Document known issues/limitations

## Notes

- Start with high-priority tests
- Focus on user-facing functionality first
- Use test-driven development for new features
- Maintain test code quality (tests are code too)
- Keep tests fast and reliable
- Use descriptive test names
- Group related tests logically
