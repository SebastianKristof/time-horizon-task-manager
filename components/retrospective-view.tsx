"use client"

import Link from "next/link"
import { useMemo } from "react"
import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { format, parseISO, startOfMonth } from "date-fns"

interface RetrospectiveViewProps {
  initialTasks: Task[]
  userId: string
}

export function RetrospectiveView({ initialTasks }: RetrospectiveViewProps) {
  // Group tasks by month
  const tasksByMonth = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    const unknownDate: Task[] = []

    initialTasks.forEach((task) => {
      // Use completed_at, fallback to updated_at if null
      const dateString = task.completed_at || task.updated_at
      
      if (!dateString) {
        unknownDate.push(task)
        return
      }

      try {
        const date = parseISO(dateString)
        const monthKey = format(startOfMonth(date), "yyyy-MM")
        const monthLabel = format(date, "MMMM yyyy")

        if (!grouped[monthKey]) {
          grouped[monthKey] = []
        }
        grouped[monthKey].push(task)
      } catch {
        // Invalid date, add to unknown
        unknownDate.push(task)
      }
    })

    // Sort tasks within each month by completed_at (descending), with fallback to updated_at
    Object.keys(grouped).forEach((monthKey) => {
      grouped[monthKey].sort((a, b) => {
        const dateA = parseISO(a.completed_at || a.updated_at || "")
        const dateB = parseISO(b.completed_at || b.updated_at || "")
        return dateB.getTime() - dateA.getTime()
      })
    })

    // Sort unknown date tasks by updated_at (descending)
    unknownDate.sort((a, b) => {
      const dateA = parseISO(a.updated_at)
      const dateB = parseISO(b.updated_at)
      return dateB.getTime() - dateA.getTime()
    })

    return { grouped, unknownDate }
  }, [initialTasks])

  // Get sorted month keys (descending order)
  const sortedMonthKeys = useMemo(() => {
    return Object.keys(tasksByMonth.grouped).sort((a, b) => {
      // Parse yyyy-MM format and sort descending
      return b.localeCompare(a)
    })
  }, [tasksByMonth.grouped])

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header section */}
      <div className="mb-8">
        <h2 className="text-3xl font-semibold tracking-tight">Retrospective</h2>
        <p className="mt-2 text-muted-foreground leading-relaxed">
          Review your completed tasks organized by month
        </p>
      </div>

      {/* Tasks grouped by month */}
      {sortedMonthKeys.length === 0 && tasksByMonth.unknownDate.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No completed tasks yet</p>
          <Button variant="outline" asChild>
            <Link href="/horizons">Go to Horizons</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Monthly groups */}
          {sortedMonthKeys.map((monthKey) => {
            const tasks = tasksByMonth.grouped[monthKey]
            if (tasks.length === 0) return null

            const monthLabel = format(parseISO(`${monthKey}-01`), "MMMM yyyy")

            return (
              <div key={monthKey}>
                {/* Month heading */}
                <div className="mb-4 border-b border-border pb-2">
                  <h3 className="text-xl font-semibold">{monthLabel}</h3>
                </div>

                {/* Task list */}
                <div className="flex flex-col gap-2">
                  {tasks.map((task) => {
                    const completedDate = task.completed_at || task.updated_at
                    return (
                      <div key={task.id} className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-muted-foreground">{task.title}</p>
                            {task.description && (
                              <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                            )}
                            {completedDate && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                Completed {format(parseISO(completedDate), "MMM d, yyyy")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Unknown date section */}
          {tasksByMonth.unknownDate.length > 0 && (
            <div>
              {/* Unknown date heading */}
              <div className="mb-4 border-b border-border pb-2">
                <h3 className="text-xl font-semibold">Unknown Date</h3>
              </div>

              {/* Task list */}
              <div className="flex flex-col gap-2">
                {tasksByMonth.unknownDate.map((task) => (
                  <div key={task.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-muted-foreground">{task.title}</p>
                        {task.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
