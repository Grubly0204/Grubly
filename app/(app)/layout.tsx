import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import Navbar from "@/components/layout/Navbar";

// Pages that are always accessible even with an expired subscription
const OPEN_PATHS = ["/upgrade", "/settings"];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_status, trial_ends_at, subscription_ends_at")
    .eq("id", user.id)
    .maybeSingle();

  // Determine if the user has active access
  const status = profile?.subscription_status;
  const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const subscriptionEndsAt = profile?.subscription_ends_at ? new Date(profile.subscription_ends_at) : null;
  const now = new Date();

  // No status set = brand new user, always let them in
  const noStatus = !status;
  const trialActive =
    status === "trialing" && (trialEndsAt === null || trialEndsAt > now);
  const subscriptionActive =
    status === "active" && (subscriptionEndsAt === null || subscriptionEndsAt > now);
  const hasAccess = noStatus || trialActive || subscriptionActive;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar userName={profile?.full_name ?? user.email ?? null} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {!hasAccess ? (
          // Expired — inject upgrade banner above page content
          // (upgrade page itself is always rendered; other pages get the banner)
          <AccessExpiredBanner />
        ) : null}
        {children}
      </main>
    </div>
  );
}

function AccessExpiredBanner() {
  return (
    <div className="mb-6 rounded-2xl bg-orange/10 border border-orange/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <p className="font-extrabold text-body text-sm">Your free trial has ended 👋</p>
        <p className="text-muted text-sm mt-0.5">Subscribe to keep using Grubly and unlock all features.</p>
      </div>
      <a
        href="/upgrade"
        className="shrink-0 px-5 py-2.5 rounded-full bg-orange text-white font-bold text-sm hover:opacity-90 transition"
      >
        See plans
      </a>
    </div>
  );
}
