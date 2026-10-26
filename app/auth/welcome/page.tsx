import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Dumbbell,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Logo } from "@/app/_components/logo";
import { getCommercialContext } from "@/app/_lib/api/fetch-generated";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const result = await getCommercialContext({ cache: "no-store" });
  if (result.status === 401) redirect("/auth");
  if (result.status !== 200)
    throw new Error("Não foi possível carregar sua conta.");
  if (!result.data.accountSetupCompletedAt) redirect("/auth/complete");
  if (result.data.accountType !== "COACH") redirect("/");

  const planName = result.data.plan?.name ?? "Personal Trainer";

  return (
    <main className="relative min-h-svh flex flex-col items-center justify-center p-4 sm:p-6 bg-background">
      {/* Halo de luz ambiente suave */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex flex-col items-center text-center gap-3">
          <Logo size="md" />

          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
            <ShieldCheck className="size-3.5 text-primary" />
            <span>Conta Profissional • Personal</span>
          </div>

          <div className="space-y-1">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Bem-vindo ao Trainvy Pro!
            </h1>
            <p className="font-heading text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
              Sua central completa para gestão de alunos, prescrições de alta performance com IA e biomecânica 3D.
            </p>
          </div>
        </div>

        {/* Card do Plano */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Plano Selecionado
            </span>
            <p className="font-heading text-sm font-bold text-foreground">
              {planName}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
            <CheckCircle2 className="size-3" />
            Pronto para Usar
          </span>
        </div>

        {/* 3 Recursos Principais */}
        <div className="space-y-3">
          {/* 1. Alunos */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/25">
              <Users className="size-5" />
            </div>
            <div className="space-y-0.5">
              <h2 className="font-heading text-xs sm:text-sm font-bold text-foreground">
                Gestão e Convite de Alunos
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                Gere links exclusivos para enviar pelo WhatsApp e conecte alunos num clique com controle de vagas.
              </p>
            </div>
          </div>

          {/* 2. Prescrição com IA */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-500 border border-orange-500/25">
              <Sparkles className="size-5" />
            </div>
            <div className="space-y-0.5">
              <h2 className="font-heading text-xs sm:text-sm font-bold text-foreground">
                Prescrição Inteligente com IA
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                Elabore rotinas e periodizações completas em segundos, mantendo total flexibilidade para editar cada exercício.
              </p>
            </div>
          </div>

          {/* 3. Biomecânica 3D */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
              <Box className="size-5" />
            </div>
            <div className="space-y-0.5">
              <h2 className="font-heading text-xs sm:text-sm font-bold text-foreground">
                Biomecânica 3D e Demonstrações
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                Seus alunos contam com modelos 3D interativos e ilustrações anatômicas para executar sem desvios.
              </p>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-2.5 pt-2">
          <Link
            href="/personal"
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-primary py-3.5 px-6 font-heading font-bold text-sm text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>Acessar Painel do Personal</span>
            <ArrowRight className="size-4" />
          </Link>

          <Link
            href="/"
            className="w-full text-center py-2 font-heading text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Acessar meus treinos pessoais
          </Link>
        </div>
      </div>
    </main>
  );
}
