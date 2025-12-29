import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function EntryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is already logged in, redirect to horizons view
  if (user) {
    redirect("/horizons")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col gap-8">
        {/* Logo / Title area */}
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-balance">Time Horizon</h1>
          <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
            A task manager focused on calm attention management
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full bg-transparent">
            <Link href="/auth/sign-up">Create Account</Link>
          </Button>
        </div>

        {/* Subtle description */}
        <p className="text-center text-sm text-muted-foreground leading-relaxed text-pretty">
          Organize tasks across time horizons: now, soon, later, someday
        </p>
      </div>
    </div>
  )
}
