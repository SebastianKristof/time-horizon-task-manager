import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CompletedView } from "@/components/completed-view"
import { Button } from "@/components/ui/button"
import { AccountActions } from "@/components/account-actions"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import type { Task } from "@/lib/types"

export default async function CompletedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Fetch all completed tasks and their subtasks (even if subtasks are not completed)
  // First, get all completed tasks
  const { data: completedTasks, error: completedError } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("completed", true)
    .order("completed_at", { ascending: false })

  if (completedError) {
    console.error("[v0] Error fetching completed tasks:", completedError)
  }

  // Then, get all subtasks of completed parent tasks (even if subtasks are not completed)
  const completedTaskIds = (completedTasks || []).map((t) => t.id)
  let allTasks: Task[] = [...(completedTasks || [])]

  if (completedTaskIds.length > 0) {
    const { data: subtasks, error: subtasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .in("parent_task_id", completedTaskIds)

    if (subtasksError) {
      console.error("[v0] Error fetching subtasks:", subtasksError)
    } else {
      // Add subtasks that aren't already in the list (in case they're also completed)
      const existingIds = new Set(allTasks.map((t) => t.id))
      const newSubtasks = (subtasks || []).filter((t) => !existingIds.has(t.id))
      allTasks = [...allTasks, ...newSubtasks]
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 border-b border-border p-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/horizons" className="flex items-center gap-1.5">
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="hidden min-[400px]:inline">Back to Horizons</span>
          </Link>
        </Button>
        <h1 className="text-xl font-semibold shrink-0">Completed</h1>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle className="shrink-0" />
          <AccountActions />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4">
        <CompletedView initialTasks={(allTasks as Task[]) || []} userId={user.id} />
      </main>
    </div>
  )
}
