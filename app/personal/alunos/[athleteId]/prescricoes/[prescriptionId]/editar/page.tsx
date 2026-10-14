import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BottomNav } from "@/app/_components/bottom-nav";
import {
  getCoachAthleteDetails,
  getCoachPrescriptionDetails,
  getCommercialContext,
} from "@/app/_lib/api/fetch-generated";
import { requireAccountSetup } from "@/app/_lib/require-account-setup";
import { CoachPrescriptionBuilder } from "../../../_components/coach-prescription-builder";

interface EditPrescriptionPageProps {
  params: Promise<{
    athleteId: string;
    prescriptionId: string;
  }>;
}

export default async function EditPrescriptionPage({
  params,
}: EditPrescriptionPageProps) {
  await requireAccountSetup();

  const commercialRes = await getCommercialContext({ cache: "no-store" });
  if (commercialRes.status !== 200 || !commercialRes.data) {
    redirect("/profile");
  }

  const { accountType, entitlements } = commercialRes.data;
  if (accountType !== "COACH") {
    redirect("/profile");
  }

  const hasAssignWorkouts = entitlements.some(
    (e) => e.key === "ASSIGN_WORKOUTS",
  );
  if (!hasAssignWorkouts) {
    redirect("/personal");
  }

  const { athleteId, prescriptionId } = await params;

  let athleteData = null;
  let prescriptionData = null;

  try {
    const [athleteRes, prescriptionRes] = await Promise.all([
      getCoachAthleteDetails(athleteId, { cache: "no-store" }),
      getCoachPrescriptionDetails(prescriptionId, { cache: "no-store" }),
    ]);

    if (athleteRes.status === 200) athleteData = athleteRes.data;
    if (prescriptionRes.status === 200) prescriptionData = prescriptionRes.data;
  } catch {
    // 404
  }

  if (!athleteData || !prescriptionData) {
    notFound();
  }

  // Apenas rascunhos podem ser editados
  if (prescriptionData.status !== "DRAFT") {
    redirect(`/personal/alunos/${athleteId}?tab=prescriptions`);
  }

  return (
    <div className="flex min-h-svh flex-col bg-background pb-24">
      <main className="mx-auto w-full max-w-lg px-5 py-4 flex flex-col gap-5">
        {/* Header com Navegação */}
        <div className="flex items-center justify-between">
          <Link
            href={`/personal/alunos/${athleteId}?tab=prescriptions`}
            className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar para {athleteData.name}</span>
          </Link>
          <span className="font-heading text-[10px] uppercase font-bold tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
            Editando Rascunho
          </span>
        </div>

        {/* Título */}
        <div className="space-y-1">
          <h1 className="font-heading text-xl font-bold text-foreground">
            Editar Rascunho de Prescrição
          </h1>
          <p className="text-xs text-muted-foreground">
            Ajuste os exercícios e parâmetros antes de enviar para{" "}
            <strong>{athleteData.name}</strong>
          </p>
        </div>

        <CoachPrescriptionBuilder
          athleteId={athleteId}
          athleteName={athleteData.name}
          initialData={{
            id: prescriptionData.id,
            name: prescriptionData.name,
            notes: prescriptionData.notes,
            workoutDays: prescriptionData.payload?.workoutDays,
          }}
        />
      </main>

      <BottomNav activePage="profile" />
    </div>
  );
}
