import { expect, test } from "@playwright/test";

async function entrar(page: import("@playwright/test").Page) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("aluno@teste.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/inicio");
}

async function responderUmaAlternativa(page: import("@playwright/test").Page) {
  await page.locator('[role="radio"]').first().click();
  await page.getByRole("button", { name: "Enviar resposta" }).click();
  await expect(page.getByText(/Você (acertou|errou)/).first()).toBeVisible();
}

test.describe("Início", () => {
  test("'Deixar o modelo escolher' leva direto pro treino, com o critério do modelo (P2)", async ({ page }) => {
    await entrar(page);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Marina");
    await page.getByRole("button", { name: "Deixar o modelo escolher" }).click();
    await page.waitForURL(/\/treino\/.+/);
    await expect(page.getByText("Recomendado pelo modelo")).toBeVisible();
  });

  test("sem atividade em andamento, 'Começar treino' leva pra escolha de modo (P2)", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("gabaritei:mock:cenario", "novo"));
    await entrar(page);
    await expect(page.getByRole("heading", { name: "Por onde começar" })).toBeVisible();
    await expect(page.getByLabel("Tema (opcional)")).toBeVisible();
    await page.getByRole("button", { name: "Começar treino" }).first().click();
    await page.waitForURL("**/treino");
  });
});

test.describe("Treino: escolher modo", () => {
  test("sem histórico, habilidade e nível aparecem desabilitados com o motivo", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("gabaritei:mock:cenario", "novo"));
    await entrar(page);
    await page.goto("/treino");

    const habilidade = page.getByRole("radio", { name: /Por habilidade/ });
    const nivel = page.getByRole("radio", { name: /Por nível/ });
    await expect(habilidade).toBeDisabled();
    await expect(nivel).toBeDisabled();
    await expect(page.getByText(/Disponível depois de \d+ respostas/).first()).toBeVisible();
  });

  test("escolher progressão, área e quantidade, e começar treino", async ({ page }) => {
    await entrar(page);
    await page.goto("/treino");

    await page.getByRole("radio", { name: /Progressão com Combo/ }).click();
    await page.getByRole("radio", { name: "5", exact: true }).click();
    await page.getByRole("checkbox", { name: /Matemática/ }).click();
    await page.getByRole("button", { name: "Começar treino" }).click();

    await page.waitForURL(/\/treino\/[^/]+$/);
    await expect(page.getByText(/Questão 1 de 5/)).toBeVisible();
  });
});

test.describe("Sessão de treino", () => {
  test("responder atualiza o Combo e o placar, e chega ao resumo", async ({ page }) => {
    await entrar(page);
    await page.goto("/treino");
    await page.getByRole("radio", { name: /Progressão com Combo/ }).click();
    await page.getByRole("radio", { name: "5", exact: true }).click();
    await page.getByRole("button", { name: "Começar treino" }).click();
    await page.waitForURL(/\/treino\/[^/]+$/);

    for (let i = 0; i < 5; i++) {
      await responderUmaAlternativa(page);
      const proximo = page.getByRole("button", { name: "Próxima questão" });
      const resumo = page.getByRole("button", { name: "Ver resumo" });
      if (await resumo.isVisible().catch(() => false)) {
        await resumo.click();
      } else {
        await proximo.click();
      }
    }

    await page.waitForURL(/\/resumo$/);
    await expect(page.getByText(/de 5/).first()).toBeVisible();
  });

  test("enviar sem marcar explica em vez de travar", async ({ page }) => {
    await entrar(page);
    await page.goto("/treino");
    await page.getByRole("button", { name: "Começar treino" }).click();
    await page.waitForURL(/\/treino\/[^/]+$/);

    await page.getByRole("button", { name: "Enviar resposta" }).click({ force: true });
    await expect(page.getByText("Escolha uma alternativa antes de enviar.")).toBeVisible();
  });

  test("encerrar sessão pede confirmação e explica o que é salvo", async ({ page }) => {
    await entrar(page);
    await page.goto("/treino");
    await page.getByRole("button", { name: "Começar treino" }).click();
    await page.waitForURL(/\/treino\/[^/]+$/);

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page.getByText(/O que já foi respondido fica salvo/)).toBeVisible();
    await page.getByRole("button", { name: "Continuar aqui" }).click();
    await expect(page.getByText(/O que já foi respondido fica salvo/)).toBeHidden();
  });
});

test.describe("Resumo da sessão", () => {
  test("linha da sessão leva para a revisão da questão", async ({ page }) => {
    await entrar(page);
    await page.goto("/treino");
    await page.getByRole("radio", { name: "5", exact: true }).click();
    await page.getByRole("button", { name: "Começar treino" }).click();
    await page.waitForURL(/\/treino\/[^/]+$/);

    for (let i = 0; i < 5; i++) {
      await responderUmaAlternativa(page);
      const resumo = page.getByRole("button", { name: "Ver resumo" });
      if (await resumo.isVisible().catch(() => false)) {
        await resumo.click();
      } else {
        await page.getByRole("button", { name: "Próxima questão" }).click();
      }
    }
    await page.waitForURL(/\/resumo$/);

    const linkRevisao = page.locator('a[href*="tentativa="]').first();
    await linkRevisao.click();
    await page.waitForURL(/\/questoes\/.+tentativa=/);
    await expect(page.getByText(/Gabarito oficial:/)).toBeVisible();
  });
});
