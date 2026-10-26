import { expect, test } from "@playwright/test";

/**
 * Zero erro e zero aviso de console (seção 11) em toda rota, nos cenários normais do
 * mock. Cresce junto com `acessibilidade.a11y.spec.ts` — mesma lista de rotas.
 *
 * Fora do escopo de propósito: os cenários "erro" (30% das chamadas falham, de
 * propósito) e "sem-permissao" (toda chamada volta 401/403, de propósito) — os dois
 * *deveriam* gerar aviso/erro, então não fazem sentido numa checagem de "console
 * limpo". "lento" entra (só muda a latência, não deveria sujar o console).
 */
const CENARIOS = ["novo", "ativo", "parcial", "esgotado", "lento"] as const;

const ROTAS_PUBLICAS = ["/entrar", "/cadastrar", "/termos", "/privacidade", "/dev/componentes"];
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
];

interface MensagemConsole {
  tipo: string;
  texto: string;
}

function anexarColeta(page: import("@playwright/test").Page, mensagens: MensagemConsole[]) {
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      mensagens.push({ tipo: msg.type(), texto: msg.text() });
    }
  });
  page.on("pageerror", (erro) => {
    mensagens.push({ tipo: "pageerror", texto: erro.message });
  });
}

function formatarFalhas(mensagens: MensagemConsole[]): string {
  return mensagens.map((m) => `[${m.tipo}] ${m.texto}`).join("\n\n");
}

test.describe("Console limpo — rotas públicas", () => {
  for (const rota of ROTAS_PUBLICAS) {
    test(`${rota} sem erro nem aviso de console`, async ({ page }) => {
      const mensagens: MensagemConsole[] = [];
      anexarColeta(page, mensagens);

      await page.goto(rota);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1100); // mesma folga do axe, pela entrada do cartão-resposta

      expect(mensagens, formatarFalhas(mensagens)).toEqual([]);
    });
  }
});

async function entrarComCenario(page: import("@playwright/test").Page, cenario: string) {
  await page.addInitScript((c) => {
    window.localStorage.setItem("gabaritei:mock:cenario", c);
  }, cenario);
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("aluno@teste.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/inicio", { timeout: 15000 });
}

test.describe("Console limpo — rotas autenticadas, por cenário", () => {
  for (const cenario of CENARIOS) {
    for (const rota of ROTAS_AUTENTICADAS) {
      test(`${rota} [cenário ${cenario}] sem erro nem aviso de console`, async ({ page }) => {
        const mensagens: MensagemConsole[] = [];
        anexarColeta(page, mensagens);

        await entrarComCenario(page, cenario);
        mensagens.length = 0; // a entrada em si já foi coberta no describe acima

        await page.goto(rota);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1100);

        expect(mensagens, formatarFalhas(mensagens)).toEqual([]);
      });
    }
  }
});

test.describe("Console limpo — fluxos dinâmicos", () => {
  test("sessão de treino inteira, do início ao resumo", async ({ page }) => {
    const mensagens: MensagemConsole[] = [];
    anexarColeta(page, mensagens);

    await entrarComCenario(page, "ativo");
    mensagens.length = 0;

    await page.goto("/treino");
    await page.getByRole("radio", { name: "5", exact: true }).click();
    await page.getByRole("button", { name: "Começar treino" }).click();
    await page.waitForURL(/\/treino\/[^/]+$/);
    await page.waitForLoadState("networkidle");

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

    expect(mensagens, formatarFalhas(mensagens)).toEqual([]);
  });

  test("simulado inteiro, do início à correção", async ({ page }) => {
    const mensagens: MensagemConsole[] = [];
    anexarColeta(page, mensagens);

    await entrarComCenario(page, "ativo");
    mensagens.length = 0;

    await page.goto("/simulados");
    await page.getByRole("button", { name: "Iniciar simulado" }).click();
    await page.waitForURL(/\/simulados\/[^/]+$/);
    await page.waitForLoadState("networkidle");

    await page.getByRole("radio", { name: "Alternativa A" }).click();
    await expect(page.getByText("Salvo")).toBeVisible();
    await page.getByRole("button", { name: "Finalizar" }).click();
    await page.getByRole("button", { name: "Finalizar e ver resultado" }).click();
    await page.waitForURL(/\/resultado$/);
    await page.waitForLoadState("networkidle");

    await page.locator('a[href*="/questao/1"]').first().click();
    await page.waitForURL(/\/questao\/1$/);
    await expect(page.getByText(/Gabarito oficial:/)).toBeVisible({ timeout: 10000 });

    expect(mensagens, formatarFalhas(mensagens)).toEqual([]);
  });
});
