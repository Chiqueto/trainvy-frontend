"use client";

import React, { useId } from "react";
import { type MuscleGroup } from "@/app/_lib/muscle-labels";
import {
  getMuscleFillColor,
  type SessionMuscleSummary,
} from "@/app/_lib/workout-session-muscles";

export interface WorkoutAnatomyBodyProps {
  stats: SessionMuscleSummary;
  variant?: "horizontal" | "vertical" | "compact";
  isTransparentBg?: boolean;
  neutralColor?: string;
  className?: string;
  showLabels?: boolean;
  interactive?: boolean;
  onHoverMuscle?: (muscle: MuscleGroup | null) => void;
  selectedMuscle?: MuscleGroup | null;
}

export function WorkoutAnatomyBody({
  stats,
  variant = "horizontal",
  isTransparentBg = false,
  neutralColor,
  className = "",
  showLabels = true,
  interactive = true,
  onHoverMuscle,
  selectedMuscle,
}: WorkoutAnatomyBodyProps) {
  const filterId = useId();

  // Helper para obter a cor de preenchimento de cada grupo muscular
  const getColor = (group: MuscleGroup) => {
    const intensity = stats.muscles[group]?.intensity ?? 0;
    return getMuscleFillColor(intensity, { isTransparentBg, neutralColor });
  };

  const getGlow = (group: MuscleGroup) => {
    const intensity = stats.muscles[group]?.intensity ?? 0;
    return intensity >= 0.75;
  };

  const getStroke = (group: MuscleGroup) => {
    const isSelected = selectedMuscle === group;
    if (isSelected) return "#ffffff";
    const intensity = stats.muscles[group]?.intensity ?? 0;
    if (intensity > 0) return "rgba(255, 255, 255, 0.25)";
    return isTransparentBg ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.06)";
  };

  const neutralPartFill = neutralColor || (isTransparentBg ? "rgba(255, 255, 255, 0.12)" : "#27272a");
  const neutralStroke = isTransparentBg ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.06)";

  const handleMouseEnter = (group: MuscleGroup) => {
    if (interactive && onHoverMuscle) onHoverMuscle(group);
  };

  const handleMouseLeave = () => {
    if (interactive && onHoverMuscle) onHoverMuscle(null);
  };

  return (
    <div
      className={`relative flex items-center justify-center ${
        variant === "vertical" ? "flex-col gap-6" : "flex-row gap-4 sm:gap-8"
      } ${className}`}
    >
      {/* Glow filter definition */}
      <svg className="absolute size-0 overflow-hidden" aria-hidden="true">
        <defs>
          <filter id={`glow-${filterId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Visão Frontal (Anterior) */}
      <div className="flex flex-col items-center">
        {showLabels && (
          <span className="mb-1.5 font-heading text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
            Frente
          </span>
        )}
        <svg
          viewBox="0 0 160 300"
          className="h-auto w-32 drop-shadow-sm transition-transform duration-300 sm:w-36 md:w-40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cabeça & Pescoço (Neutro) */}
          <ellipse
            cx="80"
            cy="24"
            rx="12.5"
            ry="16"
            fill={neutralPartFill}
            stroke={neutralStroke}
            strokeWidth="1.2"
          />
          <path
            d="M74 39 C74 44 72 47 67 50 L93 50 C88 47 86 44 86 39 Z"
            fill={neutralPartFill}
            stroke={neutralStroke}
            strokeWidth="1.2"
          />

          {/* OMBROS (SHOULDERS - Anterior/Lateral) */}
          <g
            className={interactive ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
            onMouseEnter={() => handleMouseEnter("SHOULDERS")}
            onMouseLeave={handleMouseLeave}
            filter={getGlow("SHOULDERS") ? `url(#glow-${filterId})` : undefined}
          >
            {/* Ombro Esquerdo (Deltoide Anterior/Lateral) */}
            <path
              d="M45 52 C53 49 61 51 66 52 C64 62 61 70 51 75 C43 72 41 62 45 52 Z"
              fill={getColor("SHOULDERS")}
              stroke={getStroke("SHOULDERS")}
              strokeWidth="1.2"
            />
            {/* Ombro Direito */}
            <path
              d="M115 52 C107 49 99 51 94 52 C96 62 99 70 109 75 C117 72 119 62 115 52 Z"
              fill={getColor("SHOULDERS")}
              stroke={getStroke("SHOULDERS")}
              strokeWidth="1.2"
            />
          </g>

          {/* PEITORAL (CHEST) */}
          <g
            className={interactive ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
            onMouseEnter={() => handleMouseEnter("CHEST")}
            onMouseLeave={handleMouseLeave}
            filter={getGlow("CHEST") ? `url(#glow-${filterId})` : undefined}
          >
            {/* Peitoral Esquerdo */}
            <path
              d="M67 53 C73 53 77 54 78 55 L78 82 C72 84 64 81 58 74 C60 64 63 56 67 53 Z"
              fill={getColor("CHEST")}
              stroke={getStroke("CHEST")}
              strokeWidth="1.2"
            />
            {/* Peitoral Direito */}
            <path
              d="M93 53 C87 53 83 54 82 55 L82 82 C88 84 96 81 102 74 C100 64 97 56 93 53 Z"
              fill={getColor("CHEST")}
              stroke={getStroke("CHEST")}
              strokeWidth="1.2"
            />
          </g>

          {/* BÍCEPS (BICEPS) */}
          <g
            className={interactive ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
            onMouseEnter={() => handleMouseEnter("BICEPS")}
            onMouseLeave={handleMouseLeave}
            filter={getGlow("BICEPS") ? `url(#glow-${filterId})` : undefined}
          >
            {/* Bíceps Esquerdo */}
            <path
              d="M48 76 C55 73 57 80 56 95 C54 103 49 104 43 100 C41 91 43 82 48 76 Z"
              fill={getColor("BICEPS")}
              stroke={getStroke("BICEPS")}
              strokeWidth="1.2"
            />
            {/* Bíceps Direito */}
            <path
              d="M112 76 C105 73 103 80 104 95 C106 103 111 104 117 100 C119 91 117 82 112 76 Z"
              fill={getColor("BICEPS")}
              stroke={getStroke("BICEPS")}
              strokeWidth="1.2"
            />
          </g>

          {/* ANTEBRAÇOS (FOREARMS - Anterior) */}
          <g
            className={interactive ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
            onMouseEnter={() => handleMouseEnter("FOREARMS")}
            onMouseLeave={handleMouseLeave}
            filter={getGlow("FOREARMS") ? `url(#glow-${filterId})` : undefined}
          >
            {/* Antebraço Esquerdo */}
            <path
              d="M42 102 C49 105 51 111 48 126 C46 138 41 146 37 148 C33 145 32 138 34 126 C36 114 39 106 42 102 Z"
              fill={getColor("FOREARMS")}
              stroke={getStroke("FOREARMS")}
              strokeWidth="1.2"
            />
            {/* Antebraço Direito */}
            <path
              d="M118 102 C111 105 109 111 112 126 C114 138 119 146 123 148 C127 145 128 138 126 126 C124 114 121 106 118 102 Z"
              fill={getColor("FOREARMS")}
              stroke={getStroke("FOREARMS")}
              strokeWidth="1.2"
            />
          </g>

          {/* Mãos (Neutro) */}
          <path
            d="M36 149 C39 152 40 162 36 168 C34 167 32 163 32 158 C32 153 34 150 36 149 Z"
            fill={neutralPartFill}
            stroke={neutralStroke}
            strokeWidth="1"
          />
          <path
            d="M124 149 C121 152 120 162 124 168 C126 167 128 163 128 158 C128 153 126 150 124 149 Z"
            fill={neutralPartFill}
            stroke={neutralStroke}
            strokeWidth="1"
          />

          {/* CORE (Abdômen & Oblíquos) */}
          <g
            className={interactive ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
            onMouseEnter={() => handleMouseEnter("CORE")}
            onMouseLeave={handleMouseLeave}
            filter={getGlow("CORE") ? `url(#glow-${filterId})` : undefined}
          >
            {/* Oblíquos / Cintura Esquerda */}
            <path
              d="M60 81 C64 86 65 98 64 116 C60 114 58 104 57 94 C57 87 58 83 60 81 Z"
              fill={getColor("CORE")}
              stroke={getStroke("CORE")}
              strokeWidth="1.1"
            />
            {/* Oblíquos / Cintura Direita */}
            <path
              d="M100 81 C96 86 95 98 96 116 C100 114 102 104 103 94 C103 87 102 83 100 81 Z"
              fill={getColor("CORE")}
              stroke={getStroke("CORE")}
              strokeWidth="1.1"
            />
            {/* Abdômen Superior Esquerdo/Direito */}
            <path
              d="M68 85 L78 85 L78 97 L68 97 C67 92 67 88 68 85 Z"
              fill={getColor("CORE")}
              stroke={getStroke("CORE")}
              strokeWidth="1.1"
            />
            <path
              d="M82 85 L92 85 C93 88 93 92 92 97 L82 97 L82 85 Z"
              fill={getColor("CORE")}
              stroke={getStroke("CORE")}
              strokeWidth="1.1"
            />
            {/* Abdômen Médio Esquerdo/Direito */}
            <path
              d="M68 99 L78 99 L78 111 L68 111 C67 107 67 103 68 99 Z"
              fill={getColor("CORE")}
              stroke={getStroke("CORE")}
              strokeWidth="1.1"
            />
            <path
              d="M82 99 L92 99 C93 103 93 107 92 111 L82 111 L82 99 Z"
              fill={getColor("CORE")}
              stroke={getStroke("CORE")}
              strokeWidth="1.1"
            />
            {/* Abdômen Inferior / Infra */}
            <path
              d="M69 113 L78 113 L78 126 C74 125 71 121 69 113 Z"
              fill={getColor("CORE")}
              stroke={getStroke("CORE")}
              strokeWidth="1.1"
            />
            <path
              d="M82 113 L91 113 C89 121 86 125 82 126 L82 113 Z"
              fill={getColor("CORE")}
              stroke={getStroke("CORE")}
              strokeWidth="1.1"
            />
          </g>

          {/* ABDUTORES (HIP_ABDUCTORS - Lateral Quadril) */}
          <g
            className={interactive ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
            onMouseEnter={() => handleMouseEnter("HIP_ABDUCTORS")}
            onMouseLeave={handleMouseLeave}
            filter={getGlow("HIP_ABDUCTORS") ? `url(#glow-${filterId})` : undefined}
          >
            <path
              d="M58 118 C64 120 66 128 66 139 C60 137 56 130 55 124 C55 120 56 119 58 118 Z"
              fill={getColor("HIP_ABDUCTORS")}
              stroke={getStroke("HIP_ABDUCTORS")}
              strokeWidth="1.1"
            />
            <path
              d="M102 118 C96 120 94 128 94 139 C100 137 104 130 105 124 C105 120 104 119 102 118 Z"
              fill={getColor("HIP_ABDUCTORS")}
              stroke={getStroke("HIP_ABDUCTORS")}
              strokeWidth="1.1"
            />
          </g>

          {/* ADUTORES (ADDUCTORS - Coxa Medial) */}
          <g
            className={interactive ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
            onMouseEnter={() => handleMouseEnter("ADDUCTORS")}
            onMouseLeave={handleMouseLeave}
            filter={getGlow("ADDUCTORS") ? `url(#glow-${filterId})` : undefined}
          >
            <path
              d="M75 138 C77 146 76 166 74 178 C71 168 70 152 72 138 Z"
              fill={getColor("ADDUCTORS")}
              stroke={getStroke("ADDUCTORS")}
              strokeWidth="1"
            />
            <path
              d="M85 138 C83 146 84 166 86 178 C89 168 90 152 88 138 Z"
              fill={getColor("ADDUCTORS")}
              stroke={getStroke("ADDUCTORS")}
              strokeWidth="1"
            />
          </g>

          {/* QUADRÍCEPS (QUADRICEPS) */}
          <g
            className={interactive ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
            onMouseEnter={() => handleMouseEnter("QUADRICEPS")}
            onMouseLeave={handleMouseLeave}
            filter={getGlow("QUADRICEPS") ? `url(#glow-${filterId})` : undefined}
          >
            {/* Quadríceps Esquerdo */}
            <path
              d="M56 139 C62 136 71 138 72 144 C70 162 70 178 72 196 C67 202 61 199 57 192 C54 176 53 154 56 139 Z"
              fill={getColor("QUADRICEPS")}
              stroke={getStroke("QUADRICEPS")}
              strokeWidth="1.2"
            />
            {/* Quadríceps Direito */}
            <path
              d="M104 139 C98 136 89 138 88 144 C90 162 90 178 88 196 C93 202 99 199 103 192 C106 176 107 154 104 139 Z"
              fill={getColor("QUADRICEPS")}
              stroke={getStroke("QUADRICEPS")}
              strokeWidth="1.2"
            />
          </g>

          {/* Joelhos (Neutro) */}
          <ellipse
            cx="64"
            cy="204"
            rx="5.5"
            ry="4.5"
            fill={neutralPartFill}
            stroke={neutralStroke}
            strokeWidth="1"
          />
          <ellipse
            cx="96"
            cy="204"
            rx="5.5"
            ry="4.5"
            fill={neutralPartFill}
            stroke={neutralStroke}
            strokeWidth="1"
          />

          {/* PANTURRILHAS (CALVES - Anterior/Tibiais) */}
          <g
            className={interactive ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
            onMouseEnter={() => handleMouseEnter("CALVES")}
            onMouseLeave={handleMouseLeave}
            filter={getGlow("CALVES") ? `url(#glow-${filterId})` : undefined}
          >
            {/* Panturrilha Esquerda */}
            <path
              d="M59 211 C65 210 69 211 70 216 C71 228 69 248 66 268 C62 268 60 262 58 248 C56 235 56 220 59 211 Z"
              fill={getColor("CALVES")}
              stroke={getStroke("CALVES")}
              strokeWidth="1.2"
            />
            {/* Panturrilha Direita */}
            <path
              d="M101 211 C95 210 91 211 90 216 C89 228 91 248 94 268 C98 268 100 262 102 248 C104 235 104 220 101 211 Z"
              fill={getColor("CALVES")}
              stroke={getStroke("CALVES")}
              strokeWidth="1.2"
            />
          </g>

          {/* Pés (Neutro) */}
          <path
            d="M58 270 C63 270 67 270 66 278 C65 284 57 287 54 286 C54 280 56 273 58 270 Z"
            fill={neutralPartFill}
            stroke={neutralStroke}
            strokeWidth="1"
          />
          <path
            d="M102 270 C97 270 93 270 94 278 C95 284 103 287 106 286 C106 280 104 273 102 270 Z"
            fill={neutralPartFill}
            stroke={neutralStroke}
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Visão Traseira (Posterior / Costas) */}
      <div className="flex flex-col items-center">
        {showLabels && (
          <span className="mb-1.5 font-heading text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
            Costas
          </span>
        )}
        <svg
          viewBox="0 0 160 300"
          className="h-auto w-32 drop-shadow-sm transition-transform duration-300 sm:w-36 md:w-40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cabeça & Nuca (Neutro) */}
          <ellipse
            cx="80"
            cy="24"
            rx="12.5"
            ry="16"
            fill={neutralPartFill}
            stroke={neutralStroke}
            strokeWidth="1.2"
          />
          <path
            d="M74 38 L86 38 L84 48 L76 48 Z"
            fill={neutralPartFill}
            stroke={neutralStroke}
            strokeWidth="1.2"
          />

          {/* OMBROS (SHOULDERS - Posterior/Deltoide Traseiro) */}
          <g
            className={interactive ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
            onMouseEnter={() => handleMouseEnter("SHOULDERS")}
            onMouseLeave={handleMouseLeave}
            filter={getGlow("SHOULDERS") ? `url(#glow-${filterId})` : undefined}
          >
            {/* Ombro Esquerdo Traseiro */}
            <path
              d="M45 52 C53 49 61 50 65 52 C63 62 60 70 51 75 C43 72 41 62 45 52 Z"
              fill={getColor("SHOULDERS")}
              stroke={getStroke("SHOULDERS")}
              strokeWidth="1.2"
            />
            {/* Ombro Direito Traseiro */}
            <path
              d="M115 52 C107 49 99 50 95 52 C97 62 100 70 109 75 C117 72 119 62 115 52 Z"
              fill={getColor("SHOULDERS")}
              stroke={getStroke("SHOULDERS")}
              strokeWidth="1.2"
            />
          </g>

          {/* COSTAS (BACK - Trapézio, Dorsais & Lombar) */}
          <g
            className={interactive ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
            onMouseEnter={() => handleMouseEnter("BACK")}
            onMouseLeave={handleMouseLeave}
            filter={getGlow("BACK") ? `url(#glow-${filterId})` : undefined}
          >
            {/* Trapézio Superior & Médio (Losango) */}
            <path
              d="M74 48 L86 48 C94 51 98 55 96 64 C92 73 84 82 80 88 C76 82 68 73 64 64 C62 55 66 51 74 48 Z"
              fill={getColor("BACK")}
              stroke={getStroke("BACK")}
              strokeWidth="1.2"
            />

            {/* Dorsal Esquerda (Latissimus Dorsi / Asa) */}
            <path
              d="M65 65 C69 74 76 82 78 89 L78 114 C73 116 66 114 62 104 C59 93 59 78 65 65 Z"
              fill={getColor("BACK")}
              stroke={getStroke("BACK")}
              strokeWidth="1.2"
            />
            {/* Dorsal Direita */}
            <path
              d="M95 65 C91 74 84 82 82 89 L82 114 C87 116 94 114 98 104 C101 93 101 78 95 65 Z"
              fill={getColor("BACK")}
              stroke={getStroke("BACK")}
              strokeWidth="1.2"
            />

            {/* Lombar / Eretores da Espinha */}
            <path
              d="M72 114 L78 114 L78 127 L70 127 C70 120 71 116 72 114 Z"
              fill={getColor("BACK")}
              stroke={getStroke("BACK")}
              strokeWidth="1.1"
            />
            <path
              d="M88 114 L82 114 L82 127 L90 127 C90 120 89 116 88 114 Z"
              fill={getColor("BACK")}
              stroke={getStroke("BACK")}
              strokeWidth="1.1"
            />
          </g>

          {/* TRÍCEPS (TRICEPS - Posterior do Braço) */}
          <g
            className={interactive ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
            onMouseEnter={() => handleMouseEnter("TRICEPS")}
            onMouseLeave={handleMouseLeave}
            filter={getGlow("TRICEPS") ? `url(#glow-${filterId})` : undefined}
          >
            {/* Tríceps Esquerdo */}
            <path
              d="M48 76 C55 73 57 80 56 96 C54 104 49 105 43 101 C41 92 43 82 48 76 Z"
              fill={getColor("TRICEPS")}
              stroke={getStroke("TRICEPS")}
              strokeWidth="1.2"
            />
            {/* Tríceps Direito */}
            <path
              d="M112 76 C105 73 103 80 104 96 C106 104 111 105 117 101 C119 92 117 82 112 76 Z"
              fill={getColor("TRICEPS")}
              stroke={getStroke("TRICEPS")}
              strokeWidth="1.2"
            />
          </g>

          {/* ANTEBRAÇOS (FOREARMS - Posterior / Extensores) */}
          <g
            className={interactive ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
            onMouseEnter={() => handleMouseEnter("FOREARMS")}
            onMouseLeave={handleMouseLeave}
            filter={getGlow("FOREARMS") ? `url(#glow-${filterId})` : undefined}
          >
            {/* Antebraço Esquerdo Traseiro */}
            <path
              d="M42 102 C49 105 51 111 48 126 C46 138 41 146 37 148 C33 145 32 138 34 126 C36 114 39 106 42 102 Z"
              fill={getColor("FOREARMS")}
              stroke={getStroke("FOREARMS")}
              strokeWidth="1.2"
            />
            {/* Antebraço Direito Traseiro */}
            <path
              d="M118 102 C111 105 109 111 112 126 C114 138 119 146 123 148 C127 145 128 138 126 126 C124 114 121 106 118 102 Z"
              fill={getColor("FOREARMS")}
              stroke={getStroke("FOREARMS")}
              strokeWidth="1.2"
            />
          </g>

          {/* Mãos (Neutro) */}
          <path
            d="M36 149 C39 152 40 162 36 168 C34 167 32 163 32 158 C32 153 34 150 36 149 Z"
            fill={neutralPartFill}
            stroke={neutralStroke}
            strokeWidth="1"
          />
          <path
            d="M124 149 C121 152 120 162 124 168 C126 167 128 163 128 158 C128 153 126 150 124 149 Z"
            fill={neutralPartFill}
            stroke={neutralStroke}
            strokeWidth="1"
          />

          {/* ABDUTORES (HIP_ABDUCTORS - Glúteo Médio Posterior) */}
          <g
            className={interactive ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
            onMouseEnter={() => handleMouseEnter("HIP_ABDUCTORS")}
            onMouseLeave={handleMouseLeave}
            filter={getGlow("HIP_ABDUCTORS") ? `url(#glow-${filterId})` : undefined}
          >
            <path
              d="M58 124 C64 124 67 128 66 138 C60 137 56 133 55 128 C55 125 56 124 58 124 Z"
              fill={getColor("HIP_ABDUCTORS")}
              stroke={getStroke("HIP_ABDUCTORS")}
              strokeWidth="1.1"
            />
            <path
              d="M102 124 C96 124 93 128 94 138 C100 137 104 133 105 128 C105 125 104 124 102 124 Z"
              fill={getColor("HIP_ABDUCTORS")}
              stroke={getStroke("HIP_ABDUCTORS")}
              strokeWidth="1.1"
            />
          </g>

          {/* GLÚTEOS (GLUTES - Glúteo Máximo) */}
          <g
            className={interactive ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
            onMouseEnter={() => handleMouseEnter("GLUTES")}
            onMouseLeave={handleMouseLeave}
            filter={getGlow("GLUTES") ? `url(#glow-${filterId})` : undefined}
          >
            {/* Glúteo Esquerdo */}
            <path
              d="M62 128 C70 127 78 127 79 133 L79 158 C72 163 63 162 58 152 C56 142 58 133 62 128 Z"
              fill={getColor("GLUTES")}
              stroke={getStroke("GLUTES")}
              strokeWidth="1.2"
            />
            {/* Glúteo Direito */}
            <path
              d="M98 128 C90 127 82 127 81 133 L81 158 C88 163 97 162 102 152 C104 142 102 133 98 128 Z"
              fill={getColor("GLUTES")}
              stroke={getStroke("GLUTES")}
              strokeWidth="1.2"
            />
          </g>

          {/* POSTERIORES DE COXA (HAMSTRINGS - Isquiotibiais) */}
          <g
            className={interactive ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
            onMouseEnter={() => handleMouseEnter("HAMSTRINGS")}
            onMouseLeave={handleMouseLeave}
            filter={getGlow("HAMSTRINGS") ? `url(#glow-${filterId})` : undefined}
          >
            {/* Posterior Esquerdo */}
            <path
              d="M58 156 C64 162 76 162 78 158 C78 172 76 186 73 197 C68 200 63 199 58 194 C56 182 56 168 58 156 Z"
              fill={getColor("HAMSTRINGS")}
              stroke={getStroke("HAMSTRINGS")}
              strokeWidth="1.2"
            />
            {/* Posterior Direito */}
            <path
              d="M102 156 C96 162 84 162 82 158 C82 172 84 186 87 197 C92 200 97 199 102 194 C104 182 104 168 102 156 Z"
              fill={getColor("HAMSTRINGS")}
              stroke={getStroke("HAMSTRINGS")}
              strokeWidth="1.2"
            />
          </g>

          {/* Fossa Poplítea / Atrás dos Joelhos (Neutro) */}
          <path
            d="M59 198 L71 198 L69 206 L61 206 Z"
            fill={neutralPartFill}
            stroke={neutralStroke}
            strokeWidth="1"
          />
          <path
            d="M89 198 L101 198 L99 206 L91 206 Z"
            fill={neutralPartFill}
            stroke={neutralStroke}
            strokeWidth="1"
          />

          {/* PANTURRILHAS (CALVES - Posterior / Gastrocnêmio) */}
          <g
            className={interactive ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
            onMouseEnter={() => handleMouseEnter("CALVES")}
            onMouseLeave={handleMouseLeave}
            filter={getGlow("CALVES") ? `url(#glow-${filterId})` : undefined}
          >
            {/* Panturrilha Esquerda Traseira (ventres medial e lateral) */}
            <path
              d="M58 208 C64 207 70 207 72 214 C73 226 71 246 66 268 C62 268 59 261 57 246 C55 233 55 218 58 208 Z"
              fill={getColor("CALVES")}
              stroke={getStroke("CALVES")}
              strokeWidth="1.2"
            />
            {/* Panturrilha Direita Traseira */}
            <path
              d="M102 208 C96 207 90 207 88 214 C87 226 89 246 94 268 C98 268 101 261 103 246 C105 233 105 218 102 208 Z"
              fill={getColor("CALVES")}
              stroke={getStroke("CALVES")}
              strokeWidth="1.2"
            />
          </g>

          {/* Calcanhares / Pés Traseiros (Neutro) */}
          <path
            d="M58 270 C63 270 66 270 66 278 C65 284 58 286 55 285 C55 279 56 273 58 270 Z"
            fill={neutralPartFill}
            stroke={neutralStroke}
            strokeWidth="1"
          />
          <path
            d="M102 270 C97 270 94 270 94 278 C95 284 102 286 105 285 C105 279 104 273 102 270 Z"
            fill={neutralPartFill}
            stroke={neutralStroke}
            strokeWidth="1"
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * Gera o SVG estático em string para ser rasterizado no canvas 1080x1920
 */
export function generateWorkoutAnatomySvgString(
  stats: SessionMuscleSummary,
  options?: {
    isTransparentBg?: boolean;
    neutralColor?: string;
  }
): string {
  const isTransparentBg = options?.isTransparentBg ?? false;
  const neutralPartFill = options?.neutralColor || (isTransparentBg ? "rgba(255, 255, 255, 0.12)" : "#27272a");
  const neutralStroke = isTransparentBg ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.08)";

  const getColor = (group: MuscleGroup) => {
    const intensity = stats.muscles[group]?.intensity ?? 0;
    return getMuscleFillColor(intensity, { isTransparentBg, neutralColor: options?.neutralColor });
  };

  const getStroke = (group: MuscleGroup) => {
    const intensity = stats.muscles[group]?.intensity ?? 0;
    if (intensity > 0) return "rgba(255, 255, 255, 0.35)";
    return neutralStroke;
  };

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 320" width="760" height="640" fill="none">
  <!-- Frente (X: 10 a 170) -->
  <g transform="translate(10, 0)">
    <text x="80" y="16" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="rgba(255,255,255,0.6)" letter-spacing="2">FRENTE</text>
    <ellipse cx="80" cy="38" rx="12.5" ry="16" fill="${neutralPartFill}" stroke="${neutralStroke}" stroke-width="1.2"/>
    <path d="M74 53 C74 58 72 61 67 64 L93 64 C88 61 86 58 86 53 Z" fill="${neutralPartFill}" stroke="${neutralStroke}" stroke-width="1.2"/>
    
    <!-- Deltoides -->
    <path d="M45 66 C53 63 61 65 66 66 C64 76 61 84 51 89 C43 86 41 76 45 66 Z" fill="${getColor("SHOULDERS")}" stroke="${getStroke("SHOULDERS")}" stroke-width="1.2"/>
    <path d="M115 66 C107 63 99 65 94 66 C96 76 99 84 109 89 C117 86 119 76 115 66 Z" fill="${getColor("SHOULDERS")}" stroke="${getStroke("SHOULDERS")}" stroke-width="1.2"/>
    
    <!-- Peitoral -->
    <path d="M67 67 C73 67 77 68 78 69 L78 96 C72 98 64 95 58 88 C60 78 63 70 67 67 Z" fill="${getColor("CHEST")}" stroke="${getStroke("CHEST")}" stroke-width="1.2"/>
    <path d="M93 67 C87 67 83 68 82 69 L82 96 C88 98 96 95 102 88 C100 78 97 70 93 67 Z" fill="${getColor("CHEST")}" stroke="${getStroke("CHEST")}" stroke-width="1.2"/>
    
    <!-- Bíceps -->
    <path d="M48 90 C55 87 57 94 56 109 C54 117 49 118 43 114 C41 105 43 96 48 90 Z" fill="${getColor("BICEPS")}" stroke="${getStroke("BICEPS")}" stroke-width="1.2"/>
    <path d="M112 90 C105 87 103 94 104 109 C106 117 111 118 117 114 C119 105 117 96 112 90 Z" fill="${getColor("BICEPS")}" stroke="${getStroke("BICEPS")}" stroke-width="1.2"/>
    
    <!-- Antebraços -->
    <path d="M42 116 C49 119 51 125 48 140 C46 152 41 160 37 162 C33 159 32 152 34 140 C36 128 39 120 42 116 Z" fill="${getColor("FOREARMS")}" stroke="${getStroke("FOREARMS")}" stroke-width="1.2"/>
    <path d="M118 116 C111 119 109 125 112 140 C114 152 119 160 123 162 C127 159 128 152 126 140 C124 128 121 120 118 116 Z" fill="${getColor("FOREARMS")}" stroke="${getStroke("FOREARMS")}" stroke-width="1.2"/>
    <path d="M36 163 C39 166 40 176 36 182 C34 181 32 177 32 172 C32 167 34 164 36 163 Z" fill="${neutralPartFill}" stroke="${neutralStroke}" stroke-width="1"/>
    <path d="M124 163 C121 166 120 176 124 182 C126 181 128 177 128 172 C128 167 126 164 124 163 Z" fill="${neutralPartFill}" stroke="${neutralStroke}" stroke-width="1"/>
    
    <!-- Core / Abdômen -->
    <path d="M60 95 C64 100 65 112 64 130 C60 128 58 118 57 108 C57 101 58 97 60 95 Z" fill="${getColor("CORE")}" stroke="${getStroke("CORE")}" stroke-width="1.1"/>
    <path d="M100 95 C96 100 95 112 96 130 C100 128 102 118 103 108 C103 101 102 97 100 95 Z" fill="${getColor("CORE")}" stroke="${getStroke("CORE")}" stroke-width="1.1"/>
    <path d="M68 99 L78 99 L78 111 L68 111 C67 106 67 102 68 99 Z" fill="${getColor("CORE")}" stroke="${getStroke("CORE")}" stroke-width="1.1"/>
    <path d="M82 99 L92 99 C93 102 93 106 92 111 L82 111 L82 99 Z" fill="${getColor("CORE")}" stroke="${getStroke("CORE")}" stroke-width="1.1"/>
    <path d="M68 113 L78 113 L78 125 L68 125 C67 121 67 117 68 113 Z" fill="${getColor("CORE")}" stroke="${getStroke("CORE")}" stroke-width="1.1"/>
    <path d="M82 113 L92 113 C93 117 93 121 92 125 L82 125 L82 113 Z" fill="${getColor("CORE")}" stroke="${getStroke("CORE")}" stroke-width="1.1"/>
    <path d="M69 127 L78 127 L78 140 C74 139 71 135 69 127 Z" fill="${getColor("CORE")}" stroke="${getStroke("CORE")}" stroke-width="1.1"/>
    <path d="M82 127 L91 127 C89 135 86 139 82 140 L82 127 Z" fill="${getColor("CORE")}" stroke="${getStroke("CORE")}" stroke-width="1.1"/>
    
    <!-- Abdutores / Adutores -->
    <path d="M58 132 C64 134 66 142 66 153 C60 151 56 144 55 138 C55 134 56 133 58 132 Z" fill="${getColor("HIP_ABDUCTORS")}" stroke="${getStroke("HIP_ABDUCTORS")}" stroke-width="1.1"/>
    <path d="M102 132 C96 134 94 142 94 153 C100 151 104 144 105 138 C105 134 104 133 102 132 Z" fill="${getColor("HIP_ABDUCTORS")}" stroke="${getStroke("HIP_ABDUCTORS")}" stroke-width="1.1"/>
    <path d="M75 152 C77 160 76 180 74 192 C71 182 70 166 72 152 Z" fill="${getColor("ADDUCTORS")}" stroke="${getStroke("ADDUCTORS")}" stroke-width="1"/>
    <path d="M85 152 C83 160 84 180 86 192 C89 182 90 166 88 152 Z" fill="${getColor("ADDUCTORS")}" stroke="${getStroke("ADDUCTORS")}" stroke-width="1"/>
    
    <!-- Quadríceps -->
    <path d="M56 153 C62 150 71 152 72 158 C70 176 70 192 72 210 C67 216 61 213 57 206 C54 190 53 168 56 153 Z" fill="${getColor("QUADRICEPS")}" stroke="${getStroke("QUADRICEPS")}" stroke-width="1.2"/>
    <path d="M104 153 C98 150 89 152 88 158 C90 176 90 192 88 210 C93 216 99 213 103 206 C106 190 107 168 104 153 Z" fill="${getColor("QUADRICEPS")}" stroke="${getStroke("QUADRICEPS")}" stroke-width="1.2"/>
    
    <!-- Joelhos -->
    <ellipse cx="64" cy="218" rx="5.5" ry="4.5" fill="${neutralPartFill}" stroke="${neutralStroke}" stroke-width="1"/>
    <ellipse cx="96" cy="218" rx="5.5" ry="4.5" fill="${neutralPartFill}" stroke="${neutralStroke}" stroke-width="1"/>
    
    <!-- Panturrilhas -->
    <path d="M59 225 C65 224 69 225 70 230 C71 242 69 262 66 282 C62 282 60 276 58 262 C56 249 56 234 59 225 Z" fill="${getColor("CALVES")}" stroke="${getStroke("CALVES")}" stroke-width="1.2"/>
    <path d="M101 225 C95 224 91 225 90 230 C89 242 91 262 94 282 C98 282 100 276 102 262 C104 249 104 234 101 225 Z" fill="${getColor("CALVES")}" stroke="${getStroke("CALVES")}" stroke-width="1.2"/>
    
    <!-- Pés -->
    <path d="M58 284 C63 284 67 284 66 292 C65 298 57 301 54 300 C54 294 56 287 58 284 Z" fill="${neutralPartFill}" stroke="${neutralStroke}" stroke-width="1"/>
    <path d="M102 284 C97 284 93 284 94 292 C95 298 103 301 106 300 C106 294 104 287 102 284 Z" fill="${neutralPartFill}" stroke="${neutralStroke}" stroke-width="1"/>
  </g>

  <!-- Costas (X: 190 a 370) -->
  <g transform="translate(200, 0)">
    <text x="80" y="16" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="rgba(255,255,255,0.6)" letter-spacing="2">COSTAS</text>
    <ellipse cx="80" cy="38" rx="12.5" ry="16" fill="${neutralPartFill}" stroke="${neutralStroke}" stroke-width="1.2"/>
    <path d="M74 52 L86 52 L84 62 L76 62 Z" fill="${neutralPartFill}" stroke="${neutralStroke}" stroke-width="1.2"/>
    
    <!-- Ombros Traseiros -->
    <path d="M45 66 C53 63 61 64 65 66 C63 76 60 84 51 89 C43 86 41 76 45 66 Z" fill="${getColor("SHOULDERS")}" stroke="${getStroke("SHOULDERS")}" stroke-width="1.2"/>
    <path d="M115 66 C107 63 99 64 95 66 C97 76 100 84 109 89 C117 86 119 76 115 66 Z" fill="${getColor("SHOULDERS")}" stroke="${getStroke("SHOULDERS")}" stroke-width="1.2"/>
    
    <!-- Costas (Trapézio + Dorsais) -->
    <path d="M74 62 L86 62 C94 65 98 69 96 78 C92 87 84 96 80 102 C76 96 68 87 64 78 C62 69 66 65 74 62 Z" fill="${getColor("BACK")}" stroke="${getStroke("BACK")}" stroke-width="1.2"/>
    <path d="M65 79 C69 88 76 96 78 103 L78 128 C73 130 66 128 62 118 C59 107 59 92 65 79 Z" fill="${getColor("BACK")}" stroke="${getStroke("BACK")}" stroke-width="1.2"/>
    <path d="M95 79 C91 88 84 96 82 103 L82 128 C87 130 94 128 98 118 C101 107 101 92 95 79 Z" fill="${getColor("BACK")}" stroke="${getStroke("BACK")}" stroke-width="1.2"/>
    <path d="M72 128 L78 128 L78 141 L70 141 C70 134 71 130 72 128 Z" fill="${getColor("BACK")}" stroke="${getStroke("BACK")}" stroke-width="1.1"/>
    <path d="M88 128 L82 128 L82 141 L90 141 C90 134 89 130 88 128 Z" fill="${getColor("BACK")}" stroke="${getStroke("BACK")}" stroke-width="1.1"/>
    
    <!-- Tríceps -->
    <path d="M48 90 C55 87 57 94 56 110 C54 118 49 119 43 115 C41 106 43 96 48 90 Z" fill="${getColor("TRICEPS")}" stroke="${getStroke("TRICEPS")}" stroke-width="1.2"/>
    <path d="M112 90 C105 87 103 94 104 110 C106 118 111 119 117 115 C119 106 117 96 112 90 Z" fill="${getColor("TRICEPS")}" stroke="${getStroke("TRICEPS")}" stroke-width="1.2"/>
    
    <!-- Antebraços Traseiros -->
    <path d="M42 116 C49 119 51 125 48 140 C46 152 41 160 37 162 C33 159 32 152 34 140 C36 128 39 120 42 116 Z" fill="${getColor("FOREARMS")}" stroke="${getStroke("FOREARMS")}" stroke-width="1.2"/>
    <path d="M118 116 C111 119 109 125 112 140 C114 152 119 160 123 162 C127 159 128 152 126 140 C124 128 121 120 118 116 Z" fill="${getColor("FOREARMS")}" stroke="${getStroke("FOREARMS")}" stroke-width="1.2"/>
    <path d="M36 163 C39 166 40 176 36 182 C34 181 32 177 32 172 C32 167 34 164 36 163 Z" fill="${neutralPartFill}" stroke="${neutralStroke}" stroke-width="1"/>
    <path d="M124 163 C121 166 120 176 124 182 C126 181 128 177 128 172 C128 167 126 164 124 163 Z" fill="${neutralPartFill}" stroke="${neutralStroke}" stroke-width="1"/>
    
    <!-- Glúteos -->
    <path d="M58 138 C64 138 67 142 66 152 C60 151 56 147 55 142 C55 139 56 138 58 138 Z" fill="${getColor("HIP_ABDUCTORS")}" stroke="${getStroke("HIP_ABDUCTORS")}" stroke-width="1.1"/>
    <path d="M102 138 C96 138 93 142 94 152 C100 151 104 147 105 142 C105 139 104 138 102 138 Z" fill="${getColor("HIP_ABDUCTORS")}" stroke="${getStroke("HIP_ABDUCTORS")}" stroke-width="1.1"/>
    <path d="M62 142 C70 141 78 141 79 147 L79 172 C72 177 63 176 58 166 C56 156 58 147 62 142 Z" fill="${getColor("GLUTES")}" stroke="${getStroke("GLUTES")}" stroke-width="1.2"/>
    <path d="M98 142 C90 141 82 141 81 147 L81 172 C88 177 97 176 102 166 C104 156 102 147 98 142 Z" fill="${getColor("GLUTES")}" stroke="${getStroke("GLUTES")}" stroke-width="1.2"/>
    
    <!-- Posteriores -->
    <path d="M58 170 C64 176 76 176 78 172 C78 186 76 200 73 211 C68 214 63 213 58 208 C56 196 56 182 58 170 Z" fill="${getColor("HAMSTRINGS")}" stroke="${getStroke("HAMSTRINGS")}" stroke-width="1.2"/>
    <path d="M102 170 C96 176 84 176 82 172 C82 186 84 200 87 211 C92 214 97 213 102 208 C104 196 104 182 102 170 Z" fill="${getColor("HAMSTRINGS")}" stroke="${getStroke("HAMSTRINGS")}" stroke-width="1.2"/>
    
    <!-- Fossa poplítea -->
    <path d="M59 212 L71 212 L69 220 L61 220 Z" fill="${neutralPartFill}" stroke="${neutralStroke}" stroke-width="1"/>
    <path d="M89 212 L101 212 L99 220 L91 220 Z" fill="${neutralPartFill}" stroke="${neutralStroke}" stroke-width="1"/>
    
    <!-- Panturrilhas Traseiras -->
    <path d="M58 222 C64 221 70 221 72 228 C73 240 71 260 66 282 C62 282 59 275 57 260 C55 247 55 232 58 222 Z" fill="${getColor("CALVES")}" stroke="${getStroke("CALVES")}" stroke-width="1.2"/>
    <path d="M102 222 C96 221 90 221 88 228 C87 240 89 260 94 282 C98 282 101 275 103 260 C105 247 105 232 102 222 Z" fill="${getColor("CALVES")}" stroke="${getStroke("CALVES")}" stroke-width="1.2"/>
    
    <!-- Calcanhares -->
    <path d="M58 284 C63 284 66 284 66 292 C65 298 58 300 55 299 C55 293 56 287 58 284 Z" fill="${neutralPartFill}" stroke="${neutralStroke}" stroke-width="1"/>
    <path d="M102 284 C97 284 94 284 94 292 C95 298 102 300 105 299 C105 293 104 287 102 284 Z" fill="${neutralPartFill}" stroke="${neutralStroke}" stroke-width="1"/>
  </g>
</svg>
`.trim();
}
