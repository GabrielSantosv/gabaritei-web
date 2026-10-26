/**
 * Exporta capturas de tela de verdade (PNG) de **todas as rotas** do app — linha de
 * base "antes"/"depois" da paridade (prompt, seção 6, passo P1.1: "capturas 'antes'
 * de todas as rotas, cenário ativo, claro e escuro, 1280 e 360px").
 *
 * Uso:
 *   npx tsx scripts/capturar-telas.ts antes   # grava em e2e/capturas/antes/
 *   npx tsx scripts/capturar-telas.ts depois  # grava em e2e/capturas/depois/
 *   npx tsx scripts/capturar-telas.ts         # pasta padrão: e2e/capturas/depois/
 * Pré-requisito: servidor de dev rodando em http://localhost:3000.
 */
import { chromium, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const PASTA = process.argv[2] === "antes" ? "antes" : process.argv[2] === "depois" ? "depois" : "depois";
const SAIDA = join(__dirname, "..", "e2e", "capturas", PASTA);
const LARGURAS = [1280, 360] as const;
const TEMAS = ["claro", "escuro"] as const;

mkdirSync(SAIDA, { recursive: true });

async function entrar(page: Page, tema: string) {
  await page.addInitScript((t) => {
    window.localStorage.setItem("gabaritei:aparencia", JSON.stringify({ tema: t }));
    window.localStorage.setItem("gabaritei:mock:cenario", "ativo");
  }, tema);
  await page.goto(`${BASE_URL}/entrar`);
  await page.fill("#email", "aluno@teste.com");
  await page.fill("#senha", "senha123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/inicio/);
}

async function capturar(page: Page, nome: string, largura: number) {
  await page.setViewportSize({ width: largura, height: largura <= 400 ? 1000 : 900 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600); // acabou de redimensionar: deixa o layout assentar
  const caminho = join(SAIDA, `${nome}-${largura}.png`);
  await page.screenshot({ path: caminho, fullPage: true });
  console.log(`  ${caminho}`);
}

async function paraCadaLargura(page: Page, nome: string) {
  for (const largura of LARGURAS) {
    await capturar(page, nome, largura);
  }
}

const ROTAS_PUBLICAS = ["/entrar", "/cadastrar", "/termos", "/privacidade", "/dev/componentes"];
const ROTAS_AUTENTICADAS_SIMPLES = ["/inicio", "/questoes", "/questoes/demo-003", "/treino", "/simulados", "/perfil"];

async function capturarRotasPublicas(tema: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.addInitScript((t) => window.localStorage.setItem("gabaritei:aparencia", JSON.stringify({ tema: t })), tema);
  for (const rota of ROTAS_PUBLICAS) {
    await page.goto(`${BASE_URL}${rota}`);
    await paraCadaLargura(page, `${rota.replace(/\//g, "-").replace(/^-/, "") || "raiz"}-${tema}`);
  }
  await browser.close();
}

async function capturarRotasAutenticadasSimples(tema: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await entrar(page, tema);
  for (const rota of ROTAS_AUTENTICADAS_SIMPLES) {
    await page.goto(`${BASE_URL}${rota}`);
    await paraCadaLargura(page, `${rota.replace(/\//g, "-").replace(/^-/, "")}-${tema}`);
  }
  await browser.close();
}

async function capturarFluxoTreino(tema: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await entrar(page, tema);

  await page.goto(`${BASE_URL}/treino`);
  await page.getByRole("radio", { name: "5", exact: true }).click();
  await page.click('button:has-text("Começar treino")');
  await page.waitForURL(/\/treino\/[^/]+$/);
  await page.waitForSelector('[role="radio"]', { timeout: 15000 });
  await paraCadaLargura(page, `treino-sessao-${tema}`);

  for (let i = 0; i < 5; i += 1) {
    const radio = await page.$('[role="radio"]');
    if (!radio) break;
    await radio.click();
    await page.click('button:has-text("Enviar resposta")');
    await page.waitForSelector('button:has-text("Próxima questão"), button:has-text("Ver resumo")', { timeout: 15000 });
    const verResumo = await page.$('button:has-text("Ver resumo")');
    if (verResumo) await verResumo.click();
    else await page.click('button:has-text("Próxima questão")');
    await page.waitForTimeout(300);
    if (page.url().includes("/resumo")) break;
  }
  await page.waitForURL(/\/resumo$/, { timeout: 20000 });
  // networkidle não é confiável aqui: o mock não usa fetch/XHR de verdade, só
  // setTimeout (seção 7.3) — espera texto que só aparece depois do resumo
  // carregar, senão a captura pode pegar o esqueleto de carregamento.
  await page.getByText("Foguinho").waitFor({ timeout: 10000 });
  await paraCadaLargura(page, `treino-resumo-${tema}`);

  await browser.close();
}

async function capturarFluxoSimulado(tema: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await entrar(page, tema);

  await page.goto(`${BASE_URL}/simulados`);
  await page.click('button:has-text("Iniciar simulado")');
  await page.waitForURL(/\/simulados\/[^/]+$/);
  await page.waitForSelector('[role="radio"]', { timeout: 15000 });
  await paraCadaLargura(page, `simulado-resolucao-${tema}`);

  await page.getByRole("radio", { name: "Alternativa A" }).click();
  await page.getByText("Salvo").waitFor();
  await page.click('button:has-text("Finalizar")');
  await page.click('button:has-text("Finalizar e ver resultado")');
  await page.waitForURL(/\/resultado$/);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1100); // entrada escalonada do cartão-resposta
  await paraCadaLargura(page, `simulado-resultado-${tema}`);

  await page.locator('a[href*="/questao/1"]').first().click();
  await page.waitForURL(/\/questao\/1$/);
  await page.getByText(/Gabarito oficial:/).waitFor({ timeout: 10000 });
  await paraCadaLargura(page, `simulado-correcao-${tema}`);

  await browser.close();
}

async function main() {
  console.log(`Pasta de saída: ${SAIDA}\n`);
  for (const tema of TEMAS) {
    console.log(`Rotas públicas [${tema}]:`);
    await capturarRotasPublicas(tema);
    console.log(`Rotas autenticadas [${tema}]:`);
    await capturarRotasAutenticadasSimples(tema);
    console.log(`Fluxo de treino [${tema}]:`);
    await capturarFluxoTreino(tema);
    console.log(`Fluxo de simulado [${tema}]:`);
    await capturarFluxoSimulado(tema);
  }
  console.log(`\nCapturas salvas em ${SAIDA}`);
}

main().catch((erro) => {
  console.error(erro);
  process.exitCode = 1;
});
