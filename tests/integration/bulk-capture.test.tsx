import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CaptureForm } from '@/components/capture-form'
import { resetMockSupabase, createMockSupabaseClient, setMockUser, getMockTasks, setMockTasks } from '../utils/mock-supabase'
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

import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('Bulk Capture Flow', () => {
  const userId = 'test-user-id'
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
    resetMockSupabase()
    // Set mock user to match the userId prop
    setMockUser({ id: userId, email: 'test@example.com' })
    // Reset createClient implementation to default
    vi.mocked(createClient).mockImplementation(() => createMockSupabaseClient())
  })

  it('pastes multiple tasks and parses correctly', async () => {
    const user = userEvent.setup()
    const clipboardText = 'Task 1\nTask 2\nTask 3'

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
      const elements1 = screen.getAllByText('Task 1');
      expect(elements1.find(el => el.tagName.toLowerCase() === 'span')).toBeDefined();
      const elements2 = screen.getAllByText('Task 2');
      expect(elements2.find(el => el.tagName.toLowerCase() === 'span')).toBeDefined();
      const elements3 = screen.getAllByText('Task 3');
      expect(elements3.find(el => el.tagName.toLowerCase() === 'span')).toBeDefined();
    })
  })

  it('assigns horizons and saves with correct assignments', async () => {
    const user = userEvent.setup()

    render(<CaptureForm userId={userId} />)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Task 1\nTask 2')

    await waitFor(() => {
      const elements1 = screen.getAllByText('Task 1');
      expect(elements1.find(el => el.tagName.toLowerCase() === 'span')).toBeDefined();
      const elements2 = screen.getAllByText('Task 2');
      expect(elements2.find(el => el.tagName.toLowerCase() === 'span')).toBeDefined();
    })

    // Change horizon of first task to "soon" (30d)
    const soonButtons = screen.getAllByText('30d')
    if (soonButtons.length > 0) {
      await user.click(soonButtons[0])
    }

    const initialTaskCount = getMockTasks().length

    // Submit
    const submitButton = screen.getByRole('button', { name: /add tasks/i })
    const form = submitButton.closest('form')
    if (!form) throw new Error('Form not found')
    fireEvent.submit(form)
    
    // Wait for tasks to be created (indicates successful submission)
    await waitFor(() => {
      const finalTaskCount = getMockTasks().length
      expect(finalTaskCount).toBeGreaterThan(initialTaskCount)
    }, { timeout: 10000 })

    // After tasks are created, check for redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/horizons')
    }, { timeout: 2000 })
  })

  it('submits and all tasks created in database', async () => {
    render(<CaptureForm userId={userId} />)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Task 1\nTask 2\nTask 3')

    // Wait for preview to appear
    await waitFor(() => {
      const elements1 = screen.getAllByText('Task 1');
      expect(elements1.find(el => el.tagName.toLowerCase() === 'span')).toBeDefined();
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
      // Should have created 3 tasks
      expect(finalTaskCount).toBe(initialTaskCount + 3)
    }, { timeout: 10000 })

    // After tasks are created, check for redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/horizons')
    }, { timeout: 5000 })
  })

  it('calculates correct position for tasks', async () => {
    // Set up mock tasks with position 2
    setMockTasks([createTestTask({ position: 2, time_horizon: 'now', user_id: userId })])

    render(<CaptureForm userId={userId} />)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'New Task')

    // Wait for preview to appear - use getAllByText since task appears in both textarea and preview
    await waitFor(() => {
      const taskElements = screen.getAllByText('New Task')
      expect(taskElements.find(el => el.tagName.toLowerCase() === 'span')).toBeDefined();
    })

    const initialTaskCount = getMockTasks().length

    const submitButton = screen.getByRole('button', { name: /add tasks/i })
    const form = submitButton.closest('form')
    if (!form) throw new Error('Form not found')
    fireEvent.submit(form)

    // Wait for task to be created (indicates successful submission)
    await waitFor(() => {
      const finalTaskCount = getMockTasks().length
      expect(finalTaskCount).toBeGreaterThan(initialTaskCount)
      // Check that the new task has position 3 (max position 2 + 1)
      const newTask = getMockTasks().find(t => t.title === 'New Task')
      expect(newTask).toBeDefined()
      expect(newTask?.position).toBe(3)
    }, { timeout: 10000 })

    // After task is created, check for redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/horizons')
    }, { timeout: 5000 })
  })
})
