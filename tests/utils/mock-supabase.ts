/**
 * Enhanced Supabase client mock for testing
 * 
 * This is the PRIMARY mocking strategy for the application.
 * Most task flows use Supabase client directly, not fetch-based REST APIs.
 */

import { vi } from 'vitest'
import type { Task, Snapshot, TimeHorizon } from '@/lib/types'

// Mock data storage - use globalThis to ensure it's shared across module instances
const mockStorage = (globalThis as any).__SUPABASE_MOCK_STORAGE__ || {
  tasks: [] as Task[],
  snapshots: [] as Snapshot[],
  user: null as { id: string; email: string } | null,
  channelHandlers: new Map() as Map<string, ChannelEventHandler[]>,
};
(globalThis as any).__SUPABASE_MOCK_STORAGE__ = mockStorage;

/**
 * Create a mock Supabase client
 */
export function createMockSupabaseClient() {
  const mockFrom = vi.fn((table: string) => {
    // Create a fresh query builder for each call
    const createQueryBuilder = () => {
      const state: any = {
        table,
        filters: [],
        orderBy: null,
        limit: null,
        updates: null,
        isDelete: false,
      }

      const queryBuilder: any = {
        select: vi.fn().mockImplementation(() => {
          state.isSelect = true
          return queryBuilder
        }),
        insert: vi.fn().mockImplementation((data: any) => {
          // Insert executes immediately
          if (table === 'tasks') {
            const newTasks = Array.isArray(data) ? data : [data]
            const inserted: Task[] = []
            newTasks.forEach((task: Partial<Task>) => {
              const newTask: Task = {
                id: task.id || `task-${Date.now()}-${Math.random()}`,
                user_id: task.user_id || mockStorage.user?.id || 'test-user',
                title: task.title || '',
                description: task.description || null,
                time_horizon: task.time_horizon || 'now',
                completed: task.completed ?? false,
                completed_at: task.completed_at || null,
                created_at: task.created_at || new Date().toISOString(),
                updated_at: task.updated_at || new Date().toISOString(),
                position: task.position ?? 0,
                parent_task_id: task.parent_task_id || null,
              }
              mockStorage.tasks.push(newTask)
              inserted.push(newTask)
              // Emit real-time event
              emitChannelEvent('postgres_changes', {
                eventType: 'INSERT',
                new: newTask,
                old: null,
              })
            })
            return Promise.resolve({ data: inserted, error: null })
          }
          if (table === 'snapshots') {
            const newSnapshot = Array.isArray(data) ? data[0] : data
            const snapshot: Snapshot = {
              id: newSnapshot.id || `snapshot-${Date.now()}`,
              user_id: newSnapshot.user_id || mockStorage.user?.id || 'test-user',
              title: newSnapshot.title || '',
              description: newSnapshot.description || null,
              snapshot_data: newSnapshot.snapshot_data,
              created_at: newSnapshot.created_at || new Date().toISOString(),
            }
            mockStorage.snapshots.push(snapshot)
            return Promise.resolve({ data: snapshot, error: null })
          }
          return Promise.resolve({ data: null, error: null })
        }),
        update: vi.fn().mockImplementation((updates: Partial<Task>) => {
          state.updates = updates
          state.isUpdate = true
          return queryBuilder
        }),
        delete: vi.fn().mockImplementation(() => {
          state.isDelete = true
          return queryBuilder
        }),
        eq: vi.fn().mockImplementation((column: string, value: any) => {
          state.filters.push({ column, value, operator: 'eq' })
          return queryBuilder
        }),
        order: vi.fn().mockImplementation((column: string, options?: { ascending?: boolean }) => {
          state.orderBy = { column, ascending: options?.ascending !== false }
          return queryBuilder
        }),
        limit: vi.fn().mockImplementation((count: number) => {
          state.limit = count
          return queryBuilder
        }),
        is: vi.fn().mockImplementation((column: string, value: string) => {
          state.filters.push({ column, value, operator: 'is' })
          return queryBuilder
        }),
        single: vi.fn().mockImplementation(async () => {
          return executeQuery(state)
        }),
      }

      // Execute query function
      const executeQuery = async (s: any) => {
        if (s.table === 'tasks') {
          let results = [...mockStorage.tasks]

          // Apply filters
          s.filters.forEach((filter: any) => {
            if (filter.operator === 'is') {
              if (filter.value === null) {
                results = results.filter((task: any) => task[filter.column] === null)
              } else {
                results = results.filter((task: any) => task[filter.column] !== null)
              }
            } else {
              results = results.filter((task: any) => task[filter.column] === filter.value)
            }
          })

          // Apply ordering
          if (s.orderBy) {
            results.sort((a: any, b: any) => {
              const aVal = a[s.orderBy.column]
              const bVal = b[s.orderBy.column]
              const ascending = s.orderBy.ascending
              if (aVal < bVal) return ascending ? -1 : 1
              if (aVal > bVal) return ascending ? 1 : -1
              return 0
            })
          }

          // Apply limit
          if (s.limit !== null) {
            results = results.slice(0, s.limit)
          }

          // Apply update
          if (s.isUpdate && s.updates) {
            const updatedTasks = results.map((task) => ({
              ...task,
              ...s.updates,
              updated_at: new Date().toISOString(),
            }))
            // Update mockStorage.tasks
            mockStorage.tasks = mockStorage.tasks.map((task) => {
              const updated = updatedTasks.find((ut) => ut.id === task.id)
              return updated || task
            })
            // Emit real-time events
            updatedTasks.forEach((task) => {
              emitChannelEvent('postgres_changes', {
                eventType: 'UPDATE',
                new: task,
                old: null,
              })
            })
            return Promise.resolve({ data: updatedTasks, error: null })
          }

          // Apply delete
          if (s.isDelete) {
            const deletedTasks = [...results]
            mockStorage.tasks = mockStorage.tasks.filter((task) => !deletedTasks.some((dt) => dt.id === task.id))
            // Emit real-time events
            deletedTasks.forEach((task) => {
              emitChannelEvent('postgres_changes', {
                eventType: 'DELETE',
                new: null,
                old: task,
              })
            })
            return Promise.resolve({ data: deletedTasks, error: null })
          }

          // Default: return results (for select)
          // Note: When .select("position") is called, Supabase returns only the selected fields
          // But for simplicity, we return all fields - the component accesses .position which works
          // Always return an array, even if empty
          return Promise.resolve({ data: results || [], error: null })
        }

        if (s.table === 'snapshots') {
          let results = [...mockStorage.snapshots]
          // Apply similar filtering for snapshots
          return Promise.resolve({ data: results, error: null })
        }

        return Promise.resolve({ data: null, error: null })
      }

      // Make query builder awaitable (for queries without .single())
      // When the query builder is awaited, JavaScript looks for a `then` method
      // We create a promise that executes the query when then() is first called
      // This allows the full chain (select().eq().order().limit()) to complete before execution
      
      // Create the promise lazily when then() is first called
      // Use Promise.resolve().then() to defer to next microtask, ensuring all chain calls complete
      let queryPromise: Promise<any> | null = null
      const getQueryPromise = (): Promise<any> => {
        if (!queryPromise) {
          // Defer execution to next microtask to ensure all synchronous chain methods complete
          // This is critical - we need all chain methods (select, eq, order, limit) to finish
          // before executing the query. Using Promise.resolve().then() ensures this.
          queryPromise = Promise.resolve().then(() => executeQuery(state))
        }
        return queryPromise
      }

      // Make queryBuilder thenable - this is what makes it awaitable
      // When you do `await queryBuilder`, JavaScript internally does:
      // Promise.resolve(queryBuilder).then(resolve, reject)
      // Which calls queryBuilder.then(resolve, reject) if it exists
      // The then method must return a thenable (promise-like object)
      // CRITICAL: The then method signature must match: then(onResolve, onReject)
      // IMPORTANT: The then method must be defined before the query builder is returned
      // and must be a proper function that returns a promise
      const thenMethod = function(this: any, onResolve?: (value: any) => any, onReject?: (reason: any) => any) {
        const promise = getQueryPromise()
        // Always return a promise, even if callbacks aren't provided
        if (onResolve || onReject) {
          return promise.then(onResolve, onReject)
        }
        // If called without arguments, return the promise itself
        return promise
      }
      
      // Assign then method directly - this makes the object awaitable
      queryBuilder.then = thenMethod
      queryBuilder.catch = function(onReject: (reason: any) => any) {
        return getQueryPromise().catch(onReject)
      }
      queryBuilder.finally = function(onFinally: () => void) {
        return getQueryPromise().finally(onFinally)
      }

      return queryBuilder
    }

    return createQueryBuilder()
  })

  const mockChannel = vi.fn((name: string) => {
    const channel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    }

    channel.on.mockImplementation((event: string, filter: any, callback: ChannelEventHandler) => {
      if (event === 'postgres_changes') {
        const handlerKey = `${name}:${event}`
        if (!mockStorage.channelHandlers.has(handlerKey)) {
          mockStorage.channelHandlers.set(handlerKey, [])
        }
        mockStorage.channelHandlers.get(handlerKey)!.push(callback)
      }
      return channel
    })

    channel.subscribe.mockImplementation(() => {
      return Promise.resolve({ status: 'SUBSCRIBED' })
    })

    channel.unsubscribe.mockImplementation(() => {
      const handlerKey = `${name}:postgres_changes`
      mockStorage.channelHandlers.delete(handlerKey)
      return Promise.resolve({ status: 'ok' })
    })

    return channel
  })

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockStorage.user },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: mockStorage.user, session: null },
        error: null,
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { provider: 'google', url: 'https://example.com' },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: mockFrom,
    channel: mockChannel,
    removeChannel: vi.fn().mockImplementation((channel: any) => {
      // Remove channel handlers when channel is removed
      return Promise.resolve({ status: 'ok' })
    }),
  }
}

/**
 * Emit a channel event (for testing real-time updates)
 */
export function emitChannelEvent(eventType: string, payload: any) {
  mockStorage.channelHandlers.forEach((handlers, key) => {
    if (key.includes(eventType)) {
      handlers.forEach((handler) => {
        handler({
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old,
          schema: 'public',
          table: 'tasks',
        })
      })
    }
  })
}

/**
 * Reset mock data
 */
export function resetMockSupabase() {
  mockStorage.tasks = []
  mockStorage.snapshots = []
  mockStorage.user = null
  mockStorage.channelHandlers.clear()
}

/**
 * Set mock user
 */
export function setMockUser(user: { id: string; email: string } | null) {
  mockStorage.user = user
}

/**
 * Set mock tasks
 */
export function setMockTasks(tasks: Task[]) {
  mockStorage.tasks = [...tasks]
}

/**
 * Get mock tasks
 */
export function getMockTasks(): Task[] {
  return [...mockStorage.tasks]
}

/**
 * Set mock snapshots
 */
export function setMockSnapshots(snapshots: Snapshot[]) {
  mockStorage.snapshots = [...snapshots]
}
