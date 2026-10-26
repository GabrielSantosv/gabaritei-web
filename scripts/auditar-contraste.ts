/**
 * Auditoria de contraste (docs/FRONTEND_PROMPT.md, seção 11). O axe não
 * enxerga tudo (fundos com transparência, texto sobre bolha): este script
 * lê, para cada elemento de texto visível, a cor calculada e o fundo real
 * atrás dele (subindo pela árvore até achar um background sólido), e calcula
 * a razão WCAG. Falha se < 4,5:1 (< 3:1 para texto grande: ≥ 24px, ou ≥
 * 18,66px em negrito/600+).
 *
 * Uso: npx tsx scripts/auditar-contraste.ts
 * Pré-requisito: o servidor de dev rodando em http://localhost:3000
 *                 (npm run dev, numa aba separada).
 */
import { chromium, type Page } from "@playwright/test";

const BASE_URL = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";

// Cresce a cada etapa que adiciona telas novas (seção 12).
const ROTAS = ["/entrar", "/cadastrar", "/termos", "/privacidade", "/dev/componentes"];
const ROTAS_AUTENTICADAS = ["/inicio", "/questoes", "/questoes/demo-003", "/treino", "/simulados", "/historico", "/perfil", "/configuracoes"];
const TEMAS = ["claro", "escuro"] as const;

// Matriz de paletas (seção 7): Floresta roda em ROTAS_AUTENTICADAS acima, nos
// dois temas. As outras 4 só nas rotas que a seção 7 pede.
const PALETAS_MATRIZ = ["oceano", "terracota", "brasa", "sol"] as const;
const ROTAS_MATRIZ_PALETAS = ["/inicio", "/perfil", "/configuracoes", "/questoes"];

/** Cache único de aparência (docs/FRONTEND_PARIDADE.md, 4.5) — era "gabaritei:tema". */
async function aplicarAparenciaInit(page: Page, tema: string, paleta?: string) {
  await page.addInitScript((a) => {
    window.localStorage.setItem("gabaritei:aparencia", JSON.stringify(a));
  }, { tema, paleta });
}

interface Falha {
  rota: string;
  tema: string;
  seletor: string;
  texto: string;
  fg: string;
  bg: string;
  razao: number;
  minimo: number;
  tamanhoPx: number;
  negrito: boolean;
}

/**
 * Roda inteiramente no navegador via page.evaluate. Fica como uma string de
 * JS puro (em vez de uma closure TypeScript) de propósito: o esbuild do tsx
 * injeta um helper `__name` em funções nomeadas para preservar `.name`, e
 * esse helper não existe quando o Playwright serializa a função para rodar
 * na página — o que quebra em runtime. Como string, roda sem passar pelo
 * transform do esbuild.
 */
