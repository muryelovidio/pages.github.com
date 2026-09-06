"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { seedDemoData } from "@/lib/demoSeed";

export interface CategoryInput {
  name: string;
  color: string;
  icon: string;
}

export async function createCategory(input: CategoryInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    ...input,
  });
  if (error) throw error;
  revalidatePath("/configuracoes");
}

export async function updateCategory(id: string, input: CategoryInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update(input).eq("id", id);
  if (error) throw error;
  revalidatePath("/configuracoes");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/configuracoes");
}

export async function deleteRule(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categorization_rules").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/configuracoes");
}

export async function seedDemo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  await seedDemoData(supabase, user.id);

  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");
  revalidatePath("/transacoes");
  revalidatePath("/contas");
  revalidatePath("/cartoes");
  revalidatePath("/compromissos");
  revalidatePath("/metas");
}

export async function clearDemo() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("clear_demo_data");
  if (error) throw error;

  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");
  revalidatePath("/transacoes");
  revalidatePath("/contas");
  revalidatePath("/cartoes");
  revalidatePath("/compromissos");
  revalidatePath("/metas");
}
