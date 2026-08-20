import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries";
import PageHeader from "@/components/ui/PageHeader";
import ConfiguracoesClient from "./ConfiguracoesClient";
import type { CategorizationRule } from "@/lib/database.types";

export type RuleWithCategory = CategorizationRule & {
  category: { name: string; color: string | null } | null;
};

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [categories, { data: rules, error }] = await Promise.all([
    getCategories(supabase),
    supabase
      .from("categorization_rules")
      .select("*, category:categories(name, color)")
      .order("created_at", { ascending: false }),
  ]);
  if (error) throw error;

  return (
    <div>
      <PageHeader title="Configurações" description="Categorias, regras e dados de demonstração." />
      <ConfiguracoesClient
        userEmail={user?.email ?? ""}
        categories={categories}
        rules={(rules ?? []) as unknown as RuleWithCategory[]}
      />
    </div>
  );
}
