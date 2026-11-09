import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { load, read, push, toastError } = vi.hoisted(() => ({
  load: vi.fn(),
  read: vi.fn(),
  push: vi.fn(),
  toastError: vi.fn(),
}));
vi.mock("@/app/_actions/notifications", () => ({
  loadNotificationsAction: load,
  readNotificationAction: read,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("sonner", () => ({ toast: { error: toastError } }));
import { NotificationHub } from "@/app/_components/notification-hub";

const item = {
  id: "one",
  type: "WORKOUT_ASSIGNED",
  title: "Novo treino recebido",
  body: "Confira seu treino",
  readAt: null,
  sentAt: "2026-11-09T12:00:00Z",
  data: { url: "/planning" },
};
beforeEach(() => {
  vi.resetAllMocks();
  load.mockResolvedValue({
    success: true,
    data: { notifications: [item], unreadCount: 1, nextCursor: null },
  });
  read.mockResolvedValue({ success: true });
});
afterEach(cleanup);
async function openHub() {
  fireEvent.click(
    await screen.findByRole("button", { name: "Notificações, 1 não lidas" }),
  );
  await screen.findByText(item.title);
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Marcar como lida" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
}

describe("notification hub", () => {
  it("shows unread count, persists read state and opens the destination", async () => {
    render(<NotificationHub />);
    await openHub();
    fireEvent.click(screen.getByRole("button", { name: "Ver detalhes" }));
    await waitFor(() => expect(read).toHaveBeenCalledWith("one"));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/planning"));
    expect(screen.getByRole("button", { name: "Notificações" })).toBeDefined();
  });

  it("keeps unread state and the hub open if saving fails", async () => {
    read.mockResolvedValue({ success: false, error: "Falha ao salvar" });
    render(<NotificationHub variant="card" />);
    await openHub();
    fireEvent.click(screen.getByRole("button", { name: "Ver detalhes" }));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Falha ao salvar"),
    );
    expect(screen.getByText("Não lida")).toBeDefined();
    expect(push).not.toHaveBeenCalled();
  });

  it("marks all notifications and updates the count", async () => {
    render(<NotificationHub />);
    await openHub();
    fireEvent.click(
      screen.getByRole("button", { name: "Marcar todas como lidas" }),
    );
    await screen.findByText("0 não lidas");
    expect(read).toHaveBeenCalledWith(undefined);
    expect(screen.getByText("Lida")).toBeDefined();
  });

  it("loads subsequent pages without removing previous notifications", async () => {
    load.mockResolvedValue({
      success: true,
      data: { notifications: [item], unreadCount: 2, nextCursor: "one" },
    });
    render(<NotificationHub />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Notificações, 2 não lidas" }),
    );
    await waitFor(() =>
      expect(
        screen
          .getByRole("button", { name: "Carregar mais" })
          .hasAttribute("disabled"),
      ).toBe(false),
    );
    load.mockResolvedValue({
      success: true,
      data: {
        notifications: [{ ...item, id: "two", title: "Outro aviso" }],
        unreadCount: 2,
        nextCursor: null,
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    await screen.findByText("Outro aviso");
    expect(screen.getByText(item.title)).toBeDefined();
    expect(load).toHaveBeenLastCalledWith("one");
  });

  it("shows a retryable loading error", async () => {
    load.mockResolvedValue({ success: false, error: "Falha de conexão" });
    render(<NotificationHub />);
    fireEvent.click(screen.getByRole("button", { name: "Notificações" }));
    await screen.findByRole("alert");
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeDefined();
  });
});
