"use client";

import { useCallback, useId, useState, useSyncExternalStore } from "react";
import { Popover } from "radix-ui";
import {
  Activity,
  ArrowLeft,
  Clock3,
  Compass,
  Eye,
  CircleHelp,
  Layers3,
  LayoutGrid,
  List,
  Minus,
  Plus,
  RotateCcw,
  Settings2,
  Pencil,
  MoreHorizontal,
  Check,
  X,
} from "lucide-react";
import type { telemetry } from "../../_lib/tactical";
import type { WorkoutPlanDraftDay } from "../../_lib/workout-plan-builder";
import { TrainingBioDetails } from "./training-bio-panel";
import { SealButton } from "./seal-button";
import { TacticalSheet } from "./tactical-sheet";

const desktopQuery = "(min-width: 1024px)";
function subscribeToDesktop(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(desktopQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function getDesktopSnapshot() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia(desktopQuery).matches
  );
}
function getServerDesktopSnapshot() {
  return false;
}

export interface HoloHudProps {
  days: WorkoutPlanDraftDay[];
  activeDayIndex: number;
  onSelectDay: (index: number) => void;
  onAddDay: () => void;
  telemetryData: ReturnType<typeof telemetry>;
  tilt: number;
  zoom: number;
  onToggleTilt: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetCamera: () => void;
  onAutoArrange: () => void;
  onSave?: () => void;
  onClassicView?: () => void;
  onListView?: () => void;
  onOpenSettings?: () => void;
  onReview?: () => void;
  reviewLabel?: string;
  planName?: string;
  onPlanNameChange?: (name: string) => void;
  onDayNameChange?: (name: string) => void;
  planNameMaxLength?: number;
  saveLabel?: string;
  disabled?: boolean;
}

