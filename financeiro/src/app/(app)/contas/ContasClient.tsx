"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Wallet, Banknote, TrendingUp } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";
import type { Account, AccountType } from "@/lib/database.types";
import {
  createAccount,
  updateAccount,
  deleteAccount,
  toggleAccountActive,
  type AccountInput,
} from "./actions";

const TYPE_LABEL: Record<AccountType, string> = {
  banco: "Banco",
  dinheiro: "Dinheiro",
  investimento: "Investimento",
};

const TYPE_ICON: Record<AccountType, React.ElementType> = {
  banco: Wallet,
  dinheiro: Banknote,
  investimento: TrendingUp,
};

const DEFAULT_INPUT: AccountInput = {
  name: "",
  type: "banco",
  initial_balance: 0,
  color: "#F97316",
};

export default function ContasClient({
  accounts,
}: {
  accounts: Account[];
}) {
  const [modalAccount, setModalAccount] = useState<Account | "new" | null>(
    null
  );
  const [form, setForm] = useState<AccountInput>(DEFAULT_INPUT);
  const [pending, startTransition] = useTransition();

  function openNew() {
    setForm(DEFAULT_INPUT);
    setModalAccount("new");
  }

  function openEdit(account: Account) {
    setForm({
      name: account.name,
      type: account.type,
      initial_balance: Number(account.initial_balance),
      color: account.color ?? "#F97316",
    });
    setModalAccount(account);
  }

  function submit() {
    if (!form.name.trim()) return;
    startTransition(async () => {
      if (modalAccount === "new") {
        await createAccount(form);
      } else if (modalAccount) {
        await updateAccount(modalAccount.id, form);
      }
      setModalAccount(null);
    });
  }

  function remove(account: Account) {
    if (!confirm(`Excluir a conta "${account.name}"? As transações vinculadas também serão removidas.`))
      return;
    startTransition(async () => {
      await deleteAccount(account.id);
    });
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          <Plus size={16} /> Nova conta
        </button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          title="Nenhuma conta cadastrada"
          description="Cadastre suas contas de banco, dinheiro ou investimento para começar a registrar transações."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const Icon = TYPE_ICON[account.type];
            return (
              <div key={account.id} className={`card p-5 ${!account.is_active ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${account.color}1a` }}
                    >
                      <Icon size={17} style={{ color: account.color ?? undefined }} />
                    </span>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-xs text-muted">
                        {TYPE_LABEL[account.type]}
                        {account.is_demo && " · demo"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(account)}
                      className="rounded-md p-1.5 text-muted hover:bg-black/[.05] hover:text-foreground"
                      aria-label="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => remove(account)}
                      className="rounded-md p-1.5 text-muted hover:bg-black/[.05] hover:text-negative"
                      aria-label="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="mt-4 text-2xl font-semibold tracking-tight">
                  {formatCurrency(Number(account.current_balance))}
                </p>
                <label className="mt-3 flex items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={account.is_active}
                    onChange={(e) =>
                      startTransition(() =>
                        toggleAccountActive(account.id, e.target.checked)
                      )
                    }
                  />
                  Ativa
                </label>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalAccount !== null}
        onClose={() => setModalAccount(null)}
        title={modalAccount === "new" ? "Nova conta" : "Editar conta"}
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Nome</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="Ex: Nubank"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Tipo</span>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as AccountType })
              }
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="banco">Banco</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="investimento">Investimento</option>
            </select>
          </label>
          {modalAccount === "new" && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Saldo inicial</span>
              <input
                type="number"
                step="0.01"
                value={form.initial_balance}
                onChange={(e) =>
                  setForm({
                    ...form,
                    initial_balance: Number(e.target.value),
                  })
                }
                className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
          )}
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
