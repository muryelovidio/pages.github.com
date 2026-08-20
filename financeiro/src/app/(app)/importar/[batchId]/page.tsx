import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import ReviewClient from "./ReviewClient";

export default async function ImportBatchPage(
  props: PageProps<"/importar/[batchId]">
) {
  const { batchId } = await props.params;
  const supabase = await createClient();

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .select("*, account:accounts(name)")
    .eq("id", batchId)
    .single();
  if (batchError || !batch) notFound();

  const [{ data: transactions, error: txError }, categories] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .eq("import_batch_id", batchId)
      .order("date", { ascending: false }),
    getCategories(supabase),
  ]);
  if (txError) throw txError;

  if (batch.status === "concluido") {
    return (
      <div>
        <PageHeader title={batch.source_filename} description="Importação concluída" />
        <EmptyState
          title="Esta importação já foi confirmada"
          description={`${transactions?.length ?? 0} transações foram adicionadas à conta "${batch.account?.name ?? ""}".`}
          action={
            <div className="mt-2 flex items-center gap-2 text-positive">
              <CheckCircle2 size={18} />
              <Link href="/transacoes" className="text-sm font-medium underline">
                Ver transações
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const hashes = (transactions ?? [])
    .map((t) => t.dedupe_hash)
    .filter((h): h is string => Boolean(h));

  let duplicateHashes: string[] = [];
  if (hashes.length > 0) {
    const { data: dupes } = await supabase
      .from("transactions_confirmed")
      .select("dedupe_hash")
      .in("dedupe_hash", hashes);
    duplicateHashes = (dupes ?? [])
      .map((d) => d.dedupe_hash)
      .filter((h): h is string => Boolean(h));
  }

  return (
    <div>
      <PageHeader
        title={batch.source_filename}
        description={`Revise as ${transactions?.length ?? 0} transações identificadas antes de confirmar a importação na conta "${batch.account?.name ?? ""}".`}
      />
      <ReviewClient
        batchId={batchId}
        transactions={transactions ?? []}
        categories={categories}
        duplicateHashes={duplicateHashes}
      />
    </div>
  );
}
