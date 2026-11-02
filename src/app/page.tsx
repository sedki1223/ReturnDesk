
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleHelp,
  Download,
  Ellipsis,
  LayoutDashboard,
  Package,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Truck,
  Wallet,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { getDashboardData } from "@/lib/dashboard";

export const instant = false;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const statusStyles: Record<string, string> = {
  REQUESTED: "bg-blue-50 text-blue-700 ring-blue-600/10",
  UNDER_REVIEW: "bg-amber-50 text-amber-700 ring-amber-600/10",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-600/10",
  RECEIVED: "bg-violet-50 text-violet-700 ring-violet-600/10",
  INSPECTING: "bg-orange-50 text-orange-700 ring-orange-600/10",
  REFUND_PENDING: "bg-amber-50 text-amber-700 ring-amber-600/10",
  REFUNDED: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  EXCHANGED: "bg-cyan-50 text-cyan-700 ring-cyan-600/10",
  CLOSED: "bg-slate-100 text-slate-600 ring-slate-600/10",
};

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-[#202631]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs text-[#89919e]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: ElementType;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border border-[#e9ebef] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-[#737d8c]">{title}</p>
        <div className="flex size-9 items-center justify-center rounded-lg bg-[#f4f6f9] text-[#596779]">
          <Icon size={17} strokeWidth={1.8} />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-[28px] font-semibold tracking-[-1.2px] text-[#202631]">
          {value}
        </h3>
      </div>
      <p className="mt-2 text-[11px] text-[#929aa6]">{subtitle}</p>
    </div>
  );
}

const navigationLinks = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Return requests", href: "/returns", icon: ShoppingBag },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Refunds", href: "/refunds", icon: Wallet },
];

