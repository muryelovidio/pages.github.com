import { PDFParse } from "pdf-parse";
import { parseLooseDate, parseLooseNumber } from "./parseTabular";
import type { ParsedRow } from "./types";

// Uma linha de extrato bancário tipicamente é:
//   "12/03/2024   COMPRA DEBITO SUPERMERCADO XYZ         -150,00"
// ou termina com sufixo D/C (débito/crédito):
//   "12/03/2024   PIX RECEBIDO JOAO SILVA                 500,00 C"
const LINE_PATTERN =
  /^(\d{2}[/-]\d{2}[/-]\d{2,4})\s+(.+?)\s+(R?\$?\s?-?\(?[\d.,]+\)?)\s*([DC])?$/i;

export interface PdfParseResult {
  rows: ParsedRow[];
  skipped: number;
  rawTextSample: string;
}

export async function parsePdfBuffer(buffer: Buffer): Promise<PdfParseResult> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  let text: string;
  try {
    const result = await parser.getText();
    text = result.text;
  } finally {
    await parser.destroy();
  }

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const rows: ParsedRow[] = [];
  let skipped = 0;

  for (const line of lines) {
    const match = line.match(LINE_PATTERN);
    if (!match) continue;

    const [, dateRaw, descRaw, amountRaw, suffix] = match;
    const date = parseLooseDate(dateRaw);
    const amount = parseLooseNumber(amountRaw);
    const description = descRaw.trim();

    if (!date || amount === null || !description) {
      skipped++;
      continue;
    }

    const negative = amountRaw.includes("-") || amountRaw.includes("(");
    const type: ParsedRow["type"] =
      suffix?.toUpperCase() === "D" || (negative && suffix?.toUpperCase() !== "C")
        ? "saida"
        : suffix?.toUpperCase() === "C"
          ? "entrada"
          : negative
            ? "saida"
            : "entrada";

    rows.push({ date, description, amount: Math.abs(amount), type });
  }

  return { rows, skipped, rawTextSample: lines.slice(0, 5).join("\n") };
}
