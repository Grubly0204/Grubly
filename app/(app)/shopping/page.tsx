import { createSupabaseServerClient } from "@/lib/supabase-server";
import ShoppingList from "@/components/meals/ShoppingList";

export default async function ShoppingPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: confirmedPlan } = await supabase
    .from("meal_plans")
    .select("id, week_starting")
    .eq("user_id", user!.id)
    .eq("confirmed", true)
    .order("week_starting", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!confirmedPlan) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-center mb-4 text-3xl">
          🛒
        </div>
        <h1 className="text-2xl font-extrabold text-body mb-2">No saved plan yet</h1>
        <p className="text-muted text-sm mb-6 max-w-sm">
          Save a meal plan first and your shopping list will be generated automatically.
        </p>
        <a
          href="/plan"
          className="px-6 py-3 rounded-full bg-orange text-white font-bold text-sm hover:opacity-90 transition"
        >
          Go to meal plan
        </a>
      </div>
    );
  }

  return (
    <ShoppingList
      planId={confirmedPlan.id}
      weekStarting={confirmedPlan.week_starting}
    />
  );
}
