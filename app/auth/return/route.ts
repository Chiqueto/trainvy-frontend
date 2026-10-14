import { NextRequest, NextResponse } from "next/server";
import { consumeReturnToCookie } from "@/app/_lib/auth-return-to";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const destination = await consumeReturnToCookie();
  const targetUrl = destination
    ? new URL(destination, request.url)
    : new URL("/", request.url);

  return NextResponse.redirect(targetUrl);
}
