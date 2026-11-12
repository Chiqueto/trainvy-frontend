"use client";
import { useEffect, useRef } from "react";
import type { PointerEvent } from "react";
export function useHoldMenu(onOpen: () => void) {
  const held = useRef(false),
    pressing = useRef(false),
    releasedAt = useRef(0),
    start = useRef({ x: 0, y: 0 }),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interruptRef = useRef<
    ((event: globalThis.PointerEvent) => void) | null
  >(null);
  function cancel() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (interruptRef.current)
      window.removeEventListener("pointerdown", interruptRef.current, true);
    interruptRef.current = null;
  }
  useEffect(
    () => () => {
      cancel();
    },
    [],
  );
  return {
    held,
    cancel,
    ignoreOutside: () =>
      held.current &&
      (pressing.current || Date.now() - releasedAt.current < 300),
    onPointerDownCapture(event: PointerEvent) {
      held.current = false;
      pressing.current = true;
      cancel();
      if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
      start.current = { x: event.clientX, y: event.clientY };
      timer.current = setTimeout(() => {
        held.current = true;
        onOpen();
      }, 600);
      if (event.pointerType === "touch") {
        interruptRef.current = (next) => {
          if (
            next.pointerType === "touch" &&
            next.pointerId !== event.pointerId
          )
            cancel();
        };
        window.addEventListener("pointerdown", interruptRef.current, true);
      }
    },
    onPointerMoveCapture(event: PointerEvent) {
      if (
        Math.hypot(
          event.clientX - start.current.x,
          event.clientY - start.current.y,
        ) > 8
      )
        cancel();
    },
    onPointerUpCapture() {
      pressing.current = false;
      releasedAt.current = Date.now();
      cancel();
    },
    onPointerCancelCapture() {
      pressing.current = false;
      releasedAt.current = Date.now();
      cancel();
    },
  };
}