const SCRIPT_NO_NAVEGADOR = `
(function () {
  // Tailwind v4 usa color-mix() para modificadores de opacidade (ex.: bg-brand/60),
  // e o Chrome devolve esse computed style em notação oklab(), não rgb(). Precisamos
  // converter os dois formatos para comparar cor de verdade.
  function toSrgbChannel(c) {
    c = Math.max(0, Math.min(1, c));
    return (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255;
  }

  function oklabParaRgb(L, a, b) {
    var l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    var m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    var s_ = L - 0.0894841775 * a - 1.291485548 * b;
    var l = l_ * l_ * l_;
    var m = m_ * m_ * m_;
    var s = s_ * s_ * s_;
    var rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    var gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    var bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
    return [toSrgbChannel(rLin), toSrgbChannel(gLin), toSrgbChannel(bLin)];
  }

  function parseRgb(cor) {
    var mRgb = cor.match(/rgba?\\(([^)]+)\\)/);
    if (mRgb) {
      var partes = mRgb[1].split(",").map(function (p) { return parseFloat(p.trim()); });
      return [partes[0] || 0, partes[1] || 0, partes[2] || 0, partes[3] === undefined ? 1 : partes[3]];
    }
    var mOklab = cor.match(/oklab\\(([^)]+)\\)/);
    if (mOklab) {
      var campos = mOklab[1].split("/");
      var lab = campos[0].trim().split(/\\s+/).map(parseFloat);
      var alpha = campos[1] !== undefined ? parseFloat(campos[1]) : 1;
      var rgb = oklabParaRgb(lab[0], lab[1], lab[2]);
      return [rgb[0], rgb[1], rgb[2], alpha];
    }
    return [0, 0, 0, 0];
  }

  function luminancia(rgb) {
    function canal(v) {
      var c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * canal(rgb[0]) + 0.7152 * canal(rgb[1]) + 0.0722 * canal(rgb[2]);
  }

  function razaoContraste(a, b) {
    var l1 = luminancia(a) + 0.05;
    var l2 = luminancia(b) + 0.05;
    return l1 > l2 ? l1 / l2 : l2 / l1;
  }

  function compositar(fg, bg) {
    var a = fg[3];
    return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1];
  }

  function fundoReal(el) {
    var atual = el;
    var acumulado = [255, 255, 255, 1];
    var camadas = [];
    while (atual) {
      var bg = parseRgb(getComputedStyle(atual).backgroundColor);
      if (bg[3] > 0) camadas.unshift(bg);
      atual = atual.parentElement;
    }
    for (var i = 0; i < camadas.length; i++) acumulado = compositar(camadas[i], acumulado);
    return acumulado;
  }

  function seletorDe(el) {
    if (el.id) return "#" + el.id;
    var classe = typeof el.className === "string" ? el.className.split(" ").slice(0, 2).join(".") : "";
    return el.tagName.toLowerCase() + (classe ? "." + classe : "");
  }

  var falhas = [];
  var todos = document.body.querySelectorAll("*");
  todos.forEach(function (el) {
    var filhos = Array.prototype.slice.call(el.childNodes);
    var textoDireto = filhos
      .filter(function (n) { return n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim().length > 0; })
      .map(function (n) { return n.textContent || ""; })
      .join(" ")
      .trim();
    if (!textoDireto) return;

    var estilo = getComputedStyle(el);
    if (estilo.visibility === "hidden" || estilo.display === "none" || parseFloat(estilo.opacity) === 0) return;
    var rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    var fg = parseRgb(estilo.color);
    var bg = fundoReal(el);
    var razao = razaoContraste(fg, bg);

    var tamanhoPx = parseFloat(estilo.fontSize);
    var peso = parseInt(estilo.fontWeight, 10) || 400;
    var negrito = peso >= 600;
    var grande = tamanhoPx >= 24 || (negrito && tamanhoPx >= 18.66);
    var minimo = grande ? 3 : 4.5;

    if (razao < minimo) {
      falhas.push({
        seletor: seletorDe(el),
        texto: textoDireto.slice(0, 60),
        fg: "rgb(" + fg[0] + "," + fg[1] + "," + fg[2] + ")",
        bg: "rgb(" + Math.round(bg[0]) + "," + Math.round(bg[1]) + "," + Math.round(bg[2]) + ")",
        razao: Math.round(razao * 100) / 100,
        minimo: minimo,
        tamanhoPx: tamanhoPx,
        negrito: negrito
      });
    }
  });

  return falhas;
})()
`;

interface FalhaBruta {
  seletor: string;
  texto: string;
  fg: string;
  bg: string;
  razao: number;
  minimo: number;
  tamanhoPx: number;
  negrito: boolean;
}

async function medirPagina(page: Page, rota: string, tema: string): Promise<Falha[]> {
  await aplicarAparenciaInit(page, tema);
  await page.goto(`${BASE_URL}${rota}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1100); // deixa a entrada do cartão-resposta (seção 6) terminar

  const falhas = (await page.evaluate(SCRIPT_NO_NAVEGADOR)) as FalhaBruta[];
  return falhas.map((f) => ({ ...f, rota, tema }));
}

async function medirPaginaAutenticada(page: Page, rota: string, tema: string, paleta?: string): Promise<Falha[]> {
  await aplicarAparenciaInit(page, tema, paleta);
  await page.goto(`${BASE_URL}/entrar`);
  await page.fill("#email", "aluno@teste.com");
  await page.fill("#senha", "senha123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/inicio/);

  await page.goto(`${BASE_URL}${rota}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1100);

  const falhas = (await page.evaluate(SCRIPT_NO_NAVEGADOR)) as FalhaBruta[];
  return falhas.map((f) => ({ ...f, rota, tema }));
}

