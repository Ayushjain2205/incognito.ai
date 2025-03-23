import { NextResponse } from "next/server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";

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
      `${process.env.NILLION_API_URL}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NILLION_API_KEY}`,
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.1-8B-Instruct",
          messages: processedMessages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature: 0.7,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("API Error:", error);
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({
      message: data.choices[0].message,
      signature: data.signature,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
