/** @format */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppPreferences } from "@/lib/app-preferences";

type Action = "INCOME" | "EXPENSE" | "DEPOSIT_VAULT" | "DEPOSIT_EMERGENCY";

type DashboardData = {
  balances: { MAIN: number; VAULT: number; EMERGENCY: number };
  recentTransactions: Array<{
    id: string;
    type: "INCOME" | "EXPENSE" | "TRANSFER" | "WITHDRAW";
    amount: number;
    category: string | null;
    note: string | null;
    createdAt: string;
  }>;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

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

function actionMeta(a: Action) {
  switch (a) {
    case "INCOME":
      return {
        title: "Add Income",
        subtitle: "MAIN balance will increase",
        tone: "safe" as const,
        badge: "IN" as const,
      };
    case "EXPENSE":
      return {
        title: "Add Expense",
        subtitle: "MAIN balance will decrease",
        tone: "danger" as const,
        badge: "OUT" as const,
      };
    case "DEPOSIT_VAULT":
      return {
        title: "Deposit to Vault",
        subtitle: "Move MAIN → VAULT",
        tone: "safe" as const,
        badge: "MOVE" as const,
      };
    case "DEPOSIT_EMERGENCY":
      return {
        title: "Deposit to Emergency",
        subtitle: "Move MAIN → EMERGENCY",
        tone: "safe" as const,
        badge: "MOVE" as const,
      };
  }
}

export default function TransactionPage() {
  const router = useRouter();
  const { language } = useAppPreferences();

  const text =
    language === "id"
      ? {
          title: "Transaksi Baru",
          subtitle:
            "Buat pemasukan/pengeluaran atau setoran ke Vault/Darurat (mode demo).",
          back: "Kembali ke Dashboard",
          main: "Utama",
          liquidCash: "Kas likuid",
          vault: "Vault",
          goalSavings: "Tabungan tujuan",
          emergency: "Darurat",
          emergencyBuffer: "Buffer darurat",
          form: "Form Transaksi",
          action: "Aksi",
          amount: "Jumlah (IDR)",
          category: "Kategori",
          categoryPlaceholder: "contoh: Makanan, Gaji, Setoran",
          note: "Catatan (opsional)",
          notePlaceholder: "Catatan opsional…",
          failed: "Gagal",
          success: "Berhasil",
          submit: "Buat Transaksi",
          saving: "Menyimpan...",
          refresh: "Muat Ulang Pratinjau",
          amountRule: "Jumlah harus bilangan positif.",
          recent: "Transaksi Terbaru",
          loading: "Memuat…",
          noTx: "Belum ada transaksi.",
          txCreated: "Transaksi berhasil dibuat ✅",
        }
      : {
          title: "New Transaction",
          subtitle:
            "Create income/expense or deposit to Vault/Emergency (demo mode).",
          back: "Back to Dashboard",
          main: "Main",
          liquidCash: "Liquid cash",
          vault: "Vault",
          goalSavings: "Goal savings",
          emergency: "Emergency",
          emergencyBuffer: "Emergency buffer",
          form: "Transaction Form",
          action: "Action",
          amount: "Amount (IDR)",
          category: "Category",
          categoryPlaceholder: "e.g. Food, Salary, Deposit",
          note: "Note (optional)",
          notePlaceholder: "Optional note…",
          failed: "Failed",
          success: "Success",
          submit: "Create Transaction",
          saving: "Saving...",
          refresh: "Refresh Preview",
          amountRule: "Amount must be a positive number.",
          recent: "Recent Transactions",
          loading: "Loading…",
          noTx: "No transactions yet.",
          txCreated: "Transaction created ✅",
        };

  const [action, setAction] = useState<Action>("INCOME");
  const [amount, setAmount] = useState<number>(100000);
  const [category, setCategory] = useState<string>("General");
  const [note, setNote] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [dash, setDash] = useState<DashboardData | null>(null);
  const [dashLoading, setDashLoading] = useState<boolean>(true);

  const meta = useMemo(() => actionMeta(action), [action]);

  const quickAmounts = useMemo(
    () => [50000, 100000, 200000, 500000, 1000000],
    [],
  );

  const disabledSubmit =
    loading ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 1_000_000_000;

  async function loadDashboard() {
    setDashLoading(true);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const data = (await res.json()) as DashboardData;
      setDash(data);
    } catch {
      // silent; preview just won't show
    } finally {
      setDashLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    setLoading(true);
    setErr(null);
    setOkMsg(null);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          amount,
          category: category?.trim() ? category.trim() : undefined,
          note: note?.trim() ? note.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErr(data.error ?? "Failed");
      } else {
        setOkMsg(text.txCreated);

        // refresh preview + recent list first
        await loadDashboard();

        // then go dashboard (demo UX)
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 650);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const balances = dash?.balances ?? { MAIN: 0, VAULT: 0, EMERGENCY: 0 };
  const recent = dash?.recentTransactions ?? [];

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="rounded-2xl p-6 space-y-6 surface money-glow">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {text.title}
              </h1>
              <Chip tone="default">LEDGER</Chip>
              <Chip tone="ai">LIVE</Chip>
            </div>
            <p className="text-sm text-muted-foreground">{text.subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="rounded-xl"
              onClick={() => router.push("/dashboard")}
            >
              {text.back}
            </Button>
          </div>
        </div>

        {/* Preview balances */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{text.main}</span>
                <Chip tone="default">CASH</Chip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {dashLoading ? "…" : formatIDR(balances.MAIN)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {text.liquidCash}
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{text.vault}</span>
                <Chip tone="safe">LOCK</Chip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {dashLoading ? "…" : formatIDR(balances.VAULT)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {text.goalSavings}
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{text.emergency}</span>
                <Chip tone="safe">SAFE</Chip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {dashLoading ? "…" : formatIDR(balances.EMERGENCY)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {text.emergencyBuffer}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form + Recent */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Form */}
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>{text.form}</span>
                <Chip tone={meta.tone}>{meta.badge}</Chip>
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {meta.subtitle}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Action */}
              <div className="space-y-1">
                <div className="text-sm font-medium">{text.action}</div>
                <Select
                  value={action}
                  onValueChange={(v) => setAction(v as Action)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Add Income (MAIN)</SelectItem>
                    <SelectItem value="EXPENSE">Add Expense (MAIN)</SelectItem>
                    <SelectItem value="DEPOSIT_VAULT">
                      Deposit to Vault
                    </SelectItem>
                    <SelectItem value="DEPOSIT_EMERGENCY">
                      Deposit to Emergency
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <div className="text-sm font-medium">{text.amount}</div>
                <Input
                  type="number"
                  min={1}
                  step={1000}
                  value={Number.isFinite(amount) ? amount : 0}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="rounded-xl"
                />

                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((a) => {
                    const active = amount === a;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAmount(a)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition",
                          "hover:bg-muted/60",
                          active && "bg-primary/10 border-primary/30",
                        )}
                      >
                        {formatIDR(a)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <div className="text-sm font-medium">{text.category}</div>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder={text.categoryPlaceholder}
                  className="rounded-xl"
                />
              </div>

              {/* Note */}
              <div className="space-y-1">
                <div className="text-sm font-medium">{text.note}</div>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={text.notePlaceholder}
                  className="rounded-xl min-h-30"
                />
              </div>

              {/* Alerts */}
              {err && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <div className="font-semibold">{text.failed}</div>
                  <div className="text-xs mt-1">{err}</div>
                </div>
              )}
              {okMsg && (
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">
                  <div className="font-semibold">{text.success}</div>
                  <div className="text-xs mt-1 text-muted-foreground">
                    {okMsg}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={submit}
                  disabled={disabledSubmit}
                  className="rounded-xl btn-glow"
                >
                  {loading ? text.saving : text.submit}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => loadDashboard()}
                >
                  {text.refresh}
                </Button>
              </div>

              {disabledSubmit && (
                <div className="text-xs text-muted-foreground">
                  {text.amountRule}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent list */}
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>{text.recent}</span>
                <Chip tone="default">LIVE</Chip>
              </CardTitle>
            </CardHeader>

            <CardContent className="divide-y">
              {dashLoading ? (
                <div className="py-6 text-sm text-muted-foreground">
                  {text.loading}
                </div>
              ) : recent.length === 0 ? (
                <div className="py-6 text-sm text-muted-foreground">
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
    </div>
  );
}
