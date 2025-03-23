import { MessageActions } from "./message-actions"

interface MessageProps {
  role: "user" | "assistant"
  content: string
  signature?: string
  onRegenerate?: () => void
}

export function Message({ role, content, signature, onRegenerate }: MessageProps) {
  return (
    <div className={`message-container ${role === "user" ? "flex justify-end" : "flex justify-start"}`}>
      <div className={`message ${role === "user" ? "user-message" : "assistant-message"} relative`}>
        <p className="message-content" style={{ fontFamily: "var(--font-jetbrains)" }}>
          {content}
        </p>

        {role === "assistant" && (
          <div className="flex justify-start">
            <MessageActions content={content} signature={signature} onRegenerate={onRegenerate} />
          </div>
        )}
      </div>
    </div>
  )
}

