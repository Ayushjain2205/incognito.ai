"use client";

import { useState } from "react";
import { Network, Server, Wrench, Activity } from "lucide-react";

interface Server {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "connecting";
  tools: Tool[];
}

interface Tool {
  id: string;
  name: string;
  status: "idle" | "running" | "completed";
  lastUsed?: string;
}

export function MCPMode() {
  const [servers, setServers] = useState<Server[]>([
    {
      id: "1",
      name: "Local MCP Server",
      status: "connected",
      tools: [
        {
          id: "1",
          name: "File System",
          status: "idle",
        },
        {
          id: "2",
          name: "Process Manager",
          status: "idle",
        },
        {
          id: "3",
          name: "Network Tools",
          status: "idle",
        },
      ],
    },
    {
      id: "2",
      name: "Remote MCP Server",
      status: "disconnected",
      tools: [
        {
          id: "4",
          name: "Database Tools",
          status: "idle",
        },
        {
          id: "5",
          name: "API Gateway",
          status: "idle",
        },
      ],
    },
  ]);

  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (serverId: string) => {
    setIsConnecting(true);
    setServers((prev) =>
      prev.map((server) =>
        server.id === serverId ? { ...server, status: "connecting" } : server
      )
    );

    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setServers((prev) =>
      prev.map((server) =>
        server.id === serverId ? { ...server, status: "connected" } : server
      )
    );
    setIsConnecting(false);
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

    // Simulate tool execution
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

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between border-b border-[#222639] bg-[#11131d]/30 backdrop-blur-sm relative">
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#99a3ff]/10 to-transparent" />
        <div className="w-[68px]" />
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-[#99a3ff]" />
          <h2 className="font-mono text-sm text-[#a4a9c3]">MCP Mode</h2>
        </div>
        <div className="w-[68px]" />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servers.map((server) => (
              <div
                key={server.id}
                className="bg-[#1e2235] border border-[#222639] rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-[#99a3ff]" />
                    <span className="text-sm text-white">{server.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {server.status === "disconnected" && (
                      <button
                        onClick={() => handleConnect(server.id)}
                        disabled={isConnecting}
                        className="px-3 py-1 text-xs bg-[#99a3ff] text-white rounded-md hover:bg-[#99a3ff]/90 transition-colors disabled:opacity-50"
                      >
                        {isConnecting ? "Connecting..." : "Connect"}
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

                <div className="space-y-2">
                  {server.tools.map((tool) => (
                    <div
                      key={tool.id}
                      className="flex items-center justify-between p-2 bg-[#282d45] rounded-md"
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
    </div>
  );
}
