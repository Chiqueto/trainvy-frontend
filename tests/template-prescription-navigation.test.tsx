import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AllocateTemplateModal } from "@/app/personal/modelos/_components/allocate-template-modal";
import { allocateTemplateAction } from "@/app/personal/_actions";

const { push, close } = vi.hoisted(() => ({ push: vi.fn(), close: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/app/personal/_actions", () => ({ allocateTemplateAction: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("Criar prescrição a partir de um modelo", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  function openModal() {
    render(<AllocateTemplateModal
      isOpen
      onClose={close}
      template={{ id: "template-1", name: "Treino base" }}
      athletes={[{ id: "athlete-1", name: "Ana", email: "ana@example.com", status: "ACTIVE" }]}
    />);
    fireEvent.click(screen.getByRole("button", { name: /Ana/ }));
    fireEvent.change(screen.getByLabelText(/Orientações/), { target: { value: "Revisar carga" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar rascunho para revisão" }));
  }

  it("abre as prescrições do aluno após criar o rascunho com sucesso", async () => {
    vi.mocked(allocateTemplateAction).mockResolvedValue({ success: true, data: {} } as Awaited<ReturnType<typeof allocateTemplateAction>>);
    openModal();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/personal/alunos/athlete-1?tab=prescriptions"));
    expect(allocateTemplateAction).toHaveBeenCalledWith("template-1", { athleteId: "athlete-1", notes: "Revisar carga" });
    expect(close).toHaveBeenCalledOnce();
  });

  it("mantém o formulário e as orientações quando a criação falha", async () => {
    vi.mocked(allocateTemplateAction).mockResolvedValue({ success: false, error: "Tente novamente" });
    openModal();
    await waitFor(() => expect(screen.getByRole("button", { name: "Criar rascunho para revisão" }).hasAttribute("disabled")).toBe(false));
    expect(push).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    expect((screen.getByLabelText(/Orientações/) as HTMLTextAreaElement).value).toBe("Revisar carga");
  });
});
