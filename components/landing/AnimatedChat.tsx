"use client";

import { useState, useEffect } from "react";

const SEQUENCE = [
  { delay: 500, role: "user", text: "Plan my week! 🗓️" },
  { delay: 1800, role: "typing", text: "" },
  { delay: 3200, role: "assistant", text: "On it! Here's a flavour-packed week within your £60 budget 👨‍🍳" },
  { delay: 4200, role: "meals", text: "" },
  { delay: 5400, role: "user", text: "Can you swap Wednesday dinner for something veggie?" },
  { delay: 6600, role: "typing", text: "" },
  { delay: 7800, role: "assistant", text: "Done! Swapped it for Saag Paneer 🌿 — still under budget!" },
];

const MEALS = [
  { day: "Mon", meal: "Gochujang Butter Noodles", cost: "£4.20" },
  { day: "Tue", meal: "Lemon Herb Chicken", cost: "£5.10" },
  { day: "Wed", meal: "Saag Paneer", cost: "£3.80" },
];

export default function AnimatedChat() {
  const [visible, setVisible] = useState<number[]>([]);

  useEffect(() => {
    SEQUENCE.forEach((item, i) => {
      setTimeout(() => {
        setVisible((prev) => [...prev, i]);
      }, item.delay);
    });
  }, []);

  const show = (i: number) => visible.includes(i);

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-5 w-full max-w-sm mx-auto">
      {/* Chat header */}
      <div className="flex items-center gap-3 pb-4 border-b border-sand mb-4">
        <div className="w-9 h-9 rounded-full bg-teal flex items-center justify-center text-white font-black text-sm">G</div>
        <div>
          <p className="font-extrabold text-body text-sm">Chef Grubly</p>
          <p className="text-[11px] text-teal font-semibold">● Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3 min-h-[280px]">
        {/* Welcome */}
        <div className="flex gap-2 items-end">
          <div className="w-6 h-6 rounded-full bg-teal flex items-center justify-center text-white text-[10px] font-bold shrink-0">G</div>
          <div className="bg-sand rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-body max-w-[80%]">
            Hey! I&apos;m Chef Grubly 👨‍🍳 Tell me what you need!
          </div>
        </div>

        {/* Sequence */}
        {show(0) && (
          <div className="flex justify-end animate-fade-in">
            <div className="bg-orange rounded-2xl rounded-br-sm px-3 py-2 text-xs text-white max-w-[80%]">
              {SEQUENCE[0].text}
            </div>
          </div>
        )}

        {show(1) && !show(2) && (
          <div className="flex gap-2 items-end animate-fade-in">
            <div className="w-6 h-6 rounded-full bg-teal flex items-center justify-center text-white text-[10px] font-bold shrink-0">G</div>
            <div className="bg-sand rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {show(2) && (
          <div className="flex gap-2 items-end animate-fade-in">
            <div className="w-6 h-6 rounded-full bg-teal flex items-center justify-center text-white text-[10px] font-bold shrink-0">G</div>
            <div className="bg-sand rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-body max-w-[80%]">
              {SEQUENCE[2].text}
            </div>
          </div>
        )}

        {show(3) && (
          <div className="animate-fade-in space-y-1.5 ml-8">
            {MEALS.map((m) => (
              <div key={m.day} className="bg-teal/5 border border-teal/20 rounded-xl px-3 py-2 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase">{m.day}</p>
                  <p className="text-xs font-bold text-body">{m.meal}</p>
                </div>
                <span className="text-[10px] font-bold text-teal">{m.cost}</span>
              </div>
            ))}
          </div>
        )}

        {show(4) && (
          <div className="flex justify-end animate-fade-in">
            <div className="bg-orange rounded-2xl rounded-br-sm px-3 py-2 text-xs text-white max-w-[80%]">
              {SEQUENCE[4].text}
            </div>
          </div>
        )}

        {show(5) && !show(6) && (
          <div className="flex gap-2 items-end animate-fade-in">
            <div className="w-6 h-6 rounded-full bg-teal flex items-center justify-center text-white text-[10px] font-bold shrink-0">G</div>
            <div className="bg-sand rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {show(6) && (
          <div className="flex gap-2 items-end animate-fade-in">
            <div className="w-6 h-6 rounded-full bg-teal flex items-center justify-center text-white text-[10px] font-bold shrink-0">G</div>
            <div className="bg-sand rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-body max-w-[80%]">
              {SEQUENCE[6].text}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="mt-4 pt-3 border-t border-sand flex gap-2 items-center">
        <div className="flex-1 bg-cream rounded-full px-4 py-2 text-xs text-muted">Ask Chef Grubly anything…</div>
        <div className="w-7 h-7 rounded-full bg-orange flex items-center justify-center">
          <svg className="w-3 h-3 text-white rotate-90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
