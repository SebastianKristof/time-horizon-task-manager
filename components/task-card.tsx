"use client"

import type { Task, TimeHorizon } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, ChevronUp, ChevronDown, Pencil, MoveRight, Plus } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface TaskCardProps {
  task: Task
  onDragStart: (task: Task) => void
  onDragEnd: () => void
  onToggleComplete: (task: Task) => void
  onDelete: (taskId: string) => void
  isSubtask?: boolean
  onMoveUp?: (task: Task) => void
  onMoveDown?: (task: Task) => void
  onMoveHorizon?: (task: Task, horizon: TimeHorizon) => void
  onEdit?: (task: Task, newTitle: string) => void
  onAddSubtask?: (task: Task, title: string) => void
  canMoveUp?: boolean
  canMoveDown?: boolean
}

export function TaskCard({
  task,
  onDragStart,
  onDragEnd,
  onToggleComplete,
  onDelete,
  isSubtask = false,
  onMoveUp,
  onMoveDown,
  onMoveHorizon,
  onEdit,
  onAddSubtask,
  canMoveUp = true,
  canMoveDown = true,
}: TaskCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [subtaskTitle, setSubtaskTitle] = useState("")

  const handleEdit = () => {
    if (isEditing && editTitle.trim() && onEdit) {
      onEdit(task, editTitle.trim())
    }
    setIsEditing(!isEditing)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleEdit()
    } else if (e.key === "Escape") {
      setEditTitle(task.title)
      setIsEditing(false)
    }
  }

  const horizons: { value: TimeHorizon; label: string }[] = [
    { value: "now", label: "7 days" },
    { value: "soon", label: "30 days" },
    { value: "later", label: "180 days" },
    { value: "someday", label: "someday" },
  ]

  return (
    <div
      className={cn(
        "group relative rounded-lg bg-card p-3 transition-all",
        "hover:bg-accent/50",
        task.completed && "opacity-60",
        !isSubtask && "cursor-grab active:cursor-grabbing",
      )}
      draggable={!isSubtask}
      onDragStart={() => !isSubtask && onDragStart(task)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task)}
          className={cn(
            "size-5",
            task.completed
              ? "border-green-600 bg-green-600 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 data-[state=checked]:text-white"
              : "border-muted-foreground/80 bg-card",
          )}
        />

        {/* Task content */}
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleEdit}
              onKeyDown={handleKeyDown}
              className="w-full border-b border-primary bg-transparent font-medium outline-none focus:border-primary"
              autoFocus
            />
          ) : (
            <p
              className={cn(
                "font-medium leading-tight",
                task.completed && "line-through text-muted-foreground",
              )}
            >
              {task.title}
            </p>
          )}
          {task.description && !isEditing && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
          )}
          {isAddingSubtask && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && subtaskTitle.trim() && onAddSubtask) {
                    onAddSubtask(task, subtaskTitle.trim())
                    setSubtaskTitle("")
                    setIsAddingSubtask(false)
                  } else if (e.key === "Escape") {
                    setSubtaskTitle("")
                    setIsAddingSubtask(false)
                  }
                }}
                placeholder="Subtask title..."
                className="flex-1 border-b border-primary bg-transparent px-1 py-0.5 text-sm outline-none focus:border-primary"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Action buttons */}
        {showActions && !isEditing && (
          <div className="flex items-center gap-1">
            {!isSubtask && onMoveUp && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onMoveUp(task)}
                disabled={!canMoveUp}
              >
                <ChevronUp className="h-4 w-4" />
                <span className="sr-only">Move up</span>
              </Button>
            )}
            {!isSubtask && onMoveDown && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onMoveDown(task)}
                disabled={!canMoveDown}
              >
                <ChevronDown className="h-4 w-4" />
                <span className="sr-only">Move down</span>
              </Button>
            )}
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleEdit}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit task</span>
              </Button>
            )}
            {!isSubtask && onAddSubtask && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsAddingSubtask(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add subtask</span>
              </Button>
            )}
            {!isSubtask && onMoveHorizon && (
              <div className="relative group/horizon">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoveRight className="h-4 w-4" />
                  <span className="sr-only">Move to horizon</span>
                </Button>
                <div className="absolute right-0 top-full z-10 mt-1 hidden rounded-md border bg-popover p-1 shadow-md group-hover/horizon:block">
                  {horizons
                    .filter((h) => h.value !== task.time_horizon)
                    .map((horizon) => (
                      <button
                        key={horizon.value}
                        type="button"
                        onClick={() => onMoveHorizon(task, horizon.value)}
                        className="block w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                      >
                        {horizon.label}
                      </button>
                    ))}
                </div>
              </div>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(task.id)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete task</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
