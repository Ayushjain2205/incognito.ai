import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageActions } from "./message-actions";
import {
  Paperclip,
  FileText,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  FileArchive,
  File,
} from "lucide-react";

interface MessageProps {
  role: "user" | "assistant";
  content: string;
  signature?: string;
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
  }>;
  onRegenerate?: () => void;
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
  attachments,
  onRegenerate,
}: MessageProps) {
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
                // Override default link behavior to open in new tab
                a: ({ node, ...props }) => (
                  <a target="_blank" rel="noopener noreferrer" {...props} />
                ),
                // Ensure code blocks use the right font and styling
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
                // Ensure consistent font usage
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
          </div>
        ) : (
          <p className="message-content font-input">{content}</p>
        )}

        {role === "assistant" && (
          <div className="flex justify-start">
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
