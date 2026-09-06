import { createHash } from "node:crypto";

/**
 * Hash determinístico usado para detectar transações duplicadas ao importar
 * o mesmo extrato mais de uma vez (data + valor + descrição + conta).
 */
export function dedupeHash(input: {
  date: string;
  amount: number;
  description: string;
  accountId: string;
}): string {
  const normalized = [
    input.date,
    input.amount.toFixed(2),
    input.description.trim().toLowerCase().replace(/\s+/g, " "),
    input.accountId,
  ].join("|");

  return createHash("sha256").update(normalized).digest("hex");
}
