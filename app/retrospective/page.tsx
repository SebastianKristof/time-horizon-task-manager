import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RetrospectiveView } from "@/components/retrospective-view"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import type { Task } from "@/lib/types"

export default async function RetrospectivePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Fetch all completed tasks (show immediately, no 24h filter)
  const { data: completedTasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("completed", true)
    .order("completed_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching completed tasks:", error)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border p-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/horizons">
            <ChevronLeft className="h-4 w-4" />
            Back to Horizons
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Retrospective</h1>
        <ThemeToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 p-4">
        <RetrospectiveView initialTasks={(completedTasks as Task[]) || []} userId={user.id} />
      </main>
    </div>
  )
}
