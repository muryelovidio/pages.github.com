import Papa from "papaparse";
import { parseTabularMatrix, type TabularParseResult } from "./parseTabular";

export function parseCsvBuffer(buffer: Buffer): TabularParseResult {
  const text = buffer.toString("utf-8");
  const result = Papa.parse<string[]>(text, {
    skipEmptyLines: true,
  });
  const matrix = result.data.filter((row) => Array.isArray(row));
  return parseTabularMatrix(matrix);
}
