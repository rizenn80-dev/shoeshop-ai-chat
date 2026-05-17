import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "AI Chat Manager — Shoe Store Assistant" },
      {
        name: "description",
        content:
          "AI Chat Manager for shoe store operations: inventory, sales, and customer support in one conversational interface.",
      },
    ],
  }),
});

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "Show today's top selling sneakers",
  "Check stock for Nike Air Max size 10",
  "Summarize this week's revenue",
  "Draft a restock order for Adidas",
];

function Index() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AI Chat Manager for the shoe store. Ask me about inventory, sales, customers, or restocking.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const reply: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Got it — I'll handle that once the backend is connected. (No backend wired up yet.)",
    };
    setMessages((m) => [...m, userMsg, reply]);
    setInput("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Footprints className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">AI Chat Manager</h1>
            <p className="text-xs text-muted-foreground">Shoe store operations assistant</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="space-y-6 py-6">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
        </div>

        {messages.length <= 1 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="sticky bottom-0 mb-4 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about inventory, sales, customers…"
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button type="submit" size="icon" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </main>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-muted text-foreground",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
