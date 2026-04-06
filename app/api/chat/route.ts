import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getAnthropic } from "@/lib/anthropic";
import type { MealPlanData, ChatMessage } from "@/lib/types";

const mealSchema = {
  type: "object" as const,
  properties: {
    name: { type: "string" as const, description: "Specific, appealing meal name" },
    description: { type: "string" as const, description: "1-2 sentence description" },
    prep_time: { type: "string" as const, description: "e.g. '25 mins'" },
    estimated_cost: { type: "number" as const, description: "Cost in GBP for the whole household" },
    ingredients: { type: "array" as const, items: { type: "string" as const }, description: "Key ingredients" },
    trending_note: { type: "string" as const, description: "e.g. 'Trending on TikTok' — only if relevant" },
  },
  required: ["name", "description", "prep_time", "estimated_cost", "ingredients"],
};

const daySchema = {
  type: "object" as const,
  properties: {
    breakfast: mealSchema,
    lunch: mealSchema,
    dinner: mealSchema,
  },
  required: ["breakfast", "lunch", "dinner"],
};

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  function send(data: object) {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  }

  (async () => {
    try {
      const supabase = createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        send({ type: "error", message: "Unauthorized" });
        return;
      }

      const { messages }: { messages: ChatMessage[] } = await req.json();

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, household_size, weekly_budget, dietary_requirements")
        .eq("id", user.id)
        .maybeSingle();

      const { data: pastPlans } = await supabase
        .from("meal_plans")
        .select("meals, week_starting")
        .eq("user_id", user.id)
        .order("week_starting", { ascending: false })
        .limit(4);

      const pastMealNames: string[] = [];
      if (pastPlans) {
        for (const plan of pastPlans) {
          const meals = plan.meals as MealPlanData;
          const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
          for (const day of days) {
            if (meals?.[day]) {
              pastMealNames.push(meals[day].breakfast.name, meals[day].lunch.name, meals[day].dinner.name);
            }
          }
        }
      }

      const firstName = profile?.full_name?.split(" ")[0] ?? "there";
      const budget = profile?.weekly_budget ?? 60;
      const people = profile?.household_size ?? 4;

      // Work out realistic per-meal cost targets
      const breakfastTarget = Math.round((budget * 0.15) / 7 * 100) / 100;
      const lunchTarget = Math.round((budget * 0.30) / 7 * 100) / 100;
      const dinnerTarget = Math.round((budget * 0.55) / 7 * 100) / 100;

      const systemPrompt = `You are Chef Grubly, a friendly and passionate personal chef who genuinely loves helping families eat well. You chat like a real person — warm, casual, and enthusiastic about food. You never sound robotic or formal.

You know everything about:
- Trending recipes from TikTok, Instagram, YouTube food creators, and food blogs
- Global cuisines and how to make them accessible for home cooks
- Eating well on a budget without sacrificing flavour
- Seasonal ingredients and what's fresh right now

**${firstName}'s household:**
- ${people} people
- Weekly food budget: £${budget} TOTAL for all meals across the entire week
- Dietary requirements: ${profile?.dietary_requirements?.length ? profile.dietary_requirements.join(", ") : "none"}

${pastMealNames.length > 0 ? `**Recently eaten (don't repeat):** ${[...new Set(pastMealNames)].slice(0, 15).join(", ")}` : "First time planning — make it a great intro!"}

**STRICT BUDGET RULES — this is critical:**
- Total weekly budget is £${budget} for ${people} people covering ALL 21 meals
- Per-meal cost targets (ingredient cost for the whole household):
  - Breakfast: £${breakfastTarget} per day (keep it simple — porridge, eggs, toast, yoghurt)
  - Lunch: £${lunchTarget} per day (sandwiches, soups, salads, leftovers)
  - Dinner: £${dinnerTarget} per day (the main event — but still budget-conscious)
- The estimated_cost field for each meal MUST be a realistic UK supermarket cost in GBP for ${people} people
- The total_cost field MUST be the sum of all 21 meals and MUST NOT exceed £${budget}
- Reuse ingredients across multiple meals to reduce waste and cost (e.g. buy one bunch of herbs and use across 3 meals)
- Choose budget-friendly proteins: chicken thighs not breasts, tinned fish, eggs, lentils, mince
- Avoid expensive ingredients like salmon fillets, steak, king prawns unless the budget clearly allows it
- Before calling save_meal_plan, mentally check: do all the estimated_costs add up to under £${budget}?

**Meal plan rules:**
- Specific exciting names ("Gochujang Butter Noodles" not "noodles")
- Variety of cuisines across the week
- Flag trending dishes (TikTok, Instagram, etc.)
- Weeknight dinners under 35 mins, weekends can be more involved
- Always call save_meal_plan when generating a plan

**Fridge/cupboard scanning:**
- If the user sends a photo of their fridge or cupboard, identify what ingredients you can see
- List what you can spot, then ask if they'd like a meal plan built around those ingredients
- When building a plan from fridge contents: prioritise using those ingredients first, then fill gaps with affordable extras
- This reduces food waste and saves money on the weekly shop

Chat naturally and keep replies short. Use the person's name occasionally. Be like a mate who happens to be a great chef.`;

      // Convert messages to Anthropic format (handle image attachments)
      const anthropicMessages = messages.map((msg) => {
        if (msg.image) {
          return {
            role: msg.role,
            content: [
              {
                type: "image" as const,
                source: {
                  type: "base64" as const,
                  media_type: msg.image.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                  data: msg.image.data,
                },
              },
              ...(msg.content ? [{ type: "text" as const, text: msg.content }] : []),
            ],
          };
        }
        return { role: msg.role, content: msg.content };
      });

      const anthropicStream = getAnthropic().messages.stream({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 8192,
        system: systemPrompt,
        tools: [
          {
            name: "save_meal_plan",
            description: "Generate and save a structured weekly meal plan. Call this whenever the user wants a meal plan.",
            input_schema: {
              type: "object" as const,
              properties: {
                summary: { type: "string" as const, description: "Enthusiastic 1-2 sentence summary of the week's plan" },
                total_cost: { type: "number" as const, description: "Estimated total cost in GBP" },
                monday: daySchema,
                tuesday: daySchema,
                wednesday: daySchema,
                thursday: daySchema,
                friday: daySchema,
                saturday: daySchema,
                sunday: daySchema,
              },
              required: ["summary", "total_cost", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
            },
          },
        ],
        messages: anthropicMessages,
      });

      // Stream text chunks as they arrive
      for await (const event of anthropicStream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta" &&
          event.delta.text
        ) {
          send({ type: "text", content: event.delta.text });
        }
      }

      // After stream completes, check for tool calls
      const finalMessage = await anthropicStream.finalMessage();

      for (const block of finalMessage.content) {
        if (block.type === "tool_use" && block.name === "save_meal_plan") {
          const planData = block.input as MealPlanData;

          const today = new Date();
          const monday = new Date(today);
          monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
          const weekStarting = monday.toISOString().split("T")[0];

          const { data: savedPlan } = await supabase
            .from("meal_plans")
            .insert({
              user_id: user.id,
              week_starting: weekStarting,
              meals: planData,
              total_cost: planData.total_cost,
            })
            .select()
            .single();

          const mealPlan = { ...planData, id: savedPlan?.id, week_starting: weekStarting };

          // If no text was streamed, send a follow-up message
          const hasText = finalMessage.content.some((b) => b.type === "text" && b.text.trim());
          if (!hasText) {
            send({ type: "text", content: `Here's your meal plan for the week! ${planData.summary} Tap any meal to see the full details. Let me know if you want to swap anything out! 🍽️` });
          }

          send({ type: "meal_plan", plan: mealPlan });
        }
      }

      send({ type: "done" });
    } catch (err) {
      console.error("[/api/chat] Error:", err);
      send({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
