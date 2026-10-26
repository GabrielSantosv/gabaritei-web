import { expect, test } from "@playwright/test";

test("raiz sem sessão redireciona para /entrar", async ({ page }) => {
  await page.goto("/");
  await page.waitForURL("**/entrar");
  expect(page.url()).toContain("/entrar");
});

test("rota inexistente mostra a página de não encontrada", async ({ page }) => {
  const resposta = await page.goto("/esta-rota-nao-existe");
  expect(resposta?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Não achamos essa página." })).toBeVisible();
});

test("galeria de componentes carrega em desenvolvimento", async ({ page }) => {
  await page.goto("/dev/componentes");
  await expect(page.getByRole("heading", { name: "Galeria de componentes" })).toBeVisible();
});
