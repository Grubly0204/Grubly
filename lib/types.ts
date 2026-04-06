export interface Meal {
  name: string;
  description: string;
  prep_time: string;
  estimated_cost: number;
  ingredients: string[];
  trending_note?: string;
  calories?: number;
}

export interface DayPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
}

export interface MealPlanData {
  monday: DayPlan;
  tuesday: DayPlan;
  wednesday: DayPlan;
  thursday: DayPlan;
  friday: DayPlan;
  saturday: DayPlan;
  sunday: DayPlan;
  total_cost: number;
  summary: string;
}

export interface SavedMealPlan extends MealPlanData {
  id: string;
  week_starting: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image?: {
    data: string;       // base64 encoded
    mediaType: string;  // e.g. "image/jpeg"
  };
}
