import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageActions } from "./message-actions";
import {
  FileText,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  FileArchive,
  File,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface Task {
  id: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  result?: string;
}

interface MCPServer {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "connecting";
  type: "standard_io" | "sse";
  command?: string;
  arguments?: string;
  url?: string;
  tools: {
    id: string;
    name: string;
    status: "idle" | "running" | "completed";
    lastUsed?: string;
  }[];
}

interface MessageProps {
  role: "user" | "assistant";
  content: string;
  signature?: string;
  tasks?: Task[];
  consolidatedResult?: string;
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
    content?: string;
  }>;
  onRegenerate?: () => void;
  server?: MCPServer;
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

export function Message({
  role,
  content,
  signature,
  tasks,
  consolidatedResult,
  attachments,
  onRegenerate,
  server,
}: MessageProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const completedTasks =
    tasks?.filter((task) => task.status === "completed").length ?? 0;
  const totalTasks = tasks?.length ?? 0;

  return (
    <div
      className={`message-container ${
        role === "user" ? "flex justify-end" : "flex justify-start"
      }`}
    >
      <div
        className={`message ${
          role === "user" ? "user-message" : "assistant-message"
        } relative`}
      >
        {attachments && attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-[#282d45] px-3 py-1.5 rounded-md text-sm text-[#a4a9c3]"
              >
                {getFileTypeIcon(file.type)}
                <span className="truncate max-w-[200px]">{file.name}</span>
              </div>
            ))}
          </div>
        )}

        {role === "assistant" ? (
          <div className="markdown message-content font-input">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ node, ...props }) => (
                  <a target="_blank" rel="noopener noreferrer" {...props} />
                ),
                code: ({ children, className, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !className;
                  return (
                    <code
                      className={`${isInline ? "inline" : "block"} font-code`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p: ({ children }) => <p className="font-input">{children}</p>,
                h1: ({ children }) => <h1 className="font-mono">{children}</h1>,
                h2: ({ children }) => <h2 className="font-mono">{children}</h2>,
                h3: ({ children }) => <h3 className="font-mono">{children}</h3>,
                h4: ({ children }) => <h4 className="font-mono">{children}</h4>,
                h5: ({ children }) => <h5 className="font-mono">{children}</h5>,
                h6: ({ children }) => <h6 className="font-mono">{children}</h6>,
              }}
            >
              {content}
            </ReactMarkdown>

            {server && (
              <div className="mt-4 p-3 bg-[#1e2235] border border-[#222639] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        server.status === "connected"
                          ? "bg-[#4ade80]"
                          : server.status === "connecting"
                          ? "bg-[#99a3ff] animate-pulse"
                          : "bg-[#a4a9c3]"
                      }`}
                    />
                    <span className="text-sm text-white">{server.name}</span>
                  </div>
                  <span className="text-xs text-[#a4a9c3]">
                    {server.type === "standard_io"
                      ? `${server.command} ${server.arguments}`
                      : server.url}
                  </span>
                </div>
              </div>
            )}

            {tasks && tasks.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-sm text-[#a4a9c3] mb-2">
                  {completedTasks} of {totalTasks} tasks completed
                </div>

                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-[#1e2235] border border-[#222639] rounded-lg p-3"
                    >
                      <button
                        onClick={() =>
                          setExpandedTaskId(
                            expandedTaskId === task.id ? null : task.id
                          )
                        }
                        className="w-full"
                      >
                        <div className="flex items-center gap-3">
                          {task.status === "completed" ? (
                            <CheckCircle2 className="w-5 h-5 text-[#4ade80]" />
                          ) : task.status === "in_progress" ? (
                            <Circle className="w-5 h-5 text-[#99a3ff] animate-pulse" />
                          ) : (
                            <Circle className="w-5 h-5 text-[#a4a9c3]" />
                          )}
                          <span className="flex-1 text-left text-sm text-white">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => (
                                  <span className="font-input inline">
                                    {children}
                                  </span>
                                ),
                                code: ({ children }) => (
                                  <code className="font-code bg-[#282d45] px-1 py-0.5 rounded">
                                    {children}
                                  </code>
                                ),
                              }}
                            >
                              {task.description}
                            </ReactMarkdown>
                          </span>
                          {task.result && (
                            <div className="text-[#a4a9c3]">
                              {expandedTaskId === task.id ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </div>
                          )}
                        </div>
                      </button>

                      {expandedTaskId === task.id && task.result && (
                        <div className="mt-2 ml-8 pt-2 border-t border-[#222639] text-sm text-[#a4a9c3]">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <p className="font-input">{children}</p>
                              ),
                            }}
                          >
                            {task.result}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {consolidatedResult && (
                  <div className="mt-4 pt-4 border-t border-[#222639]">
                    <div className="text-sm font-medium text-white mb-2">
                      Consolidated Result
                    </div>
                    <div className="text-sm text-[#a4a9c3]">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => (
                            <p className="font-input">{children}</p>
                          ),
                        }}
                      >
                        {consolidatedResult}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="message-content font-input">{content}</p>
        )}

        {role === "assistant" && (
          <div className="flex justify-start mt-2">
            <MessageActions
              content={content}
              signature={signature}
              onRegenerate={onRegenerate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
