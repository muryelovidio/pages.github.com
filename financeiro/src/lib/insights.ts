import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { monthSummary } from "@/lib/chatContext";
import { formatCurrency } from "@/lib/format";

type DB = SupabaseClient<Database>;

export interface Insight {
  title: string;
  description: string;
  tone: "positive" | "negative" | "neutral";
}

export async function buildInsights(supabase: DB): Promise<Insight[]> {
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [current, last, biggestExpenseRes, goalsRes, commitmentsRes] = await Promise.all([
    monthSummary(supabase, now),
    monthSummary(supabase, previousMonth),
    supabase
      .from("transactions_confirmed")
      .select("description, amount, date")
      .eq("type", "saida")
      .order("amount", { ascending: true })
      .limit(1),
    supabase.from("goals").select("name, target_amount, current_amount"),
    supabase.from("commitments").select("name, due_day").eq("is_active", true),
  ]);

  const insights: Insight[] = [];

  // Total de gastos vs mês anterior
  if (last.expense > 0) {
    const diffPct = ((current.expense - last.expense) / last.expense) * 100;
    insights.push({
      title:
        diffPct > 0
          ? `Gastos ${diffPct.toFixed(0)}% maiores que o mês passado`
          : `Gastos ${Math.abs(diffPct).toFixed(0)}% menores que o mês passado`,
      description: `${formatCurrency(current.expense)} este mês contra ${formatCurrency(last.expense)} em ${last.label}.`,
      tone: diffPct > 0 ? "negative" : "positive",
    });
  }

  // Categoria com maior variação
  const categories = new Set([
    ...Object.keys(current.expenseByCategory),
    ...Object.keys(last.expenseByCategory),
  ]);
  let biggestIncrease: { name: string; delta: number } | null = null;
  for (const name of categories) {
    const currentValue = current.expenseByCategory[name] ?? 0;
    const before = last.expenseByCategory[name] ?? 0;
    const delta = currentValue - before;
    if (!biggestIncrease || delta > biggestIncrease.delta) {
      biggestIncrease = { name, delta };
    }
  }
  if (biggestIncrease && biggestIncrease.delta > 0) {
    insights.push({
      title: `${biggestIncrease.name} foi a categoria que mais cresceu`,
      description: `${formatCurrency(biggestIncrease.delta)} a mais que no mês anterior.`,
      tone: "negative",
    });
  }

  // Maior gasto individual do mês
  const biggest = biggestExpenseRes.data?.[0];
  if (biggest) {
    insights.push({
      title: "Maior gasto do mês",
      description: `${biggest.description} — ${formatCurrency(Math.abs(Number(biggest.amount)))}`,
      tone: "neutral",
    });
  }

  // Taxa de poupança do mês
  if (current.income > 0) {
    const savingsRate = ((current.income - current.expense) / current.income) * 100;
    insights.push({
      title: `Taxa de poupança de ${savingsRate.toFixed(0)}% este mês`,
      description:
        savingsRate >= 0
          ? `Sobraram ${formatCurrency(current.income - current.expense)} das entradas do mês.`
          : `As saídas superaram as entradas em ${formatCurrency(current.expense - current.income)}.`,
      tone: savingsRate >= 20 ? "positive" : savingsRate >= 0 ? "neutral" : "negative",
    });
  }

  // Meta mais próxima da conclusão
  const goals = goalsRes.data ?? [];
  const closestGoal = goals
    .map((g) => ({
      name: g.name,
      pct: Number(g.target_amount) > 0 ? Number(g.current_amount) / Number(g.target_amount) : 0,
    }))
    .filter((g) => g.pct < 1)
    .sort((a, b) => b.pct - a.pct)[0];
  if (closestGoal) {
    insights.push({
      title: `Meta "${closestGoal.name}" está ${(closestGoal.pct * 100).toFixed(0)}% concluída`,
      description: "Continue os aportes para chegar lá.",
      tone: "positive",
    });
  }

  // Próximo compromisso a vencer
  const today = now.getDate();
  const commitments = commitmentsRes.data ?? [];
  const upcoming = commitments
    .map((c) => ({
      name: c.name,
      daysUntil: c.due_day >= today ? c.due_day - today : c.due_day + 30 - today,
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil)[0];
  if (upcoming) {
    insights.push({
      title: `"${upcoming.name}" vence em ${upcoming.daysUntil} dia(s)`,
      description: "Compromisso recorrente cadastrado.",
      tone: "neutral",
    });
  }

  return insights;
}
