"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-orange/10 flex items-center justify-center mx-auto mb-6 text-4xl">
          👨‍🍳
        </div>

        <h1 className="text-3xl font-extrabold text-body mb-3">
          Your trial has ended
        </h1>
        <p className="text-muted text-base mb-8 leading-relaxed">
          You&apos;ve had a taste of what Chef Grubly can do! Subscribe to keep
          getting personalised meal plans, smart shopping lists, and more.
        </p>

        {/* Pricing card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-sand mb-6 text-left">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xl font-extrabold text-body">Grubly Pro</p>
              <p className="text-sm text-muted mt-0.5">Everything you need to eat well</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-orange">£9.99</p>
              <p className="text-xs text-muted">per month</p>
            </div>
          </div>

          <ul className="space-y-3 mb-6">
            {[
              "Unlimited AI meal plans with Chef Grubly",
              "Smart weekly shopping lists",
              "Step-by-step cooking instructions",
              "Save & favourite your best meals",
              "Budget-aware planning for any household",
              "Cancel anytime",
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-teal/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-sm text-body font-medium">{feature}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-orange text-white font-extrabold text-base hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Redirecting to checkout…" : "Start subscription — £9.99/month"}
          </button>
          <p className="text-xs text-center text-muted mt-3">
            Secure payment via Stripe. Cancel anytime.
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-muted hover:text-body transition font-semibold"
        >
          ← Back to dashboard
        </button>
      </div>
    </div>
  );
}
