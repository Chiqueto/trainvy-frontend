"use client";

import { Bot } from "lucide-react";
import { useQueryStates, parseAsBoolean, parseAsString } from "nuqs";
import { cn } from "@/lib/utils";
import { useAiAvailability } from "./ai-availability-provider";

interface ChatOpenButtonProps {
  className?: string;
}

export function ChatOpenButton({ className }: ChatOpenButtonProps) {
  const { chatEnabled: enabled } = useAiAvailability();
  const [chatParams, setChatParams] = useQueryStates({
    chat_open: parseAsBoolean.withDefault(false),
    chat_initial_message: parseAsString,
  });

  const isOpen = chatParams.chat_open;
  if (!enabled) return null;

  return (
    <button
      type="button"
      onClick={() => setChatParams({ chat_open: !isOpen })}
      className={cn(
        "group relative flex flex-1 flex-col items-center justify-center -mt-3.5 focus:outline-none w-full",
        className,
      )}
      aria-label="Coach"
    >
      <div
        className={cn(
          "flex size-11 items-center justify-center rounded-full bg-primary shadow-md shadow-primary/25 transition-all duration-200 active:scale-95 group-hover:scale-105",
          isOpen &&
            "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105",
        )}
      >
        <Bot className="size-5 text-primary-foreground" />
      </div>
      <span
        className={cn(
          "mt-1 font-heading text-[11px] leading-tight font-semibold transition-colors",
          isOpen
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        Coach
      </span>
      {isOpen && <span className="mt-0.5 h-0.5 w-4 rounded-full bg-primary" />}
    </button>
  );
}
