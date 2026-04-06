import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AnimatedChat from "@/components/landing/AnimatedChat";

export default async function Home() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-cream font-sans overflow-x-hidden">

      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <span className="text-2xl font-black text-teal tracking-tight">Grubly</span>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-sm font-semibold text-muted hover:text-body transition hidden sm:block">
            Sign in
          </a>
          <a
            href="/signup"
            className="px-5 py-2.5 rounded-full bg-orange text-white text-sm font-bold hover:opacity-90 transition"
          >
            Try free for 14 days
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-4 pt-12 pb-24 overflow-hidden">
        {/* Floating food emojis */}
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
          <span className="absolute top-8 left-[5%] text-4xl opacity-20 animate-float" style={{ animationDelay: "0s" }}>🥦</span>
          <span className="absolute top-24 left-[12%] text-2xl opacity-15 animate-float-slow" style={{ animationDelay: "1s" }}>🍋</span>
          <span className="absolute top-4 right-[8%] text-3xl opacity-20 animate-float" style={{ animationDelay: "0.5s" }}>🍅</span>
          <span className="absolute top-32 right-[15%] text-2xl opacity-15 animate-float-slow" style={{ animationDelay: "2s" }}>🧄</span>
          <span className="absolute bottom-16 left-[8%] text-3xl opacity-20 animate-float" style={{ animationDelay: "1.5s" }}>🥕</span>
          <span className="absolute bottom-8 right-[10%] text-2xl opacity-15 animate-float-slow" style={{ animationDelay: "0.8s" }}>🫐</span>
          <span className="absolute top-48 left-[2%] text-2xl opacity-10 animate-float" style={{ animationDelay: "2.5s" }}>🧅</span>
          <span className="absolute bottom-24 right-[4%] text-3xl opacity-10 animate-float-slow" style={{ animationDelay: "3s" }}>🫒</span>
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-teal/10 text-teal text-xs font-bold px-4 py-1.5 rounded-full mb-6 animate-fade-in">
              ✨ AI-powered meal planning — free for 14 days
            </div>

            <h1 className="text-5xl sm:text-6xl font-black text-body leading-[1.1] mb-6 animate-slide-up">
              Stop stressing about<br />
              <span className="text-teal relative">
                what&apos;s for dinner
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 8" fill="none">
                  <path d="M1 5.5 Q75 1 150 5.5 Q225 10 299 5.5" stroke="#E8680A" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6"/>
                </svg>
              </span>
            </h1>

            <p className="text-lg text-muted leading-relaxed mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Grubly plans your whole week&apos;s meals in seconds — personalised to your family, your budget, and what&apos;s already in your fridge.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              {["📸 Scans your fridge", "💷 Stays within budget", "🛒 Auto shopping list", "👨‍🍳 Trending recipes"].map((f) => (
                <span key={f} className="text-xs font-bold bg-white border border-sand rounded-full px-3 py-1.5 text-body">{f}</span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <a
                href="/signup"
                className="px-8 py-4 rounded-full bg-orange text-white font-bold text-base hover:opacity-90 transition text-center shadow-lg shadow-orange/30"
              >
                Start your free 14-day trial →
              </a>
            </div>
            <p className="text-xs text-muted mt-3 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              No credit card required · £9.99/month after trial · Cancel anytime
            </p>
          </div>

          {/* Right — animated chat demo */}
          <div className="relative animate-slide-up" style={{ animationDelay: "0.2s" }}>
            {/* Glow behind card */}
            <div className="absolute inset-0 bg-teal/20 rounded-3xl blur-3xl scale-110" />
            <AnimatedChat />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-teal py-5">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-6 sm:gap-12 text-white/90 text-sm font-bold">
          <span>🧑‍🍳 Personalised by AI</span>
          <span>💷 Budget-aware planning</span>
          <span>📸 Fridge scanner</span>
          <span>🛒 Auto shopping list</span>
          <span>❤️ Saves your favourites</span>
        </div>
      </section>

      {/* Fridge scanner feature — new! */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="bg-white rounded-3xl p-8 border border-sand relative overflow-hidden">
            {/* Fake fridge UI */}
            <div className="bg-cream rounded-2xl p-5 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-xl">📸</div>
              <div>
                <p className="text-sm font-bold text-body">fridge_monday.jpg</p>
                <p className="text-xs text-muted">Uploading to Chef Grubly…</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-sand rounded-2xl p-4 text-sm text-body">
                <strong>Chef Grubly:</strong> I can see chicken thighs, half a bag of spinach, some eggs, cheddar, and leftover rice! 🥚
              </div>
              <div className="bg-sand rounded-2xl p-4 text-sm text-body">
                I&apos;ll build this week around what you&apos;ve got — you&apos;ll only need to grab a few extras. Want me to go ahead?
              </div>
              <div className="bg-orange/10 rounded-2xl p-4 text-sm text-orange font-bold text-center">
                💡 Estimated saving: £18 on this week&apos;s shop
              </div>
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-orange/10 text-orange text-xs font-bold px-4 py-1.5 rounded-full mb-4">
              🆕 New feature
            </div>
            <h2 className="text-4xl font-black text-body mb-4 leading-tight">
              Got food already?<br />
              <span className="text-teal">Use it up first.</span>
            </h2>
            <p className="text-muted text-lg leading-relaxed mb-6">
              Take a photo of your fridge or cupboard and Chef Grubly will plan your meals around what you already have — cutting your shopping bill and reducing food waste.
            </p>
            <ul className="space-y-3">
              {[
                "Snap a photo of your fridge",
                "Grubly identifies what you have",
                "Meals are planned around your ingredients",
                "Only buy what you actually need",
              ].map((step, i) => (
                <li key={step} className="flex items-center gap-3 text-sm font-semibold text-body">
                  <span className="w-6 h-6 rounded-full bg-teal text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-sand py-24">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-teal mb-3">Simple as that</p>
          <h2 className="text-4xl font-black text-body text-center mb-4">How it works</h2>
          <p className="text-muted text-center mb-14 max-w-md mx-auto">Three steps to a stress-free week of eating — takes less than 2 minutes.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Tell us about your household",
                body: "How many people, your weekly budget, and any dietary requirements. Takes 60 seconds.",
                icon: "👨‍👩‍👧‍👦",
                colour: "bg-teal/10",
              },
              {
                step: "2",
                title: "Chat with Chef Grubly",
                body: "Your AI chef plans a full week with trending, delicious meals — or scan your fridge to use what you have.",
                icon: "👨‍🍳",
                colour: "bg-orange/10",
              },
              {
                step: "3",
                title: "Cook, shop & enjoy",
                body: "Get step-by-step instructions and an auto-generated shopping list. Just turn up and cook.",
                icon: "🥘",
                colour: "bg-teal/10",
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-3xl p-8 text-center relative">
                <div className={`w-16 h-16 rounded-2xl ${item.colour} flex items-center justify-center text-3xl mx-auto mb-4`}>
                  {item.icon}
                </div>
                <div className="absolute top-6 right-6 w-7 h-7 rounded-full bg-teal text-white text-xs font-black flex items-center justify-center">
                  {item.step}
                </div>
                <h3 className="text-lg font-extrabold text-body mb-2">{item.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-teal mb-3">Everything included</p>
        <h2 className="text-4xl font-black text-body text-center mb-4">One app. Done.</h2>
        <p className="text-muted text-center mb-14 max-w-md mx-auto">Grubly handles the thinking so you can just enjoy eating well.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: "🤖", title: "AI that knows food", body: "Chef Grubly pulls from trending TikTok, Instagram, and food blog recipes to keep meals exciting every week." },
            { icon: "📸", title: "Fridge scanner", body: "Snap a photo of your fridge and Grubly plans around what you already have — less waste, smaller shop." },
            { icon: "💷", title: "Budget-aware", body: "Set your weekly budget and Grubly stays within it every single time — no nasty surprises at the checkout." },
            { icon: "📋", title: "Step-by-step recipes", body: "Every meal comes with clear cooking instructions so anyone can make it, whatever their skill level." },
            { icon: "🛒", title: "Auto shopping list", body: "Your meal plan instantly becomes a categorised shopping list. Just tick items off as you go." },
            { icon: "❤️", title: "Favourites & history", body: "Save meals you love. Grubly remembers them and avoids repeating meals you've had recently." },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 flex gap-4 items-start border border-sand hover:border-teal/30 hover:shadow-md transition group">
              <span className="text-2xl shrink-0 group-hover:scale-110 transition">{f.icon}</span>
              <div>
                <h3 className="font-extrabold text-body mb-1">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-sand py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-teal mb-3">Simple pricing</p>
          <h2 className="text-4xl font-black text-body mb-4">Try free. No card needed.</h2>
          <p className="text-muted mb-14 max-w-md mx-auto">14 days on us — then just £9.99/month if you love it.</p>

          <div className="max-w-md mx-auto">
            <div className="bg-teal rounded-3xl p-10 text-left relative overflow-hidden">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-100/70 mb-2">Grubly Pro</p>
              <div className="flex items-end gap-2 mb-1">
                <p className="text-5xl font-black text-white">£9.99</p>
                <p className="text-teal-100/70 mb-2">/ month</p>
              </div>
              <p className="text-sm text-teal-100/70 mb-8">Start with a 14-day free trial — no credit card needed</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Full access to Chef Grubly",
                  "Unlimited AI meal plans",
                  "Fridge scanner",
                  "Auto shopping lists",
                  "Favourites & meal history",
                  "Cancel anytime",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white font-semibold">
                    <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/signup" className="block w-full py-4 rounded-2xl bg-white text-teal font-extrabold text-base text-center hover:opacity-90 transition">
                Start free 14-day trial →
              </a>
              <p className="text-center text-xs text-teal-100/60 mt-3">No credit card required · Cancel anytime</p>
              <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/5" />
              <div className="absolute -left-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">👨‍🍳</div>
        <h2 className="text-4xl font-black text-body mb-4">
          Ready to eat well<br />without the stress?
        </h2>
        <p className="text-muted mb-8 max-w-md mx-auto text-lg">
          Join Grubly today and let Chef Grubly handle the thinking.
          14 days free — no card needed.
        </p>
        <a
          href="/signup"
          className="inline-block px-10 py-4 rounded-full bg-orange text-white font-bold text-lg hover:opacity-90 transition shadow-lg shadow-orange/30"
        >
          Start your free trial →
        </a>
        <p className="text-xs text-muted mt-4">No credit card · 14-day free trial · £9.99/month after</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-sand py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <span className="font-black text-teal text-lg">Grubly</span>
          <span>© {new Date().getFullYear()} Grubly. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="/login" className="hover:text-body transition font-semibold">Sign in</a>
            <a href="/signup" className="hover:text-body transition font-semibold">Sign up free</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
