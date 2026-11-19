export function canEditPersonalWorkout(plan: {
  originType: string;
  prescriptionStatus: string;
}) {
  return !(
    plan.originType.startsWith("PROFESSIONAL_") &&
    plan.prescriptionStatus === "APPROVED_PRESCRIBED"
  );
}
