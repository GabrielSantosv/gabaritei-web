# Pendências

Lista viva de decisões do grupo (`TODO(equipe)`) e tipos novos. A IA não decide nenhum item marcado como pendência — só sinaliza no código e aqui.

## Decisões em aberto (seção 14 do prompt)

1. **Escala da proficiência** que o estudante vê (theta do modelo 3PL ou uma escala de 0 a 1000) e o rótulo. No mock, usamos uma escala provisória de -3 a 3 (ver `lib/api/mock/engine.ts`, `rotuloEscala`), só para exercitar a tela — não é a escala final.
2. **Volume mínimo de respostas** para estimar proficiência e para apontar reforço (RF09, RF10), por área. No mock: `MOCK_MIN_RESPOSTAS = 20` por área para proficiência (`lib/api/mock/dados.ts`) e um mínimo provisório de 15 respostas totais / 3 por habilidade para reforço (`lib/api/mock/engine.ts`).
3. **Regra do Combo**: acertos por degrau, tamanho do degrau, o que acontece no erro (RF18). No mock: `COMBO_CONFIG_PADRAO = { acertosPorDegrau: 3, noErro: 'reduz' }` (`lib/api/mock/engine.ts`) — só placeholder.
4. **Cortes de dificuldade por área** a partir do parâmetro b (RF03) e onde documentar. No mock, usamos um corte único e global (`b < -0,5` fácil, `-0,5` a `0,5` média, `> 0,5` difícil) em `derivarFaixa` (`lib/api/mock/dados.ts`) — a Fase 1 pede corte **por área**, ainda não implementado.
5. **Menores de 18 anos**: consentimento, texto e retenção (RNF07). Texto jurídico de Termos e Privacidade — estrutura pronta em `/termos` e `/privacidade` (Etapa 1), toda seção com `TODO(equipe): texto jurídico.` esperando o texto de verdade. Contato para pedir exclusão de conta: o campo na tela de Criar conta ainda mostra o texto literal `TODO(equipe): e-mail de contato` (visível na tela, de propósito, para ninguém esquecer de preencher).
6. **Habilidades**: conferir códigos e descrições com a Matriz de Referência oficial. No mock, os códigos H1–H24 e as descrições em `lib/api/mock/dados.ts` são inventados para ter dado de demonstração — **não correspondem à Matriz real**. Dois problemas a mais, achados na Etapa 2: (a) a seção 3 diz que os códigos vão de H1 a H30 **dentro de cada área** (ou seja, se repetem entre áreas), mas o mock gerou códigos únicos globalmente; (b) o contrato (`Habilidade`, seção 7.1) não guarda a área da habilidade, e a tela de Questões precisa disso pra agrupar a Combobox por área (RF04) — hoje o front infere a área por um sufixo que o próprio mock grava na descrição (`lib/questoes-filtros.ts`, `limparDescricaoHabilidadeMock`/`areaDaDescricaoMock`), que não existe nos dados reais do INEP. Sugestão pro grupo: `Habilidade` ganhar um campo `area` de verdade.
7. **Nomes finais dos campos da API** e geração dos tipos a partir do OpenAPI, combinados com quem faz a FastAPI.
8. **Autenticação**: confirmar Supabase Auth e a política de confirmação de e-mail (Etapa 1 já assume Supabase Auth com confirmação por e-mail, mas isso precisa ser confirmado com quem faz o back-end). A senha mínima de 6 caracteres usada na tela de Criar conta é o padrão do Supabase Auth — confirmar se o grupo quer manter.
9. **Simulado**: tempo padrão e composição do "dia completo" (Etapa 4). Implementado como escolha provisória: tempo limite é opcional (desligado por padrão) com sugestão de 3 min/questão na dica do campo; "dia completo" junta Linguagens+Ciências Humanas ou Ciências da Natureza+Matemática, 90 questões (`PARES_DIA` em `simulados-client.tsx`) — confirmar com o grupo se são esses os pares e esse tempo sugerido mesmo.
10. **Cor por área ou por disciplina**, se o banco passar a ter disciplina — os tokens aguentam a troca (`styles/tokens.css`).
11. **Fórmulas**: o dataset traz fórmulas em LaTeX? O tipo `Bloco` já tem a variante `formula`, mas nenhuma questão do mock a usa ainda.
12. **Repositório**: nome `gabaritei-web` (definido). Gerenciador de pacotes: **trocado de pnpm (sugestão original) para npm** nesta etapa, porque a máquina usada não tinha permissão para instalar o pnpm globalmente (`npm install -g pnpm` falhou por EPERM). `npm run <script>` substitui `pnpm <script>` em todos os comandos da seção 11.
13. **`--area-*` em ladrilho de seleção (`AreaTile`)**, não só em `AreaTag`/filetes finos (etapa V, item 2). Gabriel autorizou a ampliação da regra pra esta etapa (ladrilhos no Início sem histórico, chips do Treino, seleção de área dos Simulados), mas o grupo precisa **ratificar** se isso fica valendo daqui pra frente ou se foi só uma exceção pontual. `docs/FRONTEND_PROMPT.md` seção 6 já foi atualizado com a ressalva condicional a esta ratificação.

### Decisões em aberto da paridade (seção 9 do `docs/FRONTEND_PARIDADE.md`), relevantes já na P1

14. **Paletas Brasa e Sol**: manter as duas em `NEXT_PUBLIC_PALETAS` ou tirar? Brasa tem acento perto de `--err`; Sol tem acento perto do âmbar da IA (documentado como exceção na seção 2 do prompt de paridade). Contraste auditado e zero falhas nas duas (`audit:paletas`, `audit:contraste`) — a decisão é de gosto/identidade, não de acessibilidade.
15. **Movimento**: o grupo aprova a cascata de entrada de página/blocos (`template.tsx`, `[data-reveal]`)? Isso muda a seção 6 e a lista "Evite" da Fase 1, que antes pedia "só um momento orquestrado" — ver tabela da seção 2 do prompt de paridade.
16. **Acento quente** pra Floresta/Oceano/Terracota (hoje `--accent` = `--brand` nessas três; só Brasa e Sol têm acento com identidade própria). Um coral pro Foguinho, por exemplo, exigiria token novo e auditoria de contraste nova.
17. **Terracota e a área LC**: o laranja-queimado de `--area-lc` é parecido com o botão da paleta Terracota. `AreaTag` sempre mostra sigla + nome (a informação não depende só da cor), mas o grupo precisa ver em tela antes de aprovar as duas paletas juntas.

## Decisões de implementação (não são TODO, são notas técnicas)

