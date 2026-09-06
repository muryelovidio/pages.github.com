"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Upload,
  Wallet,
  CreditCard,
  CalendarClock,
  Target,
  MessageCircle,
  Sparkles,
  Settings,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/importar", label: "Importar", icon: Upload },
  { href: "/contas", label: "Contas", icon: Wallet },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/compromissos", label: "Compromissos", icon: CalendarClock },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/financeiro", label: "Assistente", icon: MessageCircle },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="h-7 w-7 rounded-lg bg-accent" />
        <span className="font-semibold">Financeiro</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-accent/10 font-medium text-accent"
                  : "text-muted hover:bg-black/[.03] hover:text-foreground"
              }`}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-3 py-4">
        <p className="truncate px-3 text-xs text-muted" title={userEmail}>
          {userEmail}
        </p>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:bg-black/[.03] hover:text-foreground"
          >
            <LogOut size={17} strokeWidth={2} />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
