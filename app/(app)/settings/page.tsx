import { createSupabaseServerClient } from "@/lib/supabase-server";
import SettingsForm from "@/components/layout/SettingsForm";
import BillingButton from "@/components/layout/BillingButton";

export default async function SettingsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, household_size, weekly_budget, dietary_requirements, subscription_status, trial_ends_at, subscription_ends_at, stripe_customer_id")
    .eq("id", user!.id)
    .maybeSingle();

  const status = profile?.subscription_status ?? null;
  const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const subEndsAt = profile?.subscription_ends_at ? new Date(profile.subscription_ends_at) : null;
  const now = new Date();

  let statusLabel = "Free trial active";
  let statusColour = "text-orange";
  if (status === "active") {
    statusLabel = "Active — renews " + (subEndsAt ? subEndsAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");
    statusColour = "text-teal";
  } else if (status === "trialing") {
    const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86400000)) : 0;
    statusLabel = daysLeft > 0 ? `Free trial — ${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : "Trial expired";
    statusColour = daysLeft > 0 ? "text-orange" : "text-red-500";
  } else if (status === "past_due") {
    statusLabel = "Payment overdue";
    statusColour = "text-red-500";
  } else if (status === "canceled") {
    statusLabel = "Canceled";
    statusColour = "text-muted";
  }

  const hasCustomer = !!profile?.stripe_customer_id;

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-extrabold text-body mb-1">Settings</h1>
      <p className="text-muted mb-8">Update your household details so Chef Grubly can plan better for you.</p>

      <SettingsForm profile={profile} />

      {/* Billing section */}
      <div className="mt-10 pt-8 border-t border-sand">
        <h2 className="text-lg font-extrabold text-body mb-1">Subscription</h2>
        <p className={`text-sm font-semibold mb-4 ${statusColour}`}>{statusLabel}</p>

        {hasCustomer ? (
          <BillingButton />
        ) : (
          <a
            href="/upgrade"
            className="inline-block px-6 py-3 rounded-full bg-orange text-white font-bold text-sm hover:opacity-90 transition"
          >
            Upgrade to Pro — £9.99/month
          </a>
        )}
      </div>
    </div>
  );
}
