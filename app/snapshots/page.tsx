import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { AccountActions } from "@/components/account-actions"
import Link from "next/link"
import { ChevronLeft, Share2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import type { Snapshot } from "@/lib/types"

export default async function SnapshotsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Fetch snapshots
  const { data: snapshots, error } = await supabase
    .from("snapshots")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching snapshots:", error)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border p-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/completed">
            <ChevronLeft className="h-4 w-4" />
            Back to Completed
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Snapshots</h1>
        <AccountActions />
      </header>

      {/* Main content */}
      <main className="flex-1 p-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex flex-col gap-2">
            <h2 className="text-3xl font-semibold tracking-tight">Your Progress Snapshots</h2>
            <p className="text-muted-foreground leading-relaxed">
              Share your accomplishments and reflect on your journey
            </p>
          </div>

          {!snapshots || snapshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No snapshots created yet</p>
              <Button asChild>
                <Link href="/completed">Create Your First Snapshot</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {(snapshots as Snapshot[]).map((snapshot) => (
                <div key={snapshot.id} className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{snapshot.title}</h3>
                      {snapshot.description && <p className="mt-1 text-muted-foreground">{snapshot.description}</p>}
                      <p className="mt-2 text-sm text-muted-foreground">
                        Created {format(parseISO(snapshot.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/snapshots/${snapshot.id}`}>
                        <Share2 className="h-4 w-4" />
                        View & Share
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
