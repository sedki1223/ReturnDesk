# ReturnDesk

**Returns and After-Sales Management Platform**

ReturnDesk is a full-stack application for managing e-commerce returns, product inspections, inventory disposition, and refunds.

The goal is to provide a centralized workflow for handling returned products, tracking inventory changes, and managing refund operations.

## Features

### Return Management
- View and manage customer return requests.
- Track return statuses throughout the workflow.
- Review customer and product information.
- Open individual return details.

### Inspection Workflow
- Mark approved returns as received.
- Start the inspection process.
- Record product condition and inspection notes.
- Assign an inventory disposition to each returned item.
- Complete inspections through a validated workflow.

### Inventory Management
- Track inventory by disposition:
  - Sellable
  - Open Box
  - Damaged
  - Discarded
- Initialize opening stock.
- Record inventory movements.
- Track stock changes resulting from inspected returns.
- Review inventory movement history.

### Refund Management
- Track refunds and their amounts.
- Process refunds through controlled status transitions.
- Mark refunds as completed or failed.
- Automatically update the associated return when a refund is completed.
- Record refund processing timestamps.

### Dashboard
- Overview of operational metrics.
- Return and refund summaries.
- Inventory visibility.
- Quick navigation between application features.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL 18 |
| ORM | Prisma 7 |
| Validation | Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Database Adapter | Prisma PostgreSQL Adapter |
| Infrastructure | Docker Compose |

## Architecture Overview

ReturnDesk follows a database-backed application architecture.

- **Next.js** handles the application interface and server-side operations.
- **Prisma** provides database access and schema management.
- **PostgreSQL** stores customers, products, returns, inspections, refunds, and inventory records.
- **Server Actions** handle validated application operations.
- **Database transactions** protect multi-step operations such as inspection completion and refund processing.

## Main Workflows

### 1. Return Inspection

1. An approved return is received.
2. The return enters inspection.
3. Each returned item receives a condition assessment.
4. An inventory disposition is assigned.
5. Completing the inspection records inventory movements.
6. A pending refund is created when the return uses a refund-based resolution.

### 2. Refund Processing

1. A pending refund enters processing.
2. The refund can be completed or marked as failed.
3. Completing a refund records its processing timestamp.
4. The associated return transitions to `REFUNDED`.

### 3. Inventory Tracking

Inventory is tracked using disposition-specific quantities and an inventory movement ledger.

Opening stock and processed returns are recorded as movements, providing a history of inventory changes.

## Getting Started

### Requirements

- Node.js
- npm
- Docker Desktop
- PostgreSQL through Docker Compose

### 1. Clone the repository

```bash
git clone <repository-url>
cd returndesk
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://returndesk:returndesk_dev@localhost:5433/returndesk"
```

### 4. Start PostgreSQL

```bash
docker compose up -d
```

PostgreSQL is exposed on port `5433` to avoid conflicts with a local PostgreSQL installation using port `5432`.

### 5. Generate the Prisma client

```bash
npx prisma generate
```

### 6. Apply database migrations

```bash
npx prisma migrate dev
```

### 7. Initialize demo data

```bash
npx prisma db seed
```

**Warning:** The demo seed resets existing application demo data before recreating it. Do not run it against a database containing data you need to preserve.

### 8. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Development Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build production application |
| `npx tsc --noEmit` | Check TypeScript types |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma migrate dev` | Apply development migrations |
| `npx prisma db seed` | Reset and initialize demo data |

## Project Structure

```text
returndesk/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── inventory/
│   │   ├── refunds/
│   │   ├── returns/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── generated/
│   └── lib/
├── docker-compose.yml
├── prisma.config.ts
├── package.json
└── README.md
```

## Current Scope

ReturnDesk is a functional first release focused on the core returns, inspection, inventory, and refund workflows.

Authentication, multi-tenant isolation, external payment-provider integrations, shipping integrations, and production deployment hardening are not yet part of this release.

## Project Objective

Demonstrate a practical after-sales management system with interconnected business workflows, persistent data, inventory accounting, and transactional operations.

**ReturnDesk — From return request to final resolution.**