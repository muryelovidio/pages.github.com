import type { CategorizationRule } from "@/lib/database.types";

export function suggestCategory(
  rules: CategorizationRule[],
  description: string
): string | null {
  const normalized = description.toUpperCase();

  const sorted = [...rules].sort((a, b) => b.confidence - a.confidence);

  for (const rule of sorted) {
    const pattern = rule.match_pattern.toUpperCase();
    if (rule.match_type === "contains" && normalized.includes(pattern)) {
      return rule.category_id;
    }
    if (rule.match_type === "exact" && normalized === pattern) {
      return rule.category_id;
    }
    if (rule.match_type === "regex") {
      try {
        if (new RegExp(rule.match_pattern, "i").test(description)) {
          return rule.category_id;
        }
      } catch {
        // regex inválida salva pelo usuário — ignora
      }
    }
  }

  return null;
}

/**
 * Extrai um trecho estável da descrição para usar como padrão de regra
 * "contains" (remove números/datas que mudam a cada transação do mesmo
 * estabelecimento).
 */
export function derivePattern(rawDescription: string): string {
  const cleaned = rawDescription
    .toUpperCase()
    .replace(/\d/g, "")
    .replace(/[^A-ZÀ-Ü\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 30) || rawDescription.toUpperCase().slice(0, 30);
}
