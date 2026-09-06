"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Account, Card, Category, TransactionStatus } from "@/lib/database.types";
import type { TransactionWithJoins } from "./page";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type TransactionInput,
} from "./actions";

interface Filters {
  accountId?: string;
  categoryId?: string;
  type?: string;
  from?: string;
  to?: string;
  search?: string;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(accounts: Account[]): TransactionInput {
  return {
    account_id: accounts[0]?.id ?? "",
    category_id: null,
    card_id: null,
    date: todayISO(),
    description: "",
    amount: 0,
    type: "saida",
    status: "confirmado",
  };
}

export default function TransacoesClient({
  transactions,
  accounts,
  categories,
  cards,
  filters,
}: {
  transactions: TransactionWithJoins[];
  accounts: Account[];
  categories: Category[];
  cards: Card[];
  filters: Filters;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modalTx, setModalTx] = useState<TransactionWithJoins | "new" | null>(
    null
  );
  const [form, setForm] = useState<TransactionInput>(emptyForm(accounts));

  function applyFilters(next: Partial<Filters>) {
    const merged = { ...filters, ...next };
    const params = new URLSearchParams();
    if (merged.accountId) params.set("conta", merged.accountId);
    if (merged.categoryId) params.set("categoria", merged.categoryId);
    if (merged.type) params.set("tipo", merged.type);
    if (merged.from) params.set("de", merged.from);
    if (merged.to) params.set("ate", merged.to);
    if (merged.search) params.set("busca", merged.search);
    router.push(`/transacoes${params.toString() ? `?${params}` : ""}`);
  }

  function openNew() {
    setForm(emptyForm(accounts));
    setModalTx("new");
  }

  function openEdit(tx: TransactionWithJoins) {
    setForm({
      account_id: tx.account_id,
      category_id: tx.category_id,
      card_id: tx.card_id,
      date: tx.date,
      description: tx.description,
      amount: Math.abs(Number(tx.amount)),
      type: tx.type,
      status: tx.status,
    });
    setModalTx(tx);
  }

  function submit() {
    if (!form.account_id || !form.description.trim() || form.amount <= 0) return;
    startTransition(async () => {
      if (modalTx === "new") {
        await createTransaction(form);
      } else if (modalTx) {
        await updateTransaction(modalTx.id, form);
      }
      setModalTx(null);
    });
  }

  function remove(tx: TransactionWithJoins) {
    if (!confirm(`Excluir a transação "${tx.description}"?`)) return;
    startTransition(async () => {
      await deleteTransaction(tx.id);
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            defaultValue={filters.search ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                applyFilters({ search: e.currentTarget.value || undefined });
              }
            }}
            placeholder="Buscar descrição..."
            className="rounded-lg border border-border py-2 pl-8 pr-3 text-sm outline-none focus:border-accent"
          />
        </div>
        <select
          value={filters.accountId ?? ""}
          onChange={(e) => applyFilters({ accountId: e.target.value || undefined })}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="">Todas as contas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={filters.categoryId ?? ""}
          onChange={(e) => applyFilters({ categoryId: e.target.value || undefined })}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filters.type ?? ""}
          onChange={(e) => applyFilters({ type: e.target.value || undefined })}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="">Entradas e saídas</option>
          <option value="entrada">Entradas</option>
          <option value="saida">Saídas</option>
        </select>
        <input
          type="date"
          value={filters.from ?? ""}
          onChange={(e) => applyFilters({ from: e.target.value || undefined })}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          type="date"
          value={filters.to ?? ""}
          onChange={(e) => applyFilters({ to: e.target.value || undefined })}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
        />

        <button
          onClick={openNew}
          disabled={accounts.length === 0}
          className="ml-auto flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          <Plus size={16} /> Nova transação
        </button>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          title="Nenhuma transação encontrada"
          description={
            accounts.length === 0
              ? "Cadastre uma conta primeiro em Contas."
              : "Ajuste os filtros ou registre uma nova transação."
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Conta</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="group border-b border-border last:border-0 hover:bg-black/[.015]"
                >
                  <td className="px-4 py-3 text-muted">{formatDate(tx.date)}</td>
                  <td className="px-4 py-3">
                    {tx.description}
                    {tx.status === "pendente" && (
                      <span className="ml-2 rounded-full bg-black/[.06] px-2 py-0.5 text-xs text-muted">
                        pendente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {tx.category ? (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: tx.category.color ?? "#6B7280" }}
                        />
                        {tx.category.name}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{tx.account?.name ?? "—"}</td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      tx.type === "entrada" ? "text-positive" : "text-foreground"
                    }`}
                  >
                    {tx.type === "entrada" ? "+" : "-"}
                    {formatCurrency(Math.abs(Number(tx.amount)))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => openEdit(tx)}
                        className="rounded-md p-1.5 text-muted hover:bg-black/[.05] hover:text-foreground"
                        aria-label="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => remove(tx)}
                        className="rounded-md p-1.5 text-muted hover:bg-black/[.05] hover:text-negative"
                        aria-label="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalTx !== null}
        onClose={() => setModalTx(null)}
        title={modalTx === "new" ? "Nova transação" : "Editar transação"}
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, type: "saida" })}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                form.type === "saida"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted"
              }`}
            >
              Saída
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, type: "entrada" })}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                form.type === "entrada"
                  ? "border-positive bg-positive/10 text-positive"
                  : "border-border text-muted"
              }`}
            >
              Entrada
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Descrição</span>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="Ex: Supermercado"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Valor</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount || ""}
                onChange={(e) =>
                  setForm({ ...form, amount: Number(e.target.value) })
                }
                className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Data</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Conta</span>
              <select
                value={form.account_id}
                onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Categoria</span>
              <select
                value={form.category_id ?? ""}
                onChange={(e) =>
                  setForm({ ...form, category_id: e.target.value || null })
                }
                className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {cards.length > 0 && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Cartão (opcional)</span>
              <select
                value={form.card_id ?? ""}
                onChange={(e) =>
                  setForm({ ...form, card_id: e.target.value || null })
                }
                className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              >
                <option value="">Nenhum</option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.status === "pendente"}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: (e.target.checked ? "pendente" : "confirmado") as TransactionStatus,
                })
              }
            />
            Marcar como pendente
          </label>

          <button
            onClick={submit}
            disabled={pending}
            className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
