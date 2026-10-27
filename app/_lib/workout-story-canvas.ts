import { generateWorkoutAnatomySvgString } from "../_components/anatomy/workout-anatomy-body";
import type { SessionMuscleSummary } from "./workout-session-muscles";

export type StoryBackgroundMode =
  | "transparent"
  | "dark-carbon"
  | "crimson-pulse"
  | "cyber-grid"
  | "custom-photo";

export interface StoryExportOptions {
  workoutTitle: string;
  dateFormatted: string;
  durationInMinutes: number;
  totalVolumeKg: number;
  totalSetsCompleted: number;
  totalReps: number;
  stats: SessionMuscleSummary;
  backgroundMode: StoryBackgroundMode;
  customPhotoUrl?: string | null;
  photoOverlayOpacity?: number; // 0 to 1
  showStats?: boolean;
  showMuscleChips?: boolean;
}

/**
 * Carrega uma imagem HTML por URL e aguarda seu carregamento
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Desenha um retângulo com cantos arredondados no canvas
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Renderiza o Story completo no formato Instagram (1080x1920) e retorna o elemento Canvas
 */
export async function renderWorkoutStoryCanvas(
  options: StoryExportOptions
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Não foi possível obter contexto 2D do canvas");
  }

  const {
    workoutTitle,
    dateFormatted,
    durationInMinutes,
    totalVolumeKg,
    totalSetsCompleted,
    totalReps,
    stats,
    backgroundMode,
    customPhotoUrl,
    photoOverlayOpacity = 0.5,
    showStats = true,
    showMuscleChips = true,
  } = options;

  const isTransparent = backgroundMode === "transparent";

  // 1. Renderiza o Fundo
  if (isTransparent) {
    ctx.clearRect(0, 0, 1080, 1920);
  } else if (backgroundMode === "custom-photo" && customPhotoUrl) {
    try {
      const photo = await loadImage(customPhotoUrl);
      // Object-fit: cover no canvas
      const scale = Math.max(1080 / photo.width, 1920 / photo.height);
      const nw = photo.width * scale;
      const nh = photo.height * scale;
      const ox = (1080 - nw) / 2;
      const oy = (1920 - nh) / 2;
      ctx.drawImage(photo, ox, oy, nw, nh);

      // Overlay escuro
      ctx.fillStyle = `rgba(0, 0, 0, ${photoOverlayOpacity})`;
      ctx.fillRect(0, 0, 1080, 1920);
    } catch {
      // Fallback para dark carbon se falhar a imagem
      drawDarkCarbonBg(ctx);
    }
  } else if (backgroundMode === "crimson-pulse") {
    const bgGrad = ctx.createRadialGradient(540, 960, 100, 540, 960, 1000);
    bgGrad.addColorStop(0, "#3f0a17");
    bgGrad.addColorStop(0.5, "#1e040a");
    bgGrad.addColorStop(1, "#070204");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);
  } else if (backgroundMode === "cyber-grid") {
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, 1080, 1920);

    // Grid sutil
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < 1080; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1920);
      ctx.stroke();
    }
    for (let y = 0; y < 1920; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }
  } else {
    // dark-carbon padrão
    drawDarkCarbonBg(ctx);
  }

  // 2. Card Container se for transparente (efeito sticker / vidro suave para legibilidade)
  if (isTransparent) {
    // Fundo de sticker sutilmente escurecido com vidro para garantir contraste
    ctx.save();
    ctx.fillStyle = "rgba(10, 10, 14, 0.85)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 2;
    roundRect(ctx, 40, 80, 1000, 1760, 48);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 3. Header: Logo Trainvy + Tagline
  ctx.save();
  try {
    const symbolImg = await loadImage("/symbol.png");
    ctx.drawImage(symbolImg, 80, 140, 68, 68);
  } catch {
    // Símbolo fallback (halter gráfico)
    ctx.fillStyle = "#ff1f3d";
    roundRect(ctx, 80, 140, 68, 68, 16);
    ctx.fill();
  }

  // Nome Trainvy com tipografia forte
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 48px system-ui, -apple-system, sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("TRAINVY", 164, 192);

  // Badge estilo Strava / Treino Concluído
  ctx.fillStyle = "#ff1f3d";
  roundRect(ctx, 770, 150, 230, 48, 24);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("TREINO FEITO", 885, 181);
  ctx.restore();

  // 4. Data e Título do Treino
  ctx.save();
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.font = "600 24px system-ui, -apple-system, sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillText(dateFormatted.toUpperCase(), 80, 270);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
  // Trunca se muito longo
  const maxTitleWidth = 920;
  let titleToDraw = workoutTitle;
  if (ctx.measureText(titleToDraw).width > maxTitleWidth) {
    while (ctx.measureText(titleToDraw + "...").width > maxTitleWidth && titleToDraw.length > 5) {
      titleToDraw = titleToDraw.slice(0, -1);
    }
    titleToDraw += "...";
  }
  ctx.fillText(titleToDraw, 80, 340);
  ctx.restore();

  // Linha divisória sutil
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(80, 380);
  ctx.lineTo(1000, 380);
  ctx.stroke();

  // 5. Centro: Renderização do Bonequinho Anatômico (SVG para Image)
  const svgString = generateWorkoutAnatomySvgString(stats, {
    isTransparentBg: isTransparent,
    neutralColor: isTransparent ? "rgba(255, 255, 255, 0.18)" : "#222228",
  });
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const svgImg = await loadImage(svgUrl);
    // Desenha o mapa anatômico centralizado
    // Width: 840, Height: 700
    const bodyW = 840;
    const bodyH = 708;
    const bodyX = (1080 - bodyW) / 2;
    const bodyY = 410;
    ctx.drawImage(svgImg, bodyX, bodyY, bodyW, bodyH);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }

  // 6. Chips de Músculos em Foco
  let currentY = 1150;
  if (showMuscleChips && stats.activeMusclesList.length > 0) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText("MÚSCULOS TRABALHADOS", 540, currentY);

    // Lista dos 4 principais músculos
    const topMuscles = stats.activeMusclesList.slice(0, 4);
    const chipText = topMuscles
      .map((m) => `${m.label.toUpperCase()} (${m.totalSets} ${m.totalSets === 1 ? "SÉRIE" : "SÉRIES"})`)
      .join("  •  ");

    ctx.fillStyle = "#ff1f3d";
    ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
    ctx.fillText(chipText, 540, currentY + 40);
    ctx.restore();
    currentY += 80;
  }

  // 7. Grid de Métricas de Alto Impacto (Estilo Strava)
  if (showStats) {
    const cardY = currentY + 30;
    const cardW = 440;
    const cardH = 150;
    const cardRadius = 24;

    const metricsData = [
      {
        label: "DURAÇÃO",
        value: `${durationInMinutes}`,
        unit: "MIN",
        x: 80,
        y: cardY,
      },
      {
        label: "CARGA TOTAL",
        value: totalVolumeKg.toLocaleString("pt-BR"),
        unit: "KG",
        x: 560,
        y: cardY,
      },
      {
        label: "SÉRIES FEITAS",
        value: `${totalSetsCompleted}`,
        unit: "SÉRIES",
        x: 80,
        y: cardY + 175,
      },
      {
        label: "REPETIÇÕES",
        value: `${totalReps}`,
        unit: "REPS",
        x: 560,
        y: cardY + 175,
      },
    ];

    for (const m of metricsData) {
      ctx.save();
      // Fundo do card da métrica
      ctx.fillStyle = isTransparent
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(255, 255, 255, 0.05)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1.5;
      roundRect(ctx, m.x, m.y, cardW, cardH, cardRadius);
      ctx.fill();
      ctx.stroke();

      // Label superior da métrica
      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
      ctx.letterSpacing = "1.5px";
      ctx.textAlign = "left";
      ctx.fillText(m.label, m.x + 32, m.y + 45);

      // Valor principal
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 56px system-ui, -apple-system, sans-serif";
      ctx.fillText(m.value, m.x + 32, m.y + 115);

      // Unidade ao lado do valor
      const valWidth = ctx.measureText(m.value).width;
      ctx.fillStyle = "#ff1f3d";
      ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
      ctx.fillText(m.unit, m.x + 32 + valWidth + 12, m.y + 115);
      ctx.restore();
    }
  }

  // 8. Rodapé: Watermark Oficial Trainvy
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "600 20px system-ui, -apple-system, sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("TRAINVY  •  SEU TREINO. SUA EVOLUÇÃO.", 540, 1820);
  ctx.restore();

  return canvas;
}

function drawDarkCarbonBg(ctx: CanvasRenderingContext2D) {
  // Fundo gradiente preto para cinza escuro
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
  bgGrad.addColorStop(0, "#16161a");
  bgGrad.addColorStop(0.5, "#0d0d10");
  bgGrad.addColorStop(1, "#070709");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1920);

  // Brilho radial sutil avermelhado no topo e centro
  const radialGrad = ctx.createRadialGradient(540, 700, 50, 540, 700, 600);
  radialGrad.addColorStop(0, "rgba(239, 68, 68, 0.12)");
  radialGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
  ctx.fillStyle = radialGrad;
  ctx.fillRect(0, 0, 1080, 1920);
}

/**
 * Converte o canvas para Blob PNG
 */
export function getCanvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Falha ao gerar blob de imagem do canvas"));
    }, "image/png");
  });
}

/**
 * Dispara download direto da imagem no navegador
 */
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Copia a imagem PNG para a área de transferência do usuário
 */
export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  if (!navigator.clipboard || !window.ClipboardItem) {
    return false;
  }
  const blob = await getCanvasBlob(canvas);
  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": blob,
    }),
  ]);
  return true;
}
