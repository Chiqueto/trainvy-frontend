"use client";
import { serializeAdvancedPrescription } from "@/app/planning/_lib/workout-plan-builder";

import { useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Brain,
  Check,
  Dumbbell,
  FileText,
  Loader2,
  Mic,
  Paperclip,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import type { GenerateWorkoutPlanDraftWithAi200 } from "@/app/_lib/api/fetch-generated";
import { generateWorkoutPlanWithAiAction } from "@/app/planning/_actions";
import {
  formatRecordingTime,
  useVoiceRecorder,
} from "@/app/_hooks/use-voice-recorder";
import type { WorkoutPlanDraftDay } from "@/app/planning/_lib/workout-plan-builder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AthleteAiWorkoutPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPlan: (data: {
    name: string;
    notes?: string | null;
    workoutDays: WorkoutPlanDraftDay[];
  }) => void;
}

const PRESET_SUGGESTIONS = [
  "ABC Hipertrofia (Push/Pull/Legs)",
  "Upper/Lower 4x (Força & Volume)",
  "Full Body 3x Iniciante",
  "Foco em Quadríceps & Glúteos 4x",
  "Interpretar minha ficha antiga anexada",
];

export function AthleteAiWorkoutPlanModal({
  isOpen,
  onClose,
  onApplyPlan,
}: AthleteAiWorkoutPlanModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Anexo de arquivo (PDF de ficha ou foto de academia)
  const [attachedFile, setAttachedFile] = useState<{
    file: File;
    dataUrl: string;
    mediaType: string;
    filename: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceRecorder = useVoiceRecorder();

  // Resultado gerado pela IA
  const [generatedDraft, setGeneratedDraft] =
    useState<GenerateWorkoutPlanDraftWithAi200 | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("O arquivo excede o limite máximo de 15MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedFile({
        file,
        dataUrl: reader.result as string,
        mediaType: file.type || "application/octet-stream",
        filename: file.name,
      });
      toast.success(`Ficha "${file.name}" anexada com sucesso!`);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleToggleVoiceRecord = async () => {
    if (voiceRecorder.isRecording) {
      try {
        const recorded = await voiceRecorder.stopRecording();
        if (recorded) {
          setAttachedFile({
            file: recorded.blob as unknown as File,
            dataUrl: recorded.dataUrl,
            mediaType: recorded.mediaType,
            filename: recorded.filename,
          });
          toast.success("Áudio gravado com sucesso!");
        }
      } catch {
        toast.error("Falha ao processar gravação de voz.");
      }
    } else {
      try {
        await voiceRecorder.startRecording();
      } catch {
        toast.error("Permissão de microfone negada ou indisponível.");
      }
    }
  };

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt && !attachedFile) {
      setError("Digite uma instrução ou anexe um áudio/arquivo da sua ficha.");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const res = await generateWorkoutPlanWithAiAction({
        prompt:
          trimmedPrompt ||
          "Interprete o arquivo em anexo e monte a rotina de treinos ideal.",
        fileUrl: attachedFile?.dataUrl,
        mediaType: attachedFile?.mediaType,
        filename: attachedFile?.filename,
      });

      if (!res.success) {
        setError(
          res.error || "Não foi possível gerar a rotina com o Coach IA.",
        );
      } else {
        setGeneratedDraft(res.data);
        toast.success("Rotina de treinos gerada pelo Coach IA!");
      }
    } catch {
      setError("Falha de conexão com o servidor. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedDraft) return;

    // Converte os dias gerados para a estrutura do WorkoutPlanBuilder
    const convertedDays: WorkoutPlanDraftDay[] = generatedDraft.workoutDays.map(
      (day, dayIdx) => {
        const dayLetter = String.fromCharCode(65 + (dayIdx % 26));
        return {
          name: day.name || `Treino ${dayLetter}`,
          weekDay: day.weekDay,
          isRest: day.isRest,
          estimatedDurationInMinutes: day.isRest
            ? 0
            : day.estimatedDurationInMinutes || 60,
          coverImageUrl: null,
          exercises: day.isRest
            ? []
            : day.exercises.map((ex, exIdx) => ({
                name: ex.name,
                order: exIdx + 1,
                sets: ex.sets || 3,
                warmupSets: ex.warmupSets ?? 0,
                reps: ex.reps || 10,
                ...serializeAdvancedPrescription(ex),
                restTimeInSeconds: ex.restTimeInSeconds || 90,
                notes: null,
                alternative1Name: ex.alternative1Name || "",
                alternative2Name: ex.alternative2Name || "",
              })),
        };
      },
    );

    onApplyPlan({
      name: generatedDraft.name || "Novo Plano de Treino",
      notes: generatedDraft.notes,
      workoutDays: convertedDays,
    });

    toast.success("Rotina aplicada no construtor de treinos!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">
                Criar Treino com o Coach IA
              </h3>
              <p className="text-xs text-muted-foreground">
                Fale por voz, anexe PDF/foto da sua ficha, ou descreva sua
                rotina
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

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive text-xs font-medium">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form de Entrada */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-heading text-xs font-bold text-foreground">
                O que você deseja treinar?
              </label>
              <div className="flex items-center gap-1.5">
                {/* Botão de Anexo de Arquivo */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="application/pdf,image/*,audio/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 px-2.5 rounded-xl font-heading text-xs gap-1 text-muted-foreground hover:text-foreground"
                  title="Anexar PDF da academia ou foto da ficha"
                >
                  <Paperclip className="size-3.5" />
                  <span>Anexar Ficha (PDF/Foto)</span>
                </Button>

                {/* Botão de Gravação de Áudio */}
                <Button
                  type="button"
                  variant={
                    voiceRecorder.isRecording ? "destructive" : "outline"
                  }
                  size="sm"
                  onClick={handleToggleVoiceRecord}
                  className="h-8 px-2.5 rounded-xl font-heading text-xs gap-1"
                >
                  {voiceRecorder.isRecording ? (
                    <>
                      <Square className="size-3.5 fill-current animate-pulse" />
                      <span>
                        {formatRecordingTime(voiceRecorder.recordingSeconds)}
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic className="size-3.5 text-primary" />
                      <span>Falar por Voz</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Arquivo Anexado */}
            {attachedFile && (
              <div className="flex items-center justify-between p-3 rounded-2xl border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="size-4 text-primary shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate">
                    {attachedFile.filename}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-bold py-0"
                  >
                    {attachedFile.mediaType.includes("pdf") ? "PDF" : "Anexo"}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-muted-foreground hover:text-destructive p-1 rounded-md"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )}

            {/* Textarea de Instrução */}
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: 'Quero um treino ABC de hipertrofia focado em superiores', ou 'Anexei o PDF da minha ficha da academia, monte os treinos com aquecimento e substituições'..."
              className="w-full rounded-2xl border border-border/80 bg-background/80 p-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-none"
            />

            {/* Chips de Sugestão */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-heading font-semibold text-muted-foreground">
                Sugestões rápidas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setPrompt(sug)}
                    className="px-2.5 py-1 rounded-full border border-border/70 bg-card/60 hover:bg-card hover:border-primary/50 text-[11px] font-heading text-muted-foreground hover:text-foreground transition-all"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              disabled={isGenerating || (!prompt.trim() && !attachedFile)}
              onClick={handleGenerate}
              className="w-full h-11 rounded-2xl font-heading text-xs font-bold gap-2 shadow-md"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Analisando e gerando rotina de treinos...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>Gerar Rotina com IA</span>
                </>
              )}
            </Button>
          </div>

          {/* Resultado Gerado para Revisão */}
          {generatedDraft && (
            <div className="pt-3 border-t border-border/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                    Proposta Gerada pelo Coach IA
                  </span>
                  <h4 className="font-heading text-base font-bold text-foreground">
                    {generatedDraft.name}
                  </h4>
                  {generatedDraft.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {generatedDraft.notes}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={handleApply}
                  className="rounded-xl font-heading text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20"
                >
                  <Check className="size-3.5" />
                  <span>Aplicar no Plano</span>
                </Button>
              </div>

              {/* Lista dos Dias Gerados */}
              <div className="space-y-3">
                {generatedDraft.workoutDays.map((day, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-border/80 bg-background/50 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-xs font-bold text-foreground">
                          {day.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold py-0"
                        >
                          {day.weekDay}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {day.isRest
                          ? "Descanso"
                          : `${day.exercises.length} exercícios • ~${day.estimatedDurationInMinutes}min`}
                      </span>
                    </div>

                    {!day.isRest && day.exercises.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {day.exercises.map((ex, exIdx) => (
                          <div
                            key={exIdx}
                            className="flex items-center justify-between text-xs p-2 rounded-xl bg-card border border-border/50"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-muted-foreground font-mono text-[10px]">
                                {exIdx + 1}.
                              </span>
                              <span className="font-heading font-medium text-foreground truncate">
                                {ex.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground text-[11px]">
                              {ex.warmupSets > 0 && (
                                <span className="text-amber-500 font-semibold">
                                  {ex.warmupSets} aq +
                                </span>
                              )}
                              <span className="font-bold text-foreground">
                                {ex.sets}x{ex.reps}
                              </span>
                              <span>• {ex.restTimeInSeconds}s</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
