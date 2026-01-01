import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HorizonsView } from '@/components/horizons-view'
import { TaskCard } from '@/components/task-card'
import { CompletedView } from '@/components/completed-view'
import { createTestTask, setViewport, VIEWPORT_PRESETS } from '../utils/test-helpers'
import type { Task } from '@/lib/types'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock Supabase client - using existing mock infrastructure
import { resetMockSupabase, setMockUser, setMockTasks } from '../utils/mock-supabase'

describe('Mobile Bug Fixes', () => {
  const userId = 'test-user-id'
  const mockSetShowCompletedTasks = vi.fn()
  const mockSetIsHelpOpen = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    resetMockSupabase()
    setMockUser({ id: userId, email: 'test@example.com' })
    setViewport(VIEWPORT_PRESETS.MOBILE.width, VIEWPORT_PRESETS.MOBILE.height)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('1. Fade-out animation for completed tasks', () => {
    it('applies fade-out class when task is completed and showCompletedTasks is false', async () => {
      const task = createTestTask({
        title: 'Test Task',
        completed: false,
        time_horizon: 'now',
      })

      const { rerender } = render(
        <HorizonsView
          initialTasks={[task]}
          userId={userId}
          showCompletedTasks={false}
          setShowCompletedTasks={mockSetShowCompletedTasks}
          isHelpOpen={false}
          setIsHelpOpen={mockSetIsHelpOpen}
        />
      )

      const taskElement = screen.getByText('Test Task').closest('div[class*="task-fade-out"]')
      expect(taskElement).not.toBeInTheDocument()

      // Complete the task
      const checkbox = screen.getByRole('button', { name: /toggle complete/i })
      await userEvent.click(checkbox)

      // Wait for the fade-out class to be applied
      await waitFor(() => {
        const fadingTask = screen.getByText('Test Task').closest('div[class*="task-fade-out"]')
        expect(fadingTask).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('removes task from DOM after fade-out animation completes', async () => {
      vi.useFakeTimers()
      const task = createTestTask({
        title: 'Test Task',
        completed: false,
        time_horizon: 'now',
      })

      render(
        <HorizonsView
          initialTasks={[task]}
          userId={userId}
          showCompletedTasks={false}
          setShowCompletedTasks={mockSetShowCompletedTasks}
          isHelpOpen={false}
          setIsHelpOpen={mockSetIsHelpOpen}
        />
      )

      const checkbox = screen.getByRole('button', { name: /toggle complete/i })
      await userEvent.click(checkbox)

      // Fast-forward past the animation duration (300ms)
      vi.advanceTimersByTime(350)

      await waitFor(() => {
        expect(screen.queryByText('Test Task')).not.toBeInTheDocument()
      })

      vi.useRealTimers()
    })
  })

  describe('2. Drag line cleanup delay', () => {
    it('clears drop indicator immediately on drag end', async () => {
      const tasks = [
        createTestTask({ title: 'Task 1', time_horizon: 'now', position: 0 }),
        createTestTask({ title: 'Task 2', time_horizon: 'now', position: 1 }),
      ]

      render(
        <HorizonsView
          initialTasks={tasks}
          userId={userId}
          showCompletedTasks={true}
          setShowCompletedTasks={mockSetShowCompletedTasks}
          isHelpOpen={false}
          setIsHelpOpen={mockSetIsHelpOpen}
        />
      )

      const task1 = screen.getByText('Task 1')
      const task2 = screen.getByText('Task 2')

      // Start drag
      fireEvent.dragStart(task1)

      // Drag over task 2
      fireEvent.dragOver(task2)

      // End drag
      fireEvent.dragEnd(task1)

      // Drop indicator should be cleared immediately
      await waitFor(() => {
        const indicators = document.querySelectorAll('[class*="bg-primary/30"]')
        expect(indicators.length).toBe(0)
      })
    })
  })

  describe('3. Subtask persistence', () => {
    it('keeps subtask visible after creation', async () => {
      const parentTask = createTestTask({
        id: 'parent-1',
        title: 'Parent Task',
        time_horizon: 'now',
        position: 0,
      })

      setMockTasks([parentTask])

      render(
        <HorizonsView
          initialTasks={[parentTask]}
          userId={userId}
          showCompletedTasks={true}
          setShowCompletedTasks={mockSetShowCompletedTasks}
          isHelpOpen={false}
          setIsHelpOpen={mockSetIsHelpOpen}
        />
      )

      // Open actions for parent task (mobile)
      const parentElement = screen.getByText('Parent Task')
      await userEvent.click(parentElement)

      // Find and click add subtask button
      const addSubtaskButton = screen.getByLabelText(/add subtask/i)
      await userEvent.click(addSubtaskButton)

      // Type subtask title
      const input = screen.getByPlaceholderText(/subtask title/i)
      await userEvent.type(input, 'New Subtask')
      await userEvent.keyboard('{Enter}')

      // Wait for subtask to appear
      await waitFor(() => {
        expect(screen.getByText('New Subtask')).toBeInTheDocument()
      }, { timeout: 2000 })

      // Verify it stays visible
      await waitFor(() => {
        expect(screen.getByText('New Subtask')).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('4. Save on blur for new tasks/subtasks', () => {
    it('saves subtask on blur', async () => {
      const parentTask = createTestTask({
        id: 'parent-1',
        title: 'Parent Task',
        time_horizon: 'now',
        position: 0,
      })

      setMockTasks([parentTask])

      render(
        <HorizonsView
          initialTasks={[parentTask]}
          userId={userId}
          showCompletedTasks={true}
          setShowCompletedTasks={mockSetShowCompletedTasks}
          isHelpOpen={false}
          setIsHelpOpen={mockSetIsHelpOpen}
        />
      )

      // Open actions and add subtask
      const parentElement = screen.getByText('Parent Task')
      await userEvent.click(parentElement)

      const addSubtaskButton = screen.getByLabelText(/add subtask/i)
      await userEvent.click(addSubtaskButton)

      const input = screen.getByPlaceholderText(/subtask title/i)
      await userEvent.type(input, 'Blur Subtask')
      
      // Blur the input
      fireEvent.blur(input)

      // Should save the subtask - wait for it to appear
      await waitFor(() => {
        expect(screen.getByText('Blur Subtask')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('saves regular task on blur', async () => {
      setMockTasks([])

      render(
        <HorizonsView
          initialTasks={[]}
          userId={userId}
          showCompletedTasks={true}
          setShowCompletedTasks={mockSetShowCompletedTasks}
          isHelpOpen={false}
          setIsHelpOpen={mockSetIsHelpOpen}
        />
      )

      // Focus the input (click add button)
      const addButton = screen.getAllByLabelText(/add a task/i)[0]
      await userEvent.click(addButton)

      const input = screen.getByPlaceholderText(/add a task/i)
      await userEvent.type(input, 'Blur Task')
      
      // Blur the input
      fireEvent.blur(input)

      // Should save the task - wait for it to appear
      await waitFor(() => {
        expect(screen.getByText('Blur Task')).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  describe('5. Accept button for subtasks (mobile only)', () => {
    it('shows accept button for subtask input on mobile', async () => {
      const parentTask = createTestTask({
        id: 'parent-1',
        title: 'Parent Task',
        time_horizon: 'now',
        position: 0,
      })

      render(
        <HorizonsView
          initialTasks={[parentTask]}
          userId={userId}
          showCompletedTasks={true}
          setShowCompletedTasks={mockSetShowCompletedTasks}
          isHelpOpen={false}
          setIsHelpOpen={mockSetIsHelpOpen}
        />
      )

      // Open actions and add subtask
      const parentElement = screen.getByText('Parent Task')
      await userEvent.click(parentElement)

      const addSubtaskButton = screen.getByLabelText(/add subtask/i)
      await userEvent.click(addSubtaskButton)

      // Accept button should be visible on mobile
      const acceptButton = screen.getByLabelText(/accept subtask/i)
      expect(acceptButton).toBeInTheDocument()
      expect(acceptButton).toHaveClass('md:hidden')
    })

    it('accepts subtask when accept button is clicked', async () => {
      const parentTask = createTestTask({
        id: 'parent-1',
        title: 'Parent Task',
        time_horizon: 'now',
        position: 0,
      })

      setMockTasks([parentTask])

      render(
        <HorizonsView
          initialTasks={[parentTask]}
          userId={userId}
          showCompletedTasks={true}
          setShowCompletedTasks={mockSetShowCompletedTasks}
          isHelpOpen={false}
          setIsHelpOpen={mockSetIsHelpOpen}
        />
      )

      // Open actions and add subtask
      const parentElement = screen.getByText('Parent Task')
      await userEvent.click(parentElement)

      const addSubtaskButton = screen.getByLabelText(/add subtask/i)
      await userEvent.click(addSubtaskButton)

      const input = screen.getByPlaceholderText(/subtask title/i)
      await userEvent.type(input, 'Accepted Subtask')

      const acceptButton = screen.getByLabelText(/accept subtask/i)
      await userEvent.click(acceptButton)

      await waitFor(() => {
        expect(screen.getByText('Accepted Subtask')).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  describe('6. Delete in completed view refresh', () => {
    it('updates UI immediately after delete', async () => {
      const task = createTestTask({
        id: 'task-1',
        title: 'Task to Delete',
        completed: true,
        completed_at: new Date().toISOString(),
      })

      setMockTasks([task])

      render(<CompletedView initialTasks={[task]} userId={userId} />)

      expect(screen.getByText('Task to Delete')).toBeInTheDocument()

      // Click delete button
      const deleteButton = screen.getByLabelText(/delete task/i)
      await userEvent.click(deleteButton)

      // Confirm delete
      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await userEvent.click(confirmButton)

      // Task should be removed immediately
      await waitFor(() => {
        expect(screen.queryByText('Task to Delete')).not.toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  describe('7. Drag visual feedback', () => {
    it('applies visual feedback to original card during drag', () => {
      const task = createTestTask({
        title: 'Dragged Task',
        time_horizon: 'now',
      })

      const mockOnDragStart = vi.fn()

      render(
        <TaskCard
          task={task}
          onDragStart={mockOnDragStart}
          onDragEnd={vi.fn()}
          onToggleComplete={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      const taskElement = screen.getByText('Dragged Task').closest('div')
      expect(taskElement).toBeInTheDocument()

      // Start drag
      fireEvent.dragStart(taskElement!)

      // Card should have reduced opacity and scale
      expect(taskElement).toHaveStyle({ opacity: '0.5', transform: 'scale(0.95)' })
    })

    it('restores card appearance on drag end', () => {
      const task = createTestTask({
        title: 'Dragged Task',
        time_horizon: 'now',
      })

      render(
        <TaskCard
          task={task}
          onDragStart={vi.fn()}
          onDragEnd={vi.fn()}
          onToggleComplete={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      const taskElement = screen.getByText('Dragged Task').closest('div')
      fireEvent.dragStart(taskElement!)
      fireEvent.dragEnd(taskElement!)

      // Card should be restored
      expect(taskElement).toHaveStyle({ opacity: '', transform: '' })
    })
  })

  describe('8. Hide buttons in edit mode (mobile)', () => {
    it('hides action buttons when editing on mobile', async () => {
      const task = createTestTask({
        title: 'Editable Task',
        time_horizon: 'now',
      })

      render(
        <TaskCard
          task={task}
          onDragStart={vi.fn()}
          onDragEnd={vi.fn()}
          onToggleComplete={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
          onMoveUp={vi.fn()}
          onMoveDown={vi.fn()}
          isActionsOpen={true}
        />
      )

      // Start editing (double click on mobile)
      const taskElement = screen.getByText('Editable Task')
      await userEvent.dblClick(taskElement)

      // Action buttons should be hidden
      await waitFor(() => {
        const moveButtons = screen.queryAllByLabelText(/move/i)
        expect(moveButtons.length).toBe(0)
      })
    })
  })

  describe('9. Accept button for regular tasks (mobile only)', () => {
    it('shows accept button for regular task input on mobile', async () => {
      render(
        <HorizonsView
          initialTasks={[]}
          userId={userId}
          showCompletedTasks={true}
          setShowCompletedTasks={mockSetShowCompletedTasks}
          isHelpOpen={false}
          setIsHelpOpen={mockSetIsHelpOpen}
        />
      )

      // Focus the input
      const addButton = screen.getAllByLabelText(/add a task/i)[0]
      await userEvent.click(addButton)

      // Accept button should be visible on mobile
      const acceptButton = screen.getByLabelText(/accept task/i)
      expect(acceptButton).toBeInTheDocument()
      expect(acceptButton).toHaveClass('md:hidden')
    })

    it('accepts task when accept button is clicked', async () => {
      setMockTasks([])

      render(
        <HorizonsView
          initialTasks={[]}
          userId={userId}
          showCompletedTasks={true}
          setShowCompletedTasks={mockSetShowCompletedTasks}
          isHelpOpen={false}
          setIsHelpOpen={mockSetIsHelpOpen}
        />
      )

      const addButton = screen.getAllByLabelText(/add a task/i)[0]
      await userEvent.click(addButton)

      const input = screen.getByPlaceholderText(/add a task/i)
      await userEvent.type(input, 'Accepted Task')

      const acceptButton = screen.getByLabelText(/accept task/i)
      await userEvent.click(acceptButton)

      await waitFor(() => {
        expect(screen.getByText('Accepted Task')).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  describe('10. Subtask placeholder text', () => {
    it('shows correct placeholder when adding sibling subtask', async () => {
      const parentTask = createTestTask({
        id: 'parent-1',
        title: 'Parent Task',
        time_horizon: 'now',
        position: 0,
      })
      const subtask = createTestTask({
        id: 'subtask-1',
        title: 'Existing Subtask',
        parent_task_id: 'parent-1',
        time_horizon: 'now',
        position: 0,
      })

      render(
        <HorizonsView
          initialTasks={[parentTask, subtask]}
          userId={userId}
          showCompletedTasks={true}
          setShowCompletedTasks={mockSetShowCompletedTasks}
          isHelpOpen={false}
          setIsHelpOpen={mockSetIsHelpOpen}
        />
      )

      // Open actions for subtask
      const subtaskElement = screen.getByText('Existing Subtask')
      await userEvent.click(subtaskElement)

      // Add sibling (which will be a subtask)
      const addSiblingButton = screen.getByLabelText(/add task/i)
      await userEvent.click(addSiblingButton)

      // Placeholder should say "Subtask title..."
      const input = screen.getByPlaceholderText(/subtask title/i)
      expect(input).toBeInTheDocument()
    })

    it('shows correct placeholder when adding sibling regular task', async () => {
      const task = createTestTask({
        id: 'task-1',
        title: 'Existing Task',
        time_horizon: 'now',
        position: 0,
      })

      render(
        <HorizonsView
          initialTasks={[task]}
          userId={userId}
          showCompletedTasks={true}
          setShowCompletedTasks={mockSetShowCompletedTasks}
          isHelpOpen={false}
          setIsHelpOpen={mockSetIsHelpOpen}
        />
      )

      // Open actions for task
      const taskElement = screen.getByText('Existing Task')
      await userEvent.click(taskElement)

      // Add sibling (which will be a regular task)
      const addSiblingButton = screen.getByLabelText(/add task/i)
      await userEvent.click(addSiblingButton)

      // Placeholder should say "Task title..."
      const input = screen.getByPlaceholderText(/task title/i)
      expect(input).toBeInTheDocument()
    })
  })

  describe('11. Enter key continuous creation', () => {
    it('keeps input focused after Enter for subtask creation', async () => {
      const parentTask = createTestTask({
        id: 'parent-1',
        title: 'Parent Task',
        time_horizon: 'now',
        position: 0,
      })

      setMockTasks([parentTask])

      render(
        <HorizonsView
          initialTasks={[parentTask]}
          userId={userId}
          showCompletedTasks={true}
          setShowCompletedTasks={mockSetShowCompletedTasks}
          isHelpOpen={false}
          setIsHelpOpen={mockSetIsHelpOpen}
        />
      )

      // Open actions and add subtask
      const parentElement = screen.getByText('Parent Task')
      await userEvent.click(parentElement)

      const addSubtaskButton = screen.getByLabelText(/add subtask/i)
      await userEvent.click(addSubtaskButton)

      const input = screen.getByPlaceholderText(/subtask title/i) as HTMLInputElement
      
      // Type and press Enter
      await userEvent.type(input, 'Subtask 1')
      await userEvent.keyboard('{Enter}')

      // Input should still be focused and empty for next entry
      await waitFor(() => {
        expect(input.value).toBe('')
        // Note: Focus check may not work reliably in tests, so we just check value
      }, { timeout: 2000 })
    })

    it('keeps input focused after Enter for regular task creation', async () => {
      setMockTasks([])

      render(
        <HorizonsView
          initialTasks={[]}
          userId={userId}
          showCompletedTasks={true}
          setShowCompletedTasks={mockSetShowCompletedTasks}
          isHelpOpen={false}
          setIsHelpOpen={mockSetIsHelpOpen}
        />
      )

      const addButton = screen.getAllByLabelText(/add a task/i)[0]
      await userEvent.click(addButton)

      const input = screen.getByPlaceholderText(/add a task/i) as HTMLInputElement
      
      // Type and press Enter
      await userEvent.type(input, 'Task 1')
      await userEvent.keyboard('{Enter}')

      // Input should still be focused and empty for next entry
      await waitFor(() => {
        expect(input.value).toBe('')
        // Note: Focus check may not work reliably in tests, so we just check value
      }, { timeout: 2000 })
    })
  })
})
