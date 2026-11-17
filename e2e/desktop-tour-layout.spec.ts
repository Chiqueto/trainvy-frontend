import fs from "node:fs";
import { expect, test } from "@playwright/test";

test("guia mantém conteúdo fora da sidebar no desktop e salva regiões opcionais", async ({
  browser,
}, testInfo) => {
  const fixtures = JSON.parse(
    fs.readFileSync(".tmp/e2e-fixtures.json", "utf8"),
  );
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await context.addCookies([
    {
      name: "better-auth.session_token",
      value: fixtures.users.coach.cookie,
      url: "http://127.0.0.1:3100",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const page = await context.newPage();
  try {
    await page.goto("/personal");
    await page
      .getByRole("button", { name: "Rever guia", includeHidden: true })
      .waitFor({ state: "attached" });
    if (!(await page.getByRole("dialog").count()))
      await page.getByRole("button", { name: "Rever guia" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    for (let step = 0; step < 5; step++) {
      const nav = await page.locator(".app-navigation").boundingBox();
      const main = await page.locator("main").boundingBox();
      const dialog = await page.getByRole("dialog").boundingBox();
      expect(main!.x).toBeGreaterThanOrEqual(nav!.x + nav!.width);
      expect(dialog!.x).toBeGreaterThanOrEqual(nav!.x + nav!.width);
      expect(dialog!.y + dialog!.height).toBeLessThanOrEqual(900);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (step < 4)
        await page
          .getByRole("button", { name: "Próximo", exact: true })
          .click();
    }
    await page.screenshot({
      path: testInfo.outputPath("onboarding-desktop.png"),
    });
    await page.getByRole("button", { name: "Concluir", exact: true }).click();
    await page.goto("/personal/exercicios");
    await page
      .getByRole("button", { name: "Novo Exercício", exact: true })
      .click();
    await page.getByLabel(/Nome do Exercício/).fill("Remada detalhada desktop");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Costas", exact: true })
      .first()
      .click();
    await page.getByText("Detalhar Costas").click();
    await page.getByLabel("Romboides", { exact: true }).check();
    await page.getByLabel("Latíssimo do dorso", { exact: true }).check();
    await page.screenshot({
      path: testInfo.outputPath("muscle-details-desktop.png"),
    });
    await page
      .getByRole("button", { name: "Cadastrar Exercício", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Remada detalhada desktop" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("Latíssimo do dorso, Romboides", { exact: false }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
