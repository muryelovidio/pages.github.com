import ExcelJS from "exceljs";
import { parseTabularMatrix, type TabularParseResult } from "./parseTabular";

export async function parseXlsxBuffer(buffer: Buffer): Promise<TabularParseResult> {
  const workbook = new ExcelJS.Workbook();
  // exceljs empacota sua própria definição de `Buffer`, incompatível a nível
  // de tipos (mas não em runtime) com a do @types/node atual.
  await workbook.xlsx.load(buffer as never);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return { rows: [], skipped: 0 };

  const matrix: string[][] = [];
  worksheet.eachRow((row) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value;
      if (value === null || value === undefined) {
        cells.push("");
      } else if (value instanceof Date) {
        cells.push(value.toISOString().slice(0, 10));
      } else if (typeof value === "object" && "text" in value) {
        cells.push(String((value as { text: unknown }).text ?? ""));
      } else if (typeof value === "object" && "result" in value) {
        cells.push(String((value as { result: unknown }).result ?? ""));
      } else {
        cells.push(String(value));
      }
    });
    matrix.push(cells);
  });

  return parseTabularMatrix(matrix);
}
