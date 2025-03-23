"use client";

import { useState, useRef, useEffect } from "react";
import { Brain, MessageCircle } from "lucide-react";
import { ChatInput } from "./chat-input";
import { Message } from "./message";
import { LoadingIndicator } from "./loading-indicator";
import { Chat, ChatMessage } from "@/types/chat";
import {
  getChatStorage,
  saveChatStorage,
  createNewChat,
  updateChat,
  deleteChat,
  getChatById,
  setActiveChat,
} from "@/lib/chat-storage";
import { useRouter, useSearchParams } from "next/navigation";

interface Task {
  id: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  result?: string;
}

interface AgentMessage {
  role: "user" | "assistant";
  content: string;
  tasks?: Task[];
  signature?: string;
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
    content: string;
  }>;
}

export function AgentMode() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [attachments, setAttachments] = useState<
    Array<{ name: string; type: string; size: number; content: string }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat from URL or create new one
  useEffect(() => {
    const chatId = searchParams.get("chat");
    if (chatId) {
      const chat = getChatById(chatId);
      if (chat) {
        setCurrentChat(chat);
        setMessages(chat.messages as AgentMessage[]);
        setActiveChat(chatId);
      } else {
        // If chat not found, redirect to home
        router.push("/");
      }
    } else {
      // No chat ID in URL, start fresh
      setCurrentChat(null);
      setMessages([]);
      setActiveChat(null);
    }
  }, [searchParams, router]);

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments = await Promise.all(
      Array.from(files).map(async (file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        content: await file.text(),
      }))
    );

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRegenerate = async () => {
    if (isLoading || messages.length === 0) return;
    const lastUserMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === "user");
    if (!lastUserMessage) return;

    // Remove the last assistant message
    setMessages((prev) => prev.slice(0, -1));
    handleSendMessage(lastUserMessage.content);
  };

  const generateTitleFromContent = (content: string) => {
    const title = content.split("\n")[0].slice(0, 40);
    return title.length === 40 ? `${title}...` : title;
  };

  const breakdownTask = async (task: string) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Break down this task into 4 specific subtasks that can be executed sequentially: ${task}`,
            },
          ],
        }),
      });

      if (!response.ok) throw new Error("Failed to break down task");
      const data = await response.json();

      // Parse the response to extract subtasks
      const subtasksText = data.message.content;
      const subtasks = subtasksText
        .split("\n")
        .filter((line: string) => line.trim())
        .slice(0, 4)
        .map((task: string, index: number) => ({
          id: (index + 1).toString(),
          description: task.replace(/^\d+\.\s*/, "").trim(),
          status: "pending",
        }));

      return { subtasks, signature: data.signature };
    } catch (error) {
      console.error("Error breaking down task:", error);
      return {
        subtasks: [
          {
            id: "1",
            description: "Analyzing task requirements",
            status: "pending",
          },
          {
            id: "2",
            description: "Breaking down into subtasks",
            status: "pending",
          },
          { id: "3", description: "Executing subtasks", status: "pending" },
          { id: "4", description: "Synthesizing results", status: "pending" },
        ],
        signature: null,
      };
    }
  };

  const executeTask = async (task: string) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Execute this task and provide the result: ${task}`,
            },
          ],
        }),
      });

      if (!response.ok) throw new Error("Failed to execute task");
      const data = await response.json();
      return { result: data.message.content, signature: data.signature };
    } catch (error) {
      console.error("Error executing task:", error);
      return { result: `Completed ${task}`, signature: null };
    }
  };

  const handleSendMessage = async (content: string) => {
    if (isLoading || !content.trim()) return;

    const userMessage: AgentMessage = {
      role: "user",
      content,
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setAttachments([]);
    setIsLoading(true);

    try {
      // Break down the task
      const { subtasks, signature: breakdownSignature } = await breakdownTask(
        content
      );

      // Add initial assistant message with pending tasks
      const assistantMessage: AgentMessage = {
        role: "assistant",
        content: "Breaking down your task into manageable steps...",
        tasks: subtasks,
        signature: breakdownSignature,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      let finalResult = "Here are the results of each subtask:\n\n";

      // Process each task
      for (let i = 0; i < subtasks.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Update task to in_progress
        subtasks[i].status = "in_progress";
        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === prev.length - 1 ? { ...msg, tasks: [...subtasks] } : msg
          )
        );

        // Execute the task
        const { result, signature: taskSignature } = await executeTask(
          subtasks[i].description
        );

        // Update task to completed with result
        subtasks[i].status = "completed";
        subtasks[i].result = result;
        finalResult += `${i + 1}. ${subtasks[i].description}:\n${result}\n\n`;

        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === prev.length - 1
              ? {
                  ...msg,
                  tasks: [...subtasks],
                  signature: taskSignature,
                }
              : msg
          )
        );
      }

      // Update final message with consolidated results
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === prev.length - 1
            ? {
                ...msg,
                content: finalResult,
                tasks: [...subtasks],
              }
            : msg
        )
      );

      // Save chat
      if (!currentChat) {
        const newTitle = generateTitleFromContent(content);
        const newChat = createNewChat(newTitle);
        newChat.messages = [userMessage, assistantMessage];
        newChat.updatedAt = Date.now();
        setCurrentChat(newChat);
        setActiveChat(newChat.id);
        updateChat(newChat);
        router.push(`/?chat=${newChat.id}`);
      } else {
        currentChat.messages = [...messages, userMessage, assistantMessage];
        currentChat.updatedAt = Date.now();
        updateChat(currentChat);
      }
    } catch (error) {
      console.error("Error in agent mode:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I encountered an error processing your task. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between border-b border-[#222639] bg-[#11131d]/30 backdrop-blur-sm relative">
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#99a3ff]/10 to-transparent" />
        <div className="w-[68px]" />
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#99a3ff]" />
          <h2 className="font-mono text-sm text-[#a4a9c3]">Agent Mode</h2>
        </div>
        <div className="w-[68px]" />
      </div>

      <main className="flex-1 overflow-y-auto py-4 px-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
            <div className="flex flex-col items-center text-center max-w-md gap-2">
              <div className="p-6 rounded-full mb-2">
                <Brain className="w-32 h-32 text-[#99a3ff]" />
              </div>
              <h2 className="text-2xl font-mono tracking-tight text-foreground">
                AGENT MODE
              </h2>
              <p className="text-[#a4a9c3] font-sans">
                Break down complex tasks into manageable steps and execute them
                systematically.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message, i) => (
              <Message
                key={i}
                role={message.role}
                content={message.content}
                signature={message.signature}
                tasks={message.tasks}
                attachments={message.attachments}
                onRegenerate={
                  i === messages.length - 1 && message.role === "assistant"
                    ? handleRegenerate
                    : undefined
                }
              />
            ))}
            {isLoading && <LoadingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <div className="relative p-4">
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 w-full max-w-2xl mx-auto">
          <div className="relative flex items-start bg-[#1e2235] border border-[#222639] rounded-lg shadow-lg mx-4">
            {attachments.length > 0 && (
              <div className="absolute -top-12 left-0 right-0 flex flex-wrap gap-2 p-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-[#282d45] px-3 py-1.5 rounded-md text-sm text-[#a4a9c3]"
                  >
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-[#a4a9c3] hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex-1">
              <ChatInput
                onSend={(msg) => {
                  handleSendMessage(msg);
                  setMessage("");
                }}
                isLoading={isLoading}
                message={message}
                setMessage={setMessage}
                isFirstMessage={messages.length === 0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
