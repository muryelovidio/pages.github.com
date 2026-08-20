"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Recurrence } from "@/lib/database.types";

export interface CommitmentInput {
  name: string;
  amount: number;
  due_day: number;
  recurrence: Recurrence;
  category_id: string | null;
}

export async function createCommitment(input: CommitmentInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase.from("commitments").insert({
    user_id: user.id,
    ...input,
  });
  if (error) throw error;
  revalidatePath("/compromissos");
  revalidatePath("/dashboard");
}

export async function updateCommitment(id: string, input: CommitmentInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("commitments")
    .update(input)
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/compromissos");
  revalidatePath("/dashboard");
}

export async function toggleCommitmentActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("commitments")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/compromissos");
  revalidatePath("/dashboard");
}

export async function deleteCommitment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("commitments").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/compromissos");
  revalidatePath("/dashboard");
}
