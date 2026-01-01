# Testing Guide

This directory contains tests for the Time Horizon Task Manager application.

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage
```

## Test Structure

```
tests/
├── setup.ts                    # Test setup and mocks (Vitest only)
├── TEST_IMPLEMENTATION_NOTES.md # Implementation notes and discrepancies
├── utils/                      # Test utilities and helpers
│   ├── test-helpers.tsx        # Task factories, viewport helpers, render wrappers
│   ├── mock-supabase.ts        # Supabase client mocks (primary mocking strategy)
│   ├── browser-api-mocks.ts    # Browser API mocks (matchMedia, ResizeObserver, etc.)
│   ├── accessibility-helpers.ts # Jest-axe helpers
│   └── msw-handlers.ts         # MSW handlers (optional, for fetch-based APIs)
├── lib/                        # Unit tests for utility functions
│   └── utils.test.ts
├── components/                 # Component tests
│   ├── capture-form.test.tsx
│   ├── task-card.test.tsx
│   ├── horizons-view.test.tsx
│   ├── completed-view.test.tsx
│   ├── share-snapshot-button.test.tsx
│   └── ui/                     # UI component tests
│       ├── button.test.tsx
│       ├── input.test.tsx
│       ├── textarea.test.tsx
│       ├── checkbox.test.tsx
│       └── label.test.tsx
├── integration/                # Integration tests
│   ├── task-management.test.tsx
│   ├── bulk-capture.test.tsx
│   ├── realtime-updates.test.tsx
│   ├── auth.test.tsx
│   └── snapshot.test.tsx
├── e2e/                        # End-to-end tests (Playwright)
│   ├── setup.ts
│   └── journeys/
│       ├── new-user-onboarding.spec.ts
│       ├── task-management.spec.ts
│       ├── bulk-capture.spec.ts
│       ├── keyboard-navigation.spec.ts
│       ├── mobile-touch.spec.ts
│       └── viewport-responsive.spec.ts
├── api/                        # API/Database tests
│   ├── supabase-client.test.ts
│   ├── database-operations.test.ts
│   └── performance.test.ts
├── accessibility/              # Accessibility tests
│   ├── keyboard-navigation.test.tsx
│   ├── screen-reader.test.tsx
│   └── visual.test.tsx
├── performance/                # Performance tests
│   ├── component-performance.test.tsx
│   ├── bundle-size.test.ts
│   └── network.test.ts
├── security/                   # Security tests
│   ├── auth.test.ts
│   ├── authorization.test.ts
│   └── input-validation.test.ts
├── error-handling/             # Error handling tests
│   ├── network-errors.test.tsx
│   ├── validation-errors.test.tsx
│   └── database-errors.test.tsx
└── edge-cases/                 # Edge case tests
    ├── task-management.test.tsx
    ├── data-consistency.test.tsx
    └── user-experience.test.tsx
```

## Writing Tests

### Component Tests

Use React Testing Library to test components from the user's perspective:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '@/components/my-component'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(screen.getByText('Clicked')).toBeInTheDocument()
  })
})
```

### Mocking Supabase

**Primary Strategy: Supabase Client Mocking**

The Supabase client is automatically mocked in `setup.ts` using `tests/utils/mock-supabase.ts`. This is the PRIMARY mocking strategy since the application uses Supabase client directly, not fetch-based REST APIs.

You can customize mocks in individual tests:

```tsx
import { vi } from 'vitest'
import { createMockSupabaseClient, setMockTasks, getMockTasks } from '../utils/mock-supabase'
import { createTestTask } from '../utils/test-helpers'

// Set up mock data
const task = createTestTask({ title: 'Test Task' })
setMockTasks([task])

// Use the mocked client
const mockClient = createMockSupabaseClient()
const tasks = getMockTasks()
```

**Note:** Do NOT use MSW for Supabase operations. Use Supabase client mocks instead.

### Testing Async Operations

Always use `waitFor` for async operations:

