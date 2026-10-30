import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "@/app/_components/logo";

export const metadata = {
  title: "Política de Privacidade — Trainvy",
  description: "Informações sobre privacidade, dados coletados e uso responsável no Trainvy.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/95 px-5 backdrop-blur-md">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-heading font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Voltar</span>
        </Link>
        <Logo size="sm" asLink />
        <div className="w-12" />
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 py-8 space-y-6">
        <div className="space-y-2 border-b border-border/50 pb-5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-mono font-medium text-primary">
            <ShieldCheck className="size-3.5" />
            Privacidade & Dados
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
            Política de Privacidade
          </h1>
          <p className="text-xs text-muted-foreground">
            Última atualização: Outubro de 2026 • Versão Beta
          </p>
        </div>

        <section className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-base font-semibold text-foreground">
            1. Dados que coletamos
          </h2>
          <p>
            O <strong>Trainvy</strong> coleta apenas os dados essenciais para o funcionamento do seu planejamento de treinos e acompanhamento da sua evolução:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>
              <strong>Identidade e autenticação:</strong> Nome, e-mail e foto de perfil fornecidos via Google OAuth ou login por e-mail.
            </li>
            <li>
              <strong>Dados corporais de referência:</strong> Peso, altura, idade e estimativa de gordura informados voluntariamente no onboarding ou perfil.
            </li>
            <li>
              <strong>Registros de treinamento:</strong> Planos de treino, sessões executadas, séries, repetições, cargas, percepção de esforço (RIR), anotações e histórico de consistência.
            </li>
            <li>
              <strong>Aceites de IA e 3D:</strong> Conta, data e hora, recurso, versão, texto integral e hash do aviso, IP da conexão à API e navegador informado. O IP pode identificar um servidor intermediário quando há proxy. Também registramos autorizações de uso vinculadas ao aceite para auditoria, consultáveis pela administração autorizada.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-base font-semibold text-foreground">
            2. Como utilizamos as informações
          </h2>
          <p>
            Suas informações são utilizadas para calcular métricas de progresso, ordenar rotações de treino, manter streaks de consistência e fornecer o assistente virtual de periodização (Coach IA). Os registros de aceite documentam os avisos apresentados e sua manifestação de vontade, permitem verificar a versão aceita e apoiam auditoria e exercício regular de direitos. O aceite dos avisos de IA e 3D não altera a preferência separada de acesso ao histórico de treinos pela IA.
          </p>
          <p>
            <strong>Não vendemos</strong> nem compartilhamos seus dados pessoais com anunciantes terceiros.
          </p>
        </section>

        <section className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-base font-semibold text-foreground">
            3. Recursos de Inteligência Artificial (Coach IA)
          </h2>
          <p>
            O Trainvy utiliza o modelo <strong>Google Gemini 2.5 Flash</strong> (via Vercel AI SDK) para processar solicitações de montagem de treino. As mensagens enviadas no chat contêm apenas o contexto técnico necessário para formular sua periodização. Nenhuma informação financeira ou credencial é enviada ao modelo.
          </p>
        </section>

        <section className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-base font-semibold text-foreground">
            4. Armazenamento e Segurança
          </h2>
          <p>
            Seus dados são armazenados de forma estruturada em servidores de banco de dados na nuvem com conexões criptografadas (SSL/TLS). O acesso é estritamente isolado por identificador de usuário (multi-tenant com controle de ownership).
          </p>
        </section>

        <section className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-base font-semibold text-foreground">
            5. Seus direitos e exclusão
          </h2>
          <p>
            Você pode solicitar a qualquer momento a visualização, correção ou exclusão definitiva de sua conta e histórico de treinos entrando em contato pelo canal de feedback do aplicativo ou via suporte do projeto.
          </p>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground/90">
            <strong>Nota sobre o Beta:</strong> Como esta é uma versão de testes preliminar, funcionalidades e termos podem ser atualizados periodicamente mediante aviso aos atletas participantes.
          </div>
        </section>
      </main>
    </div>
  );
}
