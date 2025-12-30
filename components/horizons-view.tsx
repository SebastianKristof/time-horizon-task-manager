"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Task, TimeHorizon } from "@/lib/types"
import { TaskCard } from "@/components/task-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [subtaskInputParentId, setSubtaskInputParentId] = useState<string | null>(null)
  const [subtaskInputValue, setSubtaskInputValue] = useState("")
  const subtaskInputRef = useRef<HTMLInputElement | null>(null)
  const [dropIndicator, setDropIndicator] = useState<{ taskId: string; insertBefore: boolean } | null>(null)
  const inputRefs = useRef<Record<TimeHorizon, HTMLInputElement | null>>({
    now: null,
    soon: null,
    later: null,
    someday: null,
  })

  useEffect(() => {
    if (subtaskInputParentId && subtaskInputRef.current) {
      subtaskInputRef.current.focus()
    }
  }, [subtaskInputParentId])

  // Clear drop indicator when drag ends (when draggedTask becomes null)
  useEffect(() => {
    if (!draggedTask) {
      setDropIndicator(null)
      lastDropIndicatorRef.current = null
    }
  }, [draggedTask])

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

  const lastDropIndicatorRef = useRef<{ taskId: string; insertBefore: boolean } | null>(null)

  const handleDragEnd = () => {
    setDraggedTask(null)
    // Drop indicator will be cleared by the useEffect when draggedTask becomes null
  }

  const handleDragOverTask = (targetTask: Task, insertBefore: boolean) => {
    if (!draggedTask || draggedTask.id === targetTask.id) {
      setDropIndicator(null)
      lastDropIndicatorRef.current = null
      return
    }

    // Check if this is a valid drop target
    const isValidDrop = 
      // Subtask reordering: both must be subtasks of same parent
      (draggedTask.parent_task_id !== null && targetTask.parent_task_id !== null && 
       draggedTask.parent_task_id === targetTask.parent_task_id) ||
      // Top-level task reordering: both must be top-level
      (draggedTask.parent_task_id === null && targetTask.parent_task_id === null)

    if (isValidDrop) {
      const newIndicator = { taskId: targetTask.id, insertBefore }
      // Only trigger haptic feedback when entering a new valid drop zone
      const hasChanged = 
        !lastDropIndicatorRef.current ||
        lastDropIndicatorRef.current.taskId !== newIndicator.taskId ||
        lastDropIndicatorRef.current.insertBefore !== newIndicator.insertBefore
      
      if (hasChanged && 'vibrate' in navigator) {
        navigator.vibrate(10) // Short vibration
      }
      
      setDropIndicator(newIndicator)
      lastDropIndicatorRef.current = newIndicator
    } else {
      setDropIndicator(null)
      lastDropIndicatorRef.current = null
    }
  }

  const handleDropOnTask = async (targetTask: Task, insertBefore: boolean) => {
    if (!draggedTask || draggedTask.id === targetTask.id) {
      setDraggedTask(null)
      setDropIndicator(null)
      return
    }

    // Handle subtask reordering - both must be subtasks of the same parent
    if (draggedTask.parent_task_id !== null && targetTask.parent_task_id !== null) {
      if (draggedTask.parent_task_id === targetTask.parent_task_id) {
        // Both are subtasks of the same parent - allow reordering
        await handleReorderSubtasks(draggedTask, targetTask, insertBefore)
        setDraggedTask(null)
        setDropIndicator(null)
        return
      } else {
        // Different parents - don't allow
        setDraggedTask(null)
        setDropIndicator(null)
        return
      }
    }

    // Only allow reordering top-level tasks with top-level tasks
    if (draggedTask.parent_task_id !== null || targetTask.parent_task_id !== null) {
      setDraggedTask(null)
      setDropIndicator(null)
      return
    }

    // If same horizon, reorder within horizon
    if (draggedTask.time_horizon === targetTask.time_horizon) {
      await handleReorderWithinHorizon(draggedTask, targetTask, insertBefore)
      setDraggedTask(null)
      setDropIndicator(null)
      return
    }

    // Different horizon - move to new horizon at specific position
    await handleDropToHorizonAtPosition(targetTask.time_horizon, targetTask, insertBefore)
    setDropIndicator(null)
  }

  const handleReorderSubtasks = async (draggedTask: Task, targetTask: Task, insertBefore: boolean) => {
    if (!draggedTask.parent_task_id || draggedTask.parent_task_id !== targetTask.parent_task_id) {
      setDraggedTask(null)
      return
    }

    const supabase = createClient()
    const parentId = draggedTask.parent_task_id
    
    // Get all subtasks of the same parent, excluding the dragged task
    const siblingSubtasks = tasks.filter(
      (t) => t.parent_task_id === parentId && t.id !== draggedTask.id,
    )
    siblingSubtasks.sort((a, b) => a.position - b.position)

    const targetIndex = siblingSubtasks.findIndex((t) => t.id === targetTask.id)
    if (targetIndex === -1) {
      setDraggedTask(null)
      return
    }

    // Build the new order
    const reorderedTasks: Task[] = []
    
    if (insertBefore) {
      // Insert before target
      reorderedTasks.push(...siblingSubtasks.slice(0, targetIndex))
      reorderedTasks.push(draggedTask)
      reorderedTasks.push(...siblingSubtasks.slice(targetIndex))
    } else {
      // Insert after target
      reorderedTasks.push(...siblingSubtasks.slice(0, targetIndex + 1))
      reorderedTasks.push(draggedTask)
      reorderedTasks.push(...siblingSubtasks.slice(targetIndex + 1))
    }

    // Assign new positions (0, 1, 2, ...)
    const positionUpdates = reorderedTasks.map((task, index) => ({
      id: task.id,
      position: index,
    }))

    // Store original positions for revert
    const originalPositions = new Map(reorderedTasks.map((t) => [t.id, t.position]))

    // Optimistic update
    setTasks((prev) =>
      prev.map((task) => {
        const update = positionUpdates.find((u) => u.id === task.id)
        return update ? { ...task, position: update.position } : task
      }),
    )

    try {
      // Update all positions
      for (const update of positionUpdates) {
        const { error } = await supabase.from("tasks").update({ position: update.position }).eq("id", update.id)
        if (error) throw error
      }
    } catch (err) {
      console.error("[v0] Error reordering subtasks:", err)
      // Revert
      setTasks((prev) =>
        prev.map((task) => {
          const originalPos = originalPositions.get(task.id)
          return originalPos !== undefined ? { ...task, position: originalPos } : task
        }),
      )
    }
  }

  const handleReorderWithinHorizon = async (draggedTask: Task, targetTask: Task, insertBefore: boolean) => {
    const supabase = createClient()
    
    // Get all top-level tasks in the same horizon, excluding the dragged task
    const topLevelTasks = tasks.filter(
      (t) => t.time_horizon === draggedTask.time_horizon && t.parent_task_id === null && t.id !== draggedTask.id,
    )
    topLevelTasks.sort((a, b) => a.position - b.position)

    const targetIndex = topLevelTasks.findIndex((t) => t.id === targetTask.id)
    if (targetIndex === -1) {
      setDraggedTask(null)
      return
    }

    // Build the new order
    const reorderedTasks: Task[] = []
    
    if (insertBefore) {
      // Insert before target
      reorderedTasks.push(...topLevelTasks.slice(0, targetIndex))
      reorderedTasks.push(draggedTask)
      reorderedTasks.push(...topLevelTasks.slice(targetIndex))
    } else {
      // Insert after target
      reorderedTasks.push(...topLevelTasks.slice(0, targetIndex + 1))
      reorderedTasks.push(draggedTask)
      reorderedTasks.push(...topLevelTasks.slice(targetIndex + 1))
    }

    // Assign new positions (0, 1, 2, ...)
    const positionUpdates = reorderedTasks.map((task, index) => ({
      id: task.id,
      position: index,
    }))

    // Store original positions for revert
    const originalPositions = new Map(reorderedTasks.map((t) => [t.id, t.position]))

    // Optimistic update
    setTasks((prev) =>
      prev.map((task) => {
        const update = positionUpdates.find((u) => u.id === task.id)
        return update ? { ...task, position: update.position } : task
      }),
    )

    try {
      // Update all positions
      for (const update of positionUpdates) {
        const { error } = await supabase.from("tasks").update({ position: update.position }).eq("id", update.id)
        if (error) throw error
      }
    } catch (err) {
      console.error("[v0] Error reordering tasks:", err)
      // Revert
      setTasks((prev) =>
        prev.map((task) => {
          const originalPos = originalPositions.get(task.id)
          return originalPos !== undefined ? { ...task, position: originalPos } : task
        }),
      )
    }
  }

  const handleDropToHorizonAtPosition = async (
    targetHorizon: TimeHorizon,
    targetTask: Task,
    insertBefore: boolean,
  ) => {
    if (!draggedTask || draggedTask.time_horizon === targetHorizon) {
      setDraggedTask(null)
      return
    }

    const supabase = createClient()

    // If moving a parent task, also move all its subtasks
    const tasksToMove = draggedTask.parent_task_id === null
      ? [draggedTask, ...tasks.filter((t) => t.parent_task_id === draggedTask.id)]
      : [draggedTask]

    // Get all top-level tasks in target horizon, excluding the dragged task
    const topLevelTasksInTarget = tasks.filter(
      (t) => t.time_horizon === targetHorizon && !t.parent_task_id && !tasksToMove.some((tm) => tm.id === t.id),
    )
    topLevelTasksInTarget.sort((a, b) => a.position - b.position)

    const targetIndex = topLevelTasksInTarget.findIndex((t) => t.id === targetTask.id)
    
    // Build the new order with dragged task inserted at the correct position
    const reorderedTasks: Task[] = []
    
    if (targetIndex === -1) {
      // Target task not found, append to end
      reorderedTasks.push(...topLevelTasksInTarget)
      reorderedTasks.push(draggedTask)
    } else {
      // Insert at specific position
      if (insertBefore) {
        // Insert before target
        reorderedTasks.push(...topLevelTasksInTarget.slice(0, targetIndex))
        reorderedTasks.push(draggedTask)
        reorderedTasks.push(...topLevelTasksInTarget.slice(targetIndex))
      } else {
        // Insert after target
        reorderedTasks.push(...topLevelTasksInTarget.slice(0, targetIndex + 1))
        reorderedTasks.push(draggedTask)
        reorderedTasks.push(...topLevelTasksInTarget.slice(targetIndex + 1))
      }
    }

    // Assign new positions (0, 1, 2, ...)
    const positionUpdates = reorderedTasks.map((task, index) => ({
      id: task.id,
      position: index,
    }))

    // Store original positions for revert
    const originalPositions = new Map(
      tasksToMove.map((t) => [t.id, { horizon: t.time_horizon, position: t.position }]),
    )
    const originalTargetPositions = new Map(
      topLevelTasksInTarget.map((t) => [t.id, t.position]),
    )

    // Optimistic update
    setTasks((prev) =>
      prev.map((task) => {
        // Update dragged task and its subtasks
        if (tasksToMove.some((tm) => tm.id === task.id)) {
          const update = positionUpdates.find((u) => u.id === task.id)
          if (update) {
            return { ...task, time_horizon: targetHorizon, position: update.position }
          }
          // Subtasks just get horizon updated
          return { ...task, time_horizon: targetHorizon }
        }
        // Update positions of tasks in target horizon
        const update = positionUpdates.find((u) => u.id === task.id)
        if (update) {
          return { ...task, position: update.position }
        }
        return task
      }),
    )

    try {
      // Update all tasks in batch
      for (const update of positionUpdates) {
        const taskToUpdate = tasks.find((t) => t.id === update.id)
        if (!taskToUpdate) continue

        const updateData: { time_horizon?: TimeHorizon; position: number } = {
          position: update.position,
        }

        // If this is the dragged task or one of its subtasks, also update horizon
        if (tasksToMove.some((tm) => tm.id === update.id)) {
          updateData.time_horizon = targetHorizon
        }

        const { error } = await supabase
          .from("tasks")
          .update(updateData)
          .eq("id", update.id)

        if (error) throw error
      }
    } catch (err) {
      console.error("[v0] Error updating task horizon:", err)
      // Revert optimistic update on error
      setTasks((prev) =>
        prev.map((task) => {
          const original = originalPositions.get(task.id)
          if (original) {
            return { ...task, time_horizon: original.horizon, position: original.position }
          }
          const originalPos = originalTargetPositions.get(task.id)
          if (originalPos !== undefined) {
            return { ...task, position: originalPos }
          }
          return task
        }),
      )
    }

    setDraggedTask(null)
  }

  const handleDrop = async (targetHorizon: TimeHorizon) => {
    if (!draggedTask || draggedTask.time_horizon === targetHorizon) {
      setDraggedTask(null)
      setDropIndicator(null)
      return
    }

    const supabase = createClient()

    // If moving a parent task, also move all its subtasks
    const tasksToMove = draggedTask.parent_task_id === null
      ? [draggedTask, ...tasks.filter((t) => t.parent_task_id === draggedTask.id)]
      : [draggedTask]

    // Calculate new position for the moved task (at the end of the target horizon)
    const topLevelTasksInTarget = tasks.filter(
      (t) => t.time_horizon === targetHorizon && !t.parent_task_id && !tasksToMove.some((tm) => tm.id === t.id),
    )
    const maxPosition = topLevelTasksInTarget.length > 0
      ? Math.max(...topLevelTasksInTarget.map((t) => t.position))
      : -1
    const newPosition = maxPosition + 1

    // Optimistic update
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === draggedTask.id) {
          return { ...task, time_horizon: targetHorizon, position: newPosition }
        }
        if (tasksToMove.some((tm) => tm.id === task.id)) {
          return { ...task, time_horizon: targetHorizon }
        }
        return task
      }),
    )

    try {
      // Update all tasks in batch
      for (const taskToMove of tasksToMove) {
        const updateData: { time_horizon: TimeHorizon; position?: number } = {
          time_horizon: targetHorizon,
        }
        // Only update position for the main task (not subtasks)
        if (taskToMove.id === draggedTask.id) {
          updateData.position = newPosition
        }

        const { error } = await supabase
          .from("tasks")
          .update(updateData)
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
            return { ...task, time_horizon: originalTask.time_horizon, position: originalTask.position }
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
    const supabase = createClient()
    
    // Get tasks in the same group (top-level or subtasks of the same parent)
    const siblingTasks = tasks.filter((t) => {
      if (task.parent_task_id === null) {
        // Top-level task - get other top-level tasks in same horizon
        return t.time_horizon === task.time_horizon && t.parent_task_id === null
      } else {
        // Subtask - get other subtasks of the same parent
        return t.parent_task_id === task.parent_task_id
      }
    })
    siblingTasks.sort((a, b) => a.position - b.position)

    const currentIndex = siblingTasks.findIndex((t) => t.id === task.id)
    if (currentIndex <= 0) return // Already at top

    const previousTask = siblingTasks[currentIndex - 1]
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
    const supabase = createClient()
    
    // Get tasks in the same group (top-level or subtasks of the same parent)
    const siblingTasks = tasks.filter((t) => {
      if (task.parent_task_id === null) {
        // Top-level task - get other top-level tasks in same horizon
        return t.time_horizon === task.time_horizon && t.parent_task_id === null
      } else {
        // Subtask - get other subtasks of the same parent
        return t.parent_task_id === task.parent_task_id
      }
    })
    siblingTasks.sort((a, b) => a.position - b.position)

    const currentIndex = siblingTasks.findIndex((t) => t.id === task.id)
    if (currentIndex < 0 || currentIndex >= siblingTasks.length - 1) return // Already at bottom

    const nextTask = siblingTasks[currentIndex + 1]
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

  const handleAddSubtask = async (parentTask: Task, title: string, keepInputOpen: boolean = false) => {
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
    setSubtaskInputValue("")

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

      // Keep input open if requested (for Enter key behavior)
      if (keepInputOpen) {
        requestAnimationFrame(() => subtaskInputRef.current?.focus())
      } else {
        setSubtaskInputParentId(null)
      }
    } catch (err) {
      console.error("[v0] Error creating subtask:", err)
      // Revert
      setTasks((prev) => prev.filter((t) => t.id !== newSubtask.id))
      setSubtaskInputParentId(null)
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
            <div
              className="flex flex-col"
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (draggedTask) {
                  handleDrop(horizon.value)
                }
                setDropIndicator(null)
              }}
            >
              {horizonTasks.map((task, taskIndex) => {
                const isSubtask = task.parent_task_id !== null
                
                // Calculate canMoveUp and canMoveDown
                let canMoveUp = false
                let canMoveDown = false
                
                if (isSubtask) {
                  // For subtasks, check position within parent's subtasks
                  const siblingSubtasks = horizonTasks.filter(
                    (t) => t.parent_task_id === task.parent_task_id
                  )
                  siblingSubtasks.sort((a, b) => a.position - b.position)
                  const currentSubtaskIndex = siblingSubtasks.findIndex((t) => t.id === task.id)
                  canMoveUp = currentSubtaskIndex > 0
                  canMoveDown = currentSubtaskIndex >= 0 && currentSubtaskIndex < siblingSubtasks.length - 1
                } else {
                  // For top-level tasks, check position within horizon
                  const topLevelTasks = organizedTasks[horizon.value].filter((t) => !t.parent_task_id)
                  const currentTopLevelIndex = topLevelTasks.findIndex((t) => t.id === task.id)
                  canMoveUp = currentTopLevelIndex > 0
                  canMoveDown = currentTopLevelIndex >= 0 && currentTopLevelIndex < topLevelTasks.length - 1
                }

                // Determine if we should show the subtask input after this task
                // Show input after the last subtask of a parent, or after a parent with no subtasks
                const isParentTask = !task.parent_task_id
                let showSubtaskInput = false
                
                if (subtaskInputParentId) {
                  if (isParentTask && task.id === subtaskInputParentId) {
                    // Check if this parent has any subtasks
                    const parentSubtasks = horizonTasks.filter((t) => t.parent_task_id === task.id)
                    // Show input after parent if it has no subtasks, or we'll show it after the last subtask
                    showSubtaskInput = parentSubtasks.length === 0
                  } else if (isSubtask && task.parent_task_id === subtaskInputParentId) {
                    // Show input after the last subtask of this parent
                    const nextTask = horizonTasks[taskIndex + 1]
                    showSubtaskInput = !nextTask || nextTask.parent_task_id !== subtaskInputParentId
                  }
                }

                const showDropIndicatorAbove = draggedTask && dropIndicator?.taskId === task.id && dropIndicator.insertBefore
                const showDropIndicatorBelow = draggedTask && dropIndicator?.taskId === task.id && !dropIndicator.insertBefore

                return (
                  <div key={task.id}>
                    {showDropIndicatorAbove && (
                      <div className={cn("h-0.5 bg-primary/30 rounded-full", isSubtask ? "ml-6" : "")} />
                    )}
                    <div className={isSubtask ? "ml-6" : ""}>
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
                        onAddSubtask={(parentTask) => {
                          setSubtaskInputParentId(parentTask.id)
                          setSubtaskInputValue("")
                        }}
                        canMoveUp={canMoveUp}
                        canMoveDown={canMoveDown}
                        onDropOnTask={handleDropOnTask}
                        onDragOverTask={handleDragOverTask}
                        draggedTask={draggedTask}
                      />
                    </div>
                    {showDropIndicatorBelow && (
                      <div className={cn("h-0.5 bg-primary/30 rounded-full", isSubtask ? "ml-6" : "")} />
                    )}
                    {showSubtaskInput && (
                      <div className="ml-6 mt-1 flex items-center gap-2">
                        <input
                          ref={subtaskInputRef}
                          type="text"
                          value={subtaskInputValue}
                          onChange={(e) => setSubtaskInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              if (subtaskInputValue.trim() && subtaskInputParentId) {
                                const parentTask = horizonTasks.find((t) => t.id === subtaskInputParentId)
                                if (parentTask) {
                                  handleAddSubtask(parentTask, subtaskInputValue, true)
                                }
                              }
                            } else if (e.key === "Escape") {
                              e.preventDefault()
                              setSubtaskInputValue("")
                              setSubtaskInputParentId(null)
                            }
                          }}
                          onBlur={() => {
                            if (subtaskInputValue.trim() && subtaskInputParentId) {
                              const parentTask = horizonTasks.find((t) => t.id === subtaskInputParentId)
                              if (parentTask) {
                                handleAddSubtask(parentTask, subtaskInputValue, false)
                              }
                            } else {
                              setSubtaskInputParentId(null)
                            }
                          }}
                          placeholder="Subtask title..."
                          className="flex-1 border-b border-primary bg-transparent px-1 py-0.5 text-sm outline-none focus:border-primary"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSubtaskInputValue("")
                            setSubtaskInputParentId(null)
                          }}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Cancel subtask</span>
                        </Button>
                      </div>
                    )}
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
                        // Don't re-focus - let the input stay focused naturally
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
