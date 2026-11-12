import fs from "node:fs";
import { expect, test } from "@playwright/test";

test("personal conhece o painel e o editor e pode pular os guias no celular", async ({
  browser,
}, testInfo) => {
  const fixtures = JSON.parse(
    fs.readFileSync(".tmp/e2e-fixtures.json", "utf8"),
  );
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
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
    await page.goto("http://127.0.0.1:3100/personal");
    await expect(
      page.getByRole("heading", { name: "Sua assessoria começa aqui" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Próximo", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Cadastre seu primeiro aluno" }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("painel-onboarding-mobile.png"),
    });
    await page.getByRole("button", { name: "Pular", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Rever guia" }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Cadastrar aluno", exact: true })
      .click();
    await expect(page.getByLabel("Nome do aluno")).toBeVisible();
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await page.goto("http://127.0.0.1:3100/personal/modelos/novo");
    await expect(
      page.getByRole("heading", { name: "Conheça o novo editor de treinos" }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("editor-onboarding-mobile.png"),
    });
    await page.getByRole("button", { name: "Pular", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Guia do editor" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Conheça o novo editor de treinos" }),
    ).toHaveCount(0);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Guia do editor" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Conheça o novo editor de treinos" }),
    ).toHaveCount(0);
  } finally {
    await context.close();
  }
});
