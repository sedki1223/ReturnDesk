
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Package,
  UserRound,
  ClipboardCheck,
  CreditCard,
  CalendarDays,
  Boxes,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  markReturnReceived,
  startReturnInspection,
  saveInspection,
  completeInspection,
} from "./actions";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

function label(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function date(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

const conditionOptions = [
  "NEW",
  "OPENED",
  "DAMAGED",
  "DEFECTIVE",
] as const;

const dispositionOptions = [
  "RESTOCK",
  "OPEN_BOX",
  "DAMAGED",
  "DISCARD",
] as const;

const conditionStyles: Record<string, string> = {
  UNINSPECTED: "bg-slate-100 text-slate-600",
  NEW: "bg-emerald-50 text-emerald-700",
  OPENED: "bg-blue-50 text-blue-700",
  DAMAGED: "bg-orange-50 text-orange-700",
  DEFECTIVE: "bg-rose-50 text-rose-700",
};

const dispositionStyles: Record<string, string> = {
  RESTOCK: "bg-emerald-50 text-emerald-700",
  OPEN_BOX: "bg-blue-50 text-blue-700",
  DAMAGED: "bg-orange-50 text-orange-700",
  DISCARD: "bg-rose-50 text-rose-700",
};

export default async function ReturnDetailPage({ params }: PageProps) {
  const { id } = await params;

  const request = await prisma.returnRequest.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
          inventoryMovement: true,
        },
      },
      refund: true,
      store: true,
    },
  });

  if (!request) notFound();

  const total = request.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  const canReceive = request.status === "APPROVED";
  const canInspect = request.status === "RECEIVED";
  const isInspecting = request.status === "INSPECTING";

  const inventoryProcessed = request.items.every(
    (item) => item.dispositionAt !== null,
  );

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#202631]">
      <header className="border-b border-[#e9ebef] bg-white px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <Link
            href="/returns"
            className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-[#89919e] hover:text-[#3478f6]"
          >
            <ArrowLeft size={14} />
            Back to return requests
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#929aa6]">
                RETURN REQUEST / {request.reference}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                {request.reference}
              </h1>
              <p className="mt-1 text-sm text-[#89919e]">
                Submitted {date(request.requestedAt)}
              </p>
            </div>

            <span className="rounded-lg bg-[#edf3ff] px-4 py-2 text-xs font-semibold text-[#3478f6]">
              {label(request.status)}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1200px] gap-5 p-5 lg:grid-cols-[1fr_340px] sm:p-8">
        <div className="space-y-5">
          <section className="rounded-xl border border-[#e9ebef] bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <Package size={17} className="text-[#3478f6]" />
              <h2 className="text-sm font-semibold">Returned products</h2>
            </div>

            <div className="space-y-4">
              {request.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-3 border-b border-[#edf0f3] pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {item.product.name}
                    </p>
                    <p className="mt-1 text-xs text-[#89919e]">
                      SKU: {item.product.sku} · Quantity: {item.quantity}
                    </p>
                    <p className="mt-1 text-xs text-[#89919e]">
                      {money(Number(item.product.price))} per unit
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${
                        conditionStyles[item.condition]
                      }`}
                    >
                      {label(item.condition)}
                    </span>

                    {item.disposition && (
                      <span
                        className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${
                          dispositionStyles[item.disposition]
                        }`}
                      >
                        {label(item.disposition)}
                      </span>
                    )}

                    <span className="text-sm font-semibold">
                      {money(Number(item.product.price) * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-between border-t border-[#edf0f3] pt-4">
              <span className="text-xs text-[#89919e]">Total item value</span>
              <span className="text-base font-semibold">{money(total)}</span>
            </div>
          </section>

          <section className="rounded-xl border border-[#e9ebef] bg-white p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardCheck size={17} className="text-[#3478f6]" />
              <h2 className="text-sm font-semibold">Return information</h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#929aa6]">
                  Reason
                </p>
                <p className="mt-2 text-sm font-medium">
                  {label(request.reason)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#929aa6]">
                  Requested resolution
                </p>
                <p className="mt-2 text-sm font-medium">
                  {request.resolution
                    ? label(request.resolution)
                    : "Not specified"}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#929aa6]">
                Customer description
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#566171]">
                {request.description || "No description provided."}
              </p>
            </div>
          </section>

          {isInspecting && (
            <section className="rounded-xl border border-[#e9ebef] bg-white p-5 sm:p-6">
              <div className="mb-2 flex items-center gap-2">
                <ClipboardCheck size={17} className="text-[#3478f6]" />
                <h2 className="text-sm font-semibold">Product inspection</h2>
              </div>

              <p className="mb-5 text-xs leading-5 text-[#89919e]">
                Record the physical condition and decide what should happen
                to each returned product in inventory.
              </p>

              <form action={saveInspection} className="space-y-5">
                <input
                  type="hidden"
                  name="returnId"
                  value={request.id}
                />

                {request.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[#edf0f3] p-4"
                  >
                    <div className="mb-4">
                      <p className="text-sm font-semibold">
                        {item.product.name}
                      </p>
                      <p className="mt-1 text-xs text-[#89919e]">
                        SKU: {item.product.sku} · Quantity: {item.quantity}
                      </p>
                    </div>

                    <input
                      type="hidden"
                      name="itemId"
                      value={item.id}
                    />

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-xs font-medium text-[#566171]">
                          Product condition
                        </label>

                        <select
                          name="condition"
                          defaultValue={
                            item.condition === "UNINSPECTED"
                              ? "NEW"
                              : item.condition
                          }
                          className="h-10 w-full rounded-lg border border-[#e2e6ec] bg-white px-3 text-xs outline-none focus:border-[#3478f6]"
                        >
                          {conditionOptions.map((condition) => (
                            <option key={condition} value={condition}>
                              {label(condition)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-medium text-[#566171]">
                          Inventory disposition
                        </label>

                        <select
                          name="disposition"
                          defaultValue={item.disposition ?? ""}
                          required
                          className="h-10 w-full rounded-lg border border-[#e2e6ec] bg-white px-3 text-xs outline-none focus:border-[#3478f6]"
                        >
                          <option value="" disabled>
                            Select inventory disposition
                          </option>

                          {dispositionOptions.map((disposition) => (
                            <option
                              key={disposition}
                              value={disposition}
                            >
                              {label(disposition)}
                            </option>
                          ))}
                        </select>

                        <p className="mt-2 text-[11px] leading-5 text-[#89919e]">
                          RESTOCK returns the quantity to sellable stock.
                          OPEN BOX, DAMAGED, and DISCARD update their
                          respective inventory categories.
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-medium text-[#566171]">
                          Inspection notes
                        </label>

                        <textarea
                          name="notes"
                          defaultValue={item.notes ?? ""}
                          rows={3}
                          maxLength={1000}
                          placeholder="Describe scratches, defects, missing accessories..."
                          className="w-full resize-y rounded-lg border border-[#e2e6ec] p-3 text-xs outline-none focus:border-[#3478f6]"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-[#3478f6] px-5 py-3 text-xs font-semibold text-white hover:bg-[#2468e8]"
                  >
                    Save inspection results
                  </button>

                  <button
                    type="submit"
                    formAction={completeInspection}
                    className="rounded-lg bg-emerald-600 px-5 py-3 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Complete inspection and create refund
                  </button>
                </div>
              </form>
            </section>
          )}

          {!isInspecting && request.items.some((item) => item.notes) && (
            <section className="rounded-xl border border-[#e9ebef] bg-white p-5 sm:p-6">
              <h2 className="mb-4 text-sm font-semibold">
                Inspection notes
              </h2>

              <div className="space-y-3">
                {request.items.map((item) =>
                  item.notes ? (
                    <div key={item.id}>
                      <p className="text-xs font-semibold">
                        {item.product.name}
                      </p>
                      <p className="mt-1 text-xs text-[#89919e]">
                        {item.notes}
                      </p>
                    </div>
                  ) : null,
                )}
              </div>
            </section>
          )}

          {!isInspecting && inventoryProcessed && (
            <section className="rounded-xl border border-[#e9ebef] bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Boxes size={17} className="text-emerald-600" />
                <h2 className="text-sm font-semibold">
                  Inventory processing
                </h2>
              </div>

              <p className="mb-4 text-xs text-[#89919e]">
                Inventory dispositions have been processed for all returned
                items.
              </p>

              <div className="space-y-3">
                {request.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#f7f8fa] p-3"
                  >
                    <div>
                      <p className="text-xs font-semibold">
                        {item.product.name}
                      </p>
                      <p className="mt-1 text-[11px] text-[#89919e]">
                        Quantity: {item.quantity}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${
                          dispositionStyles[item.disposition ?? ""]
                        }`}
                      >
                        {item.disposition
                          ? label(item.disposition)
                          : "Not assigned"}
                      </span>

                      {item.dispositionAt && (
                        <p className="mt-2 text-[10px] text-[#89919e]">
                          {date(item.dispositionAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border border-[#e9ebef] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <UserRound size={16} className="text-[#3478f6]" />
              <h2 className="text-sm font-semibold">Customer</h2>
            </div>

            <p className="text-sm font-semibold">
              {request.customer.name}
            </p>

            <p className="mt-1 break-all text-xs text-[#89919e]">
              {request.customer.email}
            </p>

            <p className="mt-2 text-xs text-[#89919e]">
              {request.customer.phone || "No phone number"}
            </p>
          </section>

          <section className="rounded-xl border border-[#e9ebef] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays size={16} className="text-[#3478f6]" />
              <h2 className="text-sm font-semibold">Timeline</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-[#89919e]">Requested</span>
                <span>{date(request.requestedAt)}</span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-[#89919e]">Last updated</span>
                <span>{date(request.updatedAt)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#e9ebef] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-[#3478f6]" />
              <h2 className="text-sm font-semibold">Refund</h2>
            </div>

            {request.refund ? (
              <>
                <p className="text-lg font-semibold">
                  {money(Number(request.refund.amount))}
                </p>

                <p className="mt-1 text-xs text-[#89919e]">
                  {label(request.refund.status)}
                </p>
              </>
            ) : (
              <p className="text-xs text-[#89919e]">
                No refund record has been created.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-[#e9ebef] bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold">
              Workflow actions
            </h2>

            {canReceive && (
              <form action={markReturnReceived}>
                <input
                  type="hidden"
                  name="returnId"
                  value={request.id}
                />

                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#3478f6] px-4 py-3 text-xs font-semibold text-white hover:bg-[#2468e8]"
                >
                  Mark as received
                </button>
              </form>
            )}

            {canInspect && (
              <form action={startReturnInspection}>
                <input
                  type="hidden"
                  name="returnId"
                  value={request.id}
                />

                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#3478f6] px-4 py-3 text-xs font-semibold text-white hover:bg-[#2468e8]"
                >
                  Start inspection
                </button>
              </form>
            )}

            {isInspecting && (
              <p className="text-xs leading-5 text-[#566171]">
                Inspection is in progress. Record the condition, choose an
                inventory disposition, and save the results for every item
                before completing inspection.
              </p>
            )}

            {!canReceive && !canInspect && !isInspecting && (
              <p className="text-xs leading-5 text-[#89919e]">
                No workflow action is currently available for this status.
              </p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
