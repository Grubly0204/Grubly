"use client";

import { useState } from "react";

const DIETARY_OPTIONS = [
  { label: "Vegetarian", emoji: "🥦" },
  { label: "Vegan", emoji: "🌱" },
  { label: "Gluten-free", emoji: "🌾" },
  { label: "Dairy-free", emoji: "🥛" },
  { label: "Nut-free", emoji: "🥜" },
  { label: "Halal", emoji: "☪️" },
  { label: "Kosher", emoji: "✡️" },
  { label: "Low-carb", emoji: "🥩" },
  { label: "Pescatarian", emoji: "🐟" },
];

interface Profile {
  full_name?: string | null;
  household_size?: number | null;
  weekly_budget?: number | null;
  dietary_requirements?: string[] | null;
}

export default function SettingsForm({ profile }: { profile: Profile | null }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [householdSize, setHouseholdSize] = useState(profile?.household_size ?? 2);
  const [weeklyBudget, setWeeklyBudget] = useState(profile?.weekly_budget ?? 60);
  const [dietary, setDietary] = useState<string[]>(profile?.dietary_requirements ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDietary(option: string) {
    setDietary((prev) =>
      prev.includes(option) ? prev.filter((d) => d !== option) : [...prev, option]
    );
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setSaved(false);

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        household_size: householdSize,
        weekly_budget: weeklyBudget,
        dietary_requirements: dietary,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Name */}
      <div className="bg-white rounded-2xl p-5">
        <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-3" htmlFor="fullName">
          Your name
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => { setFullName(e.target.value); setSaved(false); }}
          placeholder="e.g. Sarah Smith"
          className="w-full px-4 py-3 rounded-xl border border-sand bg-cream text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition"
        />
      </div>

      {/* Household size */}
      <div className="bg-white rounded-2xl p-5">
        <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-3">
          Household size
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => { setHouseholdSize((v) => Math.max(1, v - 1)); setSaved(false); }}
            className="w-10 h-10 rounded-xl border-2 border-sand text-body font-bold text-lg hover:border-teal hover:text-teal transition flex items-center justify-center"
          >
            −
          </button>
          <div className="flex-1 text-center">
            <p className="text-3xl font-extrabold text-body">{householdSize}</p>
            <p className="text-xs text-muted mt-0.5">{householdSize === 1 ? "person" : "people"}</p>
          </div>
          <button
            type="button"
            onClick={() => { setHouseholdSize((v) => Math.min(10, v + 1)); setSaved(false); }}
            className="w-10 h-10 rounded-xl border-2 border-sand text-body font-bold text-lg hover:border-teal hover:text-teal transition flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      {/* Weekly budget */}
      <div className="bg-white rounded-2xl p-5">
        <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-3" htmlFor="weeklyBudget">
          Weekly food budget
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold text-lg">£</span>
          <input
            id="weeklyBudget"
            type="number"
            min={10}
            max={500}
            step={5}
            value={weeklyBudget}
            onChange={(e) => { setWeeklyBudget(Number(e.target.value)); setSaved(false); }}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-sand bg-cream text-body text-lg font-bold focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition"
          />
        </div>
        <p className="text-xs text-muted mt-2">
          That&apos;s about £{(weeklyBudget / 7).toFixed(2)} per day for {householdSize} {householdSize === 1 ? "person" : "people"}
        </p>
      </div>

      {/* Dietary requirements */}
      <div className="bg-white rounded-2xl p-5">
        <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-3">
          Dietary requirements
        </label>
        <p className="text-xs text-muted mb-4">Chef Grubly will always stick to these when planning your meals.</p>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map(({ label, emoji }) => (
            <button
              key={label}
              type="button"
              onClick={() => toggleDietary(label)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition flex items-center gap-1.5 ${
                dietary.includes(label)
                  ? "bg-teal text-white border-teal"
                  : "bg-white text-muted border-sand hover:border-teal hover:text-teal"
              }`}
            >
              <span>{emoji}</span> {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className={`w-full py-3.5 rounded-2xl font-bold text-sm transition ${
          saved
            ? "bg-teal text-white"
            : "bg-orange text-white hover:opacity-90 disabled:opacity-50"
        }`}
      >
        {saving ? "Saving…" : saved ? "✓ Settings saved!" : "Save settings"}
      </button>
    </form>
  );
}
