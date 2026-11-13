import { redirect } from "next/navigation";
import {
  getCommercialContext,
  getProfessionalRegistration,
} from "@/app/_lib/api/fetch-generated";
import { requireAccountSetup } from "@/app/_lib/require-account-setup";
import { ProfessionalRegistrationForm } from "../_components/professional-registration-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/app/_components/bottom-nav";
export default async function VerificationPage() {
  await requireAccountSetup();
  const identity = await getCommercialContext({ cache: "no-store" });
  if (identity.status !== 200 || identity.data.accountType !== "COACH")
    redirect("/profile");
  const registration = await getProfessionalRegistration({ cache: "no-store" });
  return (
    <div className="personal-workspace min-h-svh bg-background pb-24 lg:pb-8">
      <main className="trainvy-page mx-auto w-full p-5 space-y-5">
        <Link
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          href="/profile"
        >
          <ArrowLeft className="size-4" /> Voltar ao perfil
        </Link>
        <ProfessionalRegistrationForm
          registration={registration.status === 200 ? registration.data : null}
        />
      </main>
      <BottomNav isCoach activePage="profile" />
    </div>
  );
}
