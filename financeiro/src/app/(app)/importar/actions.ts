"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dedupeHash } from "@/lib/dedupe";
import { parseCsvBuffer } from "@/lib/import/parseCsv";
import { parseXlsxBuffer } from "@/lib/import/parseXlsx";
import { parsePdfBuffer } from "@/lib/import/parsePdf";
import { suggestCategory, derivePattern } from "@/lib/import/categorize";
import type { ImportFileType, TransactionType } from "@/lib/database.types";

function detectFileType(filename: string): ImportFileType | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "csv") return "csv";
  if (ext === "xlsx" || ext === "xls") return "xlsx";
  if (ext === "pdf") return "pdf";
  return null;
}

export async function uploadAndParse(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const file = formData.get("file");
  const accountId = String(formData.get("account_id") || "");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecione um arquivo para importar.");
  }
  if (!accountId) {
    throw new Error("Selecione a conta de destino.");
  }

  const fileType = detectFileType(file.name);
  if (!fileType) {
    throw new Error("Formato não suportado. Use CSV, XLSX ou PDF.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const parsed =
    fileType === "csv"
      ? parseCsvBuffer(buffer)
      : fileType === "xlsx"
        ? await parseXlsxBuffer(buffer)
        : await parsePdfBuffer(buffer);

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      user_id: user.id,
      source_filename: file.name,
      file_type: fileType,
      account_id: accountId,
      status: "em_revisao",
    })
    .select()
    .single();
  if (batchError) throw batchError;

  // Guarda o arquivo original no Storage (best-effort — não bloqueia a
  // importação se falhar).
  await supabase.storage
    .from("statements")
    .upload(`${user.id}/${batch.id}/${file.name}`, buffer, {
      contentType: file.type || undefined,
      upsert: true,
    })
    .catch(() => null);

  if (parsed.rows.length > 0) {
    const { data: rules } = await supabase
      .from("categorization_rules")
      .select("*")
      .order("confidence", { ascending: false });

    const inserts = parsed.rows.map((row) => ({
      user_id: user.id,
      account_id: accountId,
      category_id: suggestCategory(rules ?? [], row.description),
      date: row.date,
      description: row.description,
      raw_description: row.description,
      amount: row.type === "entrada" ? row.amount : -row.amount,
      type: row.type as TransactionType,
      status: "confirmado" as const,
      import_batch_id: batch.id,
      dedupe_hash: dedupeHash({
        date: row.date,
        amount: row.type === "entrada" ? row.amount : -row.amount,
        description: row.description,
        accountId,
      }),
    }));

    const { error: insertError } = await supabase
      .from("transactions")
      .insert(inserts);
    if (insertError) throw insertError;
  }

  revalidatePath("/importar");
  redirect(`/importar/${batch.id}`);
}

export interface ReviewEdit {
  id: string;
  include: boolean;
  description: string;
  category_id: string | null;
  suggested_category_id: string | null;
  amount: number;
  type: TransactionType;
  date: string;
}

export async function confirmBatch(batchId: string, edits: ReviewEdit[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .select("*")
    .eq("id", batchId)
    .single();
  if (batchError) throw batchError;
  if (batch.status === "concluido") return;

  const toExclude = edits.filter((e) => !e.include).map((e) => e.id);
  const toInclude = edits.filter((e) => e.include);

  if (toExclude.length > 0) {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .in("id", toExclude);
    if (error) throw error;
  }

  let balanceDelta = 0;
  for (const edit of toInclude) {
    const signedAmount = edit.type === "entrada" ? Math.abs(edit.amount) : -Math.abs(edit.amount);
    const { error } = await supabase
      .from("transactions")
      .update({
        description: edit.description,
        category_id: edit.category_id,
        amount: signedAmount,
        type: edit.type,
        date: edit.date,
      })
      .eq("id", edit.id);
    if (error) throw error;
    balanceDelta += signedAmount;

    if (edit.category_id && edit.category_id !== edit.suggested_category_id) {
      const pattern = derivePattern(edit.description);
      if (pattern) {
        await supabase
          .from("categorization_rules")
          .upsert(
            {
              user_id: user.id,
              match_pattern: pattern,
              match_type: "contains",
              category_id: edit.category_id,
              confidence: 1,
            },
            { onConflict: "user_id,match_pattern,match_type" }
          );
      }
    }
  }

  if (batch.account_id && balanceDelta !== 0) {
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("current_balance")
      .eq("id", batch.account_id)
      .single();
    if (accountError) throw accountError;

    const { error: updateError } = await supabase
      .from("accounts")
      .update({
        current_balance: Number(account.current_balance) + balanceDelta,
      })
      .eq("id", batch.account_id);
    if (updateError) throw updateError;
  }

  const { error: closeError } = await supabase
    .from("import_batches")
    .update({ status: "concluido" })
    .eq("id", batchId);
  if (closeError) throw closeError;

  revalidatePath("/importar");
  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
  redirect("/transacoes");
}

export async function discardBatch(batchId: string) {
  const supabase = await createClient();

  // Precisa apagar as transações antes do lote: a FK usa
  // `on delete set null`, e um import_batch_id nulo faria essas linhas
  // ainda não revisadas aparecerem como confirmadas na view.
  const { error: txError } = await supabase
    .from("transactions")
    .delete()
    .eq("import_batch_id", batchId);
  if (txError) throw txError;

  const { error } = await supabase
    .from("import_batches")
    .delete()
    .eq("id", batchId);
  if (error) throw error;

  revalidatePath("/importar");
  redirect("/importar");
}
