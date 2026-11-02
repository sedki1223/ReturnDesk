
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  Clock3,
  AlertCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { updateRefundStatus } from "./actions";

export const instant = false;

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function label(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const styles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-rose-50 text-rose-700",
};

export default async function RefundsPage() {
  const [refunds, totals] = await Promise.all([
    prisma.refund.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        return: {
          include: {
            customer: true,
          },
        },
      },
    }),

    prisma.refund.groupBy({
      by: ["status"],
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const count = (status: string) =>
    totals.find((item) => item.status === status)?._count._all ?? 0;

  const amount = (status: string) =>
    Number(
      totals.find((item) => item.status === status)?._sum.amount ?? 0,
    );

  const completedTotal = amount("COMPLETED");

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#202631]">
      <header className="border-b border-[#e9ebef] bg-white px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-[1400px]">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-xs text-[#89919e] hover:text-[#3478f6]"
          >
            <ArrowLeft size={14} />
            Back to overview
          </Link>

          <p className="text-xs text-[#929aa6]">
            WORKSPACE / FINANCIAL OPERATIONS
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Refund management
          </h1>

          <p className="mt-1 text-sm text-[#89919e]">
            Track and process customer refunds.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] space-y-5 p-5 sm:p-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#e9ebef] bg-white p-5">
            <Clock3 size={17} className="text-amber-600" />
            <p className="mt-3 text-xs text-[#89919e]">Pending</p>
            <p className="mt-1 text-2xl font-semibold">
              {count("PENDING")}
            </p>
            <p className="mt-1 text-xs text-[#89919e]">
              {money(amount("PENDING"))}
            </p>
          </div>

          <div className="rounded-xl border border-[#e9ebef] bg-white p-5">
            <CreditCard size={17} className="text-blue-600" />
            <p className="mt-3 text-xs text-[#89919e]">Processing</p>
            <p className="mt-1 text-2xl font-semibold">
              {count("PROCESSING")}
            </p>
            <p className="mt-1 text-xs text-[#89919e]">
              {money(amount("PROCESSING"))}
            </p>
          </div>

          <div className="rounded-xl border border-[#e9ebef] bg-white p-5">
            <CheckCircle2 size={17} className="text-emerald-600" />
            <p className="mt-3 text-xs text-[#89919e]">Completed</p>
            <p className="mt-1 text-2xl font-semibold">
              {count("COMPLETED")}
            </p>
            <p className="mt-1 text-xs text-[#89919e]">
              {money(completedTotal)}
            </p>
          </div>

          <div className="rounded-xl border border-[#e9ebef] bg-white p-5">
            <AlertCircle size={17} className="text-rose-600" />
            <p className="mt-3 text-xs text-[#89919e]">Failed</p>
            <p className="mt-1 text-2xl font-semibold">
              {count("FAILED")}
            </p>
            <p className="mt-1 text-xs text-[#89919e]">
              {money(amount("FAILED"))}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#e9ebef] bg-white">
          <div className="border-b border-[#edf0f3] p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Refund queue</h2>
            <p className="mt-1 text-xs text-[#89919e]">
              {refunds.length} refund record(s)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-[#edf0f3] bg-[#fafbfc] text-[10px] font-semibold uppercase tracking-wide text-[#929aa6]">
                  <th className="px-6 py-4">Return</th>
                  <th className="px-4 py-4">Customer</th>
                  <th className="px-4 py-4">Created</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {refunds.map((refund) => (
                  <tr
                    key={refund.id}
                    className="border-b border-[#f0f2f5] last:border-0 hover:bg-[#fafbfc]"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/returns/${refund.returnId}`}
                        className="text-xs font-semibold text-[#3478f6] hover:underline"
                      >
                        {refund.return.reference}
                      </Link>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-xs font-medium">
                        {refund.return.customer.name}
                      </p>
                      <p className="mt-1 text-[10px] text-[#929aa6]">
                        {refund.return.customer.email}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-xs text-[#89919e]">
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                      }).format(refund.createdAt)}
                    </td>

                    <td className="px-4 py-4 text-xs font-semibold">
                      {money(Number(refund.amount))}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${
                          styles[refund.status] ??
                          "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {label(refund.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {refund.status === "PENDING" && (
                          <form action={updateRefundStatus}>
                            <input
                              type="hidden"
                              name="refundId"
                              value={refund.id}
                            />
                            <input
                              type="hidden"
                              name="nextStatus"
                              value="PROCESSING"
                            />
                            <button
                              type="submit"
                              className="rounded-md bg-blue-50 px-3 py-2 text-[10px] font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              Start processing
                            </button>
                          </form>
                        )}

                        {refund.status === "PROCESSING" && (
                          <>
                            <form action={updateRefundStatus}>
                              <input
                                type="hidden"
                                name="refundId"
                                value={refund.id}
                              />
                              <input
                                type="hidden"
                                name="nextStatus"
                                value="COMPLETED"
                              />
                              <button
                                type="submit"
                                className="rounded-md bg-emerald-50 px-3 py-2 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100"
                              >
                                Complete
                              </button>
                            </form>

                            <form action={updateRefundStatus}>
                              <input
                                type="hidden"
                                name="refundId"
                                value={refund.id}
                              />
                              <input
                                type="hidden"
                                name="nextStatus"
                                value="FAILED"
                              />
                              <button
                                type="submit"
                                className="rounded-md bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700 hover:bg-rose-100"
                              >
                                Mark failed
                              </button>
                            </form>
                          </>
                        )}

                        {refund.status === "COMPLETED" && (
                          <span className="text-[10px] text-[#89919e]">
                            Processed
                          </span>
                        )}

                        {refund.status === "FAILED" && (
                          <span className="text-[10px] text-rose-600">
                            Requires attention
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {refunds.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <CreditCard
                        size={25}
                        className="mx-auto text-[#c3cad3]"
                      />
                      <p className="mt-3 text-sm font-semibold">
                        No refunds yet
                      </p>
                      <p className="mt-1 text-xs text-[#929aa6]">
                        Refunds will appear here after an inspection is completed.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
