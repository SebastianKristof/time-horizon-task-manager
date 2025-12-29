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
  onAddSubtask?: (task: Task) => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  onDropOnTask?: (targetTask: Task, insertBefore: boolean) => void
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
  onDropOnTask,
}: TaskCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [originalTitle, setOriginalTitle] = useState(task.title)
  const editInputRef = useRef<HTMLInputElement | null>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const skipEditClickRef = useRef(false)
  const allowDragRef = useRef(false)
  const lastPointerTypeRef = useRef<"mouse" | "touch" | "pen" | null>(null)

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


  const startEditing = () => {
    if (isEditing || task.completed) return // Don't allow editing completed tasks
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


  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isEditing) return
    lastPointerTypeRef.current = e.pointerType
    skipEditClickRef.current = false
    if (e.pointerType === "mouse") {
      allowDragRef.current = true
      return
    }
    allowDragRef.current = false
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current)
    }
    longPressTimerRef.current = window.setTimeout(() => {
      allowDragRef.current = true
      skipEditClickRef.current = true
    }, 220)
  }

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current)
    }
    allowDragRef.current = false
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!onDropOnTask) return
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    if (!onDropOnTask) return
    e.preventDefault()
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    // If dropped exactly on the task (within 5px of midpoint), default to insertBefore
    const isExactlyOnTask = Math.abs(e.clientY - midpoint) < 5
    const insertBefore = isExactlyOnTask || e.clientY < midpoint
    
    onDropOnTask(task, insertBefore)
  }

  return (
    <div
      className={cn(
        "group relative rounded-md px-2 py-0.5 bg-transparent transition-colors hover:bg-accent/30",
        task.completed && "opacity-60",
        "cursor-grab active:cursor-grabbing",
      )}
      draggable
      style={{ touchAction: "manipulation" }}
      onDragStart={(e) => {
        if (lastPointerTypeRef.current && lastPointerTypeRef.current !== "mouse" && !allowDragRef.current) {
          e.preventDefault()
          return
        }
        onDragStart(task)
      }}
      onDragEnd={() => {
        allowDragRef.current = false
        skipEditClickRef.current = false
        onDragEnd()
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
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
            <div className="flex flex-col gap-2">
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
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={cancelEdit}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Cancel</span>
                </Button>
              </div>
              {/* Action buttons - second row on mobile only */}
              {!isSubtask && onMoveHorizon && (
                <div className="flex md:hidden items-center gap-1">
                  {[
                    { value: "now" as TimeHorizon, label: "7d" },
                    { value: "soon" as TimeHorizon, label: "30d" },
                    { value: "later" as TimeHorizon, label: "180d" },
                    { value: "someday" as TimeHorizon, label: "∞" },
                  ].map((option) => {
                    const targetHorizonIndex = horizonOrder.indexOf(option.value)
                    const steps = Math.abs(targetHorizonIndex - currentHorizonIndex)
                    const direction = targetHorizonIndex < currentHorizonIndex ? "up" : "down"
                    
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={async () => {
                          // Move to target horizon by calling onMoveHorizon multiple times
                          if (steps === 0) return
                          for (let i = 0; i < steps; i++) {
                            await onMoveHorizon(task, direction)
                          }
                        }}
                        className={cn(
                          "min-w-[2.25rem] rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                          task.time_horizon === option.value
                            ? "border-primary bg-accent"
                            : "border-border bg-background hover:border-muted-foreground/60"
                        )}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 ml-auto" 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onDelete(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete task</span>
                  </Button>
                </div>
              )}
              {isSubtask && (
                <div className="flex md:hidden items-center gap-1 justify-end">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onDelete(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete subtask</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (task.completed) return // Don't allow editing completed tasks
                if (skipEditClickRef.current) {
                  skipEditClickRef.current = false
                  return
                }
                startEditing()
              }}
              onKeyDown={(e) => {
                if (task.completed) return // Don't allow editing completed tasks
                if (e.key === "Enter") {
                  e.preventDefault()
                  startEditing()
                }
              }}
              className={cn(
                "w-full text-left font-medium leading-tight text-foreground break-words",
                task.completed && "text-muted-foreground cursor-default",
              )}
            >
              {task.title}
            </button>
          )}
          {task.description && !isEditing && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
          )}
        </div>

        {/* Action buttons - desktop only: show on hover (never show on mobile) */}
        <div className={cn(
          "hidden md:flex items-center gap-1",
          !isEditing && "md:invisible md:group-hover:visible"
        )}>
            {onMoveUp && (
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
            {onMoveDown && (
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
                onClick={() => onAddSubtask(task)}
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
