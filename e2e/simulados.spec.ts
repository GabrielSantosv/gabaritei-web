import { expect, test } from "@playwright/test";

async function entrar(page: import("@playwright/test").Page) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("aluno@teste.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/inicio");
}

/** Cria um simulado personalizado de 10 questões de Matemática (configuração padrão da tela) e entra nele. */
async function criarSimulado(page: import("@playwright/test").Page) {
  await page.goto("/simulados");
  await page.getByRole("button", { name: "Iniciar simulado" }).click();
  await page.waitForURL(/\/simulados\/[^/]+$/);
}

test.describe("Montar e listar simulados", () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page);
  });

  test("monta um simulado personalizado e entra na tela de resolução", async ({ page }) => {
    await criarSimulado(page);
    await expect(page.getByText("Questão 1 de 10")).toBeVisible();
  });

  test("simulado em andamento aparece na lista com link para continuar", async ({ page }) => {
    await criarSimulado(page);
    await page.goto("/simulados");
    await expect(page.getByText(/Simulado em andamento:/)).toBeVisible();
    await page.getByRole("link", { name: "Continuar" }).click();
    await page.waitForURL(/\/simulados\/[^/]+$/);
  });
});

test.describe("Resolver simulado (tela 10)", () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page);
  });

  test("escolher resposta salva sem botão enviar nem correção na hora", async ({ page }) => {
    await criarSimulado(page);
    await expect(page.getByRole("button", { name: "Enviar resposta" })).toHaveCount(0);

    await page.getByRole("radio", { name: "Alternativa A" }).click();
    await expect(page.getByText("Salvo")).toBeVisible();
    await expect(page.getByText(/Você (acertou|errou)/)).toHaveCount(0);
  });

  test("marcar para revisar alterna o rótulo do botão", async ({ page }) => {
    await criarSimulado(page);
    const botao = page.getByRole("button", { name: "Marcar para revisar" });
    await botao.click();
    await expect(page.getByRole("button", { name: "Marcada para revisar", exact: true })).toBeVisible();
  });

  test("anterior/próxima navegam entre as questões", async ({ page }) => {
    await criarSimulado(page);
    await page.getByRole("button", { name: "Próxima" }).click();
    await expect(page.getByText("Questão 2 de 10")).toBeVisible();
    await page.getByRole("button", { name: "Anterior" }).click();
    await expect(page.getByText("Questão 1 de 10")).toBeVisible();
  });

  test("finalizar mostra resumo correto de respondidas/em branco/marcadas", async ({ page }) => {
    await criarSimulado(page);
    await page.getByRole("radio", { name: "Alternativa A" }).click();
    await expect(page.getByText("Salvo")).toBeVisible();

    await page.getByRole("button", { name: "Finalizar" }).click();
    await expect(page.getByText(/Você respondeu 1 de 10\./)).toBeVisible();
    await expect(page.getByText(/9 em branco/)).toBeVisible();
  });

  test("finalizar e ver resultado leva para a tela de resultado", async ({ page }) => {
    await criarSimulado(page);
    await page.getByRole("radio", { name: "Alternativa A" }).click();
    await expect(page.getByText("Salvo")).toBeVisible();

    await page.getByRole("button", { name: "Finalizar" }).click();
    await page.getByRole("button", { name: "Finalizar e ver resultado" }).click();
    await page.waitForURL(/\/simulados\/[^/]+\/resultado/);
    await expect(page.getByRole("heading", { name: "Resultado do simulado" })).toBeVisible();
  });
});

test.describe("Resultado e correção (telas 11 e 12)", () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page);
    await criarSimulado(page);
    await page.getByRole("radio", { name: "Alternativa A" }).click();
    await expect(page.getByText("Salvo")).toBeVisible();
    await page.getByRole("button", { name: "Finalizar" }).click();
    await page.getByRole("button", { name: "Finalizar e ver resultado" }).click();
    await page.waitForURL(/\/simulados\/[^/]+\/resultado/);
  });

  test("mostra estatísticas e o cartão-resposta com filtros", async ({ page }) => {
    await expect(page.getByRole("paragraph").filter({ hasText: "Em branco" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Todas" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Erradas" })).toBeVisible();
  });

  test("clicar numa questão do cartão leva à correção com navegação", async ({ page }) => {
    await page.locator('a[href*="/questao/1"]').first().click();
    await page.waitForURL(/\/questao\/1$/);
    await expect(page.getByText(/Você (acertou|errou)/)).toBeVisible();
    await expect(page.getByText(/Gabarito oficial:/)).toBeVisible();

    await page.getByRole("link", { name: "Próxima" }).click();
    await page.waitForURL(/\/questao\/2$/);
  });
});
