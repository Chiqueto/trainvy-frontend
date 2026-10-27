"use client";
import { serializeAdvancedPrescription } from "@/app/planning/_lib/workout-plan-builder";

import { useRef, useState } from "react";
import {
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

import type { GenerateCoachPrescriptionDraftWithAi200 } from "@/app/_lib/api/fetch-generated";
import { generateCoachPrescriptionWithAiAction } from "@/app/personal/_actions";
import {
  formatRecordingTime,
  useVoiceRecorder,
} from "@/app/_hooks/use-voice-recorder";
import type { WorkoutPlanDraftDay } from "@/app/planning/_lib/workout-plan-builder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CoachAiPrescriptionModalProps {
  athleteId: string;
  athleteName: string;
  isOpen: boolean;
  onClose: () => void;
  onApplyPrescription: (data: {
    name: string;
    notes?: string | null;
    workoutDays: WorkoutPlanDraftDay[];
  }) => void;
}

const PRESET_SUGGESTIONS = [
  "ABC Hipertrofia (Push/Pull/Legs)",
  "Upper/Lower 4x (Força & Hipertrofia)",
  "Full Body 3x Iniciante",
  "Foco em Quadríceps & Glúteos",
  "ABCDE Avançado com foco em Dorsais",
];

export function CoachAiPrescriptionModal({
  athleteId,
  athleteName,
  isOpen,
  onClose,
  onApplyPrescription,
}: CoachAiPrescriptionModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Anexo de arquivo (PDF ou imagem de ficha antiga)
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
    useState<GenerateCoachPrescriptionDraftWithAi200 | null>(null);

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
      toast.success(`Arquivo "${file.name}" anexado!`);
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
            file: recorded.blob as File,
            dataUrl: recorded.dataUrl,
            mediaType: recorded.mediaType,
            filename: recorded.filename,
          });
          toast.success("Comando de voz gravado e anexado!");
        }
      } catch {
        toast.error("Erro ao finalizar gravação.");
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
    const effectivePrompt =
      prompt.trim() ||
      (attachedFile
        ? "Interprete as diretrizes contidas no anexo e elabore a melhor prescrição técnica."
        : "");

    if (!effectivePrompt && !attachedFile) {
      toast.error(
        "Por favor, digite uma instrução, grave um áudio ou anexe um arquivo.",
      );
      return;
    }

    setIsGenerating(true);

    const res = await generateCoachPrescriptionWithAiAction({
      athleteId,
      prompt: effectivePrompt,
      fileUrl: attachedFile?.dataUrl,
      mediaType: attachedFile?.mediaType,
      filename: attachedFile?.filename,
    });

    if (res.success && res.data) {
      setGeneratedDraft(res.data);
      toast.success("Prescrição gerada pelo Coach AI!");
    } else {
      toast.error(res.error || "Não foi possível gerar a prescrição com IA.");
    }
    setIsGenerating(false);
  };

  const handleApply = () => {
    if (!generatedDraft) return;

    const mappedDays: WorkoutPlanDraftDay[] = generatedDraft.workoutDays.map(
      (d) => ({
        name: d.name,
        weekDay: d.weekDay,
        isRest: d.isRest,
        estimatedDurationInMinutes:
          d.estimatedDurationInMinutes || (d.isRest ? 0 : 60),
        exercises: (d.exercises || []).map((e) => {
          const name = e.name.trim();
          let alt1 = e.alternative1Name?.trim() || "";
          let alt2 = e.alternative2Name?.trim() || "";

          if (alt1 && alt1.toLowerCase() === name.toLowerCase()) alt1 = "";
          if (alt2 && alt2.toLowerCase() === name.toLowerCase()) alt2 = "";
          if (alt1 && alt2 && alt1.toLowerCase() === alt2.toLowerCase())
            alt2 = "";
          if (!alt1 && alt2) {
            alt1 = alt2;
            alt2 = "";
          }

          return {
            name,
            sets: e.sets || 3,
            warmupSets: e.warmupSets ?? 0,
            reps: e.reps || 10,
            ...serializeAdvancedPrescription(e),
            restTimeInSeconds: e.restTimeInSeconds || 90,
            alternative1Name: alt1,
            alternative2Name: alt2,
          };
        }),
      }),
    );

    onApplyPrescription({
      name: generatedDraft.name,
      notes: generatedDraft.notes,
      workoutDays: mappedDays,
    });

    toast.success("Estrutura da IA aplicada ao construtor de treinos!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Barra superior de destaque */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-1.5">
                <span>Prescrever com Coach AI</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-primary/15 text-primary border-none"
                >
                  Assistente
                </Badge>
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Para o aluno:{" "}
                <strong className="text-foreground">{athleteName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!generatedDraft ? (
            <>
              {/* Sugestões Rápidas */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-heading font-semibold text-muted-foreground uppercase tracking-wider">
                  Divisões Rápidas
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_SUGGESTIONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPrompt(preset)}
                      className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instruções do Treinador */}
              <div className="space-y-1.5">
                <label className="text-xs font-heading font-semibold text-foreground">
                  Diretrizes da Prescrição
                </label>
                <textarea
                  placeholder="Ex: Prescreva uma rotina ABC para hipertrofia, 4 exercícios por dia, 3 séries válidas e aquecimento no primeiro composto. Foque em deltoides laterais e posteriores de coxa..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full rounded-2xl border border-input bg-background p-3 text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary resize-none min-h-[90px]"
                />
              </div>

              {/* Anexo de Arquivo Oculto */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="application/pdf,image/*"
                className="hidden"
              />

              {/* Chip de Anexo Ativo */}
              {attachedFile && (
                <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    {attachedFile.mediaType.startsWith("audio/") ? (
                      <Mic className="size-4 text-primary shrink-0" />
                    ) : (
                      <FileText className="size-4 text-primary shrink-0" />
                    )}
                    <span className="truncate font-medium text-foreground">
                      {attachedFile.filename}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )}

              {/* Gravação de Voz Ativa */}
              {voiceRecorder.isRecording && (
                <div className="flex items-center justify-between rounded-2xl border border-red-500/40 bg-red-500/10 p-3 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
                    </span>
                    <span className="font-heading text-xs font-semibold text-red-500">
                      Gravando instrução por voz...
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatRecordingTime(voiceRecorder.recordingSeconds)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={voiceRecorder.cancelRecording}
                      className="h-7 text-xs text-muted-foreground"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleToggleVoiceRecord}
                      className="h-7 gap-1 bg-red-600 px-2.5 text-xs text-white hover:bg-red-700"
                    >
                      <Square className="size-3 fill-current" />
                      <span>Concluir</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Ações de Mídia (Voz & Anexo) */}
              {!voiceRecorder.isRecording && (
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleToggleVoiceRecord}
                    className="h-8 gap-1.5 text-xs rounded-xl border-border/80"
                  >
                    <Mic className="size-3.5 text-primary" />
                    <span>Ditar por Voz</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 gap-1.5 text-xs rounded-xl border-border/80"
                  >
                    <Paperclip className="size-3.5 text-primary" />
                    <span>Anexar Ficha (PDF/Foto)</span>
                  </Button>
                </div>
              )}

              {/* Mensagem de Erro */}
            </>
          ) : (
            /* Visualização da Prescrição Gerada */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0" />
                  <span className="font-heading text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Prescrição Estruturada com Sucesso!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setGeneratedDraft(null)}
                  className="text-[11px] text-muted-foreground hover:underline"
                >
                  Gerar Outra
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-muted/30 p-3.5 space-y-1">
                <h4 className="font-heading text-sm font-bold text-foreground">
                  {generatedDraft.name}
                </h4>
                {generatedDraft.notes && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {generatedDraft.notes}
                  </p>
                )}
              </div>

              {/* Lista dos Dias Gerados */}
              <div className="space-y-2">
                <span className="font-heading text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Dias Configurados ({generatedDraft.workoutDays.length})
                </span>
                <div className="space-y-2">
                  {generatedDraft.workoutDays.map((day, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border bg-card p-3 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-xs font-bold text-foreground">
                          {day.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {day.isRest
                            ? "Descanso"
                            : `${day.exercises.length} exercícios • ${day.estimatedDurationInMinutes} min`}
                        </Badge>
                      </div>

                      {!day.isRest && day.exercises.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {day.exercises.map((ex, exIdx) => (
                            <div
                              key={exIdx}
                              className="flex items-center justify-between text-[11px] text-muted-foreground"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <Dumbbell className="size-3 text-primary shrink-0" />
                                <span className="font-medium text-foreground truncate">
                                  {ex.name}
                                </span>
                              </div>
                              <span className="shrink-0 font-mono text-[10px]">
                                {ex.warmupSets > 0 && `${ex.warmupSets} Aq + `}
                                {ex.sets}x{ex.reps} • {ex.restTimeInSeconds}s
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé / Ações */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs rounded-xl"
          >
            Cancelar
          </Button>

          {!generatedDraft ? (
            <Button
              type="button"
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating || voiceRecorder.isRecording}
              className="gap-1.5 text-xs font-bold rounded-xl shadow-xs"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Estruturando Treino...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  <span>Gerar com Coach AI</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="gap-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-xl shadow-sm hover:bg-primary/90"
            >
              <Check className="size-3.5" />
              <span>Aplicar ao Construtor</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