**Etapa P1 (paridade: movimento e paletas)**
- **Renomeação mecânica** (4.1): `--forest*` → `--brand*` em todo `src/`, sem alias antigo. `--accent`/`--accent-ink`/`--accent-soft` novos (= `--brand*` na Floresta). Capturas de tela de verdade (`e2e/capturas/antes/` vs `depois/`, 32 rotas × 2 larguras) confirmaram diferença zero na Floresta antes de seguir pras paletas.
- **5 paletas** (4.2): fonte única `styles/paletas.json` → `scripts/gerar-paletas.ts` → `styles/paletas.generated.css` (versionado, nunca editado à mão). `scripts/auditar-paletas.ts` regenera em memória e falha se o committed ficar fora de sincronia, além de conferir a tabela de contraste inteira — zero falhas nas 5 paletas × 2 temas. `NEXT_PUBLIC_PALETAS` filtra quais aparecem (Floresta sempre inclusa, é o fallback).
- **Primeira pintura** (4.5): cache único `localStorage["gabaritei:aparencia"]` (`lib/hooks/use-aparencia.ts`), lido por um script inline no `<head>` antes de qualquer pintura. `Preferencias` na API continua a fonte da verdade; o cache só existe pra não piscar no reload, e é resincronizado sempre que Configuracoes carrega ou muda uma preferência. `use-tema.ts` (controle antigo, usado pela galeria `/dev/componentes`) passou a delegar pro mesmo cache, pra não divergir do que o script lê.
- **Movimento** (4.4): `--ease-spring` é gerado por `scripts/gerar-mola.ts` a partir de um oscilador harmônico amortecido de verdade (rigidez 170, amortecimento 18, massa 1), amostrado numa função `linear()` — não escrito à mão. Achado e corrigido um bug na primeira versão do gerador: a detecção de "quando a mola assentou" usava a primeira vez que a posição cruzava 1, que acontece **durante a subida**, antes do exagero característico da mola — cortava a curva fora da amostra. Corrigido pra medir o envelope de decaimento, não a posição.
- **`/configuracoes`** (passo 6): seção Aparência com Tema (movido do Perfil), Paleta (radiogroup com 3 amostras por opção, lidas direto de `paletas.json` — `html[data-palette]` só vale pra paleta ativa, não dá pra usar os tokens CSS pra pré-visualizar as outras 4), Movimento (com "Ver prévia") e Tamanho do texto (100/115/130%, atributo `data-tamanho-texto` no `<html>`, escala `font-size` na raiz).
- **3 bugs reais encontrados testando esta etapa no navegador** (não só suposição):
  1. `lerEstado()` (mock, `lib/api/mock/estado.ts`) substituía `Preferencias` inteiro por um `localStorage` salvo antes dos campos `paleta`/`reduzirMovimento`/`tamanhoTexto` existirem — a tela de Configuracoes quebrava (`Cannot read properties of undefined`) pra quem já tinha usado o mock antes desta etapa. Corrigido: mescla `preferencias` um nível mais fundo, não só o objeto `EstadoMock` inteiro.
  2. `scripts/capturar-telas.ts`: a captura de `/treino/[sessaoId]/resumo` usava `networkidle` + 600ms fixo pra saber que a tela carregou — o mock não usa fetch/XHR de verdade (só `setTimeout`), então `networkidle` nunca esperava a chamada de verdade terminar. A própria captura "antes" (linha de base do passo 1) já estava cortada no meio por causa disso, sem ninguém notar na hora. Corrigido: espera um texto que só aparece depois do resumo carregar ("Foguinho").
  3. As linhas de Tema/Movimento/Tamanho do texto em Configuracoes não tinham `flex-wrap` (ao contrário da linha de Paleta, que já tinha) — achado pelo teste de 130%/360px pedido pelo grupo: o rótulo "Salvando…" vazava 8px da viewport. `perfil-client.tsx` tinha o mesmo padrão nas linhas de preferência (Switch/Field + "Salvo") — corrigido nos dois arquivos.
- **ScenarioSwitcher e o indicador de dev do Next** (`scenario-switcher.tsx`, `next.config.ts`) eram os dois `fixed`/posicionados no canto inferior esquerdo, cobrindo o "Sair" do rodapé da Sidebar, que fica no mesmo canto. Movidos pra cantos diferentes entre si (bottom-right e top-right).
- **`check:regras`**: a checagem de seta (`→⇒➜➔⟶`) ficou restrita a link/botão (travessão e traço médio continuam valendo em qualquer texto — é a diferença que a seção 7 da paridade pede). Nova checagem: `--accent` nunca em `StatusChip`/`Alternativa`/`ComboMeter`/`ProgressToMinimum`/componente de barra de acerto (seção 4.3). Âmbar fora de `CriterioRecomendacao` passou a ler de `scripts/permite-ambar.txt` em vez de uma lista no próprio script. "Gamificação fora de escopo" não proíbe mais "conquista"/"medalha" (ficam atrás de `NEXT_PUBLIC_CONQUISTAS` na P3), mas passou a proibir também ranking/moeda/cor de metal (ouro/prata/bronze), que a seção 2 da paridade lista como sempre proibidos.
- **Teste de a11y com corrida de verdade**: o teste "130% a 360px" rodava o axe logo depois de clicar num controle, sem esperar a transição de `color`/`background-color` (`--dur-controle`, 200ms, nova nesta etapa) assentar — o axe media a cor **no meio** da transição e achava contraste baixo num frame que não existe parado (nem o estado antes, nem o depois do clique). Corrigido com uma espera de 300ms antes do axe.

**Desempenho (tela nova) e Assunto no Treino (pedido à parte, imagem de referência)**
- Novo nível de agrupamento "Assunto" entre Área e Habilidade (ex.: Matemática → Geometria → H47-H49) — não existia
  nenhuma forma disso no contrato. `Habilidade` ganhou `area`/`assunto` reais (fechando a pendência 6b já registrada
  acima); lista de assuntos por área é mock, inspirada nos eixos do ENEM mas não oficial — ver `CONTRATO_PARIDADE.md`.
- `/desempenho` (visão geral, nossa) e `/desempenho/[area]` (detalhe, seguindo a imagem: filtros de área/período,
  indicadores, assuntos do pior pro melhor, habilidades do assunto selecionado com botões "Ver questões"/"Treinar").
  Tendência (subindo/caindo/estável/poucos dados) compara a metade mais antiga com a mais recente das respostas do
  período — client-side, candidato forte a virar cálculo do back-end quando a API de verdade existir.
- Treino ganhou a seção "Assunto" (só com uma área escolhida): ladrilhos com taxa de acerto, filtra a Combobox de
  habilidade, aparece no resumo, e o texto do cartão "Por habilidade" agora cita o assunto do reforço indicado.
  `PedidoRecomendacao` ganhou `habilidades?: string[]` (plural) pra "treinar o assunto inteiro" — filtro universal no
  motor, funciona em qualquer modo.
- Banco de questões (mock) cresceu de 60 pra 400 e de 6 pra ~14-18 habilidades por área, só pra ter volume de
  demonstração suficiente por assunto — não mexe no contrato, só no gerador de dados fictícios.
- **Testado de verdade no navegador**: troca de período (7/30/90/tudo) recalcula os números; troca de área navega
  entre `/desempenho/[area]`; selecionar um assunto troca a tabela de habilidades; "Treinar {assunto}, N questões"
  inicia sessão de verdade e navega pro treino (inclusive o aviso de "questões elegíveis acabaram" quando o assunto
  tem poucas questões cadastradas — fallback já existente no motor, não um bug novo); funciona em mobile (375px).
