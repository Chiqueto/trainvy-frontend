"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { haptic } from "../../_lib/tactical";
export function SealButton({
  onSave,
  disabled,
}: {
  onSave: () => void;
  disabled?: boolean;
}) {
  const [sealing, setSealing] = useState(false);
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="flex-1"
      animate={
        sealing && !reduced
          ? {
              scale: [1, 1.035, 1],
              filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"],
            }
          : { scale: 1 }
      }
    >
      <Button
        type="button"
        aria-label={sealing ? "Selando…" : "Selar treino"}
        disabled={disabled || sealing}
        className="h-9 w-full rounded-xl bg-cyan-300 text-slate-950 hover:bg-cyan-200"
        onClick={() => {
          setSealing(true);
          haptic(20);
          setTimeout(
            () => {
              onSave();
              setSealing(false);
            },
            reduced ? 0 : 350,
          );
        }}
      >
        {disabled ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Check size={16} />
        )}
        <span className="hidden sm:inline">
          {sealing ? "Selando…" : "Selar treino"}
        </span>
      </Button>
    </motion.div>
  );
}
