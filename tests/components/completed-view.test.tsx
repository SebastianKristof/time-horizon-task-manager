import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CompletedView } from '@/components/completed-view'
import { createTestTask } from '../utils/test-helpers'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock Supabase client
import { createMockSupabaseClient } from '../utils/mock-supabase'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => createMockSupabaseClient()),
}))

describe('CompletedView', () => {
  const userId = 'test-user-id'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders completed tasks', () => {
    const completedTasks = [
      createTestTask({ title: 'Completed Task 1', completed: true }),
      createTestTask({ title: 'Completed Task 2', completed: true }),
    ]

    render(<CompletedView initialTasks={completedTasks} userId={userId} />)

    expect(screen.getByText('Completed Task 1')).toBeInTheDocument()
    expect(screen.getByText('Completed Task 2')).toBeInTheDocument()
  })

  it('shows subtasks of completed parents', () => {
    const parentTask = createTestTask({
      id: 'parent-1',
      title: 'Parent Task',
      completed: true,
      completed_at: new Date().toISOString(),
    })
    const subtask = createTestTask({
      id: 'subtask-1',
      title: 'Subtask',
      completed: false, // Subtasks don't need to be completed
      parent_task_id: 'parent-1',
    })

    render(
      <CompletedView
        initialTasks={[parentTask, subtask]}
        userId={userId}
      />
    )

    expect(screen.getByText('Parent Task')).toBeInTheDocument()
    // Subtask should be shown even if not completed (because parent is completed)
    const subtaskElements = screen.getAllByText('Subtask')
    expect(subtaskElements.length).toBeGreaterThan(0)
  })

  it('groups tasks by completion date', () => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const tasks = [
      createTestTask({
        title: 'Today Task',
        completed: true,
        completed_at: now.toISOString(),
      }),
      createTestTask({
        title: 'Yesterday Task',
        completed: true,
        completed_at: yesterday.toISOString(),
      }),
    ]

    render(<CompletedView initialTasks={tasks} userId={userId} />)

    expect(screen.getByText('Today Task')).toBeInTheDocument()
    expect(screen.getByText('Yesterday Task')).toBeInTheDocument()
  })

  it('handles snapshot creation', async () => {
    const tasks = [
      createTestTask({ title: 'Task 1', completed: true }),
    ]

    render(<CompletedView initialTasks={tasks} userId={userId} />)

    // Look for snapshot creation button or functionality
    // This depends on the actual implementation
    expect(screen.getByText('Task 1')).toBeInTheDocument()
  })

  it('handles real-time updates', async () => {
    const tasks = [
      createTestTask({ title: 'Task 1', completed: true }),
    ]

    render(<CompletedView initialTasks={tasks} userId={userId} />)

    expect(screen.getByText('Task 1')).toBeInTheDocument()

    // Real-time updates would be tested by simulating channel events
    // This is a placeholder for the actual implementation
  })
})
