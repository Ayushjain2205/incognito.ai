"use client";

import { useState, useRef, useEffect } from "react";
import {
  Network,
  Server,
  Wrench,
  Activity,
  Plus,
  MessageCircle,
  Globe,
  HardDrive,
  Calculator,
  FileText,
  Cloud,
  Newspaper,
  CloudRain,
  Terminal,
} from "lucide-react";
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

interface MCPServer {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "connecting";
  type: "standard_io" | "sse";
  category: "local" | "remote";
  description: string;
  command?: string;
  arguments?: string;
  url?: string;
  tools: Tool[];
}

interface Tool {
  id: string;
  name: string;
  status: "idle" | "running" | "completed";
  lastUsed?: string;
}

interface MCPMessage extends ChatMessage {
  server?: MCPServer;
}

export function MCPMode() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<MCPMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [showAddServer, setShowAddServer] = useState(false);
  const [newServer, setNewServer] = useState<Partial<MCPServer>>({
    type: "standard_io",
    name: "File System Server",
    category: "local",
    description:
      "Local file system operations and management with file browsing, search, and monitoring capabilities",
    command: "python3",
    arguments: "servers/file_system.py --port 8000",
    tools: [
      {
        id: "1",
        name: "File Browser",
        status: "idle",
      },
      {
        id: "2",
        name: "File Search",
        status: "idle",
      },
      {
        id: "3",
        name: "File Monitor",
        status: "idle",
      },
    ],
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [servers, setServers] = useState<MCPServer[]>([
    // Local Servers
    {
      id: "1",
      name: "File System Server",
      status: "connected",
      type: "standard_io",
      category: "local",
      description: "Local file system operations and management",
      command: "python",
      arguments: "fs_server.py",
      tools: [
        {
          id: "1",
          name: "File Browser",
          status: "idle",
        },
        {
          id: "2",
          name: "File Search",
          status: "idle",
        },
        {
          id: "3",
          name: "File Monitor",
          status: "idle",
        },
      ],
    },
    {
      id: "2",
      name: "Math Server",
      status: "connected",
      type: "standard_io",
      category: "local",
      description: "Advanced mathematical computations and analysis",
      command: "python",
      arguments: "math_server.py",
      tools: [
        {
          id: "4",
          name: "Calculator",
          status: "idle",
        },
        {
          id: "5",
          name: "Graph Plotter",
          status: "idle",
        },
        {
          id: "6",
          name: "Statistics",
          status: "idle",
        },
      ],
    },
    {
      id: "3",
      name: "Process Manager",
      status: "connected",
      type: "standard_io",
      category: "local",
      description: "System process monitoring and control",
      command: "node",
      arguments: "process_manager.js",
      tools: [
        {
          id: "7",
          name: "Process List",
          status: "idle",
        },
        {
          id: "8",
          name: "Resource Monitor",
          status: "idle",
        },
      ],
    },
    // Remote Servers
    {
      id: "4",
      name: "Hacker News API",
      status: "connected",
      type: "sse",
      category: "remote",
      description: "Real-time Hacker News stories and updates",
      url: "https://api.hn.algolia.com/api/v1/search",
      tools: [
        {
          id: "9",
          name: "Top Stories",
          status: "idle",
        },
        {
          id: "10",
          name: "Search",
          status: "idle",
        },
      ],
    },
    {
      id: "5",
      name: "Weather Service",
      status: "connected",
      type: "sse",
      category: "remote",
      description: "Global weather data and forecasts",
      url: "https://api.weather.com/v2/forecast",
      tools: [
        {
          id: "11",
          name: "Current Weather",
          status: "idle",
        },
        {
          id: "12",
          name: "5-Day Forecast",
          status: "idle",
        },
      ],
    },
    {
      id: "6",
      name: "News Feed",
      status: "connected",
      type: "sse",
      category: "remote",
      description: "Live news updates from multiple sources",
      url: "https://api.news.org/v1/live",
      tools: [
        {
          id: "13",
          name: "Headlines",
          status: "idle",
        },
        {
          id: "14",
          name: "Category Filter",
          status: "idle",
        },
      ],
    },
  ]);

  // Load chat from URL or create new one
  useEffect(() => {
    const chatId = searchParams.get("chat");
    if (chatId) {
      const chat = getChatById(chatId);
      if (chat) {
        setCurrentChat(chat);
        setMessages(chat.messages as MCPMessage[]);
        setActiveChat(chatId);
      } else {
        router.push("/");
      }
    } else {
      setCurrentChat(null);
      setMessages([]);
      setActiveChat(null);
    }
  }, [searchParams, router]);

  const handleConnect = async (serverId: string) => {
    setServers((prev) =>
      prev.map((server) =>
        server.id === serverId ? { ...server, status: "connecting" } : server
      )
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    setServers((prev) =>
      prev.map((server) =>
        server.id === serverId ? { ...server, status: "connected" } : server
      )
    );
  };

  const handleToolExecution = async (serverId: string, toolId: string) => {
    setServers((prev) =>
      prev.map((server) =>
        server.id === serverId
          ? {
              ...server,
              tools: server.tools.map((tool) =>
                tool.id === toolId ? { ...tool, status: "running" } : tool
              ),
            }
          : server
      )
    );

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setServers((prev) =>
      prev.map((server) =>
        server.id === serverId
          ? {
              ...server,
              tools: server.tools.map((tool) =>
                tool.id === toolId
                  ? {
                      ...tool,
                      status: "completed",
                      lastUsed: new Date().toLocaleTimeString(),
                    }
                  : tool
              ),
            }
          : server
      )
    );
  };

  const handleAddServer = () => {
    if (!newServer.name) return;

    const server: MCPServer = {
      id: crypto.randomUUID(),
      name: newServer.name,
      status: "disconnected",
      type: newServer.type || "standard_io",
      category: newServer.category || "local",
      description: newServer.description || "",
      tools: [],
      ...(newServer.type === "standard_io"
        ? { command: newServer.command, arguments: newServer.arguments }
        : { url: newServer.url }),
    };

    setServers((prev) => [...prev, server]);
    setShowAddServer(false);
    setNewServer({ type: "standard_io" });
  };

  const handleSendMessage = async (content: string) => {
    if (isLoading || !content.trim()) return;

    const userMessage: MCPMessage = {
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Simulate MCP processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const assistantMessage: MCPMessage = {
        role: "assistant",
        content: `Processed command: ${content}\nServers available: ${servers.length}`,
        server: servers.find((s) => s.status === "connected"),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (!currentChat) {
        const newChat = createNewChat(content.slice(0, 40));
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
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getServerIcon = (server: MCPServer) => {
    if (server.category === "local") {
      if (server.name.includes("File"))
        return <HardDrive className="w-5 h-5" />;
      if (server.name.includes("Math"))
        return <Calculator className="w-5 h-5" />;
      if (server.name.includes("Process"))
        return <Terminal className="w-5 h-5" />;
      return <Server className="w-5 h-5" />;
    } else {
      if (server.name.includes("News"))
        return <Newspaper className="w-5 h-5" />;
      if (server.name.includes("Weather"))
        return <CloudRain className="w-5 h-5" />;
      return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between border-b border-[#222639] bg-[#11131d]/30 backdrop-blur-sm relative">
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#99a3ff]/10 to-transparent" />
        <div className="w-[68px]" />
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-[#99a3ff]" />
          <h2 className="font-mono text-sm text-[#a4a9c3]">MCP Mode</h2>
        </div>
        <button
          onClick={() => setShowAddServer(true)}
          className="w-[68px] flex items-center justify-center text-[#a4a9c3] hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <main className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <>
            <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
              <div className="flex flex-col items-center text-center max-w-md gap-2">
                <div className="p-6 rounded-full mb-2">
                  <Network className="w-32 h-32 text-[#99a3ff]" />
                </div>
                <h2 className="text-2xl font-mono tracking-tight text-foreground">
                  MCP MODE
                </h2>
                <p className="text-[#a4a9c3] font-sans">
                  Control and monitor your MCP servers through a unified
                  interface.
                </p>
              </div>
            </div>

            {/* Server Grid - Only shown when no messages */}
            <div className="max-w-5xl mx-auto px-4">
              {/* Local Servers */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <HardDrive className="w-4 h-4 text-[#99a3ff]" />
                  <h3 className="text-sm font-mono text-[#a4a9c3]">
                    LOCAL SERVERS
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {servers
                    .filter((server) => server.category === "local")
                    .map((server) => (
                      <div
                        key={server.id}
                        className="bg-[#1e2235] border border-[#222639] rounded-lg p-4 hover:border-[#99a3ff]/20 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="text-[#99a3ff]">
                              {getServerIcon(server)}
                            </div>
                            <span className="text-sm text-white">
                              {server.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {server.status === "disconnected" && (
                              <button
                                onClick={() => handleConnect(server.id)}
                                className="px-3 py-1 text-xs bg-[#99a3ff] text-white rounded-md hover:bg-[#99a3ff]/90 transition-colors"
                              >
                                Connect
                              </button>
                            )}
                            <div
                              className={`w-2 h-2 rounded-full ${
                                server.status === "connected"
                                  ? "bg-[#4ade80]"
                                  : server.status === "connecting"
                                  ? "bg-[#99a3ff] animate-pulse"
                                  : "bg-[#a4a9c3]"
                              }`}
                            />
                          </div>
                        </div>

                        <p className="text-xs text-[#a4a9c3] mb-3">
                          {server.description}
                        </p>

                        <div className="space-y-2">
                          {server.tools.map((tool) => (
                            <div
                              key={tool.id}
                              className="flex items-center justify-between p-2 bg-[#282d45] rounded-md hover:bg-[#2a2f4a] transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-[#a4a9c3]" />
                                <span className="text-sm text-[#a4a9c3]">
                                  {tool.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {tool.lastUsed && (
                                  <span className="text-xs text-[#a4a9c3]">
                                    {tool.lastUsed}
                                  </span>
                                )}
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    tool.status === "running"
                                      ? "bg-[#99a3ff] animate-pulse"
                                      : tool.status === "completed"
                                      ? "bg-[#4ade80]"
                                      : "bg-[#a4a9c3]"
                                  }`}
                                />
                                {server.status === "connected" &&
                                  tool.status === "idle" && (
                                    <button
                                      onClick={() =>
                                        handleToolExecution(server.id, tool.id)
                                      }
                                      className="p-1 text-[#a4a9c3] hover:text-white transition-colors"
                                    >
                                      <Activity className="w-4 h-4" />
                                    </button>
                                  )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Remote Servers */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-4 h-4 text-[#99a3ff]" />
                  <h3 className="text-sm font-mono text-[#a4a9c3]">
                    REMOTE SERVERS
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {servers
                    .filter((server) => server.category === "remote")
                    .map((server) => (
                      <div
                        key={server.id}
                        className="bg-[#1e2235] border border-[#222639] rounded-lg p-4 hover:border-[#99a3ff]/20 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="text-[#99a3ff]">
                              {getServerIcon(server)}
                            </div>
                            <span className="text-sm text-white">
                              {server.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {server.status === "disconnected" && (
                              <button
                                onClick={() => handleConnect(server.id)}
                                className="px-3 py-1 text-xs bg-[#99a3ff] text-white rounded-md hover:bg-[#99a3ff]/90 transition-colors"
                              >
                                Connect
                              </button>
                            )}
                            <div
                              className={`w-2 h-2 rounded-full ${
                                server.status === "connected"
                                  ? "bg-[#4ade80]"
                                  : server.status === "connecting"
                                  ? "bg-[#99a3ff] animate-pulse"
                                  : "bg-[#a4a9c3]"
                              }`}
                            />
                          </div>
                        </div>

                        <p className="text-xs text-[#a4a9c3] mb-3">
                          {server.description}
                        </p>

                        <div className="space-y-2">
                          {server.tools.map((tool) => (
                            <div
                              key={tool.id}
                              className="flex items-center justify-between p-2 bg-[#282d45] rounded-md hover:bg-[#2a2f4a] transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-[#a4a9c3]" />
                                <span className="text-sm text-[#a4a9c3]">
                                  {tool.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {tool.lastUsed && (
                                  <span className="text-xs text-[#a4a9c3]">
                                    {tool.lastUsed}
                                  </span>
                                )}
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    tool.status === "running"
                                      ? "bg-[#99a3ff] animate-pulse"
                                      : tool.status === "completed"
                                      ? "bg-[#4ade80]"
                                      : "bg-[#a4a9c3]"
                                  }`}
                                />
                                {server.status === "connected" &&
                                  tool.status === "idle" && (
                                    <button
                                      onClick={() =>
                                        handleToolExecution(server.id, tool.id)
                                      }
                                      className="p-1 text-[#a4a9c3] hover:text-white transition-colors"
                                    >
                                      <Activity className="w-4 h-4" />
                                    </button>
                                  )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-3xl mx-auto px-4 space-y-4">
            {messages.map((message, i) => (
              <Message
                key={i}
                role={message.role}
                content={message.content}
                signature={message.signature}
                server={message.server}
              />
            ))}
            {isLoading && <LoadingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Add Server Modal */}
      {showAddServer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e2235] rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Add New Server</h3>
              <button
                onClick={() => setShowAddServer(false)}
                className="text-[#a4a9c3] hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#a4a9c3] mb-2">
                  Server Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., File System Server, Weather Service, Math Server"
                  value={newServer.name || ""}
                  onChange={(e) =>
                    setNewServer((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[#282d45] rounded-md text-white placeholder-[#a4a9c3] border border-[#222639] focus:outline-none focus:border-[#99a3ff]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#a4a9c3] mb-2">
                  Server Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      setNewServer((prev) => ({ ...prev, category: "local" }))
                    }
                    className={`p-3 rounded-md flex items-center justify-center gap-2 ${
                      newServer.category === "local"
                        ? "bg-[#99a3ff]/20 text-white"
                        : "bg-[#282d45] text-[#a4a9c3]"
                    }`}
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>Local</span>
                  </button>
                  <button
                    onClick={() =>
                      setNewServer((prev) => ({ ...prev, category: "remote" }))
                    }
                    className={`p-3 rounded-md flex items-center justify-center gap-2 ${
                      newServer.category === "remote"
                        ? "bg-[#99a3ff]/20 text-white"
                        : "bg-[#282d45] text-[#a4a9c3]"
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Remote</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#a4a9c3] mb-2">
                  Connection Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      setNewServer((prev) => ({ ...prev, type: "standard_io" }))
                    }
                    className={`p-3 rounded-md flex items-center justify-center gap-2 ${
                      newServer.type === "standard_io"
                        ? "bg-[#99a3ff]/20 text-white"
                        : "bg-[#282d45] text-[#a4a9c3]"
                    }`}
                  >
                    <Terminal className="w-4 h-4" />
                    <span>Standard IO</span>
                  </button>
                  <button
                    onClick={() =>
                      setNewServer((prev) => ({ ...prev, type: "sse" }))
                    }
                    className={`p-3 rounded-md flex items-center justify-center gap-2 ${
                      newServer.type === "sse"
                        ? "bg-[#99a3ff]/20 text-white"
                        : "bg-[#282d45] text-[#a4a9c3]"
                    }`}
                  >
                    <Network className="w-4 h-4" />
                    <span>SSE</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#a4a9c3] mb-2">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g., Local file system operations and management, Real-time weather updates"
                  value={newServer.description || ""}
                  onChange={(e) =>
                    setNewServer((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-[#282d45] rounded-md text-white placeholder-[#a4a9c3] border border-[#222639] focus:outline-none focus:border-[#99a3ff]"
                />
              </div>

              {newServer.type === "standard_io" ? (
                <>
                  <div>
                    <label className="block text-sm text-[#a4a9c3] mb-2">
                      Command
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., python3, node, java -jar"
                      value={newServer.command || ""}
                      onChange={(e) =>
                        setNewServer((prev) => ({
                          ...prev,
                          command: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-[#282d45] rounded-md text-white placeholder-[#a4a9c3] border border-[#222639] focus:outline-none focus:border-[#99a3ff]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#a4a9c3] mb-2">
                      Arguments
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., servers/file_system.py --port 8000, app.js --mode server"
                      value={newServer.arguments || ""}
                      onChange={(e) =>
                        setNewServer((prev) => ({
                          ...prev,
                          arguments: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-[#282d45] rounded-md text-white placeholder-[#a4a9c3] border border-[#222639] focus:outline-none focus:border-[#99a3ff]"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm text-[#a4a9c3] mb-2">
                    URL
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., https://api.weather.com/v1/stream, ws://localhost:8000/events"
                    value={newServer.url || ""}
                    onChange={(e) =>
                      setNewServer((prev) => ({ ...prev, url: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#282d45] rounded-md text-white placeholder-[#a4a9c3] border border-[#222639] focus:outline-none focus:border-[#99a3ff]"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowAddServer(false)}
                  className="px-4 py-2 text-[#a4a9c3] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddServer}
                  disabled={!newServer.name || !newServer.description}
                  className="px-4 py-2 bg-[#99a3ff] text-white rounded-md hover:bg-[#99a3ff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Server
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative p-4">
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 w-full max-w-2xl mx-auto">
          <div className="relative flex items-start bg-[#1e2235] border border-[#222639] rounded-lg shadow-lg mx-4">
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
