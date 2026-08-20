"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Target, PiggyBank } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Goal } from "@/lib/database.types";
import {
  createGoal,
  updateGoal,
  deleteGoal,
  addContribution,
  type GoalInput,
} from "./actions";

const DEFAULT_INPUT: GoalInput = {
  name: "",
  target_amount: 0,
  current_amount: 0,
  target_date: null,
  monthly_contribution: null,
};

export default function MetasClient({ goals }: { goals: Goal[] }) {
  const [modalGoal, setModalGoal] = useState<Goal | "new" | null>(null);
  const [form, setForm] = useState<GoalInput>(DEFAULT_INPUT);
  const [pending, startTransition] = useTransition();

  function openNew() {
    setForm(DEFAULT_INPUT);
    setModalGoal("new");
  }

  function openEdit(goal: Goal) {
    setForm({
      name: goal.name,
      target_amount: Number(goal.target_amount),
      current_amount: Number(goal.current_amount),
      target_date: goal.target_date,
      monthly_contribution:
        goal.monthly_contribution !== null ? Number(goal.monthly_contribution) : null,
    });
    setModalGoal(goal);
  }

  function submit() {
    if (!form.name.trim() || form.target_amount <= 0) return;
    startTransition(async () => {
      if (modalGoal === "new") {
        await createGoal(form);
      } else if (modalGoal) {
        await updateGoal(modalGoal.id, form);
      }
      setModalGoal(null);
    });
  }

  function remove(goal: Goal) {
    if (!confirm(`Excluir a meta "${goal.name}"?`)) return;
    startTransition(() => deleteGoal(goal.id));
  }

  function contribute(goal: Goal) {
    const raw = prompt(`Quanto deseja adicionar à meta "${goal.name}"?`);
    if (!raw) return;
    const amount = Number(raw.replace(",", "."));
    if (!amount || amount <= 0) return;
    startTransition(() => addContribution(goal.id, amount));
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          <Plus size={16} /> Nova meta
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          title="Nenhuma meta cadastrada"
          description="Defina um objetivo, o valor alvo e acompanhe o progresso mês a mês."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const pct = Math.min(
              (Number(goal.current_amount) / Number(goal.target_amount)) * 100,
              100
            );
            return (
              <div key={goal.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                    <Target size={17} className="text-accent" />
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(goal)}
                      className="rounded-md p-1.5 text-muted hover:bg-black/[.05] hover:text-foreground"
                      aria-label="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => remove(goal)}
                      className="rounded-md p-1.5 text-muted hover:bg-black/[.05] hover:text-negative"
                      aria-label="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <p className="mt-3 font-medium">{goal.name}</p>
                <p className="text-2xl font-semibold tracking-tight">
                  {formatCurrency(Number(goal.current_amount))}
                  <span className="text-sm font-normal text-muted">
                    {" "}
                    / {formatCurrency(Number(goal.target_amount))}
                  </span>
                </p>

                <div className="mt-3 h-1.5 w-full rounded-full bg-black/[.05]">
                  <div className="h-1.5 rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted">{pct.toFixed(0)}% concluído</p>

                {goal.target_date && (
                  <p className="mt-2 text-xs text-muted">Meta para {formatDate(goal.target_date)}</p>
                )}

                <button
                  onClick={() => contribute(goal)}
                  className="mt-4 flex items-center gap-1.5 text-sm font-medium text-accent"
                >
                  <PiggyBank size={15} /> Adicionar aporte
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalGoal !== null}
        onClose={() => setModalGoal(null)}
        title={modalGoal === "new" ? "Nova meta" : "Editar meta"}
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Nome</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="Ex: Reserva de emergência"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Valor alvo</span>
              <input
                type="number"
                step="0.01"
                value={form.target_amount || ""}
                onChange={(e) =>
                  setForm({ ...form, target_amount: Number(e.target.value) })
                }
                className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Valor atual</span>
              <input
                type="number"
                step="0.01"
                value={form.current_amount || ""}
                onChange={(e) =>
                  setForm({ ...form, current_amount: Number(e.target.value) })
                }
                className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Data alvo (opcional)</span>
              <input
                type="date"
                value={form.target_date ?? ""}
                onChange={(e) =>
                  setForm({ ...form, target_date: e.target.value || null })
                }
                className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Aporte mensal (opcional)</span>
              <input
                type="number"
                step="0.01"
                value={form.monthly_contribution ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    monthly_contribution: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
          </div>

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
