import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  title: string;
  isResponding: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  newChat: () => void;
};

const DEFAULT_TITLE = "New Chat";

const welcome = (): ChatMessage => ({
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm your AI Chat Manager for the shoe store. Ask me about inventory, sales, customers, or restocking.",
  createdAt: Date.now(),
});

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const deriveTitle = (text: string) => {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return DEFAULT_TITLE;
  return clean.length > 48 ? clean.slice(0, 48) + "…" : clean;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [welcome()],
      title: DEFAULT_TITLE,
      isResponding: false,
      error: null,

      newChat: () =>
        set({
          messages: [welcome()],
          title: DEFAULT_TITLE,
          isResponding: false,
          error: null,
        }),

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

        const hasUserMessage = get().messages.some((m) => m.role === "user");

        set((s) => ({
          messages: [...s.messages, userMsg, placeholder],
          isResponding: true,
          error: null,
          title: hasUserMessage ? s.title : deriveTitle(trimmed),
        }));

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
                m.id === placeholderId
                  ? { ...m, content: acc, pending: false }
                  : m,
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
          const message =
            err instanceof Error ? err.message : "Something went wrong";
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
    }),
    {
      name: "ai-chat-manager:conversation",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? (undefined as never) : localStorage,
      ),
      partialize: (s) => ({ messages: s.messages, title: s.title }),
    },
  ),
);
