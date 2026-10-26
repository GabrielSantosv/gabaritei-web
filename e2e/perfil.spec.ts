import { expect, test } from "@playwright/test";

async function entrar(page: import("@playwright/test").Page) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("aluno@teste.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/inicio");
}

test.describe("Perfil", () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page);
    await page.goto("/perfil");
  });

  test("mostra identidade, números e permite sair", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Perfil", level: 1 })).toBeVisible();
    await expect(page.getByText("aluno@teste.com")).toBeVisible();
    await expect(page.getByText(/Conta criada em/)).toBeVisible();

    await page.locator("#conteudo").getByRole("button", { name: "Sair" }).click();
    await page.waitForURL("**/entrar");
  });

  test("tabela de proficiência tem caption e cabeçalhos", async ({ page }) => {
    const tabela = page.getByRole("table");
    await expect(tabela).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Área" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Proficiência" })).toBeVisible();
  });

  test("tema, paleta, movimento e tamanho do texto viraram um link para Configurações", async ({ page }) => {
    await expect(page.getByRole("radio", { name: "Escuro" })).toHaveCount(0);
    await page.locator("#conteudo").getByRole("link", { name: "Configurações" }).click();
    await page.waitForURL("**/configuracoes");
  });

  test("preferências salvam sozinhas, sem botão global de salvar", async ({ page }) => {
    await expect(page.getByRole("button", { name: /^Salvar$/ })).toHaveCount(0);

    const switchFiguras = page.getByRole("switch", { name: "Abrir descrição das figuras por padrão" });
    const estadoInicial = await switchFiguras.getAttribute("aria-checked");
    await switchFiguras.click();
    await expect(switchFiguras).toHaveAttribute("aria-checked", estadoInicial === "true" ? "false" : "true");
  });

  test("meta semanal aceita novo valor e mostra confirmação de salvo", async ({ page }) => {
    const campo = page.getByRole("spinbutton", { name: "Meta semanal de questões" });
    await campo.fill("25");
    await campo.blur();
    await expect(page.getByText("Salvo").last()).toBeVisible();
  });
});
