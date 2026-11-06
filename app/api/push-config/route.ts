export const dynamic = "force-dynamic";

export async function GET() {
  // Read at request time instead of inlining NEXT_PUBLIC_* during next build.
  const runtimeEnv = process.env;
  const publicKey = runtimeEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const headers = { "Cache-Control": "no-store" };

  if (!publicKey) {
    return Response.json(
      { error: "Notificações indisponíveis temporariamente. Tente novamente mais tarde." },
      { status: 503, headers },
    );
  }

  // Only the public application server key may be returned to the browser.
  return Response.json({ publicKey }, { headers });
}
