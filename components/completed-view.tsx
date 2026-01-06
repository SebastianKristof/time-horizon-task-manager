"use client"

import { useMemo, useState, useEffect, useRef, type KeyboardEvent } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Task } from "@/lib/types"
import { TaskCard } from "@/components/task-card"
import { Button } from "@/components/ui/button"
import { format, parseISO, startOfMonth } from "date-fns"
import { cn } from "@/lib/utils"

interface CompletedViewProps {
  initialTasks: Task[]
  userId: string
}

export function CompletedView({ initialTasks, userId }: CompletedViewProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<string | null>(null)
  const deleteCancelRef = useRef<HTMLButtonElement | null>(null)
  const deleteConfirmRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to real-time changes
    const channel = supabase
      .channel("completed-tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log("[v0] Completed real-time update:", payload)
          if (payload.eventType === "UPDATE") {
            const updatedTask = payload.new as Task
            
            setTasks((prev) => {
              const existingIds = new Set(prev.map((t) => t.id))
              const completedTaskIds = new Set(prev.filter((t) => t.completed).map((t) => t.id))
              
              // If a task is completed, add it
              if (updatedTask.completed) {
                if (existingIds.has(updatedTask.id)) {
                  // Update existing task
                  return prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
                } else {
                  // Add new completed task and fetch its subtasks
                  return [...prev, updatedTask]
                }
              } else {
                // If a task is uncompleted
                // Remove it if it's a top-level task
                // Keep it if it's a subtask of a completed parent
                const isSubtaskOfCompleted = updatedTask.parent_task_id && completedTaskIds.has(updatedTask.parent_task_id)
                
                if (isSubtaskOfCompleted) {
                  // Update the subtask even though it's not completed
                  return prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
                } else {
                  // Remove task if it's unchecked and not a subtask of a completed parent
                  // Also remove all incomplete subtasks of this task (if it was a parent)
                  return prev.filter((task) => {
                    // Remove the uncompleted task itself
                    if (task.id === updatedTask.id) {
                      return false
                    }
                    // Remove incomplete subtasks of the uncompleted parent
                    if (task.parent_task_id === updatedTask.id && !task.completed) {
                      return false
                    }
                    return true
                  })
                }
              }
            })
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) => prev.filter((task) => task.id !== payload.old.id))
          } else if (payload.eventType === "INSERT") {
            const newTask = payload.new as Task
            // If it's a new subtask of a completed parent, add it
            setTasks((prev) => {
              const completedTaskIds = new Set(prev.filter((t) => t.completed).map((t) => t.id))
              const isSubtaskOfCompleted = newTask.parent_task_id && completedTaskIds.has(newTask.parent_task_id)
              
              if (newTask.completed || isSubtaskOfCompleted) {
                return [...prev, newTask]
              }
              return prev
            })
          }
        },
      )
      .subscribe((status, err) => {
        if (err) {
          console.error("[v0] Completed real-time subscription error:", err)
        }
        console.log("[v0] Completed real-time status:", status)
      })

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [userId])
  // Group tasks by month and organize with subtasks under parents
  const tasksByMonth = useMemo(() => {
    // Show completed tasks and their subtasks (even if subtasks are not completed)
    // First, get all completed tasks
    const completedTasks = tasks.filter((t) => t.completed)
    const completedTaskIds = new Set(completedTasks.map((t) => t.id))
    
    // Then, include all subtasks of completed tasks (even if not completed)
    // Exclude subtasks that are already in completedTasks to avoid duplicates
    const subtasksOfCompleted = tasks.filter((t) => 
      t.parent_task_id && completedTaskIds.has(t.parent_task_id) && !completedTaskIds.has(t.id)
    )
    
    // Combine completed tasks with their subtasks
    const tasksToShow = [...completedTasks, ...subtasksOfCompleted]
    const grouped: Record<string, Task[]> = {}

    // Create a map of parent task IDs to their completion dates
    const parentCompletionDates = new Map<string, string>()
    completedTasks.forEach((task) => {
      if (task.completed_at || task.updated_at) {
        parentCompletionDates.set(task.id, task.completed_at || task.updated_at || "")
      }
    })

    // First, group tasks by month
    tasksToShow.forEach((task) => {
      // For subtasks, use parent's completion date; for completed tasks, use their own
      let dateString: string | undefined
      if (task.parent_task_id && parentCompletionDates.has(task.parent_task_id)) {
        // Subtask: use parent's completion date
        dateString = parentCompletionDates.get(task.parent_task_id)
      } else {
        // Top-level completed task: use its own completion date
        dateString = task.completed_at || task.updated_at
      }
      
      if (!dateString) {
        // Skip tasks without dates
        return
      }

      try {
        const date = parseISO(dateString)
        const monthKey = format(startOfMonth(date), "yyyy-MM")

        if (!grouped[monthKey]) {
          grouped[monthKey] = []
        }
        grouped[monthKey].push(task)
      } catch {
        // Skip invalid dates
      }
    })

    // Organize tasks within each month: parent tasks with their subtasks
    Object.keys(grouped).forEach((monthKey) => {
      const monthTasks = grouped[monthKey]
      
      // Separate top-level tasks from subtasks
      const topLevelTasks = monthTasks.filter((task) => !task.parent_task_id)
      const subtasks = monthTasks.filter((task) => task.parent_task_id)

      // Sort top-level tasks by completed_at (descending), with fallback to updated_at
      topLevelTasks.sort((a, b) => {
        const dateA = parseISO(a.completed_at || a.updated_at || "")
        const dateB = parseISO(b.completed_at || b.updated_at || "")
        return dateB.getTime() - dateA.getTime()
      })

      // Sort subtasks by parent_task_id, then by position
      subtasks.sort((a, b) => {
        if (a.parent_task_id !== b.parent_task_id) {
          return (a.parent_task_id || "").localeCompare(b.parent_task_id || "")
        }
        return a.position - b.position
      })

      // Build ordered list: top-level task, then its subtasks, then next top-level task, etc.
      const ordered: Task[] = []
      
      for (const topLevelTask of topLevelTasks) {
        ordered.push(topLevelTask)
        // Find all subtasks for this parent
        const children = subtasks.filter((st) => st.parent_task_id === topLevelTask.id)
        children.sort((a, b) => a.position - b.position)
        ordered.push(...children)
      }

      grouped[monthKey] = ordered
    })

    return grouped
  }, [tasks])

  // Get sorted month keys (descending order)
  const sortedMonthKeys = useMemo(() => {
    return Object.keys(tasksByMonth).sort((a, b) => {
      // Parse yyyy-MM format and sort descending
      return b.localeCompare(a)
    })
  }, [tasksByMonth])

  // Empty handlers for read-only view
  const handleDragStart = () => {}
  const handleDragEnd = () => {}
  const handleToggleComplete = () => {}

  const handleDelete = (taskId: string) => {
    setDeleteConfirmTaskId(taskId)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmTaskId) return
    const supabase = createClient()
    const taskIdToDelete = deleteConfirmTaskId

    // Optimistic update (cascade delete will handle subtasks)
    setTasks((prev) =>
      prev.filter((task) => task.id !== taskIdToDelete && task.parent_task_id !== taskIdToDelete),
    )
    setDeleteConfirmTaskId(null)

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskIdToDelete)

      if (error) {
        throw error
      }
    } catch (err) {
      console.error("[v0] Error deleting task:", err)
      // Revert on error - refetch tasks
      const { data: allTasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("completed", true)
        .order("completed_at", { ascending: false })
      
      if (allTasks) {
        const completedTaskIds = allTasks.map((t) => t.id)
        if (completedTaskIds.length > 0) {
          const { data: subtasks } = await supabase
            .from("tasks")
            .select("*")
            .eq("user_id", userId)
            .in("parent_task_id", completedTaskIds)
          
          const existingIds = new Set(allTasks.map((t) => t.id))
          const newSubtasks = (subtasks || []).filter((t) => !existingIds.has(t.id))
          setTasks([...allTasks, ...newSubtasks] as Task[])
        } else {
          setTasks(allTasks as Task[])
        }
      }
    }
  }

  useEffect(() => {
    if (!deleteConfirmTaskId) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setDeleteConfirmTaskId(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [deleteConfirmTaskId])

  const deleteConfirmTask = deleteConfirmTaskId
    ? tasks.find((task) => task.id === deleteConfirmTaskId)
    : null

  return (
    <div className="mx-auto max-w-3xl">
      {deleteConfirmTaskId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onMouseDown={(event) => {
            if (event.target !== event.currentTarget) return
            setDeleteConfirmTaskId(null)
          }}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-border bg-background p-4 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-task-title"
            onKeyDown={(event) => {
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
              event.preventDefault()
              const next =
                document.activeElement === deleteCancelRef.current
                  ? deleteConfirmRef.current
                  : deleteCancelRef.current
              next?.focus()
            }}
          >
            <div id="delete-task-title" className="mb-2 text-base font-semibold text-foreground">
              Delete {deleteConfirmTask?.parent_task_id ? "subtask" : "task"}?
            </div>
            <div className="text-sm text-muted-foreground">
              {deleteConfirmTask?.title ?? "This action cannot be undone."}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDeleteConfirmTaskId(null)
                }}
                autoFocus
                ref={deleteCancelRef}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDelete}
                ref={deleteConfirmRef}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      {sortedMonthKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No completed tasks yet</p>
        </div>
      ) : (
        sortedMonthKeys.map((monthKey) => {
          const monthTasks = tasksByMonth[monthKey]
          if (monthTasks.length === 0) return null

          // Format as "Dec 2025" instead of "December 2025"
          const monthLabel = format(parseISO(`${monthKey}-01`), "MMM yyyy")

          return (
            <div key={monthKey} className="mb-8">
              {/* Section heading */}
              <div className="mb-4 border-b border-border pb-2">
                <h2 className="text-xl font-semibold">{monthLabel}</h2>
              </div>

              {/* Task list */}
              <div className="flex flex-col">
                {monthTasks.map((task) => {
                  const isSubtask = task.parent_task_id !== null

                  return (
                    <div key={task.id} className={isSubtask ? "ml-6" : ""}>
                      <TaskCard
                        task={task}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onToggleComplete={handleToggleComplete}
                        onDelete={handleDelete}
                        isSubtask={isSubtask}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
