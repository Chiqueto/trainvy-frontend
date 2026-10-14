import { cookies } from "next/headers";

export const RETURN_TO_COOKIE_NAME = "trainvy-return-to";

/**
 * Strict validator for returnTo parameter.
 * Only allows relative paths to public invitation pages: /convite/:token
 * Where token is an alphanumeric or URL-safe token (8 to 128 characters).
 *
 * Explicitly rejects:
 * - Absolute URLs (https://, http://)
 * - Protocol-relative URLs (//)
 * - Javascript URIs (javascript:)
 * - Data URIs (data:)
 * - Backslashes or directory traversal (/..)
 * - Any path not strictly matching /convite/[a-zA-Z0-9_-]{8,128}
 */
const INVITATION_PATH_REGEX = /^\/convite\/[a-zA-Z0-9_-]{8,128}$/;

export function sanitizeReturnTo(raw?: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;

  const trimmed = raw.trim();

  // Explicit security checks against open-redirect vectors
  if (
    trimmed.startsWith("//") ||
    trimmed.includes("://") ||
    trimmed.includes("\\") ||
    trimmed.toLowerCase().startsWith("javascript:") ||
    trimmed.toLowerCase().startsWith("data:")
  ) {
    return null;
  }

  // Strictly match /convite/:token format
  if (!INVITATION_PATH_REGEX.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export async function setReturnToCookie(destination: string): Promise<boolean> {
  const sanitized = sanitizeReturnTo(destination);
  if (!sanitized) return false;

  const jar = await cookies();
  if (typeof jar?.set === "function") {
    jar.set(RETURN_TO_COOKIE_NAME, sanitized, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30, // 30 minutes
    });
  }
  return true;
}

export async function getReturnToCookie(clear = false): Promise<string | null> {
  const jar = await cookies();
  const raw =
    typeof jar?.get === "function"
      ? jar.get(RETURN_TO_COOKIE_NAME)?.value
      : null;
  const sanitized = sanitizeReturnTo(raw);

  if (clear || (raw && !sanitized)) {
    if (typeof jar?.delete === "function") {
      jar.delete(RETURN_TO_COOKIE_NAME);
    }
  }

  return sanitized;
}

export async function clearReturnToCookie(): Promise<void> {
  const jar = await cookies();
  if (typeof jar?.delete === "function") {
    jar.delete(RETURN_TO_COOKIE_NAME);
  }
}
