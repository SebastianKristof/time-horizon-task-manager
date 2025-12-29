import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { HorizonsView } from "@/components/horizons-view"
import { Button } from "@/components/ui/button"
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

  // Fetch all tasks for the user, ordered by time_horizon, parent_task_id (NULLS FIRST), then position
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .or(`completed.eq.false,and(completed.eq.true,completed_at.gte.${twentyFourHoursAgo})`)
    .order("time_horizon", { ascending: true })
    .order("position", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching tasks:", error)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Time Horizons</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/retrospective">
              <History className="h-4 w-4" />
              Retrospective
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/capture">
              <Plus className="h-4 w-4" />
              Add Task
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
