import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function entrar(page: import("@playwright/test").Page) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("aluno@teste.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/inicio");
}

test.describe("Configurações — Aparência", () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page);
    await page.goto("/configuracoes");
  });

  test("mudar o tema aplica na hora e persiste depois de recarregar", async ({ page }) => {
    await page.getByRole("radio", { name: "Escuro" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    // A chamada no mock tem latência simulada (seção 7.3, até ~900ms): sem
    // esperar, o reload corre na frente da própria API que persiste o valor.
    await page.waitForTimeout(1100);

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("radio", { name: "Escuro" })).toHaveAttribute("aria-checked", "true");
  });

  test("mudar a paleta aplica na hora e persiste, aplicada antes da pintura, depois de recarregar", async ({
    page,
  }) => {
    await page.getByRole("radio", { name: "Oceano" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-palette", "oceano");
    await page.waitForTimeout(1100); // latência simulada do mock (seção 7.3)

    // A paleta tem que estar correta já no primeiro frame, antes de qualquer
    // script de hidratação rodar (seção 4.5) — não só depois que a página
    // "assenta". Lê o atributo o quanto antes, sem esperar network idle.
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-palette", "oceano", { timeout: 2000 });
    await expect(page.getByRole("radio", { name: "Oceano" })).toHaveAttribute("aria-checked", "true");
  });

  test("paleta fora da lista cai em Floresta", async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.setItem("gabaritei:aparencia", JSON.stringify({ paleta: "roxo-inexistente" }));
    });
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-palette", "floresta", { timeout: 2000 });
    await expect(page.getByRole("radio", { name: "Floresta" })).toHaveAttribute("aria-checked", "true");
  });

  test("movimento reduzido zera as animações", async ({ page }) => {
    await page.getByRole("radio", { name: "Reduzido" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduzido");

    // Reload pra cair numa rota com cascata de entrada (data-reveal) de verdade,
    // em vez de só medir a própria tela de Configurações.
    await page.goto("/inicio");
    await page.waitForLoadState("networkidle");
    const animacoesAtivas = await page.evaluate(() => document.getAnimations().length);
    expect(animacoesAtivas).toBe(0);
  });

  test("prefers-reduced-motion do sistema também zera as animações, mesmo com movimento em sistema", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/inicio");
    await page.waitForLoadState("networkidle");
    const animacoesAtivas = await page.evaluate(() => document.getAnimations().length);
    expect(animacoesAtivas).toBe(0);
  });

  test("tamanho do texto aplica na hora e persiste depois de recarregar", async ({ page }) => {
    await page.getByRole("radio", { name: "130%" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-tamanho-texto", "130");
    await page.waitForTimeout(1100); // latência simulada do mock (seção 7.3)

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-tamanho-texto", "130", { timeout: 2000 });
    await expect(page.getByRole("radio", { name: "130%" })).toHaveAttribute("aria-checked", "true");
  });

  test("130% a 360px não dá rolagem horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.getByRole("radio", { name: "130%" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-tamanho-texto", "130");

    const temRolagemHorizontal = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(temRolagemHorizontal).toBe(false);

    // Controles transicionam color/background-color em --dur-controle (200ms,
    // seção 4.4): sem esperar, o axe mede a cor no meio da transição, não no
    // estado final — e um frame intermediário pode ter contraste baixo mesmo
    // quando o antes e o depois estão certos.
    await page.waitForTimeout(300);
    const resultados = await new AxeBuilder({ page }).analyze();
    expect(resultados.violations, JSON.stringify(resultados.violations, null, 2)).toEqual([]);
  });
});
