"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type FileUIPart,
} from "ai";
import { useQueryStates, parseAsBoolean, parseAsString } from "nuqs";
import {
  Bot,
  X,
  ArrowUp,
  Check,
  Loader2,
  Menu,
  Plus,
  Trash2,
  MessageSquare,
  Dumbbell,
  Mic,
  Paperclip,
  FileText,
  Square,
} from "lucide-react";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ForgottenWorkoutRecoveryModal } from "@/app/history/_components/forgotten-workout-recovery-modal";
import {
  formatRecordingTime,
  useVoiceRecorder,
} from "@/app/_hooks/use-voice-recorder";

interface AttachedFileItem {
  file: File;
  dataUrl: string;
  mediaType: string;
  filename: string;
  size: number;
}

const SUGGESTED_MESSAGES = [
  "Monte um plano de treino para mim",
  "Monte uma periodização para mim",
  "Explique meu planejamento atual",
  "Esqueci de marcar um treino passado",
];

const THINKING_PHRASES = [
  "(Pensando...)",
  "(Preparando Equipamento...)",
  "(Calculando Cargas & Séries...)",
  "(Aquecendo os Músculos...)",
  "(Batendo o PR...)",
  "(Montando Prescrição...)",
];

export function formatRelativeDate(isoDateString: string): string {
  const date = new Date(isoDateString);
  const now = new Date();

  const dateMidnight = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const nowMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const diffDays = Math.round(
    (nowMidnight.getTime() - dateMidnight.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return "Hoje";
  }
  if (diffDays === 1) {
    return "Ontem";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

const chatFormSchema = z.object({
  message: z.string(),
});

type ChatFormValues = z.infer<typeof chatFormSchema>;

export type AiToolKind =
  | "PROPOSAL"
  | "READ"
  | "MUTATION_DRAFT"
  | "RECOVERY_DRAFT"
  | "OTHER";

const READ_TOOL_NAMES = new Set([
  "getPlanningOverview",
  "getWorkoutPlan",
  "getPeriodization",
  "getUserTrainData",
  "getRecentTrainingHistory",
  "getRecentTrainingFeedback",
  "getWorkoutHistorySession",
  "searchExercises",
  "getExerciseEvolution",
  "getWeeklyTrainingAnalytics",
  "getMuscleTrainingAnalytics",
]);

export function getChatRequestBody(conversationId: string | null) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    ...(conversationId ? { conversationId } : {}),
    ...(timezone ? { timezone } : {}),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAiToolName(part: any): string {
  if (!part) return "";
  if (typeof part.toolName === "string" && part.toolName) {
    return part.toolName;
  }
  if (typeof part.type === "string") {
    if (part.type.startsWith("tool-")) {
      return part.type.replace(/^tool-/, "");
    }
    if (part.type === "tool-invocation" && part.toolInvocation?.toolName) {
      return part.toolInvocation.toolName;
    }
  }
  return "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAiToolKind(part: any): AiToolKind {
  const name = getAiToolName(part);
  if (name === "proposeWorkoutPlan" || name === "proposePeriodization") {
    return "PROPOSAL";
  }
  if (READ_TOOL_NAMES.has(name)) {
    return "READ";
  }
  if (
    name === "createWorkoutPlanDraft" ||
    name === "createPeriodizationDraft"
  ) {
    return "MUTATION_DRAFT";
  }
  if (name === "proposeForgottenWorkoutDraft") {
    return "RECOVERY_DRAFT";
  }
  return "OTHER";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getReadToolStatusLabel(part: any): string | null {
  if (getAiToolKind(part) !== "READ") return null;
  if (
    part.state === "output-available" ||
    part.state === "output-error" ||
    part.state === "output-denied"
  ) {
    return null;
  }

  const name = getAiToolName(part);
  if (name === "getRecentTrainingFeedback") return "Consultando recuperação...";
  if (
    name === "getRecentTrainingHistory" ||
    name === "getWorkoutHistorySession"
  ) {
    return "Consultando histórico...";
  }
  if (name === "searchExercises") return "Buscando exercício...";
  if (name === "getExerciseEvolution") return "Analisando evolução...";
  if (
    name === "getWeeklyTrainingAnalytics" ||
    name === "getMuscleTrainingAnalytics"
  ) {
    return "Verificando volume...";
  }
  return "Consultando seus dados...";
}

interface ChatProps {
  embedded?: boolean;
  initialMessage?: string;
}

interface ToolApprovalCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  part: any;
  onApprove: () => void;
  onReject: () => void;
}

function ToolApprovalCard({
  part,
  onApprove,
  onReject,
}: ToolApprovalCardProps) {
  const isPeriodization =
    part.type?.toLowerCase().includes("periodization") ||
    Boolean(part.input && "blocks" in part.input);
  const name = part.input?.name || "Sem título";
  const days = part.input?.workoutDays;
  const blocks = part.input?.blocks;

  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-3.5 text-card-foreground shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
        <div className="flex items-center gap-1.5 font-heading text-sm font-semibold text-foreground">
          <Dumbbell className="size-4 text-primary" />
          <span>
            {isPeriodization ? "Periodização Proposta" : "Plano Proposto"}
          </span>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-heading text-[10px] font-medium text-primary">
          Aprovação necessária
        </span>
      </div>

      <div className="mt-2 space-y-1.5">
        <p className="font-heading text-sm font-medium text-foreground">
          {name}
        </p>
        {isPeriodization && Array.isArray(blocks) && (
          <div className="space-y-1 text-xs text-muted-foreground">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {blocks.map((b: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] font-semibold text-foreground">
                  {i + 1}.
                </span>
                <span>{b.plan?.name || `Etapa ${i + 1}`}</span>
                {b.plannedStartDate && b.plannedEndDate && (
                  <span className="text-[11px] opacity-80">
                    ({b.plannedStartDate} → {b.plannedEndDate})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {!isPeriodization && Array.isArray(days) && (
          <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {days.map((d: any) => (
              <div
                key={d.weekDay}
                className="flex items-center justify-between"
              >
                <span className="font-medium text-foreground/80">
                  {d.name || d.weekDay}:
                </span>
                <span>
                  {d.isRest
                    ? "Descanso"
                    : `${d.exercises?.length ?? 0} exercícios (${Math.round((d.estimatedDurationInSeconds ?? 0) / 60)} min)`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-2.5">
        <Button
          size="sm"
          type="button"
          onClick={onApprove}
          className="h-8 font-heading text-xs"
        >
          Salvar como rascunho
        </Button>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={onReject}
          className="h-8 font-heading text-xs"
        >
          Continuar ajustando
        </Button>
      </div>
    </div>
  );
}

interface ConversationItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messagesCount: number;
}

export function Chat({ embedded = false, initialMessage }: ChatProps) {
  const router = useRouter();
  const [chatParams, setChatParams] = useQueryStates({
    chat_open: parseAsBoolean.withDefault(false),
    chat_initial_message: parseAsString,
  });

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [activeConversationTitle, setActiveConversationTitle] = useState<
    string | null
  >(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [thinkingPhraseIndex, setThinkingPhraseIndex] = useState(0);
  const [activeRecoveryDraftId, setActiveRecoveryDraftId] = useState<
    string | null
  >(null);
  const [pendingAttachments, setPendingAttachments] = useState<AttachedFileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceRecorder = useVoiceRecorder();

  const activeConversationIdRef = useRef<string | null>(null);
  activeConversationIdRef.current = activeConversationId;

  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/conversations`,
        {
          credentials: "include",
        },
      );
      if (res.ok) {
        const data = await res.json();
        const convList: ConversationItem[] = data.conversations || [];
        setConversations(convList);

        if (activeConversationIdRef.current) {
          const currentConv = convList.find(
            (c) => c.id === activeConversationIdRef.current,
          );
          if (currentConv) {
            setActiveConversationTitle(currentConv.title);
          }
        }
      }
    } catch {
      // Ignora erro de rede silenciosamente
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const [quotaErrorMessage, setQuotaErrorMessage] = useState<string | null>(null);
  const pendingMessageRef = useRef<string>("");

  const {
    messages,
    sendMessage,
    status,
    addToolApprovalResponse,
    setMessages,
  } = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_API_URL}/ai`,
      credentials: "include",
      fetch: async (input, init) => {
        const response = await fetch(input, init);
        const newConvId = response.headers.get("x-conversation-id");
        if (newConvId && !activeConversationIdRef.current) {
          activeConversationIdRef.current = newConvId;
          setActiveConversationId(newConvId);
        }
        return response;
      },
      body: () => getChatRequestBody(activeConversationIdRef.current),
    }),
    onFinish: () => {
      fetchConversations();
    },
    onError: (error) => {
      const msg = error?.message || "";
      if (
        msg.includes("429") ||
        msg.includes("limite") ||
        msg.includes("cota") ||
        msg.includes("AI_DAILY_QUOTA_EXCEEDED") ||
        msg.includes("AI_MINUTE_LIMIT_EXCEEDED")
      ) {
        setQuotaErrorMessage(
          "Você atingiu o limite do Coach IA nesta versão de testes. Seu acesso será renovado automaticamente à meia-noite UTC (21h Brasília)."
        );
      } else {
        setQuotaErrorMessage(
          "Não foi possível processar sua mensagem agora. Tente novamente em instantes."
        );
      }
      if (pendingMessageRef.current) {
        form.setValue("message", pendingMessageRef.current);
      }
    },
  });

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(chatFormSchema),
    defaultValues: { message: "" },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialMessageSentRef = useRef(false);

  const isStreaming = status === "streaming";
  const isLoading = status === "submitted" || isStreaming;
  const activeReadToolLabel = messages
    .flatMap((message) => message.parts)
    .map((part) => getReadToolStatusLabel(part))
    .filter((label): label is string => label !== null)
    .pop();

  // Ciclo dinâmico das frases de Thinking
  useEffect(() => {
    if (!isLoading) {
      setThinkingPhraseIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setThinkingPhraseIndex((prev) => (prev + 1) % THINKING_PHRASES.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [isLoading]);

  // Carrega conversas ao abrir o chat ou na montagem
  useEffect(() => {
    if (embedded || chatParams.chat_open) {
      fetchConversations();
    }
  }, [embedded, chatParams.chat_open, fetchConversations]);

  useEffect(() => {
    if (embedded && initialMessage && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true;
      sendMessage({ text: initialMessage });
    }
  }, [embedded, initialMessage, sendMessage]);

  useEffect(() => {
    if (
      !embedded &&
      chatParams.chat_open &&
      chatParams.chat_initial_message &&
      !initialMessageSentRef.current
    ) {
      initialMessageSentRef.current = true;
      sendMessage({ text: chatParams.chat_initial_message });
      setChatParams({ chat_initial_message: null });
    }
  }, [
    embedded,
    chatParams.chat_open,
    chatParams.chat_initial_message,
    sendMessage,
    setChatParams,
  ]);

  useEffect(() => {
    if (!embedded && !chatParams.chat_open) {
      initialMessageSentRef.current = false;
    }
  }, [embedded, chatParams.chat_open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleClose = () => {
    setChatParams({ chat_open: false, chat_initial_message: null });
  };

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

    setPendingAttachments((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingAttachment = (idx: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleToggleVoiceRecord = async () => {
    if (voiceRecorder.isRecording) {
      try {
        const recorded = await voiceRecorder.stopRecording();
        if (recorded) {
          const filePart: FileUIPart = {
            type: "file",
            mediaType: recorded.mediaType,
            filename: recorded.filename,
            url: recorded.dataUrl,
          };
          sendMessage({
            text: "Mensagem de voz",
            files: [filePart],
          });
          toast.success("Mensagem de voz enviada para o Coach!");
        }
      } catch {
        toast.error("Erro ao processar gravação de voz.");
      }
    } else {
      try {
        await voiceRecorder.startRecording();
      } catch {
        toast.error("Permissão de microfone negada ou indisponível.");
      }
    }
  };

  const onSubmit = (values: ChatFormValues) => {
    const text = values.message.trim();
    if (!text && pendingAttachments.length === 0) return;

    pendingMessageRef.current = text;
    setQuotaErrorMessage(null);

    const fileParts: FileUIPart[] = pendingAttachments.map((att) => ({
      type: "file",
      mediaType: att.mediaType,
      filename: att.filename,
      url: att.dataUrl,
    }));

    if (fileParts.length > 0) {
      sendMessage({
        text: text || "Arquivo anexado para análise",
        files: fileParts,
      });
    } else {
      sendMessage({ text });
    }

    form.reset();
    setPendingAttachments([]);
  };

  const handleSuggestion = (text: string) => {
    sendMessage({ text });
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setActiveConversationTitle(null);
    activeConversationIdRef.current = null;
    if (typeof setMessages === "function") {
      setMessages([]);
    }
    setShowDrawer(false);
  };

  const handleSelectConversation = async (id: string, title: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/conversations/${id}`,
        {
          credentials: "include",
        },
      );
      if (res.ok) {
        const data = await res.json();
        setActiveConversationId(id);
        setActiveConversationTitle(title);
        activeConversationIdRef.current = id;
        if (typeof setMessages === "function") {
          setMessages(data.messages || []);
        }
        setShowDrawer(false);
      }
    } catch {
      // Ignora erro
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/conversations/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      if (res.ok) {
        if (activeConversationId === id) {
          handleNewConversation();
        }
        await fetchConversations();
      }
    } catch {
      // Ignora erro
    } finally {
      setConfirmDeleteId(null);
    }
  };

  if (!embedded && !chatParams.chat_open) return null;

  const chatContent = (
    <div
      className={
        embedded
          ? "relative flex h-svh flex-col bg-background"
          : "relative flex flex-1 flex-col overflow-hidden rounded-[20px] bg-background"
      }
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDrawer((prev) => !prev)}
            title="Conversas"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <Menu className="size-4" />
          </Button>
          <div className="flex items-center justify-center rounded-full bg-primary/8 border border-primary/8 p-2.5">
            <Bot className="size-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-semibold text-foreground sm:text-base">
                Coach AI
              </span>
              <div className="flex items-center gap-1">
                <div className="size-1.5 rounded-full bg-online" />
                <span className="font-heading text-[11px] text-primary">
                  Online
                </span>
              </div>
            </div>
            {activeConversationTitle && (
              <span className="max-w-[150px] truncate text-[11px] text-muted-foreground sm:max-w-[220px]">
                {activeConversationTitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewConversation}
            className="h-8 gap-1 px-2.5 font-heading text-xs"
            title="Nova conversa"
          >
            <Plus className="size-3.5 text-primary" />
            <span className="hidden sm:inline">Nova conversa</span>
          </Button>
          {embedded ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Acessar Trainvy</Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="size-8"
            >
              <X className="size-5 text-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Drawer de Conversas (Sheet / Overlay) */}
      {showDrawer && (
        <div className="absolute inset-0 z-20 flex bg-background/90 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-xs flex-col border-r border-border bg-card p-4 shadow-lg animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-primary" />
                <span className="font-heading text-sm font-semibold text-foreground">
                  Suas conversas
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDrawer(false)}
                className="size-7"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="pt-3 pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewConversation}
                className="w-full justify-start gap-2 font-heading text-xs"
              >
                <Plus className="size-3.5 text-primary" />
                <span>+ Nova conversa</span>
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 py-2">
              {loadingConversations ? (
                <div className="flex items-center justify-center p-6 text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Carregando conversas...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Nenhuma conversa salva ainda.
                </div>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                      c.id === activeConversationId
                        ? "bg-primary/10 text-foreground font-medium border border-primary/20"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <div
                      className="flex flex-1 flex-col overflow-hidden pr-2"
                      onClick={() => handleSelectConversation(c.id, c.title)}
                    >
                      <span className="truncate">{c.title}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeDate(c.updatedAt)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground opacity-60 hover:opacity-100 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(c.id);
                      }}
                      title="Excluir conversa"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className="flex-1 cursor-pointer"
            onClick={() => setShowDrawer(false)}
          />
        </div>
      )}

      {/* Confirmação de exclusão */}
      {confirmDeleteId && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xs rounded-xl border border-border bg-card p-4 shadow-xl">
            <h4 className="font-heading text-sm font-semibold text-foreground">
              Excluir conversa?
            </h4>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Esta conversa e mensagens serão removidas. Planos e periodizações
              criados pelo Coach{" "}
              <strong className="text-foreground">não</strong> serão apagados.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteId(null)}
                className="h-8 text-xs font-heading"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteConversation(confirmDeleteId)}
                className="h-8 text-xs font-heading"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "assistant"
                ? "flex flex-col items-start pl-5 pr-[60px] pt-5"
                : "flex flex-col items-end pl-[60px] pr-5 pt-5"
            }
          >
            <div
              className={
                message.role === "assistant"
                  ? "rounded-xl bg-secondary p-3 text-secondary-foreground"
                  : "rounded-xl bg-primary p-3 text-primary-foreground"
              }
            >
              {message.role === "assistant" ? (
                <>
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <Streamdown
                          key={index}
                          isAnimating={
                            isStreaming &&
                            messages[messages.length - 1]?.id === message.id
                          }
                          className="font-heading text-sm leading-relaxed text-foreground"
                        >
                          {part.text}
                        </Streamdown>
                      );
                    }

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const anyPart = part as any;
                    const toolKind = getAiToolKind(anyPart);

                    // Tools de consulta/leitura e proposta nunca renderizam cards de persistência
                    if (toolKind === "READ" || toolKind === "PROPOSAL") {
                      return null;
                    }

                    // Apenas MUTATION_DRAFT (createWorkoutPlanDraft, createPeriodizationDraft) renderiza fluxo de persistência
                    if (toolKind === "MUTATION_DRAFT") {
                      if (
                        anyPart.state === "approval-requested" &&
                        anyPart.approval?.id
                      ) {
                        return (
                          <ToolApprovalCard
                            key={index}
                            part={anyPart}
                            onApprove={() =>
                              addToolApprovalResponse({
                                id: anyPart.approval.id,
                                approved: true,
                              })
                            }
                            onReject={() =>
                              addToolApprovalResponse({
                                id: anyPart.approval.id,
                                approved: false,
                                reason: "Continuar ajustando",
                              })
                            }
                          />
                        );
                      }

                      if (
                        anyPart.state === "approval-responded" &&
                        anyPart.approval
                      ) {
                        if (anyPart.approval.approved) {
                          return (
                            <div
                              key={index}
                              className="mt-2 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-2 text-xs text-primary"
                            >
                              <Loader2 className="size-3.5 animate-spin" />
                              <span>Proposta aprovada — salvando...</span>
                            </div>
                          );
                        } else {
                          return (
                            <div
                              key={index}
                              className="mt-2 flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 p-2 text-xs text-muted-foreground"
                            >
                              <X className="size-3.5" />
                              <span>
                                Ajustes solicitados — Rascunho não persistido
                              </span>
                            </div>
                          );
                        }
                      }

                      if (anyPart.state === "output-available") {
                        const planId = anyPart.output?.planId;
                        const periodizationId = anyPart.output?.periodizationId;

                        return (
                          <div
                            key={index}
                            className="mt-2 space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-foreground"
                          >
                            <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                              <Check className="size-3.5" />
                              <span>Rascunho salvo</span>
                            </div>
                            {planId && (
                              <div className="pt-0.5">
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-7 border-emerald-500/40 text-xs hover:bg-emerald-500/20"
                                  onClick={() => router.refresh()}
                                >
                                  <Link href="/planning">
                                    Ver em Planejamento
                                  </Link>
                                </Button>
                              </div>
                            )}
                            {periodizationId && (
                              <div className="pt-0.5">
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-7 border-emerald-500/40 text-xs hover:bg-emerald-500/20"
                                  onClick={() => router.refresh()}
                                >
                                  <Link
                                    href={`/planning/periodizations/${periodizationId}`}
                                  >
                                    Ver periodização
                                  </Link>
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      }

                      if (anyPart.state === "output-error") {
                        return (
                          <div
                            key={index}
                            className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive"
                          >
                            <div className="flex items-center gap-1.5">
                              <X className="size-3.5" />
                              <span>Não foi possível salvar</span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isLoading}
                              className="h-6 border-destructive/40 bg-transparent px-2 text-xs text-destructive hover:bg-destructive/20 hover:text-destructive"
                              onClick={() =>
                                sendMessage({
                                  text: "Ocorreu um erro ao salvar o rascunho. Por favor, tente salvar novamente a proposta.",
                                })
                              }
                            >
                              Tentar novamente
                            </Button>
                          </div>
                        );
                      }

                      if (anyPart.state === "output-denied") {
                        return (
                          <div
                            key={index}
                            className="mt-2 flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 p-2 text-xs text-muted-foreground"
                          >
                            <X className="size-3.5" />
                            <span>Rascunho não salvo</span>
                          </div>
                        );
                      }
                    }

                    if (toolKind === "RECOVERY_DRAFT") {
                      const draftId =
                        anyPart.output?.draftId || anyPart.output?.draft?.id;
                      const draftData = anyPart.output?.draft;

                      if (anyPart.state === "output-available" && draftId) {
                        return (
                          <div
                            key={index}
                            className="mt-2.5 space-y-2 rounded-xl border border-primary/30 bg-card p-3 text-xs shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-semibold text-primary">
                                <Dumbbell className="size-4" />
                                <span>Rascunho de Treino Esquecido</span>
                              </div>
                              {draftData?.sessionDate && (
                                <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                  {draftData.sessionDate}
                                </span>
                              )}
                            </div>

                            <p className="text-muted-foreground">
                              {draftData?.title || "Treino Passado"} •{" "}
                              {draftData?.proposedExercises?.length ?? 0}{" "}
                              exercício(s) identificado(s)
                            </p>

                            <div className="pt-1">
                              <Button
                                size="sm"
                                type="button"
                                onClick={() => setActiveRecoveryDraftId(draftId)}
                                className="h-7 text-xs font-semibold gap-1.5"
                              >
                                Revisar e Salvar no Histórico
                              </Button>
                            </div>
                          </div>
                        );
                      }
                    }

                    return null;
                  })}
                </>
              ) : (
                <div className="space-y-2 font-heading text-sm leading-relaxed text-primary-foreground">
                  {message.parts.map((part: any, index) => {
                    if (part.type === "text" && part.text) {
                      return (
                        <p key={index} className="whitespace-pre-wrap">
                          {part.text}
                        </p>
                      );
                    }
                    if (part.type === "file") {
                      if (part.mediaType?.startsWith("audio/")) {
                        return (
                          <div
                            key={index}
                            className="my-1.5 rounded-xl bg-primary-foreground/15 p-2.5 text-primary-foreground"
                          >
                            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
                              <Mic className="size-3.5" />
                              <span>{part.filename || "Mensagem de voz"}</span>
                            </div>
                            <audio
                              controls
                              src={part.url}
                              className="h-7 w-full max-w-[240px]"
                            />
                          </div>
                        );
                      }
                      if (part.mediaType === "application/pdf") {
                        return (
                          <div
                            key={index}
                            className="my-1.5 flex items-center gap-2 rounded-xl bg-primary-foreground/15 p-2.5 text-primary-foreground"
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
                            key={index}
                            className="my-1.5 max-w-[260px] overflow-hidden rounded-xl border border-primary-foreground/20"
                          >
                            <img
                              src={part.url}
                              alt={part.filename || "Anexo"}
                              className="max-h-52 w-auto object-cover"
                            />
                          </div>
                        );
                      }
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Feedback visual dinâmico de Thinking (Gym-themed) */}
        {isLoading && (
          <div className="flex flex-col items-start pl-5 pr-[60px] pt-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 shadow-xs backdrop-blur-xs">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              <Dumbbell className="size-3.5 animate-bounce text-primary" />
              <span className="font-heading text-xs font-medium text-primary">
                {activeReadToolLabel ?? THINKING_PHRASES[thinkingPhraseIndex]}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex shrink-0 flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex gap-2.5 overflow-x-auto px-5">
            {SUGGESTED_MESSAGES.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestion(suggestion)}
                className="whitespace-nowrap rounded-full bg-primary/10 px-4 py-2 font-heading text-sm text-foreground hover:bg-primary/20 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {quotaErrorMessage && (
          <div className="mx-5 mb-1 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between gap-2 animate-in fade-in duration-200">
            <span>{quotaErrorMessage}</span>
            <button
              type="button"
              onClick={() => setQuotaErrorMessage(null)}
              className="text-xs font-semibold hover:underline shrink-0"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Input de arquivo oculto */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="application/pdf,image/*,audio/*,text/plain"
          multiple
          className="hidden"
        />

        {/* Anexos pendentes para envio */}
        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-5">
            {pendingAttachments.map((att, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground shadow-xs"
              >
                {att.mediaType.startsWith("audio/") ? (
                  <Mic className="size-3 text-primary" />
                ) : att.mediaType === "application/pdf" ? (
                  <FileText className="size-3 text-primary" />
                ) : (
                  <Paperclip className="size-3 text-primary" />
                )}
                <span className="max-w-[140px] truncate font-medium">
                  {att.filename}
                </span>
                <button
                  type="button"
                  onClick={() => removePendingAttachment(idx)}
                  className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Barra de gravação de voz ativa */}
        {voiceRecorder.isRecording ? (
          <div className="mx-5 mb-3 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 p-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-red-500" />
              </span>
              <span className="font-mono text-sm font-semibold text-foreground">
                {formatRecordingTime(voiceRecorder.recordingSeconds)}
              </span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Gravando áudio para o Coach...
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={voiceRecorder.cancelRecording}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleToggleVoiceRecord}
                className="h-8 gap-1.5 text-xs font-semibold"
              >
                <Square className="size-3 fill-current" />
                <span>Enviar Áudio</span>
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex items-center gap-2 border-t border-border p-4 sm:p-5"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
                className="size-[42px] shrink-0 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                title="Anexar documento ou imagem"
              >
                <Paperclip className="size-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isLoading}
                onClick={handleToggleVoiceRecord}
                className="size-[42px] shrink-0 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                title="Gravar mensagem de voz"
              >
                <Mic className="size-4" />
              </Button>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          pendingAttachments.length > 0
                            ? "Adicione uma instrução para o anexo..."
                            : "Digite sua mensagem ou envie um áudio/documento"
                        }
                        className="rounded-full border-border bg-secondary px-4 py-3 font-heading text-sm text-foreground placeholder:text-muted-foreground"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={
                  (!form.watch("message").trim() &&
                    pendingAttachments.length === 0) ||
                  isLoading
                }
                size="icon"
                className="size-[42px] shrink-0 rounded-full"
              >
                <ArrowUp className="size-5" />
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );

  const modalElement = activeRecoveryDraftId ? (
    <ForgottenWorkoutRecoveryModal
      draftId={activeRecoveryDraftId}
      isOpen={true}
      onClose={() => setActiveRecoveryDraftId(null)}
      onConfirmed={() => {
        setActiveRecoveryDraftId(null);
        router.refresh();
      }}
    />
  ) : null;

  if (embedded) {
    return (
      <>
        {chatContent}
        {modalElement}
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[60]">
        <div
          className="absolute inset-0 bg-foreground/30"
          onClick={handleClose}
        />

        <div className="absolute inset-x-4 bottom-4 top-24 sm:top-36 flex flex-col">
          {chatContent}
        </div>
      </div>
      {modalElement}
    </>
  );
}
