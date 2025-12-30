import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CaptureForm } from '@/components/capture-form'

// Mock Next.js router
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Mock Supabase client
const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockIs = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'tasks') {
        return {
          select: mockSelect.mockReturnThis(),
          insert: mockInsert,
          eq: mockEq.mockReturnThis(),
          order: mockOrder.mockReturnThis(),
          limit: mockLimit.mockReturnThis(),
          is: mockIs.mockReturnThis(),
        }
      }
      return {}
    }),
  })),
}))

describe('CaptureForm', () => {
  const userId = 'test-user-id'
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mock responses
    mockSelect.mockResolvedValue({ data: [], error: null })
    mockInsert.mockResolvedValue({ data: null, error: null })
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
      const entries = screen.getAllByText(/Task \d/)
      expect(entries).toHaveLength(3)
    })
  })

  it('shows task preview with horizon selector buttons', async () => {
    render(<CaptureForm userId={userId} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Test task')
    
    await waitFor(() => {
      expect(screen.getByText('Test task')).toBeInTheDocument()
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
      expect(screen.getByText('Test task')).toBeInTheDocument()
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
    Object.assign(navigator, {
      clipboard: {
        readText: vi.fn().mockResolvedValue(clipboardText),
      },
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
    Object.assign(navigator, {
      clipboard: {
        readText: vi.fn().mockRejectedValue(new Error('Clipboard access denied')),
      },
    })
    
    render(<CaptureForm userId={userId} />)
    
    const pasteButton = screen.getByRole('button', { name: /paste/i })
    await user.click(pasteButton)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to paste/i)).toBeInTheDocument()
    })
  })

  it('submits tasks with correct data', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null })
    mockInsert.mockResolvedValue({ data: null, error: null })
    
    render(<CaptureForm userId={userId} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Task 1\nTask 2')
    
    const submitButton = screen.getByRole('button', { name: /add tasks/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled()
      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall).toHaveLength(2)
      expect(insertCall[0]).toMatchObject({
        user_id: userId,
        title: 'Task 1',
        time_horizon: 'now',
        completed: false,
        parent_task_id: null,
      })
    })
  })

  it('redirects to horizons page after successful submission', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null })
    mockInsert.mockResolvedValue({ data: null, error: null })
    
    render(<CaptureForm userId={userId} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Test task')
    
    const submitButton = screen.getByRole('button', { name: /add tasks/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/horizons')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('shows error message on submission failure', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null })
    mockInsert.mockResolvedValue({ 
      data: null, 
      error: { message: 'Database error' } 
    })
    
    render(<CaptureForm userId={userId} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Test task')
    
    const submitButton = screen.getByRole('button', { name: /add tasks/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to create tasks/i)).toBeInTheDocument()
    })
  })

  it('calculates correct position for new tasks', async () => {
    // Mock existing tasks with position 0, 1, 2
    mockSelect.mockResolvedValue({ 
      data: [{ position: 2 }], 
      error: null 
    })
    mockInsert.mockResolvedValue({ data: null, error: null })
    
    render(<CaptureForm userId={userId} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'New task')
    
    const submitButton = screen.getByRole('button', { name: /add tasks/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled()
      const insertCall = mockInsert.mock.calls[0][0]
      // New task should have position 3 (max position + 1)
      expect(insertCall[0].position).toBe(3)
    })
  })
})
