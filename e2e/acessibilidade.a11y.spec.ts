import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * @a11y — axe em toda rota pública, nos dois temas (seção 11). Cresce a cada
 * etapa que adiciona telas novas; rotas que exigem sessão entram quando a
 * tela correspondente existir (ex.: /perfil na Etapa 5).
 */
const ROTAS = ["/entrar", "/cadastrar", "/termos", "/privacidade", "/dev/componentes"];

/** Cache único de aparência (docs/FRONTEND_PARIDADE.md, 4.5) — era
 *  "gabaritei:tema" antes da P1; os testes escrevem direto no formato novo pra
 *  continuar controlando tema/paleta antes da primeira pintura. */
async function definirAparencia(page: Page, aparencia: { tema?: "claro" | "escuro"; paleta?: string }) {
  await page.addInitScript((a) => {
    window.localStorage.setItem("gabaritei:aparencia", JSON.stringify(a));
  }, aparencia);
}

async function checarRota(page: Page, rota: string) {
  await page.goto(rota);
  await page.waitForLoadState("networkidle");
  // Deixa a entrada escalonada das bolhas do cartão-resposta terminar
  // (até ~900ms, seção 6) antes de medir contraste — senão o axe pode
  // flagar um quadro intermediário da transição de opacidade.
  await page.waitForTimeout(1100);

  const resultados = await new AxeBuilder({ page }).analyze();
  expect(resultados.violations, JSON.stringify(resultados.violations, null, 2)).toEqual([]);
}

async function entrar(page: Page, cenario?: string) {
  if (cenario) {
    await page.addInitScript((c) => {
      window.localStorage.setItem("gabaritei:mock:cenario", c);
    }, cenario);
  }
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("aluno@teste.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/inicio", { timeout: 15000 });
}

test.describe("@a11y rotas públicas", () => {
  for (const rota of ROTAS) {
    for (const tema of ["claro", "escuro"] as const) {
      test(`${rota} sem violações no tema ${tema}`, async ({ page }) => {
        await definirAparencia(page, { tema });
        await checarRota(page, rota);
      });
    }
  }
});

const ROTAS_AUTENTICADAS = [
  "/inicio",
  "/questoes",
  "/questoes/demo-003",
  "/treino",
  "/simulados",
  "/historico",
  "/desempenho",
  "/desempenho/MT",
  "/perfil",
  "/configuracoes",
];

test.describe("@a11y rotas autenticadas", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const tema = testInfo.title.includes("escuro") ? "escuro" : "claro";
    await definirAparencia(page, { tema });
    await entrar(page);
  });

  for (const rota of ROTAS_AUTENTICADAS) {
    for (const tema of ["claro", "escuro"] as const) {
      test(`${rota} sem violações no tema ${tema}`, async ({ page }) => {
        await checarRota(page, rota);
      });
    }
  }
});

// Cenário "ativo" já é o padrão do bloco acima (sem cenario explícito). "novo" e
// "parcial" entram aqui, num tema só (claro): tema e cenário são dimensões
// praticamente independentes pro que o axe mede (estrutura/contraste, não
// depende da forma dos dados), então cruzar as duas por completo só duplicaria
// tempo de CI sem achar mais nada.
test.describe("@a11y rotas autenticadas, por cenário", () => {
  for (const cenario of ["novo", "parcial"] as const) {
    test.describe(`cenário ${cenario}`, () => {
      test.beforeEach(async ({ page }) => {
        await definirAparencia(page, { tema: "claro" });
        await entrar(page, cenario);
      });

      for (const rota of ROTAS_AUTENTICADAS) {
        test(`${rota} sem violações`, async ({ page }) => {
          await checarRota(page, rota);
        });
      }
    });
  }
});

test.describe("@a11y sessão de treino (rotas dinâmicas)", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const tema = testInfo.title.includes("escuro") ? "escuro" : "claro";
    await definirAparencia(page, { tema });
    await entrar(page);

    await page.goto("/treino");
    await page.getByRole("radio", { name: "5", exact: true }).click();
    await page.getByRole("button", { name: "Começar treino" }).click();
    await page.waitForURL(/\/treino\/[^/]+$/);
  });

  for (const tema of ["claro", "escuro"] as const) {
    test(`/treino/[sessaoId] sem violações no tema ${tema}`, async ({ page }) => {
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(300);
      const resultados = await new AxeBuilder({ page }).analyze();
      expect(resultados.violations, JSON.stringify(resultados.violations, null, 2)).toEqual([]);
    });

    test(`/treino/[sessaoId]/resumo sem violações no tema ${tema}`, async ({ page }) => {
      for (let i = 0; i < 5; i++) {
        await page.locator('[role="radio"]').first().click();
        await page.getByRole("button", { name: "Enviar resposta" }).click();
        await expect(page.getByText(/Você (acertou|errou)/).first()).toBeVisible();
        const resumo = page.getByRole("button", { name: "Ver resumo" });
        if (await resumo.isVisible().catch(() => false)) {
          await resumo.click();
        } else {
          await page.getByRole("button", { name: "Próxima questão" }).click();
        }
      }
      await page.waitForURL(/\/resumo$/);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(300);

      const resultados = await new AxeBuilder({ page }).analyze();
      expect(resultados.violations, JSON.stringify(resultados.violations, null, 2)).toEqual([]);
    });
  }
});

