import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Layers,
  History,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { requireAdminPage } from "@/app/admin/_lib/server";
import { Logo } from "@/app/_components/logo";

const links = [
  { href: "/admin", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/subscriptions", label: "Assinaturas", icon: CreditCard },
  { href: "/admin/plans", label: "Planos Comerciais", icon: Layers },
  { href: "/admin/audit", label: "Auditoria", icon: History },
];

export async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminData = await requireAdminPage();

  return (
    <div className="min-h-svh bg-background text-foreground md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-border/80 bg-card/60 p-5 backdrop-blur-md md:sticky md:top-0 md:h-svh md:border-r md:border-b-0 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Logo size="md" asLink />
              <span className="rounded-md bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
                CONSOLE
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Painel de Operações e Gestão
            </p>
          </div>

          <nav aria-label="Administração" className="flex flex-col gap-1.5">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-heading font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-border/60 flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="size-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[11px] font-heading font-bold truncate">
                Admin Autorizado
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {adminData?.accountType ?? "CONTA"} • {adminData?.systemRole}
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-heading text-muted-foreground hover:text-foreground transition-colors px-1"
          >
            <ArrowLeft className="size-3.5" />
            <span>Voltar ao App Trainvy</span>
          </Link>
        </div>
      </aside>

      <main className="mx-auto w-full min-w-0 max-w-6xl space-y-6 px-4 py-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
