"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-body mb-2">Check your email</h2>
          <p className="text-muted text-sm">
            We&apos;ve sent a confirmation link to <span className="text-body font-semibold">{email}</span>.
            Click it to activate your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-extrabold text-body mb-1">Create your account</h1>
        <p className="text-muted text-sm mb-6">Start planning meals in minutes</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-body mb-1" htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full px-4 py-2.5 rounded-lg border border-sand bg-cream text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-body mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-sand bg-cream text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-body mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full px-4 py-2.5 rounded-lg border border-sand bg-cream text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-orange text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-muted mt-6">
        Already have an account?{" "}
        <a href="/login" className="text-teal font-semibold hover:underline">
          Sign in
        </a>
      </p>
    </div>
  );
}
