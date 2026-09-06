import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buildInsights } from "@/lib/insights";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

const TONE_ICON = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
} as const;

export default async function InsightsPage() {
  const supabase = await createClient();
  const insights = await buildInsights(supabase);

  return (
    <div>
      <PageHeader
        title="Insights"
        description="Leituras automáticas calculadas a partir dos seus dados — sem depender de IA para os números."
      />

      {insights.length === 0 ? (
        <EmptyState
          title="Ainda sem insights"
          description="Registre transações por pelo menos um mês para começar a ver leituras automáticas aqui."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {insights.map((insight, i) => {
            const Icon = TONE_ICON[insight.tone];
            return (
              <div key={i} className="card p-5">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    insight.tone === "positive"
                      ? "bg-positive/10 text-positive"
                      : insight.tone === "negative"
                        ? "bg-negative/10 text-negative"
                        : "bg-accent/10 text-accent"
                  }`}
                >
                  <Icon size={17} />
                </span>
                <p className="mt-3 font-medium">{insight.title}</p>
                <p className="mt-1 text-sm text-muted">{insight.description}</p>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 flex items-center gap-1.5 text-xs text-muted">
        <Sparkles size={13} /> Quer conversar sobre esses números? Use o Assistente.
      </p>
    </div>
  );
}
