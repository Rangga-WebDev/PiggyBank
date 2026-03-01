/** @format */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

const BodySchema = z.object({
  amount: z.number().int().positive().max(50_000_000),
  reasonCategory: z.string().min(2).max(30),
  reasonText: z.string().max(500).optional(),
  urgency: z.number().int().min(1).max(5),
});

export async function POST(req: Request) {
  try {
    const demoEmail = "demo@aipiggybank.local";
    const user = await prisma.user.findUnique({ where: { email: demoEmail } });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Demo user not found" },
        { status: 404 },
      );
    }

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { amount, reasonCategory, reasonText, urgency } = parsed.data;

    // Get emergency account
    const emergencyAcc = await prisma.account.findFirst({
      where: { userId: user.id, type: "EMERGENCY" },
    });

    if (!emergencyAcc) {
      return NextResponse.json(
        { ok: false, error: "Emergency account missing" },
        { status: 404 },
      );
    }

    // Compute current emergency balance from transactions
    const tx = await prisma.transaction.findMany({
      where: { accountId: emergencyAcc.id },
      select: { type: true, amount: true },
    });

    let emergencyBalance = 0;
    for (const t of tx) {
      emergencyBalance +=
        t.type === "EXPENSE" || t.type === "WITHDRAW" ? -t.amount : t.amount;
    }

    if (amount > emergencyBalance) {
      return NextResponse.json(
        {
          ok: false,
          error: "Insufficient emergency balance",
          emergencyBalance,
        },
        { status: 400 },
      );
    }

    // ---- Reason gate RULES (MVP) ----
    const amountRatio = emergencyBalance > 0 ? amount / emergencyBalance : 1;

    const highUrgencyCats = new Set([
      "HEALTH",
      "EDUCATION",
      "FAMILY",
      "HOUSING",
    ]);
    const isHighUrgency = highUrgencyCats.has(reasonCategory.toUpperCase());

    let score = 50;
    if (isHighUrgency) score += 25;
    if (urgency >= 4) score += 10;
    if (amountRatio >= 0.6) score -= 25;
    if (amountRatio >= 0.3) score -= 10;

    score = Math.max(0, Math.min(100, score));

    // Cooldown decision
    const now = new Date();
    let cooldownHours = 0;
    if (score < 40) cooldownHours = 24;
    else if (score < 65) cooldownHours = 1;

    const cooldownUntil =
      cooldownHours > 0
        ? new Date(now.getTime() + cooldownHours * 3600 * 1000)
        : null;

    const reqRow = await prisma.withdrawalRequest.create({
      data: {
        userId: user.id,
        accountType: "EMERGENCY",
        amount,
        reasonCategory: reasonCategory.toUpperCase(),
        reasonText: reasonText ?? null,
        urgency,
        aiScore: score,
        cooldownUntil,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      ok: true,
      request: reqRow,
      preview: {
        emergencyBalance,
        afterBalance: emergencyBalance - amount,
        amountRatio,
        cooldownHours,
        score,
      },
    });
  } catch (error) {
    return handleApiError(error, "Failed to create withdrawal request");
  }
}
