
import Link from "next/link";
import {
  Search,
  Filter,
  ArrowLeft,
  ArrowRight,
  Package,
  CheckCircle2,
  XCircle,
  Clock3,
  RefreshCw,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { approveReturn, rejectReturn } from "./actions";

export const instant = false;

const statuses = [
  "ALL",
  "REQUESTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "RECEIVED",
  "INSPECTING",
  "REFUND_PENDING",
  "REFUNDED",
  "EXCHANGED",
  "CLOSED",
] as const;

const statusStyles: Record<string, string> = {
  REQUESTED: "bg-blue-50 text-blue-700",
  UNDER_REVIEW: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
  RECEIVED: "bg-violet-50 text-violet-700",
  INSPECTING: "bg-orange-50 text-orange-700",
  REFUND_PENDING: "bg-amber-50 text-amber-700",
  REFUNDED: "bg-emerald-50 text-emerald-700",
  EXCHANGED: "bg-cyan-50 text-cyan-700",
  CLOSED: "bg-slate-100 text-slate-600",
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

type SearchParams = Promise<{
  q?: string;
  status?: string;
  page?: string;
}>;

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const selectedStatus = statuses.includes(
    (params.status ?? "ALL") as (typeof statuses)[number],
  )
    ? params.status ?? "ALL"
    : "ALL";

  const requestedPage = Math.max(1, Number(params.page) || 1);
  const pageSize = 10;

  const where = {
    ...(selectedStatus !== "ALL"
      ? { status: selectedStatus as Exclude<(typeof statuses)[number], "ALL"> }
      : {}),
    ...(query
      ? {
          OR: [
            { reference: { contains: query, mode: "insensitive" as const } },
            {
              customer: {
                name: { contains: query, mode: "insensitive" as const },
              },
            },
            {
              customer: {
                email: { contains: query, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const [total, requests, statusCounts] = await Promise.all([
    prisma.returnRequest.count({ where }),
    prisma.returnRequest.findMany({
      where,
      orderBy: { requestedAt: "desc" },
      skip: (requestedPage - 1) * pageSize,
      take: pageSize,
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    }),
    prisma.returnRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);

  const countFor = (status: string) =>
    statusCounts.find((item) => item.status === status)?._count._all ?? 0;

  const reviewCount = countFor("REQUESTED") + countFor("UNDER_REVIEW");

  function pageUrl(page: number) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (selectedStatus !== "ALL") search.set("status", selectedStatus);
    search.set("page", String(page));
    return `/returns?${search.toString()}`;
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#202631]">
      <header className="border-b border-[#e9ebef] bg-white px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-[1500px]">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-[#89919e] hover:text-[#3478f6]"
          >
            <ArrowLeft size={14} />
            Back to overview
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#929aa6]">
                WORKSPACE / OPERATIONS
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Return requests
              </h1>
              <p className="mt-1 text-sm text-[#89919e]">
                Review, manage, and track customer return requests.
              </p>
            </div>
            <div className="rounded-lg border border-[#e9ebef] bg-[#fafbfc] px-4 py-3">
              <p className="text-[11px] text-[#89919e]">Awaiting review</p>
              <p className="mt-1 text-xl font-semibold">{reviewCount}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-5 p-5 sm:p-8">
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e9ebef] bg-white p-5">
            <div className="flex items-center gap-2 text-xs text-[#89919e]">
              <Package size={15} />
              All requests
            </div>
            <p className="mt-3 text-2xl font-semibold">
              {statusCounts.reduce((sum, item) => sum + item._count._all, 0)}
            </p>
          </div>
          <div className="rounded-xl border border-[#e9ebef] bg-white p-5">
            <div className="flex items-center gap-2 text-xs text-[#89919e]">
              <Clock3 size={15} />
              Awaiting review
            </div>
            <p className="mt-3 text-2xl font-semibold">{reviewCount}</p>
          </div>
          <div className="rounded-xl border border-[#e9ebef] bg-white p-5">
            <div className="flex items-center gap-2 text-xs text-[#89919e]">
              <CheckCircle2 size={15} />
              Approved
            </div>
            <p className="mt-3 text-2xl font-semibold">
              {countFor("APPROVED")}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#e9ebef] bg-white">
          <div className="flex flex-col gap-4 border-b border-[#edf0f3] p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-[#89919e]" />
              <h2 className="text-sm font-semibold">Find requests</h2>
              <span className="ml-auto text-xs text-[#929aa6]">
                {total} result{total === 1 ? "" : "s"}
              </span>
            </div>

            <form
              action="/returns"
              method="GET"
              className="flex flex-col gap-3 sm:flex-row"
            >
              <div className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-[#e2e6ec] px-3">
                <Search size={15} className="text-[#929aa6]" />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search reference, customer, or email..."
                  className="w-full bg-transparent text-xs outline-none placeholder:text-[#a0a7b1]"
                />
              </div>
              <select
                name="status"
                defaultValue={selectedStatus}
                className="h-10 rounded-lg border border-[#e2e6ec] bg-white px-3 text-xs text-[#566171] outline-none"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL" ? "All statuses" : formatStatus(status)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="h-10 rounded-lg bg-[#3478f6] px-5 text-xs font-semibold text-white hover:bg-[#2468e8]"
              >
                Apply filters
              </button>
              <Link
                href="/returns"
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#e2e6ec] px-4 text-xs font-medium text-[#566171] hover:bg-[#f7f8fa]"
              >
                <RefreshCw size={13} />
                Reset
              </Link>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-[#edf0f3] bg-[#fafbfc] text-[10px] font-semibold uppercase tracking-[0.8px] text-[#929aa6]">
                  <th className="px-6 py-4">Request</th>
                  <th className="px-4 py-4">Customer</th>
                  <th className="px-4 py-4">Items</th>
                  <th className="px-4 py-4">Requested</th>
                  <th className="px-4 py-4">Value</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const amount = request.items.reduce(
                    (sum, item) =>
                      sum + Number(item.product.price) * item.quantity,
                    0,
                  );

                  const canReview = [
                    "REQUESTED",
                    "UNDER_REVIEW",
                  ].includes(request.status);

                  return (
                    <tr
                      key={request.id}
                      className="border-b border-[#f0f2f5] last:border-0 hover:bg-[#fafbfc]"
                    >
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-[#3478f6]">
                          <Link
                            href={`/returns/${request.id}`}
                            className="text-xs font-semibold text-[#3478f6] hover:underline"
                          >
                            {request.reference}
                          </Link>
                        </p>
                        <p className="mt-1 text-[10px] text-[#929aa6]">
                          {request.reason.replaceAll("_", " ")}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-medium text-[#394351]">
                          {request.customer.name}
                        </p>
                        <p className="mt-1 text-[10px] text-[#929aa6]">
                          {request.customer.email}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="max-w-[190px] truncate text-xs text-[#394351]">
                          {request.items
                            .map((item) => item.product.name)
                            .join(", ") || "No items"}
                        </p>
                        <p className="mt-1 text-[10px] text-[#929aa6]">
                          {request.items.length} line item(s)
                        </p>
                      </td>
                      <td className="px-4 py-4 text-xs text-[#89919e]">
                        {formatDate(request.requestedAt)}
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold">
                        {formatCurrency(amount)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${
                            statusStyles[request.status] ??
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {formatStatus(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {canReview ? (
                          <div className="flex justify-end gap-2">
                            <form action={approveReturn}>
                              <input
                                type="hidden"
                                name="returnId"
                                value={request.id}
                              />
                              <button
                                type="submit"
                                className="rounded-md bg-emerald-50 px-3 py-2 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100"
                              >
                                Approve
                              </button>
                            </form>
                            <form action={rejectReturn}>
                              <input
                                type="hidden"
                                name="returnId"
                                value={request.id}
                              />
                              <button
                                type="submit"
                                className="rounded-md bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700 hover:bg-rose-100"
                              >
                                Reject
                              </button>
                            </form>
                          </div>
                        ) : (
                          <span className="block text-right text-[10px] text-[#a0a7b1]">
                            No review action
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {requests.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center"
                    >
                      <Package
                        size={26}
                        className="mx-auto text-[#c3cad3]"
                      />
                      <p className="mt-3 text-sm font-semibold text-[#566171]">
                        No return requests found
                      </p>
                      <p className="mt-1 text-xs text-[#929aa6]">
                        Try another search term or status filter.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#edf0f3] px-6 py-4">
            <p className="text-[10px] text-[#929aa6]">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Link
                href={pageUrl(Math.max(1, currentPage - 1))}
                aria-disabled={currentPage <= 1}
                className={`flex items-center gap-2 rounded-md border border-[#e9ebef] px-3 py-2 text-[10px] font-medium ${
                  currentPage <= 1
                    ? "pointer-events-none text-[#c3cad3]"
                    : "text-[#566171] hover:bg-[#f7f8fa]"
                }`}
              >
                <ArrowLeft size={12} />
                Previous
              </Link>
              <Link
                href={pageUrl(Math.min(totalPages, currentPage + 1))}
                aria-disabled={currentPage >= totalPages}
                className={`flex items-center gap-2 rounded-md border border-[#e9ebef] px-3 py-2 text-[10px] font-medium ${
                  currentPage >= totalPages
                    ? "pointer-events-none text-[#c3cad3]"
                    : "text-[#566171] hover:bg-[#f7f8fa]"
                }`}
              >
                Next
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
