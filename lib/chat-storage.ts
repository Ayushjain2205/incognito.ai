import { Chat, ChatStorage } from "@/types/chat";

const STORAGE_KEY = "incognito_chats";
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB limit to be safe
const MAX_CHATS = 50; // Maximum number of chats to keep

function getStorageSize(): number {
  if (typeof window === "undefined") return 0;
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total;
}

function cleanupOldChats(storage: ChatStorage): ChatStorage {
  // Sort chats by last updated time, oldest first
  const sortedChats = [...storage.chats].sort(
    (a, b) => a.updatedAt - b.updatedAt
  );

  // Keep only the most recent chats
  storage.chats = sortedChats.slice(-MAX_CHATS);

  // If active chat was removed, set it to null
  if (
    storage.activeChatId &&
    !storage.chats.find((c) => c.id === storage.activeChatId)
  ) {
    storage.activeChatId = null;
  }

  return storage;
}

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

  // Clean up old chats first
  storage = cleanupOldChats(storage);

  // Check storage size before saving
  const storageSize = getStorageSize();
  const newStorageSize = JSON.stringify(storage).length;

  if (storageSize + newStorageSize > MAX_STORAGE_SIZE) {
    // If we're still over the limit after cleanup, remove more old chats
    while (
      storage.chats.length > 0 &&
      getStorageSize() + newStorageSize > MAX_STORAGE_SIZE
    ) {
      storage.chats.shift(); // Remove oldest chat
    }

    // If we removed all chats, reset active chat
    if (storage.chats.length === 0) {
      storage.activeChatId = null;
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    // Trigger storage event
    window.dispatchEvent(new Event("storage"));
  } catch (error) {
    console.error("Failed to save chat storage:", error);
    // If save fails, try to save with minimal data
    const minimalStorage = {
      chats: storage.chats.slice(-5), // Keep only last 5 chats
      activeChatId: storage.activeChatId,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalStorage));
  }
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
