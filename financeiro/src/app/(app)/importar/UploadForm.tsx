"use client";

import { useState, useTransition } from "react";
import { Upload } from "lucide-react";
import type { Account } from "@/lib/database.types";
import { uploadAndParse } from "./actions";

export default function UploadForm({ accounts }: { accounts: Account[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await uploadAndParse(formData);
      } catch (err) {
        const digest =
          typeof err === "object" && err !== null && "digest" in err
            ? String((err as { digest: unknown }).digest)
            : "";
        if (digest.startsWith("NEXT_REDIRECT")) {
          throw err; // deixa o Next.js navegar para a tela de revisão
        }
        setError(err instanceof Error ? err.message : "Não foi possível processar o arquivo.");
      }
    });
  }

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted">
        Cadastre uma conta em <strong>Contas</strong> antes de importar um extrato.
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Conta de destino</span>
        <select
          name="account_id"
          required
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
        <span className="text-muted">Arquivo (CSV, XLSX ou PDF)</span>
        <input
          type="file"
          name="file"
          required
          accept=".csv,.xlsx,.xls,.pdf"
          onChange={(e) => setIsPdf(!!e.target.files?.[0]?.name.toLowerCase().endsWith(".pdf"))}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent file:mr-3 file:rounded-md file:border-0 file:bg-black/[.05] file:px-3 file:py-1 file:text-sm"
        />
      </label>

      {isPdf && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Senha do PDF (se o extrato tiver senha)</span>
          <input
            type="password"
            name="pdf_password"
            autoComplete="off"
            placeholder="Deixe em branco se não tiver senha"
            className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
      )}

      {error && <p className="text-sm text-negative">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="flex w-fit items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
      >
        <Upload size={16} />
        {pending ? "Processando..." : "Enviar e analisar"}
      </button>
    </form>
  );
}
