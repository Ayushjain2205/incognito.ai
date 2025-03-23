"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/ui/header";
import { Sidebar } from "@/components/ui/sidebar";
import { Message } from "@/components/ui/message";
import { ChatInput } from "@/components/ui/chat-input";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import {
  ShieldIcon,
  LockIcon,
  MoreVertical,
  MessageCircle,
  Paperclip,
  SendIcon,
  FileText,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  FileArchive,
  File,
  CheckCircle2,
  XCircle,
} from "lucide-react";
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
import { createPortal } from "react-dom";
import Image from "next/image";

interface AttestationReport {
  verifying_key: string;
  cpu_attestation: string;
  gpu_attestation: string;
}

const getFileTypeIcon = (fileType: string) => {
  // Document types
  if (
    fileType.match(
      /^(text|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document))$/
    )
  ) {
    return <FileText className="w-4 h-4" />;
  }

  // Code types
  if (
    fileType.match(
      /^(text\/(javascript|python|java|c|c\+\+|php|ruby|go|rust|swift|typescript|html|css|json|xml|yaml|markdown))$/
    )
  ) {
    return <FileCode className="w-4 h-4" />;
  }

  // Image types
  if (fileType.match(/^image\/(jpeg|png|gif|webp|svg|bmp|tiff)$/)) {
    return <FileImage className="w-4 h-4" />;
  }

  // Spreadsheet types
  if (
    fileType.match(
      /^application\/(vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)$/
    )
  ) {
    return <FileSpreadsheet className="w-4 h-4" />;
  }

  // Video types
  if (fileType.match(/^video\/(mp4|webm|ogg|mov|avi)$/)) {
    return <FileVideo className="w-4 h-4" />;
  }

  // Audio types
  if (fileType.match(/^audio\/(mp3|wav|ogg|m4a)$/)) {
    return <FileAudio className="w-4 h-4" />;
  }

  // Archive types
  if (fileType.match(/^application\/(zip|rar|7z|tar|gz)$/)) {
    return <FileArchive className="w-4 h-4" />;
  }

  // Default file icon
  return <File className="w-4 h-4" />;
};

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatTitle, setChatTitle] = useState<string>("New Chat");
  const [isRenaming, setIsRenaming] = useState(false);
  const [showTitleMenu, setShowTitleMenu] = useState(false);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<
    Array<{ name: string; type: string; size: number }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const titleButtonRef = useRef<HTMLButtonElement>(null);
  const [attestationReport, setAttestationReport] =
    useState<AttestationReport | null>(null);
  const [isLoadingAttestation, setIsLoadingAttestation] = useState(false);
  const [showAttestation, setShowAttestation] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);

  // Load chat from URL or create new one
  useEffect(() => {
    const chatId = searchParams.get("chat");
    if (chatId) {
      const chat = getChatById(chatId);
      if (chat) {
        setCurrentChat(chat);
        setMessages(chat.messages);
        setChatTitle(chat.title);
        setActiveChat(chatId);
      } else {
        // If chat not found, redirect to home
        router.push("/");
      }
    } else {
      // No chat ID in URL, start fresh
      setCurrentChat(null);
      setMessages([]);
      setChatTitle("New Chat");
      setActiveChat(null);
    }
  }, [searchParams, router]);

  // Update lastSignature when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const lastAssistantMessage = [...messages]
        .reverse()
        .find((msg) => msg.role === "assistant");
      if (lastAssistantMessage?.signature) {
        setLastSignature(lastAssistantMessage.signature);
      }
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to generate title from content
  const generateTitleFromContent = (content: string) => {
    // Take first ~40 characters of content or up to the first newline
    const title = content.split("\n")[0].slice(0, 40);
    return title.length === 40 ? `${title}...` : title;
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments = Array.from(files).map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
    }));

    // Append new attachments to existing ones
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (message: string) => {
    if (isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: message,
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setAttachments([]); // Clear attachments after sending
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
            attachments: msg.attachments,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message.content,
        signature: data.signature,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // If this is the first message, create a new chat after getting the response
      if (!currentChat) {
        const newTitle = generateTitleFromContent(message);
        const newChat = createNewChat(newTitle);
        newChat.messages = [userMessage, assistantMessage];
        newChat.updatedAt = Date.now();
        setCurrentChat(newChat);
        setChatTitle(newTitle);
        setActiveChat(newChat.id);
        updateChat(newChat);
        router.push(`/?chat=${newChat.id}`);
      } else {
        // Update existing chat in storage
        currentChat.messages = [...messages, userMessage, assistantMessage];
        currentChat.updatedAt = Date.now();
        updateChat(currentChat);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I encountered an error processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (isLoading || messages.length === 0) return;

    // Find the last user message
    const lastUserMessageIndex = [...messages]
      .reverse()
      .findIndex((msg) => msg.role === "user");
    if (lastUserMessageIndex === -1) return;

    // Remove the last assistant message
    const newMessages = messages.slice(0, -1);
    setMessages(newMessages);
    setIsLoading(true);

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
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message.content,
        signature: data.signature,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update chat in storage
      if (currentChat) {
        currentChat.messages = [...newMessages, assistantMessage];
        currentChat.updatedAt = Date.now();
        updateChat(currentChat);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I encountered an error regenerating the response. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRename = () => {
    setIsRenaming(true);
    setShowTitleMenu(false);
    // Focus the input after it's rendered
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 0);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRenaming(false);
    if (currentChat) {
      currentChat.title = chatTitle;
      currentChat.updatedAt = Date.now();
      updateChat(currentChat);
    }
  };

  const handleNewChat = () => {
    setCurrentChat(null);
    setMessages([]);
    setChatTitle("New Chat");
    setActiveChat(null);
    router.push("/");
  };

  const handleDeleteChat = () => {
    if (currentChat) {
      setShowTitleMenu(false); // Close menu immediately
      deleteChat(currentChat.id);
      setActiveChat(null); // Clear active chat
      setCurrentChat(null); // Clear current chat
      setMessages([]); // Clear messages
      setChatTitle("New Chat"); // Reset title
      router.push("/"); // Navigate to home
    }
  };

  const updateMenuPosition = () => {
    if (titleButtonRef.current) {
      const rect = titleButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + rect.width / 2,
      });
    }
  };

  useEffect(() => {
    if (showTitleMenu) {
      updateMenuPosition();
      window.addEventListener("scroll", updateMenuPosition);
      window.addEventListener("resize", updateMenuPosition);
    }
    return () => {
      window.removeEventListener("scroll", updateMenuPosition);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [showTitleMenu]);

  const fetchAttestationReport = async () => {
    setIsLoadingAttestation(true);
    try {
      const response = await fetch("/api/attestation");
      if (!response.ok) {
        throw new Error("Failed to fetch attestation");
      }
      const data = await response.json();
      setAttestationReport(data);
    } catch (error) {
      console.error("Error fetching attestation:", error);
    } finally {
      setIsLoadingAttestation(false);
    }
  };

  // Secure connection pill component
  const SecureConnectionPill = () => (
    <div className="relative">
      <button
        onClick={() => {
          setShowAttestation(!showAttestation);
          if (!attestationReport) {
            fetchAttestationReport();
          }
        }}
        className="flex items-center gap-1 bg-[#11131d]/70 px-3 py-1 rounded-full text-xs text-[#a4a9c3] backdrop-blur-sm hover:bg-[#11131d] transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-[#4ade80]/90"></span>
        <span className="font-mono">SECURE CONNECTION</span>
      </button>

      {showAttestation && (
        <div className="absolute right-0 mt-2 w-80 bg-[#1e2235] border border-[#222639] rounded-lg shadow-lg p-4 z-[9999]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-sm text-white">Attestation Report</h3>
            <button
              onClick={() => setShowAttestation(false)}
              className="text-[#a4a9c3] hover:text-white transition-colors"
            >
              ×
            </button>
          </div>

          {isLoadingAttestation ? (
            <div className="text-sm text-[#a4a9c3]">Loading attestation...</div>
          ) : attestationReport ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-[#a4a9c3] mb-1">Verifying Key</div>
                <div className="font-mono text-xs bg-[#282d45] p-2 rounded truncate">
                  {attestationReport.verifying_key}
                </div>
              </div>

              <div>
                <div className="text-xs text-[#a4a9c3] mb-1">
                  CPU Attestation
                </div>
                <div className="font-mono text-xs bg-[#282d45] p-2 rounded truncate">
                  {attestationReport.cpu_attestation}
                </div>
              </div>

              <div>
                <div className="text-xs text-[#a4a9c3] mb-1">
                  GPU Attestation
                </div>
                <div className="font-mono text-xs bg-[#282d45] p-2 rounded truncate">
                  {attestationReport.gpu_attestation}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-[#a4a9c3]">
              Failed to load attestation
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#161926]">
      <Sidebar onNewChat={handleNewChat} />

      <div className="flex-1 flex flex-col h-full">
        {messages.length === 0 ? (
          <>
            <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
              <div className="flex flex-col items-center text-center max-w-md gap-2">
                <div className="p-6 rounded-full mb-2">
                  <Image
                    src="/incognito.svg"
                    alt="Incognito"
                    width={200}
                    height={240}
                    className="text-[#99a3ff]"
                  />
                </div>
                <h2 className="text-2xl font-mono tracking-tight text-foreground">
                  PRIVATE AI ASSISTANT
                </h2>
                <p className="text-[#a4a9c3] font-sans">
                  Your conversations are secure and private. Ask anything
                  without compromising your data.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                {[
                  {
                    icon: <ShieldIcon className="w-5 h-5 text-[#99a3ff]" />,
                    title: "END-TO-END ENCRYPTION",
                    description:
                      "Your messages are encrypted and cannot be accessed by third parties.",
                  },
                  {
                    icon: <LockIcon className="w-5 h-5 text-[#99a3ff]" />,
                    title: "ZERO DATA STORAGE",
                    description:
                      "We don't store your conversations or personal information.",
                  },
                  {
                    icon: <ShieldIcon className="w-5 h-5 text-[#99a3ff]" />,
                    title: "VERIFIED RESPONSES",
                    description:
                      "All AI responses are cryptographically signed for authenticity.",
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="bg-[#1e2235]/50 p-4 rounded-lg border border-[#222639] backdrop-blur-sm hover:border-[#99a3ff]/20 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {feature.icon}
                      <h3 className="font-mono text-sm">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-[#a4a9c3] font-sans">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 flex items-center justify-between border-b border-[#222639] bg-[#11131d]/30 backdrop-blur-sm relative">
              <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#99a3ff]/10 to-transparent" />
              <div className="w-[68px]" />
              <div className="flex items-center gap-2 title-menu-container">
                {isRenaming ? (
                  <form
                    onSubmit={handleRenameSubmit}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4 text-[#99a3ff]" />
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={chatTitle}
                      onChange={(e) => setChatTitle(e.target.value)}
                      onBlur={() => setIsRenaming(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setIsRenaming(false);
                        }
                      }}
                      className="bg-transparent border-none outline-none font-mono text-sm text-center text-[#a4a9c3] w-64 focus:ring-0"
                    />
                  </form>
                ) : (
                  <div className="relative group">
                    <button
                      ref={titleButtonRef}
                      onClick={() => setShowTitleMenu(!showTitleMenu)}
                      className="flex items-center gap-2 hover:text-white transition-colors group/title"
                    >
                      <MessageCircle className="w-4 h-4 text-[#99a3ff]" />
                      <h2 className="font-mono text-sm text-center text-[#a4a9c3] group-hover/title:text-white">
                        {chatTitle}
                      </h2>
                      <MoreVertical className="w-4 h-4 text-[#a4a9c3] opacity-0 group-hover/title:opacity-100 transition-opacity" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-end min-w-[68px]">
                <SecureConnectionPill />
              </div>
            </div>
            <main className="flex-1 overflow-y-auto py-4 px-4">
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((message, i) => (
                  <Message
                    key={i}
                    role={message.role}
                    content={message.content}
                    signature={message.signature}
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
            </main>
          </>
        )}

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
                      {getFileTypeIcon(file.type)}
                      <span className="truncate max-w-[200px]">
                        {file.name}
                      </span>
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
              <div className="flex-1 pr-28">
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
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileAttach}
                  className="hidden"
                  multiple
                />
                <button
                  className="p-2 text-[#a4a9c3] hover:text-white transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  form="chat-form"
                  disabled={!message?.trim() || isLoading}
                  className="p-2 text-[#99a3ff] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#99a3ff]/10 hover:bg-[#99a3ff]/20 rounded-md"
                >
                  <SendIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTitleMenu &&
        createPortal(
          <div
            className="fixed z-[9999]"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              transform: "translateX(-50%)",
            }}
          >
            <div className="bg-[#1e2235] border border-[#222639] rounded-md shadow-lg py-1 min-w-[120px] backdrop-blur-none">
              <button
                onClick={handleRename}
                className="w-full px-3 py-1.5 text-left text-sm text-[#a4a9c3] hover:bg-[#282d45] transition-colors"
              >
                Rename
              </button>
              <button
                onClick={handleDeleteChat}
                className="w-full px-3 py-1.5 text-left text-sm text-[#a4a9c3] hover:bg-[#282d45] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
