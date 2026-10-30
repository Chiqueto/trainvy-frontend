/** Preserve the original AI SDK request (including attachments and approvals) on retry. */
export async function fetchWithFeatureConsent(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  requestConsent: (feature: "AI_WORKOUT") => Promise<boolean>,
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status !== 428) return response;
  const problem = await response.clone().json();
  if (
    problem.code !== "FEATURE_TERMS_REQUIRED" ||
    problem.feature !== "AI_WORKOUT"
  )
    return response;
  if (!(await requestConsent("AI_WORKOUT")))
    throw new Error("FEATURE_TERMS_CANCELLED");
  if (init?.signal?.aborted) throw new Error("FEATURE_TERMS_CANCELLED");
  return fetch(input, init);
}
