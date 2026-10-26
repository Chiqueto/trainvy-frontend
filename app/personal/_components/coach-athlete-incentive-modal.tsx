"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Flame,
  MessageCircle,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface IncentiveAthleteData {
  athleteId: string;
  name: string;
  email: string;
  workoutsThisWeekCount: number;
  lastWorkoutSessionAt?: string | null;
  hasActiveWorkoutPlan: boolean;
  activeWorkoutPlanName?: string | null;
  pendingPrescriptionsCount: number;
  activePrescription?: {
    id: string;
    status: string;
    name: string;
  } | null;
}

interface CoachAthleteIncentiveModalProps {
  athlete: IncentiveAthleteData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CoachAthleteIncentiveModal({
  athlete,
  isOpen,
  onClose,
}: CoachAthleteIncentiveModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<
    "kudos" | "return" | "prescription" | "general"
  >("general");
  const [copied, setCopied] = useState(false);

  // Calcula dias desde o último treino
  const daysSinceLastWorkout = useMemo(() => {
    if (!athlete?.lastWorkoutSessionAt) return null;
    const lastDate = new Date(athlete.lastWorkoutSessionAt).getTime();
    const now = Date.now();
    const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [athlete?.lastWorkoutSessionAt]);

  const firstName = useMemo(() => {
    if (!athlete?.name) return "atleta";
    return athlete.name.split(" ")[0];
  }, [athlete?.name]);

  const templates = useMemo(() => {
    const workouts = athlete?.workoutsThisWeekCount ?? 0;
    const planName = athlete?.activeWorkoutPlanName || "seu plano";

    return {
      kudos: `Fala ${firstName}! 🔥 Vi que você já completou ${workouts} ${
        workouts === 1 ? "treino" : "treinos"
      } esta semana no Trainvy! Parabéns pela disciplina e consistência, está no caminho certo. Segue firme no foco! 💪🏋️`,
      return: `E aí ${firstName}, tudo bem? 👊 Notei que você não registra treino ${
        daysSinceLastWorkout !== null
          ? `há cerca de ${daysSinceLastWorkout} dias`
          : "há algum tempo"
      }. Como está a rotina? Bora retomar o ritmo e manter o foco nos seus objetivos? Se precisar ajustar algo no treino, me avisa! 🚀`,
      prescription: `Fala ${firstName}! 📋 Acabei de preparar uma nova prescrição de treino personalizada para você no Trainvy. Entra no app para revisar e aceitar a nova ficha para a gente começar! Qualquer dúvida estou à disposição. ✨`,
      general: `Fala ${firstName}! Passando para acompanhar seus treinos e saber como você está se sentindo com a rotina atual no ${planName}. Alguma dúvida ou ajuste que queira fazer? Estou aqui! 🤜🤛`,
    };
  }, [firstName, athlete?.workoutsThisWeekCount, athlete?.activeWorkoutPlanName, daysSinceLastWorkout]);

  // Texto editável da mensagem atual
  const [customText, setCustomText] = useState("");

  // Atualiza texto quando troca template ou abre
  const activeText = customText || templates[selectedTemplate];

  if (!isOpen || !athlete) return null;

  const handleSelectTemplate = (
    type: "kudos" | "return" | "prescription" | "general",
  ) => {
    setSelectedTemplate(type);
    setCustomText(templates[type]);
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Falha ao copiar:", err);
    }
  };

  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(activeText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <MessageCircle className="size-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">
                Mensagem para {firstName}
              </h3>
              <p className="text-xs text-muted-foreground">
                Incentivo rápido e feedback via WhatsApp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/60 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Sugestões Rápidas de Template */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-heading font-semibold text-muted-foreground uppercase tracking-wider">
            Escolher Mensagem Rápida:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectTemplate("kudos")}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                selectedTemplate === "kudos"
                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                  : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <div className="flex items-center gap-1.5 font-heading text-xs font-bold">
                <Flame className="size-3.5 text-emerald-500 shrink-0" />
                <span>Parabenizar</span>
              </div>
              <span className="text-[10px] opacity-80 line-clamp-1">
                Foco e consistência
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTemplate("return")}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                selectedTemplate === "return"
                  ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                  : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <div className="flex items-center gap-1.5 font-heading text-xs font-bold">
                <Sparkles className="size-3.5 text-amber-500 shrink-0" />
                <span>Retomar Foco</span>
              </div>
              <span className="text-[10px] opacity-80 line-clamp-1">
                Aluno em alerta
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTemplate("prescription")}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                selectedTemplate === "prescription"
                  ? "border-blue-500/60 bg-blue-500/10 text-blue-400"
                  : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <div className="flex items-center gap-1.5 font-heading text-xs font-bold">
                <MessageSquare className="size-3.5 text-blue-500 shrink-0" />
                <span>Novo Treino</span>
              </div>
              <span className="text-[10px] opacity-80 line-clamp-1">
                Aviso de prescrição
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTemplate("general")}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                selectedTemplate === "general"
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <div className="flex items-center gap-1.5 font-heading text-xs font-bold">
                <MessageCircle className="size-3.5 text-primary shrink-0" />
                <span>Check-in Geral</span>
              </div>
              <span className="text-[10px] opacity-80 line-clamp-1">
                Acompanhamento
              </span>
            </button>
          </div>
        </div>

        {/* Textarea para customização */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-heading font-semibold text-muted-foreground">
            Texto da Mensagem (pode editar livremente):
          </span>
          <textarea
            rows={4}
            value={activeText}
            onChange={(e) => {
              setCustomText(e.target.value);
              setCopied(false);
            }}
            className="w-full rounded-2xl border border-border/80 bg-background/80 p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-none"
          />
        </div>

        {/* Ações */}
        <div className="flex gap-2.5 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="flex-1 rounded-xl h-10 font-heading text-xs font-semibold gap-1.5"
          >
            {copied ? (
              <>
                <Check className="size-4 text-emerald-500" />
                <span className="text-emerald-500 font-bold">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="size-4 text-muted-foreground" />
                <span>Copiar Texto</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={handleOpenWhatsApp}
            className="flex-1 rounded-xl h-10 font-heading text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20"
          >
            <MessageCircle className="size-4" />
            <span>Enviar no WhatsApp</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
