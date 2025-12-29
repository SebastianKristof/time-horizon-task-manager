"use client"

import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2 } from "lucide-react"
import { useState } from "react"

interface TaskCardProps {
  task: Task
  onDragStart: (task: Task) => void
  onDragEnd: () => void
  onToggleComplete: (task: Task) => void
  onDelete: (taskId: string) => void
}

export function TaskCard({ task, onDragStart, onDragEnd, onToggleComplete, onDelete }: TaskCardProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className={`group relative rounded-lg border bg-card p-3 transition-all hover:border-muted-foreground/50 ${
        task.completed ? "opacity-60" : ""
      }`}
      draggable
      onDragStart={() => onDragStart(task)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task)}
          className={task.completed ? "border-[var(--color-completed)] bg-[var(--color-completed)]" : ""}
        />

        {/* Task content */}
        <div className="flex-1 cursor-grab active:cursor-grabbing">
          <p
            className={`font-medium leading-tight ${task.completed ? "text-[var(--color-completed)] line-through" : ""}`}
          >
            {task.title}
          </p>
          {task.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.description}</p>}
        </div>

        {/* Delete button */}
        {showActions && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-3 w-3" />
            <span className="sr-only">Delete task</span>
          </Button>
        )}
      </div>
    </div>
  )
}
