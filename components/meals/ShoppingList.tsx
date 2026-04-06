"use client";

import { useState, useEffect } from "react";
import type { ShoppingCategory, ShoppingItem, MealSummary } from "@/app/api/shopping-list/route";

const CATEGORY_ICONS: Record<string, string> = {
  "Fresh produce": "🥦",
  "Meat & fish": "🥩",
  "Dairy & eggs": "🥛",
  "Bakery": "🍞",
  "Tins & jars": "🥫",
  "Dried & pasta": "🍝",
  "Sauces & condiments": "🧴",
  "Frozen": "🧊",
  "Other": "🛒",
};

const STORAGE_KEY = "grubly_shopping_checked";

export default function ShoppingList({
  planId,
  weekStarting,
}: {
  planId: string;
  weekStarting: string;
}) {
  const [categories, setCategories] = useState<ShoppingCategory[]>([]);
  const [mealSummaries, setMealSummaries] = useState<MealSummary[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMeals, setShowMeals] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${planId}`);
    if (stored) setChecked(new Set(JSON.parse(stored)));
  }, [planId]);

  useEffect(() => {
    async function generate() {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
      } else {
        setCategories(data.categories);
        setMealSummaries(data.mealSummaries ?? []);
      }
      setLoading(false);
    }
    generate();
  }, [planId]);

  function toggleItem(itemName: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(itemName) ? next.delete(itemName) : next.add(itemName);
      localStorage.setItem(`${STORAGE_KEY}_${planId}`, JSON.stringify([...next]));
      return next;
    });
  }

  function clearChecked() {
    setChecked(new Set());
    localStorage.removeItem(`${STORAGE_KEY}_${planId}`);
  }

  function toggleCat(cat: string) {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  const totalItems = categories.reduce((n, c) => n + c.items.length, 0);
  const checkedCount = checked.size;
  const allDone = totalItems > 0 && checkedCount === totalItems;
  const pct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-teal border-t-transparent animate-spin" />
        <p className="text-muted text-sm font-semibold">Building your shopping list…</p>
        <p className="text-xs text-muted">This takes around 15 seconds</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">😕</p>
        <p className="text-red-500 text-sm font-semibold">{error}</p>
      </div>
    );
  }

  const weekLabel = new Date(weekStarting).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal to-teal/70 p-8 text-white">
        <div className="relative z-10">
          <p className="text-teal-100/80 text-sm font-semibold mb-1">Week of {weekLabel}</p>
          <h1 className="text-3xl font-extrabold mb-4">Shopping List 🛒</h1>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/20 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-sm font-bold text-white shrink-0">{checkedCount}/{totalItems}</span>
          </div>
          <p className="text-teal-100/80 text-xs mt-2">
            {allDone ? "All done! 🎉" : pct > 0 ? `${pct}% picked up` : "Tap items as you go"}
          </p>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute right-8 bottom-4 text-5xl opacity-20">🧺</div>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowMeals((v) => !v)}
          className="flex items-center gap-2 text-sm font-bold text-body hover:text-teal transition"
        >
          <span>🍽️ This week&apos;s dinners</span>
          <svg className={`w-4 h-4 transition-transform ${showMeals ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {checkedCount > 0 && (
          <button
            onClick={clearChecked}
            className="text-xs font-bold text-muted hover:text-body transition"
          >
            Clear all ticks
          </button>
        )}
      </div>

      {/* Meal summary */}
      {showMeals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {mealSummaries.map((m) => (
            <div key={m.day} className="bg-white rounded-2xl p-4">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">{m.day}</p>
              <p className="text-xs font-bold text-body leading-snug">{m.dinner}</p>
            </div>
          ))}
        </div>
      )}

      {/* All done celebration */}
      {allDone && (
        <div className="p-6 bg-teal/10 rounded-3xl text-center border-2 border-teal/20">
          <p className="text-4xl mb-2">🎉</p>
          <p className="font-extrabold text-teal text-lg">You&apos;re all set!</p>
          <p className="text-sm text-muted mt-1">Time to head to the checkout. Happy cooking!</p>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const catChecked = cat.items.filter((i) => checked.has(i.name)).length;
          const allCatDone = catChecked === cat.items.length;
          const isCollapsed = collapsedCats.has(cat.category);

          return (
            <div key={cat.category} className={`bg-white rounded-2xl overflow-hidden transition ${allCatDone ? "opacity-50" : ""}`}>
              {/* Category header */}
              <button
                onClick={() => toggleCat(cat.category)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{CATEGORY_ICONS[cat.category] ?? "🛒"}</span>
                  <div>
                    <p className="text-sm font-extrabold text-body">{cat.category}</p>
                    <p className="text-xs text-muted">{catChecked}/{cat.items.length} items</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {allCatDone && (
                    <span className="text-xs font-bold text-teal bg-teal/10 rounded-full px-2.5 py-1">Done ✓</span>
                  )}
                  <svg
                    className={`w-4 h-4 text-muted transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Items */}
              {!isCollapsed && (
                <ul className="px-5 pb-4 space-y-3 border-t border-sand pt-3">
                  {cat.items.map((item: ShoppingItem) => {
                    const isChecked = checked.has(item.name);
                    return (
                      <li key={item.name}>
                        <button
                          onClick={() => toggleItem(item.name)}
                          className="flex items-start gap-3 w-full text-left group"
                        >
                          <span className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                            isChecked ? "bg-teal border-teal" : "border-sand group-hover:border-teal"
                          }`}>
                            {isChecked && (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold transition leading-tight ${isChecked ? "line-through text-muted" : "text-body"}`}>
                              {item.name}
                            </p>
                            {item.usedIn && item.usedIn.length > 0 && (
                              <p className="text-[11px] text-muted mt-0.5">
                                For: {item.usedIn.join(", ")}
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
