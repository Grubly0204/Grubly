"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage, SavedMealPlan } from "@/lib/types";
import MealPlanGrid from "@/components/meals/MealPlanGrid";

const WELCOME: ChatMessage = {
  role: "assistant",
  content: "Hey! I'm Chef Grubly 👨‍🍳 I'm here to plan your week's meals — think trending recipes, great flavours, and everything within your budget. Just say **\"plan my week\"** to get started, or snap a photo of your fridge and I'll work around what you already have!",
};

const QUICK_REPLIES = [
  "Plan my week 🗓️",
  "Something quick & easy",
  "Make it veggie 🥦",
  "High protein meals 💪",
  "Budget-friendly this week",
  "Surprise me! 🎲",
];

function formatMessage(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br />");
}

interface Props {
  initialPlan: SavedMealPlan | null;
  initialConfirmed?: boolean;
  initialFavourites?: string[];
}

export default function ChatInterface({ initialPlan, initialConfirmed = false, initialFavourites = [] }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [mealPlan, setMealPlan] = useState<SavedMealPlan | null>(initialPlan);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "plan">(initialPlan ? "plan" : "chat");
  const [pendingImage, setPendingImage] = useState<{ data: string; mediaType: string; preview: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === "chat") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Resize + compress using a canvas before sending
      const img = new Image();
      img.onload = () => {
        const MAX = 1024;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.75);
        const [, data] = compressed.split(",");
        setPendingImage({ data, mediaType: "image/jpeg", preview: compressed });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if ((!input.trim() && !pendingImage) || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim() || (pendingImage ? "Here's a photo of my fridge/cupboard — what can you see?" : ""),
      ...(pendingImage ? { image: { data: pendingImage.data, mediaType: pendingImage.mediaType } } : {}),
    };

    // Strip image data from older messages to keep payload small — only keep image in the message it was attached to
    const updatedMessages = [...messages.slice(1).map(m => ({ role: m.role, content: m.content })), userMessage];
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setPendingImage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let event: { type: string; content?: string; plan?: unknown; message?: string };
          try { event = JSON.parse(raw); } catch { continue; }

          if (event.type === "text" && event.content) {
            assistantText += event.content;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: assistantText };
              return updated;
            });
          } else if (event.type === "meal_plan" && event.plan) {
            setMealPlan(event.plan as SavedMealPlan);
            setActiveTab("plan");
          } else if (event.type === "error") {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: `Sorry, something went wrong: ${event.message}` };
              return updated;
            });
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Sorry, something went wrong. Please try again." };
        return updated;
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const hasPlan = !!mealPlan;

  return (
    <div className={`flex gap-6 h-[calc(100vh-9rem)] ${hasPlan ? "flex-row" : "justify-center"}`}>
      {/* Chat panel */}
      <div className={`flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden ${hasPlan ? "w-[360px] shrink-0" : "w-full max-w-2xl"}`}>
        {/* Tab bar (mobile) */}
        {hasPlan && (
          <div className="flex border-b border-sand lg:hidden">
            <TabButton active={activeTab === "chat"} onClick={() => setActiveTab("chat")}>Chat</TabButton>
            <TabButton active={activeTab === "plan"} onClick={() => setActiveTab("plan")}>Meal Plan</TabButton>
          </div>
        )}

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${hasPlan && activeTab === "plan" ? "hidden lg:flex lg:flex-col" : ""}`}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold mr-2 mt-0.5 shrink-0">
                  G
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-orange text-white rounded-tr-sm"
                  : "bg-sand text-body rounded-tl-sm"
              }`}>
                {/* Image preview in bubble */}
                {msg.image && (
                  <img
                    src={`data:${msg.image.mediaType};base64,${msg.image.data}`}
                    alt="Fridge photo"
                    className="rounded-xl mb-2 max-w-full max-h-48 object-cover"
                  />
                )}
                <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold mr-2 shrink-0">
                G
              </div>
              <div className="bg-sand rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className={`border-t border-sand ${hasPlan && activeTab === "plan" ? "hidden lg:block" : ""}`}>
          {/* Quick reply chips */}
          {messages.length === 1 && !loading && (
            <div className="px-3 pt-3 flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  onClick={() => setInput(reply)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-sand text-body hover:bg-teal hover:text-white transition"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Image preview */}
          {pendingImage && (
            <div className="px-3 pt-3 relative inline-block">
              <img
                src={pendingImage.preview}
                alt="Selected"
                className="h-20 w-auto rounded-xl object-cover border-2 border-teal"
              />
              <button
                onClick={() => setPendingImage(null)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-body text-white text-xs flex items-center justify-center hover:bg-orange transition"
              >
                ×
              </button>
              <p className="text-[10px] text-muted mt-1 font-semibold">📸 Fridge photo ready</p>
            </div>
          )}

          <form onSubmit={sendMessage} className="p-3 flex gap-2 items-center">
            {/* Image upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title="Scan fridge or cupboard"
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition disabled:opacity-40 ${
                pendingImage ? "bg-teal text-white" : "bg-sand text-muted hover:bg-teal hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={pendingImage ? "Add a note or just send…" : "Ask Chef Grubly anything…"}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-full bg-cream border border-sand text-sm text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || (!input.trim() && !pendingImage)}
              className="w-9 h-9 rounded-full bg-orange flex items-center justify-center shrink-0 hover:opacity-90 transition disabled:opacity-40"
            >
              <svg className="w-4 h-4 text-white rotate-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Meal plan panel — desktop */}
      {hasPlan && (
        <div className={`flex-1 bg-white rounded-2xl shadow-sm p-5 overflow-hidden ${activeTab === "plan" ? "flex flex-col" : "hidden lg:flex lg:flex-col"}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-body">This week&apos;s plan</h2>
            <span className="text-xs text-muted">
              w/c {new Date(mealPlan.week_starting).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          </div>
          <div className="flex-1 overflow-x-auto">
            <MealPlanGrid plan={mealPlan} initialConfirmed={initialConfirmed} initialFavourites={initialFavourites} />
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 text-sm font-semibold transition ${
        active ? "text-teal border-b-2 border-teal" : "text-muted"
      }`}
    >
      {children}
    </button>
  );
}
