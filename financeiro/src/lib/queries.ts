import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type DB = SupabaseClient<Database>;

export function monthRange(reference: Date) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toISODate(start), end: toISODate(end) };
}

export async function getAccounts(supabase: DB) {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getCategories(supabase: DB) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getCards(supabase: DB) {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Ciclo de fatura "em aberto" (ainda acumulando) para um cartão com o dia
 * de fechamento informado, com base na data de referência.
 */
export function currentCardCycle(closingDay: number, reference = new Date()) {
  const day = reference.getDate();
  const endMonthOffset = day <= closingDay ? 0 : 1;
  const end = new Date(
    reference.getFullYear(),
    reference.getMonth() + endMonthOffset,
    closingDay
  );
  const start = new Date(end.getFullYear(), end.getMonth() - 1, closingDay + 1);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toISODate(start), end: toISODate(end) };
}

export async function getCardInvoiceTotal(
  supabase: DB,
  cardId: string,
  closingDay: number
) {
  const { start, end } = currentCardCycle(closingDay);
  const { data, error } = await supabase
    .from("transactions_confirmed")
    .select("amount, type")
    .eq("card_id", cardId)
    .gte("date", start)
    .lte("date", end);
  if (error) throw error;

  const total = (data ?? []).reduce(
    (sum, t) => sum + (t.type === "saida" ? Math.abs(Number(t.amount)) : 0),
    0
  );
  return { total, start, end };
}

export async function getActiveCommitmentsTotal(supabase: DB) {
  const { data, error } = await supabase
    .from("commitments")
    .select("amount")
    .eq("is_active", true);
  if (error) throw error;
  return (data ?? []).reduce((sum, c) => sum + Number(c.amount), 0);
}

export interface DashboardData {
  totalBalance: number;
  income: number;
  expense: number;
  available: number;
  committed: number;
  categoryBreakdown: Array<{ name: string; color: string; total: number }>;
  evolution: Array<{ month: string; income: number; expense: number }>;
}

export async function getDashboardData(supabase: DB): Promise<DashboardData> {
  const now = new Date();
  const { start, end } = monthRange(now);

  const [accountsRes, monthTxRes, committed] = await Promise.all([
    supabase.from("accounts").select("current_balance").eq("is_active", true),
    supabase
      .from("transactions_confirmed")
      .select("amount, type, category:categories(name, color)")
      .gte("date", start)
      .lt("date", end),
    getActiveCommitmentsTotal(supabase),
  ]);

  if (accountsRes.error) throw accountsRes.error;
  if (monthTxRes.error) throw monthTxRes.error;

  const totalBalance = (accountsRes.data ?? []).reduce(
    (sum, a) => sum + Number(a.current_balance),
    0
  );

  let income = 0;
  let expense = 0;
  const byCategory = new Map<string, { color: string; total: number }>();

  for (const tx of monthTxRes.data ?? []) {
    const amount = Number(tx.amount);
    if (tx.type === "entrada") {
      income += amount;
    } else {
      expense += Math.abs(amount);
      const cat = tx.category as unknown as
        | { name: string; color: string | null }
        | null;
      const name = cat?.name ?? "Sem categoria";
      const color = cat?.color ?? "#6B7280";
      const prev = byCategory.get(name) ?? { color, total: 0 };
      prev.total += Math.abs(amount);
      byCategory.set(name, prev);
    }
  }

  const categoryBreakdown = Array.from(byCategory.entries())
    .map(([name, v]) => ({ name, color: v.color, total: v.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  // Evolução dos últimos 6 meses (incluindo o atual)
  const evolution: DashboardData["evolution"] = [];
  for (let i = 5; i >= 0; i--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const { start: mStart, end: mEnd } = monthRange(ref);
    const { data, error } = await supabase
      .from("transactions_confirmed")
      .select("amount, type")
      .gte("date", mStart)
      .lt("date", mEnd);
    if (error) throw error;

    let mIncome = 0;
    let mExpense = 0;
    for (const tx of data ?? []) {
      if (tx.type === "entrada") mIncome += Number(tx.amount);
      else mExpense += Math.abs(Number(tx.amount));
    }

    evolution.push({
      month: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(ref),
      income: mIncome,
      expense: mExpense,
    });
  }

  return {
    totalBalance,
    income,
    expense,
    available: totalBalance - committed,
    committed,
    categoryBreakdown,
    evolution,
  };
}
