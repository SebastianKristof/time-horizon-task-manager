"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      setHasSession(Boolean(data.session))
    }
    checkSession()
  }, [])

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus(null)

    if (newPassword.length < 6) {
      setStatus({ type: "error", message: "Password must be at least 6 characters." })
      return
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." })
      return
    }

    setIsSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setStatus({ type: "error", message: error.message })
    } else {
      setStatus({ type: "success", message: "Password updated. You can now sign in with your new password." })
      setNewPassword("")
      setConfirmPassword("")
    }
    setIsSaving(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">Update Password</h1>
            <p className="text-sm text-muted-foreground">
              Set a new password for your account using the link from your email.
            </p>
          </div>

          {hasSession === false && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              This reset link has expired or is invalid. Request a new password reset email from your account page.
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={6}
                required
                disabled={hasSession === false}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={6}
                required
                disabled={hasSession === false}
              />
            </div>
            <Button type="submit" disabled={isSaving || hasSession === false}>
              {isSaving ? "Updating..." : "Update password"}
            </Button>
          </form>

          {status && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                status.type === "success"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                  : "border-destructive/20 bg-destructive/10 text-destructive"
              }`}
            >
              {status.message}
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Ready to sign in?{" "}
            <Link href="/auth/login" className="text-foreground underline underline-offset-4">
              Go to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
