"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CardInput {
  name: string;
  bank: string;
  limit_amount: number | null;
  closing_day: number;
  due_day: number;
  color: string;
}

export async function createCard(input: CardInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase.from("cards").insert({
    user_id: user.id,
    name: input.name,
    bank: input.bank || null,
    limit_amount: input.limit_amount,
    closing_day: input.closing_day,
    due_day: input.due_day,
    color: input.color,
  });
  if (error) throw error;
  revalidatePath("/cartoes");
}

export async function updateCard(id: string, input: CardInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cards")
    .update({
      name: input.name,
      bank: input.bank || null,
      limit_amount: input.limit_amount,
      closing_day: input.closing_day,
      due_day: input.due_day,
      color: input.color,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/cartoes");
}

export async function deleteCard(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/cartoes");
}
