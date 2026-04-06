import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await req.json();

  // Unconfirm all other plans for this user
  await supabase
    .from("meal_plans")
    .update({ confirmed: false })
    .eq("user_id", user.id);

  // Confirm the selected plan
  const { error } = await supabase
    .from("meal_plans")
    .update({ confirmed: true })
    .eq("id", planId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
