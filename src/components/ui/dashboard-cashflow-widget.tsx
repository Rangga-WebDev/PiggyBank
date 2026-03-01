/** @format */

"use client";

import { useEffect, useState } from "react";
import { CashflowChart } from "@/components/ui/cashflow-chart";
import { Button } from "@/components/ui/button";
import { useAppPreferences } from "@/lib/app-preferences";

type Point = { date: string; income: number; expense: number };

export function DashboardCashflowWidget() {
  const { language } = useAppPreferences();
  const [days, setDays] = useState<7 | 14 | 30>(14);
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);

  const text =
    language === "id"
      ? {
          title: "Arus Kas",
          subtitle: "Pemasukan vs Pengeluaran",
          loading: "Memuat grafik…",
        }
      : {
          title: "Cashflow",
          subtitle: "Income vs Expense",
          loading: "Loading chart…",
        };

  useEffect(() => {
    let ignore = false;
    async function run() {
      setLoading(true);
      const res = await fetch(`/api/analytics/cashflow?days=${days}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!ignore) {
        setData(json.series ?? []);
        setLoading(false);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [days]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{text.title}</div>
          <div className="text-xs text-muted-foreground">{text.subtitle}</div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={days === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(7)}
          >
            7d
          </Button>
          <Button
            variant={days === 14 ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(14)}
          >
            14d
          </Button>
          <Button
            variant={days === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(30)}
          >
            30d
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">{text.loading}</div>
      ) : (
        <CashflowChart data={data} />
      )}
    </div>
  );
}
