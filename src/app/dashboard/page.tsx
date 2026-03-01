/** @format */
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCashflowWidget } from "@/components/ui/dashboard-cashflow-widget";
import { formatIDR } from "@/lib/format";
import { useAppPreferences } from "@/lib/app-preferences";

type DashboardData = {
  user: { id: string; email: string; name: string | null };
  balances: { MAIN: number; VAULT: number; EMERGENCY: number };
  goal: null | {
    id: string;
    title: string;
    targetAmount: number;
    deadline: string;
    lockUntil: string;
  };
  monthlySaving?: number;
  recentTransactions: Array<{
    id: string;
    type: "INCOME" | "EXPENSE" | "TRANSFER" | "WITHDRAW";
    amount: number;
    category: string | null;
    note: string | null;
    createdAt: string;
  }>;
};

function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "ai" | "safe" | "danger";
}) {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide";
  const tones: Record<string, string> = {
    default: "bg-muted/40 text-foreground border-border",
    ai: "bg-accent/50 text-foreground border-border",
    safe: "bg-primary/10 text-foreground border-primary/30",
    danger: "bg-destructive/10 text-foreground border-destructive/30",
  };

  return <span className={`${base} ${tones[tone]}`}>{children}</span>;
}

function pct(n: number) {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n)}%`;
}

function estimateGoalDate(
  current: number,
  target: number,
  monthlySaving: number,
) {
  if (current >= target) return { days: 0, date: new Date() as Date | null };
  if (monthlySaving <= 0) return { days: Infinity, date: null as Date | null };

  const remaining = target - current;
  const daily = monthlySaving / 30; // demo approximation
  const days = Math.ceil(remaining / daily);

  const d = new Date();
  d.setDate(d.getDate() + days);
  return { days, date: d };
}

function formatDateID(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

async function getDashboardData(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard", {
    cache: "no-store",
  });

  if (!res.ok) {
    // You can replace this with nicer error UI if you want
    throw new Error(`Failed to load dashboard: ${res.status}`);
  }

  return (await res.json()) as DashboardData;
}

export default function DashboardPage() {
  const { language } = useAppPreferences();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const text =
    language === "id"
      ? {
          title: "Dashboard",
          cockpit: "Kokpit keuangan pribadi",
          newTransaction: "Transaksi Baru",
          withdrawEmergency: "Tarik Dana Darurat",
          netWorth: "Kekayaan Bersih",
          mainBalance: "Saldo Utama",
          liquidCash: "Kas likuid",
          goalVault: "Tabungan Tujuan",
          lockedSavings: "Tabungan terkunci",
          savingRate: "Rasio Tabungan",
          monthlyEstimate: "Estimasi 30 hari",
          goal: "Tujuan",
          tracking: "TERPANTAU",
          empty: "KOSONG",
          noGoal: "Belum ada tujuan. Tambahkan melalui seed / form nanti.",
          target: "Target",
          current: "Saat ini",
          est: "Estimasi",
          dayLeft: "hari",
          emergencyFund: "Dana Darurat",
          safe: "AMAN",
          emergencyHint:
            "Dana darurat bisa ditarik dengan reason gate + cooldown.",
          emergencyEmpty: "⚠ Dana darurat kosong — isi dulu.",
          requestWithdrawal: "Ajukan Penarikan",
          analytics: "Analitik",
          cashflowDesc:
            "Arus kas (Pemasukan vs Pengeluaran) — pilih rentang 7/14/30 hari.",
          recent: "Transaksi Terbaru",
          liveFeed: "FEED LANGSUNG",
          noTx: "Belum ada transaksi.",
          loading: "Memuat dashboard...",
          failed: "Gagal memuat dashboard",
        }
      : {
          title: "Dashboard",
          cockpit: "Personal finance cockpit",
          newTransaction: "New Transaction",
          withdrawEmergency: "Withdraw Emergency",
          netWorth: "Net Worth",
          mainBalance: "Main Balance",
          liquidCash: "Liquid cash",
          goalVault: "Goal Vault",
          lockedSavings: "Locked savings",
          savingRate: "Saving Rate",
          monthlyEstimate: "30-day estimate",
          goal: "Goal",
          tracking: "TRACKING",
          empty: "EMPTY",
          noGoal: "No goal yet. Add one via seed / form later.",
          target: "Target",
          current: "Current",
          est: "Est",
          dayLeft: "days",
          emergencyFund: "Emergency Fund",
          safe: "SAFE",
          emergencyHint:
            "Emergency fund can be withdrawn with reason gate + cooldown.",
          emergencyEmpty: "⚠ Emergency fund empty — top up first.",
          requestWithdrawal: "Request Withdrawal",
          analytics: "Analytics",
          cashflowDesc:
            "Cashflow (Income vs Expense) — choose 7/14/30 day range.",
          recent: "Recent Transactions",
          liveFeed: "LIVE FEED",
          noTx: "No transactions yet.",
          loading: "Loading dashboard...",
          failed: "Failed to load dashboard",
        };

  useEffect(() => {
    let ignore = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const response = await getDashboardData();
        if (!ignore) setData(response);
      } catch (e: any) {
        if (!ignore) setError(e?.message ?? text.failed);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [text.failed]);

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-2xl p-6 surface text-sm text-muted-foreground">
          {text.loading}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-2xl p-6 surface text-sm text-destructive">
          {text.failed}: {error}
        </div>
      </div>
    );
  }

  const main = data.balances?.MAIN ?? 0;
  const vault = data.balances?.VAULT ?? 0;
  const emergency = data.balances?.EMERGENCY ?? 0;

  const netWorth = main + vault + emergency;
  const monthlySaving = data.monthlySaving ?? 0;

  const recent = data.recentTransactions ?? [];
  const approxIncome = recent
    .filter((t) => t.type === "INCOME")
    .reduce((a, t) => a + t.amount, 0);

  const savingRate =
    approxIncome > 0 ? (monthlySaving / approxIncome) * 100 : 0;

  const goal = data.goal;
  const goalCurrent = vault;
  const goalTarget = goal?.targetAmount ?? 0;
  const goalProgress = goalTarget > 0 ? (goalCurrent / goalTarget) * 100 : 0;
  const progressClamped = Math.min(100, Math.max(0, goalProgress));

  const est = goal
    ? estimateGoalDate(goalCurrent, goalTarget, monthlySaving)
    : { days: Infinity, date: null as Date | null };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="rounded-2xl p-6 space-y-6 surface money-glow">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Dashboard
              </h1>
              <Chip tone="default">WALL ST</Chip>
              <Chip tone="ai">AI</Chip>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.user?.email ?? "demo"} • {text.cockpit}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/transaction"
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted/60 transition"
            >
              {text.newTransaction}
            </Link>

            <Link
              href="/withdraw-emergency"
              className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground btn-glow transition hover:brightness-110"
            >
              {text.withdrawEmergency}
            </Link>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{text.netWorth}</span>
                <Chip tone="safe">LIVE</Chip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {formatIDR(netWorth)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                MAIN + VAULT + EMERGENCY
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {text.mainBalance}
                </span>
                <Chip tone="default">CASH</Chip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatIDR(main)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {text.liquidCash}
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{text.goalVault}</span>
                <Chip tone="safe">LOCK</Chip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatIDR(vault)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {text.lockedSavings}
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{text.savingRate}</span>
                <Chip tone="ai">MODEL</Chip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{pct(savingRate)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {text.monthlyEstimate}: {formatIDR(monthlySaving)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goal + Emergency */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-premium md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>{text.goal}</span>
                {goal ? (
                  <Chip tone="safe">{text.tracking}</Chip>
                ) : (
                  <Chip tone="default">{text.empty}</Chip>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {!goal ? (
                <div className="text-sm text-muted-foreground">
                  {text.noGoal}
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold">{goal.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {text.target}: {formatIDR(goalTarget)} • {text.current}:{" "}
                        {formatIDR(goalCurrent)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {Math.round(goalProgress)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {est.date
                          ? `${text.est}: ${formatDateID(est.date)}`
                          : `${text.est}: -`}
                      </div>
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${progressClamped}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {text.monthlyEstimate}:{" "}
                      <span className="font-medium text-foreground">
                        {formatIDR(monthlySaving)}
                      </span>
                    </span>

                    {est.days !== Infinity && (
                      <>
                        <span className="text-muted-foreground/60">•</span>
                        <span>
                          {language === "id" ? "Sisa" : "Remaining"} ~{" "}
                          <span className="font-medium text-foreground">
                            {est.days}
                          </span>{" "}
                          {text.dayLeft}
                        </span>
                      </>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>{text.emergencyFund}</span>
                <Chip tone={emergency > 0 ? "safe" : "danger"}>
                  {emergency > 0 ? text.safe : text.empty}
                </Chip>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="text-2xl font-semibold">
                {formatIDR(emergency)}
              </div>

              <div className="text-sm text-muted-foreground">
                {text.emergencyHint}
              </div>

              {emergency === 0 && (
                <div className="text-xs text-destructive">
                  {text.emergencyEmpty}
                </div>
              )}

              <div className="pt-1">
                <Link
                  href="/withdraw-emergency"
                  className="inline-flex w-full items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted/60 transition"
                >
                  {text.requestWithdrawal}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics */}
        <Card className="card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>{text.analytics}</span>
              <Chip tone="ai">CASHFLOW</Chip>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {text.cashflowDesc}
            </div>
            <DashboardCashflowWidget />
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card className="card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>{text.recent}</span>
              <Chip tone="default">{text.liveFeed}</Chip>
            </CardTitle>
          </CardHeader>

          <CardContent className="divide-y">
            {recent.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6">
                {text.noTx}
              </div>
            ) : (
              recent.slice(0, 10).map((t) => (
                <div
                  key={t.id}
                  className="py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold">{t.type}</div>
                      <Chip
                        tone={
                          t.type === "EXPENSE" || t.type === "WITHDRAW"
                            ? "danger"
                            : "safe"
                        }
                      >
                        {t.type === "EXPENSE" || t.type === "WITHDRAW"
                          ? "OUT"
                          : "IN"}
                      </Chip>
                    </div>

                    <div className="text-xs text-muted-foreground truncate">
                      {t.category ?? "-"} • {t.note ?? "-"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {formatIDR(t.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString(
                        language === "id" ? "id-ID" : "en-US",
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
