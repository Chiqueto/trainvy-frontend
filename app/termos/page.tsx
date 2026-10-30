import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Logo } from "@/app/_components/logo";

export const metadata = {
  title: "Termos de Uso — Trainvy",
  description: "Termos e condições de uso da versão Beta do aplicativo Trainvy.",
};

export default function TermsPage() {
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
            <FileText className="size-3.5" />
            Condições de Acesso
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
            Termos de Uso
          </h1>
          <p className="text-xs text-muted-foreground">
            Última atualização: Outubro de 2026 • Versão Beta Fechada
          </p>
        </div>

        <section className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-base font-semibold text-foreground">
            1. Natureza do Serviço Beta
          </h2>
          <p>
            O <strong>Trainvy</strong> é uma plataforma de organização de rotinas de treinamento físico, acompanhamento de cargas e periodização inteligente. O acesso atual ocorre sob regime de <em>beta fechado</em>, voltado a validação de performance, estabilidade e experiência do usuário.
          </p>
        </section>

        <section className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-base font-semibold text-foreground">
            2. Limitações e orientação profissional
          </h2>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 leading-relaxed">
            <strong>AVISO IMPORTANTE:</strong> O Trainvy não é um dispositivo médico e suas sugestões não substituem consultas médicas, exames pré-participação ou a orientação presencial de profissionais de Educação Física e Fisioterapia.
          </div>
          <p>
            Antes de iniciar qualquer programa de exercícios de alta intensidade, consulte um médico qualificado para avaliar sua aptidão física.
          </p>
        </section>

        <section className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-base font-semibold text-foreground">
            3. Execução dos Exercícios e Cargas
          </h2>
          <p>
            Cargas, cadência e execução devem considerar suas condições e a orientação de um profissional habilitado. As ilustrações do catálogo e animações 3D são referências educativas simplificadas, podem conter imprecisões e não avaliam sua execução. As cores musculares são ilustrativas e não representam EMG ou intensidade real de esforço.
          </p>
          <p>
            A geração pessoal de treinos com IA e a visualização 3D exigem aceites separados, registrados na sua conta. Sugestões da IA podem conter erros, continuam editáveis e não recebem aprovação profissional pelo simples aceite ou salvamento. Recomenda-se revisão profissional antes de executar. O aceite não implica renúncia a direitos nem exclui responsabilidades legais do Trainvy.
          </p>
        </section>

        <section className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-base font-semibold text-foreground">
            4. Limites de Uso da IA no Beta
          </h2>
          <p>
            Para garantir custos previsíveis e equidade de acesso a todos os atletas durante a fase de testes, o Coach IA opera com limites configuráveis diários e por minuto. O Trainvy reserva-se o direito de ajustar essas cotas conforme a capacidade operacional do sistema.
          </p>
        </section>

        <section className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-base font-semibold text-foreground">
            5. Contato e Feedback
          </h2>
          <p>
            Sugestões, dúvidas ou relatórios de inconsistências devem ser encaminhados pelo botão de <strong>Feedback</strong> no menu do perfil ou pelo canal oficial do projeto.
          </p>
        </section>
      </main>
    </div>
  );
}
