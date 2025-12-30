import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { HorizonsView } from "@/components/horizons-view"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { Plus, History } from "lucide-react"
import type { Task } from "@/lib/types"

export default async function HorizonsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Fetch all tasks for the user that should appear in horizons view:
  // - Not completed, OR
  // - Completed within last 24 hours
  // This query will be filtered client-side to exclude subtasks of completed parents
  const { data: allTasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .or(`completed.eq.false,and(completed.eq.true,completed_at.gte.${twentyFourHoursAgo})`)
    .order("time_horizon", { ascending: true })
    .order("position", { ascending: true })

  // Filter out subtasks whose parent tasks are completed and moved to completed view
  // (completed more than 24 hours ago)
  const tasks = (allTasks || []).filter((task) => {
    // If it's a top-level task, include it
    if (!task.parent_task_id) {
      return true
    }
    
    // If it's a subtask, check if its parent is completed and moved to completed view
    const parentTask = allTasks?.find((t) => t.id === task.parent_task_id)
    if (!parentTask) {
      // Parent not found, include the subtask (edge case)
      return true
    }
    
    // If parent is not completed, include the subtask
    if (!parentTask.completed) {
      return true
    }
    
    // If parent is completed but within 24 hours, include the subtask
    if (parentTask.completed_at) {
      const parentCompletedAt = new Date(parentTask.completed_at)
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
      if (parentCompletedAt >= cutoff) {
        return true
      }
    }
    
    // Parent is completed and moved to completed view (>24h), exclude the subtask
    return false
  })

  if (error) {
    console.error("[v0] Error fetching tasks:", error)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 border-b border-border p-4">
        <h1 className="text-xl font-semibold shrink-0">Time Horizons</h1>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <Button variant="outline" size="sm" asChild>
            <Link href="/completed" className="flex items-center gap-1.5">
              <History className="h-4 w-4 shrink-0" />
              <span className="hidden min-[400px]:inline">Completed</span>
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/capture" className="flex items-center gap-1.5">
              <Plus className="h-4 w-4 shrink-0" />
              <span className="hidden min-[400px]:inline">Bulk add tasks</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4">
        <HorizonsView initialTasks={(tasks as Task[]) || []} userId={user.id} />
      </main>
    </div>
  )
}
