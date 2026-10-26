"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Dumbbell,
  TrendingUp,
  UserRound,
  Users,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatOpenButton } from "@/app/_components/chat-open-button";

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
    | "my-workout";
  isCoach?: boolean;
}

export function BottomNav({ activePage, isCoach }: BottomNavProps) {
  const pathname = usePathname();

  const isPersonalRoute = Boolean(
    pathname && (pathname === "/personal" || pathname.startsWith("/personal/")),
  );

  const [clientIsCoach, setClientIsCoach] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("trainvy_is_coach") === "true";
      } catch {
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    if (isCoach !== undefined) {
      setClientIsCoach(isCoach);
      try {
        localStorage.setItem("trainvy_is_coach", isCoach ? "true" : "false");
      } catch {
        // ignore storage errors
      }
    } else if (isPersonalRoute) {
      setClientIsCoach(true);
      try {
        localStorage.setItem("trainvy_is_coach", "true");
      } catch {
        // ignore storage errors
      }
    }
  }, [isCoach, isPersonalRoute]);

  const effectiveIsCoach = isCoach ?? (isPersonalRoute || clientIsCoach);

  // Mapeamentos de estado ativo por rota e prop
  const isAthletesActive = activePage
    ? activePage === "personal" || activePage === "athletes"
    : isPersonalRoute;

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
            !isAthletesActive),
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
      className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-border bg-background/95 px-3 pt-2 shadow-lg backdrop-blur-md"
      style={{
        paddingBottom:
          "max(0.75rem, calc(0.5rem + env(safe-area-inset-bottom, 0px)))",
      }}
      aria-label="Navegação inferior"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end justify-items-center">
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

            {/* 2. Prescrições */}
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
              aria-label="Prescrições"
            >
              <ClipboardList
                className={cn(
                  "size-5 transition-transform duration-150 group-active:scale-90",
                  effectivePlanningActive
                    ? "text-primary text-foreground"
                    : "text-muted-foreground",
                )}
              />
              <span className="mt-0.5 font-heading text-[11px] leading-tight tracking-tight">
                Prescrições
              </span>
              {effectivePlanningActive && (
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

            {/* 5. Perfil Pro */}
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

            {/* 3. Coach */}
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
    </nav>
  );
}

