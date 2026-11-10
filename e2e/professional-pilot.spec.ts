import fs from "node:fs";
import { expect, test, type Browser } from "@playwright/test";

const baseURL = "http://127.0.0.1:3100";
function fixtures() {
  return JSON.parse(fs.readFileSync(".tmp/e2e-fixtures.json", "utf8")) as {
    users: Record<string, { id: string; cookie: string }>;
  };
}
async function asRole(browser: Browser, role: string, mobile = false) {
  const context = await browser.newContext({
    baseURL,
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 1000 },
  });
  await context.addCookies([
    {
      name: "better-auth.session_token",
      value: fixtures().users[role].cookie,
      url: baseURL,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  return { context, page: await context.newPage() };
}

test("declared professional uses the dashboard on desktop and mobile; pending access has support", async ({
  browser,
}) => {
  for (const mobile of [false, true]) {
    const { context, page } = await asRole(browser, "coach", mobile);
    await page.goto("/personal");
    await expect(
      page.getByRole("heading", { name: "Painel do Personal" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Convidar novo aluno" }),
    ).toBeVisible();
    await expect(
      page
        .locator(`a[href="/personal/alunos/${fixtures().users.athlete.id}"]`)
        .filter({ hasText: "Piloto E2E athlete", visible: true })
        .first(),
    ).toBeVisible();
    const layout = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      overflow: Array.from(document.querySelectorAll("body *"))
        .map((element) => ({
          element: element.tagName,
          class: element.className,
          right: element.getBoundingClientRect().right,
          width: element.getBoundingClientRect().width,
        }))
        .filter((element) => element.right > window.innerWidth + 1)
        .slice(-20),
    }));
    expect(layout.width, JSON.stringify(layout)).toBeLessThanOrEqual(
      layout.viewport,
    );
    await context.close();
  }
  const { context, page } = await asRole(browser, "pending", true);
  await page.goto("/personal");
  await expect(
    page.getByRole("link", { name: "Solicitar liberação ao suporte" }),
  ).toHaveAttribute("href", /^mailto:/);
  await expect(
    page.getByText(/Não há cobrança ou renovação automática/),
  ).toBeVisible();
  await context.close();
});

test("student reads inbox and admin can see feedback without a CREF requirement switch", async ({
  browser,
}) => {
  const student = await asRole(browser, "athlete", true);
  await student.page.goto("/");
  await student.page
    .getByRole("button", { name: /^Notificações, 1 não lidas$/ })
    .click();
  await expect(
    student.page.getByText("Aviso piloto E2E", { exact: true }),
  ).toBeVisible();
  const allRead = student.page.getByRole("button", {
    name: "Marcar todas como lidas",
  });
  await expect(allRead).toBeEnabled();
  await allRead.click();
  await expect(
    student.page.getByText("0 não lidas", { exact: true }),
  ).toBeVisible();
  const inbox = await student.context.request.get("/backend/notifications/");
  expect(inbox.ok()).toBe(true);
  expect(
    (await inbox.json()).notifications.find(
      (item: { title: string }) => item.title === "Aviso piloto E2E",
    ).readAt,
  ).not.toBeNull();
  await student.context.close();
  const admin = await asRole(browser, "admin");
  await admin.page.goto("/admin");
  await expect(
    admin.page.getByRole("switch", { name: "Exigir CREF verificado" }),
  ).toHaveCount(0);
  await expect(
    admin.page.getByRole("heading", { name: "Cadastro profissional" }),
  ).toBeVisible();
  await admin.page.goto("/admin/feedback");
  await expect(
    admin.page.getByText("Feedback fictício do piloto E2E", { exact: true }),
  ).toBeVisible();
  await admin.context.close();
});

test("invitation, approved prescription and student acceptance cross the real API with ownership", async ({
  browser,
}) => {
  const coach = await asRole(browser, "coach");
  const athlete = await asRole(browser, "athlete", true);
  const other = await asRole(browser, "other", true);
  const ids = fixtures().users;
  const invitationResponse = await coach.context.request.post(
    "/backend/coach/invitations",
    { data: { expiresInDays: 7 } },
  );
  expect(invitationResponse.status()).toBe(201);
  const invitation = await invitationResponse.json();
  await other.page.goto(`/convite/${invitation.token}`);
  await other.page
    .getByRole("button", { name: "Aceitar Convite de Treinador" })
    .click();
  await expect(
    other.page.getByText("Vínculo Estabelecido!", { exact: true }),
  ).toBeVisible();

  const response = await coach.context.request.post(
    "/backend/coach/prescriptions",
    {
      data: {
        athleteId: ids.athlete.id,
        name: "Ficha piloto E2E",
        notes: null,
        workoutDays: [
          {
            name: "Treino piloto",
            order: 0,
            weekDay: "MONDAY",
            isRest: false,
            estimatedDurationInSeconds: 1200,
            exercises: [
              {
                name: "Exercício piloto E2E",
                order: 0,
                sets: 1,
                warmupSets: 0,
                reps: 10,
                restTimeInSeconds: 60,
              },
            ],
          },
        ],
      },
    },
  );
  expect(response.status()).toBe(201);
  const draft = await response.json();
  const sent = await coach.context.request.post(
    `/backend/coach/prescriptions/${draft.id}/send`,
    { data: { version: draft.version, approval: true } },
  );
  expect(sent.status()).toBe(200);
  const foreign = await other.context.request.get(
    `/backend/coach/prescriptions/${draft.id}`,
  );
  expect([403, 404]).toContain(foreign.status());
  await athlete.page.goto("/planning");
  await expect(
    athlete.page.getByText("Ficha piloto E2E", { exact: true }),
  ).toBeVisible();
  await athlete.page
    .getByRole("button", { name: "Aceitar Prescrição", exact: true })
    .click();
  await expect(
    athlete.page.getByText("Prescrição aceita com sucesso!", { exact: true }),
  ).toBeVisible();
  const overview = await athlete.context.request.get(
    "/backend/planning/overview",
  );
  expect(overview.ok()).toBe(true);
  expect(
    (await overview.json()).plans.some(
      (plan: { name: string }) => plan.name === "Ficha piloto E2E",
    ),
  ).toBe(true);
  const basic = await asRole(browser, "basic");
  const blocked = await basic.context.request.post(
    "/backend/coach/prescriptions/ai-generate",
    { data: { athleteId: ids.athlete.id, prompt: "Criar ficha de teste" } },
  );
  expect(blocked.status()).toBe(403);
  expect((await blocked.json()).code).toBe("AI_ENTITLEMENT_REQUIRED");
  await Promise.all([
    coach.context.close(),
    athlete.context.close(),
    other.context.close(),
    basic.context.close(),
  ]);
});

test("admin independently controls AI offers and access for professionals and students", async ({
  browser,
}) => {
  test.setTimeout(180000);
  const admin = await asRole(browser, "admin");
  const coach = await asRole(browser, "coach");
  const student = await asRole(browser, "athlete", true);
  const guest = await browser.newContext({ baseURL });
  const landing = await guest.newPage();
  try {
    for (const [professional, athlete] of [
      [false, false],
      [true, false],
      [false, true],
      [true, true],
    ]) {
      await admin.page.goto("/admin");
      const professionalSwitch = admin.page.getByRole("switch", {
        name: "IA para profissionais",
      });
      const athleteSwitch = admin.page.getByRole("switch", {
        name: "IA para alunos",
      });
      if (
        ((await professionalSwitch.getAttribute("aria-checked")) === "true") !==
        professional
      )
        await professionalSwitch.click();
      if (
        ((await athleteSwitch.getAttribute("aria-checked")) === "true") !==
        athlete
      )
        await athleteSwitch.click();
      await admin.page
        .getByRole("button", { name: "Salvar disponibilidade da IA" })
        .click();
      await expect(
        admin.page.getByText("Configuração salva.", { exact: true }),
      ).toBeVisible({ timeout: 15000 });
      const policy = await admin.context.request.get("/backend/features/ai");
      expect(await policy.json()).toEqual({
        professionalAiEnabled: professional,
        athleteAiEnabled: athlete,
      });
      await landing.goto("/");
      if (athlete)
        await expect(
          landing.getByRole("heading", { name: /Inteligência no plano/ }),
        ).toBeVisible();
      else if (professional)
        await expect(
          landing.getByRole("heading", { name: "IA para quem prescreve." }),
        ).toBeVisible();
      else {
        await expect(
          landing.getByRole("heading", {
            name: "Seu planejamento. Suas escolhas.",
          }),
        ).toBeVisible();
        await expect(
          landing.getByText("COACH AI", { exact: true }),
        ).toHaveCount(0);
      }
      await student.page.goto("/");
      if (athlete)
        await expect(
          student.page.getByRole("button", { name: "Coach", exact: true }),
        ).toBeVisible();
      else {
        await expect(
          student.page.getByRole("button", { name: "Coach", exact: true }),
        ).toHaveCount(0);
        const blocked = await student.context.request.post("/backend/ai/", {
          data: {
            messages: [
              {
                id: "flag-test",
                role: "user",
                parts: [{ type: "text", text: "Teste de bloqueio" }],
              },
            ],
          },
        });
        expect(blocked.status()).toBe(503);
        expect((await blocked.json()).code).toBe("AI_DISABLED");
      }
      await coach.page.goto(
        `/personal/alunos/${fixtures().users.athlete.id}/prescrever`,
      );
      if (professional)
        await expect(
          coach.page.getByRole("button", {
            name: "Prescrever com IA",
            exact: true,
          }),
        ).toBeVisible();
      else {
        await expect(
          coach.page.getByRole("button", {
            name: "Prescrever com IA",
            exact: true,
          }),
        ).toHaveCount(0);
        const blocked = await coach.context.request.post(
          "/backend/coach/prescriptions/ai-generate",
          {
            data: {
              athleteId: fixtures().users.athlete.id,
              prompt: "Teste de bloqueio",
            },
          },
        );
        expect(blocked.status()).toBe(503);
        expect((await blocked.json()).code).toBe("AI_DISABLED");
      }
      const plans = await guest.request.get(
        "/backend/commercial/plans?audience=COACH",
      );
      if (!professional)
        expect(
          (await plans.json()).every(
            (plan: { entitlements: { entitlement: string }[] }) =>
              plan.entitlements.every(
                (permission) =>
                  !["AI_CHAT", "AI_PLAN_GENERATION"].includes(
                    permission.entitlement,
                  ),
              ),
          ),
        ).toBe(true);
    }
  } finally {
    await Promise.all([
      admin.context.close(),
      coach.context.close(),
      student.context.close(),
      guest.close(),
    ]);
  }
});
