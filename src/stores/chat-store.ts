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
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
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
  error: null,

  sendMessage: async (content) => {
    const trimmed = content.trim();
    if (!trimmed || get().isResponding) return;

    const userMsg: ChatMessage = {
      id: newId(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    const placeholderId = newId();
    const placeholder: ChatMessage = {
      id: placeholderId,
      role: "assistant",
      content: "",
      pending: true,
      createdAt: Date.now(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg, placeholder],
      isResponding: true,
      error: null,
    }));

    // Build payload from real chat history (exclude the placeholder and welcome).
    const history = get()
      .messages.filter((m) => m.id !== placeholderId && m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === placeholderId ? { ...m, content: acc, pending: false } : m,
          ),
        }));
      }

      set((s) => ({
        isResponding: false,
        messages: s.messages.map((m) =>
          m.id === placeholderId
            ? { ...m, content: acc || "(no response)", pending: false }
            : m,
        ),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      set((s) => ({
        isResponding: false,
        error: message,
        messages: s.messages.map((m) =>
          m.id === placeholderId
            ? { ...m, content: `⚠️ ${message}`, pending: false }
            : m,
        ),
      }));
    }
  },

  reset: () => set({ messages: [welcome], isResponding: false, error: null }),
}));
