"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RetryButton() {
  return (
    <Button
      variant="default"
      onClick={() => window.location.reload()}
      className="gap-2 font-heading text-xs font-semibold"
    >
      <RotateCcw className="size-3.5" />
      <span>Tentar Novamente</span>
    </Button>
  );
}