```tsx
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

## Best Practices

1. **Test user behavior, not implementation details**
   - ✅ Test what the user sees and does
   - ❌ Don't test internal state or methods

2. **Use semantic queries**
   - ✅ `getByRole('button', { name: /submit/i })`
   - ❌ `getByTestId('submit-button')`

3. **Keep tests isolated**
   - Each test should be independent
   - Use `beforeEach` to set up common state

4. **Test edge cases**
   - Empty states
   - Error states
   - Loading states
   - Invalid input

5. **Use descriptive test names**
   - ✅ `'shows error message when submission fails'`
   - ❌ `'test submit'`

## Coverage Goals

- Aim for 80%+ code coverage
- Focus on critical user paths
- Don't obsess over 100% coverage

## Running Specific Tests

```bash
# Run tests matching a pattern
pnpm test capture-form

# Run tests in a specific file
pnpm test tests/lib/utils.test.ts
```

## Debugging Tests

### Using Vitest UI

```bash
pnpm test:ui
```

This opens a browser interface where you can:
- See test results in real-time
- Filter and search tests
- See coverage reports
- Debug failing tests

### Using VS Code Debugger

Add this to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Common Issues

### "Cannot find module '@/...'"

Make sure `vitest.config.ts` has the correct path alias configuration.

### "window is not defined"

Make sure `vitest.config.ts` has `environment: 'jsdom'`.

### Tests timing out

- Check for unhandled promises
- Use `waitFor` for async operations
- Increase timeout if needed: `it('...', async () => { ... }, { timeout: 5000 })`

## Viewport Testing

Tests must verify behavior across three viewport modalities:

1. **Desktop Wide View** (> 768px) - Keyboard shortcuts, hover effects, mouse interactions
2. **Desktop Narrow View** (≤ 768px) - Touch interactions, compact layouts, long press
3. **Mobile View** (actual mobile device) - Same as Desktop Narrow but with actual touch events

Use viewport helpers from `tests/utils/test-helpers.tsx`:
- `renderWithViewport(component, viewport)`
- `setViewport(width, height)`
- `VIEWPORT_PRESETS.DESKTOP_WIDE`, `DESKTOP_NARROW`, `MOBILE`

## Test Implementation Notes

See `TEST_IMPLEMENTATION_NOTES.md` for:
- Discrepancies between TEST_PLAN.md and production code
- Implementation decisions and rationale
- Areas needing code review

## Test Structure

```
tests/
├── setup.ts                          # Test setup and mocks
├── TEST_IMPLEMENTATION_NOTES.md      # Implementation notes and discrepancies
├── README.md                         # This file
├── utils/                            # Test utilities
│   ├── test-helpers.tsx              # Task factories, viewport helpers
│   ├── mock-supabase.ts              # Supabase client mocks
│   ├── browser-api-mocks.ts          # Browser API mocks
│   ├── accessibility-helpers.ts      # Accessibility testing helpers
│   └── msw-handlers.ts               # MSW handlers (optional)
├── components/                       # Component tests
│   ├── capture-form.test.tsx
│   ├── task-card.test.tsx
│   ├── horizons-view.test.tsx
│   ├── completed-view.test.tsx
│   ├── share-snapshot-button.test.tsx
│   └── ui/                           # UI component tests
│       ├── button.test.tsx
│       ├── input.test.tsx
│       ├── textarea.test.tsx
│       ├── checkbox.test.tsx
│       └── label.test.tsx
├── integration/                      # Integration tests
│   ├── task-management.test.tsx
│   ├── bulk-capture.test.tsx
│   ├── realtime-updates.test.tsx
│   ├── auth.test.tsx
│   └── snapshot.test.tsx
├── e2e/                              # End-to-end tests
│   ├── setup.ts
│   └── journeys/
│       ├── new-user-onboarding.spec.ts
│       ├── task-management.spec.ts
│       ├── bulk-capture.spec.ts
│       ├── keyboard-navigation.spec.ts
│       ├── mobile-touch.spec.ts
│       └── viewport-responsive.spec.ts
├── api/                              # API/Database tests
│   ├── supabase-client.test.ts
│   ├── database-operations.test.ts
│   └── performance.test.ts
├── accessibility/                    # Accessibility tests
│   ├── keyboard-navigation.test.tsx
│   ├── screen-reader.test.tsx
│   └── visual.test.tsx
├── performance/                      # Performance tests
│   ├── component-performance.test.tsx
│   ├── bundle-size.test.ts
│   └── network.test.ts
├── security/                         # Security tests
│   ├── auth.test.ts
│   ├── authorization.test.ts
│   └── input-validation.test.ts
├── error-handling/                   # Error handling tests
│   ├── network-errors.test.tsx
│   ├── validation-errors.test.tsx
│   └── database-errors.test.tsx
└── edge-cases/                       # Edge case tests
    ├── task-management.test.tsx
    ├── data-consistency.test.tsx
    └── user-experience.test.tsx
