/** @format */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toKey(d: Date) {
  // YYYY-MM-DD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(req: Request) {
  try {
    const demoEmail = "demo@aipiggybank.local";
    const user = await prisma.user.findUnique({ where: { email: demoEmail } });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Demo user not found" },
        { status: 404 },
      );
    }

    const url = new URL(req.url);
    const days = Number(url.searchParams.get("days") ?? "14");
    const nDays = Number.isFinite(days) ? Math.min(Math.max(days, 7), 60) : 14;

    const end = startOfDay(new Date());
    const start = new Date(end);
    start.setDate(end.getDate() - (nDays - 1));

    const tx = await prisma.transaction.findMany({
      where: { userId: user.id, createdAt: { gte: start } },
      orderBy: { createdAt: "asc" },
    });

    const buckets = new Map<
      string,
      { date: string; income: number; expense: number }
    >();
    for (let i = 0; i < nDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = toKey(d);
      buckets.set(key, { date: key, income: 0, expense: 0 });
    }

    for (const t of tx) {
      const key = toKey(startOfDay(new Date(t.createdAt)));
      const b = buckets.get(key);
      if (!b) continue;

      if (t.type === "INCOME") b.income += t.amount;
      if (t.type === "EXPENSE" || t.type === "WITHDRAW") b.expense += t.amount;
    }

    const series = Array.from(buckets.values());
    return NextResponse.json({ ok: true, days: nDays, series });
  } catch (error) {
    return handleApiError(error, "Failed to load analytics");
  }
}
