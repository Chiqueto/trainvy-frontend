import { RetryButton } from "../alunos/[athleteId]/_components/retry-button";
export function WorkspaceError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3"
    >
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs text-muted-foreground">
        Tente novamente para consultar os dados atualizados.
      </p>
      <RetryButton />
    </div>
  );
}