test.describe("@a11y simulado (rotas dinâmicas)", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const tema = testInfo.title.includes("escuro") ? "escuro" : "claro";
    await definirAparencia(page, { tema });
    await entrar(page);

    await page.goto("/simulados");
    await page.getByRole("button", { name: "Iniciar simulado" }).click();
    await page.waitForURL(/\/simulados\/[^/]+$/);
  });

  for (const tema of ["claro", "escuro"] as const) {
    test(`/simulados/[id] sem violações no tema ${tema}`, async ({ page }) => {
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(300);
      const resultados = await new AxeBuilder({ page }).analyze();
      expect(resultados.violations, JSON.stringify(resultados.violations, null, 2)).toEqual([]);
    });

    test(`/simulados/[id]/resultado sem violações no tema ${tema}`, async ({ page }) => {
      await page.getByRole("radio", { name: "Alternativa A" }).click();
      await expect(page.getByText("Salvo")).toBeVisible();
      await page.getByRole("button", { name: "Finalizar" }).click();
      await page.getByRole("button", { name: "Finalizar e ver resultado" }).click();
      await page.waitForURL(/\/resultado$/);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1100);

      const resultados = await new AxeBuilder({ page }).analyze();
      expect(resultados.violations, JSON.stringify(resultados.violations, null, 2)).toEqual([]);
    });

    test(`/simulados/[id]/questao/[n] sem violações no tema ${tema}`, async ({ page }) => {
      await page.getByRole("radio", { name: "Alternativa A" }).click();
      await expect(page.getByText("Salvo")).toBeVisible();
      await page.getByRole("button", { name: "Finalizar" }).click();
      await page.getByRole("button", { name: "Finalizar e ver resultado" }).click();
      await page.waitForURL(/\/resultado$/);

      await page.locator('a[href*="/questao/1"]').first().click();
      await page.waitForURL(/\/questao\/1$/);
      // 3 consultas encadeadas (resultado → questão → tentativa), cada uma com
      // até ~900ms de latência simulada (seção 7.3): esperar texto de verdade
      // em vez de um tempo fixo, senão o axe pode pegar o estado de Skeleton
      // (sem h1) sob carga.
      await expect(page.getByText(/Gabarito oficial:/)).toBeVisible({ timeout: 10000 });
      await page.waitForLoadState("networkidle");

      const resultados = await new AxeBuilder({ page }).analyze();
      expect(resultados.violations, JSON.stringify(resultados.violations, null, 2)).toEqual([]);
    });
  }
});

// Matriz de paletas (seção 7): Floresta já roda em todas as rotas acima, nos dois
// temas. Oceano/Terracota/Brasa/Sol entram só nas rotas que a seção 7 pede.
const PALETAS_MATRIZ = ["oceano", "terracota", "brasa", "sol"] as const;
const ROTAS_MATRIZ_PALETAS = ["/inicio", "/perfil", "/configuracoes", "/questoes"];

test.describe("@a11y matriz de paletas", () => {
  for (const paleta of PALETAS_MATRIZ) {
    for (const tema of ["claro", "escuro"] as const) {
      test.describe(`${paleta}, tema ${tema}`, () => {
        test.beforeEach(async ({ page }) => {
          await definirAparencia(page, { tema, paleta });
          await entrar(page);
        });

        for (const rota of ROTAS_MATRIZ_PALETAS) {
          test(`${rota} sem violações`, async ({ page }) => {
            await checarRota(page, rota);
          });
        }

        test("questão corrigida (acerto) sem violações", async ({ page }) => {
          await page.goto("/questoes/demo-001");
          // gabarito fixo (seed determinística do mock): B acerta, A erra.
          await page.getByRole("radio", { name: "Alternativa B" }).click();
          await page.getByRole("button", { name: "Enviar resposta" }).click();
          await expect(page.getByText(/Você acertou/)).toBeVisible();
          await page.waitForTimeout(300);
          const resultados = await new AxeBuilder({ page }).analyze();
          expect(resultados.violations, JSON.stringify(resultados.violations, null, 2)).toEqual([]);
        });

        test("questão corrigida (erro) sem violações", async ({ page }) => {
          await page.goto("/questoes/demo-001");
          await page.getByRole("radio", { name: "Alternativa A" }).click();
          await page.getByRole("button", { name: "Enviar resposta" }).click();
          await expect(page.getByText(/Você errou/)).toBeVisible();
          await page.waitForTimeout(300);
          const resultados = await new AxeBuilder({ page }).analyze();
          expect(resultados.violations, JSON.stringify(resultados.violations, null, 2)).toEqual([]);
        });

        test("resultado do simulado sem violações", async ({ page }) => {
          await page.goto("/simulados");
          await page.getByRole("button", { name: "Iniciar simulado" }).click();
          await page.waitForURL(/\/simulados\/[^/]+$/);
          await page.getByRole("radio", { name: "Alternativa A" }).click();
          await expect(page.getByText("Salvo")).toBeVisible();
          await page.getByRole("button", { name: "Finalizar" }).click();
          await page.getByRole("button", { name: "Finalizar e ver resultado" }).click();
          await page.waitForURL(/\/resultado$/);
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(1100);
          const resultados = await new AxeBuilder({ page }).analyze();
          expect(resultados.violations, JSON.stringify(resultados.violations, null, 2)).toEqual([]);
        });
      });
    }
  }
});
