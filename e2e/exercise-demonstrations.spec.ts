import fs from "node:fs";
import { expect, test, type BrowserContext } from "@playwright/test";

test("personal configura vídeo e referência 3D no celular e somente alunos vinculados acessam", async ({
  browser,
}, testInfo) => {
  const fixtures = JSON.parse(
    fs.readFileSync(".tmp/e2e-fixtures.json", "utf8"),
  );
  const origin = "http://127.0.0.1:3100";
  const contexts: BrowserContext[] = [];
  async function login(role: string) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    contexts.push(context);
    await context.addCookies([
      {
        name: "better-auth.session_token",
        value: fixtures.users[role].cookie,
        url: origin,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    return context;
  }
  try {
    const coach = await login("coach");
    const page = await coach.newPage();
    const name = `Execução exclusiva ${Date.now()}`;
    await page.goto(`${origin}/personal/exercicios`);
    await page
      .getByRole("button", { name: "Novo Exercício", exact: true })
      .click();
    await page.getByLabel("Nome do Exercício", { exact: false }).fill(name);
    await page
      .getByLabel("Link do YouTube", { exact: true })
      .fill("https://youtu.be/M7lc1UVf-VE");
    await page.getByLabel("Execução da biblioteca 3D").selectOption("squat");
    await page
      .getByRole("button", { name: "Cadastrar Exercício", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    const catalog = await coach.request.get(
      `${origin}/backend/exercises?onlyCustom=true`,
    );
    expect(catalog.status()).toBe(200);
    const exercise = (await catalog.json()).find(
      (item: { name: string }) => item.name === name,
    );
    expect(exercise.demonstration.animationKey).toBe("squat");

    const athlete = await login("athlete");
    const media = await athlete.request.get(
      `${origin}/backend/exercises/${exercise.id}/media`,
    );
    expect(media.status()).toBe(200);
    expect((await media.json()).demonstration.youtubeUrl).toBe(
      "https://www.youtube.com/watch?v=M7lc1UVf-VE",
    );
    const other = await login("other");
    expect(
      (
        await other.request.get(
          `${origin}/backend/exercises/${exercise.id}/media`,
        )
      ).status(),
    ).toBe(404);

    await page
      .getByRole("button", { name: "Ver execução", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: `Reproduzir demonstração de ${name}` }),
    ).toBeVisible();
    expect(await page.locator("iframe").count()).toBe(0);
    await page.screenshot({
      path: testInfo.outputPath("exercise-video-mobile.png"),
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Fechar guia de execução" }).click();

    await page
      .getByRole("button", { name: "Biblioteca Trainvy", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Buscar exercício da biblioteca" })
      .fill("Supino Reto com Barra");
    const card = page
      .getByRole("heading", { name: "Supino Reto com Barra", exact: true })
      .locator("..");
    await card.getByRole("button", { name: "Personalizar execução" }).click();
    await page
      .getByLabel("Link do YouTube", { exact: true })
      .fill("https://youtu.be/M7lc1UVf-VE");
    await page.getByRole("button", { name: "Salvar demonstração" }).click();
    await expect(card.getByText("Demonstração personalizada")).toBeVisible();
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});
