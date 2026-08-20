"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, CalendarClock } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";
import type { Category, Commitment, Recurrence } from "@/lib/database.types";
import {
  createCommitment,
  updateCommitment,
  deleteCommitment,
  toggleCommitmentActive,
  type CommitmentInput,
} from "./actions";

const DEFAULT_INPUT: CommitmentInput = {
  name: "",
  amount: 0,
  due_day: 5,
  recurrence: "mensal",
  category_id: null,
};

export default function CompromissosClient({
  commitments,
  categories,
}: {
  commitments: Commitment[];
  categories: Category[];
}) {
  const [modalItem, setModalItem] = useState<Commitment | "new" | null>(null);
  const [form, setForm] = useState<CommitmentInput>(DEFAULT_INPUT);
  const [pending, startTransition] = useTransition();

  function openNew() {
    setForm(DEFAULT_INPUT);
    setModalItem("new");
  }

  function openEdit(item: Commitment) {
    setForm({
      name: item.name,
      amount: Number(item.amount),
      due_day: item.due_day,
      recurrence: item.recurrence,
      category_id: item.category_id,
    });
    setModalItem(item);
  }

  function submit() {
    if (!form.name.trim() || form.amount <= 0) return;
    startTransition(async () => {
      if (modalItem === "new") {
        await createCommitment(form);
      } else if (modalItem) {
        await updateCommitment(modalItem.id, form);
      }
      setModalItem(null);
    });
  }

  function remove(item: Commitment) {
    if (!confirm(`Excluir o compromisso "${item.name}"?`)) return;
    startTransition(() => deleteCommitment(item.id));
  }

  const activeTotal = commitments
    .filter((c) => c.is_active)
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted">
          Total comprometido por mês:{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(activeTotal)}
          </span>
        </p>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          <Plus size={16} /> Novo compromisso
        </button>
      </div>

      {commitments.length === 0 ? (
        <EmptyState
          title="Nenhum compromisso cadastrado"
          description="Cadastre contas futuras (aluguel, assinaturas, parcelas) para saber quanto realmente sobra para gastar."
        />
      ) : (
        <div className="card divide-y divide-border overflow-hidden">
          {commitments.map((item) => {
            const category = categories.find((c) => c.id === item.category_id);
            return (
              <div
                key={item.id}
                className={`flex items-center gap-4 px-4 py-3 ${!item.is_active ? "opacity-50" : ""}`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                  <CalendarClock size={16} className="text-accent" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted">
                    Dia {item.due_day} · {item.recurrence === "mensal" ? "Mensal" : "Único"}
                    {category && ` · ${category.name}`}
                  </p>
                </div>
                <p className="font-medium">{formatCurrency(Number(item.amount))}</p>
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={item.is_active}
                    onChange={(e) =>
                      startTransition(() =>
                        toggleCommitmentActive(item.id, e.target.checked)
                      )
                    }
                  />
                  Ativo
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(item)}
                    className="rounded-md p-1.5 text-muted hover:bg-black/[.05] hover:text-foreground"
                    aria-label="Editar"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => remove(item)}
                    className="rounded-md p-1.5 text-muted hover:bg-black/[.05] hover:text-negative"
                    aria-label="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalItem !== null}
        onClose={() => setModalItem(null)}
        title={modalItem === "new" ? "Novo compromisso" : "Editar compromisso"}
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Nome</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="Ex: Aluguel"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Valor</span>
              <input
                type="number"
                step="0.01"
                value={form.amount || ""}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
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
                onChange={(e) => setForm({ ...form, due_day: Number(e.target.value) })}
                className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Recorrência</span>
            <select
              value={form.recurrence}
              onChange={(e) =>
                setForm({ ...form, recurrence: e.target.value as Recurrence })
              }
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="mensal">Mensal</option>
              <option value="unico">Único</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Categoria (opcional)</span>
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
