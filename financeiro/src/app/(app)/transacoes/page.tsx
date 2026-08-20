import { createClient } from "@/lib/supabase/server";
import { getAccounts, getCategories, getCards } from "@/lib/queries";
import PageHeader from "@/components/ui/PageHeader";
import TransacoesClient from "./TransacoesClient";
import type { Transaction } from "@/lib/database.types";

export default async function TransacoesPage(props: PageProps<"/transacoes">) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const accountId = firstParam(searchParams.conta);
  const categoryId = firstParam(searchParams.categoria);
  const type = firstParam(searchParams.tipo);
  const from = firstParam(searchParams.de);
  const to = firstParam(searchParams.ate);
  const search = firstParam(searchParams.busca);

  let query = supabase
    .from("transactions_confirmed")
    .select("*, account:accounts(name, color), category:categories(name, color, icon)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);

  if (accountId) query = query.eq("account_id", accountId);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (type === "entrada" || type === "saida") query = query.eq("type", type);
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);
  if (search) query = query.ilike("description", `%${search}%`);

  const [{ data: transactions, error }, accounts, categories, cards] = await Promise.all([
    query,
    getAccounts(supabase),
    getCategories(supabase),
    getCards(supabase),
  ]);
  if (error) throw error;

  return (
    <div>
      <PageHeader
        title="Transações"
        description="Todas as entradas e saídas registradas."
      />
      <TransacoesClient
        transactions={(transactions ?? []) as unknown as TransactionWithJoins[]}
        accounts={accounts}
        categories={categories}
        cards={cards}
        filters={{ accountId, categoryId, type, from, to, search }}
      />
    </div>
  );
}

function firstParam(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.length > 0 ? v : undefined;
}

export type TransactionWithJoins = Transaction & {
  account: { name: string; color: string | null } | null;
  category: { name: string; color: string | null; icon: string | null } | null;
};
