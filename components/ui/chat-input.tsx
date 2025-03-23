"use client"

import type React from "react"

import { SendIcon } from "lucide-react"
import { useState } from "react"

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    onSend(input)
    setInput("")
  }

  return (
    <form onSubmit={handleSubmit} className="input-container">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message securely..."
        className="message-input font-input"
        style={{ fontFamily: "var(--font-jetbrains)" }}
        disabled={isLoading}
      />
      <button type="submit" className="send-button" disabled={isLoading || !input.trim()} aria-label="Send message">
        <SendIcon className="w-5 h-5 text-white" strokeWidth={2.5} />
      </button>
    </form>
  )
}

