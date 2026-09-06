import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type DB = SupabaseClient<Database>;

const DEMO_MERCHANTS: Array<{ desc: string; category: string; min: number; max: number }> = [
  { desc: "Supermercado Extra", category: "Alimentação", min: 80, max: 320 },
  { desc: "iFood", category: "Alimentação", min: 25, max: 90 },
  { desc: "Uber", category: "Transporte", min: 15, max: 60 },
  { desc: "Posto Ipiranga", category: "Transporte", min: 100, max: 250 },
  { desc: "Netflix", category: "Assinaturas", min: 39, max: 39 },
  { desc: "Spotify", category: "Assinaturas", min: 21, max: 21 },
  { desc: "Farmácia São João", category: "Saúde", min: 30, max: 150 },
  { desc: "Academia Smart Fit", category: "Saúde", min: 99, max: 99 },
  { desc: "Cinema Shopping", category: "Lazer", min: 40, max: 120 },
  { desc: "Amazon", category: "Compras", min: 50, max: 400 },
  { desc: "Aluguel", category: "Moradia", min: 1500, max: 1500 },
  { desc: "Conta de luz", category: "Moradia", min: 120, max: 220 },
  { desc: "Conta de internet", category: "Moradia", min: 99, max: 99 },
  { desc: "Curso online", category: "Educação", min: 60, max: 200 },
];

function randomBetween(min: number, max: number) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function randomDayInMonth(monthsAgo: number) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const maxDay = monthsAgo === 0 ? now.getDate() : daysInMonth;
  const day = 1 + Math.floor(Math.random() * maxDay);
  return new Date(date.getFullYear(), date.getMonth(), day).toISOString().slice(0, 10);
}

export async function seedDemoData(supabase: DB, userId: string) {
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId);
  const categoryByName = new Map((categories ?? []).map((c) => [c.name, c.id]));
  const salaryCategoryId = categoryByName.get("Salário") ?? null;

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name: "Conta corrente (demo)",
      type: "banco",
      initial_balance: 3000,
      current_balance: 3000,
      color: "#3B82F6",
      is_demo: true,
    })
    .select()
    .single();
  if (accountError) throw accountError;

  await supabase.from("cards").insert({
    user_id: userId,
    name: "Cartão demo",
    bank: "Banco Demo",
    limit_amount: 5000,
    closing_day: 20,
    due_day: 27,
    color: "#111827",
    is_demo: true,
  });

  await supabase.from("commitments").insert([
    {
      user_id: userId,
      name: "Aluguel (demo)",
      amount: 1500,
      due_day: 5,
      recurrence: "mensal",
      category_id: categoryByName.get("Moradia") ?? null,
      is_demo: true,
    },
    {
      user_id: userId,
      name: "Academia (demo)",
      amount: 99,
      due_day: 10,
      recurrence: "mensal",
      category_id: categoryByName.get("Saúde") ?? null,
      is_demo: true,
    },
  ]);

  await supabase.from("goals").insert({
    user_id: userId,
    name: "Reserva de emergência (demo)",
    target_amount: 15000,
    current_amount: 4200,
    monthly_contribution: 500,
    is_demo: true,
  });

  const transactions: Database["public"]["Tables"]["transactions"]["Insert"][] = [];
  let balanceDelta = 0;

  for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
    // Salário no início do mês
    const salaryDate = randomDayInMonth(monthsAgo);
    transactions.push({
      user_id: userId,
      account_id: account.id,
      category_id: salaryCategoryId,
      date: salaryDate,
      description: "Salário",
      raw_description: "Salário",
      amount: 6500,
      type: "entrada",
      status: "confirmado",
      is_demo: true,
    });
    balanceDelta += 6500;

    const expenseCount = 12 + Math.floor(Math.random() * 8);
    for (let i = 0; i < expenseCount; i++) {
      const merchant = DEMO_MERCHANTS[Math.floor(Math.random() * DEMO_MERCHANTS.length)];
      const amount = randomBetween(merchant.min, merchant.max);
      transactions.push({
        user_id: userId,
        account_id: account.id,
        category_id: categoryByName.get(merchant.category) ?? null,
        date: randomDayInMonth(monthsAgo),
        description: merchant.desc,
        raw_description: merchant.desc,
        amount: -amount,
        type: "saida",
        status: "confirmado",
        is_demo: true,
      });
      balanceDelta -= amount;
    }
  }

  const { error: txError } = await supabase.from("transactions").insert(transactions);
  if (txError) throw txError;

  const { error: balanceError } = await supabase
    .from("accounts")
    .update({ current_balance: 3000 + balanceDelta })
    .eq("id", account.id);
  if (balanceError) throw balanceError;
}