export default async function Home() {
  const {
    totalReturns,
    pendingReturns,
    completedRefunds,
    refundTotal,
    approvalRate,
    recentReturns,
  } = await getDashboardData();

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const returnRows = recentReturns.map((item) => {
    const amount = item.items.reduce((total, returnItem) => {
      return total + Number(returnItem.product.price) * returnItem.quantity;
    }, 0);

    return {
      id: item.reference,
      customer: item.customer.name,
      initials: getInitials(item.customer.name),
      product:
        item.items.map((returnItem) => returnItem.product.name).join(", ") ||
        "No product",
      sku:
        item.items.map((returnItem) => returnItem.product.sku).join(", ") ||
        "—",
      date: formatDate(item.requestedAt),
      amount: formatCurrency(amount),
      status: item.status,
    };
  });

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#202631]">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden w-[248px] shrink-0 flex-col bg-[#171c25] text-white lg:flex">
          <div className="flex h-[76px] items-center gap-3 border-b border-white/[0.07] px-6">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#3478f6] shadow-lg shadow-blue-950/30">
              <Package size={19} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[16px] font-semibold tracking-[-0.5px]">
                ReturnDesk
              </p>
              <p className="mt-0.5 text-[10px] font-medium tracking-[1.3px] text-[#8792a3]">
                OPERATIONS PLATFORM
              </p>
            </div>
          </div>

          <div className="px-4 pt-7">
            <p className="mb-3 px-3 text-[10px] font-semibold tracking-[1.5px] text-[#687487]">
              WORKSPACE
            </p>

            <nav className="space-y-1">
              {navigationLinks.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${
                    href === "/"
                      ? "bg-[#29374d] font-medium text-white"
                      : "text-[#a4adbb] hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <Icon
                    size={17}
                    className={href === "/" ? "text-[#75a5ff]" : ""}
                  />
                  {label}

                  {href === "/returns" && (
                    <span className="ml-auto rounded-md bg-[#3478f6] px-2 py-0.5 text-[10px] font-semibold text-white">
                      {pendingReturns}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-9 px-4">
            <p className="mb-3 px-3 text-[10px] font-semibold tracking-[1.5px] text-[#687487]">
              MANAGEMENT
            </p>

            <nav className="space-y-1">
              <span className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-[#687487] opacity-60">
                <Truck size={17} />
                Shipping
                <span className="ml-auto text-[9px]">SOON</span>
              </span>

              <span className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-[#687487] opacity-60">
                <Settings2 size={17} />
                Settings
                <span className="ml-auto text-[9px]">SOON</span>
              </span>
            </nav>
          </div>

          <div className="mt-auto p-4">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-[12px] font-semibold">
                <ShieldCheck size={16} className="text-emerald-400" />
                All systems operational
              </div>
              <p className="mt-2 text-[11px] leading-5 text-[#8792a3]">
                Your return operations are running smoothly.
              </p>
            </div>

            <div className="mt-4 flex items-center gap-3 border-t border-white/[0.08] pt-4">
              <div className="flex size-9 items-center justify-center rounded-full bg-[#35445a] text-xs font-semibold text-[#dce7fa]">
                NS
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
                  Northstar Commerce
                </p>
                <p className="mt-1 text-[10px] text-[#8792a3]">
                  Business workspace
                </p>
              </div>
              <ChevronDown size={15} className="text-[#8792a3]" />
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b border-[#e9ebef] bg-white/90 px-5 backdrop-blur-xl sm:px-8">
            <div>
              <div className="flex items-center gap-2 text-[11px] text-[#929aa6]">
                <span>Workspace</span>
                <span>/</span>
                <span className="font-medium text-[#4b5665]">Overview</span>
              </div>
              <h1 className="mt-1 text-[17px] font-semibold tracking-tight">
                Overview
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button className="hidden h-9 items-center gap-2 rounded-lg border border-[#e9ebef] px-3 text-xs text-[#788392] transition hover:bg-[#f7f8fa] sm:flex">
                <Search size={14} />
                Search
                <kbd className="ml-3 rounded border border-[#e9ebef] bg-[#f7f8fa] px-1.5 py-0.5 text-[10px]">
                  /
                </kbd>
              </button>

              <button
                aria-label="Help"
                className="flex size-9 items-center justify-center rounded-lg text-[#788392] hover:bg-[#f4f6f9]"
              >
                <CircleHelp size={18} />
              </button>

              <button
                aria-label="Notifications"
                className="relative flex size-9 items-center justify-center rounded-lg text-[#788392] hover:bg-[#f4f6f9]"
              >
                <Bell size={18} />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#3478f6]" />
              </button>

              <div className="hidden h-8 w-px bg-[#e9ebef] sm:block" />
              <div className="flex size-9 items-center justify-center rounded-full bg-[#e9effb] text-xs font-semibold text-[#3269c7]">
                SD
              </div>
            </div>
          </header>

          {/* Mobile Navigation */}
          <nav className="grid grid-cols-4 border-b border-[#e9ebef] bg-white px-2 py-2 lg:hidden">
            {navigationLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[10px] font-medium transition ${
                  href === "/"
                    ? "bg-[#edf3ff] text-[#3478f6]"
                    : "text-[#89919e] hover:bg-[#f7f8fa]"
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
                {href === "/returns" && pendingReturns > 0 && (
                  <span className="absolute ml-8 -mt-7 rounded-full bg-[#3478f6] px-1.5 text-[9px] text-white">
                    {pendingReturns}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="mx-auto max-w-[1500px] space-y-7 p-5 sm:p-8">
            <section className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#929aa6]">
                  {today.toUpperCase()}
                </p>
                <h2 className="mt-2 text-[25px] font-semibold tracking-[-1px] text-[#202631]">
                  Welcome to ReturnDesk.
                </h2>
                <p className="mt-1.5 text-sm text-[#89919e]">
                  Here&apos;s what&apos;s happening with your returns today.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex h-10 items-center gap-2 rounded-lg border border-[#e2e6ec] bg-white px-3 text-xs font-medium text-[#566171] shadow-sm hover:bg-[#f8f9fb]">
                  <Download size={15} />
                  Export
                </button>

                <Link
                  href="/returns"
                  className="flex h-10 items-center gap-2 rounded-lg bg-[#3478f6] px-4 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:bg-[#2468e8]"
                >
                  <Plus size={16} />
                  New return
                </Link>
              </div>
            </section>

            {/* Live KPI Cards */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Total returns"
                value={totalReturns.toLocaleString("en-US")}
                icon={ShoppingBag}
                subtitle="All recorded return requests"
              />
              <MetricCard
                title="Pending requests"
                value={pendingReturns.toLocaleString("en-US")}
                icon={Clock3}
                subtitle="Awaiting review or resolution"
              />
              <MetricCard
                title="Refunds processed"
                value={formatCurrency(refundTotal)}
                icon={Wallet}
                subtitle={`${completedRefunds} completed refunds`}
              />
              <MetricCard
                title="Approval rate"
                value={`${approvalRate}%`}
                icon={CheckCircle2}
                subtitle="Based on decided return requests"
              />
            </section>

            {/* Operational Snapshot */}
            <section className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
              <div className="rounded-xl border border-[#e9ebef] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.03)] sm:p-6">
                <SectionHeading
                  title="Returns overview"
                  description="Current return operation metrics"
                />

                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-[30px] font-semibold tracking-[-1.2px]">
                      {totalReturns.toLocaleString("en-US")}
                    </p>
                    <p className="mt-1 text-[11px] text-[#929aa6]">
                      Total recorded requests
                    </p>
                  </div>

                  <div>
                    <p className="text-[30px] font-semibold tracking-[-1.2px] text-amber-600">
                      {pendingReturns.toLocaleString("en-US")}
                    </p>
                    <p className="mt-1 text-[11px] text-[#929aa6]">
                      Requests requiring resolution
                    </p>
                  </div>

                  <div>
                    <p className="text-[30px] font-semibold tracking-[-1.2px] text-emerald-600">
                      {completedRefunds.toLocaleString("en-US")}
                    </p>
                    <p className="mt-1 text-[11px] text-[#929aa6]">
                      Completed refunds
                    </p>
                  </div>

                  <div>
                    <p className="text-[30px] font-semibold tracking-[-1.2px]">
                      {approvalRate}%
                    </p>
                    <p className="mt-1 text-[11px] text-[#929aa6]">
                      Return approval rate
                    </p>
                  </div>
                </div>

                <div className="mt-7 rounded-lg bg-[#f7f9fc] p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#566171]">
                    <TrendingUp size={15} className="text-[#3478f6]" />
                    Refund value completed
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {formatCurrency(refundTotal)}
                  </p>
                  <p className="mt-1 text-[11px] text-[#929aa6]">
                    Total amount recorded in completed refunds.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#e9ebef] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.03)] sm:p-6">
                <SectionHeading
                  title="Needs attention"
                  description="Current outstanding requests"
                  action={
                    <button
                      aria-label="More options"
                      className="rounded-lg p-1.5 text-[#89919e] hover:bg-[#f4f6f9]"
                    >
                      <Ellipsis size={18} />
                    </button>
                  }
                />

                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-3 rounded-lg border border-[#f0e5d0] bg-[#fffbf3] p-3.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#fff0d3] text-[#c58b28]">
                      <AlertCircle size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#3d4149]">
                        Pending requests
                      </p>
                      <p className="mt-1 text-[11px] text-[#92909a]">
                        Awaiting review or resolution
                      </p>
                    </div>
                    <span className="text-lg font-semibold">
                      {pendingReturns}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-[#e4ebfa] bg-[#f7faff] p-3.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e7efff] text-[#477bd3]">
                      <Package size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#3d4149]">
                        Recent activity
                      </p>
                      <p className="mt-1 text-[11px] text-[#92909a]">
                        Latest return requests are listed below
                      </p>
                    </div>
                    <span className="text-lg font-semibold">
                      {recentReturns.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-[#e8e5f7] bg-[#faf9ff] p-3.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#eeeaff] text-[#7865c9]">
                      <Wallet size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#3d4149]">
                        Refunds completed
                      </p>
                      <p className="mt-1 text-[11px] text-[#92909a]">
                        Successfully processed refunds
                      </p>
                    </div>
                    <span className="text-lg font-semibold">
                      {completedRefunds}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-[#e9ebef] py-2.5 text-xs font-semibold text-[#566171]">
                  Live database overview
                  <CheckCircle2 size={14} className="text-emerald-600" />
                </div>
              </div>
            </section>

            {/* Database-Driven Returns Table */}
            <section className="overflow-hidden rounded-xl border border-[#e9ebef] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
              <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:px-6">
                <SectionHeading
                  title="Recent return requests"
                  description="Latest customer returns from your database"
                />

                <Link
                  href="/returns"
                  className="flex items-center gap-2 text-xs font-semibold text-[#3478f6] hover:text-[#245fc8]"
                >
                  View all requests
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-left">
                  <thead>
                    <tr className="border-y border-[#edf0f3] bg-[#fafbfc] text-[10px] font-semibold uppercase tracking-[0.8px] text-[#929aa6]">
                      <th className="px-6 py-3.5">Request</th>
                      <th className="px-4 py-3.5">Customer</th>
                      <th className="px-4 py-3.5">Product</th>
                      <th className="px-4 py-3.5">Date</th>
                      <th className="px-4 py-3.5">Amount</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-5 py-3.5" />
                    </tr>
                  </thead>

                  <tbody>
                    {returnRows.length > 0 ? (
                      returnRows.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-[#f0f2f5] last:border-0 transition hover:bg-[#fafbfc]"
                        >
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-[#3478f6]">
                              {item.id}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#edf1f8] text-[10px] font-semibold text-[#62738b]">
                                {item.initials}
                              </div>
                              <span className="text-xs font-medium text-[#394351]">
                                {item.customer}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div>
                              <p className="text-xs font-medium text-[#394351]">
                                {item.product}
                              </p>
                              <p className="mt-1 text-[10px] text-[#9aa2ad]">
                                {item.sku}
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-[11px] text-[#89919e]">
                            {item.date}
                          </td>

                          <td className="px-4 py-4 text-xs font-semibold text-[#394351]">
                            {item.amount}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1.5 text-[10px] font-semibold ring-1 ring-inset ${
                                statusStyles[item.status] ??
                                "bg-slate-100 text-slate-600 ring-slate-600/10"
                              }`}
                            >
                              {formatStatus(item.status)}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/returns/${item.id}`}
                              aria-label={`Open return ${item.id}`}
                              className="inline-flex rounded-md p-1.5 text-[#9aa2ad] hover:bg-[#f0f2f5]"
                            >
                              <ArrowRight size={17} />
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-12 text-center text-sm text-[#929aa6]"
                        >
                          No return requests found. Create your first return
                          request to see it here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-[#edf0f3] px-6 py-3.5">
                <span className="text-[10px] text-[#929aa6]">
                  Showing {returnRows.length} of {totalReturns} requests
                </span>
                <span className="text-[10px] text-[#929aa6]">
                  Latest requests
                </span>
              </div>
            </section>

            <footer className="flex flex-wrap items-center justify-between gap-2 pb-2 text-[10px] text-[#a0a7b1]">
              <span>© 2026 ReturnDesk. Returns, under control.</span>
              <span className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Database connected
                <span className="mx-1">·</span>
                v0.1.0
              </span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
