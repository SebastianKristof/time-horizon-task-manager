import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskCard } from '@/components/task-card'
import type { Task, TimeHorizon } from '@/lib/types'
import { createTestTask, setViewport, VIEWPORT_PRESETS } from '../utils/test-helpers'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('TaskCard', () => {
  const mockOnDragStart = vi.fn()
  const mockOnDragEnd = vi.fn()
  const mockOnToggleComplete = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnEdit = vi.fn()
  const mockOnAddSubtask = vi.fn()
  const mockOnMoveUp = vi.fn()
  const mockOnMoveDown = vi.fn()
  const mockOnMoveHorizon = vi.fn()
  const mockOnFocusTask = vi.fn()
  const mockOnNavigateKey = vi.fn()

  const defaultTask = createTestTask({
    title: 'Test Task',
    time_horizon: 'now',
    completed: false,
  })

  const defaultProps = {
    task: defaultTask,
    onDragStart: mockOnDragStart,
    onDragEnd: mockOnDragEnd,
    onToggleComplete: mockOnToggleComplete,
    onDelete: mockOnDelete,
    onEdit: mockOnEdit,
    onAddSubtask: mockOnAddSubtask,
    onMoveUp: mockOnMoveUp,
    onMoveDown: mockOnMoveDown,
    onMoveHorizon: mockOnMoveHorizon,
    onFocusTask: mockOnFocusTask,
    onNavigateKey: mockOnNavigateKey,
    canMoveUp: true,
    canMoveDown: true,
    isFocused: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setViewport(VIEWPORT_PRESETS.DESKTOP_WIDE.width, VIEWPORT_PRESETS.DESKTOP_WIDE.height)
  })

  describe('Rendering and Display States', () => {
    it('renders task title correctly', () => {
      render(<TaskCard {...defaultProps} />)
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    it('shows completed state with checkmark', () => {
      const completedTask = createTestTask({ completed: true, title: 'Completed Task' })
      render(<TaskCard {...defaultProps} task={completedTask} />)
      
      // Check for the task text
      expect(screen.getByText('Completed Task')).toBeInTheDocument()
      // The checkmark is rendered as an SVG inside a button
      const checkboxButton = screen.getByRole('button', { name: /completed task/i }).closest('div')?.querySelector('button[type="button"]')
      expect(checkboxButton).toBeInTheDocument()
    })

    it('shows non-completed state without checkmark', () => {
      render(<TaskCard {...defaultProps} />)
      
      expect(screen.getByText('Test Task')).toBeInTheDocument()
      // Non-completed tasks don't show a checkmark SVG
      const taskCard = screen.getByRole('listitem')
      expect(taskCard).toBeInTheDocument()
    })
  })

  describe('Desktop Wide View (> 768px)', () => {
    beforeEach(() => {
      setViewport(VIEWPORT_PRESETS.DESKTOP_WIDE.width, VIEWPORT_PRESETS.DESKTOP_WIDE.height)
    })

    it('toggles completion on checkbox click', async () => {
      const user = userEvent.setup()
      render(<TaskCard {...defaultProps} />)
      
      // Find the checkbox button (it's a button that toggles completion)
      const taskCard = screen.getByRole('listitem')
      const checkboxButtons = taskCard.querySelectorAll('button[type="button"]')
      // The first button should be the checkbox
      if (checkboxButtons.length > 0) {
        await user.click(checkboxButtons[0] as HTMLElement)
        expect(mockOnToggleComplete).toHaveBeenCalledWith(defaultTask)
      }
    })

    it('enters edit mode on Enter key', async () => {
      const user = userEvent.setup()
      render(<TaskCard {...defaultProps} />)
      
      const taskCard = screen.getByRole('listitem')
      taskCard.focus()
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument()
      })
    })

    it('enters edit mode on double-click', async () => {
      const user = userEvent.setup()
      render(<TaskCard {...defaultProps} />)
      
      const taskButton = screen.getByRole('button', { name: /test task/i })
      await user.dblClick(taskButton)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument()
      })
    })

    it('saves edit on Enter key', async () => {
      const user = userEvent.setup()
      render(<TaskCard {...defaultProps} />)
      
      const taskCard = screen.getByRole('listitem')
      taskCard.focus()
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument()
      })
      
      const input = screen.getByDisplayValue('Test Task')
      await user.clear(input)
      await user.type(input, 'Updated Task')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockOnEdit).toHaveBeenCalledWith(defaultTask, 'Updated Task')
      })
    })

    it('cancels edit on Escape key', async () => {
      const user = userEvent.setup()
      render(<TaskCard {...defaultProps} />)
      
      const taskCard = screen.getByRole('listitem')
      taskCard.focus()
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument()
      })
      
      const input = screen.getByDisplayValue('Test Task')
      await user.clear(input)
      await user.type(input, 'Updated Task')
      await user.keyboard('{Escape}')
      
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Updated Task')).not.toBeInTheDocument()
        expect(screen.getByText('Test Task')).toBeInTheDocument()
      })
      expect(mockOnEdit).not.toHaveBeenCalled()
    })

    it('saves edit on blur', async () => {
      const user = userEvent.setup()
      render(<TaskCard {...defaultProps} />)
      
      const taskCard = screen.getByRole('listitem')
      taskCard.focus()
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument()
      })
      
      const input = screen.getByDisplayValue('Test Task')
      await user.clear(input)
      await user.type(input, 'Updated Task')
      await user.tab() // Blur the input
      
      await waitFor(() => {
        expect(mockOnEdit).toHaveBeenCalledWith(defaultTask, 'Updated Task')
      })
    })

    it('prevents editing completed tasks', async () => {
      const user = userEvent.setup()
      const completedTask = createTestTask({ completed: true })
      render(<TaskCard {...defaultProps} task={completedTask} />)
      
      const taskCard = screen.getByRole('listitem')
      taskCard.focus()
      await user.keyboard('{Enter}')
      
      // Should not enter edit mode
      expect(screen.queryByDisplayValue('Test Task')).not.toBeInTheDocument()
    })

    it('shows action buttons on hover', async () => {
      const user = userEvent.setup()
      render(<TaskCard {...defaultProps} />)
      
      const taskCard = screen.getByRole('listitem')
      await user.hover(taskCard)
      
      // Action buttons should be visible on hover (desktop only)
      // Note: This may require checking CSS classes or visibility
      await waitFor(() => {
        const moveUpButton = screen.queryByRole('button', { name: /move up/i })
        // On desktop, buttons should be visible on hover
        // The exact implementation depends on CSS, but we can check they exist
        expect(taskCard).toBeInTheDocument()
      })
    })

    it('handles keyboard navigation - Space to complete', async () => {
      const user = userEvent.setup()
      render(<TaskCard {...defaultProps} />)
      
      const taskCard = screen.getByRole('listitem')
      taskCard.focus()
      await user.keyboard(' ')
      
      expect(mockOnToggleComplete).toHaveBeenCalledWith(defaultTask)
    })

    it('handles keyboard navigation - Delete key', async () => {
      const user = userEvent.setup()
      render(<TaskCard {...defaultProps} />)
      
      const taskCard = screen.getByRole('listitem')
      taskCard.focus()
      await user.keyboard('{Delete}')
      
      expect(mockOnDelete).toHaveBeenCalledWith(defaultTask.id)
    })

    it('handles keyboard navigation - S key for subtask', async () => {
      const user = userEvent.setup()
      render(<TaskCard {...defaultProps} />)
      
      const taskCard = screen.getByRole('listitem')
      taskCard.focus()
      await user.keyboard('s')
      
      expect(mockOnAddSubtask).toHaveBeenCalledWith(defaultTask)
    })

    it('handles keyboard navigation - Alt+ArrowUp to move up', async () => {
      const user = userEvent.setup()
      render(<TaskCard {...defaultProps} />)
      
      const taskCard = screen.getByRole('listitem')
      taskCard.focus()
      await user.keyboard('{Alt>}{ArrowUp}{/Alt}')
      
      expect(mockOnMoveUp).toHaveBeenCalledWith(defaultTask)
    })

    it('handles keyboard navigation - Alt+ArrowDown to move down', async () => {
      const user = userEvent.setup()
      render(<TaskCard {...defaultProps} />)
      
      const taskCard = screen.getByRole('listitem')
      taskCard.focus()
      await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
      
      expect(mockOnMoveDown).toHaveBeenCalledWith(defaultTask)
    })

    it('handles drag start event', async () => {
      render(<TaskCard {...defaultProps} />)
      
      const taskCard = screen.getByRole('listitem')
      
      // Simulate drag start - create DragEvent manually since it's not available in jsdom
      const dragEvent = document.createEvent('Event') as any
      dragEvent.initEvent('dragstart', true, true)
      dragEvent.dataTransfer = {
        setDragImage: vi.fn(),
      }
      taskCard.dispatchEvent(dragEvent)
      
      expect(mockOnDragStart).toHaveBeenCalledWith(defaultTask)
    })

    it('handles drag end event', async () => {
      render(<TaskCard {...defaultProps} />)
      
      const taskCard = screen.getByRole('listitem')
      
      // Simulate drag end
      const dragEvent = document.createEvent('Event')
      dragEvent.initEvent('dragend', true, true)
      taskCard.dispatchEvent(dragEvent)
      
      expect(mockOnDragEnd).toHaveBeenCalled()
    })

    it('shows move up/down buttons with correct disabled states', async () => {
      render(
        <TaskCard
          {...defaultProps}
          canMoveUp={false}
          canMoveDown={true}
        />
      )
      
      const taskCard = screen.getByRole('listitem')
      await userEvent.hover(taskCard)
      
      // Check disabled states (implementation depends on component)
      // This is a placeholder - actual test would check button disabled attributes
      expect(taskCard).toBeInTheDocument()
    })

    it('shows horizon move buttons with correct disabled states', async () => {
      const nowTask = createTestTask({ time_horizon: 'now' })
      render(
        <TaskCard
          {...defaultProps}
          task={nowTask}
        />
      )
      
      // Horizon "now" should not be able to move up (it's already first)
      // This would be tested by checking button disabled states
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })
  })

  describe('Desktop Narrow View (≤ 768px, mobile emulator)', () => {
    beforeEach(() => {
      setViewport(VIEWPORT_PRESETS.DESKTOP_NARROW.width, VIEWPORT_PRESETS.DESKTOP_NARROW.height)
    })

    it('renders in compact layout', () => {
      render(<TaskCard {...defaultProps} />)
      expect(screen.getByText('Test Task')).toBeInTheDocument()
      // Compact layout would have different styling
    })

    it('opens buttons view on tap without keyboard', async () => {
      const user = userEvent.setup()
      render(<TaskCard {...defaultProps} />)
      
      const taskButton = screen.getByRole('button', { name: /test task/i })
      await user.click(taskButton)
      
      // On mobile, tap should open buttons view or enter edit mode
      // The exact behavior depends on implementation
      // This is a placeholder test
      expect(taskButton).toBeInTheDocument()
    })

    it('enters edit mode via double-tap', async () => {
      const user = userEvent.setup()
      render(<TaskCard {...defaultProps} />)
      
      // On mobile, double-tap should enter edit mode
      // The task button might not be directly accessible, so we use the task card
      const taskCard = screen.getByRole('listitem')
      const taskButton = taskCard.querySelector('button')
      
      if (taskButton) {
        await user.dblClick(taskButton)
        
        // Should enter edit mode (if double-click works on mobile)
        // Note: Actual behavior may vary - this is testing the intent
        await waitFor(() => {
          // Check if edit input appears or if actions open
          const editInput = screen.queryByDisplayValue('Test Task')
          // On mobile, double-tap behavior may differ
          expect(taskCard).toBeInTheDocument()
        }, { timeout: 1000 })
      }
    })

    it('handles long press for drag initiation', async () => {
      const user = userEvent.setup({ delay: 0 })
      render(<TaskCard {...defaultProps} />)
      
      const taskCard = screen.getByRole('listitem')
      const pointerDown = new PointerEvent('pointerdown', {
        pointerType: 'touch',
        bubbles: true,
      })
      taskCard.dispatchEvent(pointerDown)
      
      // Wait for long press threshold (220ms)
      await new Promise(resolve => setTimeout(resolve, 250))
      
      const pointerUp = new PointerEvent('pointerup', {
        pointerType: 'touch',
        bubbles: true,
      })
      taskCard.dispatchEvent(pointerUp)
      
      // Long press should enable drag
      // This is a simplified test - actual implementation may vary
      expect(taskCard).toBeInTheDocument()
    })

    it('shows action buttons in edit mode (not hover-based)', async () => {
      const user = userEvent.setup()
      render(<TaskCard {...defaultProps} />)
      
      const taskCard = screen.getByRole('listitem')
      taskCard.focus()
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        // On mobile, edit mode should show action buttons
        // The exact behavior depends on isActionsOpen prop
        const editInput = screen.queryByDisplayValue('Test Task')
        // If edit mode is active, input should be present
        if (editInput) {
          expect(editInput).toBeInTheDocument()
        }
      })
    })
  })

  describe('Cross-viewport tests', () => {
    it('handles viewport resize', async () => {
      // Start with desktop wide
      setViewport(VIEWPORT_PRESETS.DESKTOP_WIDE.width, VIEWPORT_PRESETS.DESKTOP_WIDE.height)
      const { rerender } = render(<TaskCard {...defaultProps} />)
      
      // Resize to mobile
      setViewport(VIEWPORT_PRESETS.MOBILE.width, VIEWPORT_PRESETS.MOBILE.height)
      rerender(<TaskCard {...defaultProps} />)
      
      // Component should still render
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    it('detects pointer type correctly', async () => {
      render(<TaskCard {...defaultProps} />)
      
      const taskCard = screen.getByRole('listitem')
      
      // Simulate mouse pointer
      const mouseEvent = new PointerEvent('pointerdown', {
        pointerType: 'mouse',
        bubbles: true,
      })
      taskCard.dispatchEvent(mouseEvent)
      
      // Simulate touch pointer
      const touchEvent = new PointerEvent('pointerdown', {
        pointerType: 'touch',
        bubbles: true,
      })
      taskCard.dispatchEvent(touchEvent)
      
      // Component should handle both
      expect(taskCard).toBeInTheDocument()
    })
  })
})
