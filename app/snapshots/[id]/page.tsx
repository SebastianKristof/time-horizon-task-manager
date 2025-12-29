import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { format, parseISO } from "date-fns"
import type { Snapshot } from "@/lib/types"
import { ShareSnapshotButton } from "@/components/share-snapshot-button"

interface SnapshotPageProps {
  params: Promise<{ id: string }>
}

export default async function SnapshotPage({ params }: SnapshotPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the snapshot
  const { data: snapshot, error } = await supabase.from("snapshots").select("*").eq("id", id).single()

  if (error || !snapshot) {
    notFound()
  }

  const typedSnapshot = snapshot as Snapshot
  const tasks = typedSnapshot.snapshot_data.tasks

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border p-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/snapshots">
            <ChevronLeft className="h-4 w-4" />
            Back to Snapshots
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Snapshot</h1>
        <div className="w-[100px]" />
      </header>

      {/* Main content */}
      <main className="flex-1 p-4">
        <div className="mx-auto max-w-4xl">
          {/* Snapshot header */}
          <div className="mb-8 flex flex-col gap-4">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">{typedSnapshot.title}</h2>
              {typedSnapshot.description && (
                <p className="mt-2 text-lg text-muted-foreground">{typedSnapshot.description}</p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                Created {format(parseISO(typedSnapshot.created_at), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>

            {/* Share button */}
            <ShareSnapshotButton snapshotId={id} />
          </div>

          {/* Stats grid */}
          <div className="mb-8 grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="mt-1 text-3xl font-semibold">{tasks.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Now</p>
              <p className="mt-1 text-3xl font-semibold">{tasks.filter((t) => t.time_horizon === "now").length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Soon</p>
              <p className="mt-1 text-3xl font-semibold">{tasks.filter((t) => t.time_horizon === "soon").length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Later+</p>
              <p className="mt-1 text-3xl font-semibold">
                {tasks.filter((t) => t.time_horizon === "later" || t.time_horizon === "someday").length}
              </p>
            </div>
          </div>

          {/* Task list by horizon */}
          <div className="flex flex-col gap-8">
            {["now", "soon", "later", "someday"].map((horizon) => {
              const horizonTasks = tasks.filter((t) => t.time_horizon === horizon)
              if (horizonTasks.length === 0) return null

              return (
                <div key={horizon} className="flex flex-col gap-3">
                  <h3 className="text-lg font-semibold capitalize">
                    {horizon} ({horizonTasks.length})
                  </h3>
                  <div className="flex flex-col gap-2">
                    {horizonTasks.map((task) => (
                      <div key={task.id} className="rounded-lg border border-border bg-card p-4">
                        <p className="font-medium text-[var(--color-completed)]">{task.title}</p>
                        {task.description && <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>}
                        {task.completed_at && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Completed {format(parseISO(task.completed_at), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
