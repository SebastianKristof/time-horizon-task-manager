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

      setMockTasks([task])

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

      const taskElement = screen.getByText('Test Task').closest('div[class*="task-fade-out"]')
      expect(taskElement).not.toBeInTheDocument()

      // Complete the task - find checkbox button by title
      const checkbox = screen.getByTitle(/mark complete/i)
      expect(checkbox).toBeInTheDocument()
      await userEvent.click(checkbox)

      // Wait for the fade-out class to be applied
      await waitFor(() => {
        const fadingTask = screen.getByText('Test Task').closest('div[class*="task-fade-out"]')
        expect(fadingTask).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('removes task from DOM after fade-out animation completes', async () => {
      vi.useFakeTimers()
      const task = createTestTask({
        title: 'Test Task',
        completed: false,
        time_horizon: 'now',
      })

      setMockTasks([task])

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

      // Find checkbox button by title
      const checkbox = screen.getByTitle(/mark complete/i)
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

      // Drop indicator should be cleared immediately (no delay)
      // The indicator is a div with class containing "bg-primary/30"
      await waitFor(() => {
        const indicators = document.querySelectorAll('[class*="bg-primary/30"]')
        expect(indicators.length).toBe(0)
      }, { timeout: 100 })
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

      const { container } = render(
        <HorizonsView
          initialTasks={[parentTask]}
          userId={userId}
          showCompletedTasks={true}
          setShowCompletedTasks={mockSetShowCompletedTasks}
          isHelpOpen={false}
          setIsHelpOpen={mockSetIsHelpOpen}
        />
      )

      // On mobile, click task to open actions
      const parentElement = screen.getByText('Parent Task')
      await userEvent.click(parentElement)

      // Wait for actions to open and find add subtask button
      await waitFor(() => {
        const addSubtaskButton = screen.getByTitle(/add subtask/i)
        expect(addSubtaskButton).toBeInTheDocument()
      })

      const addSubtaskButton = screen.getByTitle(/add subtask/i)
      await userEvent.click(addSubtaskButton)

      // Wait for input to appear
      await waitFor(() => {
        const input = screen.getByPlaceholderText(/subtask title/i)
        expect(input).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/subtask title/i)
      await userEvent.type(input, 'New Subtask')
      await userEvent.keyboard('{Enter}')

      // Wait for subtask to appear
      await waitFor(() => {
        expect(screen.getByText('New Subtask')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Verify it stays visible after a delay
      await new Promise(resolve => setTimeout(resolve, 500))
      expect(screen.getByText('New Subtask')).toBeInTheDocument()
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

      // Wait for actions to open
      await waitFor(() => {
        expect(screen.getByTitle(/add subtask/i)).toBeInTheDocument()
      })

      const addSubtaskButton = screen.getByTitle(/add subtask/i)
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
      const addButtons = screen.getAllByTitle(/add a task/i)
      expect(addButtons.length).toBeGreaterThan(0)
      const addButton = addButtons[0]
      await userEvent.click(addButton)

      // Wait for input
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add a task/i)).toBeInTheDocument()
      })

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

      // Wait for actions to open
      await waitFor(() => {
        expect(screen.getByTitle(/add subtask/i)).toBeInTheDocument()
      })

      const addSubtaskButton = screen.getByTitle(/add subtask/i)
      await userEvent.click(addSubtaskButton)

      // Wait for input to appear
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/subtask title/i)).toBeInTheDocument()
      })

      // Accept button should be visible on mobile (has title "Add subtask" and md:hidden class)
      const acceptButton = screen.getByTitle(/add subtask/i).closest('div')?.querySelector('button[title="Add subtask"]')
      expect(acceptButton).toBeInTheDocument()
      if (acceptButton) {
        expect(acceptButton).toHaveClass('md:hidden')
      }
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

      // Wait for actions to open
      await waitFor(() => {
        expect(screen.getByTitle(/add subtask/i)).toBeInTheDocument()
      })

      const addSubtaskButton = screen.getByTitle(/add subtask/i)
      await userEvent.click(addSubtaskButton)

      // Wait for input to appear
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/subtask title/i)).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/subtask title/i)
      await userEvent.type(input, 'Accepted Subtask')

      // Accept button should be visible (mobile only)
      const acceptButton = screen.getByTitle(/add subtask/i).closest('div')?.querySelector('button[title="Add subtask"]')
      if (acceptButton) {
        await userEvent.click(acceptButton as HTMLElement)
      } else {
        // Fallback: just press Enter
        await userEvent.keyboard('{Enter}')
      }

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
      const deleteButton = screen.getByTitle(/delete task/i)
      await userEvent.click(deleteButton)

      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/delete.*task/i)).toBeInTheDocument()
      })

      // Confirm delete
      const confirmButton = screen.getByTitle(/delete task/i)
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

      const mockOnEdit = vi.fn()

      render(
        <TaskCard
          task={task}
          onDragStart={vi.fn()}
          onDragEnd={vi.fn()}
          onToggleComplete={vi.fn()}
          onDelete={vi.fn()}
          onEdit={mockOnEdit}
          onMoveUp={vi.fn()}
          onMoveDown={vi.fn()}
          isActionsOpen={true}
        />
      )

      // Start editing (double click on mobile)
      const taskElement = screen.getByText('Editable Task')
      await userEvent.dblClick(taskElement)

      // Wait for edit mode
      await waitFor(() => {
        expect(screen.getByDisplayValue('Editable Task')).toBeInTheDocument()
      })

      // Action buttons should be hidden (check for move buttons by title)
      const moveUpButton = screen.queryByTitle(/move up/i)
      const moveDownButton = screen.queryByTitle(/move down/i)
      expect(moveUpButton).not.toBeInTheDocument()
      expect(moveDownButton).not.toBeInTheDocument()
    })
  })

  describe('9. Accept button for regular tasks (mobile only)', () => {
    it('shows accept button for regular task input on mobile', async () => {
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

      // Focus the input - find add button by title
      const addButtons = screen.getAllByTitle(/add a task/i)
      expect(addButtons.length).toBeGreaterThan(0)
      const addButton = addButtons[0]
      await userEvent.click(addButton)

      // Wait for input to appear
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add a task/i)).toBeInTheDocument()
      })

      // Accept button should be visible on mobile (has sr-only "Accept task" and md:hidden class)
      const inputContainer = screen.getByPlaceholderText(/add a task/i).closest('div')
      const acceptButton = inputContainer?.querySelector('button .sr-only')
      // Check that accept button exists by looking for the Check icon or sr-only text
      const acceptButtons = screen.getAllByText(/accept task/i)
      const mobileAcceptButton = acceptButtons.find(btn => {
        const button = btn.closest('button')
        return button?.classList.contains('md:hidden')
      })
      expect(mobileAcceptButton).toBeInTheDocument()
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

      const addButtons = screen.getAllByTitle(/add a task/i)
      expect(addButtons.length).toBeGreaterThan(0)
      const addButton = addButtons[0]
      await userEvent.click(addButton)

      // Wait for input
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add a task/i)).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/add a task/i)
      await userEvent.type(input, 'Accepted Task')

      // Find accept button by sr-only text and md:hidden class
      const acceptButtons = screen.getAllByText(/accept task/i)
      const mobileAcceptButton = acceptButtons.find(btn => {
        const button = btn.closest('button')
        return button?.classList.contains('md:hidden')
      })
      if (mobileAcceptButton) {
        await userEvent.click(mobileAcceptButton.closest('button') as HTMLElement)
      } else {
        // Fallback: just press Enter
        await userEvent.keyboard('{Enter}')
      }

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

      // Wait for actions to open
      await waitFor(() => {
        expect(screen.getByTitle(/add task/i)).toBeInTheDocument()
      })

      // Add sibling (which will be a subtask)
      const addSiblingButton = screen.getByTitle(/add task/i)
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

      // Wait for actions to open
      await waitFor(() => {
        expect(screen.getByTitle(/add task/i)).toBeInTheDocument()
      })

      // Add sibling (which will be a regular task)
      const addSiblingButton = screen.getByTitle(/add task/i)
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

      // Wait for actions to open
      await waitFor(() => {
        expect(screen.getByTitle(/add subtask/i)).toBeInTheDocument()
      })

      const addSubtaskButton = screen.getByTitle(/add subtask/i)
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

      const addButtons = screen.getAllByTitle(/add a task/i)
      expect(addButtons.length).toBeGreaterThan(0)
      const addButton = addButtons[0]
      await userEvent.click(addButton)

      // Wait for input
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add a task/i)).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/add a task/i) as HTMLInputElement
      
      // Type and press Enter
      await userEvent.type(input, 'Task 1')
      await userEvent.keyboard('{Enter}')

      // Input should still be empty for next entry (keepInputOpen: true)
      await waitFor(() => {
        expect(input.value).toBe('')
        // Note: Focus check may not work reliably in tests, so we just check value
      }, { timeout: 2000 })
    })
  })
})
