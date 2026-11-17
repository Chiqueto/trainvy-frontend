import { getCurrentTrainingWeek } from "@/app/_lib/api/fetch-generated";

export async function GET(request: Request) {
  const tz = new URL(request.url).searchParams.get("tz") ?? "";
  try {
    const result = await getCurrentTrainingWeek({ tz }, { cache: "no-store" });
    return Response.json(result.data, {
      status: result.status,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json(
      { error: "Não foi possível carregar a semana." },
      { status: 502 },
    );
  }
}
