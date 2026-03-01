/** @format */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

const BodySchema = z.object({
  action: z.enum(["INCOME", "EXPENSE", "DEPOSIT_VAULT", "DEPOSIT_EMERGENCY"]),
  amount: z.number().int().positive().max(100_000_000),
  category: z.string().min(1).max(50).optional(),
  note: z.string().max(120).optional(),
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

    const { action, amount, category, note } = parsed.data;

    const [mainAccRaw, vaultAcc, emerAcc] = await Promise.all([
      prisma.account.findFirst({ where: { userId: user.id, type: "MAIN" } }),
      prisma.account.findFirst({ where: { userId: user.id, type: "VAULT" } }),
      prisma.account.findFirst({
        where: { userId: user.id, type: "EMERGENCY" },
      }),
    ]);

    if (!mainAccRaw || !vaultAcc || !emerAcc) {
      return NextResponse.json(
        { ok: false, error: "Accounts missing. Run seed." },
        { status: 500 },
      );
    }

    const mainAcc = mainAccRaw;

    async function getMainBalance() {
      const tx = await prisma.transaction.findMany({
        where: { accountId: mainAcc.id },
      });
      let bal = 0;
      for (const t of tx) {
        if (t.type === "EXPENSE" || t.type === "WITHDRAW") bal -= t.amount;
        else bal += t.amount;
      }
      return bal;
    }

    if (
      action === "EXPENSE" ||
      action === "DEPOSIT_VAULT" ||
      action === "DEPOSIT_EMERGENCY"
    ) {
      const mainBal = await getMainBalance();
      if (amount > mainBal) {
        return NextResponse.json(
          {
            ok: false,
            error: "Insufficient MAIN balance",
            mainBalance: mainBal,
          },
          { status: 400 },
        );
      }
    }

    const created = await prisma.$transaction(async (db) => {
      if (action === "INCOME") {
        const tx1 = await db.transaction.create({
          data: {
            userId: user.id,
            accountId: mainAcc.id,
            type: "INCOME",
            amount,
            category: category ?? "Income",
            note: note ?? null,
          },
        });
        return { kind: "single", tx: tx1 };
      }

      if (action === "EXPENSE") {
        const tx1 = await db.transaction.create({
          data: {
            userId: user.id,
            accountId: mainAcc.id,
            type: "EXPENSE",
            amount,
            category: category ?? "Expense",
            note: note ?? null,
          },
        });
        return { kind: "single", tx: tx1 };
      }

      if (action === "DEPOSIT_VAULT") {
        const outTx = await db.transaction.create({
          data: {
            userId: user.id,
            accountId: mainAcc.id,
            type: "EXPENSE",
            amount,
            category: "DepositVault",
            note: note ?? "Deposit to Vault",
          },
        });

        const inTx = await db.transaction.create({
          data: {
            userId: user.id,
            accountId: vaultAcc.id,
            type: "TRANSFER",
            amount,
            category: "Deposit",
            note: note ?? "From MAIN",
          },
        });

        return { kind: "double", outTx, inTx };
      }

      const outTx = await db.transaction.create({
        data: {
          userId: user.id,
          accountId: mainAcc.id,
          type: "EXPENSE",
          amount,
          category: "DepositEmergency",
          note: note ?? "Deposit to Emergency",
        },
      });

      const inTx = await db.transaction.create({
        data: {
          userId: user.id,
          accountId: emerAcc.id,
          type: "TRANSFER",
          amount,
          category: "Deposit",
          note: note ?? "From MAIN",
        },
      });

      return { kind: "double", outTx, inTx };
    });

    return NextResponse.json({ ok: true, created });
  } catch (error) {
    return handleApiError(error, "Failed to create transaction");
  }
}
