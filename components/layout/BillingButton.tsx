"use client";

import { useState } from "react";

export default function BillingButton() {
  const [loading, setLoading] = useState(false);

  async function handleManageBilling() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleManageBilling}
      disabled={loading}
      className="px-6 py-3 rounded-full border-2 border-body text-body font-bold text-sm hover:bg-body hover:text-white transition disabled:opacity-60"
    >
      {loading ? "Loading…" : "Manage billing"}
    </button>
  );
}
