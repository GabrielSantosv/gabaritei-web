import { expect, test } from "@playwright/test";

test.describe("Entrar", () => {
  test("credenciais inválidas mostram o resumo de erro com foco", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill("aluno@teste.com");
    await page.getByLabel("Senha", { exact: true }).fill("123"); // menos de 6 caracteres
    await page.getByRole("button", { name: "Entrar" }).click();

    const resumo = page.getByRole("alert").filter({ hasText: "Não foi possível entrar" });
    await expect(resumo).toBeVisible();
    await expect(resumo).toHaveText(/E-mail ou senha incorretos/);
    await expect(resumo).toBeFocused();
  });

  test("login válido entra e leva para a rota protegida pedida (?proxima=)", async ({ page }) => {
    await page.goto("/entrar?proxima=%2Fperfil");
    await page.getByLabel("E-mail").fill("aluno@teste.com");
    await page.getByLabel("Senha", { exact: true }).fill("senha123");
    await page.getByRole("button", { name: "Entrar" }).click();

    await page.waitForURL("**/perfil");
    expect(page.url()).toContain("/perfil");
  });

  test("rota protegida sem sessão redireciona para /entrar com ?proxima=", async ({ page }) => {
    const resposta = await page.goto("/treino");
    expect(resposta?.status()).toBe(200);
    await page.waitForURL(/\/entrar\?proxima=%2Ftreino/);
  });

  test("quem já está logado é redirecionado para fora de /entrar", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill("aluno@teste.com");
    await page.getByLabel("Senha", { exact: true }).fill("senha123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL("**/inicio");

    await page.goto("/entrar");
    await page.waitForURL("**/inicio");
  });

  test("fluxo completo funciona só com teclado", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").focus();
    await page.keyboard.type("aluno@teste.com");
    await page.keyboard.press("Tab");
    await page.keyboard.type("senha123");
    await page.keyboard.press("Enter");
    await page.waitForURL("**/inicio");
  });
});

test.describe("Criar conta", () => {
  test("valida todos os campos obrigatórios ao enviar vazio", async ({ page }) => {
    await page.goto("/cadastrar");
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByText("Informe como quer ser chamado.")).toBeVisible();
    await expect(page.getByText("Informe seu e-mail.")).toBeVisible();
    await expect(page.getByText("A senha precisa ter pelo menos 6 caracteres.")).toBeVisible();
    await expect(page.getByText("Selecione uma opção.")).toBeVisible();
    await expect(page.getByText("Você precisa aceitar os Termos")).toBeVisible();
  });

  test("conta criada como \"Marina\" faz o Início saudar por esse nome, e o banner de demonstração tem contraste suficiente", async ({ page }) => {
    await page.goto("/cadastrar");
    await page.getByLabel("Como quer ser chamado").fill("Marina");
    await page.getByLabel("E-mail").fill(`marina-${Date.now()}@teste.com`);
    await page.getByLabel("Senha", { exact: true }).fill("senha123");
    await page.getByText("Tenho 18 anos ou mais").click();
    await page.getByText(/Li e aceito/).click();
    await page.getByRole("button", { name: "Criar conta" }).click();
    await page.getByRole("button", { name: "Já confirmei, continuar" }).click();
    // Conta nova (onboardingConcluido = false, P2) vai pros primeiros passos antes
    // do Início — pula pra testar a saudação, que é o que este teste cobre.
    await page.waitForURL("**/boas-vindas");
    await page.getByRole("button", { name: "Pular por enquanto" }).click();
    await page.waitForURL("**/inicio");

    // Início novo: o h1 é um texto fixo ("Estude para o ENEM..."), a saudação
    // virou um parágrafo ao lado do selo do Foguinho, na faixa. A saudação muda
    // com o horário (Bom dia/Boa tarde/Boa noite) — testa o conjunto das 3, não
    // uma só, pra não depender da hora em que o teste roda.
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Estude para o ENEM com a ajuda do Gabaritei.");
    await expect(page.getByText(/^(Bom dia|Boa tarde|Boa noite), Marina\.$/)).toBeVisible();

    // Contraste do banner de demonstração ≥ 4,5:1 (seção 11) — mesma fórmula WCOAG
    // (luminância relativa) do scripts/auditar-contraste.ts, calculada no navegador.
    const razao = await page.evaluate(() => {
      const banner = document.querySelector('[aria-label="Aviso de dados de demonstração"]');
      if (!banner) return null;
      function luminancia([r, g, b]: number[]) {
        const canal = (v: number) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
      }
      function paraRgb(cor: string): number[] {
        const m = cor.match(/rgba?\(([^)]+)\)/);
        if (!m) return [0, 0, 0];
        return m[1].split(",").map((p) => parseFloat(p.trim()));
      }
      const estilo = getComputedStyle(banner);
      const fg = paraRgb(estilo.color);
      const bg = paraRgb(estilo.backgroundColor);
      const l1 = luminancia(fg) + 0.05;
      const l2 = luminancia(bg) + 0.05;
      return l1 > l2 ? l1 / l2 : l2 / l1;
    });

    expect(razao, "banner de demonstração não encontrado ou sem cor de fundo própria").not.toBeNull();
    expect(razao!).toBeGreaterThanOrEqual(4.5);
  });

  test("cadastro válido mostra a tela de confirmação de e-mail", async ({ page }) => {
    await page.goto("/cadastrar");
    await page.getByLabel("Como quer ser chamado").fill("Aluno Teste");
    await page.getByLabel("E-mail").fill(`novo-${Date.now()}@teste.com`);
    await page.getByLabel("Senha", { exact: true }).fill("senha123");
    await page.getByText("Tenho 18 anos ou mais").click();
    await page.getByText(/Li e aceito/).click();
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByRole("heading", { name: "Confira seu e-mail" })).toBeVisible();
    await expect(page.getByText("Modo de demonstração: nenhum e-mail é enviado de verdade.")).toBeVisible();

    await page.getByRole("button", { name: "Já confirmei, continuar" }).click();
    // Conta nova (onboardingConcluido = false, P2) vai pros primeiros passos, não
    // direto pro Início — ver docs/FRONTEND_PARIDADE.md, seção 6, P2.
    await page.waitForURL("**/boas-vindas");
  });
});

test.describe("Termos e Privacidade", () => {
  for (const rota of ["/termos", "/privacidade"]) {
    test(`${rota} mostra a estrutura provisória`, async ({ page }) => {
      await page.goto(rota);
      await expect(page.getByText(/Última atualização/)).toBeVisible();
      await expect(page.getByText("TODO(equipe): texto jurídico.").first()).toBeVisible();
    });
  }
});
