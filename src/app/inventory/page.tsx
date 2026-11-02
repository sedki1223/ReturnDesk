
import Link from "next/link";
import {
  Boxes,
  Package,
  ArrowDownToLine,
  AlertTriangle,
  Trash2,
  Search,
  ArrowUpRight,
  Clock3,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export const instant = false;

type PageProps = {
  searchParams: Promise<{
    q?: string;
    disposition?: string;
  }>;
};

const dispositionOptions = [
  "RESTOCK",
  "OPEN_BOX",
  "DAMAGED",
  "DISCARD",
] as const;

const dispositionStyles: Record<string, string> = {
  RESTOCK: "bg-emerald-50 text-emerald-700",
  OPEN_BOX: "bg-blue-50 text-blue-700",
  DAMAGED: "bg-orange-50 text-orange-700",
  DISCARD: "bg-rose-50 text-rose-700",
};

function label(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function date(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof Package;
}) {
  return (
    <section className="rounded-xl border border-[#e9ebef] bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[#89919e]">{title}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight">
            {value.toLocaleString("en-US")}
          </p>
          <p className="mt-1 text-[11px] text-[#a0a7b2]">{description}</p>
        </div>
        <div className="rounded-lg bg-[#f2f5fa] p-2.5">
          <Icon size={17} className="text-[#64748b]" />
        </div>
      </div>
    </section>
  );
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const query = filters.q?.trim() ?? "";

  const selectedDisposition = dispositionOptions.includes(
    filters.disposition as (typeof dispositionOptions)[number],
  )
    ? filters.disposition!
    : "";

  const movementWhere = {
    ...(selectedDisposition
      ? {
          disposition:
            selectedDisposition as (typeof dispositionOptions)[number],
        }
      : {}),
    ...(query
      ? {
          product: {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { sku: { contains: query, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };

  const [products, movements, movementCount, allInventory] =
    await Promise.all([
      prisma.product.findMany({
        where: query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { sku: { contains: query, mode: "insensitive" } },
              ],
            }
          : undefined,
        include: {
          inventory: true,
        },
        orderBy: { name: "asc" },
      }),

      prisma.inventoryMovement.findMany({
        where: movementWhere,
        include: {
          product: true,
          returnItem: {
            include: {
              returnRequest: {
                select: {
                  id: true,
                  reference: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),

      prisma.inventoryMovement.count({
        where: movementWhere,
      }),

      prisma.productInventory.findMany({
        select: {
          sellableQuantity: true,
          openBoxQuantity: true,
          damagedQuantity: true,
          discardedQuantity: true,
        },
      }),
    ]);

  const totals = allInventory.reduce(
    (result, inventory) => ({
      sellable: result.sellable + inventory.sellableQuantity,
      openBox: result.openBox + inventory.openBoxQuantity,
      damaged: result.damaged + inventory.damagedQuantity,
      discarded: result.discarded + inventory.discardedQuantity,
    }),
    {
      sellable: 0,
      openBox: 0,
      damaged: 0,
      discarded: 0,
    },
  );

  const initializedProducts = products.filter(
    (product) => product.inventory !== null,
  ).length;

  const uninitializedProducts = products.length - initializedProducts;

  const totalUnits =
    totals.sellable +
    totals.openBox +
    totals.damaged +
    totals.discarded;

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#202631]">
      <header className="border-b border-[#e9ebef] bg-white px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#929aa6]">
                OPERATIONS / INVENTORY
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Inventory
              </h1>
              <p className="mt-1 text-sm text-[#89919e]">
                Stock levels, product condition, and inventory movement history.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-[#edf3ff] px-3 py-2 text-xs font-semibold text-[#3478f6]">
              <Boxes size={15} />
              Live inventory
            </div>
          </div>

          <nav className="mt-5 flex flex-wrap gap-4 text-xs font-medium text-[#89919e]">
            <Link href="/" className="hover:text-[#3478f6]">
              Dashboard
            </Link>
            <Link href="/returns" className="hover:text-[#3478f6]">
              Returns
            </Link>
            <Link href="/refunds" className="hover:text-[#3478f6]">
              Refunds
            </Link>
            <span className="text-[#3478f6]">Inventory</span>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] space-y-6 p-5 sm:p-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Sellable stock"
            value={totals.sellable}
            description="Available for resale"
            icon={Package}
          />
          <StatCard
            title="Open-box stock"
            value={totals.openBox}
            description="Returned, opened products"
            icon={Boxes}
          />
          <StatCard
            title="Damaged stock"
            value={totals.damaged}
            description="Not available for normal resale"
            icon={AlertTriangle}
          />
          <StatCard
            title="Discarded units"
            value={totals.discarded}
            description="Marked for disposal"
            icon={Trash2}
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e9ebef] bg-white p-5">
            <p className="text-xs text-[#89919e]">Tracked inventory units</p>
            <p className="mt-2 text-xl font-semibold">
              {totalUnits.toLocaleString("en-US")}
            </p>
          </div>

          <div className="rounded-xl border border-[#e9ebef] bg-white p-5">
            <p className="text-xs text-[#89919e]">Initialized products</p>
            <p className="mt-2 text-xl font-semibold">
              {initializedProducts.toLocaleString("en-US")}
            </p>
          </div>

          <div className="rounded-xl border border-[#e9ebef] bg-white p-5">
            <p className="text-xs text-[#89919e]">Uninitialized products</p>
            <p className="mt-2 text-xl font-semibold">
              {uninitializedProducts.toLocaleString("en-US")}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#e9ebef] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f3] p-5">
            <div>
              <h2 className="text-sm font-semibold">Product stock</h2>
              <p className="mt-1 text-xs text-[#89919e]">
                Inventory quantities by product and condition.
              </p>
            </div>
            <span className="text-xs text-[#89919e]">
              {products.length} products
            </span>
          </div>

          <form
            action="/inventory"
            method="GET"
            className="flex flex-wrap gap-2 border-b border-[#edf0f3] p-4"
          >
            <div className="relative min-w-[220px] flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a7b2]"
              />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search product or SKU..."
                className="h-10 w-full rounded-lg border border-[#e2e6ec] bg-white pl-9 pr-3 text-xs outline-none focus:border-[#3478f6]"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-[#3478f6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2468e8]"
            >
              Search
            </button>

            {query && (
              <Link
                href="/inventory"
                className="rounded-lg border border-[#e2e6ec] px-4 py-2 text-xs font-semibold text-[#64748b] hover:bg-[#f7f8fa]"
              >
                Clear
              </Link>
            )}
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[#fafbfc] text-[10px] font-semibold uppercase tracking-wide text-[#929aa6]">
                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-4 py-4">Sellable</th>
                  <th className="px-4 py-4">Open box</th>
                  <th className="px-4 py-4">Damaged</th>
                  <th className="px-4 py-4">Discarded</th>
                  <th className="px-5 py-4 text-right">Total tracked</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf0f3]">
                {products.map((product) => {
                  const inventory = product.inventory;

                  const productTotal = inventory
                    ? inventory.sellableQuantity +
                      inventory.openBoxQuantity +
                      inventory.damagedQuantity +
                      inventory.discardedQuantity
                    : null;

                  return (
                    <tr key={product.id} className="hover:bg-[#fafbfc]">
                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold">
                          {product.name}
                        </p>
                        <p className="mt-1 text-[10px] text-[#929aa6]">
                          SKU: {product.sku}
                        </p>
                      </td>

                      {inventory ? (
                        <>
                          <td className="px-4 py-4 text-xs font-medium text-emerald-700">
                            {inventory.sellableQuantity}
                          </td>
                          <td className="px-4 py-4 text-xs font-medium text-blue-700">
                            {inventory.openBoxQuantity}
                          </td>
                          <td className="px-4 py-4 text-xs font-medium text-orange-700">
                            {inventory.damagedQuantity}
                          </td>
                          <td className="px-4 py-4 text-xs font-medium text-rose-700">
                            {inventory.discardedQuantity}
                          </td>
                          <td className="px-5 py-4 text-right text-xs font-semibold">
                            {productTotal}
                          </td>
                        </>
                      ) : (
                        <td
                          colSpan={5}
                          className="px-4 py-4 text-right text-xs font-medium text-[#a0a7b2]"
                        >
                          Not initialized
                        </td>
                      )}
                    </tr>
                  );
                })}

                {products.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-xs text-[#89919e]"
                    >
                      No products match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#e9ebef] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f3] p-5">
            <div>
              <h2 className="text-sm font-semibold">
                Inventory movement history
              </h2>
              <p className="mt-1 text-xs text-[#89919e]">
                Stock changes from opening balances, return inspections, and adjustments.
              </p>
            </div>

            <span className="flex items-center gap-1.5 text-xs text-[#89919e]">
              <Clock3 size={14} />
              {movementCount} matching movements
            </span>
          </div>

          <form
            action="/inventory"
            method="GET"
            className="flex flex-wrap items-center gap-2 border-b border-[#edf0f3] p-4"
          >
            <input type="hidden" name="q" value={query} />

            <select
              name="disposition"
              defaultValue={selectedDisposition}
              className="h-10 min-w-[190px] rounded-lg border border-[#e2e6ec] bg-white px-3 text-xs outline-none focus:border-[#3478f6]"
            >
              <option value="">All dispositions</option>
              {dispositionOptions.map((disposition) => (
                <option key={disposition} value={disposition}>
                  {label(disposition)}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-lg border border-[#e2e6ec] px-4 py-2.5 text-xs font-semibold text-[#566171] hover:bg-[#f7f8fa]"
            >
              Filter movements
            </button>

            {(selectedDisposition || query) && (
              <Link
                href={query ? `/inventory?q=${encodeURIComponent(query)}` : "/inventory"}
                className="text-xs font-medium text-[#3478f6] hover:underline"
              >
                Clear disposition
              </Link>
            )}
          </form>

          <div className="divide-y divide-[#edf0f3]">
            {movements.map((movement) => (
              <div
                key={movement.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div className="min-w-[200px] flex-1">
                  <p className="text-xs font-semibold">
                    {movement.product.name}
                  </p>

                  <p className="mt-1 text-[11px] text-[#89919e]">
                    SKU: {movement.product.sku}
                  </p>

                  <div className="mt-2">
                    {movement.returnItem ? (
                      <Link
                        href={`/returns/${movement.returnItem.returnRequest.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#3478f6] hover:underline"
                      >
                        Return {movement.returnItem.returnRequest.reference}
                        <ArrowUpRight size={12} />
                      </Link>
                    ) : (
                      <span className="text-[11px] font-medium text-[#64748b]">
                        {label(movement.type)}
                      </span>
                    )}
                  </div>

                  {movement.note && (
                    <p className="mt-1 text-[10px] text-[#a0a7b2]">
                      {movement.note}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${
                      dispositionStyles[movement.disposition]
                    }`}
                  >
                    {label(movement.disposition)}
                  </span>

                  <div className="min-w-[70px] text-right">
                    <p className="text-sm font-semibold">
                      +{movement.quantity}
                    </p>
                    <p className="mt-1 text-[10px] text-[#89919e]">
                      units
                    </p>
                  </div>
                </div>

                <p className="w-full text-[10px] text-[#a0a7b2] sm:w-auto sm:text-right">
                  {date(movement.createdAt)}
                </p>
              </div>
            ))}

            {movements.length === 0 && (
              <div className="px-5 py-12 text-center">
                <ArrowDownToLine
                  size={22}
                  className="mx-auto text-[#c0c6d0]"
                />
                <p className="mt-3 text-xs font-medium text-[#566171]">
                  No inventory movements found.
                </p>
                <p className="mt-1 text-[11px] text-[#89919e]">
                  Try changing your filters or check back after inventory activity.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
