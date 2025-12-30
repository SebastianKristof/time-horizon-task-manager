"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { TimeHorizon } from "@/lib/types"

interface CaptureFormProps {
  userId: string
}

export function CaptureForm({ userId }: CaptureFormProps) {
  const [tasksText, setTasksText] = useState("")
  const [taskEntries, setTaskEntries] = useState<{ id: string; title: string; horizon: TimeHorizon }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const syncTaskEntries = (text: string, fallbackHorizon: TimeHorizon) => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    setTaskEntries((prev) =>
      lines.map((title, index) => ({
        id: prev[index]?.id ?? crypto.randomUUID(),
        title,
        horizon: prev[index]?.horizon ?? fallbackHorizon,
      })),
    )
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text) return
      setTasksText(text)
      syncTaskEntries(text, "now")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to paste from clipboard")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (taskEntries.length === 0) return

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const tasksByHorizon = taskEntries.reduce(
        (acc, entry) => {
          acc[entry.horizon] = acc[entry.horizon] ?? []
          acc[entry.horizon].push(entry)
          return acc
        },
        {} as Record<TimeHorizon, { id: string; title: string; horizon: TimeHorizon }[]>,
      )

      const horizonsToQuery = Object.keys(tasksByHorizon) as TimeHorizon[]
      const maxPositions = await Promise.all(
        horizonsToQuery.map(async (horizon) => {
          const { data: existingTasks } = await supabase
            .from("tasks")
            .select("position")
            .eq("user_id", userId)
            .eq("time_horizon", horizon)
            .is("parent_task_id", null)
            .order("position", { ascending: false })
            .limit(1)

          return {
            horizon,
            maxPosition: existingTasks && existingTasks.length > 0 ? existingTasks[0].position : -1,
          }
        }),
      )

      const maxPositionMap = new Map(
        maxPositions.map((entry) => [entry.horizon, entry.maxPosition]),
      )

      const tasksToInsert = horizonsToQuery.flatMap((horizon) => {
        const entries = tasksByHorizon[horizon]
        const startingPosition = (maxPositionMap.get(horizon) ?? -1) + 1
        return entries.map((entry, index) => ({
          user_id: userId,
          title: entry.title,
          description: null,
          time_horizon: horizon,
          completed: false,
          parent_task_id: null,
          position: startingPosition + index,
        }))
      })

      // Batch insert
      const { error: insertError } = await supabase.from("tasks").insert(tasksToInsert)

      if (insertError) throw insertError

      // Reset form and redirect
      setTasksText("")
      setTaskEntries([])
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
      <div className="flex flex-col gap-3">
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={handlePaste}>
            Paste
          </Button>
        </div>
        <Textarea
          id="tasks"
          value={tasksText}
          onChange={(e) => {
            const nextValue = e.target.value
            setTasksText(nextValue)
            syncTaskEntries(nextValue, "now")
          }}
          rows={12}
          className="resize-none text-base"
          required
          autoFocus
        />
      </div>

      {taskEntries.length > 0 && (
        <div className="flex flex-col gap-2">
          {taskEntries.map((entry, index) => (
            <div
              key={entry.id}
              className="flex flex-col gap-2 rounded-md border border-border bg-card px-3 py-2 sm:flex-row sm:items-center"
            >
              <span className="text-xs text-muted-foreground">#{index + 1}</span>
              <span className="flex-1 text-sm font-medium text-foreground">{entry.title}</span>
              <div className="flex items-center gap-1">
                {[
                  { value: "now" as TimeHorizon, label: "7d" },
                  { value: "soon" as TimeHorizon, label: "30d" },
                  { value: "later" as TimeHorizon, label: "180d" },
                  { value: "someday" as TimeHorizon, label: "∞" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setTaskEntries((prev) =>
                        prev.map((item) =>
                          item.id === entry.id ? { ...item, horizon: option.value } : item,
                        ),
                      )
                    }}
                    className={`min-w-[2.25rem] rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                      entry.horizon === option.value
                        ? "border-primary bg-accent"
                        : "border-border bg-background hover:border-muted-foreground/60"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="flex gap-3">
        <Button type="submit" size="lg" className="flex-1" disabled={isLoading || !tasksText.trim()}>
          {isLoading ? "Creating..." : "Add tasks"}
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
