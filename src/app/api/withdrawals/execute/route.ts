/** @format */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

const BodySchema = z.object({
  requestId: z.string().min(1),
});

function signedAmount(
  type: "INCOME" | "EXPENSE" | "TRANSFER" | "WITHDRAW",
  amount: number,
) {
  if (type === "EXPENSE" || type === "WITHDRAW") return -amount;
  return amount;
}

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

    const { requestId } = parsed.data;

    const request = await prisma.withdrawalRequest.findFirst({
      where: { id: requestId, userId: user.id, accountType: "EMERGENCY" },
    });

    if (!request) {
      return NextResponse.json(
        { ok: false, error: "Withdrawal request not found" },
        { status: 404 },
      );
    }

    if (request.status !== "PENDING") {
      return NextResponse.json(
        {
          ok: false,
          error: `Request already ${request.status.toLowerCase()}`,
          status: request.status,
        },
        { status: 400 },
      );
    }

    const now = new Date();
    if (request.cooldownUntil && now < request.cooldownUntil) {
      return NextResponse.json(
        {
          ok: false,
          error: "Cooldown still active",
          cooldownUntil: request.cooldownUntil,
        },
        { status: 429 },
      );
    }

    const emergencyAcc = await prisma.account.findFirst({
      where: { userId: user.id, type: "EMERGENCY" },
    });

    if (!emergencyAcc) {
      return NextResponse.json(
        { ok: false, error: "Emergency account missing" },
        { status: 404 },
      );
    }

    const tx = await prisma.transaction.findMany({
      where: { accountId: emergencyAcc.id },
      select: { type: true, amount: true },
    });

    const emergencyBalance = tx.reduce(
      (acc, row) => acc + signedAmount(row.type, row.amount),
      0,
    );

    if (request.amount > emergencyBalance) {
      return NextResponse.json(
        {
          ok: false,
          error: "Insufficient emergency balance",
          emergencyBalance,
        },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (db) => {
      const txRow = await db.transaction.create({
        data: {
          userId: user.id,
          accountId: emergencyAcc.id,
          type: "WITHDRAW",
          amount: request.amount,
          category: "EmergencyWithdraw",
          note: request.reasonText ?? "Emergency withdrawal",
        },
      });

      const updated = await db.withdrawalRequest.update({
        where: { id: request.id },
        data: {
          status: "APPROVED",
          decidedAt: now,
        },
      });

      return { txRow, updated };
    });

    return NextResponse.json({
      ok: true,
      txRow: result.txRow,
      updated: result.updated,
      emergencyBalance,
      afterBalance: emergencyBalance - request.amount,
    });
  } catch (error) {
    return handleApiError(error, "Failed to execute withdrawal");
  }
}
