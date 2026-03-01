/** @format */
import "dotenv/config";
import { PrismaClient, AccountType } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString)
  throw new Error("Missing DIRECT_URL / DATABASE_URL in .env");

const pool = new Pool({
  connectionString,
  // Supabase biasanya butuh SSL. Kalau error SSL, kita set rejectUnauthorized false.
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function daysFromNow(n: number) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

async function main() {
  const email = "demo@aipiggybank.local";

  // Create / get demo user
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Demo User" },
  });

  // Ensure 3 accounts exist
  const types: AccountType[] = ["MAIN", "VAULT", "EMERGENCY"];
  for (const type of types) {
    await prisma.account.upsert({
      where: { userId_type: { userId: user.id, type } },
      update: {},
      create: { userId: user.id, type },
    });
  }

  const mainAcc = await prisma.account.findFirstOrThrow({
    where: { userId: user.id, type: "MAIN" },
  });
  const vaultAcc = await prisma.account.findFirstOrThrow({
    where: { userId: user.id, type: "VAULT" },
  });
  const emerAcc = await prisma.account.findFirstOrThrow({
    where: { userId: user.id, type: "EMERGENCY" },
  });

  // Create a goal
  await prisma.goal.create({
    data: {
      userId: user.id,
      title: "Laptop 12jt",
      targetAmount: 12000000,
      deadline: daysFromNow(180),
      lockUntil: daysFromNow(120),
    },
  });

  // Clear old demo transactions (optional, biar seed bisa di-run ulang)
  await prisma.transaction.deleteMany({ where: { userId: user.id } });

  // Transactions demo (amount selalu positif; sign ditentukan oleh type nanti saat hitung saldo)
  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        accountId: mainAcc.id,
        type: "INCOME",
        amount: 1500000,
        category: "Allowance",
        note: "Uang saku",
      },
      {
        userId: user.id,
        accountId: mainAcc.id,
        type: "EXPENSE",
        amount: 220000,
        category: "Food",
        note: "Jajan",
      },
      {
        userId: user.id,
        accountId: mainAcc.id,
        type: "EXPENSE",
        amount: 120000,
        category: "Transport",
        note: "Ojek",
      },

      {
        userId: user.id,
        accountId: vaultAcc.id,
        type: "TRANSFER",
        amount: 300000,
        category: "Deposit",
        note: "Setor goal",
      },
      {
        userId: user.id,
        accountId: emerAcc.id,
        type: "TRANSFER",
        amount: 200000,
        category: "Deposit",
        note: "Dana darurat",
      },
    ],
  });

  console.log("Seed done:", { userId: user.id, email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
