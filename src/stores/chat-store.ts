import { create } from "zustand";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  pending?: boolean;
  createdAt: number;
};

type ChatState = {
  messages: ChatMessage[];
  isResponding: boolean;
  sendMessage: (content: string) => void;
  resolvePlaceholder: (id: string, content: string) => void;
  reset: () => void;
};

const welcome: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm your AI Chat Manager for the shoe store. Ask me about inventory, sales, customers, or restocking.",
  createdAt: Date.now(),
};

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [welcome],
  isResponding: false,

  sendMessage: (content) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: newId(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    const placeholder: ChatMessage = {
      id: newId(),
      role: "assistant",
      content: "",
      pending: true,
      createdAt: Date.now(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg, placeholder],
      isResponding: true,
    }));

    // Simulated AI response — replace with real backend call later.
    setTimeout(() => {
      get().resolvePlaceholder(
        placeholder.id,
        "Got it — I'll handle that once the backend is connected.",
      );
    }, 900);
  },

  resolvePlaceholder: (id, content) =>
    set((s) => ({
      isResponding: false,
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, content, pending: false } : m,
      ),
    })),

  reset: () => set({ messages: [welcome], isResponding: false }),
}));
