import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageActions } from "./message-actions";

interface MessageProps {
  role: "user" | "assistant";
  content: string;
  signature?: string;
  onRegenerate?: () => void;
}

export function Message({
  role,
  content,
  signature,
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
