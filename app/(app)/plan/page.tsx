import { createSupabaseServerClient } from "@/lib/supabase-server";
import ChatInterface from "@/components/chat/ChatInterface";
import type { SavedMealPlan } from "@/lib/types";

export default async function PlanPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: latestPlan }, { data: favourites }] = await Promise.all([
    supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", user!.id)
      .order("week_starting", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("favourites")
      .select("meal_name")
      .eq("user_id", user!.id),
  ]);

  const initialPlan = latestPlan
    ? ({ ...latestPlan.meals, id: latestPlan.id, week_starting: latestPlan.week_starting } as SavedMealPlan)
    : null;

  const initialConfirmed = latestPlan?.confirmed ?? false;
  const initialFavourites = favourites?.map((f) => f.meal_name) ?? [];

  return (
    <ChatInterface
      initialPlan={initialPlan}
      initialConfirmed={initialConfirmed}
      initialFavourites={initialFavourites}
    />
  );
}