export function HoloHud({
  days,
  activeDayIndex,
  onSelectDay,
  onAddDay,
  telemetryData,
  tilt,
  zoom,
  onToggleTilt,
  onZoomIn,
  onZoomOut,
  onResetCamera,
  onAutoArrange,
  onSave,
  onClassicView,
  onListView,
  onOpenSettings,
  onReview,
  reviewLabel,
  planName,
  onPlanNameChange,
  onDayNameChange,
  planNameMaxLength = 120,
  saveLabel = "Salvar plano",
  disabled,
}: HoloHudProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerContainer, setScannerContainer] = useState<HTMLElement | null>(
    null,
  );
  const [helpOpen, setHelpOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const setScannerAnchor = useCallback((element: HTMLDivElement | null) => {
    setScannerContainer(
      element?.closest<HTMLElement>('[data-testid="tactical-viewport"]') ??
        null,
    );
  }, []);
  const desktop = useSyncExternalStore(
    subscribeToDesktop,
    getDesktopSnapshot,
    getServerDesktopSnapshot,
  );
  const scannerTitleId = useId();
  return (
    <>
      <header className="spatial-header pointer-events-auto absolute inset-x-0 top-0 z-40">
        <div className="flex min-w-0 items-center gap-3 px-3 py-3 sm:px-6 sm:py-4">
          {onClassicView && (
            <button
              type="button"
              onClick={onClassicView}
              aria-label="Voltar ao editor clássico"
              className="spatial-icon-button"
            >
              <ArrowLeft size={17} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              <Layers3 size={12} /> Trainvy{" "}
              <span className="text-slate-600">/</span> Studio
            </div>
            {onPlanNameChange ? (
              <label className="relative block">
                <span className="sr-only">Nome do plano</span>
                <input
                  aria-required="true"
                  value={planName ?? ""}
                  maxLength={planNameMaxLength}
                  disabled={disabled}
                  onChange={(event) => onPlanNameChange(event.target.value)}
                  placeholder="Nome do plano *"
                  title="Edite o nome do plano de treino"
                  className="block h-8 w-full min-w-0 rounded-lg border border-white/10 bg-white/[0.03] pl-2 pr-7 text-sm font-semibold tracking-tight text-white outline-none transition-colors placeholder:font-normal placeholder:text-slate-400 hover:border-cyan-300/30 focus:border-cyan-300/60 focus:bg-cyan-300/5 sm:text-lg"
                />
                <Pencil
                  size={12}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </label>
            ) : (
              <h2 className="truncate text-sm font-semibold tracking-tight text-white sm:text-lg">
                {planName || "Seu próximo treino"}
              </h2>
            )}
          </div>
          <div className="hidden shrink-0 items-center gap-1.5 sm:flex sm:gap-2">
            {onListView && (
              <button
                type="button"
                onClick={onListView}
                aria-label="Visualização em lista"
                data-tour="builder-views"
                className="spatial-icon-button sm:!w-auto sm:gap-2 sm:px-3"
              >
                <List size={16} />
                <span className="hidden text-xs sm:inline">Lista</span>
              </button>
            )}
            {onReview && (
              <button
                type="button"
                onClick={onReview}
                disabled={disabled}
                aria-label={reviewLabel || "Revisar ficha"}
                className="spatial-icon-button lg:!w-auto lg:gap-2 lg:px-3"
              >
                <Eye size={16} />
                <span className="hidden text-xs lg:inline">
                  {reviewLabel || "Revisar ficha"}
                </span>
              </button>
            )}
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="Configurações do plano"
                className="spatial-icon-button"
              >
                <Settings2 size={16} />
              </button>
            )}
            {onSave && (
              <div
                data-tour="builder-save"
                className="min-w-10 sm:w-36 [&_button]:h-10"
              >
                <SealButton
                  disabled={disabled}
                  onSave={onSave}
                  label={saveLabel}
                />
              </div>
            )}
          </div>
        </div>
        <div
          data-tour="builder-days"
          className="flex min-w-0 items-center gap-3 border-t border-white/5 px-3 py-2 sm:px-6"
        >
          {onDayNameChange && days[activeDayIndex] && (
            <label className="block w-32 min-w-0 shrink-0 sm:w-52">
              <span className="sr-only">Nome do treino</span>
              <input
                value={days[activeDayIndex].name}
                onChange={(event) => onDayNameChange(event.target.value)}
                disabled={disabled}
                placeholder="Ex.: Superiores A"
                title="Nome do treino ativo"
                className="h-9 w-full min-w-0 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs text-white outline-none focus:border-cyan-300/60"
              />
            </label>
          )}
          <div
            role="tablist"
            aria-label="Treinos do plano"
            className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto"
          >
            {days.map((day, i) => (
              <button
                type="button"
                role="tab"
                aria-label={day.name}
                aria-selected={i === activeDayIndex}
                onClick={() => onSelectDay(i)}
                key={day.clientId ?? day.id ?? i}
                className={`flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-xs transition-colors ${i === activeDayIndex ? "border border-cyan-300/30 bg-cyan-300/10 text-cyan-200" : "border border-transparent text-slate-400 hover:bg-white/5 hover:text-white"}`}
              >
                <span className="font-mono font-semibold">
                  {String.fromCharCode(65 + (i % 26))}
                </span>
                <span
                  className={
                    i === activeDayIndex ? "max-w-36 truncate" : "hidden"
                  }
                >
                  {day.name.replace(/^Treino [A-Z]\s*[-–·]?\s*/i, "") ||
                    "Treino"}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onAddDay}
            disabled={disabled}
            aria-label="Novo treino"
            className="spatial-icon-button !size-9 border-dashed"
          >
            <Plus size={15} />
          </button>
          <div className="hidden items-center gap-4 border-l border-white/10 pl-4 text-xs text-slate-400 md:flex">
            <span className="flex items-center gap-1.5">
              <Clock3 size={13} />
              <b className="font-medium text-white">
                ~{telemetryData.minutes} min
              </b>
            </span>
            <span>
              <b className="font-medium text-white">{telemetryData.sets}</b>{" "}
              séries
            </span>
          </div>
        </div>
      </header>

      <div
        ref={setScannerAnchor}
        className="pointer-events-auto absolute left-3 top-[140px] z-30 hidden sm:block sm:left-6"
      >
        <div className="flex items-center gap-2">
          <Popover.Root
            open={desktop && scannerOpen}
            onOpenChange={(open) => {
              if (desktop) setScannerOpen(open);
            }}
          >
            <Popover.Trigger asChild>
              <button
                type="button"
                aria-expanded={scannerOpen}
                onClick={
                  desktop ? undefined : () => setScannerOpen(!scannerOpen)
                }
                className="spatial-glass flex h-10 items-center gap-2 rounded-xl px-3 text-xs text-slate-300"
              >
                <Activity size={15} className="text-cyan-300" />
                Mapa muscular
                <span className="size-1.5 rounded-full bg-cyan-300/80" />
              </button>
            </Popover.Trigger>
            <Popover.Portal container={scannerContainer}>
              <Popover.Content
                role="region"
                aria-labelledby={scannerTitleId}
                side="bottom"
                align="start"
                sideOffset={10}
                collisionPadding={24}
                onOpenAutoFocus={(event) => event.preventDefault()}
                onInteractOutside={(event) => event.preventDefault()}
                className="dark spatial-glass z-[80] flex max-h-[calc(100dvh-215px)] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl text-slate-100 outline-none"
              >
                <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                  <div>
                    <h3 id={scannerTitleId} className="text-sm font-semibold">
                      Mapa muscular e atributos
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Explore a ficha com a mesa à vista.
                    </p>
                  </div>
                  <Popover.Close asChild>
                    <button
                      type="button"
                      aria-label="Fechar mapa muscular"
                      className="spatial-icon-button !size-9"
                    >
                      <X size={16} />
                    </button>
                  </Popover.Close>
                </header>
                <div
                  tabIndex={0}
                  aria-label="Conteúdo do mapa muscular"
                  className="tactical-panel-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 focus-visible:outline focus-visible:outline-cyan-300/50"
                >
                  <TrainingBioDetails data={telemetryData} />
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <button
            type="button"
            title="Como usar · cores, estrelas e controles"
            aria-label="Ajuda e legendas"
            onClick={() => setHelpOpen(true)}
            className="spatial-icon-button spatial-glass"
          >
            <CircleHelp size={17} />
          </button>
        </div>
      </div>

      <div className="spatial-camera spatial-glass pointer-events-auto absolute right-3 top-[140px] z-30 hidden items-center gap-1 rounded-xl p-1 sm:right-6 sm:flex">
        <button
          type="button"
          onClick={onAutoArrange}
          title="Auto-organizar formação"
          aria-label="Auto-organizar formação"
          className="spatial-icon-button !border-0 !bg-transparent"
        >
          <LayoutGrid size={16} />
        </button>
        <button
          type="button"
          onClick={onToggleTilt}
          title="Alternar perspectiva 3D"
          aria-label="Alternar perspectiva 3D"
          aria-pressed={tilt > 5}
          className={`spatial-icon-button !border-0 ${tilt > 5 ? "!bg-cyan-300/10 !text-cyan-200" : "!bg-transparent"}`}
        >
          <Compass size={16} />
        </button>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <button
          type="button"
          onClick={onZoomOut}
          aria-label="Diminuir zoom"
          className="spatial-icon-button !border-0 !bg-transparent"
        >
          <Minus size={15} />
        </button>
        <span
          aria-live="polite"
          className="w-10 text-center font-mono text-[11px] text-slate-400"
        >
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={onZoomIn}
          aria-label="Aumentar zoom"
          className="spatial-icon-button !border-0 !bg-transparent"
        >
          <Plus size={15} />
        </button>
        <button
          type="button"
          onClick={onResetCamera}
          aria-label="Centralizar câmera"
          className="spatial-icon-button !border-0 !bg-transparent"
        >
          <RotateCcw size={14} />
        </button>
      </div>
      <p className="pointer-events-none absolute left-4 top-[132px] z-20 text-[10px] text-slate-500 sm:hidden">
        Arraste a mesa · use a pinça para zoom
      </p>
      <nav
        aria-label="Ações do treino"
        className="spatial-mobile-actions pointer-events-auto absolute inset-x-0 bottom-0 z-50 flex items-center gap-2 border-t border-white/10 bg-[#0c141f]/95 px-3 pt-2 backdrop-blur-xl sm:hidden"
        style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          aria-label="Mais ações do treino"
          data-tour="builder-views"
          onClick={() => setControlsOpen(true)}
          className="flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] text-slate-300"
        >
          <MoreHorizontal size={20} />
          Mais
        </button>
        {onReview && (
          <button
            type="button"
            disabled={disabled}
            onClick={onReview}
            className="flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] text-slate-300"
          >
            <Eye size={19} />
            Revisar
          </button>
        )}
        {onSave && (
          <button
            type="button"
            disabled={disabled}
            onClick={onSave}
            data-tour="builder-save"
            className="flex min-h-12 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-cyan-300 px-3 text-sm font-semibold text-slate-950"
          >
            <Check size={19} />
            Salvar
          </button>
        )}
      </nav>
      <TacticalSheet
        open={controlsOpen}
        onClose={() => setControlsOpen(false)}
        title="Ações do treino"
        description="Ajuste sua ficha e escolha como explorar a mesa."
      >
        <div className="grid grid-cols-2 gap-2 text-xs [&_button]:flex [&_button]:min-h-14 [&_button]:items-center [&_button]:gap-2 [&_button]:rounded-xl [&_button]:bg-white/5 [&_button]:px-3">
          {onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                setControlsOpen(false);
                onOpenSettings();
              }}
            >
              <Settings2 size={18} />
              Editar informações
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setControlsOpen(false);
              setScannerOpen(true);
            }}
          >
            <Activity size={18} />
            Mapa muscular
          </button>
          {onListView && (
            <button
              type="button"
              onClick={() => {
                setControlsOpen(false);
                onListView();
              }}
            >
              <List size={18} />
              Visualização em lista
            </button>
          )}
          {onClassicView && (
            <button
              type="button"
              onClick={() => {
                setControlsOpen(false);
                onClassicView();
              }}
            >
              <ArrowLeft size={18} />
              Editor clássico
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onAutoArrange();
              setControlsOpen(false);
            }}
          >
            <LayoutGrid size={18} />
            Organizar cartões
          </button>
          <button
            type="button"
            onClick={() => {
              onResetCamera();
              setControlsOpen(false);
            }}
          >
            <RotateCcw size={18} />
            Centralizar mesa
          </button>
          <button type="button" aria-pressed={tilt > 5} onClick={onToggleTilt}>
            <Compass size={18} />
            {tilt > 5 ? "Vista de cima" : "Perspectiva 3D"}
          </button>
          <button
            type="button"
            onClick={() => {
              setControlsOpen(false);
              setHelpOpen(true);
            }}
          >
            <CircleHelp size={18} />
            Ajuda e gestos
          </button>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-white/5 p-2">
          <button
            type="button"
            aria-label="Diminuir zoom"
            onClick={onZoomOut}
            className="spatial-icon-button"
          >
            <Minus size={18} />
          </button>
          <span className="text-xs text-slate-300">
            Zoom {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Aumentar zoom"
            onClick={onZoomIn}
            className="spatial-icon-button"
          >
            <Plus size={18} />
          </button>
        </div>
        <p className="text-xs leading-relaxed text-slate-400">
          Use dois dedos para aproximar, afastar ou mover a mesa. Arraste pela
          alça do cartão para reposicioná-lo. Os campos e botões continuam
          disponíveis ao toque.
        </p>
      </TacticalSheet>
      <div className="pointer-events-none absolute bottom-[250px] left-6 hidden items-center gap-4 text-[10px] text-slate-500 lg:flex">
        <span className="flex items-center gap-2">
          <span className="size-1 rounded-full bg-cyan-400" />
          Arraste para explorar
        </span>
        <span>Scroll para aproximar</span>
        <span>Conecte OUT → IN para ordenar</span>
      </div>
      <TacticalSheet
        open={scannerOpen && !desktop}
        onClose={() => setScannerOpen(false)}
        title="Mapa muscular e atributos"
        description="Explore os músculos, a composição da demanda do SNC e os atributos estimados da ficha."
      >
        <TrainingBioDetails data={telemetryData} />
      </TacticalSheet>
      <TacticalSheet
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Como usar o Studio"
        description="Gestos, controles e significado das cartas."
      >
        <div className="space-y-5 text-xs leading-relaxed text-slate-300">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-white">
              Monte sua sequência
            </h3>
            <ul className="list-disc space-y-2 pl-4">
              <li>
                Role a lista do deck com a roda do mouse, pelas setas ou
                deslizando no celular.
              </li>
              <li>
                Clique em uma carta do deck para adicionar. Para posicioná-la,
                arraste a alça até a mesa.
              </li>
              <li>
                Arraste uma carta da mesa de volta ao deck para removê-la do
                treino.
              </li>
              <li>
                Arraste o fundo para navegar e use os controles de câmera para
                aproximar ou organizar.
              </li>
              <li>
                Conecte a saída OUT à entrada IN para reordenar. Aproxime cartas
                e solte para criar um bi-set.
              </li>
            </ul>
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-white">
              Edite a prescrição
            </h3>
            <ul className="list-disc space-y-2 pl-4">
              <li>
                Duplo clique no título abre a configuração. O botão de lápis
                também abre com um toque, Enter ou Espaço.
              </li>
              <li>
                Séries e repetições: digite o valor, use + / − ou role sobre o
                controle.
              </li>
              <li>
                O botão direito, o menu ⋯ ou manter pressionado sem mover abre
                as opções da carta.
              </li>
              <li>
                A aba lateral Técnicas abre inputs de segundos, posição da
                isometria, blocos e cadência. Os valores não mudam ao clicar na
                etiqueta.
              </li>
              <li>
                Use Substitutos para cadastrar até duas alternativas sem trocar
                o exercício principal.
              </li>
            </ul>
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-white">
              Cores e estrelas
            </h3>
            <div className="space-y-2">
              <p className="text-emerald-300">
                ★ Verde · isolador / menor demanda estimada
              </p>
              <p className="text-cyan-300">
                ★★ Ciano · multiarticular / demanda moderada estimada
              </p>
              <p className="text-amber-300">
                ★★★ Dourado · composto ou potência / maior demanda estimada
              </p>
            </div>
            <p className="mt-3 text-slate-500">
              Classificação visual aproximada pelas características e nome do
              exercício. Estrelas não indicam qualidade, dificuldade individual
              ou ativação muscular medida.
            </p>
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-white">
              SNC e mapa muscular
            </h3>
            <p>
              O índice de demanda do SNC soma pontos por série (2, 4 ou 7
              conforme a categoria) e um fator de 15% por técnica. Serve para
              comparar fichas; não é uma medição fisiológica. O mapa mostra
              grupos musculares ilustrativos.
            </p>
          </section>
        </div>
      </TacticalSheet>
    </>
  );
}
