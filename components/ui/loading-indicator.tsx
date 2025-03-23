export function LoadingIndicator() {
    return (
      <div className="message-container flex justify-start">
        <div className="message assistant-message flex items-center gap-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
          <span className="text-sm text-fg-muted font-input" style={{ fontFamily: "var(--font-jetbrains)" }}>
            Processing securely...
          </span>
        </div>
      </div>
    )
  }
  
  