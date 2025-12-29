"use client"

import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

interface ShareSnapshotButtonProps {
  snapshotId: string
}

export function ShareSnapshotButton({ snapshotId }: ShareSnapshotButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    const url = `${window.location.origin}/snapshots/${snapshotId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button onClick={handleCopyLink} variant="default" size="lg">
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Link Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy Share Link
        </>
      )}
    </Button>
  )
}
