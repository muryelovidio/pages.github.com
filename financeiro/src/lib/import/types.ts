export interface ParsedRow {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // sempre positivo — o sinal vem de `type`
  type: "entrada" | "saida";
}
