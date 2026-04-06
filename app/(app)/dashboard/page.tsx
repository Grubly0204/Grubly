import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { MealPlanData } from "@/lib/types";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
type DayKey = typeof DAYS[number];

const DAY_LABELS: Record<DayKey, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: latestPlan }, { data: favourites }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, household_size, weekly_budget")
      .eq("id", user!.id)
      .maybeSingle(),
    supabase
      .from("meal_plans")
      .select("id, week_starting, total_cost, savings, confirmed, plan_data")
      .eq("user_id", user!.id)
      .order("week_starting", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("favourites")
      .select("id, meal_name, meal_data")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const planData = latestPlan?.plan_data as MealPlanData | null;

  // Find today's dinner using the day key
  const todayKey = new Date().toLocaleDateString("en-GB", { weekday: "long" }).toLowerCase() as DayKey;
  const todayDinner = planData?.[todayKey]?.dinner ?? null;

  // Budget progress
  const budget = profile?.weekly_budget ?? 0;
  const spent = latestPlan?.total_cost ?? 0;
  const budgetPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  return (
    <div className="space-y-8">

      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal to-teal/70 p-8 text-white">
        <div className="relative z-10">
          <p className="text-teal-100/80 text-sm font-semibold mb-1">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="text-3xl font-extrabold mb-1">{getGreeting()}, {firstName} 👋</h1>
          <p className="text-teal-100/90 text-sm">
            {latestPlan ? "Here's what Chef Grubly has planned for you." : "Ready to plan your week with Chef Grubly?"}
          </p>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-10 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute right-16 top-4 text-5xl opacity-30">🍽️</div>
      </div>

      {latestPlan && planData ? (
        <>
          {/* Tonight's dinner */}
          {todayDinner && (
            <div className="bg-white rounded-3xl p-6 border border-sand">
              <p className="text-xs font-bold uppercase tracking-widest text-orange mb-3">Tonight&apos;s Dinner</p>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-extrabold text-body mb-1">{todayDinner.name}</h2>
                  {todayDinner.description && (
                    <p className="text-muted text-sm leading-relaxed">{todayDinner.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {todayDinner.prep_time && (
                      <span className="text-xs bg-sand rounded-full px-3 py-1 text-muted font-semibold">⏱ {todayDinner.prep_time}</span>
                    )}
                    {todayDinner.estimated_cost && (
                      <span className="text-xs bg-sand rounded-full px-3 py-1 text-muted font-semibold">£{todayDinner.estimated_cost.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <div className="text-5xl shrink-0">🍳</div>
              </div>
              <a href="/plan" className="mt-4 inline-block text-sm font-bold text-teal hover:underline">
                View full week →
              </a>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">Week Starting</p>
              <p className="text-xl font-extrabold text-body">{formatDate(latestPlan.week_starting)}</p>
            </div>
            <div className="bg-white rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">Estimated Cost</p>
              <p className="text-xl font-extrabold text-body">{latestPlan.total_cost ? `£${latestPlan.total_cost}` : "—"}</p>
            </div>
            <div className="bg-teal rounded-2xl p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-100/80 mb-1">Savings vs Eating Out</p>
              <p className="text-xl font-extrabold">{latestPlan.savings ? `£${latestPlan.savings}` : "—"}</p>
            </div>
          </div>

          {/* Budget progress */}
          {budget > 0 && (
            <div className="bg-white rounded-2xl p-5">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-bold text-body">Weekly budget</p>
                <p className="text-sm font-bold text-body">
                  £{spent} <span className="text-muted font-semibold">/ £{budget}</span>
                </p>
              </div>
              <div className="h-2.5 bg-sand rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${budgetPct > 90 ? "bg-orange" : "bg-teal"}`}
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
              <p className="text-xs text-muted mt-2">{budgetPct}% of budget used</p>
            </div>
          )}

          {/* This week's dinners */}
          <div>
            <h2 className="text-lg font-extrabold text-body mb-3">This week&apos;s dinners 🍽️</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DAYS.map((day) => {
                const dinner = planData[day]?.dinner;
                const isToday = day === todayKey;
                return (
                  <div
                    key={day}
                    className={`bg-white rounded-2xl p-4 border-2 transition ${isToday ? "border-orange" : "border-transparent"}`}
                  >
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isToday ? "text-orange" : "text-muted"}`}>
                      {DAY_LABELS[day]}{isToday ? " · Today" : ""}
                    </p>
                    <p className="text-xs font-bold text-body leading-snug line-clamp-2">{dinner?.name ?? "—"}</p>
                    {dinner?.estimated_cost && (
                      <p className="text-[10px] text-muted mt-1">£{dinner.estimated_cost.toFixed(2)}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="rounded-3xl border-2 border-dashed border-sand bg-white p-12 flex flex-col items-center text-center">
          <div className="text-6xl mb-4">👨‍🍳</div>
          <h2 className="text-xl font-extrabold text-body mb-2">Chef Grubly is ready for you</h2>
          <p className="text-muted text-sm mb-6 max-w-sm">
            Get a personalised 7-day meal plan built around your household, budget, and taste — in seconds.
          </p>
          <a
            href="/plan"
            className="px-6 py-3 rounded-full bg-orange text-white font-bold text-sm hover:opacity-90 transition"
          >
            Generate my first meal plan →
          </a>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a href="/plan" className="group bg-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition border border-transparent hover:border-teal/20">
          <div className="w-12 h-12 rounded-2xl bg-teal/10 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition">🗓️</div>
          <div>
            <p className="font-extrabold text-body text-sm">Meal Plan</p>
            <p className="text-muted text-xs mt-0.5">Chat with Chef Grubly to plan your week</p>
          </div>
          <svg className="w-4 h-4 text-muted ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
        <a href="/shopping" className="group bg-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition border border-transparent hover:border-teal/20">
          <div className="w-12 h-12 rounded-2xl bg-orange/10 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition">🛒</div>
          <div>
            <p className="font-extrabold text-body text-sm">Shopping List</p>
            <p className="text-muted text-xs mt-0.5">Your auto-generated grocery list</p>
          </div>
          <svg className="w-4 h-4 text-muted ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      {/* Favourites */}
      {favourites && favourites.length > 0 && (
        <div>
          <h2 className="text-lg font-extrabold text-body mb-3">Your favourites ❤️</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {favourites.map((fav) => {
              const meal = fav.meal_data as { description?: string; prep_time?: string; estimated_cost?: number };
              return (
                <div key={fav.id} className="bg-white rounded-2xl p-4 flex flex-col gap-1 hover:shadow-md transition">
                  <p className="font-bold text-body text-sm leading-snug">{fav.meal_name}</p>
                  {meal?.description && (
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">{meal.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {meal?.prep_time && (
                      <span className="text-[10px] bg-sand rounded-full px-2 py-0.5 text-muted font-semibold">⏱ {meal.prep_time}</span>
                    )}
                    {meal?.estimated_cost && (
                      <span className="text-[10px] bg-sand rounded-full px-2 py-0.5 text-muted font-semibold">£{meal.estimated_cost.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
