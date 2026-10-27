import { getSportsProfile } from "@/app/_lib/api/fetch-generated";
import { SportsProfileForm } from "./sports-profile-form";
export async function SportsProfileSection() {
  const result = await getSportsProfile({ cache: "no-store" }).catch(
    () => null,
  );
  if (result?.status !== 200)
    return (
      <p
        role="alert"
        className="rounded-xl border border-border p-4 text-sm text-muted-foreground"
      >
        Não foi possível carregar o perfil esportivo. Atualize a página para
        tentar novamente.
      </p>
    );
  return <SportsProfileForm initial={result.data} />;
}
