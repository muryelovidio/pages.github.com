"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Card } from "@/lib/database.types";
import { createCard, updateCard, deleteCard, type CardInput } from "./actions";

const DEFAULT_INPUT: CardInput = {
  name: "",
  bank: "",
  limit_amount: null,
  closing_day: 1,
  due_day: 10,
  color: "#111827",
};

export default function CartoesClient({
  cards,
  invoices,
}: {
  cards: Card[];
  invoices: Record<string, { total: number; start: string; end: string }>;
}) {
  const [modalCard, setModalCard] = useState<Card | "new" | null>(null);
  const [form, setForm] = useState<CardInput>(DEFAULT_INPUT);
  const [pending, startTransition] = useTransition();

  function openNew() {
    setForm(DEFAULT_INPUT);
    setModalCard("new");
  }

  function openEdit(card: Card) {
    setForm({
      name: card.name,
      bank: card.bank ?? "",
      limit_amount: card.limit_amount !== null ? Number(card.limit_amount) : null,
      closing_day: card.closing_day,
      due_day: card.due_day,
      color: card.color ?? "#111827",
    });
    setModalCard(card);
  }

  function submit() {
    if (!form.name.trim()) return;
    startTransition(async () => {
      if (modalCard === "new") {
        await createCard(form);
      } else if (modalCard) {
        await updateCard(modalCard.id, form);
      }
      setModalCard(null);
    });
  }

  function remove(card: Card) {
    if (!confirm(`Excluir o cartão "${card.name}"?`)) return;
    startTransition(() => deleteCard(card.id));
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          <Plus size={16} /> Novo cartão
        </button>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          title="Nenhum cartão cadastrado"
          description="Cadastre seus cartões de crédito para acompanhar a fatura do ciclo atual."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const invoice = invoices[card.id];
            const pct =
              card.limit_amount && invoice
                ? Math.min((invoice.total / Number(card.limit_amount)) * 100, 100)
                : 0;
            return (
              <div key={card.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${card.color}1a` }}
                    >
                      <CreditCard size={17} style={{ color: card.color ?? undefined }} />
                    </span>
                    <div>
                      <p className="font-medium">{card.name}</p>
                      <p className="text-xs text-muted">{card.bank || "—"}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(card)}
                      className="rounded-md p-1.5 text-muted hover:bg-black/[.05] hover:text-foreground"
                      aria-label="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => remove(card)}
                      className="rounded-md p-1.5 text-muted hover:bg-black/[.05] hover:text-negative"
                      aria-label="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <p className="mt-4 text-2xl font-semibold tracking-tight">
                  {formatCurrency(invoice?.total ?? 0)}
                </p>
                <p className="text-xs text-muted">
                  Fatura em aberto
                  {invoice && ` · ${formatDate(invoice.start)} a ${formatDate(invoice.end)}`}
                </p>

                {card.limit_amount ? (
                  <div className="mt-3">
                    <div className="h-1.5 w-full rounded-full bg-black/[.05]">
                      <div
                        className="h-1.5 rounded-full bg-accent"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      Limite {formatCurrency(Number(card.limit_amount))}
                    </p>
                  </div>
                ) : null}

                <p className="mt-3 text-xs text-muted">
                  Fecha dia {card.closing_day} · Vence dia {card.due_day}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalCard !== null}
        onClose={() => setModalCard(null)}
        title={modalCard === "new" ? "Novo cartão" : "Editar cartão"}
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Nome</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="Ex: Nubank Ultravioleta"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Banco/emissor</span>
            <input
              value={form.bank}
              onChange={(e) => setForm({ ...form, bank: e.target.value })}
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Dia de fechamento</span>
              <input
                type="number"
                min={1}
                max={31}
                value={form.closing_day}
                onChange={(e) =>
                  setForm({ ...form, closing_day: Number(e.target.value) })
                }
                className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Dia de vencimento</span>
              <input
                type="number"
                min={1}
                max={31}
                value={form.due_day}
                onChange={(e) =>
                  setForm({ ...form, due_day: Number(e.target.value) })
                }
                className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Limite (opcional)</span>
            <input
              type="number"
              step="0.01"
              value={form.limit_amount ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  limit_amount: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Cor</span>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-9 w-16 rounded-lg border border-border"
            />
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
