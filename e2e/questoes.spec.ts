import { expect, test } from "@playwright/test";

async function entrar(page: import("@playwright/test").Page) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("aluno@teste.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/inicio");
}

test.describe("Banco de questões", () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page);
  });

  test("lista questões e os filtros ficam na URL", async ({ page }) => {
    await page.goto("/questoes");
    await expect(page.getByText(/60 questões encontradas/)).toBeVisible();

    await page.getByRole("checkbox", { name: /Matemática/ }).click();
    await page.waitForURL(/areas=MT/);
    await expect(page.getByText(/questões encontradas/)).toBeVisible();

    // voltar do navegador tira o filtro
    await page.goBack();
    await page.waitForURL((url) => !url.search.includes("areas=MT"));
  });

  test("filtro sem resultado mostra como remover cada um", async ({ page }) => {
    await page.goto("/questoes?areas=LC&anos=2016&faixas=dificil");
    // pode haver 0 ou poucos resultados: se vazio, confere o estado vazio
    const vazio = page.getByText("Nenhuma questão com esses filtros.");
    if (await vazio.isVisible().catch(() => false)) {
      await expect(page.getByRole("button", { name: /Tirar filtro/ }).first()).toBeVisible();
    }
  });

  test("chip de filtro ativo remove o filtro ao clicar", async ({ page }) => {
    await page.goto("/questoes?areas=MT");
    const chip = page.getByRole("button", { name: "Tirar filtro: Matemática" });
    await expect(chip).toBeVisible();
    await chip.click();
    await page.waitForURL((url) => !url.search.includes("areas="));
  });

  test("linha inteira é clicável e leva para a questão", async ({ page }) => {
    await page.goto("/questoes?areas=MT");
    const primeiraLinha = page.locator("main ul li a").first();
    await primeiraLinha.click();
    await page.waitForURL(/\/questoes\/demo-/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });
});

test.describe("Resolver questão", () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page);
  });

  test("enviar sem marcar alternativa explica em vez de travar", async ({ page }) => {
    await page.goto("/questoes/demo-001");
    // aria-disabled (não disabled, de propósito — ver Envio.tsx) para o clique
    // disparar o aviso em vez de ficar cinza mudo; por isso force: true aqui.
    await page.getByRole("button", { name: "Enviar resposta" }).click({ force: true });
    await expect(page.getByText("Escolha uma alternativa antes de enviar.")).toBeVisible();
  });

  test("responder mostra a correção com gabarito", async ({ page }) => {
    await page.goto("/questoes/demo-001");
    await page.getByRole("radio", { name: "Alternativa A" }).click();
    await page.getByRole("button", { name: "Enviar resposta" }).click();

    await expect(page.getByText(/Você (acertou|errou)/)).toBeVisible();
    await expect(page.getByText(/Gabarito oficial:/)).toBeVisible();
  });

  test("metadado ausente aparece como não informado, nunca inventado", async ({ page }) => {
    // demo-003 não tem habilidade nem ano cadastrados (ver lib/api/mock/dados.ts)
    await page.goto("/questoes/demo-003");
    await expect(page.getByText(/não informad[oa]/).first()).toBeVisible();
  });

  test("anterior/próxima mantêm o contexto de filtro da lista", async ({ page }) => {
    await page.goto("/questoes?areas=MT");
    const primeiraLinha = page.locator("main ul li a").first();
    const href = await primeiraLinha.getAttribute("href");
    expect(href).toContain("de=questoes");
    expect(href).toContain("areas=MT");

    await primeiraLinha.click();
    await page.waitForURL(/\/questoes\/demo-/);

    const proxima = page.getByRole("link", { name: "Próxima" });
    if (await proxima.isVisible().catch(() => false)) {
      const hrefProxima = await proxima.getAttribute("href");
      expect(hrefProxima).toContain("areas=MT");
    }
  });
});
