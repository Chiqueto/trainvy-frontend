import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Shield, Lock, ShieldCheck } from "lucide-react";
import { authClient } from "@/app/_lib/auth-client";
import { getCommercialContext } from "@/app/_lib/api/fetch-generated";
import { Logo } from "@/app/_components/logo";
import { AdminLoginForm } from "./_components/admin-login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ returnTo?: string; error?: string }>;
}) {
  const { returnTo, error } = (await searchParams) ?? {};

  let session = null;
  try {
    session = await authClient.getSession({
      fetchOptions: {
        headers: await headers(),
      },
    });
  } catch {
    // ignore
  }

  let commercial = null;
  if (session?.data?.user) {
    try {
      commercial = await getCommercialContext({ cache: "no-store" });
    } catch {
      // ignore
    }
  }

  const isAlreadyAdmin =
    commercial?.status === 200 && commercial.data.systemRole === "ADMIN";

  // Se já for admin logado e não houver erro explícito, redireciona diretamente para o painel
  if (isAlreadyAdmin && !error) {
    const destination = returnTo?.startsWith("/admin") ? returnTo : "/admin";
    redirect(destination);
  }

  const isUnauthorized =
    error === "UNAUTHORIZED" ||
    (Boolean(session?.data?.user) &&
      commercial?.status === 200 &&
      commercial.data.systemRole !== "ADMIN");

  const currentUser = session?.data?.user
    ? {
        name: session.data.user.name,
        email: session.data.user.email,
        systemRole:
          commercial?.status === 200 ? commercial.data.systemRole : "USER",
      }
    : null;

  return (
    <main className="relative min-h-svh flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100 overflow-hidden">
      {/* Luz ambiente de fundo */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[500px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 size-[400px] rounded-full bg-emerald-500/5 blur-[120px]" />

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="rounded-2xl bg-white/10 p-2.5 backdrop-blur-md">
            <Logo size="md" light />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
            <ShieldCheck className="size-3.5 text-primary" />
            <span>Trainvy Console • Área Restrita</span>
          </div>

          <div className="space-y-1">
            <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-white">
              Autenticação Administrativa
            </h1>
            <p className="font-heading text-xs text-slate-400 max-w-xs leading-relaxed">
              Painel de operações internas, suporte a usuários e gestão comercial da plataforma.
            </p>
          </div>
        </div>

        {/* Formulário de Login / Acesso Negado */}
        <AdminLoginForm
          returnTo={returnTo}
          currentUser={currentUser}
          isUnauthorized={isUnauthorized}
        />

        {/* Rodapé de Segurança */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col items-center gap-1.5 text-center">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Lock className="size-3" />
            <span>Acesso monitorado com auditoria em conformidade com a LGPD.</span>
          </div>
          <span className="text-[10px] text-slate-600 font-mono">
            Trainvy Operations v2.0
          </span>
        </div>
      </div>
    </main>
  );
}
