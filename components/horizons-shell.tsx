"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import type { Task } from "@/lib/types"
import { HorizonsView } from "@/components/horizons-view"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Eye, EyeOff, HelpCircle, Moon, Plus, RefreshCw, Settings, Sun } from "lucide-react"

interface HorizonsShellProps {
  initialTasks: Task[]
  userId: string
}

export function HorizonsShell({ initialTasks, userId }: HorizonsShellProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isRefreshing, startRefresh] = useTransition()
  const [showCompletedTasks, setShowCompletedTasks] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("showCompletedTasks")
      return stored !== null ? stored === "true" : true
    }
    return true
  })
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const settingsRef = useRef<HTMLDetailsElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const settingsEl = settingsRef.current
      if (!settingsEl || !settingsEl.open) return
      if (settingsEl.contains(event.target as Node)) return
      settingsEl.open = false
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      const settingsEl = settingsRef.current
      if (!settingsEl || !settingsEl.open) return
      settingsEl.open = false
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("showCompletedTasks", String(showCompletedTasks))
    }
  }, [showCompletedTasks])

  const isDarkTheme = mounted && (theme === "dark" || resolvedTheme === "dark")
  const themeLabel = mounted ? (isDarkTheme ? "Switch to light theme" : "Switch to dark theme") : "Theme"

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-border p-4">
        <h1 className="text-xl font-semibold shrink-0">Time Horizons</h1>
        <div className="flex items-center gap-2 shrink-0">
          <details ref={settingsRef} className="relative">
            <Button variant="ghost" size="sm" asChild>
              <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                <Settings className="h-4 w-4" />
                <span className="hidden min-[400px]:inline">Settings</span>
              </summary>
            </Button>
            <div className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-border bg-card p-2 text-sm shadow-sm">
              <button
                type="button"
                onClick={() => startRefresh(() => router.refresh())}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-accent"
                disabled={isRefreshing}
              >
                <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                <span>Refresh data</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme(isDarkTheme ? "light" : "dark")}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-accent"
              >
                {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{themeLabel}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCompletedTasks((prev) => !prev)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-accent"
                title={showCompletedTasks ? "Hide recently completed tasks" : "Show recently completed tasks"}
              >
                {showCompletedTasks ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span>{showCompletedTasks ? "Hide recently completed" : "Show recently completed"}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsHelpOpen((prev) => !prev)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-accent"
              >
                <HelpCircle className="h-4 w-4" />
                <span>{isHelpOpen ? "Hide keyboard help" : "Keyboard help"}</span>
              </button>
            </div>
          </details>
          <Button variant="outline" size="sm" asChild>
            <Link href="/completed" className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="hidden min-[400px]:inline">Completed</span>
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/capture" className="flex items-center gap-1.5">
              <Plus className="h-4 w-4 shrink-0" />
              <span className="hidden min-[400px]:inline">Bulk add tasks</span>
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4">
        <HorizonsView
          initialTasks={tasks}
          userId={userId}
          showCompletedTasks={showCompletedTasks}
          setShowCompletedTasks={setShowCompletedTasks}
          isHelpOpen={isHelpOpen}
          setIsHelpOpen={setIsHelpOpen}
        />
      </main>
    </div>
  )
}
