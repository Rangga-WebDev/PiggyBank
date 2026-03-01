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

type RequestResp = {
  ok?: boolean;
  error?: string;
  details?: any;
  emergencyBalance?: number;
  request?: {
    id: string;
    cooldownUntil?: string | null;
    aiScore?: number | null;
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    amount: number;
    reasonCategory: string;
    urgency: number;
    createdAt: string;
  };
  preview?: {
    emergencyBalance: number;
    afterBalance: number;
    amountRatio: number;
    cooldownHours: number;
    score: number;
  };
  cooldownUntil?: string;
};

type ExecuteResp = {
  ok?: boolean;
  error?: string;
  cooldownUntil?: string;
  txRow?: any;
  updated?: any;
  emergencyBalance?: number;
  afterBalance?: number;
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

function msToHMS(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

async function readJsonSafe(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return { json: await res.json(), rawText: null as string | null };
  }
  const raw = await res.text();
  return { json: null as any, rawText: raw };
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

function urgencyLabel(u: number) {
  if (u <= 1) return { label: "Low", hint: "Not urgent. Consider postponing." };
  if (u === 2) return { label: "Moderate", hint: "Needs attention soon." };
  if (u === 3) return { label: "High", hint: "Important. Verify reason." };
  if (u === 4)
    return { label: "Very High", hint: "Urgent. Ensure essentials." };
  return { label: "Critical", hint: "Emergency level. Execute responsibly." };
}

function ratioTone(ratio01: number) {
  if (!Number.isFinite(ratio01)) return "default" as const;
  if (ratio01 <= 0.2) return "safe" as const;
  if (ratio01 <= 0.45) return "default" as const;
  return "danger" as const;
}

function ratioText(ratio01: number) {
  if (!Number.isFinite(ratio01)) return "—";
  const p = Math.round(ratio01 * 100);
  if (p <= 20) return "Safe zone";
  if (p <= 45) return "Caution";
  return "High impact";
}

export default function WithdrawEmergencyPage() {
  const router = useRouter();
  const { language } = useAppPreferences();

  const text =
    language === "id"
      ? {
          title: "Tarik Dana Darurat",
          subtitle:
            "Penarikan berbasis request • Reason Gate + Cooldown + skor AI",
          back: "Kembali ke Dashboard",
          requested: "Diajukan",
          urgency: "Urgensi",
          impact: "Dampak",
          basedPreview: "Berdasarkan preview (setelah submit)",
          request: "Permintaan",
          amount: "Jumlah (IDR)",
          reasonCategory: "Kategori Alasan",
          categoryTip: "Tip: pilih kategori paling akurat agar skor AI adil.",
          reasonDetails: "Detail alasan (opsional)",
          reasonPlaceholder: "Jelaskan alasanmu… (singkat tapi jelas)",
          reasonHint: "Semakin jelas, biasanya skor AI lebih stabil.",
          submit: "Kirim Permintaan",
          scoring: "Menilai...",
          resetPreview: "Reset Preview",
          error: "Error",
          aiPreview: "Preview Keputusan AI",
          submitToPreview:
            "Submit request untuk melihat preview AI (skor, cooldown, dampak).",
          score: "SKOR",
          cooldown: "COOLDOWN",
          emergencyBalance: "Saldo Darurat",
          afterBalance: "Saldo Setelah",
          impactMeter: "Meter Dampak",
          cooldownRemaining: "Sisa cooldown",
          canExecuteAfter: "Bisa dieksekusi setelah",
          execute: "Eksekusi Penarikan",
          executing: "Mengeksekusi...",
          executeHint: "Tombol eksekusi aktif setelah cooldown selesai.",
          executeFailed: "Eksekusi gagal",
          requestFailed: "Permintaan gagal",
          executeNonJson:
            "Endpoint execute mengembalikan non-JSON (404/500). Cek /api/withdrawals/execute.",
          requestNonJson:
            "Server mengembalikan non-JSON (cek /api/withdrawals/request)",
          pending: "MENUNGGU",
          safeZone: "Zona aman",
          caution: "Waspada",
          highImpact: "Dampak tinggi",
        }
      : {
          title: "Withdraw Emergency",
          subtitle:
            "Request-based withdrawal • Reason Gate + Cooldown + AI score",
          back: "Back to Dashboard",
          requested: "Requested",
          urgency: "Urgency",
          impact: "Impact",
          basedPreview: "Based on preview (after you submit)",
          request: "Request",
          amount: "Amount (IDR)",
          reasonCategory: "Reason Category",
          categoryTip:
            "Tip: choose the most accurate category so AI score stays fair.",
          reasonDetails: "Reason details (optional)",
          reasonPlaceholder: "Explain your reason… (short but clear)",
          reasonHint:
            "The clearer your reason, the more stable the AI score usually is.",
          submit: "Submit Request",
          scoring: "Scoring...",
          resetPreview: "Reset Preview",
          error: "Error",
          aiPreview: "AI Decision Preview",
          submitToPreview:
            "Submit request to see AI preview (score, cooldown, impact).",
          score: "SCORE",
          cooldown: "COOLDOWN",
          emergencyBalance: "Emergency Balance",
          afterBalance: "After Balance",
          impactMeter: "Impact meter",
          cooldownRemaining: "Cooldown remaining",
          canExecuteAfter: "You can execute after",
          execute: "Execute Withdrawal",
          executing: "Executing...",
          executeHint: "Execute button will be enabled after cooldown ends.",
          executeFailed: "Execute failed",
          requestFailed: "Request failed",
          executeNonJson:
            "Execute endpoint returned non-JSON (404/500). Check /api/withdrawals/execute.",
          requestNonJson:
            "Server returned non-JSON (check /api/withdrawals/request)",
          pending: "PENDING",
          safeZone: "Safe zone",
          caution: "Caution",
          highImpact: "High impact",
        };

  const [amount, setAmount] = useState<number>(200000);
  const [reasonCategory, setReasonCategory] = useState<string>("HEALTH");
  const [urgency, setUrgency] = useState<number>(3);
  const [reasonText, setReasonText] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [execLoading, setExecLoading] = useState(false);

  const [result, setResult] = useState<RequestResp | null>(null);
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState<number>(0);

  const urgencyMeta = useMemo(() => urgencyLabel(urgency), [urgency]);

  const cooldownUntilMs = useMemo(() => {
    const s = result?.request?.cooldownUntil;
    if (!s) return null;
    const t = new Date(s).getTime();
    return Number.isFinite(t) ? t : null;
  }, [result?.request?.cooldownUntil]);

  const canExecute = useMemo(() => {
    if (!result?.request?.id) return false;
    if (!cooldownUntilMs) return true;
    return Date.now() >= cooldownUntilMs;
  }, [result?.request?.id, cooldownUntilMs]);

  useEffect(() => {
    if (!cooldownUntilMs) {
      setCooldownRemainingMs(0);
      return;
    }
    const tick = () =>
      setCooldownRemainingMs(Math.max(0, cooldownUntilMs - Date.now()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntilMs]);

  const quickAmounts = useMemo(
    () => [50000, 100000, 200000, 500000, 1000000],
    [],
  );

  const previewRatio = result?.preview?.amountRatio ?? NaN;
  const ratioP = clamp(Math.round((previewRatio || 0) * 100), 0, 100);
  const tone = ratioTone(previewRatio);

  async function submitRequest() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/withdrawals/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          reasonCategory,
          urgency,
          reasonText: reasonText?.trim() ? reasonText.trim() : undefined,
        }),
      });

      const { json, rawText } = await readJsonSafe(res);

      if (!res.ok) {
        const msg =
          json?.error ?? (rawText ? text.requestNonJson : text.requestFailed);
        setResult({ ok: false, error: msg, details: json?.details });
        return;
      }

      setResult(json as RequestResp);
    } catch (e: any) {
      setResult({ ok: false, error: e?.message ?? "Unknown error" });
    } finally {
      setLoading(false);
    }
  }

  async function executeRequest() {
    const requestId = result?.request?.id;
    if (!requestId) return;

    setExecLoading(true);

    try {
      const res = await fetch("/api/withdrawals/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      const { json, rawText } = await readJsonSafe(res);

      if (!res.ok || !json?.ok) {
        const msg =
          json?.error ?? (rawText ? text.executeNonJson : text.executeFailed);
        setResult((prev) => ({ ...(prev ?? {}), ok: false, error: msg }));
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      setResult((prev) => ({
        ...(prev ?? {}),
        ok: false,
        error: e?.message ?? "Unknown error",
      }));
    } finally {
      setExecLoading(false);
    }
  }

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
              <Chip tone="default">GATE</Chip>
              <Chip tone="ai">AI</Chip>
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

        {/* Mini cockpit */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{text.requested}</span>
                <Chip tone="default">AMOUNT</Chip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatIDR(amount)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Quick picks below • step Rp 1.000
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{text.urgency}</span>
                <Chip tone="ai">{urgencyMeta.label.toUpperCase()}</Chip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{urgency}/5</div>
              <div className="text-xs text-muted-foreground mt-1">
                {urgencyMeta.hint}
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{text.impact}</span>
                <Chip tone={tone}>
                  {(Number.isFinite(previewRatio)
                    ? ratioText(previewRatio) === "Safe zone"
                      ? text.safeZone
                      : ratioText(previewRatio) === "Caution"
                        ? text.caution
                        : text.highImpact
                    : "—"
                  ).toUpperCase()}
                </Chip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {Number.isFinite(previewRatio) ? `${ratioP}%` : "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {text.basedPreview}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form + Preview */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Form */}
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>{text.request}</span>
                <Chip tone="default">STEP 1</Chip>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">{text.amount}</div>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1000}
                  value={Number.isFinite(amount) ? amount : 0}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="rounded-xl"
                />

                <div className="flex flex-wrap gap-2 pt-2">
                  {quickAmounts.map((a) => {
                    const active = amount === a;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAmount(a)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition hover:bg-muted/60",
                          active && "bg-primary/10 border-primary/30",
                        )}
                      >
                        {formatIDR(a)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">{text.reasonCategory}</div>
                <Select
                  value={reasonCategory}
                  onValueChange={setReasonCategory}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HEALTH">Health</SelectItem>
                    <SelectItem value="FAMILY">Family</SelectItem>
                    <SelectItem value="HOUSING">Housing</SelectItem>
                    <SelectItem value="EDUCATION">Education</SelectItem>
                    <SelectItem value="IMPULSIVE">Impulsive</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  {text.categoryTip}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Urgency</div>
                  <Chip tone="ai">{urgencyMeta.label}</Chip>
                </div>

                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={urgency}
                  onChange={(e) => setUrgency(Number(e.target.value))}
                  className="w-full accent-[hsl(var(--primary))]"
                />

                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>

                <div className="text-xs text-muted-foreground">
                  {urgencyMeta.hint}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">{text.reasonDetails}</div>
                <Textarea
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder={text.reasonPlaceholder}
                  className="rounded-xl min-h-27.5"
                />
                <div className="text-xs text-muted-foreground">
                  {text.reasonHint}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={submitRequest}
                  disabled={loading}
                  className="rounded-xl btn-glow"
                >
                  {loading ? text.scoring : text.submit}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => {
                    setResult(null);
                    setReasonText("");
                  }}
                >
                  {text.resetPreview}
                </Button>
              </div>

              {result?.error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <div className="font-semibold">{text.error}</div>
                  <div className="text-xs mt-1">{result.error}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>{text.aiPreview}</span>
                <Chip tone="ai">STEP 2</Chip>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {!result?.preview ? (
                <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                  {text.submitToPreview}
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone="ai">
                      {text.score} {result.preview.score}
                    </Chip>
                    <Chip tone="default">
                      {text.cooldown} {result.preview.cooldownHours}h
                    </Chip>
                    <Chip tone="default">
                      {result.request?.status ?? text.pending}
                    </Chip>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border bg-muted/15 p-3">
                      <div className="text-xs text-muted-foreground">
                        {text.emergencyBalance}
                      </div>
                      <div className="text-lg font-semibold mt-1">
                        {formatIDR(result.preview.emergencyBalance)}
                      </div>
                    </div>

                    <div className="rounded-xl border bg-muted/15 p-3">
                      <div className="text-xs text-muted-foreground">
                        {text.afterBalance}
                      </div>
                      <div className="text-lg font-semibold mt-1">
                        {formatIDR(result.preview.afterBalance)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {text.impactMeter}
                      </div>
                      <Chip tone={tone}>
                        {Number.isFinite(previewRatio)
                          ? ratioText(previewRatio) === "Safe zone"
                            ? text.safeZone
                            : ratioText(previewRatio) === "Caution"
                              ? text.caution
                              : text.highImpact
                          : "—"}
                      </Chip>
                    </div>

                    <div className="mt-3 h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-[width] duration-500",
                          tone === "safe" && "bg-primary",
                          tone === "default" && "bg-foreground/70",
                          tone === "danger" && "bg-destructive",
                        )}
                        style={{ width: `${ratioP}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span className="font-medium text-foreground">
                        {ratioP}%
                      </span>
                      <span>100%</span>
                    </div>
                  </div>

                  {cooldownUntilMs && !canExecute && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
                      <div className="text-muted-foreground">
                        {text.cooldownRemaining}
                      </div>
                      <div className="mt-1 font-semibold text-destructive">
                        {msToHMS(cooldownRemainingMs)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {text.canExecuteAfter}:{" "}
                        {new Date(cooldownUntilMs).toLocaleString(
                          language === "id" ? "id-ID" : "en-US",
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={executeRequest}
                      disabled={!canExecute || execLoading}
                      className="rounded-xl btn-glow"
                    >
                      {execLoading ? text.executing : text.execute}
                    </Button>

                    <Button
                      variant="secondary"
                      className="rounded-xl"
                      onClick={() => router.push("/dashboard")}
                    >
                      {text.back}
                    </Button>
                  </div>

                  {!canExecute && (
                    <div className="text-xs text-muted-foreground">
                      {text.executeHint}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