- **Teste e2e desatualizado, achado pela própria suíte**: `e2e/questoes.spec.ts` esperava o texto literal "60
  questões encontradas" (o total antigo do banco de demonstração) — corrigido pra "400", acompanhando o
  `TOTAL_QUESTOES_DEMO` novo. `npm run audit:contraste` (zero falhas, 5 paletas × 2 temas, incluindo `/desempenho` e
  `/desempenho/MT`), `test:a11y` (116) e `test:e2e` (218) rodados de verdade depois do conserto — tudo passando.

**Taxa de acerto por área em "Seus números" (pedido à parte)**
- Pedido do usuário olhando o Início: queria ver o percentual de acerto de cada matéria/área, não só o geral.
  `ResumoGeral` ganhou o campo `porArea: { area, respondidas, acertos, taxaAcerto }[]` (sempre as 4 áreas, mock
  calcula direto de `estado.tentativas` agrupando por `questao.area` — mesma lógica da taxa geral, só quebrada).
  Renderizado como uma segunda linha dentro do mesmo painel "Seus números" (não um bloco novo), com `AreaTag` +
  percentual; área sem nenhuma resposta ainda mostra "Sem dados" em vez de 0% (zero inventado seria enganoso).
  **De propósito não é `Proficiencia`** (a estimativa do modelo, com intervalo/tendência) — a seção 6 (P2, item 2)
  do prompt de paridade proíbe proficiência/desempenho agregado no Início, de propósito, porque isso é estatística
  de verdade e fica reservado pro Perfil e pro Desempenho (com `dados_insuficientes` lá). "Taxa de acerto por área"
  é só uma contagem simples (acertos/respondidas), mesma natureza do "Taxa de acerto" geral que seção 6 já
  autorizava para esse painel — não viola a regra.

**Histórico, resumo do simulado e Questões mais limpo (pedido à parte, não é uma etapa P\*)**
- Pedido do usuário, com capturas do design de referência mostrando Questões, Simulados e Histórico; achamos que as
  mesmas telas já estavam especificadas em detalhe no canvas de identidade (`docs/identidade/referencia/Telas.dc.html`,
  blocos `isQuestoes`/`isSimulados`/`isHistorico`) e usamos esse arquivo como fonte de verdade em vez de reconstruir
  só a partir das capturas.
- **`/historico`** (rota nova): 4 abas (Atividades, Erradas, Favoritas, Para revisar) com contagem, filtros de
  Período/Área/Resultado/Modo na URL, linhas agrupadas por dia ("Hoje", "Ontem", data por extenso) com "sua
  resposta"/gabarito/resultado/modo e link "Revisar" pra questão. Contrato novo: `ItemHistorico`, `Marcacao`,
  `AbaHistorico`, `FiltrosHistorico` (`lib/api/types.ts`), `listarHistorico`/`definirMarcacao` (mock implementa tudo
  a partir de `estado.tentativas`, paginado e ordenado por data) — ver `docs/CONTRATO_PARIDADE.md` pras diferenças
  em relação ao `AtividadeHistorico` já previsto na seção 5 do prompt de paridade, e pro que ainda falta (botão de
  favoritar/marcar, que é escopo da P5).
  Componente novo reaproveitável: `components/ui/select.tsx` (`<select>` nativo com rótulo, mesmo visual de `Field`).
- **Resumo do simulado**: o painel lateral de `/simulados` já existia, mas só mostrava "Questões" e "Duração". Agora
  tem os 4 campos do canvas (Escopo, Questões, Tempo, Cronômetro) e um preview decorativo do cartão-resposta (3
  colunas, `aria-hidden`, já que os números de verdade estão no `dl` acima — nenhuma informação nova vive só nele).
