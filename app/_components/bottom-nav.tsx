"use client";

import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Dumbbell,
  TrendingUp,
  UserRound,
  Users,
  ClipboardList,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatOpenButton } from "@/app/_components/chat-open-button";
import { ThemeToggle } from "@/components/theme-toggle";

export interface BottomNavProps {
  activePage?:
    | "home"
    | "planning"
    | "calendar"
    | "stats"
    | "evolution"
    | "profile"
    | "personal"
    | "athletes"
    | "prescriptions"
    | "templates"
    | "exercises"
    | "my-workout";
  isCoach?: boolean;
}

function subscribeCoachPreference(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("trainvy-coach-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("trainvy-coach-change", onChange);
  };
}

function readCoachPreference() {
  try {
    return localStorage.getItem("trainvy_is_coach") === "true";
  } catch {
    return false;
  }
}

export function BottomNav({ activePage, isCoach }: BottomNavProps) {
  const pathname = usePathname();

  const isPersonalRoute = Boolean(
    pathname && (pathname === "/personal" || pathname.startsWith("/personal/")),
  );

  const clientIsCoach = useSyncExternalStore(
    subscribeCoachPreference,
    readCoachPreference,
    () => false,
  );

  useEffect(() => {
    if (isCoach !== undefined) {
      try {
        localStorage.setItem("trainvy_is_coach", isCoach ? "true" : "false");
        window.dispatchEvent(new Event("trainvy-coach-change"));
      } catch {
        // ignore storage errors
      }
    } else if (isPersonalRoute) {
      try {
        localStorage.setItem("trainvy_is_coach", "true");
        window.dispatchEvent(new Event("trainvy-coach-change"));
      } catch {
        // ignore storage errors
      }
    }
  }, [isCoach, isPersonalRoute]);

  const effectiveIsCoach = isCoach ?? (isPersonalRoute || clientIsCoach);

  const isTemplatesRoute = Boolean(
    pathname &&
      (pathname === "/personal/modelos" ||
        pathname.startsWith("/personal/modelos/")),
  );

  const isExercisesRoute = Boolean(
    pathname &&
      (pathname === "/personal/exercicios" ||
        pathname.startsWith("/personal/exercicios/")),
  );

  // Mapeamentos de estado ativo por rota e prop
  const isAthletesActive = activePage
    ? activePage === "personal" || activePage === "athletes"
    : Boolean(isPersonalRoute && !isTemplatesRoute && !isExercisesRoute);

  const isTemplatesActive = activePage
    ? activePage === "templates"
    : isTemplatesRoute;

  const isPlanningActive = activePage
    ? activePage === "planning" ||
      activePage === "calendar" ||
      activePage === "prescriptions"
    : Boolean(
        pathname &&
        (pathname === "/planning" ||
          pathname.startsWith("/planning/") ||
          pathname === "/workout-plans" ||
          pathname.startsWith("/workout-plans/")),
      );

  const isEvolutionActive = activePage
    ? activePage === "stats" || activePage === "evolution"
    : Boolean(
        pathname &&
        (pathname === "/stats" ||
          pathname.startsWith("/stats/") ||
          pathname === "/history" ||
          pathname.startsWith("/history/")),
      );

  const isProfileActive = activePage
    ? activePage === "profile"
    : Boolean(
        pathname &&
        (pathname === "/profile" || pathname.startsWith("/profile/")),
      );

  const isHomeActive = activePage
    ? activePage === "home" || activePage === "my-workout"
    : Boolean(
        pathname === "/" ||
        (!isPlanningActive &&
          !isEvolutionActive &&
          !isProfileActive &&
          !isAthletesActive &&
          !isTemplatesActive),
      );

  const [optimisticTab, setOptimisticTab] = useState<string | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOptimisticTab(null);
  }

  const effectiveAthletesActive = optimisticTab
    ? optimisticTab === "athletes"
    : isAthletesActive;

  const effectiveTemplatesActive = optimisticTab
    ? optimisticTab === "templates"
    : isTemplatesActive;

  const effectivePlanningActive = optimisticTab
    ? optimisticTab === "planning"
    : isPlanningActive;

  const effectiveEvolutionActive = optimisticTab
    ? optimisticTab === "evolution"
    : isEvolutionActive;

  const effectiveProfileActive = optimisticTab
    ? optimisticTab === "profile"
    : isProfileActive;

  const effectiveHomeActive = optimisticTab
    ? optimisticTab === "home"
    : isHomeActive && !optimisticTab;

  return (
    <nav
      className="app-navigation fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-border bg-background/95 px-3 pt-2 shadow-lg backdrop-blur-md"
      style={{
        paddingBottom:
          "max(0.75rem, calc(0.5rem + env(safe-area-inset-bottom, 0px)))",
      }}
      aria-label="Navegação principal"
    >
      <Link
        href={effectiveIsCoach ? "/personal" : "/"}
        className="hidden lg:flex items-center gap-3 px-3 pb-8 pt-2"
        aria-label="Trainvy"
      >
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Dumbbell className="size-5" />
        </span>
        <span className="font-heading text-xl font-bold tracking-tight">
          trainvy
          <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {effectiveIsCoach ? "Área do personal" : "Seu treino, sua evolução"}
          </span>
        </span>
      </Link>
      <div className={cn(
        "mx-auto grid w-full items-end justify-items-center",
        effectiveIsCoach ? "max-w-xl grid-cols-6" : "max-w-lg grid-cols-5",
      )}>
        {effectiveIsCoach ? (
          <>
            {/* 1. Alunos (Gestão Pro do Personal) */}
            <Link
              href="/personal"
              prefetch={true}
              onClick={() => setOptimisticTab("athletes")}
              className={cn(
                "group relative flex w-full flex-1 flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all duration-150",
                effectiveAthletesActive
                  ? "bg-primary/10 font-semibold text-primary"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
              aria-label="Alunos"
              aria-current={effectiveAthletesActive ? "page" : undefined}
            >
              <Users
                className={cn(
                  "size-5 transition-transform duration-150 group-active:scale-90",
                  effectiveAthletesActive
                    ? "text-primary text-foreground"
                    : "text-muted-foreground",
                )}
              />
              <span className="mt-0.5 font-heading text-[11px] leading-tight tracking-tight">
                Alunos
              </span>
              {effectiveAthletesActive && (
                <span className="mt-0.5 h-0.5 w-4 rounded-full bg-primary" />
              )}
            </Link>

            {/* Biblioteca de modelos reutilizáveis para os alunos */}
            <Link
              href="/personal/modelos"
              prefetch={true}
              onClick={() => setOptimisticTab("templates")}
              className={cn(
                "group relative flex w-full flex-1 flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all duration-150",
                effectiveTemplatesActive
                  ? "bg-primary/10 font-semibold text-primary"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
              aria-label="Modelos de treino"
              aria-current={effectiveTemplatesActive ? "page" : undefined}
            >
              <ClipboardList
                className={cn(
                  "size-5 transition-transform duration-150 group-active:scale-90",
                  effectiveTemplatesActive
                    ? "text-primary text-foreground"
                    : "text-muted-foreground",
                )}
              />
              <span className="mt-0.5 font-heading text-[11px] leading-tight tracking-tight">
                Modelos
              </span>
              {effectiveTemplatesActive && (
                <span className="mt-0.5 h-0.5 w-4 rounded-full bg-primary" />
              )}
            </Link>

            {/* 3. Trainvy AI Pro */}
            <Suspense
              fallback={
                <div className="flex w-full flex-1 flex-col items-center justify-center -mt-3.5">
                  <div className="size-11 rounded-full bg-primary/80" />
                  <span className="mt-1 font-heading text-[11px] text-muted-foreground">
                    Coach
                  </span>
                </div>
              }
            >
              <ChatOpenButton />
            </Suspense>

            {/* 4. Meu Treino (Rotina pessoal de atleta do Personal) */}
            <Link
              href="/"
              prefetch={true}
              onClick={() => setOptimisticTab("home")}
              className={cn(
                "group relative flex w-full flex-1 flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all duration-150",
                effectiveHomeActive
                  ? "bg-primary/10 font-semibold text-primary"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
              aria-label="Meu Treino"
              aria-current={effectiveHomeActive ? "page" : undefined}
            >
              <Dumbbell
                className={cn(
                  "size-5 transition-transform duration-150 group-active:scale-90",
                  effectiveHomeActive
                    ? "text-primary text-foreground"
                    : "text-muted-foreground",
                )}
              />
              <span className="mt-0.5 font-heading text-[11px] leading-tight tracking-tight">
                Meu Treino
              </span>
              {effectiveHomeActive && (
                <span className="mt-0.5 h-0.5 w-4 rounded-full bg-primary" />
              )}
            </Link>

            <Link
              href="/planning"
              prefetch={true}
              onClick={() => setOptimisticTab("planning")}
              className={cn(
                "group relative flex w-full flex-1 flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all duration-150",
                effectivePlanningActive
                  ? "bg-primary/10 font-semibold text-primary"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
              aria-label="Meu planejamento"
              aria-current={effectivePlanningActive ? "page" : undefined}
              title="Organize seus próprios planos e ciclos de treino"
            >
              <CalendarDays className="size-5 transition-transform duration-150 group-active:scale-90" />
              <span className="mt-0.5 font-heading text-[11px] leading-tight tracking-tight">
                <span className="lg:hidden">Planejar</span>
                <span className="hidden lg:inline">Meu planejamento</span>
              </span>
              {effectivePlanningActive && (
                <span className="mt-0.5 h-0.5 w-4 rounded-full bg-primary" />
              )}
            </Link>

            {/* Perfil Pro */}
            <Link
              href="/profile"
              prefetch={true}
              onClick={() => setOptimisticTab("profile")}
              className={cn(
                "group relative flex w-full flex-1 flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all duration-150",
                effectiveProfileActive
                  ? "bg-primary/10 font-semibold text-primary"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
              aria-label="Perfil"
              aria-current={effectiveProfileActive ? "page" : undefined}
            >
              <UserRound
                className={cn(
                  "size-5 transition-transform duration-150 group-active:scale-90",
                  effectiveProfileActive
                    ? "text-primary text-foreground"
                    : "text-muted-foreground",
                )}
              />
              <span className="mt-0.5 font-heading text-[11px] leading-tight tracking-tight">
                Perfil
              </span>
              {effectiveProfileActive && (
                <span className="mt-0.5 h-0.5 w-4 rounded-full bg-primary" />
              )}
            </Link>
          </>
        ) : (
          <>
            {/* Modo Atleta Padrão */}
            {/* 1. Início */}
            <Link
              href="/"
              prefetch={true}
              onClick={() => setOptimisticTab("home")}
              className={cn(
                "group relative flex w-full flex-1 flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all duration-150",
                effectiveHomeActive
                  ? "bg-primary/10 font-semibold text-primary"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
              aria-label="Início"
              aria-current={effectiveHomeActive ? "page" : undefined}
            >
              <House
                className={cn(
                  "size-5 transition-transform duration-150 group-active:scale-90",
                  effectiveHomeActive
                    ? "text-primary text-foreground"
                    : "text-muted-foreground",
                )}
              />
              <span className="mt-0.5 font-heading text-[11px] leading-tight tracking-tight">
                Início
              </span>
              {effectiveHomeActive && (
                <span className="mt-0.5 h-0.5 w-4 rounded-full bg-primary" />
              )}
            </Link>

            {/* 2. Treinos */}
            <Link
              href="/planning"
              prefetch={true}
              onClick={() => setOptimisticTab("planning")}
              className={cn(
                "group relative flex w-full flex-1 flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all duration-150",
                effectivePlanningActive
                  ? "bg-primary/10 font-semibold text-primary"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
              aria-label="Treinos"
              aria-current={effectivePlanningActive ? "page" : undefined}
            >
              <Dumbbell
                className={cn(
                  "size-5 transition-transform duration-150 group-active:scale-90",
                  effectivePlanningActive
                    ? "text-primary text-foreground"
                    : "text-muted-foreground",
                )}
              />
              <span className="mt-0.5 font-heading text-[11px] leading-tight tracking-tight">
                Treinos
              </span>
              {effectivePlanningActive && (
                <span className="mt-0.5 h-0.5 w-4 rounded-full bg-primary" />
              )}
            </Link>

            {/* 3. Trainvy AI */}
            <Suspense
              fallback={
                <div className="flex w-full flex-1 flex-col items-center justify-center -mt-3.5">
                  <div className="size-11 rounded-full bg-primary/80" />
                  <span className="mt-1 font-heading text-[11px] text-muted-foreground">
                    Coach
                  </span>
                </div>
              }
            >
              <ChatOpenButton />
            </Suspense>

            {/* 4. Evolução */}
            <Link
              href="/stats"
              prefetch={true}
              onClick={() => setOptimisticTab("evolution")}
              className={cn(
                "group relative flex w-full flex-1 flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all duration-150",
                effectiveEvolutionActive
                  ? "bg-primary/10 font-semibold text-primary"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
              aria-label="Evolução"
              aria-current={effectiveEvolutionActive ? "page" : undefined}
            >
              <TrendingUp
                className={cn(
                  "size-5 transition-transform duration-150 group-active:scale-90",
                  effectiveEvolutionActive
                    ? "text-primary text-foreground"
                    : "text-muted-foreground",
                )}
              />
              <span className="mt-0.5 font-heading text-[11px] leading-tight tracking-tight">
                Evolução
              </span>
              {effectiveEvolutionActive && (
                <span className="mt-0.5 h-0.5 w-4 rounded-full bg-primary" />
              )}
            </Link>

            {/* 5. Perfil */}
            <Link
              href="/profile"
              prefetch={true}
              onClick={() => setOptimisticTab("profile")}
              className={cn(
                "group relative flex w-full flex-1 flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all duration-150",
                effectiveProfileActive
                  ? "bg-primary/10 font-semibold text-primary"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
              aria-label="Perfil"
              aria-current={effectiveProfileActive ? "page" : undefined}
            >
              <UserRound
                className={cn(
                  "size-5 transition-transform duration-150 group-active:scale-90",
                  effectiveProfileActive
                    ? "text-primary text-foreground"
                    : "text-muted-foreground",
                )}
              />
              <span className="mt-0.5 font-heading text-[11px] leading-tight tracking-tight">
                Perfil
              </span>
              {effectiveProfileActive && (
                <span className="mt-0.5 h-0.5 w-4 rounded-full bg-primary" />
              )}
            </Link>
          </>
        )}
      </div>
      <div className="hidden lg:flex mt-auto pt-4 border-t border-border/70">
        <ThemeToggle showLabel className="w-full justify-start px-3 py-2.5 rounded-xl text-left" />
      </div>
    </nav>
  );
}
