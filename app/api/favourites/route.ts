import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Meal } from "@/lib/types";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { meal }: { meal: Meal } = await req.json();

  const { error } = await supabase
    .from("favourites")
    .insert({ user_id: user.id, meal_name: meal.name, meal_data: meal });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mealName }: { mealName: string } = await req.json();

  const { error } = await supabase
    .from("favourites")
    .delete()
    .eq("user_id", user.id)
    .eq("meal_name", mealName);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
