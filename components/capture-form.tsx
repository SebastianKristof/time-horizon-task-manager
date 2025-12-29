"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { TimeHorizon } from "@/lib/types"

interface CaptureFormProps {
  userId: string
}

const horizons: { value: TimeHorizon; label: string; description: string }[] = [
  { value: "now", label: "7 days", description: "Do today or this week" },
  { value: "soon", label: "30 days", description: "Do in the next few weeks" },
  { value: "later", label: "180 days", description: "Do in the next few months" },
  { value: "someday", label: "someday", description: "No specific timeline" },
]

export function CaptureForm({ userId }: CaptureFormProps) {
  const [tasksText, setTasksText] = useState("")
  const [selectedHorizon, setSelectedHorizon] = useState<TimeHorizon>("now")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Parse tasks from newline-separated text
    const taskTitles = tasksText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (taskTitles.length === 0) return

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // Fetch current max position for the selected horizon to determine starting position
      const { data: existingTasks } = await supabase
        .from("tasks")
        .select("position")
        .eq("user_id", userId)
        .eq("time_horizon", selectedHorizon)
        .is("parent_task_id", null)
        .order("position", { ascending: false })
        .limit(1)

      const maxPosition = existingTasks && existingTasks.length > 0 ? existingTasks[0].position : -1
      const startingPosition = maxPosition + 1

      // Create tasks array with positions
      const tasksToInsert = taskTitles.map((title, index) => ({
        user_id: userId,
        title,
        description: null,
        time_horizon: selectedHorizon,
        completed: false,
        parent_task_id: null,
        position: startingPosition + index,
      }))

      // Batch insert
      const { error: insertError } = await supabase.from("tasks").insert(tasksToInsert)

      if (insertError) throw insertError

      // Reset form and redirect
      setTasksText("")
      setSelectedHorizon("now")
      router.push("/horizons")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tasks")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Tasks textarea */}
      <div className="flex flex-col gap-3">
        <Label htmlFor="tasks" className="text-base">
          What needs to be done? (one task per line)
        </Label>
        <Textarea
          id="tasks"
          value={tasksText}
          onChange={(e) => setTasksText(e.target.value)}
          placeholder="Enter tasks, one per line&#10;Task 1&#10;Task 2&#10;Task 3"
          rows={8}
          className="resize-none text-base"
          required
          autoFocus
        />
        <p className="text-sm text-muted-foreground">
          Type multiple tasks, each on a new line. They will all be assigned to the same time horizon.
        </p>
      </div>

      {/* Time horizon selection */}
      <div className="flex flex-col gap-4">
        <Label className="text-base">Time horizon for all tasks</Label>
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
        <Button type="submit" size="lg" className="flex-1" disabled={isLoading || !tasksText.trim()}>
          {isLoading ? "Creating..." : "Add Tasks"}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={() => router.push("/horizons")}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
