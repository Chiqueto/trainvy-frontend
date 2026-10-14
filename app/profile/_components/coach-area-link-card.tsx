import Link from "next/link";
import { ArrowRight, UserCheck } from "lucide-react";

export function CoachAreaLinkCard() {
  return (
    <Link
      href="/personal"
      className="w-full rounded-2xl border border-primary/30 bg-primary/10 hover:bg-primary/15 p-4 flex items-center justify-between gap-3 shadow-xs transition-all group text-left"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
          <UserCheck className="size-6" />
        </div>
        <div className="flex flex-col">
          <span className="font-heading text-sm font-bold text-foreground group-hover:text-primary transition-colors">
            Área do Personal
          </span>
          <span className="text-xs text-muted-foreground">
            Gerencie seus alunos vinculados e convites
          </span>
        </div>
      </div>

      <div className="flex size-8 items-center justify-center rounded-full bg-background border border-border group-hover:border-primary/40 text-foreground transition-colors shrink-0">
        <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}
