import { Chat, ChatStorage } from "@/types/chat";

const STORAGE_KEY = "incognito_chats";

export function getChatStorage(): ChatStorage {
  if (typeof window === "undefined") {
    return { chats: [], activeChatId: null, updatedAt: Date.now() };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { chats: [], activeChatId: null, updatedAt: Date.now() };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return { chats: [], activeChatId: null, updatedAt: Date.now() };
  }
}

export function saveChatStorage(storage: ChatStorage) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  // Trigger storage event
  window.dispatchEvent(new Event("storage"));
}

export function createNewChat(title: string = "New Chat"): Chat {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function updateChat(chat: Chat) {
  const storage = getChatStorage();
  const chatIndex = storage.chats.findIndex((c) => c.id === chat.id);

  if (chatIndex === -1) {
    storage.chats.push(chat);
  } else {
    storage.chats[chatIndex] = chat;
  }

  storage.updatedAt = Date.now();
  saveChatStorage(storage);
}

export function deleteChat(chatId: string) {
  const storage = getChatStorage();
  storage.chats = storage.chats.filter((chat) => chat.id !== chatId);

  if (storage.activeChatId === chatId) {
    storage.activeChatId = null;
  }

  storage.updatedAt = Date.now();
  saveChatStorage(storage);
}

export function getChatById(chatId: string): Chat | null {
  const storage = getChatStorage();
  return storage.chats.find((chat) => chat.id === chatId) || null;
}

export function setActiveChat(chatId: string | null) {
  const storage = getChatStorage();
  storage.activeChatId = chatId;
  storage.updatedAt = Date.now();
  saveChatStorage(storage);
}
