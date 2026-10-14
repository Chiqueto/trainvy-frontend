import { headers } from "next/headers";
import { authClient } from "@/app/_lib/auth-client";
import {
  getCommercialContext,
  getInvitationPreview,
} from "@/app/_lib/api/fetch-generated";
import { Logo } from "@/app/_components/logo";
import { InvitationPreviewCard } from "./_components/invitation-preview-card";

interface ConvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function ConvitePage({ params }: ConvitePageProps) {
  const { token } = await params;

  // Busca o preview público do convite
  const previewRes = await getInvitationPreview(token, { cache: "no-store" });
  const previewData = previewRes.status === 200 ? previewRes.data : null;

  // Verifica se o usuário atual está autenticado
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  let accountType: string | undefined = undefined;
  if (session.data?.user) {
    try {
      const commercialRes = await getCommercialContext({ cache: "no-store" });
      if (commercialRes.status === 200 && commercialRes.data) {
        accountType = commercialRes.data.accountType;
      }
    } catch {
      // Ignora erro de contexto comercial não crítico aqui
    }
  }

  const currentUser = session.data?.user
    ? {
        id: session.data.user.id,
        name: session.data.user.name,
        email: session.data.user.email,
        accountType,
      }
    : null;

  return (
    <div className="flex min-h-svh flex-col bg-background p-5 items-center justify-center">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <Logo size="lg" asLink />

        <InvitationPreviewCard
          token={token}
          isValid={previewData?.isValid ?? false}
          message={previewData?.message}
          reason={previewData?.reason}
          coach={previewData?.coach ?? null}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}
