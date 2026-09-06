"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TransactionType, TransactionStatus } from "@/lib/database.types";

export interface TransactionInput {
  account_id: string;
  category_id: string | null;
  card_id: string | null;
  date: string;
  description: string;
  amount: number; // sempre em valor absoluto — o sinal é definido por `type`
  type: TransactionType;
  status: TransactionStatus;
}

function signedAmount(input: Pick<TransactionInput, "amount" | "type">) {
  const magnitude = Math.abs(input.amount);
  return input.type === "entrada" ? magnitude : -magnitude;
}

async function adjustAccountBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId: string,
  delta: number
) {
  if (delta === 0) return;
  const { data: account, error: fetchError } = await supabase
    .from("accounts")
    .select("current_balance")
    .eq("id", accountId)
    .single();
  if (fetchError) throw fetchError;

  const { error: updateError } = await supabase
    .from("accounts")
    .update({ current_balance: Number(account.current_balance) + delta })
    .eq("id", accountId);
  if (updateError) throw updateError;
}

export async function createTransaction(input: TransactionInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const amount = signedAmount(input);

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    account_id: input.account_id,
    category_id: input.category_id,
    card_id: input.card_id,
    date: input.date,
    description: input.description,
    amount,
    type: input.type,
    status: input.status,
  });
  if (error) throw error;

  await adjustAccountBalance(supabase, input.account_id, amount);

  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
}

export async function updateTransaction(id: string, input: TransactionInput) {
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("transactions")
    .select("account_id, amount")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  const newAmount = signedAmount(input);

  const { error } = await supabase
    .from("transactions")
    .update({
      account_id: input.account_id,
      category_id: input.category_id,
      card_id: input.card_id,
      date: input.date,
      description: input.description,
      amount: newAmount,
      type: input.type,
      status: input.status,
    })
    .eq("id", id);
  if (error) throw error;

  if (existing.account_id === input.account_id) {
    await adjustAccountBalance(
      supabase,
      input.account_id,
      newAmount - Number(existing.amount)
    );
  } else {
    await adjustAccountBalance(supabase, existing.account_id, -Number(existing.amount));
    await adjustAccountBalance(supabase, input.account_id, newAmount);
  }

  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("transactions")
    .select("account_id, amount")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;

  await adjustAccountBalance(supabase, existing.account_id, -Number(existing.amount));

  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
}
