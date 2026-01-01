import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CaptureForm } from "@/components/capture-form"
import { Button } from "@/components/ui/button"
import { AccountActions } from "@/components/account-actions"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default async function CapturePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border p-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/horizons" className="flex items-center gap-1.5">
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="hidden min-[400px]:inline">Back to Horizons</span>
          </Link>
        </Button>
        <AccountActions />
      </header>

      {/* Main content */}
      <main className="flex flex-1 items-start justify-center p-6 pt-16">
        <div className="w-full max-w-2xl">
          <div className="mb-12 flex flex-col gap-3 text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-balance">Capture Tasks</h1>
            <p className="text-lg text-muted-foreground text-pretty leading-relaxed">
              Quickly record what's on your mind and assign it to a time horizon
            </p>
          </div>

          <CaptureForm userId={user.id} />
        </div>
      </main>
    </div>
  )
}
