"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface GoalInput {
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  monthly_contribution: number | null;
}

export async function createGoal(input: GoalInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    ...input,
  });
  if (error) throw error;
  revalidatePath("/metas");
}

export async function updateGoal(id: string, input: GoalInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").update(input).eq("id", id);
  if (error) throw error;
  revalidatePath("/metas");
}

export async function addContribution(id: string, amount: number) {
  const supabase = await createClient();
  const { data: goal, error: fetchError } = await supabase
    .from("goals")
    .select("current_amount")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from("goals")
    .update({ current_amount: Number(goal.current_amount) + amount })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/metas");
}

export async function deleteGoal(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/metas");
}
