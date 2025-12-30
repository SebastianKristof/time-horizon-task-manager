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
├── setup.ts              # Test setup and mocks
├── lib/                  # Unit tests for utility functions
│   └── utils.test.ts
└── components/          # Component tests
    └── capture-form.test.tsx
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

The Supabase client is automatically mocked in `setup.ts`. You can customize mocks in individual tests:

```tsx
import { vi } from 'vitest'
import { createClient } from '@/lib/supabase/client'

const mockClient = createClient() as any
mockClient.from('tasks').select.mockResolvedValue({
  data: [{ id: '1', title: 'Test' }],
  error: null
})
```

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

## Next Steps

See `TEST_PLAN.md` in the root directory for a comprehensive list of tests to implement.
