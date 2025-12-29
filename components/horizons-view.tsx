"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Task, TimeHorizon } from "@/lib/types"
import { TaskCard } from "@/components/task-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"

interface HorizonsViewProps {
  initialTasks: Task[]
  userId: string
}

const horizons: { value: TimeHorizon; label: string; description: string }[] = [
  { value: "now", label: "7 days", description: "This week" },
  { value: "soon", label: "30 days", description: "Next few weeks" },
  { value: "later", label: "180 days", description: "Next few months" },
  { value: "someday", label: "someday", description: "No timeline" },
]
const horizonOrder: TimeHorizon[] = ["now", "soon", "later", "someday"]

export function HorizonsView({ initialTasks, userId }: HorizonsViewProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [newTaskInputs, setNewTaskInputs] = useState<Record<TimeHorizon, string>>({
    now: "",
    soon: "",
    later: "",
    someday: "",
  })
  const [focusedHorizon, setFocusedHorizon] = useState<TimeHorizon | null>(null)
  const inputRefs = useRef<Record<TimeHorizon, HTMLInputElement | null>>({
    now: null,
    soon: null,
    later: null,
    someday: null,
  })

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to real-time changes
    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log("[v0] Real-time update:", payload)
          if (payload.eventType === "INSERT") {
            setTasks((prev) => {
              const newTask = payload.new as Task
              // Check if task already exists (avoid duplicates)
              if (prev.some((t) => t.id === newTask.id)) {
                return prev
              }
              return [...prev, newTask]
            })
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) => prev.map((task) => (task.id === payload.new.id ? (payload.new as Task) : task)))
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) => prev.filter((task) => task.id !== payload.old.id))
          }
        },
      )
      .subscribe((status, err) => {
        if (err) {
          console.error("[v0] Real-time subscription error:", err)
        }
        console.log("[v0] Real-time status:", status)
      })

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [userId])

  // Organize tasks by horizon, then by parent_task_id (NULLS FIRST), then by position
  const organizedTasks = useMemo(() => {
    const result: Record<TimeHorizon, Task[]> = {
      now: [],
      soon: [],
      later: [],
      someday: [],
    }

    horizons.forEach((horizon) => {
      const horizonTasks = tasks.filter((task) => task.time_horizon === horizon.value)
      
      // Separate top-level tasks from subtasks
      const topLevelTasks = horizonTasks.filter((task) => !task.parent_task_id)
      const subtasks = horizonTasks.filter((task) => task.parent_task_id)

      // Sort top-level tasks by position
      topLevelTasks.sort((a, b) => a.position - b.position)

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

      result[horizon.value] = ordered
    })

    return result
  }, [tasks])

  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
  }

  const handleDrop = async (targetHorizon: TimeHorizon) => {
    if (!draggedTask || draggedTask.time_horizon === targetHorizon) {
      setDraggedTask(null)
      return
    }

    const supabase = createClient()

    // If moving a parent task, also move all its subtasks
    const tasksToMove = draggedTask.parent_task_id === null
      ? [draggedTask, ...tasks.filter((t) => t.parent_task_id === draggedTask.id)]
      : [draggedTask]

    // Optimistic update
    setTasks((prev) =>
      prev.map((task) => {
        if (tasksToMove.some((tm) => tm.id === task.id)) {
          return { ...task, time_horizon: targetHorizon }
        }
        return task
      }),
    )

    try {
      // Update all tasks in batch
      for (const taskToMove of tasksToMove) {
        const { error } = await supabase
          .from("tasks")
          .update({ time_horizon: targetHorizon })
          .eq("id", taskToMove.id)

        if (error) throw error
      }
    } catch (err) {
      console.error("[v0] Error updating task horizon:", err)
      // Revert optimistic update on error
      setTasks((prev) =>
        prev.map((task) => {
          const originalTask = tasksToMove.find((tm) => tm.id === task.id)
          if (originalTask) {
            return { ...task, time_horizon: originalTask.time_horizon }
          }
          return task
        }),
      )
    }

    setDraggedTask(null)
  }

  const handleToggleComplete = async (task: Task) => {
    const supabase = createClient()
    const newCompleted = !task.completed

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
          : t,
      ),
    )

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq("id", task.id)

      if (error) throw error
    } catch (err) {
      console.error("[v0] Error toggling task completion:", err)
      // Revert on error
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
    }
  }

  const handleDelete = async (taskId: string) => {
    const supabase = createClient()

    // Optimistic update (cascade delete will handle subtasks)
    setTasks((prev) => prev.filter((task) => task.id !== taskId && task.parent_task_id !== taskId))

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId)

      if (error) throw error
    } catch (err) {
      console.error("[v0] Error deleting task:", err)
      // Could revert here, but for delete it's better to just show an error
    }
  }

  const handleMoveUp = async (task: Task) => {
    if (task.parent_task_id !== null) return // Only top-level tasks can be reordered

    const supabase = createClient()
    const topLevelTasks = tasks.filter(
      (t) => t.time_horizon === task.time_horizon && t.parent_task_id === null,
    )
    topLevelTasks.sort((a, b) => a.position - b.position)

    const currentIndex = topLevelTasks.findIndex((t) => t.id === task.id)
    if (currentIndex <= 0) return // Already at top

    const previousTask = topLevelTasks[currentIndex - 1]
    const newPosition = previousTask.position
    const oldPosition = task.position

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === task.id) return { ...t, position: newPosition }
        if (t.id === previousTask.id) return { ...t, position: oldPosition }
        return t
      }),
    )

    try {
      // Swap positions
      const { error: error1 } = await supabase
        .from("tasks")
        .update({ position: newPosition })
        .eq("id", task.id)

      if (error1) throw error1

      const { error: error2 } = await supabase
        .from("tasks")
        .update({ position: oldPosition })
        .eq("id", previousTask.id)

      if (error2) throw error2
    } catch (err) {
      console.error("[v0] Error moving task up:", err)
      // Revert
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) return { ...t, position: oldPosition }
          if (t.id === previousTask.id) return { ...t, position: newPosition }
          return t
        }),
      )
    }
  }

  const handleMoveDown = async (task: Task) => {
    if (task.parent_task_id !== null) return // Only top-level tasks can be reordered

    const supabase = createClient()
    const topLevelTasks = tasks.filter(
      (t) => t.time_horizon === task.time_horizon && t.parent_task_id === null,
    )
    topLevelTasks.sort((a, b) => a.position - b.position)

    const currentIndex = topLevelTasks.findIndex((t) => t.id === task.id)
    if (currentIndex < 0 || currentIndex >= topLevelTasks.length - 1) return // Already at bottom

    const nextTask = topLevelTasks[currentIndex + 1]
    const newPosition = nextTask.position
    const oldPosition = task.position

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === task.id) return { ...t, position: newPosition }
        if (t.id === nextTask.id) return { ...t, position: oldPosition }
        return t
      }),
    )

    try {
      // Swap positions
      const { error: error1 } = await supabase
        .from("tasks")
        .update({ position: newPosition })
        .eq("id", task.id)

      if (error1) throw error1

      const { error: error2 } = await supabase
        .from("tasks")
        .update({ position: oldPosition })
        .eq("id", nextTask.id)

      if (error2) throw error2
    } catch (err) {
      console.error("[v0] Error moving task down:", err)
      // Revert
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) return { ...t, position: oldPosition }
          if (t.id === nextTask.id) return { ...t, position: newPosition }
          return t
        }),
      )
    }
  }

  const handleMoveHorizon = async (task: Task, direction: "up" | "down") => {
    const currentIndex = horizonOrder.indexOf(task.time_horizon)
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    const targetHorizon = horizonOrder[nextIndex]
    if (!targetHorizon || task.time_horizon === targetHorizon) return

    const supabase = createClient()

    // If moving a parent task, also move all its subtasks
    const tasksToMove = task.parent_task_id === null
      ? [task, ...tasks.filter((t) => t.parent_task_id === task.id)]
      : [task]

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => {
        if (tasksToMove.some((tm) => tm.id === t.id)) {
          return { ...t, time_horizon: targetHorizon }
        }
        return t
      }),
    )

    try {
      // Update all tasks in batch
      for (const taskToMove of tasksToMove) {
        const { error } = await supabase
          .from("tasks")
          .update({ time_horizon: targetHorizon })
          .eq("id", taskToMove.id)

        if (error) throw error
      }
    } catch (err) {
      console.error("[v0] Error moving task to horizon:", err)
      // Revert
      setTasks((prev) =>
        prev.map((t) => {
          const originalTask = tasksToMove.find((tm) => tm.id === t.id)
          if (originalTask) {
            return { ...t, time_horizon: originalTask.time_horizon }
          }
          return t
        }),
      )
    }
  }

  const handleEdit = async (task: Task, newTitle: string) => {
    if (newTitle.trim() === task.title) return

    const supabase = createClient()

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, title: newTitle.trim() } : t)),
    )

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ title: newTitle.trim() })
        .eq("id", task.id)

      if (error) throw error
    } catch (err) {
      console.error("[v0] Error updating task title:", err)
      // Revert
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? task : t)),
      )
    }
  }

  const handleAddSubtask = async (parentTask: Task, title: string) => {
    if (!title.trim()) return

    const supabase = createClient()

    // Get the highest position for subtasks of this parent
    const existingSubtasks = tasks.filter((t) => t.parent_task_id === parentTask.id)
    const maxPosition = existingSubtasks.length > 0
      ? Math.max(...existingSubtasks.map((t) => t.position))
      : -1
    const newPosition = maxPosition + 1

    const newSubtask: Task = {
      id: crypto.randomUUID(), // Temporary ID
      user_id: userId,
      title: title.trim(),
      description: null,
      time_horizon: parentTask.time_horizon,
      completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      position: newPosition,
      parent_task_id: parentTask.id,
    }

    // Optimistic update
    setTasks((prev) => [...prev, newSubtask])

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title: title.trim(),
          description: null,
          time_horizon: parentTask.time_horizon,
          completed: false,
          parent_task_id: parentTask.id,
          position: newPosition,
        })
        .select()
        .single()

      if (error) throw error

      // Update with real ID from server
      setTasks((prev) =>
        prev.map((t) => (t.id === newSubtask.id ? (data as Task) : t)),
      )
    } catch (err) {
      console.error("[v0] Error creating subtask:", err)
      // Revert
      setTasks((prev) => prev.filter((t) => t.id !== newSubtask.id))
    }
  }

  const handleCreateTask = async (horizon: TimeHorizon, title: string) => {
    if (!title.trim()) return

    const supabase = createClient()

    // Get the highest position for top-level tasks in this horizon
    const topLevelTasks = tasks.filter((t) => t.time_horizon === horizon && !t.parent_task_id)
    const maxPosition = topLevelTasks.length > 0
      ? Math.max(...topLevelTasks.map((t) => t.position))
      : -1
    const newPosition = maxPosition + 1

    const newTask: Task = {
      id: crypto.randomUUID(), // Temporary ID
      user_id: userId,
      title: title.trim(),
      description: null,
      time_horizon: horizon,
      completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      position: newPosition,
      parent_task_id: null,
    }

    // Optimistic update
    setTasks((prev) => [...prev, newTask])
    setNewTaskInputs((prev) => ({ ...prev, [horizon]: "" }))

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title: title.trim(),
          description: null,
          time_horizon: horizon,
          completed: false,
          parent_task_id: null,
          position: newPosition,
        })
        .select()
        .single()

      if (error) throw error

      // Update with real ID from server
      setTasks((prev) =>
        prev.map((t) => (t.id === newTask.id ? (data as Task) : t)),
      )
    } catch (err) {
      console.error("[v0] Error creating task:", err)
      // Revert
      setTasks((prev) => prev.filter((t) => t.id !== newTask.id))
      setNewTaskInputs((prev) => ({ ...prev, [horizon]: title.trim() }))
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {horizons.map((horizon) => {
        const horizonTasks = organizedTasks[horizon.value]
        const hasInputValue = Boolean(newTaskInputs[horizon.value].trim())
        const isFocused = focusedHorizon === horizon.value

        return (
          <div key={horizon.value} className="mb-8">
            {/* Section heading */}
            <div className="mb-4 border-b border-border pb-2">
              <h2 className="text-xl font-semibold">{horizon.label}</h2>
            </div>

            {/* Task list */}
            <div className="flex flex-col">
              {horizonTasks.map((task) => {
                const isSubtask = task.parent_task_id !== null
                const topLevelTasks = organizedTasks[horizon.value].filter((t) => !t.parent_task_id)
                const currentTopLevelIndex = topLevelTasks.findIndex((t) => t.id === task.id)
                const canMoveUp = !isSubtask && currentTopLevelIndex > 0
                const canMoveDown = !isSubtask && currentTopLevelIndex >= 0 && currentTopLevelIndex < topLevelTasks.length - 1

                return (
                  <div key={task.id} className={isSubtask ? "ml-6" : ""}>
                    <TaskCard
                      task={task}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDelete}
                      isSubtask={isSubtask}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onMoveHorizon={handleMoveHorizon}
                      onEdit={handleEdit}
                      onAddSubtask={handleAddSubtask}
                      canMoveUp={canMoveUp}
                      canMoveDown={canMoveDown}
                    />
                  </div>
                )
              })}

              {/* Inline task creation */}
              <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-card/50 px-2 py-0.5">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Add a task..."
                  value={newTaskInputs[horizon.value]}
                  onChange={(e) =>
                    setNewTaskInputs((prev) => ({ ...prev, [horizon.value]: e.target.value }))
                  }
                  onFocus={() => setFocusedHorizon(horizon.value)}
                  onBlur={() => {
                    if (newTaskInputs[horizon.value].trim()) {
                      handleCreateTask(horizon.value, newTaskInputs[horizon.value])
                    } else {
                      setNewTaskInputs((prev) => ({ ...prev, [horizon.value]: "" }))
                    }
                    setFocusedHorizon(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      if (newTaskInputs[horizon.value].trim()) {
                        handleCreateTask(horizon.value, newTaskInputs[horizon.value])
                        requestAnimationFrame(() => inputRefs.current[horizon.value]?.focus())
                      }
                    } else if (e.key === "Escape") {
                      e.preventDefault()
                      setNewTaskInputs((prev) => ({ ...prev, [horizon.value]: "" }))
                      setFocusedHorizon(null)
                      inputRefs.current[horizon.value]?.blur()
                    }
                  }}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                  ref={(element) => {
                    inputRefs.current[horizon.value] = element
                  }}
                />
                {(isFocused || hasInputValue) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setNewTaskInputs((prev) => ({ ...prev, [horizon.value]: "" }))
                      setFocusedHorizon(null)
                      inputRefs.current[horizon.value]?.blur()
                    }}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Cancel</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
