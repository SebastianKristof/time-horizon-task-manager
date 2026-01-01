"use client"

import { useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, CheckCircle2 } from "lucide-react"

type Status = { type: "success" | "error"; message: string }

interface AccountSettingsProps {
  email: string
  displayName: string
  providers: string[]
}

export function AccountSettings({ email, displayName, providers }: AccountSettingsProps) {
  const [name, setName] = useState(displayName)
  const [emailInput, setEmailInput] = useState(email)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [profileStatus, setProfileStatus] = useState<Status | null>(null)
  const [emailStatus, setEmailStatus] = useState<Status | null>(null)
  const [passwordStatus, setPasswordStatus] = useState<Status | null>(null)
  const [resetStatus, setResetStatus] = useState<Status | null>(null)
  const [providerStatus, setProviderStatus] = useState<Status | null>(null)
  const [deleteStatus, setDeleteStatus] = useState<Status | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [isConnectingProvider, setIsConnectingProvider] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const hasGoogle = useMemo(() => providers.includes("google"), [providers])

  const renderStatus = (status: Status | null) => {
    if (!status) return null
    const Icon = status.type === "success" ? CheckCircle2 : AlertTriangle
    const className =
      status.type === "success"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
        : "border-destructive/20 bg-destructive/10 text-destructive"
    return (
      <div className={`mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm ${className}`}>
        <Icon className="mt-0.5 h-4 w-4" />
        <span>{status.message}</span>
      </div>
    )
  }

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSavingProfile(true)
    setProfileStatus(null)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: name.trim(),
      },
    })

    if (error) {
      setProfileStatus({ type: "error", message: error.message })
    } else {
      setProfileStatus({ type: "success", message: "Profile updated." })
    }
    setIsSavingProfile(false)
  }

  const handleEmailSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSavingEmail(true)
    setEmailStatus(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ email: emailInput.trim() })

    if (error) {
      setEmailStatus({ type: "error", message: error.message })
    } else {
      setEmailStatus({
        type: "success",
        message: "Email update requested. Check your inbox to confirm the change.",
      })
    }
    setIsSavingEmail(false)
  }

  const handlePasswordSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSavingPassword(true)
    setPasswordStatus(null)

    if (newPassword.length < 6) {
      setPasswordStatus({ type: "error", message: "Password must be at least 6 characters." })
      setIsSavingPassword(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "Passwords do not match." })
      setIsSavingPassword(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordStatus({ type: "error", message: error.message })
    } else {
      setPasswordStatus({ type: "success", message: "Password updated." })
      setNewPassword("")
      setConfirmPassword("")
    }
    setIsSavingPassword(false)
  }

  const handlePasswordReset = async () => {
    setIsSendingReset(true)
    setResetStatus(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(emailInput.trim(), {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (error) {
      setResetStatus({ type: "error", message: error.message })
    } else {
      setResetStatus({
        type: "success",
        message: "Password reset email sent. Follow the link to set a new password.",
      })
    }
    setIsSendingReset(false)
  }

  const handleConnectGoogle = async () => {
    setIsConnectingProvider(true)
    setProviderStatus(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    })

    if (error) {
      setProviderStatus({ type: "error", message: error.message })
      setIsConnectingProvider(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (isDeleting) return
    const confirmed = window.confirm("Delete your account and all data? This cannot be undone.")
    if (!confirmed) return

    setIsDeleting(true)
    setDeleteStatus(null)

    const response = await fetch("/auth/delete-account", { method: "POST" })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      const message = typeof data?.error === "string" ? data.error : "Unable to delete account."
      setDeleteStatus({ type: "error", message })
      setIsDeleting(false)
      return
    }

    window.location.href = "/"
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">Update how your name appears across the app.</p>
        <form onSubmit={handleProfileSave} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? "Saving..." : "Save profile"}
            </Button>
          </div>
          {renderStatus(profileStatus)}
        </form>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Email</h2>
        <p className="text-sm text-muted-foreground">Changing your email requires confirmation.</p>
        <form onSubmit={handleEmailSave} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSavingEmail}>
              {isSavingEmail ? "Saving..." : "Update email"}
            </Button>
            <Button type="button" variant="outline" onClick={handlePasswordReset} disabled={isSendingReset}>
              {isSendingReset ? "Sending..." : "Send password reset email"}
            </Button>
          </div>
          {renderStatus(emailStatus)}
          {renderStatus(resetStatus)}
        </form>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Password</h2>
        <p className="text-sm text-muted-foreground">Set a new password for this account.</p>
        <form onSubmit={handlePasswordSave} className="mt-6 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={6}
                required
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
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSavingPassword}>
              {isSavingPassword ? "Saving..." : "Update password"}
            </Button>
          </div>
          {renderStatus(passwordStatus)}
        </form>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Connected providers</h2>
        <p className="text-sm text-muted-foreground">Link your account to sign in faster.</p>
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">Google</p>
              <p className="text-sm text-muted-foreground">
                {hasGoogle ? "Connected" : "Not connected"}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={handleConnectGoogle} disabled={hasGoogle || isConnectingProvider}>
              {hasGoogle ? "Connected" : isConnectingProvider ? "Connecting..." : "Connect Google"}
            </Button>
          </div>
          {renderStatus(providerStatus)}
          {hasGoogle && (
            <p className="text-xs text-muted-foreground">
              To disconnect Google, contact support or delete your account. Supabase does not expose a safe unlink API
              on the client.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-xl font-semibold text-destructive">Delete account</h2>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button type="button" variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete account"}
          </Button>
        </div>
        {renderStatus(deleteStatus)}
      </section>
    </div>
  )
}
