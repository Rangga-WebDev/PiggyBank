/** @format */

"use client";

import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  Legend,
} from "recharts";

type Point = { date: string; income: number; expense: number };

function formatCompact(n: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function CashflowChart({ data }: { data: Point[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ left: 10, right: 10, top: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} />
          <YAxis tickFormatter={(v) => formatCompact(Number(v))} />
          <Tooltip formatter={(v) => formatCompact(Number(v))} />
          <Legend />
          <Area type="monotone" dataKey="income" />
          <Area type="monotone" dataKey="expense" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
