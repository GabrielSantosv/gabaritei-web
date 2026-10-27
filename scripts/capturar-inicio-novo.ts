/**
 * Capturas "antes"/"depois" específicas do Início novo (docs/FRONTEND_INICIO.md,
 * seção Verificação, passos 1 e 4). Cenários do mock via
 * localStorage["gabaritei:mock:cenario"], paleta/tema via localStorage["gabaritei:aparencia"].
 *
 * Uso:
 *   npx tsx scripts/capturar-inicio-novo.ts antes
 *   npx tsx scripts/capturar-inicio-novo.ts depois
 * Pré-requisito: servidor de dev rodando em http://localhost:3000.
 */
import { chromium, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const FASE = process.argv[2] === "antes" ? "antes" : "depois";
const SAIDA = join(__dirname, "..", "e2e", "capturas", `inicio-novo-${FASE}`);
const LARGURAS = [1280, 360] as const;
const TEMAS = ["claro", "escuro"] as const;
const PALETAS = FASE === "depois" ? (["floresta", "brasa"] as const) : (["floresta"] as const);
const CENARIOS = FASE === "depois" ? (["novo", "ativo", "parcial"] as const) : (["novo", "ativo"] as const);

mkdirSync(SAIDA, { recursive: true });

async function entrar(page: Page, tema: string, paleta: string, cenario: string) {
  await page.addInitScript(
    ({ t, p, c }) => {
      window.localStorage.setItem("gabaritei:aparencia", JSON.stringify({ tema: t, paleta: p }));
      window.localStorage.setItem("gabaritei:mock:cenario", c);
    },
    { t: tema, p: paleta, c: cenario },
  );
  await page.goto(`${BASE_URL}/entrar`);
  await page.fill("#email", "aluno@teste.com");
  await page.fill("#senha", "senha123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/inicio/);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
}

async function capturar(page: Page, nome: string, largura: number) {
  await page.setViewportSize({ width: largura, height: largura <= 400 ? 1400 : 1100 });
  await page.waitForTimeout(400);
  const caminho = join(SAIDA, `${nome}-${largura}.png`);
  await page.screenshot({ path: caminho, fullPage: true });
  console.log(`  ${caminho}`);
}

async function main() {
  console.log(`Pasta de saída: ${SAIDA}\n`);
  const browser = await chromium.launch();
  for (const paleta of PALETAS) {
    for (const tema of TEMAS) {
      for (const cenario of CENARIOS) {
        const page = await browser.newPage();
        await entrar(page, tema, paleta, cenario);
        const nome = `inicio-${cenario}-${tema}${paleta !== "floresta" ? `-${paleta}` : ""}`;
        for (const largura of LARGURAS) {
          await capturar(page, nome, largura);
        }
        await page.close();
      }
    }
  }
  await browser.close();
  console.log(`\nCapturas salvas em ${SAIDA}`);
}

main().catch((erro) => {
  console.error(erro);
  process.exitCode = 1;
});
