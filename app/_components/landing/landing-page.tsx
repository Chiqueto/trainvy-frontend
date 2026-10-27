"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  CircleCheck,
  Dumbbell,
  Flame,
  Layers3,
  Menu,
  MoveUpRight,
  Pause,
  Play,
  Plus,
  Rotate3D,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Logo } from "../logo";
import type { ExerciseAnimation } from "../exercise-3d/exercises";
import styles from "./landing.module.css";

const Viewer = dynamic(
  () =>
    import("../exercise-3d/exercise-3d-viewer").then((m) => m.Exercise3DViewer),
  {
    ssr: false,
    loading: () => (
      <div className={styles.viewerLoading} role="status">
        <Rotate3D />
        Preparando sua experiência 3D…
      </div>
    ),
  },
);

const exercises: { id: ExerciseAnimation; label: string }[] = [
  { id: "squat", label: "Agachamento" },
  { id: "bench-press", label: "Supino reto" },
  { id: "incline-dumbbell-press", label: "Supino inclinado" },
];

const questions = [
  [
    "Posso começar de graça?",
    "Sim. A conta de atleta começa sem mensalidade. Você pode organizar seus treinos, registrar séries e acompanhar sua evolução. Recursos de IA e gestão de alunos seguem a disponibilidade e os limites do seu plano, exibidos no sistema.",
  ],
  [
    "Preciso ter um personal para usar?",
    "Não. Você pode montar e executar seus próprios treinos. Se treinar com um personal no Trainvy, também pode receber prescrições e compartilhar o acompanhamento pelo vínculo entre as contas.",
  ],
  [
    "O que posso explorar na visualização 3D?",
    "Nos exercícios com 3D disponível, você pode girar a câmera, mudar o ângulo, pausar e explorar o movimento. Os destaques musculares são ilustrativos. A visualização ajuda a entender o exercício e não substitui a orientação de um profissional.",
  ],
  [
    "A IA decide meu treino sozinha?",
    "Você mantém o controle. O Coach AI ajuda a organizar o planejamento e propõe treinos que podem ser revisados e editados. A disponibilidade da IA depende do plano e dos limites de uso da conta.",
  ],
  [
    "Funciona no celular e no computador?",
    "Sim. O Trainvy funciona pelo navegador e pode ser adicionado à tela inicial como aplicativo. No app instalado, você entra direto no sistema, sem passar por esta página. O acesso aos dados e o salvamento de treinos precisam de conexão.",
  ],
];

function Chart({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`${styles.chart} ${compact ? styles.chartCompact : ""}`}>
      <div className={styles.chartGrid} />
      <svg
        viewBox="0 0 400 140"
        fill="none"
        role="img"
        aria-label="Exemplo ilustrativo de evolução de carga ao longo de oito semanas"
      >
        <defs>
          <linearGradient
            id={compact ? "chart-fill-small" : "chart-fill"}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop stopColor="#32acff" stopOpacity=".35" />
            <stop offset="1" stopColor="#32acff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 123L48 110L98 114L148 83L198 89L248 52L298 61L350 22L400 9V140H0Z"
          fill={`url(#${compact ? "chart-fill-small" : "chart-fill"})`}
        />
        <path
          className={styles.chartLine}
          d="M0 123L48 110L98 114L148 83L198 89L248 52L298 61L350 22L400 9"
          stroke="#46b9ff"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle
          cx="350"
          cy="22"
          r="5"
          fill="#a6e2ff"
          stroke="#169ef5"
          strokeWidth="7"
        />
      </svg>
      {!compact && (
        <div className={styles.chartLabels}>
          <span>SEM 01</span>
          <span>SEM 04</span>
          <span>SEM 08</span>
        </div>
      )}
    </div>
  );
}

