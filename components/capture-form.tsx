"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { TimeHorizon } from "@/lib/types"

interface CaptureFormProps {
  userId: string
}

const horizons: { value: TimeHorizon; label: string; description: string }[] = [
  { value: "now", label: "Now", description: "Do today or this week" },
  { value: "soon", label: "Soon", description: "Do in the next few weeks" },
  { value: "later", label: "Later", description: "Do in the next few months" },
  { value: "someday", label: "Someday", description: "No specific timeline" },
]

export function CaptureForm({ userId }: CaptureFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedHorizon, setSelectedHorizon] = useState<TimeHorizon>("now")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase.from("tasks").insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        time_horizon: selectedHorizon,
        completed: false,
      })

      if (insertError) throw insertError

      // Reset form and redirect
      setTitle("")
      setDescription("")
      setSelectedHorizon("now")
      router.push("/horizons")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Title input */}
      <div className="flex flex-col gap-3">
        <Label htmlFor="title" className="text-base">
          What needs to be done?
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title"
          required
          className="text-lg"
          autoFocus
        />
      </div>

      {/* Description textarea */}
      <div className="flex flex-col gap-3">
        <Label htmlFor="description" className="text-base">
          Additional details (optional)
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add any notes or context"
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Time horizon selection */}
      <div className="flex flex-col gap-4">
        <Label className="text-base">When should this be done?</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {horizons.map((horizon) => (
            <button
              key={horizon.value}
              type="button"
              onClick={() => setSelectedHorizon(horizon.value)}
              className={`flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors ${
                selectedHorizon === horizon.value
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:border-muted-foreground/50"
              }`}
            >
              <span className="font-medium">{horizon.label}</span>
              <span className="text-xs text-muted-foreground">{horizon.description}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button type="submit" size="lg" className="flex-1" disabled={isLoading || !title.trim()}>
          {isLoading ? "Creating..." : "Create Task"}
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={() => router.push("/horizons")} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
