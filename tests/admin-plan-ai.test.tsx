import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const flags = vi.hoisted(() => ({
  professionalAiEnabled: false,
  athleteAiEnabled: false,
}));
vi.mock("@/app/_components/ai-availability-provider", () => ({
  useAiAvailability: () => flags,
}));
import { PlanPermissionsFields } from "@/app/admin/_components/plan-permissions-fields";
afterEach(cleanup);
beforeEach(() => {
  flags.professionalAiEnabled = false;
  flags.athleteAiEnabled = false;
});

it("keeps new plans without AI when both flags are off", () => {
  render(<PlanPermissionsFields value={[]} onChange={vi.fn()} />);
  expect(screen.queryByLabelText("Chat IA")).toBeNull();
  expect(screen.queryByLabelText("Planejamento IA")).toBeNull();
  expect(screen.getByLabelText("Gerenciar atletas")).toBeDefined();
});
it("offers optional AI according to the plan audience, including internal plans", () => {
  flags.professionalAiEnabled = true;
  const change = vi.fn();
  const { rerender } = render(
    <PlanPermissionsFields audience="COACH" value={[]} onChange={change} />,
  );
  fireEvent.click(screen.getByLabelText("Chat IA"));
  expect(change).toHaveBeenCalledWith([
    { entitlement: "AI_CHAT", limitValue: null },
  ]);
  rerender(
    <PlanPermissionsFields audience="ATHLETE" value={[]} onChange={change} />,
  );
  expect(screen.queryByLabelText("Chat IA")).toBeNull();
  rerender(
    <PlanPermissionsFields audience="INTERNAL" value={[]} onChange={change} />,
  );
  expect(screen.queryByLabelText("Chat IA")).toBeNull();
  flags.athleteAiEnabled = true;
  rerender(
    <PlanPermissionsFields audience="INTERNAL" value={[]} onChange={change} />,
  );
  expect(screen.getByLabelText("Chat IA")).toBeDefined();
});
it("allows removing a selected AI permission after its flag is disabled", () => {
  const change = vi.fn();
  render(
    <PlanPermissionsFields
      value={[{ entitlement: "AI_CHAT", limitValue: 5 }]}
      onChange={change}
    />,
  );
  fireEvent.click(screen.getByLabelText("Chat IA"));
  expect(change).toHaveBeenCalledWith([]);
});