```

## Test Structure

```
tests/
├── setup.ts                    # Test setup and mocks
├── TEST_IMPLEMENTATION_NOTES.md # Implementation notes and discrepancies
├── README.md                   # This file
├── utils/                       # Test utilities
│   ├── test-helpers.tsx        # Task factories, viewport helpers
│   ├── mock-supabase.ts        # Supabase client mocks (primary)
│   ├── browser-api-mocks.ts    # Browser API mocks
│   ├── accessibility-helpers.ts # Accessibility testing helpers
│   └── msw-handlers.ts         # MSW handlers (optional)
├── components/                 # Component tests
│   ├── capture-form.test.tsx
│   ├── task-card.test.tsx
│   ├── horizons-view.test.tsx
│   ├── completed-view.test.tsx
│   ├── share-snapshot-button.test.tsx
│   └── ui/                     # UI component tests
│       ├── button.test.tsx
│       ├── input.test.tsx
│       ├── textarea.test.tsx
│       ├── checkbox.test.tsx
│       └── label.test.tsx
├── integration/                 # Integration tests
│   ├── task-management.test.tsx
│   ├── bulk-capture.test.tsx
│   ├── realtime-updates.test.tsx
│   ├── auth.test.tsx
│   └── snapshot.test.tsx
├── e2e/                         # End-to-end tests
│   ├── setup.ts
│   └── journeys/
│       ├── new-user-onboarding.spec.ts
│       ├── task-management.spec.ts
│       ├── bulk-capture.spec.ts
│       ├── keyboard-navigation.spec.ts
│       ├── mobile-touch.spec.ts
│       └── viewport-responsive.spec.ts
├── api/                         # API/Database tests
│   ├── supabase-client.test.ts
│   ├── database-operations.test.ts
│   └── performance.test.ts
├── accessibility/               # Accessibility tests
│   ├── keyboard-navigation.test.tsx
│   ├── screen-reader.test.tsx
│   └── visual.test.tsx
├── performance/                 # Performance tests
│   ├── component-performance.test.tsx
│   ├── bundle-size.test.ts
│   └── network.test.ts
├── security/                    # Security tests
│   ├── auth.test.ts
│   ├── authorization.test.ts
│   └── input-validation.test.ts
├── error-handling/              # Error handling tests
│   ├── network-errors.test.tsx
│   ├── validation-errors.test.tsx
│   └── database-errors.test.tsx
└── edge-cases/                  # Edge case tests
    ├── task-management.test.tsx
    ├── data-consistency.test.tsx
    └── user-experience.test.tsx
```

## Viewport Testing

Tests must verify behavior across three viewport modalities:

1. **Desktop Wide View** (> 768px) - Keyboard shortcuts, hover effects, mouse interactions
2. **Desktop Narrow View** (≤ 768px) - Touch interactions, compact layouts, long press
3. **Mobile View** (actual mobile device) - Same as Desktop Narrow but with actual touch events

Use viewport helpers from `tests/utils/test-helpers.tsx`:
- `renderWithViewport(component, viewport)`
- `setViewport(width, height)`
- `VIEWPORT_PRESETS.DESKTOP_WIDE`, `DESKTOP_NARROW`, `MOBILE`

## Test Implementation Notes

See `TEST_IMPLEMENTATION_NOTES.md` for:
- Discrepancies between TEST_PLAN.md and production code
- Implementation decisions and rationale
- Areas needing code review

## Mocking Strategy

**Primary Strategy: Supabase Client Mocking**

The application primarily uses the Supabase client for data operations, not fetch-based REST APIs. Therefore:

1. **Use Supabase client mocks** (`tests/utils/mock-supabase.ts`) as the primary mocking strategy
2. **Mock Supabase channels** for real-time subscription testing
3. **MSW is optional** and only needed if there are actual `fetch()` calls to external APIs
4. **Do not use MSW for Supabase operations** - mock the Supabase client directly

## Next Steps

See `TEST_PLAN.md` in the root directory for a comprehensive list of tests to implement.
