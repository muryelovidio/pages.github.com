"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Sparkles, Eraser } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { Category } from "@/lib/database.types";
import type { RuleWithCategory } from "./page";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  deleteRule,
  seedDemo,
  clearDemo,
  type CategoryInput,
} from "./actions";

const DEFAULT_INPUT: CategoryInput = { name: "", color: "#F97316", icon: "tag" };

export default function ConfiguracoesClient({
  userEmail,
  categories,
  rules,
}: {
  userEmail: string;
  categories: Category[];
  rules: RuleWithCategory[];
}) {
  const [modalCategory, setModalCategory] = useState<Category | "new" | null>(null);
  const [form, setForm] = useState<CategoryInput>(DEFAULT_INPUT);
  const [pending, startTransition] = useTransition();
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  function openNew() {
    setForm(DEFAULT_INPUT);
    setModalCategory("new");
  }

  function openEdit(category: Category) {
    setForm({ name: category.name, color: category.color ?? "#F97316", icon: category.icon ?? "tag" });
    setModalCategory(category);
  }

  function submit() {
    if (!form.name.trim()) return;
    startTransition(async () => {
      if (modalCategory === "new") {
        await createCategory(form);
      } else if (modalCategory) {
        await updateCategory(modalCategory.id, form);
      }
      setModalCategory(null);
    });
  }

  function remove(category: Category) {
    if (!confirm(`Excluir a categoria "${category.name}"? Transações vinculadas ficarão sem categoria.`))
      return;
    startTransition(() => deleteCategory(category.id));
  }

  function handleSeedDemo() {
    setDemoMessage(null);
    startTransition(async () => {
      await seedDemo();
      setDemoMessage("Dados de demonstração adicionados.");
    });
  }

  function handleClearDemo() {
    if (!confirm("Remover todos os dados marcados como demonstração?")) return;
    setDemoMessage(null);
    startTransition(async () => {
      await clearDemo();
      setDemoMessage("Dados de demonstração removidos.");
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-5">
        <h2 className="mb-1 text-sm font-medium">Perfil</h2>
        <p className="text-sm text-muted">{userEmail}</p>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">Categorias</h2>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
          >
            <Plus size={14} /> Nova categoria
          </button>
        </div>
        <div className="card divide-y divide-border overflow-hidden">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color ?? "#6B7280" }} />
              <span className="flex-1">{c.name}</span>
              <button
                onClick={() => openEdit(c)}
                className="rounded-md p-1.5 text-muted hover:bg-black/[.05] hover:text-foreground"
                aria-label="Editar"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => remove(c)}
                className="rounded-md p-1.5 text-muted hover:bg-black/[.05] hover:text-negative"
                aria-label="Excluir"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium">Regras de categorização aprendidas</h2>
        {rules.length === 0 ? (
          <p className="text-sm text-muted">
            Regras são criadas automaticamente quando você corrige a categoria de uma transação importada.
          </p>
        ) : (
          <div className="card divide-y divide-border overflow-hidden">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="rounded-md bg-black/[.04] px-2 py-0.5 font-mono text-xs">
                  {rule.match_pattern}
                </span>
                <span className="text-muted">contém →</span>
                <span className="flex-1 flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: rule.category?.color ?? "#6B7280" }}
                  />
                  {rule.category?.name ?? "—"}
                </span>
                <button
                  onClick={() => startTransition(() => deleteRule(rule.id))}
                  className="rounded-md p-1.5 text-muted hover:bg-black/[.05] hover:text-negative"
                  aria-label="Excluir regra"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-sm font-medium">Dados de demonstração</h2>
        <p className="mb-4 text-sm text-muted">
          Popule a plataforma com contas, transações e metas fictícias para explorar os recursos,
          ou remova tudo o que estiver marcado como demonstração quando for usar dados reais.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSeedDemo}
            disabled={pending}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-60"
          >
            <Sparkles size={15} /> Popular com dados demo
          </button>
          <button
            onClick={handleClearDemo}
            disabled={pending}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:border-negative hover:text-negative disabled:opacity-60"
          >
            <Eraser size={15} /> Apagar dados demo
          </button>
        </div>
        {demoMessage && <p className="mt-3 text-sm text-positive">{demoMessage}</p>}
      </section>

      <Modal
        open={modalCategory !== null}
        onClose={() => setModalCategory(null)}
        title={modalCategory === "new" ? "Nova categoria" : "Editar categoria"}
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Nome</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
