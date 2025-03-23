export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  signature?: string;
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
  }>;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatStorage {
  chats: Chat[];
  activeChatId: string | null;
  updatedAt: number;
}
