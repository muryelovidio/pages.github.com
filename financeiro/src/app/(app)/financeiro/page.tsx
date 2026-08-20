import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import ChatClient from "./ChatClient";

export default async function FinanceiroPage() {
  const supabase = await createClient();
  const { data: history, error } = await supabase
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw error;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="Assistente financeiro"
        description="Pergunte sobre seus gastos, saldo, metas e categorias."
      />
      <ChatClient initialMessages={history ?? []} />
    </div>
  );
}
