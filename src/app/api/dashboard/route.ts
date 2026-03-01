/** @format */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signedAmount } from "@/lib/ledger";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const demoEmail = "demo@aipiggybank.local";

    const user = await prisma.user.findUnique({ where: { email: demoEmail } });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Demo user NF" },
        { status: 404 },
      );
    }

    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    const tx = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const goal = await prisma.goal.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const balanceByAccountId = new Map<string, number>();
    for (const a of accounts) balanceByAccountId.set(a.id, 0);

    for (const t of tx) {
      const prev = balanceByAccountId.get(t.accountId) ?? 0;
      balanceByAccountId.set(
        t.accountId,
        prev + signedAmount(t.type, t.amount),
      );
    }

    const balances = accounts.reduce(
      (acc, a) => {
        acc[a.type] = balanceByAccountId.get(a.id) ?? 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mainAccount = accounts.find((a) => a.type === "MAIN");
    const mainAccountId = mainAccount?.id;

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recent30Main = tx.filter((t) => {
      if (!mainAccountId) return false;
      return (
        t.accountId === mainAccountId && new Date(t.createdAt) >= thirtyDaysAgo
      );
    });

    let net30 = 0;
    for (const t of recent30Main) {
      net30 += signedAmount(t.type, t.amount);
    }

    const monthlySaving = Math.max(0, net30);

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
      balances,
      goal,
      monthlySaving,
      recentTransactions: tx.slice(0, 10),
    });
  } catch (error) {
    return handleApiError(error, "Failed to load dashboard");
  }
}
