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

/**
 * Read-only getter for the returnTo cookie.
 * Safe to call inside Server Components during render because it NEVER mutates cookies (never calls set or delete).
 */
export async function readReturnToCookie(): Promise<string | null> {
  const jar = await cookies();
  const raw =
    typeof jar?.get === "function"
      ? jar.get(RETURN_TO_COOKIE_NAME)?.value
      : null;
  return sanitizeReturnTo(raw);
}

/**
 * Sets the returnTo cookie with security flags.
 * MUST only be called in Server Actions or Route Handlers.
 */
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

/**
 * Clears the returnTo cookie.
 * MUST only be called in Server Actions or Route Handlers.
 */
export async function clearReturnToCookie(): Promise<void> {
  const jar = await cookies();
  if (typeof jar?.delete === "function") {
    jar.delete(RETURN_TO_COOKIE_NAME);
  }
}

/**
 * Atomically reads, validates, and clears the returnTo cookie.
 * MUST only be called in Server Actions or Route Handlers.
 */
export async function consumeReturnToCookie(): Promise<string | null> {
  const jar = await cookies();
  const raw =
    typeof jar?.get === "function"
      ? jar.get(RETURN_TO_COOKIE_NAME)?.value
      : null;
  const sanitized = sanitizeReturnTo(raw);

  if (typeof jar?.delete === "function") {
    jar.delete(RETURN_TO_COOKIE_NAME);
  }

  return sanitized;
}

/**
 * @deprecated Use readReturnToCookie for Server Components / read-only contexts, or consumeReturnToCookie for Server Actions / Route Handlers.
 */
export async function getReturnToCookie(consume = false): Promise<string | null> {
  if (consume) {
    return consumeReturnToCookie();
  }
  return readReturnToCookie();
}
