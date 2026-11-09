"use client";
import { track } from "@vercel/analytics";
type ProductEvent =
  | "Signup completed"
  | "Professional workspace opened"
  | "Coach invitation created"
  | "Prescription sent"
  | "Prescription accepted"
  | "Workout completed";
export function trackProductEvent(event: ProductEvent) {
  // Event names only: no user IDs, health data, names, prompts or invitation tokens.
  try {
    track(event);
  } catch {
    /* Analytics cannot interrupt a completed operation. */
  }
}
