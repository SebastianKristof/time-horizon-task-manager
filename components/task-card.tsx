"use client"

import type { Task, TimeHorizon } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
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
  onMoveHorizon?: (task: Task, direction: "up" | "down") => void
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
  const [originalTitle, setOriginalTitle] = useState(task.title)
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [subtaskTitle, setSubtaskTitle] = useState("")
  const editInputRef = useRef<HTMLInputElement | null>(null)
  const subtaskInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    if (!isEditing) {
      setEditTitle(task.title)
      setOriginalTitle(task.title)
    }
  }, [task.title, isEditing])

  useEffect(() => {
    if (isAddingSubtask && subtaskInputRef.current) {
      subtaskInputRef.current.focus()
    }
  }, [isAddingSubtask])

  const startEditing = () => {
    if (isEditing) return
    setOriginalTitle(task.title)
    setEditTitle(task.title)
    setIsEditing(true)
  }

  const saveEdit = () => {
    const trimmed = editTitle.trim()
    if (!trimmed) {
      setEditTitle(originalTitle)
      setIsEditing(false)
      return
    }
    if (trimmed !== originalTitle && onEdit) {
      onEdit(task, trimmed)
    }
    setIsEditing(false)
  }

  const cancelEdit = () => {
    setEditTitle(originalTitle)
    setIsEditing(false)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      saveEdit()
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelEdit()
    }
  }

  const horizonOrder: TimeHorizon[] = ["now", "soon", "later", "someday"]
  const currentHorizonIndex = horizonOrder.indexOf(task.time_horizon)
  const canMoveHorizonUp = currentHorizonIndex > 0
  const canMoveHorizonDown = currentHorizonIndex < horizonOrder.length - 1

  const handleSubtaskCreate = (keepOpen: boolean) => {
    const trimmed = subtaskTitle.trim()
    if (!trimmed || !onAddSubtask) return
    onAddSubtask(task, trimmed)
    setSubtaskTitle("")
    if (!keepOpen) {
      setIsAddingSubtask(false)
      return
    }
    requestAnimationFrame(() => subtaskInputRef.current?.focus())
  }

  return (
    <div
      className={cn(
        "group relative rounded-md px-2 py-0.5 bg-transparent transition-colors hover:bg-accent/30",
        task.completed && "opacity-60",
        !isSubtask && "cursor-grab active:cursor-grabbing",
      )}
      draggable={!isSubtask}
      onDragStart={() => !isSubtask && onDragStart(task)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          className={cn(
            "mt-0.5 flex items-center justify-center size-4 rounded border",
            task.completed ? "border-transparent" : "border-muted-foreground/80 bg-transparent",
          )}
        >
          {task.completed ? (
            <Check className="h-4 w-4 text-green-600 stroke-[5]" />
          ) : null}
        </button>

        {/* Task content */}
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                ref={editInputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={handleEditKeyDown}
                className="w-full border-b border-primary bg-transparent font-medium outline-none focus:border-primary"
              />
              <Button
                type="button"
                size="sm"
                className="h-7"
                onMouseDown={(e) => e.preventDefault()}
                onClick={saveEdit}
              >
                <Check className="h-4 w-4" />
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onMouseDown={(e) => e.preventDefault()}
                onClick={cancelEdit}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Cancel edit</span>
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  startEditing()
                }
              }}
              className={cn(
                "w-full text-left font-medium leading-tight text-foreground",
                task.completed && "text-muted-foreground",
              )}
            >
              {task.title}
            </button>
          )}
          {task.description && !isEditing && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
          )}
          {isAddingSubtask && (
            <div className="mt-2 flex items-center gap-2">
              <input
                ref={subtaskInputRef}
                type="text"
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    if (subtaskTitle.trim()) {
                      handleSubtaskCreate(true)
                    }
                  } else if (e.key === "Escape") {
                    e.preventDefault()
                    setSubtaskTitle("")
                    setIsAddingSubtask(false)
                  }
                }}
                onBlur={() => {
                  if (subtaskTitle.trim()) {
                    handleSubtaskCreate(false)
                  } else {
                    setIsAddingSubtask(false)
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
                  setSubtaskTitle("")
                  setIsAddingSubtask(false)
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Cancel subtask</span>
              </Button>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className={cn("flex items-center gap-1", (!showActions || isEditing) && "invisible")}>
            {!isSubtask && onMoveUp && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onMoveUp(task)}
                disabled={!canMoveUp}
              >
                <ChevronUp className="h-4 w-4" />
                <span className="sr-only">Move up in list</span>
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
                <span className="sr-only">Move down in list</span>
              </Button>
            )}
            {!isSubtask && onMoveHorizon && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onMoveHorizon(task, "up")}
                  disabled={!canMoveHorizonUp}
                >
                  <ArrowUp className="h-4 w-4" />
                  <span className="sr-only">Move to earlier horizon</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onMoveHorizon(task, "down")}
                  disabled={!canMoveHorizonDown}
                >
                  <ArrowDown className="h-4 w-4" />
                  <span className="sr-only">Move to later horizon</span>
                </Button>
              </>
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
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(task.id)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete task</span>
            </Button>
          </div>
      </div>
    </div>
  )
}
