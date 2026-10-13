"use client";

import { useState } from "react";
import { ChevronRight, MessageSquareHeart } from "lucide-react";
import { FeedbackDialog } from "./feedback-dialog";

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between p-4 rounded-2xl border border-border/70 bg-card hover:bg-muted/30 transition-colors text-left shadow-xs group"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
            <MessageSquareHeart className="size-5" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Enviar Feedback
            </h3>
            <p className="text-xs text-muted-foreground">
              Relate problemas ou sugira melhorias para o beta.
            </p>
          </div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>

      <FeedbackDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
