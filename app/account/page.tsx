import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { AccountSettings } from "@/components/account-settings"
import { AccountActions } from "@/components/account-actions"

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const displayName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : ""
  const providers = Array.isArray(user.app_metadata?.providers) ? user.app_metadata.providers : []

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-border p-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/horizons" className="flex items-center gap-1.5">
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="hidden min-[400px]:inline">Back to Horizons</span>
          </Link>
        </Button>
        <h1 className="text-xl font-semibold shrink-0">Account</h1>
        <AccountActions showAccountLink={false} />
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto w-full max-w-3xl">
          <AccountSettings email={user.email ?? ""} displayName={displayName} providers={providers} />
        </div>
      </main>
    </div>
  )
}
