"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface SummonEvent {
  id: string;
  x: number;
  y: number;
  label?: string;
}

export function SummonRing({
  x,
  y,
  onComplete,
}: {
  x: number;
  y: number;
  onComplete?: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 700);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 15,
      }}
    >
      {/* Círculo de choque externo */}
      <motion.div
        initial={{ scale: 0.1, opacity: 1, rotate: 0 }}
        animate={{ scale: 2.2, opacity: 0, rotate: 90 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className="size-48 rounded-full border-2 border-cyan-400/80 shadow-[0_0_35px_#00f2fe]"
      />

      {/* Anel interno com runas / marcas sci-fi */}
      <motion.div
        initial={{ scale: 0.2, opacity: 0.9, rotate: 0 }}
        animate={{ scale: 1.6, opacity: 0, rotate: -180 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute inset-0 size-48 rounded-full border border-dashed border-purple-400 shadow-[0_0_20px_#a855f7]"
      />

      {/* Flash de energia vertical / pilar de luz holográfico */}
      <motion.div
        initial={{ scaleY: 0, opacity: 1 }}
        animate={{ scaleY: [0, 1.4, 0], opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="absolute left-1/2 top-1/2 h-64 w-8 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-t from-transparent via-cyan-300 to-transparent blur-sm"
      />
    </div>
  );
}

export function SummonManager({
  summons,
  onDismiss,
}: {
  summons: SummonEvent[];
  onDismiss: (id: string) => void;
}) {
  return (
    <AnimatePresence>
      {summons.map((s) => (
        <SummonRing
          key={s.id}
          x={s.x}
          y={s.y}
          onComplete={() => onDismiss(s.id)}
        />
      ))}
    </AnimatePresence>
  );
}