async function medirSessaoDeTreino(page: Page, tema: string): Promise<Falha[]> {
  await aplicarAparenciaInit(page, tema);
  await page.goto(`${BASE_URL}/entrar`);
  await page.fill("#email", "aluno@teste.com");
  await page.fill("#senha", "senha123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/inicio/);

  await page.goto(`${BASE_URL}/treino`);
  await page.getByRole("radio", { name: "5", exact: true }).click();
  await page.click('button:has-text("Começar treino")');
  await page.waitForURL(/\/treino\/[^/]+$/);
  // Espera a primeira alternativa de verdade em vez de um tempo fixo: um wait fixo
  // (500ms) às vezes não bastava sob mais contenção de recursos (muitos navegadores
  // abertos nesta auditoria), fazendo o loop de respostas abaixo não achar nada.
  await page.waitForSelector('[role="radio"]', { timeout: 15000 });
  await page.waitForLoadState("networkidle");

  const falhasSessao = ((await page.evaluate(SCRIPT_NO_NAVEGADOR)) as FalhaBruta[]).map((f) => ({
    ...f,
    rota: "/treino/[sessaoId]",
    tema,
  }));

  // responde até o fim pra também auditar o resumo
  for (let i = 0; i < 5; i += 1) {
    const radio = await page.$('[role="radio"]');
    if (!radio) break;
    await radio.click();
    await page.click('button:has-text("Enviar resposta")');
    // latência simulada do mock chega a 900ms (seção 7.3) + margem; mais
    // folga que o normal porque esta etapa roda depois de várias outras
    // páginas/navegadores já abertos nesta auditoria, sob mais contenção de recursos.
    await page.waitForSelector('button:has-text("Próxima questão"), button:has-text("Ver resumo")', {
      timeout: 15000,
    });
    const verResumo = await page.$('button:has-text("Ver resumo")');
    if (verResumo) await verResumo.click();
    else await page.click('button:has-text("Próxima questão")');
    await page.waitForTimeout(300);
    if (page.url().includes("/resumo")) break;
  }
  await page.waitForURL(/\/resumo$/, { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  const falhasResumo = ((await page.evaluate(SCRIPT_NO_NAVEGADOR)) as FalhaBruta[]).map((f) => ({
    ...f,
    rota: "/treino/[sessaoId]/resumo",
    tema,
  }));

  return [...falhasSessao, ...falhasResumo];
}

async function medirSimulado(page: Page, tema: string): Promise<Falha[]> {
  await aplicarAparenciaInit(page, tema);
  await page.goto(`${BASE_URL}/entrar`);
  await page.fill("#email", "aluno@teste.com");
  await page.fill("#senha", "senha123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/inicio/);

  await page.goto(`${BASE_URL}/simulados`);
  await page.click('button:has-text("Iniciar simulado")');
  await page.waitForURL(/\/simulados\/[^/]+$/);
  // Mesmo motivo do medirSessaoDeTreino acima: espera a alternativa de verdade.
  await page.waitForSelector('[role="radio"]', { timeout: 15000 });
  await page.waitForLoadState("networkidle");

  const falhasResolucao = ((await page.evaluate(SCRIPT_NO_NAVEGADOR)) as FalhaBruta[]).map((f) => ({
    ...f,
    rota: "/simulados/[id]",
    tema,
  }));

  await page.getByRole("radio", { name: "Alternativa A" }).click();
  await page.getByText("Salvo").waitFor();
  await page.click('button:has-text("Finalizar")');
  await page.click('button:has-text("Finalizar e ver resultado")');
  await page.waitForURL(/\/resultado$/);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1100); // entrada escalonada do cartão-resposta (seção 6)

  const falhasResultado = ((await page.evaluate(SCRIPT_NO_NAVEGADOR)) as FalhaBruta[]).map((f) => ({
    ...f,
    rota: "/simulados/[id]/resultado",
    tema,
  }));

  await page.locator('a[href*="/questao/1"]').first().click();
  await page.waitForURL(/\/questao\/1$/);
  // 3 consultas encadeadas (resultado → questão → tentativa): espera texto de
  // verdade em vez de um tempo fixo (ver nota equivalente em acessibilidade.a11y.spec.ts).
  await page.getByText(/Gabarito oficial:/).waitFor({ timeout: 10000 });
  await page.waitForLoadState("networkidle");

  const falhasCorrecao = ((await page.evaluate(SCRIPT_NO_NAVEGADOR)) as FalhaBruta[]).map((f) => ({
    ...f,
    rota: "/simulados/[id]/questao/[n]",
    tema,
  }));

  return [...falhasResolucao, ...falhasResultado, ...falhasCorrecao];
}

/** Uma questão corrigida (seção 7, matriz de paletas): demo-001 tem gabarito B
 *  (seed determinística do mock) — "B" acerta, "A" erra. */
async function medirQuestaoCorrigida(page: Page, tema: string, paleta: string, letra: "A" | "B"): Promise<Falha[]> {
  await aplicarAparenciaInit(page, tema, paleta);
  await page.goto(`${BASE_URL}/entrar`);
  await page.fill("#email", "aluno@teste.com");
  await page.fill("#senha", "senha123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/inicio/);

  await page.goto(`${BASE_URL}/questoes/demo-001`);
  await page.getByRole("radio", { name: `Alternativa ${letra}` }).click();
  await page.getByRole("button", { name: "Enviar resposta" }).click();
  await page.getByText(/Você (acertou|errou)/).waitFor();
  await page.waitForTimeout(300);

  const falhas = (await page.evaluate(SCRIPT_NO_NAVEGADOR)) as FalhaBruta[];
  return falhas.map((f) => ({ ...f, rota: `/questoes/demo-001 (${letra === "B" ? "acerto" : "erro"})`, tema }));
}

/** Resultado do simulado (seção 7, matriz de paletas) — só esse trecho do fluxo de
 *  medirSimulado, sem a tela de resolução nem a correção por questão. */
async function medirResultadoSimulado(page: Page, tema: string, paleta: string): Promise<Falha[]> {
  await aplicarAparenciaInit(page, tema, paleta);
  await page.goto(`${BASE_URL}/entrar`);
  await page.fill("#email", "aluno@teste.com");
  await page.fill("#senha", "senha123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/inicio/);

  await page.goto(`${BASE_URL}/simulados`);
  await page.click('button:has-text("Iniciar simulado")');
  await page.waitForURL(/\/simulados\/[^/]+$/);
  await page.waitForSelector('[role="radio"]', { timeout: 15000 });
  await page.getByRole("radio", { name: "Alternativa A" }).click();
  await page.getByText("Salvo").waitFor();
  await page.click('button:has-text("Finalizar")');
  await page.click('button:has-text("Finalizar e ver resultado")');
  await page.waitForURL(/\/resultado$/);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1100);

  const falhas = (await page.evaluate(SCRIPT_NO_NAVEGADOR)) as FalhaBruta[];
  return falhas.map((f) => ({ ...f, rota: "/simulados/[id]/resultado", tema }));
}

async function main() {
  const browser = await chromium.launch();
  const todasFalhas: Falha[] = [];

  for (const rota of ROTAS) {
    for (const tema of TEMAS) {
      const page = await browser.newPage();
      try {
        const falhas = await medirPagina(page, rota, tema);
        todasFalhas.push(...falhas);
        console.log(`${rota} [${tema}]: ${falhas.length} falha(s)`);
      } finally {
        await page.close();
      }
    }
  }

  for (const rota of ROTAS_AUTENTICADAS) {
    for (const tema of TEMAS) {
      const page = await browser.newPage();
      try {
        const falhas = await medirPaginaAutenticada(page, rota, tema);
        todasFalhas.push(...falhas);
        console.log(`${rota} [${tema}]: ${falhas.length} falha(s)`);
      } finally {
        await page.close();
      }
    }
  }

  await browser.close(); // libera o Chromium das rotas acima antes do fluxo de sessão (mais pesado)

  for (const tema of TEMAS) {
    // navegador isolado por tema aqui: esse fluxo cria/termina uma sessão de
    // treino de verdade e, numa página reaproveitada, às vezes trava o Chromium.
    const browserSessao = await chromium.launch();
    const page = await browserSessao.newPage();
    try {
      const falhas = await medirSessaoDeTreino(page, tema);
      todasFalhas.push(...falhas);
      console.log(`/treino/[sessaoId] (+ resumo) [${tema}]: ${falhas.length} falha(s)`);
    } finally {
      await page.close();
      await browserSessao.close();
    }
  }

  for (const tema of TEMAS) {
    const browserSimulado = await chromium.launch();
    const page = await browserSimulado.newPage();
    try {
      const falhas = await medirSimulado(page, tema);
      todasFalhas.push(...falhas);
      console.log(`/simulados/[id] (+ resultado + questão) [${tema}]: ${falhas.length} falha(s)`);
    } finally {
      await page.close();
      await browserSimulado.close();
    }
  }

  // Matriz de paletas: navegador próprio (o `browser` das rotas Floresta já fechou
  // acima), igual ao isolamento usado nos fluxos de sessão/simulado.
  const browserPaletas = await chromium.launch();
  try {
    for (const paleta of PALETAS_MATRIZ) {
      for (const tema of TEMAS) {
        for (const rota of ROTAS_MATRIZ_PALETAS) {
          const page = await browserPaletas.newPage();
          try {
            const falhas = await medirPaginaAutenticada(page, rota, tema, paleta);
            todasFalhas.push(...falhas.map((f) => ({ ...f, rota: `${f.rota} [${paleta}]` })));
            console.log(`${rota} [${tema}/${paleta}]: ${falhas.length} falha(s)`);
          } finally {
            await page.close();
          }
        }

        for (const letra of ["B", "A"] as const) {
          const page = await browserPaletas.newPage();
          try {
            const falhas = await medirQuestaoCorrigida(page, tema, paleta, letra);
            todasFalhas.push(...falhas.map((f) => ({ ...f, rota: `${f.rota} [${paleta}]` })));
            console.log(`questão corrigida (${letra === "B" ? "acerto" : "erro"}) [${tema}/${paleta}]: ${falhas.length} falha(s)`);
          } finally {
            await page.close();
          }
        }

        const page = await browserPaletas.newPage();
        try {
          const falhas = await medirResultadoSimulado(page, tema, paleta);
          todasFalhas.push(...falhas.map((f) => ({ ...f, rota: `${f.rota} [${paleta}]` })));
          console.log(`resultado do simulado [${tema}/${paleta}]: ${falhas.length} falha(s)`);
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    await browserPaletas.close();
  }

  if (todasFalhas.length === 0) {
    console.log("\nAuditoria de contraste: zero falhas.");
    return;
  }

  console.log(`\n${todasFalhas.length} falha(s) de contraste:\n`);
  for (const f of todasFalhas) {
    console.log(
      `  [${f.rota} / ${f.tema}] ${f.seletor} — "${f.texto}"\n` +
        `    ${f.fg} sobre ${f.bg} = ${f.razao}:1 (mínimo ${f.minimo}:1, ${f.tamanhoPx}px${f.negrito ? " negrito" : ""})`,
    );
  }
  process.exitCode = 1;
}

main().catch((erro) => {
  console.error(erro);
  process.exitCode = 1;
});
