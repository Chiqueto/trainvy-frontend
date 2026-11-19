"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { getExerciseMediaAction } from "@/app/_actions/exercise-media";
import {
  EXERCISE_ANIMATIONS,
  getExerciseAnimation,
} from "@/app/_components/exercise-3d/exercises";
import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";

export function ExerciseThumbnail({
  exerciseId,
  name,
  catalogEntry,
  eager = false,
}: {
  exerciseId?: string | null;
  name: string;
  catalogEntry?: ListExercises200Item;
  eager?: boolean;
}) {
  const globalAnimation = getExerciseAnimation(
    exerciseId,
    catalogEntry?.ownerUserId ? undefined : name,
  );
  const animationOverride = catalogEntry?.demonstration?.animationKey;
  const animation = animationOverride ?? globalAnimation;
  const catalogPath =
    !animationOverride || animationOverride === globalAnimation
      ? catalogEntry?.thumbnailUrl
      : undefined;
  const referenceId = animation && EXERCISE_ANIMATIONS[animation]?.id;
  const thumbnailPath =
    catalogPath ??
    (referenceId ? "/exercises/" + referenceId + "/thumbnail" : null);
  const remoteImage = thumbnailPath && "/backend" + thumbnailPath;
  const mediaId = catalogEntry?.hasMedia ? catalogEntry.id : null;
  const [failed, setFailed] = useState<string[]>([]);
  const [image2D, setImage2D] = useState<{ id: string; paths: string[] }>();
  const image3D =
    remoteImage && !failed.includes(remoteImage) ? remoteImage : undefined;
  const use2D = Boolean(mediaId && !image3D);

  useEffect(() => {
    if (!use2D || !mediaId) return;
    let active = true;
    void getExerciseMediaAction(mediaId)
      .then((result) => {
        if (!active) return;
        const paths = result.success
          ? [result.data.endImagePath, result.data.startImagePath].filter(
              (path): path is string => Boolean(path),
            )
          : [];
        setImage2D({ id: mediaId, paths });
      })
      .catch(() => {
        if (active) setImage2D({ id: mediaId, paths: [] });
      });
    return () => {
      active = false;
    };
  }, [use2D, mediaId]);

  const src =
    image3D ??
    (image2D?.id === mediaId
      ? image2D.paths.find((path) => !failed.includes(path))
      : undefined);
  const loading = use2D && image2D?.id !== mediaId;

  return (
    <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border bg-muted/55 sm:size-[76px]">
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="76px"
          unoptimized
          loading={eager ? "eager" : "lazy"}
          className="object-contain"
          onError={() => setFailed((paths) => [...paths, src])}
        />
      ) : loading ? (
        <span
          className="size-6 animate-pulse rounded bg-muted-foreground/15"
          aria-label="Carregando imagem"
        />
      ) : (
        <span className="flex flex-col items-center gap-1 px-1 text-center text-[9px] leading-tight text-muted-foreground">
          <ImageOff className="size-4" aria-hidden="true" />
          Sem imagem cadastrada
        </span>
      )}
    </span>
  );
}
