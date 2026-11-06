export function PlanLegalLabel({
  data,
}: {
  data: {
    originType: string;
    prescriptionStatus: string;
    prescribedCrefSnapshot: string | null;
  };
}) {
  return (
    <p className="rounded-lg border bg-background p-3 text-xs text-foreground">
      {data.originType.startsWith("PROFESSIONAL_")
        ? `Prescrito por: ${data.prescribedCrefSnapshot ?? "Identificação profissional pendente"}`
        : data.originType === "IMPORTED_OCR_USER"
          ? "Ficha importada e conferida pelo usuário"
          : "Diário de Treino Pessoal (Auto-organizado)"}
      {data.prescriptionStatus === "DRAFT_AI" &&
        " · Sugestão gerada por IA — Revisão e aprovação profissional obrigatória antes de liberar ao aluno"}
    </p>
  );
}
