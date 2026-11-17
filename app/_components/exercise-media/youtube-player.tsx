"use client";

import { Play, ExternalLink } from "lucide-react";
import { useState } from "react";
import { youtubeVideoId } from "@/app/_lib/youtube";

export function YoutubePlayer({ url, title }: { url: string; title: string }) {
  const [started, setStarted] = useState(false);
  const id = youtubeVideoId(url);
  if (!id) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-xl">
      <div className="relative aspect-video min-h-[200px]">
        {started ? (
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`}
            title={`Demonstração: ${title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="absolute inset-0 flex w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-primary/25 via-zinc-950 to-zinc-900 px-6 text-white focus-visible:outline-2 focus-visible:outline-primary"
            aria-label={`Reproduzir demonstração de ${title}`}
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Play className="size-7 fill-current" />
            </span>
            <span className="font-heading text-sm font-semibold">
              Assistir à demonstração
            </span>
            <span className="text-xs text-white/60">
              Vídeo do YouTube • Reproduzido aqui no Trainvy
            </span>
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs text-white/70">
        <span>Vídeo de execução</span>
        <a
          className="inline-flex items-center gap-1.5 hover:text-white"
          href={`https://www.youtube.com/watch?v=${id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir no YouTube <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}
