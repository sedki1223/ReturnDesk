
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Wallet,
} from "lucide-react";

const navigationLinks = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Return Requests", href: "/returns", icon: ClipboardList },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Refunds", href: "/refunds", icon: Wallet },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
            R
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            ReturnDesk
          </span>
        </Link>

        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {navigationLinks.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={17} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
