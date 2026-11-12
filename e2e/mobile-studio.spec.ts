import fs from "node:fs";
import { expect, test, type CDPSession } from "@playwright/test";

const origin = "http://127.0.0.1:3100";
async function touch(
  cdp: CDPSession,
  type: "touchStart" | "touchMove" | "touchEnd",
  points: { id: number; x: number; y: number }[],
) {
  await cdp.send("Input.dispatchTouchEvent", {
    type,
    touchPoints: points.map((point) => ({
      ...point,
      radiusX: 4,
      radiusY: 4,
      force: 1,
    })),
  });
}

test("mobile studio supports card dragging, two-finger zoom and a compact action bar", async ({
  browser,
}, testInfo) => {
  const fixture = JSON.parse(fs.readFileSync(".tmp/e2e-fixtures.json", "utf8"));
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await context.addCookies([
    {
      name: "better-auth.session_token",
      value: fixture.users.coach.cookie,
      url: origin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await context.request.patch(`${origin}/backend/coach/onboarding`, {
    data: { tour: "builder" },
  });
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/personal/modelos/novo`);
    await expect(
      page.getByRole("navigation", { name: "Ações do treino" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Salvar", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("searchbox", { name: "Buscar exercícios no deck" })
      .fill("Supino Reto com Barra");
    await page
      .getByRole("button", {
        name: "Adicionar Supino Reto com Barra",
        exact: true,
      })
      .click();
    const card = page.locator("[data-holo-card]").first();
    await expect(card).toBeVisible();
    const handle = await card
      .getByRole("button", { name: /^Mover / })
      .boundingBox();
    expect(handle).not.toBeNull();
    const cdp = await context.newCDPSession(page);
    const before = await card.evaluate((element) => ({
      x: parseFloat((element as HTMLElement).style.left),
      y: parseFloat((element as HTMLElement).style.top),
    }));
    const point = {
      id: 0,
      x: handle!.x + handle!.width / 2,
      y: handle!.y + handle!.height / 2,
    };
    await touch(cdp, "touchStart", [point]);
    await touch(cdp, "touchMove", [
      { ...point, x: point.x + 22, y: point.y + 15 },
    ]);
    await touch(cdp, "touchMove", [
      { ...point, x: point.x + 70, y: point.y + 45 },
    ]);
    await touch(cdp, "touchEnd", []);
    await expect
      .poll(async () =>
        card.evaluate((element) =>
          parseFloat((element as HTMLElement).style.left),
        ),
      )
      .toBeGreaterThan(before.x + 40);
    await page.screenshot({ path: testInfo.outputPath("mobile-studio.png") });
    const plane = page.locator("[data-spatial-plane]");
    const zoom = () =>
      plane.evaluate((element) =>
        Number(
          (element as HTMLElement).style.transform.match(
            /scale\(([^)]+)\)/,
          )?.[1],
        ),
      );
    // Start on a card too: the second finger must cancel its drag before zooming.
    const movedHandle = await card
      .getByRole("button", { name: /^Mover / })
      .boundingBox();
    const firstFinger = {
      id: 0,
      x: movedHandle!.x + movedHandle!.width / 2,
      y: movedHandle!.y + movedHandle!.height / 2,
    };
    const secondFinger = { id: 1, x: firstFinger.x + 40, y: firstFinger.y };
    const afterDrag = await card.getAttribute("style");
    await touch(cdp, "touchStart", [firstFinger]);
    await touch(cdp, "touchStart", [firstFinger, secondFinger]);
    await touch(cdp, "touchMove", [
      { id: 0, x: 30, y: 350 },
      { id: 1, x: 340, y: 350 },
    ]);
    await touch(cdp, "touchEnd", []);
    await expect.poll(zoom).toBeGreaterThan(1.35);
    await touch(cdp, "touchStart", [
      { id: 0, x: 30, y: 350 },
      { id: 1, x: 350, y: 350 },
    ]);
    await touch(cdp, "touchMove", [
      { id: 0, x: 180, y: 350 },
      { id: 1, x: 190, y: 350 },
    ]);
    await touch(cdp, "touchEnd", []);
    await expect.poll(zoom).toBeLessThan(0.6);
    await expect(card).toHaveCount(1);
    expect(await card.getAttribute("style")).toBe(afterDrag);
    await page.getByRole("button", { name: "Mais ações do treino" }).click();
    await expect(
      page.getByRole("button", { name: "Editar informações" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Centralizar mesa" }).click();
    await expect.poll(zoom).toBeCloseTo(0.85);
    await expect(card).toBeVisible();
    await card.locator("[data-card-title]").tap();
    await expect(
      page.getByRole("heading", { name: "Supino Reto com Barra", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Fechar painel" }).click();
  } finally {
    await context.close();
  }
});

test("desktop keeps its expanded deck and camera toolbar", async ({
  browser,
}, testInfo) => {
  const fixture = JSON.parse(fs.readFileSync(".tmp/e2e-fixtures.json", "utf8"));
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  await context.addCookies([
    {
      name: "better-auth.session_token",
      value: fixture.users.coach.cookie,
      url: origin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/personal/modelos/novo`);
    await expect(
      page.getByRole("button", { name: "Auto-organizar formação" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Lista rolável de exercícios" }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Ações do treino" }),
    ).toBeHidden();
    await page.screenshot({ path: testInfo.outputPath("desktop-studio.png") });
  } finally {
    await context.close();
  }
});
