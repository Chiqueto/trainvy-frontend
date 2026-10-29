import { redirect } from "next/navigation";
import {
  getCommercialContext,
  getProfessionalRegistration,
} from "@/app/_lib/api/fetch-generated";
import { requireAccountSetup } from "@/app/_lib/require-account-setup";
import { ProfessionalRegistrationForm } from "../_components/professional-registration-form";
import Link from "next/link";
export default async function VerificationPage() {
  await requireAccountSetup();
  const identity = await getCommercialContext({ cache: "no-store" });
  if (identity.status !== 200 || identity.data.accountType !== "COACH")
    redirect("/profile");
  const registration = await getProfessionalRegistration({ cache: "no-store" });
  return (
    <main className="mx-auto max-w-lg p-5 space-y-5">
      <Link className="text-sm underline" href="/personal">
        Voltar à área profissional
      </Link>
      <ProfessionalRegistrationForm
        registration={registration.status === 200 ? registration.data : null}
      />
    </main>
  );
}
