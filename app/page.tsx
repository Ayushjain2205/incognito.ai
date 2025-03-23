"use client"

import { useState, useRef, useEffect } from "react"
import { Header } from "@/components/ui/header"
import { Message } from "@/components/ui/message"
import { ChatInput } from "@/components/ui/chat-input"
import { LoadingIndicator } from "@/components/ui/loading-indicator"
import { ShieldIcon, LockIcon } from "lucide-react"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  signature?: string
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (message: string) => {
    if (isLoading) return

    const userMessage: ChatMessage = { role: "user", content: message }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response")
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message.content,
        signature: data.signature,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I encountered an error processing your request. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerate = async () => {
    if (isLoading || messages.length === 0) return

    // Find the last user message
    const lastUserMessageIndex = [...messages].reverse().findIndex((msg) => msg.role === "user")
    if (lastUserMessageIndex === -1) return

    // Remove the last assistant message
    const newMessages = messages.slice(0, -1)
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response")
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message.content,
        signature: data.signature,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I encountered an error regenerating the response. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
          <div className="flex flex-col items-center text-center max-w-md gap-2">
            <div className="p-3 bg-accent/10 rounded-full mb-2">
              <LockIcon className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-2xl font-mono tracking-tight text-foreground">PRIVATE AI ASSISTANT</h2>
            <p className="text-fg-muted font-sans">
              Your conversations are secure and private. Ask anything without compromising your data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
            {[
              {
                icon: <ShieldIcon className="w-5 h-5 text-accent" />,
                title: "END-TO-END ENCRYPTION",
                description: "Your messages are encrypted and cannot be accessed by third parties.",
              },
              {
                icon: <LockIcon className="w-5 h-5 text-accent" />,
                title: "ZERO DATA STORAGE",
                description: "We don't store your conversations or personal information.",
              },
              {
                icon: <ShieldIcon className="w-5 h-5 text-accent" />,
                title: "VERIFIED RESPONSES",
                description: "All AI responses are cryptographically signed for authenticity.",
              },
            ].map((feature, i) => (
              <div key={i} className="bg-bg-lighter p-4 rounded-lg border border-border-color/20">
                <div className="flex items-center gap-2 mb-2">
                  {feature.icon}
                  <h3 className="font-mono text-sm">{feature.title}</h3>
                </div>
                <p className="text-sm text-fg-muted font-sans">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto py-6 px-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message, i) => (
              <Message
                key={i}
                role={message.role}
                content={message.content}
                signature={message.signature}
                onRegenerate={i === messages.length - 1 && message.role === "assistant" ? handleRegenerate : undefined}
              />
            ))}
            {isLoading && <LoadingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </main>
      )}

      <div className="p-4 border-t border-border-color/30 bg-bg-lighter">
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        <div className="mt-2 text-xs text-center text-fg-muted font-mono tracking-tight">
          <p>POWERED BY SECURE AI TECHNOLOGY • ALL MESSAGES ARE ENCRYPTED</p>
        </div>
      </div>
    </div>
  )
}

