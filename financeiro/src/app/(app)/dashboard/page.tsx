import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import EvolutionChart from "@/components/charts/EvolutionChart";

export default async function DashboardPage() {
  const supabase = await createClient();
  const data = await getDashboardData(supabase);

  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Visão geral de ${monthLabel}`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saldo total" value={formatCurrency(data.totalBalance)} />
        <StatCard
          label="Entradas no mês"
          value={formatCurrency(data.income)}
          tone="positive"
        />
        <StatCard
          label="Saídas no mês"
          value={formatCurrency(data.expense)}
          tone="negative"
        />
        <StatCard
          label="Disponível para gastar"
          value={formatCurrency(data.available)}
          tone="accent"
          hint={`Após ${formatCurrency(data.committed)} em compromissos`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium text-muted">
            Evolução — últimos 6 meses
          </h2>
          <EvolutionChart data={data.evolution} />
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-sm font-medium text-muted">
            Gasto por categoria (mês atual)
          </h2>
          {data.categoryBreakdown.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma saída registrada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.categoryBreakdown.map((cat) => {
                const pct =
                  data.expense > 0 ? (cat.total / data.expense) * 100 : 0;
                return (
                  <li key={cat.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(cat.total)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-black/[.05]">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {data.totalBalance === 0 && data.income === 0 && data.expense === 0 && (
        <div className="mt-6">
          <EmptyState
            title="Nenhum dado ainda"
            description="Cadastre uma conta e importe um extrato, ou popule dados de demonstração em Configurações para explorar a plataforma."
          />
        </div>
      )}
    </div>
  );
}
