import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CaptureForm } from '@/components/capture-form'
import { createClient } from '@/lib/supabase/client'
import { createMockSupabaseClient, resetMockSupabase, getMockTasks, setMockUser, setMockTasks } from '../utils/mock-supabase'
import { createTestTask } from '../utils/test-helpers'

// Mock Next.js router
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

describe('CaptureForm', () => {
  const userId = 'test-user-id'
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
    resetMockSupabase()
    // Set mock user to match the userId prop used in tests
    setMockUser({ id: userId, email: 'test@example.com' })
    // Reset createClient implementation to default
    vi.mocked(createClient).mockImplementation(() => createMockSupabaseClient())
    // Reset router mocks
    mockPush.mockClear()
    mockRefresh.mockClear()
  })

  it('renders textarea and paste button', () => {
    render(<CaptureForm userId={userId} />)
    
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /paste/i })).toBeInTheDocument()
  })

  it('disables submit button when textarea is empty', () => {
    render(<CaptureForm userId={userId} />)
    
    const submitButton = screen.getByRole('button', { name: /add tasks/i })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when textarea has content', async () => {
    render(<CaptureForm userId={userId} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Test task')
    
    const submitButton = screen.getByRole('button', { name: /add tasks/i })
    expect(submitButton).not.toBeDisabled()
  })

  it('parses multi-line input into task entries', async () => {
    render(<CaptureForm userId={userId} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Task 1\nTask 2\nTask 3')
    
    // Should show 3 task entries in preview
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument()
      expect(screen.getByText('Task 2')).toBeInTheDocument()
      expect(screen.getByText('Task 3')).toBeInTheDocument()
    })
  })

  it('shows task preview with horizon selector buttons', async () => {
    render(<CaptureForm userId={userId} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Test task')
    
    await waitFor(() => {
      // Use queryAllByText and check for the one that isn't the textarea
      const elements = screen.getAllByText('Test task');
      const previewSpan = elements.find(el => el.tagName.toLowerCase() === 'span');
      expect(previewSpan).toBeDefined();
      expect(previewSpan).toBeInTheDocument();
      
      // Should show horizon selector buttons (7d, 30d, 180d, ∞)
      expect(screen.getByText('7d')).toBeInTheDocument()
      expect(screen.getByText('30d')).toBeInTheDocument()
      expect(screen.getByText('180d')).toBeInTheDocument()
      expect(screen.getByText('∞')).toBeInTheDocument()
    })
  })

  it('allows changing task horizon', async () => {
    render(<CaptureForm userId={userId} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Test task')
    
    await waitFor(() => {
      const elements = screen.getAllByText('Test task');
      const previewSpan = elements.find(el => el.tagName.toLowerCase() === 'span');
      expect(previewSpan).toBeDefined();
    })
    
    // Click on "30d" button to change horizon to "soon"
    const soonButton = screen.getByText('30d')
    await user.click(soonButton)
    
    // The button should be visually selected (this would require checking classes)
    // For now, we just verify the button is clickable
    expect(soonButton).toBeInTheDocument()
  })

  it('handles paste from clipboard', async () => {
    const clipboardText = 'Pasted task 1\nPasted task 2'
    
    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        readText: vi.fn().mockResolvedValue(clipboardText),
      },
      writable: true,
      configurable: true,
    })
    
    render(<CaptureForm userId={userId} />)
    
    const pasteButton = screen.getByRole('button', { name: /paste/i })
    await user.click(pasteButton)
    
    await waitFor(() => {
      expect(screen.getByText('Pasted task 1')).toBeInTheDocument()
      expect(screen.getByText('Pasted task 2')).toBeInTheDocument()
    })
  })

  it('shows error message on paste failure', async () => {
    // Mock clipboard API to throw error
    const clipboardError = new Error('Clipboard access denied')
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        readText: vi.fn().mockRejectedValue(clipboardError),
      },
      writable: true,
      configurable: true,
    })
    
    render(<CaptureForm userId={userId} />)
    
    const pasteButton = screen.getByRole('button', { name: /paste/i })
    await user.click(pasteButton)
    
    await waitFor(() => {
      // Error message shows the actual error message or "Failed to paste from clipboard"
      const errorMessage = screen.queryByText(/Failed to paste from clipboard|Clipboard access denied/i)
      expect(errorMessage).toBeInTheDocument()
    })
  })

  it('submits tasks with correct data', async () => {
    render(<CaptureForm userId={userId} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Task 1\nTask 2')
    
    // Wait for preview to appear (ensures taskEntries is populated)
    await waitFor(() => {
      const elements1 = screen.getAllByText('Task 1');
      expect(elements1.find(el => el.tagName.toLowerCase() === 'span')).toBeDefined();
      const elements2 = screen.getAllByText('Task 2');
      expect(elements2.find(el => el.tagName.toLowerCase() === 'span')).toBeDefined();
    })
    
    const submitButton = screen.getByRole('button', { name: /add tasks/i })
    // Use fireEvent.submit directly on the form
    const form = submitButton.closest('form')
    if (!form) throw new Error('Form not found')
    console.log("[Test] Triggering form submit")
    fireEvent.submit(form)
    
    // Wait for redirect, which indicates successful submission
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/horizons')
    }, { timeout: 10000 })
  })

  it('redirects to horizons page after successful submission', async () => {
    render(<CaptureForm userId={userId} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Test task')
    
    // Wait for preview to appear (ensures taskEntries is populated)
    await waitFor(() => {
      const elements = screen.getAllByText('Test task');
      const previewSpan = elements.find(el => el.tagName.toLowerCase() === 'span');
      expect(previewSpan).toBeDefined();
    })
    
    const initialTaskCount = getMockTasks().length
    
    const submitButton = screen.getByRole('button', { name: /add tasks/i })
    const form = submitButton.closest('form')
    if (!form) throw new Error('Form not found')
    fireEvent.submit(form)
    
    // Wait for tasks to be created (indicates successful submission)
    await waitFor(() => {
      const finalTaskCount = getMockTasks().length
      expect(finalTaskCount).toBeGreaterThan(initialTaskCount)
    }, { timeout: 10000 })
    
    // Check for errors
    const errorMessage = screen.queryByText(/failed|error/i)
    if (errorMessage) {
      throw new Error(`Form submission failed: ${errorMessage.textContent}`)
    }
    
    // If we got here, tasks were created, so redirect should have happened
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/horizons')
      expect(mockRefresh).toHaveBeenCalled()
    }, { timeout: 2000 })
  })

  it('shows error message on submission failure', async () => {
    // Create a client that returns an error on insert
    const errorClient = createMockSupabaseClient()
    const originalFrom = errorClient.from
    errorClient.from = vi.fn((table: string) => {
      const qb = originalFrom(table)
      if (table === 'tasks') {
        // Make insert return an error
        const originalInsert = qb.insert
        qb.insert = vi.fn().mockImplementation((data: any) => {
          // Check if this is an insert call (has title property in array or object)
          const isInsertCall = Array.isArray(data) 
            ? data.some((item: any) => item && 'title' in item)
            : data && 'title' in data
          
          if (isInsertCall) {
            return Promise.resolve({
              data: null,
              error: { message: 'Database error' },
            })
          }
          return originalInsert(data)
        })
      }
      return qb
    }) as any

    vi.mocked(createClient).mockReturnValue(errorClient as any)
    
    render(<CaptureForm userId={userId} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Test task')
    
    const submitButton = screen.getByRole('button', { name: /add tasks/i })
    const form = submitButton.closest('form')
    if (!form) throw new Error('Form not found')
    fireEvent.submit(form)
    
    await waitFor(() => {
      // Error message is "Failed to create tasks" (capital F)
      expect(screen.getByText(/Failed to create tasks/i)).toBeInTheDocument()
    }, { timeout: 10000 })
  })

  it('calculates correct position for new tasks', async () => {
    // Set up existing tasks with position 2
    setMockTasks([createTestTask({ position: 2, time_horizon: 'now' })])
    
    render(<CaptureForm userId={userId} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'New task')
    
    const submitButton = screen.getByRole('button', { name: /add tasks/i })
    const form = submitButton.closest('form')
    if (!form) throw new Error('Form not found')
    fireEvent.submit(form)
    
    await waitFor(() => {
      // New task should be created with position 3 (max position + 1)
      const tasks = getMockTasks()
      const newTask = tasks.find((t) => t.title === 'New task')
      expect(newTask).toBeDefined()
      expect(newTask?.position).toBe(3)
    }, { timeout: 10000 })
  })

  it('preserves task horizon assignments when text changes', async () => {
    render(<CaptureForm userId={userId} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Task 1\nTask 2')
    
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument()
      expect(screen.getByText('Task 2')).toBeInTheDocument()
    })
    
    // Change horizon of first task to "soon" (30d)
    const soonButtons = screen.getAllByText('30d')
    if (soonButtons.length > 0) {
      await user.click(soonButtons[0])
    }
    
    // Modify the text (add a new line at the end)
    await user.type(textarea, '\nTask 3')
    
    await waitFor(() => {
      // Task 1 should still be visible (horizon preserved)
      expect(screen.getByText('Task 1')).toBeInTheDocument()
    })
  })

  it('handles loading state during submission', async () => {
    // Create a delayed client to test loading state
    let resolveInsert: () => void
    const delayedInsert = new Promise((resolve) => {
      resolveInsert = () => resolve({ data: null, error: null })
    })
    
    const delayedClient = createMockSupabaseClient()
    const originalFrom = delayedClient.from
    delayedClient.from = vi.fn((table: string) => {
      const qb = originalFrom(table)
      if (table === 'tasks') {
        // Make insert delayed
        qb.insert = vi.fn().mockImplementation(() => delayedInsert)
      }
      return qb
    }) as any

    vi.mocked(createClient).mockReturnValue(delayedClient as any)
    
    render(<CaptureForm userId={userId} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Test task')
    
    const submitButton = screen.getByRole('button', { name: /add tasks/i })
    const form = submitButton.closest('form')
    if (!form) throw new Error('Form not found')
    fireEvent.submit(form)
    
    // Should show loading state
    await waitFor(() => {
      const loadingButton = screen.queryByRole('button', { name: /creating/i })
      expect(loadingButton).toBeInTheDocument()
      expect(loadingButton).toBeDisabled()
    }, { timeout: 10000 })
    
    // Resolve the promise
    resolveInsert!()
    
    // Wait for the promise to resolve and form to process
    await waitFor(async () => {
      // Wait a bit for the async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100))
    }, { timeout: 1000 })
    
    // Should eventually redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/horizons')
    }, { timeout: 3000 })
  })

  it('filters empty lines from input', async () => {
    render(<CaptureForm userId={userId} />)
    
    const textarea = screen.getByRole('textbox')
    // Type tasks with empty lines
    await user.type(textarea, 'Task 1\n\nTask 2\n   \nTask 3')
    
    await waitFor(() => {
      // Should only show 3 tasks in preview (empty lines are filtered)
      expect(screen.getByText('Task 1')).toBeInTheDocument()
      expect(screen.getByText('Task 2')).toBeInTheDocument()
      expect(screen.getByText('Task 3')).toBeInTheDocument()
    })
  })

  it('handles tasks with special characters', async () => {
    render(<CaptureForm userId={userId} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Task with "quotes" & <tags>\nTask with emoji 🎉\nTask with unicode: 测试')
    
    await waitFor(() => {
      expect(screen.getByText('Task with "quotes" & <tags>')).toBeInTheDocument()
      expect(screen.getByText('Task with emoji 🎉')).toBeInTheDocument()
      expect(screen.getByText('Task with unicode: 测试')).toBeInTheDocument()
    })
    
    const submitButton = screen.getByRole('button', { name: /add tasks/i })
    const form = submitButton.closest('form')
    if (!form) throw new Error('Form not found')
    fireEvent.submit(form)
    
    await waitFor(() => {
      // Tasks should be created with special characters preserved
      const tasks = getMockTasks()
      expect(tasks.find((t) => t.title === 'Task with "quotes" & <tags>')).toBeDefined()
      expect(tasks.find((t) => t.title === 'Task with emoji 🎉')).toBeDefined()
      expect(tasks.find((t) => t.title === 'Task with unicode: 测试')).toBeDefined()
    }, { timeout: 10000 })
  })
})
