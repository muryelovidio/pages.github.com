import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { monthRange, getCardInvoiceTotal } from "@/lib/queries";

type DB = SupabaseClient<Database>;

export async function monthSummary(supabase: DB, reference: Date) {
  const { start, end } = monthRange(reference);
  const { data, error } = await supabase
    .from("transactions_confirmed")
    .select("amount, type, category:categories(name)")
    .gte("date", start)
    .lt("date", end);
  if (error) throw error;

  let income = 0;
  let expense = 0;
  const byCategory = new Map<string, number>();

  for (const tx of data ?? []) {
    const amount = Number(tx.amount);
    if (tx.type === "entrada") {
      income += amount;
    } else {
      expense += Math.abs(amount);
      const cat = tx.category as unknown as { name: string } | null;
      const name = cat?.name ?? "Sem categoria";
      byCategory.set(name, (byCategory.get(name) ?? 0) + Math.abs(amount));
    }
  }

  return {
    label: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
      reference
    ),
    income,
    expense,
    expenseByCategory: Object.fromEntries(byCategory),
  };
}

/**
 * Resumo estruturado (nunca o banco inteiro) com os dados financeiros que a
 * Claude usa para responder perguntas no assistente. Cada campo vem de uma
 * consulta específica e agregada — não expõe linhas cruas além das últimas
 * transações, já resumidas aos campos relevantes.
 */
export async function buildChatDataSummary(supabase: DB) {
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    { data: accounts },
    { data: cards },
    { data: commitments },
    { data: goals },
    { data: recentTransactions },
    currentMonth,
    lastMonth,
  ] = await Promise.all([
    supabase.from("accounts").select("name, type, current_balance, is_active"),
    supabase.from("cards").select("id, name, limit_amount, closing_day"),
    supabase
      .from("commitments")
      .select("name, amount, due_day, recurrence, is_active"),
    supabase
      .from("goals")
      .select("name, target_amount, current_amount, target_date"),
    supabase
      .from("transactions_confirmed")
      .select("date, description, amount, type, category:categories(name)")
      .order("date", { ascending: false })
      .limit(15),
    monthSummary(supabase, now),
    monthSummary(supabase, previousMonth),
  ]);

  const cardsWithInvoice = await Promise.all(
    (cards ?? []).map(async (card) => {
      const invoice = await getCardInvoiceTotal(supabase, card.id, card.closing_day);
      return {
        name: card.name,
        limit: card.limit_amount,
        currentInvoiceTotal: invoice.total,
      };
    })
  );

  return {
    today: now.toISOString().slice(0, 10),
    accounts: (accounts ?? []).map((a) => ({
      name: a.name,
      type: a.type,
      balance: Number(a.current_balance),
      active: a.is_active,
    })),
    totalBalance: (accounts ?? [])
      .filter((a) => a.is_active)
      .reduce((sum, a) => sum + Number(a.current_balance), 0),
    currentMonth,
    lastMonth,
    cards: cardsWithInvoice,
    commitments: (commitments ?? []).map((c) => ({
      name: c.name,
      amount: Number(c.amount),
      dueDay: c.due_day,
      recurrence: c.recurrence,
      active: c.is_active,
    })),
    goals: (goals ?? []).map((g) => ({
      name: g.name,
      targetAmount: Number(g.target_amount),
      currentAmount: Number(g.current_amount),
      targetDate: g.target_date,
    })),
    recentTransactions: (recentTransactions ?? []).map((t) => ({
      date: t.date,
      description: t.description,
      amount: Number(t.amount),
      type: t.type,
      category: (t.category as unknown as { name: string } | null)?.name ?? null,
    })),
  };
}
