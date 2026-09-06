"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AccountType } from "@/lib/database.types";

export interface AccountInput {
  name: string;
  type: AccountType;
  initial_balance: number;
  color: string;
}

export async function createAccount(input: AccountInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase.from("accounts").insert({
    user_id: user.id,
    name: input.name,
    type: input.type,
    initial_balance: input.initial_balance,
    current_balance: input.initial_balance,
    color: input.color,
  });
  if (error) throw error;
  revalidatePath("/contas");
  revalidatePath("/dashboard");
}

export async function updateAccount(id: string, input: AccountInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({
      name: input.name,
      type: input.type,
      color: input.color,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/contas");
  revalidatePath("/dashboard");
}

export async function toggleAccountActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/contas");
  revalidatePath("/dashboard");
}

export async function deleteAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/contas");
  revalidatePath("/dashboard");
}
