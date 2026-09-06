"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Category, Transaction } from "@/lib/database.types";
import { confirmBatch, discardBatch, type ReviewEdit } from "../actions";

interface RowState extends ReviewEdit {
  isDuplicate: boolean;
}

export default function ReviewClient({
  batchId,
  transactions,
  categories,
  duplicateHashes,
}: {
  batchId: string;
  transactions: Transaction[];
  categories: Category[];
  duplicateHashes: string[];
}) {
  const duplicateSet = useMemo(() => new Set(duplicateHashes), [duplicateHashes]);

  const [rows, setRows] = useState<RowState[]>(() =>
    transactions.map((tx) => {
      const isDuplicate = Boolean(tx.dedupe_hash && duplicateSet.has(tx.dedupe_hash));
      return {
        id: tx.id,
        include: !isDuplicate,
        description: tx.description,
        category_id: tx.category_id,
        suggested_category_id: tx.category_id,
        amount: Math.abs(Number(tx.amount)),
        type: tx.type,
        date: tx.date,
        isDuplicate,
      };
    })
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update(id: string, patch: Partial<RowState>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function toggleAll(include: boolean) {
    setRows((prev) => prev.map((r) => ({ ...r, include })));
  }

  const includedCount = rows.filter((r) => r.include).length;
  const duplicateCount = rows.filter((r) => r.isDuplicate).length;

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await confirmBatch(batchId, rows);
      } catch (err) {
        const digest =
          typeof err === "object" && err !== null && "digest" in err
            ? String((err as { digest: unknown }).digest)
            : "";
        if (digest.startsWith("NEXT_REDIRECT")) throw err;
        setError(err instanceof Error ? err.message : "Erro ao confirmar importação.");
      }
    });
  }

  function discard() {
    if (!confirm("Descartar esta importação? Nenhuma transação será salva.")) return;
    startTransition(async () => {
      try {
        await discardBatch(batchId);
      } catch (err) {
        const digest =
          typeof err === "object" && err !== null && "digest" in err
            ? String((err as { digest: unknown }).digest)
            : "";
        if (digest.startsWith("NEXT_REDIRECT")) throw err;
      }
    });
  }

  return (
    <div>
      {duplicateCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent">
          <AlertTriangle size={16} />
          {duplicateCount} transação(ões) parecem já existir e vieram desmarcadas.
        </div>
      )}

      <div className="mb-3 flex items-center gap-3 text-sm">
        <button onClick={() => toggleAll(true)} className="text-muted underline-offset-2 hover:text-foreground hover:underline">
          Selecionar todas
        </button>
        <button onClick={() => toggleAll(false)} className="text-muted underline-offset-2 hover:text-foreground hover:underline">
          Desmarcar todas
        </button>
        <span className="ml-auto text-muted">{includedCount} de {rows.length} selecionadas</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="w-10 px-3 py-3" />
              <th className="px-3 py-3 font-medium">Data</th>
              <th className="px-3 py-3 font-medium">Descrição</th>
              <th className="px-3 py-3 font-medium">Categoria</th>
              <th className="px-3 py-3 font-medium">Tipo</th>
              <th className="px-3 py-3 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-border last:border-0 ${
                  !row.include ? "opacity-40" : ""
                }`}
              >
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={row.include}
                    onChange={(e) => update(row.id, { include: e.target.checked })}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => update(row.id, { date: e.target.value })}
                    className="w-32 rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-accent"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={row.description}
                    onChange={(e) => update(row.id, { description: e.target.value })}
                    className="w-full min-w-48 rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-accent"
                  />
                  {row.isDuplicate && (
                    <span className="ml-1 text-xs text-accent">possível duplicata</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={row.category_id ?? ""}
                    onChange={(e) => update(row.id, { category_id: e.target.value || null })}
                    className="rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-accent"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={row.type}
                    onChange={(e) => update(row.id, { type: e.target.value as RowState["type"] })}
                    className="rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-accent"
                  >
                    <option value="saida">Saída</option>
                    <option value="entrada">Entrada</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={row.amount}
                    onChange={(e) => update(row.id, { amount: Number(e.target.value) })}
                    className="w-28 rounded-md border border-border px-2 py-1 text-right text-sm outline-none focus:border-accent"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-sm text-muted">
        Total selecionado:{" "}
        <span className="font-medium text-foreground">
          {formatCurrency(
            rows
              .filter((r) => r.include)
              .reduce((sum, r) => sum + (r.type === "entrada" ? r.amount : -r.amount), 0)
          )}
        </span>
      </div>

      {error && <p className="mt-3 text-sm text-negative">{error}</p>}

      <div className="mt-5 flex gap-3">
        <button
          onClick={submit}
          disabled={pending || includedCount === 0}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {pending ? "Confirmando..." : `Confirmar importação (${includedCount})`}
        </button>
        <button
          onClick={discard}
          disabled={pending}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted hover:text-negative disabled:opacity-60"
        >
          Descartar
        </button>
      </div>
    </div>
  );
}
