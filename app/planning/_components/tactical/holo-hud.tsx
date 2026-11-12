"use client";

import { useState } from "react";
import {
  Activity,
  ArrowLeft,
  Clock3,
  Compass,
  Eye,
  CircleHelp,
  Brain,
  Layers3,
  LayoutGrid,
  List,
  Minus,
  Plus,
  RotateCcw,
  Settings2,
  X,
} from "lucide-react";
import type { telemetry } from "../../_lib/tactical";
import type { WorkoutPlanDraftDay } from "../../_lib/workout-plan-builder";
import { BodyHeatmapSVG } from "./body-heatmap-svg";
import { AttributeRadarChart } from "./attribute-radar-chart";
import { SealButton } from "./seal-button";
import { TacticalSheet } from "./tactical-sheet";

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
  disabled,
}: HoloHudProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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
            <h2 className="truncate text-sm font-semibold tracking-tight text-white sm:text-lg">
              {planName || "Seu próximo treino"}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {onListView && (
              <button
                type="button"
                onClick={onListView}
                aria-label="Visualização em lista"
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
              <div className="min-w-10 sm:w-36 [&_button]:h-10">
                <SealButton disabled={disabled} onSave={onSave} />
              </div>
            )}
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-3 border-t border-white/5 px-3 py-2 sm:px-6">
          <span className="hidden text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:block">
            Divisão
          </span>
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

      <div className="pointer-events-auto absolute left-3 top-[140px] z-30 sm:left-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-expanded={scannerOpen}
            onClick={() => setScannerOpen(!scannerOpen)}
            className="spatial-glass flex h-10 items-center gap-2 rounded-xl px-3 text-xs text-slate-300"
          >
            <Activity size={15} className="text-cyan-300" />
            Mapa muscular
            <span className="size-1.5 rounded-full bg-cyan-300/80" />
          </button>
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
        {scannerOpen && (
          <section
            aria-label="Resumo muscular"
            className="spatial-glass mt-2 max-h-[calc(100dvh-390px)] w-64 overflow-y-auto rounded-2xl p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold">Distribuição do treino</h3>
              <button
                type="button"
                aria-label="Fechar mapa muscular"
                onClick={() => setScannerOpen(false)}
                className="spatial-icon-button !size-7"
              >
                <X size={14} />
              </button>
            </div>
            <div className="[&_svg]:max-h-40">
              <BodyHeatmapSVG volumes={telemetryData.muscles} />
            </div>
            <div className="mt-3 rounded-xl border border-amber-300/15 bg-amber-300/5 p-3">
              <h4 className="flex items-center gap-2 text-xs font-medium text-amber-200">
                <Brain size={14} />
                Demanda do SNC
              </h4>
              <p className="mt-2 font-mono text-xl text-amber-100">
                {telemetryData.neural}
                <span className="ml-2 text-[10px] text-slate-400">
                  pontos estimados
                </span>
              </p>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                Índice ilustrativo da ficha: considera a categoria dos
                exercícios, séries e técnicas. Não mede fadiga nem estresse real
                do sistema nervoso central.
              </p>
            </div>
            <div className="mt-3 border-t border-white/10 pt-3 [&_svg]:max-h-32">
              <AttributeRadarChart values={telemetryData.attributes} />
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
              Grupos musculares e atributos ilustrativos, estimados a partir da
              ficha.
            </p>
          </section>
        )}
      </div>

      <div className="spatial-camera spatial-glass pointer-events-auto absolute right-3 top-[140px] z-30 flex items-center gap-1 rounded-xl p-1 sm:right-6">
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
      <div className="pointer-events-none absolute bottom-[250px] left-6 hidden items-center gap-4 text-[10px] text-slate-500 lg:flex">
        <span className="flex items-center gap-2">
          <span className="size-1 rounded-full bg-cyan-400" />
          Arraste para explorar
        </span>
        <span>Scroll para aproximar</span>
        <span>Conecte OUT → IN para ordenar</span>
      </div>
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
