"use client"

import Link from "next/link"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Share2 } from "lucide-react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns"
import { useRouter } from "next/navigation"

interface RetrospectiveViewProps {
  initialTasks: Task[]
  userId: string
}

type TimeFrame = "week" | "month" | "all"

export function RetrospectiveView({ initialTasks, userId }: RetrospectiveViewProps) {
  const [tasks] = useState<Task[]>(initialTasks)
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("week")
  const [customDate, setCustomDate] = useState<Date>(new Date())
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false)
  const router = useRouter()

  const getFilteredTasks = () => {
    const now = new Date()
    let startDate: Date
    let endDate: Date

    if (timeFrame === "week") {
      startDate = startOfWeek(customDate)
      endDate = endOfWeek(customDate)
    } else if (timeFrame === "month") {
      startDate = startOfMonth(customDate)
      endDate = endOfMonth(customDate)
    } else {
      return tasks
    }

    return tasks.filter((task) => {
      if (!task.completed_at) return false
      const completedDate = parseISO(task.completed_at)
      return isWithinInterval(completedDate, { start: startDate, end: endDate })
    })
  }

  const filteredTasks = getFilteredTasks()

  const handleCreateSnapshot = async () => {
    if (filteredTasks.length === 0) return

    const supabase = createClient()
    setIsCreatingSnapshot(true)

    try {
      const title =
        timeFrame === "week"
          ? `Week of ${format(startOfWeek(customDate), "MMM d, yyyy")}`
          : timeFrame === "month"
            ? format(customDate, "MMMM yyyy")
            : "All completed tasks"

      const { error } = await supabase.from("snapshots").insert({
        user_id: userId,
        title,
        description: `${filteredTasks.length} tasks completed`,
        snapshot_data: {
          tasks: filteredTasks,
          created_at: new Date().toISOString(),
        },
      })

      if (error) throw error

      // Navigate to snapshots list (we'll add this route next)
      router.push("/snapshots")
      router.refresh()
    } catch (err) {
      console.error("[v0] Error creating snapshot:", err)
    } finally {
      setIsCreatingSnapshot(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header section */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-semibold tracking-tight">Reflect on Your Progress</h2>
          <p className="text-muted-foreground leading-relaxed">
            Review what you've accomplished and create snapshots to share your journey
          </p>
        </div>

        {/* Time frame selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            <Button
              variant={timeFrame === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFrame("week")}
            >
              This Week
            </Button>
            <Button
              variant={timeFrame === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFrame("month")}
            >
              This Month
            </Button>
            <Button variant={timeFrame === "all" ? "default" : "outline"} size="sm" onClick={() => setTimeFrame("all")}>
              All Time
            </Button>
          </div>

          {timeFrame !== "all" && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={format(customDate, "yyyy-MM-dd")}
                onChange={(e) => setCustomDate(new Date(e.target.value))}
                className="w-auto"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats section */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Tasks Completed</p>
          <p className="mt-1 text-3xl font-semibold">{filteredTasks.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Now Tasks</p>
          <p className="mt-1 text-3xl font-semibold">{filteredTasks.filter((t) => t.time_horizon === "now").length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Soon Tasks</p>
          <p className="mt-1 text-3xl font-semibold">{filteredTasks.filter((t) => t.time_horizon === "soon").length}</p>
        </div>
      </div>

      {/* Create snapshot button */}
      {filteredTasks.length > 0 && (
        <div className="mb-6">
          <Button onClick={handleCreateSnapshot} disabled={isCreatingSnapshot} size="lg">
            <Share2 className="h-4 w-4" />
            {isCreatingSnapshot ? "Creating Snapshot..." : "Create Snapshot to Share"}
          </Button>
        </div>
      )}

      {/* Task list */}
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold">Completed Tasks</h3>
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No completed tasks in this time period</p>
            <Button variant="outline" asChild>
              <Link href="/horizons">Go to Horizons</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredTasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-[var(--color-completed)]">{task.title}</p>
                    {task.description && <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>}
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="rounded-md bg-muted px-2 py-1 capitalize">{task.time_horizon}</span>
                      {task.completed_at && <span>Completed {format(parseISO(task.completed_at), "MMM d, yyyy")}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
