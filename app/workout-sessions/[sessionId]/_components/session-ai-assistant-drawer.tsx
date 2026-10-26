"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import {
  AlertCircle,
  ArrowUp,
  Bot,
  Check,
  Dumbbell,
  FileText,
  History,
  Loader2,
  Lock,
  Mic,
  Paperclip,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import { toast } from "sonner";

import type {
  ConfirmWorkoutSetProposal200CreatedSetsItem,
  ListWorkoutSetProposals200ProposalsItem,
} from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";
import {
  formatRecordingTime,
  useVoiceRecorder,
} from "@/app/_hooks/use-voice-recorder";

import {
  getAiConsentAction,
  listWorkoutSetProposalsAction,
  updateAiConsentAction,
} from "../_actions";
import { SetProposalCard } from "./set-proposal-card";

interface AttachedFileItem {
  file: File;
  dataUrl: string;
  mediaType: string;
  filename: string;
  size: number;
}

interface SessionAiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  selectedExerciseId?: string | null;
  selectedExerciseName?: string | null;
  onSetsConfirmed?: (
    createdSets: ConfirmWorkoutSetProposal200CreatedSetsItem[],
    sessionExerciseId: string,
  ) => void;
}

export function SessionAiAssistantDrawer({
  isOpen,
  onClose,
  sessionId,
  selectedExerciseId,
  selectedExerciseName,
  onSetsConfirmed,
}: SessionAiAssistantDrawerProps) {
  const [proposals, setProposals] = useState<ListWorkoutSetProposals200ProposalsItem[]>([]);
  const [hasHistoryConsent, setHasHistoryConsent] = useState(false);
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);
  const [showConsentInfo, setShowConsentInfo] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [pendingFiles, setPendingFiles] = useState<AttachedFileItem[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeConversationIdRef = useRef<string | null>(null);

  const voiceRecorder = useVoiceRecorder();

  // Carrega propostas ativas da sessão
  const loadProposals = useCallback(async () => {
    const res = await listWorkoutSetProposalsAction(sessionId);
    if (res.success) {
      setProposals(res.data.proposals);
    }
  }, [sessionId]);

  // Carrega histórico pré-existente da conversa desta sessão de treino
  const loadSessionConversation = useCallback(async (setMessagesFn: (msgs: any[]) => void) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/conversations?workoutSessionId=${sessionId}`,
        { credentials: "include" },
      );
      if (res.ok) {
        const data = await res.json();
        const convList = data.conversations || [];
        if (convList.length > 0) {
          const convId = convList[0].id;
          activeConversationIdRef.current = convId;
          const convRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/ai/conversations/${convId}`,
            { credentials: "include" },
          );
          if (convRes.ok) {
            const convData = await convRes.json();
            if (Array.isArray(convData.messages) && convData.messages.length > 0) {
              setMessagesFn(convData.messages);
            }
          }
        }
      }
    } catch {
      // Ignora erro de rede silenciosamente
    }
  }, [sessionId]);

  // Configuração do useChat com transporte contextualizado à sessão
  const {
    messages,
    sendMessage,
    setMessages,
    status,
  } = useChat({
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_API_URL}/ai`,
      credentials: "include",
      fetch: async (input, init) => {
        const response = await fetch(input, init);
        const newConvId = response.headers.get("x-conversation-id");
        if (newConvId) {
          activeConversationIdRef.current = newConvId;
        }
        return response;
      },
      body: () => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return {
          workoutSessionId: sessionId,
          ...(activeConversationIdRef.current
            ? { conversationId: activeConversationIdRef.current }
            : {}),
          ...(selectedExerciseId ? { sessionExerciseId: selectedExerciseId } : {}),
          ...(timezone ? { timezone } : {}),
        };
      },
    }),
    onFinish: () => {
      // Recarrega propostas caso o modelo tenha criado alguma durante a resposta
      loadProposals();
    },
  });

  // Carrega consentimento LGPD inicial e conversa da sessão
  useEffect(() => {
    if (isOpen) {
      getAiConsentAction().then((res) => {
        if (res.success) {
          setHasHistoryConsent(res.data.aiTrainingHistoryAccess);
        }
      });
      loadProposals();
      loadSessionConversation(setMessages);
    }
  }, [isOpen, loadProposals, loadSessionConversation, setMessages]);

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll ao receber novas mensagens
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, proposals, isOpen]);

  // Alterna consentimento de histórico LGPD
  const handleToggleConsent = async () => {
    if (isUpdatingConsent) return;
    setIsUpdatingConsent(true);
    const nextVal = !hasHistoryConsent;
    try {
      const res = await updateAiConsentAction({
        aiTrainingHistoryAccess: nextVal,
      });
      if (res.success) {
        setHasHistoryConsent(res.data.aiTrainingHistoryAccess);
      }
    } finally {
      setIsUpdatingConsent(false);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend ?? inputMessage).trim();
    if ((!text && pendingFiles.length === 0) || isLoading) return;

    const fileParts: FileUIPart[] = pendingFiles.map((f) => ({
      type: "file",
      mediaType: f.mediaType,
      filename: f.filename,
      url: f.dataUrl,
    }));

    if (fileParts.length > 0) {
      sendMessage({
        text: text || "Anexo para o treino",
        files: fileParts,
      });
    } else {
      sendMessage({ text });
    }

    setInputMessage("");
    setPendingFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Upload de arquivos (PDFs, imagens, áudios)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const MAX_SIZE = 15 * 1024 * 1024; // 15MB
    const newItems: AttachedFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_SIZE) {
        toast.error(`Arquivo ${file.name} excede o limite máximo de 15MB.`);
        continue;
      }

      const reader = new FileReader();
      const readPromise = new Promise<void>((resolve) => {
        reader.onloadend = () => {
          newItems.push({
            file,
            dataUrl: reader.result as string,
            mediaType: file.type || "application/octet-stream",
            filename: file.name,
            size: file.size,
          });
          resolve();
        };
      });
      reader.readAsDataURL(file);
      await readPromise;
    }

    setPendingFiles((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Gravação de voz em tempo real
  const handleToggleVoiceRecord = async () => {
    if (voiceRecorder.isRecording) {
      try {
        const recorded = await voiceRecorder.stopRecording();
        if (recorded) {
          // Envia o áudio imediatamente como comando de voz para a sessão
          const filePart: FileUIPart = {
            type: "file",
            mediaType: recorded.mediaType,
            filename: recorded.filename,
            url: recorded.dataUrl,
          };
          sendMessage({
            text: "Comando de voz para a sessão",
            files: [filePart],
          });
          toast.success("Comando de voz enviado para o assistente!");
        }
      } catch (err) {
        toast.error("Erro ao processar gravação de áudio.");
      }
    } else {
      try {
        await voiceRecorder.startRecording();
      } catch {
        toast.error("Permissão de microfone negada ou indisponível.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-ai-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-2xl transition-transform animate-in slide-in-from-right duration-300"
      >
        {/* Header do Assistente */}
        <div className="flex flex-col border-b border-border bg-card/95 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary/60 text-primary-foreground shadow-sm">
                <Sparkles className="size-4.5" />
              </div>
              <div className="flex flex-col">
                <h3
                  id="session-ai-drawer-title"
                  className="font-heading text-sm font-bold text-foreground flex items-center gap-1.5"
                >
                  Assistente de Treino
                  <span className="rounded-full bg-primary/10 px-2 py-0.2 text-[10px] font-semibold text-primary">
                    Beta
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {selectedExerciseName
                    ? `Focado em: ${selectedExerciseName}`
                    : "Contexto geral do treino"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
              <span className="sr-only">Fechar</span>
            </button>
          </div>

          {/* Barra de Consentimento LGPD */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <History className="size-3.5 text-primary shrink-0" />
              <span className="font-heading font-medium text-foreground">
                Histórico de treinos anteriores
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleConsent}
                disabled={isUpdatingConsent}
                aria-label="Alternar histórico"
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  hasHistoryConsent ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    hasHistoryConsent ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          {!hasHistoryConsent && (
            <p className="mt-1 px-1 text-[10px] text-muted-foreground">
              Acesso ao histórico desativado. A IA só enxerga a sessão atual.
            </p>
          )}
        </div>

        {/* Lista de Mensagens e Propostas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Se houver propostas pendentes criadas na sessão, exibe no topo */}
          {proposals.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Propostas de Séries ({proposals.length})
              </span>
              {proposals.map((prop) => (
                <SetProposalCard
                  key={prop.id}
                  proposal={prop}
                  sessionId={sessionId}
                  onConfirmed={(createdSets, sessionExerciseId) => {
                    loadProposals();
                    onSetsConfirmed?.(createdSets, sessionExerciseId);
                  }}
                  onDiscarded={() => loadProposals()}
                />
              ))}
            </div>
          )}

          {/* Histórico do Chat */}
          {messages.length === 0 && (
            <div className="my-6 flex flex-col items-center justify-center text-center p-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                <Bot className="size-6" />
              </div>
              <h4 className="font-heading text-sm font-semibold text-foreground">
                Como posso ajudar no seu treino agora?
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Pergunte sobre cargas, ajuste de repetições, tempos de descanso ou
                peça para preparar novas séries para confirmação.
              </p>

              {/* Sugestões rápidas de início */}
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      selectedExerciseName
                        ? `Sugira a carga ideal e repetições para ${selectedExerciseName}`
                        : "Qual exercício devo focar agora?",
                    )
                  }
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-primary/5"
                >
                  🎯 Sugerir carga ideal
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      selectedExerciseName
                        ? `Prepare 3 séries de trabalho para ${selectedExerciseName}`
                        : "Prepare as séries para o próximo exercício",
                    )
                  }
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-primary/5"
                >
                  📝 Preparar proposta de séries
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      "Qual o tempo ideal de descanso entre as séries?",
                    )
                  }
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-primary/5"
                >
                  ⏱️ Tempo de descanso
                </button>
              </div>
            </div>
          )}

          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Bot className="size-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                    isUser
                      ? "bg-primary text-primary-foreground font-medium"
                      : "border border-border/60 bg-muted/30 text-foreground"
                  }`}
                >
                  {isUser ? (
                    <div className="space-y-1.5">
                      {m.parts?.map((part: any, idx) => {
                        if (part.type === "text" && part.text) {
                          return (
                            <div key={idx} className="whitespace-pre-wrap">
                              {part.text}
                            </div>
                          );
                        }
                        if (part.type === "file") {
                          if (part.mediaType?.startsWith("audio/")) {
                            return (
                              <div
                                key={idx}
                                className="my-1 rounded-xl bg-primary-foreground/10 p-2 text-primary-foreground"
                              >
                                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold">
                                  <Mic className="size-3.5" />
                                  <span>{part.filename || "Comando de voz"}</span>
                                </div>
                                <audio
                                  controls
                                  src={part.url}
                                  className="h-7 w-full max-w-[200px]"
                                />
                              </div>
                            );
                          }
                          if (part.mediaType === "application/pdf") {
                            return (
                              <div
                                key={idx}
                                className="my-1 flex items-center gap-2 rounded-xl bg-primary-foreground/10 p-2 text-primary-foreground"
                              >
                                <FileText className="size-4 shrink-0" />
                                <span className="truncate text-xs font-medium">
                                  {part.filename || "documento.pdf"}
                                </span>
                              </div>
                            );
                          }
                          if (part.mediaType?.startsWith("image/")) {
                            return (
                              <div
                                key={idx}
                                className="my-1 max-w-[200px] overflow-hidden rounded-xl border border-primary-foreground/20"
                              >
                                <img
                                  src={part.url}
                                  alt={part.filename || "Anexo"}
                                  className="max-h-40 w-auto object-cover"
                                />
                              </div>
                            );
                          }
                        }
                        return null;
                      })}
                    </div>
                  ) : (
                    <div className="prose prose-xs dark:prose-invert max-w-none text-xs">
                      {m.parts?.map((part: any, idx) => {
                        if (part.type === "text") {
                          return (
                            <Streamdown
                              key={idx}
                              isAnimating={
                                isLoading &&
                                messages[messages.length - 1]?.id === m.id
                              }
                            >
                              {part.text}
                            </Streamdown>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Analisando contexto do treino...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Pré-visualização de Arquivos Anexados */}
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-border bg-card px-3 pt-2">
            {pendingFiles.map((pf, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 text-[11px] text-foreground"
              >
                {pf.mediaType === "application/pdf" ? (
                  <FileText className="size-3.5 text-red-500" />
                ) : pf.mediaType.startsWith("audio/") ? (
                  <Mic className="size-3.5 text-primary" />
                ) : (
                  <FileText className="size-3.5 text-primary" />
                )}
                <span className="max-w-[120px] truncate">{pf.filename}</span>
                <button
                  type="button"
                  onClick={() => removePendingFile(idx)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Barra de Entrada / Envio e Gravação de Voz */}
        <div className="border-t border-border bg-card p-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="application/pdf,image/*,audio/*,text/plain"
            multiple
            className="hidden"
          />

          {voiceRecorder.isRecording ? (
            <div className="flex items-center justify-between rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
                </span>
                <span className="font-heading text-xs font-semibold text-red-500">
                  Gravando comando de voz...
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatRecordingTime(voiceRecorder.recordingSeconds)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={voiceRecorder.cancelRecording}
                  title="Cancelar gravação"
                  className="size-7 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleToggleVoiceRecord}
                  className="h-7 gap-1 bg-red-600 px-2.5 text-xs text-white hover:bg-red-700"
                >
                  <Square className="size-3 fill-current" />
                  <span>Enviar</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Anexar arquivo ou ficha (PDF/Foto)"
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <Paperclip className="size-4" />
              </button>

              <button
                type="button"
                onClick={handleToggleVoiceRecord}
                title="Gravar comando de voz"
                className="text-muted-foreground hover:text-primary transition-colors p-1"
              >
                <Mic className="size-4" />
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedExerciseName
                    ? `Pergunte ou peça séries para ${selectedExerciseName}...`
                    : "Converse com o assistente do treino..."
                }
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />

              <Button
                type="button"
                size="sm"
                disabled={
                  (!inputMessage.trim() && pendingFiles.length === 0) ||
                  isLoading
                }
                onClick={() => handleSendMessage()}
                className="size-7 rounded-xl p-0 shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ArrowUp className="size-3.5" />
                )}
                <span className="sr-only">Enviar</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
