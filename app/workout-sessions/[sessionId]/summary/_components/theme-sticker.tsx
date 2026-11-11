import React from "react";
import type { GamificationThemeKey } from "@/app/_lib/gamification/theme-engine";

interface ThemeStickerProps {
  theme: GamificationThemeKey;
  className?: string;
}

export function ThemeSticker({ theme, className = "" }: ThemeStickerProps) {
  switch (theme) {
    case "ANIMES":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl border-2 border-orange-400/40 bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-red-500/20 p-3 shadow-lg shadow-orange-500/10 ${className}`}
        >
          {/* Shonen Flame / Katana Aura Sticker */}
          <svg
            viewBox="0 0 120 120"
            className="size-20 drop-shadow-md sm:size-24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Aura de Energia */}
            <circle cx="60" cy="60" r="48" fill="url(#anime_aura)" opacity="0.3" />
            <path
              d="M60 12C60 12 75 35 68 52C63 64 74 72 74 72C74 72 56 68 53 54C50 40 60 12 60 12Z"
              fill="url(#fire_grad)"
            />
            {/* Katana Cruzada com Chamas */}
            <path
              d="M25 95L95 25"
              stroke="#FFF"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M20 100L35 85"
              stroke="#F97316"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M80 40L98 22"
              stroke="#E0E7FF"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Tsuba da Katana */}
            <ellipse
              cx="40"
              cy="80"
              rx="6"
              ry="4"
              transform="rotate(-45 40 80)"
              fill="#F59E0B"
            />
            {/* Faíscas de Poder */}
            <circle cx="85" cy="35" r="3" fill="#FBBF24" />
            <circle cx="35" cy="45" r="2.5" fill="#F97316" />
            <circle cx="80" cy="75" r="3" fill="#FB923C" />
            <defs>
              <radialGradient id="anime_aura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#FB923C" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="fire_grad" x1="60" y1="12" x2="60" y2="72" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDE047" />
                <stop offset="60%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute -bottom-2 rounded-full border border-orange-400/50 bg-orange-950/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-300 shadow">
            MODO SHONEN 🔥
          </div>
        </div>
      );

    case "VEHICLES":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl border-2 border-red-400/40 bg-gradient-to-br from-red-500/20 via-rose-500/10 to-amber-500/20 p-3 shadow-lg shadow-red-500/10 ${className}`}
        >
          {/* Supercarro Esportivo / Tanque Turbo Sticker */}
          <svg
            viewBox="0 0 120 120"
            className="size-20 drop-shadow-md sm:size-24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Velocímetro / Traçado de Velocidade */}
            <path
              d="M20 75C20 48 40 30 65 30C85 30 102 45 102 70"
              stroke="url(#speed_grad)"
              strokeWidth="4"
              strokeDasharray="4 4"
            />
            {/* Silhueta Supercarro / Motor Turbo */}
            <path
              d="M18 78L26 68L44 60L75 60L95 68L104 78L104 84L18 84Z"
              fill="url(#car_grad)"
            />
            <path
              d="M42 62L52 50L72 50L80 62Z"
              fill="#1E293B"
              stroke="#64748B"
              strokeWidth="1.5"
            />
            {/* Rodas Turbo Esportivas */}
            <circle cx="36" cy="84" r="9" fill="#0F172A" stroke="#EF4444" strokeWidth="2.5" />
            <circle cx="36" cy="84" r="4" fill="#94A3B8" />
            <circle cx="86" cy="84" r="9" fill="#0F172A" stroke="#EF4444" strokeWidth="2.5" />
            <circle cx="86" cy="84" r="4" fill="#94A3B8" />
            {/* Fogo de Escape Turbo Nitro */}
            <path
              d="M14 80C8 79 4 82 2 81C6 84 10 83 14 83Z"
              fill="#38BDF8"
            />
            <defs>
              <linearGradient id="speed_grad" x1="20" y1="30" x2="102" y2="70" gradientUnits="userSpaceOnUse">
                <stop stopColor="#EF4444" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <linearGradient id="car_grad" x1="18" y1="60" x2="104" y2="84" gradientUnits="userSpaceOnUse">
                <stop stopColor="#EF4444" />
                <stop offset="100%" stopColor="#991B1B" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute -bottom-2 rounded-full border border-red-400/50 bg-red-950/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-300 shadow">
            FORÇA TURBO 🏎️
          </div>
        </div>
      );

    case "ANIMALS":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl border-2 border-emerald-400/40 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-green-500/20 p-3 shadow-lg shadow-emerald-500/10 ${className}`}
        >
          {/* Silverback Gorilla / Leão Alpha Sticker */}
          <svg
            viewBox="0 0 120 120"
            className="size-20 drop-shadow-md sm:size-24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Cabeça do Predador / Silverback */}
            <circle cx="60" cy="58" r="38" fill="url(#gorilla_grad)" />
            {/* Orelhas */}
            <circle cx="32" cy="40" r="10" fill="#065F46" />
            <circle cx="88" cy="40" r="10" fill="#065F46" />
            {/* Sobrancelhas Marcadas e Foco */}
            <path
              d="M38 48L52 54M82 48L68 54"
              stroke="#34D399"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Focinho e Presas de Força */}
            <ellipse cx="60" cy="68" rx="18" ry="14" fill="#047857" />
            <circle cx="53" cy="66" r="3" fill="#022C22" />
            <circle cx="67" cy="66" r="3" fill="#022C22" />
            <path
              d="M48 76L52 70M72 76L68 70"
              stroke="#F0FDF4"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Coroa de Leão Alpha */}
            <path
              d="M44 26L52 34L60 22L68 34L76 26L74 38L46 38Z"
              fill="#FBBF24"
              stroke="#D97706"
              strokeWidth="1.5"
            />
            <defs>
              <linearGradient id="gorilla_grad" x1="60" y1="20" x2="60" y2="96" gradientUnits="userSpaceOnUse">
                <stop stopColor="#059669" />
                <stop offset="100%" stopColor="#064E3B" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute -bottom-2 rounded-full border border-emerald-400/50 bg-emerald-950/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 shadow">
            MODO ALPHA 🦍
          </div>
        </div>
      );

    case "MOVIES_SERIES":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 p-3 shadow-lg shadow-amber-500/10 ${className}`}
        >
          {/* Claquete de Cinema Clássica / Oscar de Ouro */}
          <svg
            viewBox="0 0 120 120"
            className="size-20 drop-shadow-md sm:size-24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Corpo da Claquete */}
            <rect x="24" y="44" width="72" height="52" rx="6" fill="#18181B" stroke="#D97706" strokeWidth="2" />
            {/* Linhas da Claquete */}
            <line x1="32" y1="62" x2="88" y2="62" stroke="#71717A" strokeWidth="2" />
            <line x1="32" y1="78" x2="88" y2="78" stroke="#71717A" strokeWidth="2" />
            <text x="34" y="56" fill="#FBBF24" fontSize="8" fontWeight="bold">SCENE: 01</text>
            <text x="66" y="56" fill="#FBBF24" fontSize="8" fontWeight="bold">TAKE: MAX</text>
            {/* Haste Superior Inclinada com Faixas Preto e Branco */}
            <g transform="rotate(-12 24 40)">
              <rect x="22" y="24" width="76" height="16" rx="4" fill="#F59E0B" />
              <path d="M28 24L38 40M46 24L56 40M64 24L74 40M82 24L92 40" stroke="#000" strokeWidth="3" />
            </g>
            {/* Estrela Dourada Hollywood */}
            <path
              d="M60 84L62.5 89.5L68 90.3L64 94.2L65 99.7L60 96.8L55 99.7L56 94.2L52 90.3L57.5 89.5Z"
              fill="#FBBF24"
            />
          </svg>
          <div className="absolute -bottom-2 rounded-full border border-amber-400/50 bg-amber-950/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 shadow">
            CINEMA DE AÇÃO 🎬
          </div>
        </div>
      );

    case "GAMES":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl border-2 border-indigo-400/40 bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-fuchsia-500/20 p-3 shadow-lg shadow-indigo-500/10 ${className}`}
        >
          {/* Controle Gamer Retrô + Espada 8-bit */}
          <svg
            viewBox="0 0 120 120"
            className="size-20 drop-shadow-md sm:size-24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Aura Cibernética */}
            <circle cx="60" cy="60" r="46" fill="url(#game_aura)" opacity="0.35" />
            {/* Corpo do Controle */}
            <rect x="22" y="42" width="76" height="46" rx="16" fill="#1E1B4B" stroke="#818CF8" strokeWidth="2.5" />
            {/* D-Pad (Direcional em Cruz) */}
            <path
              d="M38 56H44V50H48V56H54V60H48V66H44V60H38V56Z"
              fill="#A5B4FC"
            />
            {/* Botões de Ação (A, B, X, Y) */}
            <circle cx="72" cy="54" r="3" fill="#EC4899" />
            <circle cx="80" cy="62" r="3" fill="#3B82F6" />
            <circle cx="68" cy="62" r="3" fill="#10B981" />
            <circle cx="76" cy="70" r="3" fill="#F59E0B" />
            {/* Espada de Pixel / Cristais de XP no topo */}
            <path
              d="M60 14L63 24L73 27L63 30L60 40L57 30L47 27L57 24Z"
              fill="#FDE047"
            />
            <circle cx="34" cy="28" r="2.5" fill="#818CF8" />
            <circle cx="86" cy="28" r="2.5" fill="#C084FC" />
            <defs>
              <radialGradient id="game_aura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#818CF8" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
          <div className="absolute -bottom-2 rounded-full border border-indigo-400/50 bg-indigo-950/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300 shadow">
            LEVEL UP! 🎮
          </div>
        </div>
      );

    case "MAROMBA_BR":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl border-2 border-lime-400/40 bg-gradient-to-br from-lime-500/20 via-emerald-500/10 to-amber-500/20 p-3 shadow-lg shadow-lime-500/10 ${className}`}
        >
          {/* Haltere Pesado com Asas / Coroa Maromba */}
          <svg
            viewBox="0 0 120 120"
            className="size-20 drop-shadow-md sm:size-24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Brilho Dourado */}
            <circle cx="60" cy="60" r="46" fill="url(#maromba_aura)" opacity="0.3" />
            {/* Barra do Haltere Central */}
            <rect x="36" y="56" width="48" height="8" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
            {/* Anilhas Esquerdas */}
            <rect x="22" y="40" width="8" height="40" rx="3" fill="#84CC16" stroke="#4D7C0F" strokeWidth="1.5" />
            <rect x="30" y="46" width="6" height="28" rx="2" fill="#A3E635" />
            {/* Anilhas Direitas */}
            <rect x="90" y="40" width="8" height="40" rx="3" fill="#84CC16" stroke="#4D7C0F" strokeWidth="1.5" />
            <rect x="84" y="46" width="6" height="28" rx="2" fill="#A3E635" />
            {/* Presilhas */}
            <rect x="34" y="52" width="4" height="16" rx="1" fill="#FEF08A" />
            <rect x="82" y="52" width="4" height="16" rx="1" fill="#FEF08A" />
            {/* Raio de Potência no Topo */}
            <path
              d="M62 16L52 34H62L58 48L72 30H60L66 16Z"
              fill="#FACC15"
              stroke="#CA8A04"
              strokeWidth="1.5"
            />
            <defs>
              <radialGradient id="maromba_aura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#A3E635" />
                <stop offset="100%" stopColor="#A3E635" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
          <div className="absolute -bottom-2 rounded-full border border-lime-400/50 bg-lime-950/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lime-300 shadow">
            METEU O SHAPE! 🥩
          </div>
        </div>
      );

    case "ALL":
    default:
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/20 via-purple-500/10 to-indigo-500/20 p-3 shadow-lg shadow-primary/10 ${className}`}
        >
          {/* Medalha / Troféu de Força Suprema */}
          <svg
            viewBox="0 0 120 120"
            className="size-20 drop-shadow-md sm:size-24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Louros e Fita */}
            <path
              d="M40 22L50 50L60 36L70 50L80 22"
              stroke="#6366F1"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Medalha Dourada Central */}
            <circle cx="60" cy="65" r="32" fill="url(#medal_grad)" stroke="#CA8A04" strokeWidth="3" />
            <circle cx="60" cy="65" r="25" fill="#EAB308" stroke="#FEF08A" strokeWidth="1.5" />
            {/* Haltere / Raio no Centro */}
            <path
              d="M48 65H72M46 59V71M74 59V71M43 61V69M77 61V69"
              stroke="#713F12"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="medal_grad" x1="60" y1="33" x2="60" y2="97" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDE047" />
                <stop offset="100%" stopColor="#CA8A04" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute -bottom-2 rounded-full border border-primary/50 bg-primary/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow">
            EDICÃO TITÃ 🏆
          </div>
        </div>
      );
  }
}
