"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Task, TimeHorizon } from "@/lib/types"
import { HorizonColumn } from "@/components/horizon-column"
import { TaskCard } from "@/components/task-card"

interface HorizonsViewProps {
  initialTasks: Task[]
  userId: string
}

const horizons: { value: TimeHorizon; label: string; description: string }[] = [
  { value: "now", label: "Now", description: "This week" },
  { value: "soon", label: "Soon", description: "Next few weeks" },
  { value: "later", label: "Later", description: "Next few months" },
  { value: "someday", label: "Someday", description: "No timeline" },
]

export function HorizonsView({ initialTasks, userId }: HorizonsViewProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

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
            setTasks((prev) => [payload.new as Task, ...prev])
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

    // Optimistic update
    setTasks((prev) =>
      prev.map((task) => (task.id === draggedTask.id ? { ...task, time_horizon: targetHorizon } : task)),
    )

    try {
      const { error } = await supabase.from("tasks").update({ time_horizon: targetHorizon }).eq("id", draggedTask.id)

      if (error) throw error
    } catch (err) {
      console.error("[v0] Error updating task horizon:", err)
      // Revert optimistic update on error
      setTasks((prev) =>
        prev.map((task) => (task.id === draggedTask.id ? { ...task, time_horizon: draggedTask.time_horizon } : task)),
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

    // Optimistic update
    setTasks((prev) => prev.filter((task) => task.id !== taskId))

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId)

      if (error) throw error
    } catch (err) {
      console.error("[v0] Error deleting task:", err)
      // Could revert here, but for delete it's better to just show an error
    }
  }

  // Group tasks by horizon
  const tasksByHorizon = horizons.reduce(
    (acc, horizon) => {
      acc[horizon.value] = tasks.filter((task) => task.time_horizon === horizon.value)
      return acc
    },
    {} as Record<TimeHorizon, Task[]>,
  )

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {horizons.map((horizon) => (
        <HorizonColumn
          key={horizon.value}
          horizon={horizon}
          tasks={tasksByHorizon[horizon.value]}
          onDrop={handleDrop}
          isDragging={draggedTask !== null}
        >
          {tasksByHorizon[horizon.value].map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
            />
          ))}
        </HorizonColumn>
      ))}
    </div>
  )
}
