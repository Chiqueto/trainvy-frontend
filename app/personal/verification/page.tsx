import { redirect } from "next/navigation";
import {
  getCommercialContext,
  getProfessionalRegistration,
} from "@/app/_lib/api/fetch-generated";
import { ProfessionalRegistrationForm } from "../_components/professional-registration-form";

export default async function VerificationPage() {
  const identity = await getCommercialContext({ cache: "no-store" });
  if (identity.status === 401) redirect("/auth");
  if (identity.status !== 200)
    throw new Error("Não foi possível verificar sua conta.");
  if (!identity.data?.accountSetupCompletedAt) redirect("/auth/complete");
  if (identity.data.accountType !== "COACH") redirect("/profile");
  if (identity.data.professionalAccessGranted) redirect("/personal");

  const registration = await getProfessionalRegistration({ cache: "no-store" });
  return (
    <div className="personal-workspace flex min-h-svh flex-col items-center justify-center bg-background p-4 sm:p-6">
      <main className="w-full max-w-xl space-y-4">
        <div className="text-center space-y-1 mb-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Habilitação Profissional Obrigatória
          </h1>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Para atuar como Personal Trainer no Trainvy e prescrever treinos para seus alunos, informe suas credenciais e declare a responsabilidade técnica.
          </p>
        </div>
        <ProfessionalRegistrationForm
          registration={registration.status === 200 ? registration.data : null}
        />
      </main>
    </div>
  );
}
