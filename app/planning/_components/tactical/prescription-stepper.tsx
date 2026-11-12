"use client";
import { useEffect, useRef, useState } from "react";
import { Minus, Plus, ChevronsUpDown } from "lucide-react";

export function PrescriptionStepper({
  label,
  value,
  min = 1,
  max = 999,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const changeRef = useRef(onChange);
  const scrubCleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => scrubCleanup.current?.(), []);
  useEffect(() => {
    changeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let accumulated = 0;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (disabled) return;
      setEditing(null);
      accumulated += event.deltaY;
      if (Math.abs(accumulated) < 25) return;
      changeRef.current(
        Math.max(min, Math.min(max, value + (accumulated < 0 ? 1 : -1))),
      );
      accumulated = 0;
    };
    node.addEventListener("wheel", wheel, { passive: false });
    return () => node.removeEventListener("wheel", wheel);
  }, [value, min, max, disabled]);
  return (
    <div
      ref={ref}
      title={`${label}: digite, use + / − ou role para ajustar`}
      className="no-card-drag flex min-w-0 flex-col items-center gap-1"
    >
      <div className="flex items-center gap-1">
        <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <button
          type="button"
          aria-label={`Deslizar para ajustar ${label.toLowerCase()}`}
          title="Arraste para cima ou para baixo para ajustar"
          className="flex size-5 touch-none items-center justify-center text-slate-500"
          onPointerDown={(event) => {
            if (disabled) return;
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);
            const start = event.clientY;
            const move = (e: PointerEvent) => {
              setEditing(null);
              changeRef.current(
                Math.max(
                  min,
                  Math.min(max, value + Math.trunc((start - e.clientY) / 16)),
                ),
              );
            };
            const end = () => {
              window.removeEventListener("pointermove", move);
              window.removeEventListener("pointerup", end);
              window.removeEventListener("pointercancel", end);
              scrubCleanup.current = null;
            };
            scrubCleanup.current?.();
            scrubCleanup.current = end;
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", end);
            window.addEventListener("pointercancel", end);
          }}
        >
          <ChevronsUpDown size={10} />
        </button>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          aria-label={`Diminuir ${label.toLowerCase()}`}
          disabled={disabled || value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex size-6 items-center justify-center rounded-md bg-white/5 text-slate-300 hover:bg-white/15"
        >
          <Minus size={11} />
        </button>
        <input
          aria-label={`Valor de ${label.toLowerCase()}`}
          title="Digite o valor ou use a roda do mouse"
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          disabled={disabled}
          value={editing ?? value}
          onFocus={() => setEditing(String(value))}
          onChange={(e) => {
            setEditing(e.target.value);
            const next = Number(e.target.value);
            if (
              e.target.value &&
              Number.isInteger(next) &&
              next >= min &&
              next <= max
            )
              onChange(next);
          }}
          onBlur={() => setEditing(null)}
          className="spatial-number h-7 w-10 rounded-md bg-transparent text-center font-mono text-xs font-semibold text-white outline-none focus:bg-white/10"
        />
        <button
          type="button"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          disabled={disabled || value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex size-6 items-center justify-center rounded-md bg-white/5 text-slate-300 hover:bg-white/15"
        >
          <Plus size={11} />
        </button>
      </div>
    </div>
  );
}
