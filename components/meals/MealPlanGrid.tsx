"use client";

import { useState } from "react";
import type { SavedMealPlan, Meal } from "@/lib/types";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
  friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

const MEAL_EMOJI: Record<string, string> = {
  breakfast: "☀️",
  lunch: "🥗",
  dinner: "🍽️",
};

interface Props {
  plan: SavedMealPlan;
  initialConfirmed?: boolean;
  initialFavourites?: string[];
}

export default function MealPlanGrid({ plan, initialConfirmed = false, initialFavourites = [] }: Props) {
  const [selectedMeal, setSelectedMeal] = useState<{ meal: Meal; label: string } | null>(null);
  const [confirmed, setConfirmed] = useState(initialConfirmed);
  const [saving, setSaving] = useState(false);
  const [favourites, setFavourites] = useState<Set<string>>(new Set(initialFavourites));
  const [instructions, setInstructions] = useState<Record<string, string[]>>({});
  const [loadingInstructions, setLoadingInstructions] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Auto-expand today
  const todayName = new Date().toLocaleDateString("en-GB", { weekday: "long" }).toLowerCase() as typeof DAYS[number];

  async function handleConfirm() {
    setSaving(true);
    await fetch("/api/plan/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: plan.id }),
    });
    setConfirmed(true);
    setSaving(false);
  }

  async function fetchInstructions(meal: Meal) {
    if (instructions[meal.name]) return;
    setLoadingInstructions(true);
    const res = await fetch("/api/instructions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meal }),
    });
    const data = await res.json();
    if (data.steps) {
      setInstructions((prev) => ({ ...prev, [meal.name]: data.steps }));
    }
    setLoadingInstructions(false);
  }

  async function toggleFavourite(meal: Meal) {
    const isFav = favourites.has(meal.name);
    setFavourites((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(meal.name) : next.add(meal.name);
      return next;
    });
    await fetch("/api/favourites", {
      method: isFav ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isFav ? { mealName: meal.name } : { meal }),
    });
  }

  return (
    <div className="h-full flex flex-col">
      {/* Summary + save bar */}
      <div className="mb-4 p-4 bg-teal/10 rounded-2xl flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-teal">{plan.summary}</p>
          <p className="text-xs text-teal/70 mt-0.5">Est. £{plan.total_cost.toFixed(2)} / week</p>
        </div>
        {confirmed ? (
          <span className="flex items-center gap-1.5 text-sm font-bold text-teal bg-white rounded-full px-4 py-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Plan saved
          </span>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-4 py-2 rounded-full bg-orange text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save this plan"}
          </button>
        )}
      </div>

      {/* Day-by-day cards */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {DAYS.map((day) => {
          const isToday = day === todayName;
          const isOpen = expandedDay === day || (expandedDay === null && isToday);
          const dinner = plan[day]?.dinner;

          return (
            <div
              key={day}
              className={`rounded-2xl border-2 overflow-hidden transition-all ${
                isToday ? "border-orange" : "border-transparent bg-white"
              } ${isOpen ? "bg-white" : "bg-white/70"}`}
            >
              {/* Day header */}
              <button
                onClick={() => setExpandedDay(isOpen ? null : day)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-extrabold ${isToday ? "text-orange" : "text-body"}`}>
                    {DAY_LABELS[day]}
                    {isToday && <span className="ml-2 text-[10px] font-bold bg-orange text-white rounded-full px-2 py-0.5">Today</span>}
                  </span>
                  {!isOpen && dinner && (
                    <span className="text-xs text-muted hidden sm:block truncate max-w-[180px]">🍽️ {dinner.name}</span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 text-muted transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Meals */}
              {isOpen && (
                <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["breakfast", "lunch", "dinner"] as const).map((mealType) => {
                    const meal = plan[day]?.[mealType];
                    if (!meal) return null;
                    return (
                      <MealCard
                        key={mealType}
                        meal={meal}
                        type={mealType}
                        isFavourite={favourites.has(meal.name)}
                        onOpen={() => setSelectedMeal({ meal, label: `${DAY_LABELS[day]} ${mealType}` })}
                        onFavourite={() => toggleFavourite(meal)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Meal detail modal */}
      {selectedMeal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelectedMeal(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1 capitalize">
                  {selectedMeal.label}
                </p>
                <h3 className="text-xl font-extrabold text-body leading-snug">{selectedMeal.meal.name}</h3>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <button
                  onClick={() => toggleFavourite(selectedMeal.meal)}
                  className="p-2 rounded-full hover:bg-sand transition"
                  title={favourites.has(selectedMeal.meal.name) ? "Remove from favourites" : "Add to favourites"}
                >
                  <svg
                    className={`w-5 h-5 transition ${favourites.has(selectedMeal.meal.name) ? "fill-orange text-orange" : "fill-none text-muted"}`}
                    stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </button>
                <button onClick={() => setSelectedMeal(null)} className="p-2 rounded-full hover:bg-sand transition text-muted hover:text-body">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <p className="text-muted text-sm mb-4 leading-relaxed">{selectedMeal.meal.description}</p>

            <div className="flex flex-wrap gap-2 mb-5">
              <span className="text-xs bg-sand rounded-full px-3 py-1.5 font-semibold text-body">⏱ {selectedMeal.meal.prep_time}</span>
              <span className="text-xs bg-sand rounded-full px-3 py-1.5 font-semibold text-body">£{selectedMeal.meal.estimated_cost.toFixed(2)}</span>
              {selectedMeal.meal.calories && (
                <span className="text-xs bg-sand rounded-full px-3 py-1.5 font-semibold text-body">🔥 {selectedMeal.meal.calories} kcal</span>
              )}
              {selectedMeal.meal.trending_note && (
                <span className="text-xs bg-orange/10 text-orange rounded-full px-3 py-1.5 font-semibold">🔥 {selectedMeal.meal.trending_note}</span>
              )}
            </div>

            <div className="mb-5">
              <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Ingredients</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedMeal.meal.ingredients.map((ing) => (
                  <span key={ing} className="text-xs bg-cream border border-sand rounded-full px-2.5 py-1 text-body">{ing}</span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-sand">
              {instructions[selectedMeal.meal.name] ? (
                <>
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">How to make it</p>
                  <ol className="space-y-3">
                    {instructions[selectedMeal.meal.name].map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-body leading-relaxed">
                        <span className="w-6 h-6 rounded-full bg-teal text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <button
                  onClick={() => fetchInstructions(selectedMeal.meal)}
                  disabled={loadingInstructions}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-sand text-sm font-semibold text-muted hover:border-teal hover:text-teal transition disabled:opacity-50"
                >
                  {loadingInstructions ? "Getting instructions…" : "👨‍🍳 Show cooking instructions"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MealCard({ meal, type, isFavourite, onOpen, onFavourite }: {
  meal: Meal; type: "breakfast" | "lunch" | "dinner";
  isFavourite: boolean; onOpen: () => void; onFavourite: () => void;
}) {
  const typeStyle = {
    breakfast: "bg-amber-50 border-amber-100",
    lunch: "bg-sky-50 border-sky-100",
    dinner: "bg-teal/5 border-teal/20",
  }[type];

  return (
    <div className={`relative rounded-2xl border p-4 group cursor-pointer hover:shadow-sm transition ${typeStyle}`} onClick={onOpen}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-base">{MEAL_EMOJI[type]}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onFavourite(); }}
          className="opacity-0 group-hover:opacity-100 transition p-1 -mt-1 -mr-1 rounded-full hover:bg-white/60"
          title={isFavourite ? "Remove from favourites" : "Save to favourites"}
        >
          <svg
            className={`w-4 h-4 transition ${isFavourite ? "fill-orange text-orange" : "fill-none text-muted"}`}
            stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>
      </div>
      <p className="text-[10px] font-bold text-muted uppercase tracking-wide mb-1 capitalize">{type}</p>
      <p className="text-sm font-bold text-body leading-snug">{meal.name}</p>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {meal.prep_time && (
          <span className="text-[10px] text-muted font-semibold">⏱ {meal.prep_time}</span>
        )}
        {meal.estimated_cost && (
          <span className="text-[10px] text-muted font-semibold">£{meal.estimated_cost.toFixed(2)}</span>
        )}
      </div>
      {meal.trending_note && (
        <p className="text-[10px] text-orange font-semibold mt-1.5 truncate">🔥 {meal.trending_note}</p>
      )}
    </div>
  );
}
