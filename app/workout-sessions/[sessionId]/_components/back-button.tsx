"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  const handleClick = () => {
    if (
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement &&
      (document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA")
    ) {
      document.activeElement.blur();
    }
    router.push("/");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="text-foreground hover:bg-muted"
    >
      <ChevronLeft className="size-6 text-foreground" />
      <span className="sr-only">Voltar</span>
    </Button>
  );
}
