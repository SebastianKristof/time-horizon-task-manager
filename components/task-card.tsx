"use client"

import type { Task, TimeHorizon } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react"
import { useEffect, useRef, useState, type MutableRefObject } from "react"
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
  onDragOverTask?: (targetTask: Task, insertBefore: boolean) => void
  draggedTask?: Task | null
  isFocused?: boolean
  onFocusTask?: (taskId: string) => void
  onNavigateKey?: (event: React.KeyboardEvent<HTMLDivElement>, task: Task) => void
  taskRef?: React.Ref<HTMLDivElement>
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
  onDragOverTask,
  draggedTask,
  isFocused = true,
  onFocusTask,
  onNavigateKey,
  taskRef,
}: TaskCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [originalTitle, setOriginalTitle] = useState(task.title)
  const editInputRef = useRef<HTMLInputElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
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
    if (!isEditing && isFocused) {
      requestAnimationFrame(() => {
        cardRef.current?.focus()
      })
    }
  }, [isEditing, isFocused])
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
    if ((e.key === "Enter" || e.key === "NumpadEnter") && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      saveEdit()
    } else if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
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
    if (!onDropOnTask || !draggedTask || draggedTask.id === task.id) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    e.preventDefault()
    e.stopPropagation()
    
    // Determine if we should insert before or after
    const rect = e.currentTarget.getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    const insertBefore = e.clientY < midpoint
    
    if (onDragOverTask) {
      onDragOverTask(task, insertBefore)
    }
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isEditing) return

    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault()
      onToggleComplete(task)
      return
    }

    if (e.key === "Enter" || e.key === "NumpadEnter") {
      e.preventDefault()
      startEditing()
      return
    }

    if ((e.key === "Backspace" || e.key === "Delete") && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      onDelete(task.id)
      return
    }

    if ((e.key === "s" || e.key === "S") && !isSubtask && onAddSubtask && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault()
      onAddSubtask(task)
      return
    }

    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault()
      if (e.key === "ArrowUp") {
        onMoveUp?.(task)
      } else {
        onMoveDown?.(task)
      }
      return
    }

    if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight") && onMoveHorizon) {
      e.preventDefault()
      onMoveHorizon(task, e.key === "ArrowLeft" ? "up" : "down")
      return
    }

    onNavigateKey?.(e, task)
  }

  const handleCardRef = (node: HTMLDivElement | null) => {
    cardRef.current = node
    if (typeof taskRef === "function") {
      taskRef(node)
    } else if (taskRef && "current" in taskRef) {
      ;(taskRef as MutableRefObject<HTMLDivElement | null>).current = node
    }
  }

  const shouldEditOnClick = () => {
    if (task.completed) return false
    return lastPointerTypeRef.current !== "mouse"
  }

  return (
    <div
      ref={handleCardRef}
      className={cn(
        "group relative rounded-md px-2 py-0.5 bg-transparent transition-colors hover:bg-accent/30",
        task.completed && "opacity-60",
        "cursor-grab active:cursor-grabbing",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-within:ring-2 focus-within:ring-primary/30",
      )}
      draggable
      style={{ touchAction: "manipulation" }}
      tabIndex={isFocused ? 0 : -1}
      role="listitem"
      aria-label={task.title}
      aria-keyshortcuts="Enter Space ArrowUp ArrowDown ArrowLeft ArrowRight A S Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight"
      onFocus={() => onFocusTask?.(task.id)}
      onKeyDown={handleKeyDown}
      onDragStart={(e) => {
        if (lastPointerTypeRef.current && lastPointerTypeRef.current !== "mouse" && !allowDragRef.current) {
          e.preventDefault()
          return
        }
        
        // Create a custom drag image that appears on the right side
        const dragImage = document.createElement("div")
        dragImage.style.position = "absolute"
        dragImage.style.top = "-1000px"
        dragImage.style.left = "-1000px"
        dragImage.style.width = "200px"
        dragImage.style.padding = "8px 12px"
        dragImage.style.backgroundColor = "hsl(var(--background))"
        dragImage.style.border = "1px solid hsl(var(--border))"
        dragImage.style.borderRadius = "6px"
        dragImage.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)"
        dragImage.style.fontSize = "14px"
        dragImage.style.fontWeight = "500"
        dragImage.style.color = "hsl(var(--foreground))"
        dragImage.textContent = task.title
        document.body.appendChild(dragImage)
        
        // Set the drag image offset to the right (positive x offset)
        // This makes it appear to the right of the cursor/finger
        e.dataTransfer.setDragImage(dragImage, 20, 10)
        
        // Clean up after a short delay
        setTimeout(() => {
          document.body.removeChild(dragImage)
        }, 0)
        
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
          tabIndex={-1}
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
                  {onAddSubtask && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 px-2"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onAddSubtask(task)}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Subtask</span>
                    </Button>
                  )}
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
                if (!shouldEditOnClick()) return
                if (skipEditClickRef.current) {
                  skipEditClickRef.current = false
                  return
                }
                startEditing()
              }}
              onDoubleClick={() => {
                if (task.completed) return
                if (lastPointerTypeRef.current !== "mouse") return
                startEditing()
              }}
              onKeyDown={(e) => {
                if (task.completed) return // Don't allow editing completed tasks
                if (e.key === "Enter") {
                  e.preventDefault()
                  startEditing()
                }
              }}
              tabIndex={-1}
              className={cn(
                "w-full text-left font-medium leading-tight text-foreground break-words cursor-grab active:cursor-grabbing",
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
          !isEditing && "md:invisible md:group-hover:visible md:group-focus-within:visible"
        )}>
            {onMoveUp && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onMoveUp(task)}
                disabled={!canMoveUp}
                tabIndex={-1}
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
                tabIndex={-1}
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
                  tabIndex={-1}
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
                  tabIndex={-1}
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
                tabIndex={-1}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add subtask</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onDelete(task.id)}
              tabIndex={-1}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete task</span>
            </Button>
          </div>
      </div>
    </div>
  )
}
