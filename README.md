<!-- @format -->

# AI Piggybank — Web App

> A modern personal finance cockpit with AI-assisted emergency withdrawal flow.

AI Piggybank is a demo-first finance application built with Next.js + Prisma + PostgreSQL.  
It helps users track money across three accounts (`MAIN`, `VAULT`, `EMERGENCY`), manage transactions, monitor savings progress, and request emergency withdrawals with a reason-gate + cooldown mechanism.

---

## ✨ Core Features

- **Multi-account balance model**: `MAIN`, `VAULT`, `EMERGENCY`
- **Transaction workflow**:
  - Income
  - Expense
  - Deposit to Vault (MAIN → VAULT)
  - Deposit to Emergency (MAIN → EMERGENCY)
- **Live dashboard**:
  - Net worth snapshot
  - Goal progress and ETA estimation
  - Recent transaction feed
- **Analytics**:
  - Daily cashflow series (income vs expense)
  - Dynamic range query (`7–60` days)
- **Emergency withdrawal flow**:
  - Request endpoint with reason scoring
  - Cooldown enforcement (based on score/impact)
  - Execute endpoint after cooldown ends
- **UI/UX extras**:
  - Dark/light theme
  - EN/ID language preference
  - Responsive app header/navigation

---

## 🧱 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling/UI**: Tailwind CSS v4, shadcn-style components, Recharts
- **Backend/API**: Next.js Route Handlers
- **Database**: PostgreSQL
- **ORM**: Prisma 7 (`@prisma/client`, `@prisma/adapter-pg`)

---

## 📂 Project Structure

```text
web/
├─ prisma/
│  ├─ schema.prisma
│  ├─ seed.ts
│  └─ migrations/
├─ src/
│  ├─ app/
│  │  ├─ dashboard/
│  │  ├─ transaction/
│  │  ├─ withdraw-emergency/
│  │  └─ api/
│  │     ├─ dashboard/
│  │     ├─ transactions/
│  │     ├─ analytics/cashflow/
│  │     └─ withdrawals/{request,execute}/
│  ├─ components/ui/
│  └─ lib/
├─ package.json
└─ prisma.config.ts
```

---

## ⚙️ Prerequisites

- Node.js **20+**
- npm **10+**
- PostgreSQL instance (local or cloud)

---

## 🚀 Quick Start

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create/update `.env` in the `web/` directory:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DB"
```

> `DIRECT_URL` is preferred for Prisma migrations.

### 3) Run migrations

```bash
npx prisma migrate deploy
```

For local development when evolving schema:

```bash
npx prisma migrate dev
```

### 4) Seed demo data

```bash
npx prisma db seed
```

This creates a demo user (`demo@aipiggybank.local`), base accounts, goal, and sample transactions.

### 5) Start development server

```bash
npm run dev
```

Open:

- `http://localhost:3000/dashboard` (main app dashboard)
- `http://localhost:3000/transaction`
- `http://localhost:3000/withdraw-emergency`

---

## 🔌 API Endpoints

### `GET /api/dashboard`

Returns user snapshot, balances, goal, monthly saving estimate, and recent transactions.

### `POST /api/transactions`

Creates transaction entries for one of the following actions:

- `INCOME`
- `EXPENSE`
- `DEPOSIT_VAULT`
- `DEPOSIT_EMERGENCY`

Example payload:

```json
{
  "action": "DEPOSIT_VAULT",
  "amount": 200000,
  "category": "Saving",
  "note": "Weekly deposit"
}
```

### `GET /api/analytics/cashflow?days=14`

Returns daily buckets of `income` and `expense` for charting.

### `POST /api/withdrawals/request`

Creates emergency withdrawal request and returns AI preview score + cooldown.

Example payload:

```json
{
  "amount": 300000,
  "reasonCategory": "HEALTH",
  "reasonText": "Doctor and medicine",
  "urgency": 4
}
```

### `POST /api/withdrawals/execute`

Executes a pending request after cooldown period ends.

Example payload:

```json
{
  "requestId": "cuid_or_request_id"
}
```

---

## 🧪 Available Scripts

```bash
npm run dev    # Start local dev server
npm run build  # Production build
npm run start  # Run production server
npm run lint   # Run ESLint
```

---

## 🛠 Troubleshooting

- **`Demo user not found`**
  - Run `npx prisma db seed`.

- **`Accounts missing. Run seed.`**
  - Seed has not been applied to current database.

- **Migration connection issues**
  - Verify `DIRECT_URL` points to direct PostgreSQL port.

- **SSL connection errors (managed DB)**
  - Check provider SSL requirements and connection string options.

---

## 📌 Current Scope

This repository currently runs in **demo mode**:

- Single demo identity (`demo@aipiggybank.local`)
- No production authentication/authorization yet
- Profile and settings pages are placeholder pages for future expansion

---

## 🔒 Security Notes

- Never commit real database credentials.
- Use environment-specific secrets in deployment platforms.
- Rotate credentials immediately if they were ever exposed.

---

## 🗺 Roadmap Ideas

- User authentication and multi-tenant support
- Budgeting and category rules
- Stronger audit trail and approval workflow
- ML model integration for smarter withdrawal scoring
- Test suite for API and transaction integrity

---

## 📄 License

Private/internal project unless specified otherwise by repository owner.