function WorkoutPhone() {
  const [sets, setSets] = useState([true, false, false]);
  const completed = sets.filter(Boolean).length;
  return (
    <div className={styles.phone}>
      <div className={styles.phoneTop}>
        <span>9:41</span>
        <span className={styles.phoneIsland} />
        <AudioLines size={14} />
      </div>
      <div className={styles.phoneBody}>
        <div className={styles.phoneGreeting}>
          <span>SEU MOMENTO DE EVOLUIR</span>
          <Flame size={17} />
        </div>
        <h3>
          Bora superar
          <br />o último treino?
        </h3>
        <div className={styles.week}>
          <span>S</span>
          <span className={styles.dayDone}>
            <Check />
          </span>
          <span>T</span>
          <span className={styles.dayDone}>
            <Check />
          </span>
          <span className={styles.dayCurrent}>Q</span>
          <span>S</span>
          <span>S</span>
        </div>
        <div className={styles.workoutBanner}>
          <Image
            src="/home-banner.jpg"
            alt=""
            fill
            sizes="300px"
            className={styles.workoutImage}
          />
          <div>
            <span>TREINO A · SUPERIORES</span>
            <h4>
              Hoje é dia
              <br />
              de ir além.
            </h4>
            <p>
              <Timer size={12} /> 50 min <span>•</span> 6 exercícios
            </p>
          </div>
          <span className={styles.workoutArrow}>
            <ArrowUpRight size={20} />
          </span>
        </div>
        <div className={styles.phoneExercise}>
          <div>
            <span>EXERCÍCIO 01</span>
            <h4>Supino reto</h4>
          </div>
          <span className={styles.threeBadge}>
            <Rotate3D size={12} /> 3D
          </span>
        </div>
        <div className={styles.setHeader}>
          <span>SÉRIE</span>
          <span>KG</span>
          <span>REPS</span>
          <span>FEITO</span>
        </div>
        {sets.map((done, index) => (
          <div
            className={`${styles.setRow} ${done ? styles.setDone : ""}`}
            key={index}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>40</strong>
            <strong>12</strong>
            <button
              type="button"
              aria-label={`${done ? "Desmarcar" : "Concluir"} série ${index + 1}`}
              aria-pressed={done}
              onClick={() =>
                setSets((current) =>
                  current.map((value, i) => (i === index ? !value : value)),
                )
              }
            >
              {done ? <Check size={14} /> : <Plus size={14} />}
            </button>
          </div>
        ))}
        <div className={styles.sessionProgress}>
          <span>
            {completed === 3
              ? "Boa! Todas as séries concluídas."
              : "Cada série conta."}
          </span>
          <span aria-live="polite">{completed}/3</span>
        </div>
        <div className={styles.progressTrack}>
          <span style={{ width: `${(completed / 3) * 100}%` }} />
        </div>
        <div className={styles.phoneNav} aria-hidden="true">
          <Dumbbell />
          <ChartNoAxesCombined />
          <Layers3 />
          <Users />
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const root = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [audience, setAudience] = useState<"athlete" | "coach">("athlete");
  const [exercise, setExercise] = useState<ExerciseAnimation>("squat");
  const [show3D, setShow3D] = useState(false);
  const viewerArea = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    element
      .querySelectorAll("[data-reveal]")
      .forEach((node) => observer.observe(node));
    let frame = 0;
    const update = () => {
      const available = document.documentElement.scrollHeight - innerHeight;
      element.style.setProperty(
        "--read-progress",
        `${available > 0 ? scrollY / available : 0}`,
      );
      element.style.setProperty(
        "--hero-drift",
        `${reduced.matches ? 0 : Math.min(scrollY * 0.15, 90)}px`,
      );
      frame = 0;
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!show3D || !viewerArea.current) return;
    // Unmount the WebGL canvas when its section leaves the viewport.
    // The existing viewer disposes resources; coming back offers the preview again.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setShow3D(false);
          setExercise("squat");
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(viewerArea.current);
    return () => observer.disconnect();
  }, [show3D]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let spotlight: HTMLElement | null = null;
    let point = { x: 0, y: 0, target: null as HTMLElement | null };
    const reset = () => {
      element.style.setProperty("--pointer-x", "0px");
      element.style.setProperty("--pointer-y", "0px");
      spotlight?.style.setProperty("--spot-opacity", "0");
      spotlight = null;
    };
    const paint = () => {
      frame = 0;
      if (
        reduced.matches ||
        !fine.matches ||
        element.dataset.motion === "paused" ||
        document.hidden
      ) {
        reset();
        return;
      }
      const hero = element.querySelector("section")?.getBoundingClientRect();
      if (hero && point.y < hero.bottom) {
        element.style.setProperty(
          "--pointer-x",
          `${(point.x / innerWidth - 0.5) * 18}px`,
        );
        element.style.setProperty(
          "--pointer-y",
          `${(point.y / innerHeight - 0.5) * 12}px`,
        );
      }
      const card =
        point.target?.closest<HTMLElement>("[data-spotlight]") ?? null;
      if (spotlight && spotlight !== card)
        spotlight.style.setProperty("--spot-opacity", "0");
      spotlight = card;
      if (card) {
        const bounds = card.getBoundingClientRect();
        card.style.setProperty("--spot-x", `${point.x - bounds.left}px`);
        card.style.setProperty("--spot-y", `${point.y - bounds.top}px`);
        card.style.setProperty("--spot-opacity", "1");
      }
    };
    const move = (event: PointerEvent) => {
      point = {
        x: event.clientX,
        y: event.clientY,
        target: event.target instanceof HTMLElement ? event.target : null,
      };
      if (!frame) frame = requestAnimationFrame(paint);
    };
    element.addEventListener("pointermove", move, { passive: true });
    element.addEventListener("pointerleave", reset);
    reduced.addEventListener("change", reset);
    window.addEventListener("blur", reset);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
      reduced.removeEventListener("change", reset);
      window.removeEventListener("blur", reset);
    };
  }, []);

  return (
    <div
      ref={root}
      className={styles.landing}
      data-motion={paused ? "paused" : "running"}
    >
      <a className={styles.skipLink} href="#conteudo">
        Pular para o conteúdo
      </a>
      <div className={styles.readProgress} aria-hidden="true" />
      <header className={styles.header}>
        <div className={styles.navInner}>
          <Link href="/" aria-label="Trainvy — início">
            <Logo light size="lg" />
          </Link>
          <nav
            className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}
            aria-label="Navegação principal"
            id="landing-nav"
          >
            <a href="#experiencia" onClick={() => setMenuOpen(false)}>
              O app
            </a>
            <a href="#movimento" onClick={() => setMenuOpen(false)}>
              Experiência 3D <span>NOVO</span>
            </a>
            <a href="#para-voce" onClick={() => setMenuOpen(false)}>
              Para você
            </a>
            <a href="#duvidas" onClick={() => setMenuOpen(false)}>
              Dúvidas
            </a>
            <Link className={styles.mobileLogin} href="/auth">
              Entrar na minha conta <ArrowUpRight size={15} />
            </Link>
          </nav>
          <div className={styles.navActions}>
            <Link href="/auth" className={styles.login}>
              Entrar <ArrowUpRight size={14} />
            </Link>
            <Link href="/auth/signup" className={styles.navCta}>
              Começar grátis <ArrowUpRight size={15} />
            </Link>
            <button
              type="button"
              className={styles.menuButton}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              aria-controls="landing-nav"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      <main id="conteudo">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroGrid} aria-hidden="true" />
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={`${styles.container} ${styles.heroLayout}`}>
            <div className={styles.heroCopy}>
              <div className={styles.eyebrow}>
                <span className={styles.liveDot} /> SEU TREINO. SUA EVOLUÇÃO.
              </div>
              <h1 id="hero-title">
                Você não nasceu
                <br />
                para ficar no
                <br />
                <span>
                  mesmo nível<span className={styles.period}>.</span>
                </span>
              </h1>
              <p>
                Transforme esforço em evolução. Treinos, inteligência artificial
                e movimentos em 3D em uma experiência que acompanha o seu ritmo.
              </p>
              <div className={styles.heroButtons}>
                <Link href="/auth/signup" className={styles.primaryButton}>
                  Começar minha evolução <ArrowUpRight size={20} />
                </Link>
                <a href="#movimento" className={styles.watchButton}>
                  <span>
                    <Play size={12} fill="currentColor" />
                  </span>
                  Explorar o 3D
                </a>
              </div>
              <div className={styles.heroReassurance}>
                <span>
                  <Check size={13} /> Conta de atleta gratuita
                </span>
                <span>
                  <Check size={13} /> Sem cartão de crédito
                </span>
              </div>
              <a href="#experiencia" className={styles.scrollCue}>
                <span>
                  <ArrowDown size={14} />
                </span>{" "}
                TEM MAIS EVOLUÇÃO AQUI EMBAIXO
              </a>
            </div>
            <div className={styles.heroVisual}>
              <svg
                className={styles.signalTrails}
                viewBox="0 0 600 660"
                fill="none"
                aria-hidden="true"
              >
                <path d="M25 460C-10 190 500 40 555 210S210 670 90 485" />
                <path d="M550 425C590 230 245 50 110 180S110 595 410 580" />
                <circle cx="80" cy="270" r="3" />
                <circle cx="500" cy="480" r="3" />
              </svg>
              <div className={styles.orbit} aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <span className={styles.heroCoordinates} aria-hidden="true">
                TRAINVY SYSTEM
                <br />
                EST. 2026 / V.01
              </span>
              <div className={styles.phoneFloat}>
                <WorkoutPhone />
              </div>
              <div className={`${styles.floatingCard} ${styles.prCard}`}>
                <span className={styles.cardIcon}>
                  <Trophy size={18} />
                </span>
                <div>
                  <span>O PRÓXIMO RECORDE?</span>
                  <strong>Pode ser o seu.</strong>
                </div>
                <MoveUpRight size={20} />
              </div>
              <div
                className={`${styles.floatingCard} ${styles.evolutionFloat}`}
              >
                <div>
                  <span>SUA EVOLUÇÃO, VISÍVEL.</span>
                  <ChartNoAxesCombined size={15} />
                </div>
                <Chart compact />
                <span>CADA TREINO É UM PASSO À FRENTE</span>
              </div>
              <div className={styles.heroDemoLabel}>
                <span /> PRÉVIA INTERATIVA · DADOS ILUSTRATIVOS
              </div>
            </div>
          </div>
          <div className={styles.heroFooter}>
            <span>MENOS ACHISMO. MAIS DIREÇÃO.</span>
            <span>
              FEITO PARA O SEU PRÓXIMO NÍVEL <ArrowDownRight size={16} />
            </span>
          </div>
        </section>

        <div
          className={styles.marquee}
          aria-label="Planeje, execute, entenda e evolua"
        >
          <div className={styles.marqueeTrack} aria-hidden="true">
            {[0, 1].map((n) => (
              <div key={n}>
                <span>PLANEJE</span>
                <Plus />
                <span>EXECUTE</span>
                <Plus />
                <span className={styles.marqueeOutline}>ENTENDA</span>
                <Plus />
                <span>EVOLUA</span>
                <Plus />
              </div>
            ))}
          </div>
        </div>

        <section
          id="experiencia"
          className={`${styles.container} ${styles.experience}`}
          aria-labelledby="experience-title"
        >
          <div className={styles.sectionHeading} data-reveal>
            <div>
              <span className={styles.sectionNumber}>
                01 / TREINO COM DIREÇÃO
              </span>
              <h2 id="experience-title">
                Seu esforço merece
                <br />
                <span>mais que anotações.</span>
              </h2>
            </div>
            <p>
              Da primeira série ao próximo recorde, tudo conectado para você
              saber de onde veio e aonde quer chegar.
            </p>
          </div>
          <div className={styles.featureGrid}>
            <article
              className={`${styles.featureCard} ${styles.planCard}`}
              data-spotlight
              data-reveal
            >
              <span className={styles.featureIcon}>
                <Layers3 />
              </span>
              <h3>
                Um plano.
                <br />O seu caminho.
              </h3>
              <p>
                Organize treinos e periodizações que cabem na sua rotina. Ajuste
                cada detalhe quando precisar.
              </p>
              <div
                className={styles.planVisual}
                aria-label="Exemplo de organização semanal"
              >
                <div>
                  <span>SEU PLANEJAMENTO</span>
                  <span>
                    SEMANA 01 <ChevronDown size={12} />
                  </span>
                </div>
                {[
                  ["A", "Superiores", "6 exercícios", "SEG"],
                  ["B", "Inferiores", "5 exercícios", "QUA"],
                  ["C", "Full body", "6 exercícios", "SEX"],
                ].map(([letter, title, meta, day]) => (
                  <div className={styles.planRow} key={letter}>
                    <b>{letter}</b>
                    <div>
                      <strong>{title}</strong>
                      <span>{meta}</span>
                    </div>
                    <span>{day}</span>
                    <ArrowUpRight size={15} />
                  </div>
                ))}
              </div>
            </article>
            <article
              className={`${styles.featureCard} ${styles.statsCard}`}
              data-spotlight
              data-reveal
            >
              <span className={styles.featureIcon}>
                <ChartNoAxesCombined />
              </span>
              <h3>
                O progresso deixa
                <br />
                de ser uma sensação.
              </h3>
              <p>
                Cargas, repetições, volume e consistência. Enxergue a evolução
                que cada sessão constrói.
              </p>
              <div className={styles.statsVisual}>
                <div>
                  <span>EVOLUÇÃO DE CARGA</span>
                  <span className={styles.exampleLabel}>EXEMPLO</span>
                </div>
                <strong>
                  O trabalho aparece
                  <span>
                    <ArrowUpRight size={15} /> no seu histórico
                  </span>
                </strong>
                <Chart />
              </div>
            </article>
            <article
              className={`${styles.featureCard} ${styles.aiCard}`}
              data-spotlight
              data-reveal
            >
              <span className={styles.featureIcon}>
                <Sparkles />
              </span>
              <h3>
                Inteligência no plano.
                <br />
                Você no controle.
              </h3>
              <p>
                Converse com o Coach AI, explore propostas e edite seu
                planejamento antes de colocar em prática.
              </p>
              <div className={styles.aiVisual}>
                <span>
                  COACH AI <Sparkles size={13} />
                </span>
                <div className={styles.aiQuestion}>
                  Tenho 3 dias na semana.
                  <br />
                  Vamos organizar meu treino?
                </div>
                <div className={styles.aiAnswer}>
                  <span>
                    <Sparkles size={15} /> COACH AI
                  </span>
                  <p>
                    Vamos criar uma proposta para a sua rotina. Você revisa cada
                    detalhe.
                  </p>
                  <div>
                    <Layers3 size={16} />
                    <span>
                      Plano de treino
                      <strong>Rascunho · pronto para revisar</strong>
                    </span>
                    <ArrowUpRight size={15} />
                  </div>
                </div>
              </div>
            </article>
          </div>
          <p className={styles.demoNote}>
            Prévias ilustrativas da experiência. A disponibilidade de IA depende
            do plano e dos limites da conta.
          </p>
        </section>

        <section
          id="movimento"
          className={styles.motionSection}
          aria-labelledby="motion-title"
        >
          <div className={`${styles.container} ${styles.motionLayout}`}>
            <div className={styles.motionCopy} data-reveal>
              <span className={styles.sectionNumber}>
                02 / ANATOMIA EM MOVIMENTO
              </span>
              <span className={styles.motionTag}>
                <Rotate3D size={14} /> VEJA. GIRE. ENTENDA.
              </span>
              <h2 id="motion-title">
                Não só faça.
                <br />
                <span>
                  Entenda
                  <br />o movimento.
                </span>
              </h2>
              <p>
                Saia do ângulo único. Explore os exercícios em 3D, descubra os
                grupos musculares ilustrados e acompanhe cada fase do movimento.
              </p>
              <ul className={styles.motionBenefits}>
                <li>
                  <Rotate3D /> Uma nova perspectiva, em 360°
                </li>
                <li>
                  <Pause /> O movimento no seu tempo
                </li>
                <li>
                  <Target /> Grupos musculares em destaque
                </li>
              </ul>
              <p className={styles.smallPrint}>
                3D disponível em exercícios selecionados. As cores indicam
                grupos musculares de forma ilustrativa e não medem ativação ou
                esforço.
              </p>
            </div>
            <div className={styles.motionDemo} ref={viewerArea} data-reveal>
              <div className={styles.demoToolbar}>
                <div>
                  <span className={styles.liveDot} /> TRAINVY / MOVEMENT LAB
                </div>
                <Rotate3D size={19} />
              </div>
              <div
                className={styles.exerciseTabs}
                aria-label="Exercício da demonstração"
              >
                {exercises.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={exercise === item.id}
                    onClick={() => {
                      setExercise(item.id);
                      setShow3D(true);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {show3D ? (
                <div className={styles.liveViewer}>
                  <Viewer exercise={exercise} compact />
                  <button
                    type="button"
                    className={styles.closeViewer}
                    onClick={() => {
                      setShow3D(false);
                      setExercise("squat");
                    }}
                  >
                    <X size={14} /> Fechar demonstração
                  </button>
                </div>
              ) : (
                <div className={styles.poster}>
                  <Image
                    src="/landing/movement-preview.webp"
                    alt="Visualização 3D do Trainvy: modelo anatômico demonstrando um agachamento com barra"
                    fill
                    sizes="(max-width: 800px) 100vw, 640px"
                    className={styles.posterImage}
                  />
                  <div className={styles.posterVignette} />
                  <div className={styles.posterCorner}>
                    <span>AGACHAMENTO LIVRE</span>
                    <span>VISUALIZAÇÃO REAL DO APP</span>
                  </div>
                  <button
                    type="button"
                    className={styles.start3D}
                    onClick={() => setShow3D(true)}
                  >
                    <span>
                      <Play size={20} fill="currentColor" />
                    </span>
                    <strong>
                      Experimente o 3D
                      <small>Explore sem sair desta página.</small>
                    </strong>
                    <ArrowUpRight size={22} />
                  </button>
                </div>
              )}
              <div className={styles.demoBottom}>
                <span>
                  <span className={styles.redDot} /> Principais
                </span>
                <span>
                  <span className={styles.lightRedDot} /> Secundários
                </span>
                <span>GRUPOS ILUSTRATIVOS</span>
              </div>
              <details className={styles.attribution}>
                <summary>Créditos da anatomia 3D</summary>
                <p>
                  Prévia renderizada no Trainvy. Anatomia adaptada de{" "}
                  <a
                    href="https://github.com/LluisV/Z-Anatomy"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Z-Anatomy
                  </a>
                  , por Gauthier Kervyn e Lluís Vinent Juanico; derivada de
                  BodyParts3D © The Database Center for Life Science / Kousaku
                  Okubo. Cabeça: MakeHuman (CC0). Montagem e materiais: Trainvy.
                  Modelo e prévia sob{" "}
                  <a
                    href="https://creativecommons.org/licenses/by-sa/4.0/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    CC BY-SA 4.0
                  </a>
                  .
                </p>
              </details>
            </div>
          </div>
        </section>

        <section
          id="para-voce"
          className={`${styles.container} ${styles.audienceSection}`}
          aria-labelledby="audience-title"
        >
          <div className={styles.sectionHeading} data-reveal>
            <div>
              <span className={styles.sectionNumber}>03 / DO SEU JEITO</span>
              <h2 id="audience-title">
                Quem treina evolui.
                <br />
                <span>Quem orienta também.</span>
              </h2>
            </div>
            <p>
              Do treino individual ao acompanhamento dos alunos. Encontre o seu
              lugar no Trainvy.
            </p>
          </div>
          <div
            className={styles.audienceSwitch}
            aria-label="Escolha seu perfil"
          >
            <button
              type="button"
              aria-pressed={audience === "athlete"}
              onClick={() => setAudience("athlete")}
            >
              <Dumbbell size={16} /> Quero treinar
            </button>
            <button
              type="button"
              aria-pressed={audience === "coach"}
              onClick={() => setAudience("coach")}
            >
              <Users size={16} /> Sou personal
            </button>
          </div>
          <div className={styles.audiencePanel} key={audience}>
            <div className={styles.audienceCopy}>
              <span className={styles.sectionNumber}>
                {audience === "athlete"
                  ? "PARA QUEM QUER IR ALÉM"
                  : "PARA QUEM FAZ A DIFERENÇA"}
              </span>
              <h3>
                {audience === "athlete" ? (
                  <>
                    Seu objetivo é único.
                    <br />
                    Seu treino também.
                  </>
                ) : (
                  <>
                    Mais perto dos alunos.
                    <br />
                    Mais longe nos resultados.
                  </>
                )}
              </h3>
              <p>
                {audience === "athlete"
                  ? "Tenha seus planos, registros e próximos passos no mesmo lugar. Na academia, em casa ou onde o treino acontecer."
                  : "Organize prescrições, acompanhe o histórico dos atletas vinculados e mantenha sua metodologia no centro do planejamento."}
              </p>
              <ul>
                {(audience === "athlete"
                  ? [
                      "Monte seu treino ou receba do seu personal",
                      "Registre carga, repetições e RIR por série",
                      "Acompanhe seu histórico e sua consistência",
                    ]
                  : [
                      "Prescreva e organize os treinos dos alunos",
                      "Acompanhe execução, histórico e feedback",
                      "Use modelos para dar agilidade ao planejamento",
                    ]
                ).map((text) => (
                  <li key={text}>
                    <CircleCheck size={17} />
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href={
                  audience === "athlete"
                    ? "/auth/signup"
                    : "/auth/signup?accountType=COACH"
                }
                className={styles.primaryButton}
              >
                {audience === "athlete"
                  ? "Quero começar grátis"
                  : "Conhecer os planos para personal"}
                <ArrowUpRight size={18} />
              </Link>
              {audience === "coach" && (
                <p className={styles.smallPrint}>
                  Planos e disponibilidade de recursos são apresentados no
                  cadastro.
                </p>
              )}
            </div>
            <div className={styles.audienceVisual}>
              {audience === "athlete" ? (
                <>
                  <div className={styles.consistencyTitle}>
                    <Flame size={22} />
                    <span>
                      CONSISTÊNCIA SE CONSTRÓI.
                      <strong>Um treino de cada vez.</strong>
                    </span>
                  </div>
                  <div
                    className={styles.heatmap}
                    aria-label="Exemplo ilustrativo de frequência de treinos"
                  >
                    {Array.from({ length: 84 }, (_, i) => (
                      <span
                        key={i}
                        style={
                          {
                            "--heat": [0.08, 0.22, 0.45, 0.7, 1][
                              (i * 7 + Math.floor(i / 7) * 3) % 5
                            ],
                            "--delay": `${i * 8}ms`,
                          } as CSSProperties
                        }
                      />
                    ))}
                  </div>
                  <div className={styles.consistencyFoot}>
                    <span>
                      O pequeno esforço de hoje.
                      <br />
                      <strong>A evolução de amanhã.</strong>
                    </span>
                    <Flame size={40} />
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.coachTitle}>
                    <Users size={20} />
                    <span>SEU ESPAÇO DE ACOMPANHAMENTO</span>
                    <span className={styles.exampleLabel}>EXEMPLO</span>
                  </div>
                  <div className={styles.coachMetrics}>
                    <div>
                      <strong>Planeje</strong>
                      <span>com intenção</span>
                    </div>
                    <div>
                      <strong>Acompanhe</strong>
                      <span>com contexto</span>
                    </div>
                  </div>
                  {[
                    ["AL", "Aluno A", "Treino A · Superiores", "Concluído"],
                    ["BM", "Aluno B", "Treino B · Inferiores", "Em andamento"],
                    ["CS", "Aluno C", "Treino C · Full body", "Planejado"],
                  ].map(([initials, name, workout, status]) => (
                    <div key={initials} className={styles.coachRow}>
                      <b>{initials}</b>
                      <div>
                        <strong>{name}</strong>
                        <span>{workout}</span>
                      </div>
                      <span>{status}</span>
                    </div>
                  ))}
                </>
              )}
              <span className={styles.visualCaption}>
                PRÉVIA ILUSTRATIVA · SEM DADOS REAIS DE USUÁRIOS
              </span>
            </div>
          </div>
        </section>

        <section
          className={styles.statement}
          aria-label="Sua próxima versão começa agora"
        >
          <Image
            src="/home-banner.jpg"
            alt="Atleta treinando com halteres"
            fill
            sizes="100vw"
            className={styles.statementImage}
          />
          <div className={styles.statementShade} />
          <div className={styles.container} data-reveal>
            <span className={styles.sectionNumber}>
              A MELHOR COMPARAÇÃO É COM VOCÊ MESMO.
            </span>
            <p>
              Mais forte que
              <br />
              <span>o seu ontem.</span>
              <ArrowUpRight />
            </p>
            <span className={styles.statementBottom}>
              O ESFORÇO É SEU. A DIREÇÃO, A GENTE CONSTRÓI JUNTO.
            </span>
          </div>
        </section>

        <section
          id="duvidas"
          className={`${styles.container} ${styles.faqSection}`}
          aria-labelledby="faq-title"
        >
          <div data-reveal>
            <span className={styles.sectionNumber}>
              04 / SEM DÚVIDAS NO CAMINHO
            </span>
            <h2 id="faq-title">
              Antes do
              <br />
              <span>primeiro treino.</span>
            </h2>
            <p>
              O que você precisa saber
              <br />
              para dar o próximo passo.
            </p>
          </div>
          <div className={styles.faqList}>
            {questions.map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <Plus size={19} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.finalCta} aria-labelledby="cta-title">
          <div className={styles.ctaOrbit} aria-hidden="true" />
          <div className={styles.container} data-reveal>
            <span className={styles.eyebrow}>
              <span className={styles.liveDot} /> SEU PRÓXIMO NÍVEL ESTÁ
              ESPERANDO.
            </span>
            <h2 id="cta-title">
              O primeiro passo
              <br />
              também é <span>evolução.</span>
            </h2>
            <p>Você traz a vontade. O Trainvy ajuda a dar direção.</p>
            <Link href="/auth/signup" className={styles.primaryButton}>
              Começar minha evolução <ArrowUpRight size={22} />
            </Link>
            <div className={styles.heroReassurance}>
              <span>
                <Check size={13} /> Conta de atleta gratuita
              </span>
              <span>
                <Check size={13} /> Sem cartão
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerTop}`}>
          <div>
            <Logo light size="lg" />
            <p>Seu treino. Sua evolução.</p>
          </div>
          <nav aria-label="Links do rodapé">
            <a href="#movimento">Experiência 3D</a>
            <Link href="/auth">
              Acessar o app <ArrowUpRight size={13} />
            </Link>
            <Link href="/termos">Termos de uso</Link>
            <Link href="/privacidade">Privacidade</Link>
          </nav>
        </div>
        <div className={`${styles.container} ${styles.footerBottom}`}>
          <span>
            © {new Date().getFullYear()} Trainvy. Todos os direitos reservados.
          </span>
          <button
            type="button"
            aria-pressed={paused}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
            {paused ? "Retomar animações" : "Pausar animações"}
          </button>
          <a href="#conteudo">
            DE VOLTA AO TOPO <ArrowRight size={13} />
          </a>
        </div>
      </footer>
    </div>
  );
}
