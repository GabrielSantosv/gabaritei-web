import { expect, test, type Page } from "@playwright/test";

async function entrarComCenario(page: Page, cenario: string) {
  await page.addInitScript((c) => window.localStorage.setItem("gabaritei:mock:cenario", c), cenario);
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("aluno@teste.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/inicio");
}

test.describe("Início novo", () => {
  test("os blocos antigos não aparecem mais", async ({ page }) => {
    await entrarComCenario(page, "ativo");
    await expect(page.getByText("Seus números")).toHaveCount(0);
    await expect(page.getByText("Continue de onde parou")).toHaveCount(0);
    await expect(page.getByText("Reforço prioritário")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Semana" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Por onde começar" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Deixar o modelo escolher" })).toHaveCount(1);
  });

  test("clicar em cada aba de 'O que cada aba faz' leva pra rota certa", async ({ page }) => {
    await entrarComCenario(page, "ativo");
    const abas: [string, string][] = [
      ["Treino", "/treino"],
      ["Questões", "/questoes"],
      ["Simulados", "/simulados"],
      ["Histórico", "/historico"],
      ["Desempenho", "/desempenho"],
    ];
    for (const [nome, rota] of abas) {
      await page.goto("/inicio");
      // Espaço depois do nome: distingue da aba homônima da barra lateral, cujo
      // nome acessível é só "Treino" (sem a descrição que segue, aqui).
      await page.getByRole("link", { name: new RegExp(`^${nome} `) }).click();
      await page.waitForURL(`**${rota}**`);
    }
  });

  test("cenário novo: 'Primeiro passo' e 'Dados insuficientes', sem selo do Foguinho", async ({ page }) => {
    await entrarComCenario(page, "novo");
    await expect(page.getByText("Primeiro passo")).toBeVisible();
    await expect(page.getByText("Comece o seu primeiro treino.")).toBeVisible();
    await expect(page.getByText("Dados insuficientes")).toBeVisible();
    await expect(page.getByText(/Faltam \d+ respostas/)).toBeVisible();
    // Sequência zerada: nenhum selo do Foguinho (sem cobrança).
    await expect(page.getByText(/^Foguinho:/)).toHaveCount(0);

    await page.getByRole("button", { name: "Começar treino" }).click();
    await page.waitForURL("**/treino");
  });

  test("cenário ativo: cartão 1 em andamento, botão 'Retomar' leva pra sessão existente", async ({ page }) => {
    await entrarComCenario(page, "ativo");
    await expect(page.getByText(/em andamento$/).first()).toBeVisible();
    const retomar = page.getByRole("link", { name: /^Retomar (treino|simulado|lista|diagnóstico)$/ });
    await expect(retomar).toBeVisible();
    const href = await retomar.getAttribute("href");
    await retomar.click();
    await page.waitForURL(`**${href}`);
  });

  test.describe("cenários sem assunção de conteúdo específico (a tela não trava e cada cartão carrega/falha sozinho)", () => {
    for (const cenario of ["parcial", "esgotado", "lento", "erro"]) {
      test(`cenário ${cenario}: 'Seu próximo passo' chega a um estado final (sem skeleton parado)`, async ({ page }) => {
        await entrarComCenario(page, cenario);
        await expect(page.getByRole("heading", { name: "Seu próximo passo" })).toBeVisible();
        // "lento" demora ~4s por chamada: espera o suficiente pra sair do esqueleto.
        await page
          .getByText(/em andamento$|^Sem atividade em andamento$|^Primeiro passo$|Algo deu errado/)
          .first()
          .waitFor({ timeout: 10000 });
      });
    }
  });
});
