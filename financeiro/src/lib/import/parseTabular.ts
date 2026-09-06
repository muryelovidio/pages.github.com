import type { ParsedRow } from "./types";

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function findColumn(headers: string[], patterns: RegExp[]): number {
  for (const pattern of patterns) {
    const idx = headers.findIndex((h) => pattern.test(h));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Aceita tanto "1.234,56" (padrão BR) quanto "1234.56" (padrão internacional)
 * e formatos com parênteses ou sinal para negativos: "(150,00)" ou "-150.00".
 */
export function parseLooseNumber(raw: string): number | null {
  let text = raw.trim();
  if (!text) return null;

  let negative = false;
  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1);
  }
  text = text.replace(/[^\d,.\-]/g, "");
  if (text.startsWith("-")) {
    negative = true;
    text = text.slice(1);
  }
  if (!text) return null;

  const hasComma = text.includes(",");
  const hasDot = text.includes(".");
  if (hasComma && hasDot) {
    // Formato BR: "." é milhar, "," é decimal
    text = text.replace(/\./g, "").replace(",", ".");
  } else if (hasComma && !hasDot) {
    text = text.replace(",", ".");
  }

  const value = Number(text);
  if (Number.isNaN(value)) return null;
  return negative ? -value : value;
}

/** Aceita DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD e variações com ano de 2 dígitos. */
export function parseLooseDate(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const brMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, "0");
    const month = brMatch[2].padStart(2, "0");
    let year = brMatch[3];
    if (year.length === 2) year = `20${year}`;
    if (Number(month) > 12) return null;
    return `${year}-${month}-${day}`;
  }

  return null;
}

export interface TabularParseResult {
  rows: ParsedRow[];
  skipped: number;
}

/**
 * Recebe uma matriz de células (primeira linha = cabeçalho) vinda de um CSV
 * ou de uma planilha XLSX e tenta identificar as colunas de data, descrição
 * e valor por nome do cabeçalho — com fallback posicional quando não
 * reconhece os nomes.
 */
export function parseTabularMatrix(matrix: string[][]): TabularParseResult {
  if (matrix.length === 0) return { rows: [], skipped: 0 };

  const headers = matrix[0].map(normalize);
  const dataRows = matrix.slice(1);

  const dateIdx = findColumn(headers, [/data|date/]);
  const descIdx = findColumn(headers, [/descri|historic|hist\.|memo|lancamento|title/]);
  const amountIdx = findColumn(headers, [/valor|amount|montante/]);
  const debitIdx = findColumn(headers, [/debito|debit|saida/]);
  const creditIdx = findColumn(headers, [/credito|credit|entrada/]);

  const useDebitCredit = debitIdx !== -1 || creditIdx !== -1;
  const useHeaderMapping = dateIdx !== -1 && descIdx !== -1 && (amountIdx !== -1 || useDebitCredit);

  const rows: ParsedRow[] = [];
  let skipped = 0;

  for (const row of dataRows) {
    if (row.every((cell) => !cell || !cell.trim())) continue;

    let dateRaw: string;
    let descRaw: string;
    let amount: number | null;
    let type: "entrada" | "saida";

    if (useHeaderMapping) {
      dateRaw = row[dateIdx] ?? "";
      descRaw = row[descIdx] ?? "";
      if (useDebitCredit) {
        const debit = debitIdx !== -1 ? parseLooseNumber(row[debitIdx] ?? "") : null;
        const credit = creditIdx !== -1 ? parseLooseNumber(row[creditIdx] ?? "") : null;
        if (credit && credit !== 0) {
          amount = Math.abs(credit);
          type = "entrada";
        } else if (debit && debit !== 0) {
          amount = Math.abs(debit);
          type = "saida";
        } else {
          amount = null;
          type = "saida";
        }
      } else {
        const value = parseLooseNumber(row[amountIdx] ?? "");
        amount = value === null ? null : Math.abs(value);
        type = value !== null && value < 0 ? "saida" : "entrada";
      }
    } else {
      // Fallback posicional: data, descrição, valor (formato simples mais comum)
      dateRaw = row[0] ?? "";
      descRaw = row[1] ?? "";
      const value = parseLooseNumber(row[2] ?? "");
      amount = value === null ? null : Math.abs(value);
      type = value !== null && value < 0 ? "saida" : "entrada";
    }

    const date = parseLooseDate(dateRaw);
    const description = descRaw.trim();

    if (!date || !description || amount === null || amount === 0) {
      skipped++;
      continue;
    }

    rows.push({ date, description, amount, type });
  }

  return { rows, skipped };
}
