"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";

export default function EvolutionChart({
  data,
}: {
  data: Array<{ month: string; income: number; expense: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={4}>
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#6b7280" }}
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.03)" }}
          formatter={(value) => formatCurrency(Number(value ?? 0))}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #eceae6",
            fontSize: 12,
          }}
        />
        <Bar dataKey="income" name="Entradas" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Saídas" fill="#f97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
