import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getAnthropic } from "@/lib/anthropic";
import type { MealPlanData } from "@/lib/types";

export interface ShoppingItem {
  name: string;
  usedIn: string[];
}

export interface ShoppingCategory {
  category: string;
  items: ShoppingItem[];
}

export interface MealSummary {
  day: string;
  dinner: string;
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await req.json();

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("meals")
    .eq("id", planId)
    .eq("user_id", user.id)
    .single();

  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const meals = plan.meals as MealPlanData;
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
  const DAY_SHORT: Record<string, string> = {
    monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
    friday: "Fri", saturday: "Sat", sunday: "Sun",
  };

  // Build ingredient → meals mapping
  const ingredientMeals: Record<string, string[]> = {};
  const mealSummaries: MealSummary[] = [];

  for (const day of days) {
    if (!meals[day]) continue;
    const { breakfast, lunch, dinner } = meals[day];
    const short = DAY_SHORT[day];

    mealSummaries.push({ day: short, dinner: dinner.name });

    for (const [type, meal] of [["breakfast", breakfast], ["lunch", lunch], ["dinner", dinner]] as const) {
      const label = `${short} ${type}`;
      for (const ing of meal.ingredients) {
        if (!ingredientMeals[ing]) ingredientMeals[ing] = [];
        ingredientMeals[ing].push(label);
      }
    }
  }

  const ingredientList = Object.entries(ingredientMeals)
    .map(([ing, usedIn]) => `${ing} (used in: ${usedIn.join(", ")})`)
    .join("\n");

  try {
    const response = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      tools: [
        {
          name: "build_shopping_list",
          description: "Build a categorised shopping list from the provided ingredients",
          input_schema: {
            type: "object" as const,
            properties: {
              categories: {
                type: "array" as const,
                items: {
                  type: "object" as const,
                  properties: {
                    category: { type: "string" as const },
                    items: {
                      type: "array" as const,
                      items: {
                        type: "object" as const,
                        properties: {
                          name: { type: "string" as const },
                          usedIn: { type: "array" as const, items: { type: "string" as const } },
                        },
                        required: ["name", "usedIn"],
                      },
                    },
                  },
                  required: ["category", "items"],
                },
              },
            },
            required: ["categories"],
          },
        },
      ],
      tool_choice: { type: "auto" as const },
      messages: [
        {
          role: "user",
          content: `Take this list of ingredients (with the meals they are used in) from a week of meal planning. Deduplicate and combine quantities where possible, then group into shopping categories using the build_shopping_list tool.

Use these categories only: Fresh produce, Meat & fish, Dairy & eggs, Bakery, Tins & jars, Dried & pasta, Sauces & condiments, Frozen, Other.

Ingredients:
${ingredientList}`,
        },
      ],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use" && b.name === "build_shopping_list");
    if (!toolUse || toolUse.type !== "tool_use") throw new Error("No tool response received");

    const { categories } = toolUse.input as { categories: ShoppingCategory[] };
    return NextResponse.json({ categories, mealSummaries });
  } catch (err) {
    console.error("[/api/shopping-list] Error:", err);
    return NextResponse.json({ error: "Failed to generate shopping list" }, { status: 500 });
  }
}
