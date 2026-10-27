import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authClient } from "@/app/_lib/auth-client";
import {
  getAthleteCoachProgressSharing,
  getAthleteCoachRelationship,
  getCommercialContext,
  getUserTrainData,
} from "@/app/_lib/api/fetch-generated";
import { BottomNav } from "@/app/_components/bottom-nav";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from "./_components/logout-button";
import { GamificationThemeSelector } from "./_components/gamification-theme-selector";
import Link from "next/link";
import { FeedbackButton } from "./_components/feedback-button";
import { PwaInstallCard } from "@/app/_components/pwa/pwa-install-card";
import { Logo } from "@/app/_components/logo";
import { ProfileMetricsSection } from "./_components/profile-metrics-section";
import { SportsProfileSection } from "./_components/sports-profile-section";
import { CoachAreaLinkCard } from "./_components/coach-area-link-card";
import { MyCoachSection } from "./_components/my-coach-section";
import { ArrowRight, Shield } from "lucide-react";

export default async function ProfilePage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session.data?.user) redirect("/auth");

  const [trainData, commercialRes, relationshipRes, sharingRes] =
    await Promise.all([
      getUserTrainData(),
      getCommercialContext({ cache: "no-store" }),
      getAthleteCoachRelationship({ cache: "no-store" }),
      getAthleteCoachProgressSharing({ cache: "no-store" }).catch(() => null),
    ]);

  if (trainData.status === 401) redirect("/auth");

  const commercialData =
    commercialRes.status === 200 ? commercialRes.data : null;
  const isCoach = commercialData?.accountType === "COACH";
  const isAdmin = commercialData?.systemRole === "ADMIN";

  const needsOnboarding =
    !isCoach &&
    ((trainData.status === 200 && !trainData.data) || trainData.status === 404);
  if (needsOnboarding) redirect("/onboarding");

  if (!isCoach && trainData.status !== 200) {
    throw new Error("Failed to fetch user train data");
  }

  const user = session.data.user;
  const data = trainData.status === 200 ? trainData.data : null;
  const relationship =
    relationshipRes.status === 200 && relationshipRes.data.hasCoach
      ? relationshipRes.data.relationship
      : null;
  const sharingConsent =
    sharingRes && sharingRes.status === 200 && sharingRes.data.sharingConsent
      ? sharingRes.data.sharingConsent
      : null;

  return (
    <div className="flex min-h-svh flex-col bg-background pb-24">
      <div className="flex h-[56px] items-center px-5">
        <Logo size="md" asLink />
      </div>

      <div className="flex flex-col items-center gap-5 px-5 pt-5">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="size-[52px]">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="text-lg">
                {user.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <h1 className="font-heading text-lg font-semibold leading-[1.05] text-foreground">
                {user.name}
              </h1>
              <p className="font-heading text-sm leading-[1.15] text-foreground/70">
                {commercialData?.plan?.name ?? "Plano Básico"}
              </p>
            </div>
          </div>
        </div>

        {/* Acesso rápido ao console para Administradores */}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex w-full items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 p-4 transition-all hover:bg-primary/15 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Shield className="size-5" />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="font-heading text-xs font-bold text-foreground">
                    Painel do Administrador
                  </span>
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-mono font-bold text-primary uppercase">
                    Admin
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Visão geral, gestão de usuários e assinaturas
                </span>
              </div>
            </div>
            <ArrowRight className="size-4 text-primary shrink-0" />
          </Link>
        )}

        {/* Acesso rápido exclusivo para Personal Trainer */}
        {isCoach && <CoachAreaLinkCard />}

        {/* Meu Treinador (para atletas) */}
        {!isCoach && (
          <MyCoachSection
            relationship={relationship}
            initialSharingConsent={sharingConsent}
          />
        )}

        <ProfileMetricsSection
          weightInGrams={data?.weightInGrams}
          heightInCentimeters={data?.heightInCentimeters}
          age={data?.age}
          bodyFatPercentage={data?.bodyFatPercentage}
          weightDiffInGrams={data?.weightDiffInGrams}
          bodyFatDiff={data?.bodyFatDiff}
        />

        <GamificationThemeSelector currentTheme={data?.gamificationTheme} />
        <SportsProfileSection />

        {/* Instalação do Aplicativo (PWA) */}
        <PwaInstallCard />

        {/* Feedback do Beta */}
        <FeedbackButton />

        {/* Seção de Créditos & Atribuições */}
        <div className="w-full rounded-xl border border-border/70 bg-card p-4 space-y-2 text-left shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-heading text-xs font-semibold text-foreground">
              Créditos & Atribuições
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">
              Licença Livre
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Exercise data by{" "}
            <a
              href="https://repdb.co"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline inline-flex items-center gap-0.5"
            >
              RepDB (repdb.co)
            </a>
            . Ilustrações e demonstrações biomecânicas fornecidas sob a licença
            aberta oficial do catálogo livre RepDB.
          </p>
        </div>

        {/* Links Institucionais: Privacidade & Termos */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
          <Link
            href="/privacidade"
            className="hover:text-foreground hover:underline transition-colors"
          >
            Privacidade
          </Link>
          <span>•</span>
          <Link
            href="/termos"
            className="hover:text-foreground hover:underline transition-colors"
          >
            Termos de Uso
          </Link>
        </div>

        <LogoutButton />
      </div>

      <BottomNav isCoach={isCoach} activePage="profile" />
    </div>
  );
}
