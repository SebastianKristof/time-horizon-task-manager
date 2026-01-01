"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface AccountActionsProps {
  showAccountLink?: boolean
  align?: "start" | "end"
}

export function AccountActions({ showAccountLink = true, align = "end" }: AccountActionsProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    if (isSigningOut) return
    setIsSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div className={`flex items-center gap-2 ${align === "start" ? "justify-start" : "justify-end"}`}>
      {showAccountLink && (
        <Button variant="ghost" size="sm" asChild>
          <Link href="/account" className="flex items-center gap-1.5">
            <User className="h-4 w-4 shrink-0" />
            <span className="hidden min-[400px]:inline">Account</span>
          </Link>
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={isSigningOut}>
        <LogOut className="h-4 w-4 shrink-0" />
        <span className="hidden min-[400px]:inline">{isSigningOut ? "Signing out..." : "Sign out"}</span>
      </Button>
    </div>
  )
}
