"use client"

import type { TimeHorizon } from "@/lib/types"
import type React from "react"
import { useState } from "react"

interface HorizonColumnProps {
  horizon: { value: TimeHorizon; label: string; description: string }
  tasks: unknown[]
  onDrop: (horizon: TimeHorizon) => void
  isDragging: boolean
  children: React.ReactNode
}

export function HorizonColumn({ horizon, tasks, onDrop, isDragging, children }: HorizonColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    onDrop(horizon.value)
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-4 transition-colors ${
        isDragOver ? "border-primary bg-accent" : "border-border bg-card"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="flex flex-col gap-1 border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{horizon.label}</h2>
          <span className="text-sm text-muted-foreground">{tasks.length}</span>
        </div>
        <p className="text-xs text-muted-foreground">{horizon.description}</p>
      </div>

      {/* Task list */}
      <div className="flex min-h-[200px] flex-col gap-2">
        {tasks.length === 0 && !isDragging && (
          <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
            No tasks in this horizon
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