- **Questões, ajuste visual** (sem mudar o contrato de filtro/paginação — `FiltrosQuestoes.anos` continua sendo uma
  lista de anos — só a apresentação e a ordenação, que era a reclamação — "muita informação, pouco atrativo"):
  - Lista dentro de um cartão com borda arredondada (igual ao Histórico), mais respiro por linha (`px-5 py-4` em vez
    de `px-1 py-4`), contador "N questões encontradas" virou título em serifa, painel de filtros do desktop ganhou
    cartão próprio com "Filtros" + contagem de ativos.
  - **Filtro de Ano**: era uma lista de 8 checkboxes (2016 a 2023); virou "De/Até" (dois `<select>`, canvas
    `Telas.dc.html`) — o intervalo escolhido converte pros anos de verdade (`intervaloDeAnos`,
    `lib/.../questoes-client.tsx`) antes de virar filtro, então o contrato (`anos: number[]`) não mudou. O chip de
    filtro ativo também virou um só ("2022 a 2023") em vez de um por ano, e `contarFiltrosAtivos` passou a contar o
    intervalo como 1 filtro, não N.
  - **"Ordenar por"**: era um `Segmented` de 4 botões (ocupava bastante largura); virou um `<select>` só, com os
    rótulos completos do canvas ("Ano, mais recente primeiro" em vez de "Ano recente").
  - **`StatusChip`** (`components/dominio/status-chip.tsx`, usado em Questões e Histórico): ganhou fundo de pílula
    (`bg-brand-soft`/`bg-err-soft`/`bg-paper-2`) em vez de só texto colorido — mesma régua de contraste que
    `AreaTag`/`FaixaChip` já usavam, pra virar um selo de verdade em vez de texto solto na linha. Não é usado em
    nenhuma outra tela hoje (conferido antes de mudar), então o impacto ficou restrito às duas.
  - Componente novo reaproveitável: `components/ui/select.tsx`.
  - **Paginação reduzida de 20 pra 6 por página** (pedido do usuário depois de ver a tela: "muita informação,
    assusta o usuário"): `PAGINA_TAMANHO` em `lib/questoes-filtros.ts`. Afeta também a navegação "Anterior/Próxima"
    dentro de uma questão (`questao-client.tsx`), que reusa a mesma constante pra achar os vizinhos — mesmo
    comportamento de antes, só com uma janela de contexto menor.
- Navegação: "Histórico" entrou em `ITENS_NAV` (ícone `History`) e em `ROTAS_PROTEGIDAS`/`matcher` do `proxy.ts`. A
  barra inferior do celular passou a ter 6 itens — ver nota no `CONTRATO_PARIDADE.md` sobre o "Mais" que a P4 pede
  quando Desempenho também entrar.
- `npm run audit:contraste`, `test:a11y` e `e2e/console-limpo.spec.ts` ampliados com `/historico` nas listas de
  rotas — todos voltaram a zero falhas/100% depois da mudança (108 testes de a11y, 42 de console limpo, 200 e2e no
  total, incluindo os specs de Questões e Simulados que já existiam).

**Etapa P2 (paridade: primeiros passos e início)**
- **`/boas-vindas`** (4 passos: Exame, Foco, Rotina, Aparência): progresso salvo a cada avanço em
  `localStorage["gabaritei:boas-vindas:passo"]`. **Bug real corrigido**: o `useState` inicial lia esse
  `localStorage` direto no inicializador (`useState(() => lerPassoSalvo())`) — no servidor `window` não existe, então
  SSR sempre renderizava "Passo 1 de 4", e o cliente, na hidratação, já lia o passo salvo (ex.: "Passo 2") no mesmo
  primeiro render, causando "Hydration failed because the server rendered text didn't match the client" de verdade
  (reproduzido e confirmado no navegador). Corrigido pro padrão já usado em `use-aparencia.ts`: `useState(0)` (igual
  ao servidor) e restaura o valor salvo num `useEffect` só depois de montar (`eslint-disable-next-line
  react-hooks/set-state-in-effect`, mesma exceção documentada lá).
- **Bug real corrigido**: `salvarAparenciaCampo` (passo 4, Aparência) aplicava a mudança no DOM (`aplicarAparencia`)
  e persistia na API, mas nunca atualizava o estado React local — o radiogroup da `SeletorPaleta` continuava
  mostrando a paleta antiga depois de clicar, mesmo a tela inteira já tendo repintado. Corrigido com o mesmo padrão
  de override otimista já usado em `configuracoes-client.tsx` (`aparenciaLocal`, `const preferencias = aparenciaLocal
  ?? data`). Confirmado de verdade no navegador (clicar "Oceano" já marca o check na hora, sobrevive a reload).
- **`SeletorPaleta`** extraído de `configuracoes-client.tsx` pra `components/dominio/seletor-paleta.tsx` — reusado
  sem mudança de lógica no passo 4 de `/boas-vindas` (regra "evolua, não duplique").
- **`NotaNeutra`** (`components/dominio/nota-neutra.tsx`, novo): par neutro de `CriterioRecomendacao` — mesma função
  (explicar o critério), sem o selo de IA, pra quando `RecomendacaoResposta.modelo` vem `null` (regra 9: âmbar
  exclusivo de "decidido por IA de verdade"). Hoje só acontece em `iniciarSessao({modo:'auto'})` sem reforço
  suficiente (cai no modo tema, `modelDriven: false`).
- **Selo de IA agora chega até a tela de Treino de verdade**: até esta etapa, `salvarFilaSessao` guardava só
  `{itens, aviso}` — o campo `modelo` de `RecomendacaoResposta` nunca era persistido nem lido em nenhum lugar, então
  `sessao-client.tsx` sempre renderizava `CriterioRecomendacao` (âmbar) incondicionalmente, mesmo quando a
  recomendação não veio de um modelo. Isso seria uma violação de verdade da regra 9 assim que "Deixar o modelo
  escolher" existisse. Corrigido: `FilaSalva` ganhou o campo `modelo` (`sessao-client.tsx`), todo chamador de
  `salvarFilaSessao` agora repassa `primeira.modelo` (`treino-client.tsx`, `inicio-client.tsx` ×2,
  `boas-vindas-client.tsx`, mais os dois seeds de `mock/cenarios.ts`, que passam `MODELO_MOCK` — são sessões
  "normais", não automáticas), e a tela de sessão escolhe `CriterioRecomendacao` ou `NotaNeutra` com base nisso.
- **`FoguinhoBadge` ganhou a prop `dentroDaFaixa`**: a faixa principal do Início (seção 4.3) tem fundo
  `--brand-hover`/`--brand-soft`, diferente do fundo normal da página — os tokens `--brand`/`--ink`/`--ink-2` que o
  Foguinho usa por padrão não têm contraste garantido nesse fundo (pensados pro `--paper` normal). **Achado de
  verdade rodando `npm run audit:contraste`**: 4 falhas reais (ícone, número, "dias", "Melhor:", texto de estado),
  repetidas em Floresta e Oceano, claro e escuro — texto escuro sobre fundo escuro. Corrigido com
  `dentroDaFaixa?: boolean`: quando ligado, todo texto/ícone vira `text-current` (herda a cor que a própria faixa já
  escolheu por tema), em vez dos tokens fixos. Nenhuma informação passa a depender só da cor: o estado continua
  distinguível pelo preenchimento do ícone (`fill-current` só quando "acesa") e pelo texto (seção 4.3: "nenhuma
  informação depende só do acento"). `audit:contraste` voltou a zero falhas nas 5 paletas × 2 temas depois do
  conserto.
- **`WeekStrip`** ganhou destaque do dia de hoje (seção 6, P2, item 6: "hoje destacado pelo acento e por texto"):
  anel `ring-accent` no quadrado do dia mais o rótulo "hoje" abaixo — nunca só a cor.
- **`AnelProgresso`** (`components/ui/anel-progresso.tsx`, novo): anel de SVG com o número no centro (meta semanal
  na faixa principal). Usa `currentColor` pro traço preenchido (mesmo motivo do Foguinho acima) — sem token novo,
  sem `--accent` (que também não teria contraste garantido no fundo da faixa).
- **Início reescrito por inteiro** seguindo a seção 6 (P2), de cima pra baixo: faixa principal (atividade em
  andamento via `listarAtividadesEmAndamento`, ou "Bora treinar?"; botão "Deixar o modelo escolher" sempre
  presente), "Seus números" (painel único com divisores, nunca 4 cartões, convite de texto pra conta nova — nenhum
  número inventado), "Continue de onde parou" (até 3, reaproveita a mesma consulta da faixa), "Por onde começar"
  (só conta nova, antigo `BlocoEscolherAreaETema` reaproveitado quase como estava), "Reforço prioritário" (antigo
  `BlocoReforco`, sem mudança de lógica) e "Semana" (`WeekStrip` + meta). O antigo bloco "Retomar" (lia o id da
  última sessão do `localStorage` via `lerSessaoAtivaId`, documentado como gambiarra na Etapa 3) foi substituído
  pelo "Continue de onde parou", que usa a API de verdade — `lerSessaoAtivaId` ficou sem leitor neste arquivo
  (as chamadas de `salvarSessaoAtivaId` continuam, inofensivas, caso algo volte a precisar).
- **Bug real corrigido, achado por um teste e2e novo (não suposição)**: `BlocoEscolherAreaETema` ("Por onde
  começar") testava só `resumoGeral?.respondidas !== 0` pra decidir se aparecia — com a consulta ainda carregando,
  `resumoGeral` é `undefined`, e `undefined !== 0` é `true`, então o bloco aparecia **pra qualquer conta**, com ou
  sem histórico, durante a janela de carregamento (mesmo bug já existia no código antigo, só nunca foi pego: não
  havia outro botão "Começar treino" competindo na mesma tela). Reproduzido de verdade:
  `e2e\treino.spec.ts`, cenário sem atividade, clicando no primeiro botão "Começar treino" da página — o Playwright
  clicava no botão **deste bloco** (que inicia uma sessão de verdade) em vez do botão da faixa principal (que leva
  pra escolha de modo), porque só o deste bloco já tinha renderizado nesse instante. Corrigido: só mostra depois de
  confirmar `resumoGeral.respondidas === 0` (`resumoGeral === undefined` também esconde, igual durante o
  carregamento).
- **4 testes e2e desatualizados pela mudança de comportamento, corrigidos** (não eram regressão, eram teste
  escrito pro Início antigo): `entrada.spec.ts` (×2) esperava `waitForURL("**/inicio")` direto depois de criar
  conta — conta nova agora tem `onboardingConcluido: false` e vai pra `/boas-vindas` primeiro (comportamento
  correto e pedido pela seção 6); ajustado pra esperar `/boas-vindas` (e, num teste, clicar "Pular por enquanto"
  antes de checar a saudação). `treino.spec.ts` (×2): um esperava `"Recomendado pelo modelo"` visível direto no
  Início (era a prévia da faixa antiga, removida — o resultado agora só aparece na tela de Treino, depois de
  escolher uma ação); reescrito pra clicar "Deixar o modelo escolher" e checar na tela de Treino. O outro esperava
  o texto "Por onde você quer começar?" (pergunta antiga, fora do padrão `Bloco`); a seção 6 nomeia o bloco "Por
  onde começar" — ajustado pro texto novo.
- **`npm run audit:contraste`, `audit:paletas`, `test:a11y` (104), `e2e/console-limpo.spec.ts` (37) e
  `npm run test:e2e` (191) rodados de verdade no fim da etapa** — todos em zero falhas/100% passando, incluindo o
  Início nos cenários `novo`/`ativo`/`parcial`/`esgotado`/`lento` e nas 5 paletas × 2 temas.
- **Textos novos desta etapa, pro grupo revisar** (seção 6, "liste todos os textos novos"): "Bora treinar?";
  "Retome {seu treino/seu simulado/sua lista/seu diagnóstico}{ de <área>}: N de M feitas." (frase montada, não
  literal da API); "Deixar o modelo escolher"; "Retomar treino"/"Retomar simulado"/"Retomar lista"/"Retomar
  diagnóstico"; "Faltam N questões para sua meta."/"Meta da semana concluída."; "Seus números"; "Responda algumas
  questões para ver seus números aqui."; "Questões respondidas"/"N nesta semana"/"Taxa de acerto"/"Simulados
  concluídos"/"Treinos concluídos"; "Continue de onde parou"; "Nada em andamento. Comece um treino e ele aparece
  aqui."; "Por onde começar" (era "Por onde você quer começar?"); rótulo "hoje" no `WeekStrip`.

**Etapa V (calor e identidade, ajuste visual)**
- Nada de lógica/contrato/rota mudou nesta etapa, só apresentação e texto, como pedido. Onde uma mudança de texto intencional (saudação, convite por tema) invalidava uma asserção de teste e2e existente, só a asserção de texto foi atualizada — nenhum comportamento verificado por esses testes mudou (`e2e/treino.spec.ts`).
- **`--font-display`** (`styles/globals.css`): título de tela (`h1`/`h2`/`h3`) e número grande isolados num token à parte de `--font-serif`, que continua exclusivo da marca ("Gabaritei" no cabeçalho/sidebar) e do enunciado da questão. Valor inicial = o mesmo `--font-serif` de antes (nada mudou visualmente); a troca por IBM Plex Sans 600 nos títulos é uma decisão de grupo ainda não tomada (ver seção "decisões opcionais" do prompt desta etapa) — trocar é uma linha só, `--font-display: var(--font-sans);`.
- **Raio e alvo de toque maiores** (`styles/globals.css`): `--radius-xs` 4→8px, `--radius-sm` 6→12px, `--radius-md` 8→18px. Todo `min-h-11`/`size-11` (44px) virou `min-h-12`/`size-12` (48px) — troca mecânica em 18 arquivos, sem mudar nenhuma lógica de clique.
- **`AreaTile`** (`components/dominio/area-tile.tsx`): ladrilho de área com ícone + fundo `*-soft` + texto na cor da área, controle de verdade (`CheckboxPrimitive.Root`, não `div` com clique), estado selecionado com borda + ícone de check (nunca só cor). Usado no Início (sem histórico), Treino (chips de área) e Simulados (escopo "Uma área" e "Personalizado") — substituindo `Checkbox` + `AreaTag` nesses 3 lugares. **Amplia a regra de `--area-*` só em `AreaTag`/filetes** — ver item 13 das decisões em aberto, acima, pro grupo ratificar.
- **Botão "inverso"** (`components/ui/button.tsx`, `icon-button.tsx`): variante nova (`bg-paper text-forest-ink`) só pro botão grande da faixa verde-floresta sólida do Início. A variante "primario" (`bg-forest`) quase some em cima de `--forest-ink` no tema escuro, porque as duas cores são **idênticas** nesse tema (`#6bbe90`) — não dava pra reaproveitar.
- **Foguinho com 3 estados** (`components/dominio/foguinho-badge.tsx`): "acesa" (já contou hoje), "em espera" (sequência preservada, ainda não contou), "zerada" (`atual === 0`) — todos derivados dos campos que já existiam em `Regularidade.foguinho` (`atual`, `hojeContou`, `emRisco`), sem mudar o contrato. Nunca usa os termos "apagou"/"quebrou" (informativo, nunca punitivo — já era regra, reforçado aqui). Pequena animação (scale) só na transição "ainda não contou" → "já conta", respeitando `prefers-reduced-motion` via `motion-safe-transition`.
- **Chip "Demonstração"** (`components/dominio/demo-chip.tsx`): adicionado dentro de `QuestionView`, aparece em toda questão quando `apiMode() === "mock"`. A faixa global (`DemoBanner`) continua existindo (nunca removida — regra 8, seção 2), só mais discreta (`text-xs`, menos padding).
- **Enunciados do mock reescritos** (`lib/api/mock/dados.ts`, `construirEnunciado`): tiramos o parêntese "(Conteúdo fictício, gerado para fins de desenvolvimento...)" de dentro do enunciado — esse aviso agora vive só no chip por questão + na faixa global, não repetido em toda questão. Texto mais curto e natural ("Considere X para responder à questão a seguir." / "Assinale a alternativa correta."), sem o prefixo "Questão de demonstração N".
- **Bug real corrigido**: `trecho` do `QuestaoResumo` (usado na lista de `/questoes`) cortava o enunciado com `.slice(0, 140)`, que corta no meio de uma palavra sem reticências — exatamente o "enunciado cortado no meio" apontado no diagnóstico. Trocado por `truncarNaPalavra` (novo, `lib/format.ts`), que corta no último espaço antes do limite e acrescenta "…". A lista já envolvia o texto em `line-clamp-2` (CSS), que por si só não causava o corte — o bug era na geração do texto, não no CSS.
- **Bug real corrigido**: `mock/client.ts`, `entrar()` gerava `nome: email.split("@")[0]` pra contas sem `estado.perfil` salvo (ex.: `aluno@teste.com` → "aluno"; e-mails com sobrenome no prefixo produziam saudações estranhas tipo "Olá, santoz"). Trocado por um nome fixo de demonstração ("Marina").
- **Anel de foco no `h1` programático** (`styles/globals.css`): `FocoNoH1` (seção 8) chama `h1.focus()` em toda troca de rota; como esse `h1` tem `tabindex="-1"` (nunca alcançado pelo Tab), a heurística de `:focus-visible` do navegador às vezes mostra o anel mesmo quando a navegação veio de um clique de mouse. Exceção documentada e escopada: `h1[tabindex="-1"]:focus-visible { outline: none; }` — não relaxa a regra geral (`:focus-visible` continua com anel em todo elemento de verdade interativo).
- Tirado o "ENEM · FUVEST e UNICAMP em breve" da sidebar (`components/layout/sidebar.tsx`) — escopo da Fase 1 é só ENEM (seção 1 do prompt), a menção às outras provas não tinha link nem função, só ruído.
- **`npm run check:regras`** (`scripts/check-regras.ts`, novo): varredura estática das regras 4 a 9 (gradiente/blur, roxo, caixa alta com tracking, âmbar fora de `CriterioRecomendacao`, gamificação fora de escopo, travessão/meio-ponto como separador em texto visível). Não substitui revisão humana — o próprio script documenta isso — mas pega regressão óbvia automaticamente a cada etapa. Marcador `// check-regras: ignore` (ou `{/* ... check-regras: ignore */}`) na linha ou na linha anterior pra exceções já revisadas conscientemente (ex.: os 3 "—" usados como placeholder de valor ausente em `perfil-client.tsx`/`resumo-client.tsx`, não como separador — ver decisão da varredura da paridade).
- Os dois avisos de console encontrados nesta etapa (`RadioGroup` não controlado→controlado, hidratação do `h1` do Treino) foram corrigidos na etapa de arrumação logo a seguir — ver abaixo.

**Etapa de arrumação (pós etapa V, sem mudar visual)**
- **Bug real corrigido**: `AlternativasRadio` (`components/dominio/alternativas-radio.tsx`) passava `value={respostaMarcada ?? undefined}` pro `RadioGroupPrimitive.Root` do Radix — alternava entre `undefined` (não controlado) e uma `Letra` de verdade (controlado) assim que o estudante respondia, disparando "RadioGroup is changing from uncontrolled to controlled" no console. Corrigido pra `value={respostaMarcada ?? ""}`: `""` nunca bate com nenhuma letra (A–E), mesmo efeito visual, mas o componente fica controlado desde o primeiro render.
- **Bug real corrigido**: `PageHeader` (`components/layout/page-header.tsx`) era o único `h1` do app sem `tabIndex={-1}` direto no JSX — dependia inteiramente do fallback imperativo (`h1.setAttribute("tabindex", "-1")`) de `FocoNoH1`, causando aviso de divergência de hidratação nas rotas que usam `PageHeader` (Treino, Questões, Simulados, Perfil). Corrigido: `tabIndex={-1}` direto no JSX, igual a todo outro `h1` do app. `FocoNoH1` foi simplificado (só `h1?.focus()`, sem mais `setAttribute`) já que todo `h1` agora declara o atributo na primeira renderização.
- **`e2e/console-limpo.spec.ts`** (novo, 37 testes): zero erro e zero aviso de console, em toda rota pública e autenticada, nos cenários novo/ativo/parcial/esgotado/lento (não inclui "erro" nem "sem-permissao": esses dois **deveriam** gerar erro de propósito, não fazem sentido numa checagem de "console limpo"), mais os 2 fluxos dinâmicos completos (sessão de treino até o resumo, simulado até a correção).
- **`npm run check:regras` bem mais abrangente** (`scripts/check-regras.ts`): além do que já tinha (travessão/meio-ponto, caixa alta/tracking, âmbar fora de IA, gamificação fora de escopo), agora cobre também: traço médio "–" e seta (→⇒➜➔⟶) como separador; `outline: none`/`outline-none` fora da exceção documentada; `transition: all`/`transition-all` (só transform/opacity, regra 10); `backdrop-filter` explícito; `letter-spacing` literal; `tracking-[valor arbitrário]`; e, o mais novo, **cor literal fora dos tokens** (hex, `rgb()`, `rgba()`, `hsl()`, `hsla()` fora de `tokens.css`/`globals.css`) com **cálculo de matiz de verdade** — qualquer hex cuja matiz caia entre 250° e 320° é sinalizado como roxo/violeta, mesmo sem usar a palavra. 3 achados reais nessa expansão:
  1. `form-error-summary.tsx` tinha `outline-none` num `<div tabIndex={-1}>` que recebe foco programático depois de um envio de formulário falhar — suprimia o próprio anel de foco **sem nenhum substituto**, ao contrário do caso do `h1` (lá a supressão é intencional porque o anel não deveria aparecer; aqui o anel é exatamente o que o usuário precisa ver). Corrigido: removido o `outline-none`, o anel padrão (`:focus-visible`) volta a aparecer.
  2. `combo-meter.tsx` usava seta pra mostrar a progressão de dificuldade ("fácil → média → difícil"). Reescrito sem seta: "começa fácil, passa por média, chega a difícil".
  3. `layout.tsx` (`themeColor`) é uma exceção legítima (cor literal exigida pela API de metadado do Next.js, fora da cascata CSS) — marcada com `check-regras: ignore`. (O atalho "A–E" de `sessao-client.tsx` citado aqui originalmente foi reescrito pra "A a E" na P1, passo das "duas correções pequenas" — não precisa mais da exceção.)
- **`scripts/auditar-contraste.ts` consertado de verdade**, não só com timeout maior: os dois fluxos dinâmicos (`medirSessaoDeTreino`, `medirSimulado`) tinham um `page.waitForTimeout(500)` fixo antes de interagir com a primeira alternativa — às vezes insuficiente sob mais contenção de recursos (muitos navegadores abertos na mesma auditoria), fazendo o script não achar nenhum `[role="radio"]`. Trocado por `page.waitForSelector('[role="radio"]')`: espera o conteúdo de verdade aparecer, não um tempo fixo que pode não bastar.
- **`e2e/capturas/etapa-v/`** (novo, via `npm run capturar:telas` → `scripts/capturar-telas.ts`): 20 capturas de tela de verdade (PNG, não só vistas no navegador) — Início (cenários novo e ativo), Treino, Questões, Simulados, nos dois temas e nas duas larguras (1280 e 360px). Linha de base "antes" da paridade P1.
- **Prova automatizada** (`e2e/entrada.spec.ts`, "conta criada como 'Marina'..."): cria conta de verdade pelo formulário de cadastro com o nome "Marina", confirma que o Início saúda com um dos 3 prefixos de horário + "Marina", e calcula o contraste de verdade (mesma fórmula WCAG do `auditar-contraste.ts`) do `DemoBanner`, exigindo ≥ 4,5:1.
- Confirmado por auditoria de código (não só memória): todo `h1`/`h2` do app passa pelo token `--font-display` via a regra global `h1,h2,h3{font-family:var(--font-display)}` (`styles/globals.css`) — nenhum tem uma classe `font-serif` conflitante por cima. A única exceção é o `h1` do `FocusShell` (modo foco), que usa `font-sans` de propósito (título compacto de barra, não editorial) — pré-existente, não é uma falha do token.
- A contagem de `npm run test:a11y` (32 testes) está certa e sempre esteve: 5 rotas públicas × 2 temas (10) + 6 rotas autenticadas × 2 temas (12) + 2 fluxos de treino × 2 temas (4) + 3 fluxos de simulado × 2 temas (6) = 32. Uma fala anterior, num resumo pro usuário, citou "36" por engano de conta mental — não houve nenhuma remoção de teste entre as etapas; toda execução real sempre imprimiu 32.
- **Fluxo de trabalho em git, a partir de agora**: branch por etapa (`etapa-v-arrumacao` nesta, `paridade-p1` na próxima, etc.), nunca mais push direto na `main`. `origin` é `https://github.com/italodsz/Gabaritei---PI-VI.git` — público (confirmado por print do usuário), não é possível mudar a visibilidade por aqui (ver decisão da Etapa V/push anterior).

**Etapa 5**
- Perfil (`/perfil`) reusa os mesmos blocos/consultas do Início e do resultado do simulado (Foguinho, `WeekStrip`, `ProgressToMinimum`, lista de reforço) — nada de lógica nova, só uma composição mais completa dessas peças numa tela só, como pede a seção 10.5 ("versão enxuta do acompanhamento").
- Preferências salvam campo a campo, sem botão global: cada controle tem seu próprio indicativo `aria-live` ("Salvando…"/"Salvo"), igual ao padrão já usado no simulado para "Salvo"/"Salvando" por questão.
- Trocar o tema em "Aparência" chama `aplicarTema` (já existente em `lib/hooks/use-tema.ts`) direto, pelo mesmo motivo do `ThemeToggle` da galeria de componentes: aplicar na hora, sem esperar a resposta da API. `atualizarPreferencias({ tema })` roda em paralelo só para persistir no "servidor" (mock). As duas fontes (localStorage `gabaritei:tema` e a preferência da API) ficam sincronizadas a cada troca.
- A tabela de proficiência por área tem `<caption>` (pedido da seção 10.5: "`<table>` com `caption`"), mas o texto fica escondido visualmente num `<span className="sr-only">` **dentro** do caption, por precaução: `<caption>` tem `display: table-caption`, que em alguns motores não respeita bem `position: absolute` aplicado direto nele. O título visível "Proficiência por área" já é o `h2` da seção logo acima, por isso o caption some visualmente para não duplicar o mesmo texto na tela.
- Estado de conta nova: nenhum número é inventado — "Seus números" vira um convite de texto em vez de mostrar 0/0/0/0%; a tabela de proficiência e o reforço já tratavam isso via `ProgressToMinimum` (reaproveitado, não precisou de tela nova). Verificado de verdade no navegador trocando para o cenário "Novo".
- `scripts/auditar-contraste.ts`: os tempos fixos de espera no fluxo de sessão de treino (`medirSessaoDeTreino`) foram aumentados (5 s → 15 s no botão "Próxima questão"/"Ver resumo", 10 s → 20 s no `waitForURL` do resumo) depois de ficarem instáveis nesta etapa — a auditoria agora abre mais navegadores em sequência (treino **e** simulado) e o fluxo mais tardio sofre mais contenção de recursos. Não é um bug da tela, só folga a mais pro script. (Atualização, etapa de arrumação: a causa raiz era um `waitForTimeout` fixo diferente, mais cedo no mesmo fluxo — ver a entrada da etapa de arrumação, acima, pro conserto de verdade.)
- **Bug real corrigido, achado testando a 360px**: `AppShell` (`components/layout/app-shell.tsx`) envolve o conteúdo num `<div className="flex-1">` sem `min-w-0`. Flexbox não encolhe um `flex-1` abaixo do min-content do que tem dentro por padrão; a tabela de proficiência do Perfil (4 colunas, texto que não quebra linha) tem um min-content maior que 360px, e isso empurrava a coluna inteira (cabeçalho, `main`, barra inferior) pra fora da tela — rolagem horizontal mesmo com a tabela já embrulhada no próprio `overflow-x-auto`. Corrigido com `min-w-0` nesse `div` do `AppShell`; conserta de uma vez pra qualquer tela futura com conteúdo largo (tabela, código, etc.), não só o Perfil.
- **Varredura final da seção 2 (regras 4 a 9) em todo `src/`**, pedida pelo grupo depois do resumo da Etapa 5 — achou 2 problemas reais que tinham passado despercebidos em etapas anteriores:
  1. `cadastrar-client.tsx` (tela 2, Etapa 1): o aviso "Modo de demonstração: nenhum e-mail é enviado de verdade" usava o estilo âmbar (`border-l-amber bg-amber-soft text-amber-ink`). Âmbar é exclusivo de "isto foi decidido por IA" (seção 2, regra 9: "não aparece em mais nada, nem em alertas") — esse aviso não é conteúdo de IA. Trocado pro mesmo estilo neutro já usado em avisos parecidos (`border-l-rule-strong bg-paper-2 text-ink-2`, igual ao de `treino-client.tsx` e `sessao-client.tsx`).
  2. `resumo-client.tsx` (tela 6, Etapa 3): a linha de proficiência por área ainda juntava o valor e a tendência com travessão (`` ` — ${ROTULO_TENDENCIA[...]}` ``) — a mesma tela de resultado do simulado (`resultado-client.tsx`, Etapa 4) já tinha sido escrita certo, com a tendência entre parênteses, mas essa tela mais antiga (Etapa 3) nunca foi revisitada com essa regra em mente. Corrigido pro mesmo formato com parênteses.
  - Também corrigidos travessões usados como separador de frase em texto visível ao usuário (regra 6): o próprio `DemoBanner` (aparece em toda página), a mensagem de erro "sessão não disponível" do treino, o enunciado de toda questão do mock (`mock/dados.ts`), e os títulos da galeria `/dev/componentes` (só dev, mas por completude). Trocados por dois-pontos ou frase separada, nunca travessão.
  - **Deixados como estão, de propósito**: três lugares usam um travessão isolado "—" como valor de campo vazio (`perfil-client.tsx` e `resumo-client.tsx`, taxa de acerto/duração quando `null`) — não é um separador juntando dois textos, é um placeholder de "sem dado", o mesmo papel que "—" cumpre em tabelas fora da web. É uma leitura razoável da regra, mas é uma zona cinzenta: o padrão mais usado no resto do app pra dado ausente é a palavra "não informado" (ex.: `AreaTag`/habilidade/ano da questão), então esse "—" é tecnicamente inconsistente com essa convenção, mesmo não violando a regra do travessão-separador ao pé da letra. Fica como pendência de estilo pro grupo decidir, não um bug.

**Etapa 4**
- `QuestionView` ganhou a prop `mostrarBotaoEnviar` (default `true`): no simulado (tela 10) a resposta salva ao escolher a alternativa, sem botão "Enviar" nem correção na hora (RF05, RF06), diferente de Treino/Questões. Achado testando de verdade no navegador: a primeira versão mostrava o botão "Enviar resposta" dentro do simulado.
- **Bug real corrigido**: `finalizarSimulado` (`lib/api/mock/client.ts`) gerava `Tentativa.id` com `proximoId("tentativa")` mas a `correcao.tentativaId` aninhada usava o padrão `` `simulado-${id}-${item.n}` `` — os dois IDs nunca batiam. Corrigido pra usar o mesmo ID nos dois lugares. Isso importa porque a tela 12 (correção por questão) busca a tentativa por esse ID pra pegar a `resolucao`, que não vem em `ResultadoSimulado.itens`.
- Tela 12 (`/simulados/[id]/questao/[n]`): "Anterior"/"Próxima" navegam por **todas** as posições `n` do simulado, não respeitam o filtro (Todas/Erradas/Em branco/Marcadas) que o estudante tinha escolhido no Cartão-resposta da tela de resultado — esse filtro é só estado local da tela 11, não vai pra URL. Simplificação aceita por ora; se o grupo quiser preservar o filtro ao navegar, dá pra levar o filtro como query param.
- Tela 11 (resultado): os botões "Novo simulado" e "Voltar a Simulados" levam para a mesma rota (`/simulados`) — redundância pequena, aceita como simplificação (o primeiro comunica a intenção, o segundo só sai da tela).
- **Achado durante o teste manual no navegador que acabou não sendo um bug real**: um script de automação (não o app) clicou em várias questões rápido demais sem esperar o React re-renderizar entre cliques, fazendo parecer que só a resposta da questão 1 salvava. Refeito o teste clicando e aguardando a cada questão: as 10 respostas, a marcação "para revisar" e o resumo do modal "Finalizar simulado?" bateram certo o tempo todo. Mock (`salvarRespostaSimulado`, `marcarRevisao`) e o cliente (`aoSelecionar`, `aoMarcar`) estão corretos.

**Etapa 3**
- `obterSessao` (seção 7.2) não tem equivalente a "listar sessões em andamento" — não dá pra saber se existe um treino pausado sem já ter o id. O bloco "Retomar" do Início guarda o último id de sessão no localStorage do navegador (`lib/sessao-ativa.ts`, fora da `Api`) e confirma com `obterSessao` se ainda está em aberto. Sugestão pro grupo: um endpoint de sessão em andamento de verdade, pra isso funcionar entre aparelhos/abas.
- Pelo mesmo motivo, a lista de questões de uma sessão (`primeira.itens` de `iniciarSessao`) é guardada no `sessionStorage` da aba (chave por `sessaoId`) entre a tela de escolher modo e a tela de sessão — se a aba for recarregada no meio do treino, a lista some e a tela mostra um erro orientando a escolher o modo de novo (o que já foi respondido continua salvo no servidor).
- **3 bugs reais encontrados testando no navegador** (não eram só suposição, apareceram de verdade):
  1. No modo progressão, a próxima questão gerada depois de cada resposta (`enviarResposta` → `proxima`) ignorava a área escolhida no início da sessão — misturava questões de qualquer área. Corrigido guardando o pedido original em `SessaoInterna.pedido` (`lib/api/mock/estado.ts`) e reaproveitando as áreas dele.
  2. O painel "Nesta sessão" (acertos/erros) na tela de sessão não atualizava depois de cada resposta — a sessão só era buscada uma vez. Corrigido rebuscando `obterSessao` depois de cada envio.
  3. A tela de sessão (casca de foco) não tinha nenhum `h1` — accessibilidade pegou isso (`page-has-heading-one`). Corrigido: `FocusShell` agora usa o próprio título da barra superior como `h1`.
- O campo de tema (modo "Por tema") e a Combobox de habilidade (modo "Por habilidade") ficam **fora** do `RadioCard` do modo correspondente, não dentro: um `RadioCard` é um `<button role="radio">`, e um botão não pode conter outro controle focável (`nested-interactive` no axe). Mostrar/esconder é feito por `modo === "tema"` / `modo === "habilidade"` logo abaixo do grupo de rádio.

**Etapa 0**
- `iniciarSessao` no mock devolve, em `primeira.itens`, a **lista completa** de questões da sessão (até `quantidade`, não só 5), construída internamente em lotes de até 5 chamadas ao motor de recomendação. A seção 7.3 diz "o motor devolve até 5 questões por chamada" — interpretamos isso como um detalhe do lote interno, não um limite exposto em `iniciarSessao`. Quando a FastAPI existir, confirmar com o time de back-end se esse é o comportamento esperado ou se o front deve paginar/buscar mais lotes durante a sessão.
- `next.config.ts` do `create-next-app` vinha com `cacheComponents: true` e `partialPrefetching: true` (recursos experimentais do Next 16 canary). Removidos nesta etapa por estabilidade — não pedidos pelo prompt.

**Etapa 2**
- `listarQuestoes` não tem parâmetro de ordenação no contrato (seção 7.2). A tela de Questões ordena só a **página atual** (20 itens já paginados), não o banco inteiro antes de paginar — ver `ordenarQuestoes` em `lib/questoes-filtros.ts`. Pode dar uma ordenação "quebrada" entre páginas (ex.: a última questão da página 1 não é necessariamente mais recente que a primeira da página 2). Se isso incomodar, o jeito certo é a API aceitar um parâmetro de ordenação antes de paginar.
- "Anterior"/"Próxima" na tela de questão (RF04) só existem quando a questão foi aberta a partir do banco (`?de=questoes&<filtros>`): a tela refaz a mesma busca com os mesmos filtros pra saber a posição atual e os vizinhos. Abrir uma questão direto pela URL (sem vir da lista) não mostra esses links — está certo, mas é bom o grupo saber que a navegação depende desse parâmetro.

**Etapa 1**
- `src/middleware.ts` virou `src/proxy.ts` (Next.js 16 renomeou a convenção; mesmo comportamento, só o nome do arquivo e da função exportada mudaram de `middleware` para `proxy`).
- Como o mock não envia e-mail de verdade, a tela "Confira seu e-mail" do cadastro tem um botão extra "Já confirmei, continuar" que avança para `/inicio` — deixado claro na tela como comportamento de demonstração ("Modo de demonstração: nenhum e-mail é enviado de verdade."). `cadastrar()` já autentica a conta no mock (não existe um estado real de "aguardando confirmação"); quando o Supabase Auth entrar, essa tela provavelmente precisa esperar o clique no link do e-mail de verdade antes de liberar o acesso.
- "Muitas tentativas" (tela 1) é hoje só uma contagem no front (3 tentativas erradas seguidas bloqueiam o botão por 30 s) — não existe limitação de taxa no back-end ainda. Confirmar com o grupo se esse número/tempo fazem sentido ou se o rate-limit real vem do Supabase.
- `/termos` e `/privacidade` repetem a mesma estrutura de seções (só os títulos mudam) via um componente compartilhado `SecaoLegal` — o texto de cada seção continua 100% `TODO(equipe)`.

## Tipos novos fora da seção 7

Nenhum tipo novo foi adicionado a `lib/api/types.ts` além do que está na seção 7.1 do prompt. Tipos auxiliares internos do mock (`TentativaRegistrada`, `ContextoRecomendacao`, `EstadoMock`, `SessaoInterna` etc., em `lib/api/mock/`) não fazem parte do contrato público e não precisam de aprovação — somem quando a implementação `http/` entrar em uso.

## Testes manuais (seção 11) — ainda não feitos

- Leitor de tela real (NVDA ou VoiceOver) nos fluxos de entrar, criar conta e o treino completo (quando a Etapa 3 existir).
- Celular de verdade.
- Safari e Firefox (o build foi testado em Chromium via Playwright).
