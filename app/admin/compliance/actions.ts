"use server";
import { revalidatePath } from "next/cache";
import {
  auditComplianceProfessional,
  editLegalDocument,
  reviewComplianceExercise,
  updateComplianceItem,
  type EditLegalDocumentBody,
  type ReviewComplianceExerciseBody,
  type UpdateComplianceItemBody,
  type AuditComplianceProfessionalBody,
} from "@/app/_lib/api/fetch-generated";
import { requireAdminPage } from "@/app/admin/_lib/server";

export async function complianceAction(
  action: "document" | "professional" | "exercise" | "item",
  id: string,
  body:
    | EditLegalDocumentBody
    | ReviewComplianceExerciseBody
    | UpdateComplianceItemBody
    | AuditComplianceProfessionalBody,
) {
  await requireAdminPage();
  const result =
    action === "document"
      ? await editLegalDocument(id, body as EditLegalDocumentBody)
      : action === "professional"
        ? await auditComplianceProfessional(
            id,
            body as AuditComplianceProfessionalBody,
          )
        : action === "exercise"
          ? await reviewComplianceExercise(
              id,
              body as ReviewComplianceExerciseBody,
            )
          : await updateComplianceItem(id, body as UpdateComplianceItemBody);
  if (result.status === 200) revalidatePath("/admin/compliance");
  return result.status === 200 ? "Salvo com sucesso." : result.data.error;
}
