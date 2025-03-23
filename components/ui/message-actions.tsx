"use client"

import { useState } from "react"
import { ShieldCheckIcon, CopyIcon, CheckIcon, RefreshCwIcon } from "lucide-react"

interface MessageActionsProps {
  content: string
  signature?: string
  onRegenerate?: () => void
}

export function MessageActions({ content, signature, onRegenerate }: MessageActionsProps) {
  const [showSignature, setShowSignature] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-2">
      <div className="inline-flex items-center gap-1 bg-bg-darker/50 rounded-full p-1">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-full hover:bg-bg-lighter transition-colors"
          aria-label="Copy message"
          title="Copy message"
        >
          {copied ? (
            <CheckIcon className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <CopyIcon className="w-3.5 h-3.5 text-fg-muted" />
          )}
        </button>

        {signature && (
          <button
            onClick={() => setShowSignature(!showSignature)}
            className={`p-1.5 rounded-full transition-colors ${
              showSignature ? "bg-accent/20 text-accent" : "hover:bg-bg-lighter text-fg-muted"
            }`}
            aria-label="Verify signature"
            title="Verify signature"
          >
            <ShieldCheckIcon className="w-3.5 h-3.5" />
          </button>
        )}

        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="p-1.5 rounded-full hover:bg-bg-lighter transition-colors text-fg-muted"
            aria-label="Regenerate response"
            title="Regenerate response"
          >
            <RefreshCwIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showSignature && signature && (
        <div
          className="mt-2 p-3 bg-bg-darker rounded font-input text-xs text-fg-muted break-all border border-border-color/20"
          style={{ fontFamily: "var(--font-jetbrains)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-accent font-mono tracking-tight">CRYPTOGRAPHIC SIGNATURE</span>
            <button
              onClick={() => setShowSignature(false)}
              className="text-fg-muted hover:text-accent"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          {signature}
        </div>
      )}
    </div>
  )
}

