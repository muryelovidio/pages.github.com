import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries";
import PageHeader from "@/components/ui/PageHeader";
import CompromissosClient from "./CompromissosClient";

export default async function CompromissosPage() {
  const supabase = await createClient();

  const [{ data: commitments, error }, categories] = await Promise.all([
    supabase.from("commitments").select("*").order("due_day", { ascending: true }),
    getCategories(supabase),
  ]);
  if (error) throw error;

  return (
    <div>
      <PageHeader
        title="Compromissos"
        description="Contas futuras que já reduzem o quanto você tem disponível para gastar."
      />
      <CompromissosClient commitments={commitments ?? []} categories={categories} />
    </div>
  );
}
