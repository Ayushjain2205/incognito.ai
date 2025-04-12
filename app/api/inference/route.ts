import { NextResponse } from "next/server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

async function parseFileContent(file: any): Promise<string> {
  try {
    // Handle text files first - they should never be affected by PDF parsing
    if (file.type.startsWith("text/")) {
      return file.content;
    }

    // Handle PDF files
    if (file.type === "application/pdf") {
      try {
        // Convert base64 to buffer
        const buffer = Buffer.from(file.content, "base64");

        // Create a virtual file object that PDFLoader can read
        const virtualFile = {
          arrayBuffer: () => Promise.resolve(buffer),
          name: file.name,
          type: file.type,
        };

        // Load and parse the PDF
        const loader = new PDFLoader(virtualFile as any);
        const docs = await loader.load();

        // Split the text into chunks
        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });
        // @ts-ignore
        const splitDocs = await textSplitter.splitDocuments(docs);

        // Combine all chunks into a single text
        const fullText = splitDocs.map((doc) => doc.pageContent).join("\n\n");

        // Clean up the text content
        const cleanText = fullText
          .replace(/\s+/g, " ") // Replace multiple spaces with single space
          .replace(/\n+/g, "\n") // Replace multiple newlines with single newline
          .trim(); // Remove leading/trailing whitespace

        return cleanText;
      } catch (pdfError) {
        console.error("Error parsing PDF:", pdfError);
        return `[Error parsing PDF: ${file.name}]`;
      }
    }

    // Handle images
    if (file.type.startsWith("image/")) {
      return `[Image: ${file.name}]`;
    }

    // Handle code files
    if (
      file.type.startsWith("text/") &&
      file.name.match(
        /\.(js|ts|py|java|c|cpp|php|rb|go|rs|swift|html|css|json|xml|yaml|md)$/
      )
    ) {
      return `\`\`\`${file.name.split(".").pop()}\n${file.content}\n\`\`\``;
    }

    // Default case
    return `[File: ${file.name}]`;
  } catch (error) {
    console.error("Error parsing file:", error);
    return `[Error parsing file: ${file.name}]`;
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Process messages to handle file attachments
    const processedMessages = await Promise.all(
      messages.map(async (msg: any) => {
        if (msg.attachments && msg.attachments.length > 0) {
          // Parse each attachment
          const parsedContents = await Promise.all(
            msg.attachments.map(async (file: any) => {
              const content = await parseFileContent(file);
              return `\nFile: ${file.name}\n${content}\n`;
            })
          );

          // Combine original message with parsed file contents
          return {
            ...msg,
            content: `${msg.content}\n\nAttached Files:\n${parsedContents.join(
              "\n"
            )}`,
          };
        }
        return msg;
      })
    );

    const response = await fetch(
      "https://anura-testnet.lilypad.tech/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: `Bearer ${process.env.ANURA_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama3.1:8b",
          messages: [
            {
              role: "system",
              content: "You are a helpful AI assistant",
            },
            ...processedMessages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
            })),
          ],
          temperature: 0.6,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("API Error:", error);
      throw new Error(`API returned ${response.status}`);
    }

    // Set up streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Process any remaining data in the buffer
              if (buffer.trim()) {
                controller.enqueue(encoder.encode(`data: ${buffer}\n\n`));
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              break;
            }

            // Decode the chunk and add it to our buffer
            buffer += new TextDecoder().decode(value, { stream: true });

            // Split on newlines
            const lines = buffer.split("\n");

            // Keep the last line in the buffer if it's not complete
            buffer = lines.pop() || "";

            // Process complete lines
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine) {
                controller.enqueue(encoder.encode(`data: ${trimmedLine}\n\n`));
              }
            }
          }
        } catch (error) {
          console.error("Stream reading error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
