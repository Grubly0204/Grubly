import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getAnthropic } from "@/lib/anthropic";
import type { Meal } from "@/lib/types";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { meal }: { meal: Meal } = await req.json();

  try {
    const response = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Write clear, friendly step-by-step cooking instructions for: ${meal.name}

Key ingredients: ${meal.ingredients.join(", ")}
Prep time: ${meal.prep_time}

Return a JSON array of steps (strings), each step being one clear action. Between 5-8 steps. No intro or outro text, just the JSON array.
Example format: ["Preheat oven to 200°C.", "Chop the onion finely.", ...]`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Could not parse instructions");

    const steps: string[] = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ steps });
  } catch (err) {
    console.error("[/api/instructions] Error:", err);
    return NextResponse.json({ error: "Failed to generate instructions" }, { status: 500 });
  }
}
