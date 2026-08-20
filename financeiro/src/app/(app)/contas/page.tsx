import { createClient } from "@/lib/supabase/server";
import { getAccounts } from "@/lib/queries";
import PageHeader from "@/components/ui/PageHeader";
import ContasClient from "./ContasClient";

export default async function ContasPage() {
  const supabase = await createClient();
  const accounts = await getAccounts(supabase);

  return (
    <div>
      <PageHeader
        title="Contas"
        description="Bancos, dinheiro em espécie e investimentos."
      />
      <ContasClient accounts={accounts} />
    </div>
  );
}
