import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import MetasClient from "./MetasClient";

export default async function MetasPage() {
  const supabase = await createClient();
  const { data: goals, error } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (
    <div>
      <PageHeader title="Metas" description="Objetivos financeiros e o progresso até lá." />
      <MetasClient goals={goals ?? []} />
    </div>
  );
}
