"use client";

import type React from "react";

import { useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  message: string;
  setMessage: (message: string) => void;
  isFirstMessage?: boolean;
}

export function ChatInput({
  onSend,
  isLoading,
  message,
  setMessage,
  isFirstMessage = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "inherit";
      const computed = window.getComputedStyle(textarea);
      const height =
        parseInt(computed.getPropertyValue("border-top-width"), 10) +
        parseInt(computed.getPropertyValue("padding-top"), 10) +
        textarea.scrollHeight +
        parseInt(computed.getPropertyValue("padding-bottom"), 10) +
        parseInt(computed.getPropertyValue("border-bottom-width"), 10);

      // Only expand if content needs more space
      if (textarea.value === "") {
        textarea.style.height = "44px"; // Default single line height
      } else {
        textarea.style.height = Math.min(height, 200) + "px";
      }
    };

    textarea.addEventListener("input", adjustHeight);
    adjustHeight(); // Initial adjustment
    return () => textarea.removeEventListener("input", adjustHeight);
  }, [message]); // Re-run when message changes

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    onSend(message);
    setMessage("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  };

  return (
    <form id="chat-form" onSubmit={handleSubmit} className="relative w-full">
      <textarea
        ref={textareaRef}
        rows={1}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        placeholder={
          isFirstMessage ? "Hello! How can I help you?" : "Ask anything..."
        }
        disabled={isLoading}
        className="w-full bg-transparent text-[#a4a9c3] placeholder:text-[#a4a9c3]/50 resize-none py-3 px-4 focus:outline-none font-mono text-sm h-[44px] max-h-[200px] overflow-y-auto"
      />
    </form>
  );
}
