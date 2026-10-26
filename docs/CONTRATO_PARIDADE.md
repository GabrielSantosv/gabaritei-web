# Contrato de paridade — pendências para a FastAPI

Lista curta e viva (seção 5 do `docs/FRONTEND_PARIDADE.md`): o que o mock já implementa por inteiro, mas o back-end
real ainda não prometeu. Atualizada ao fim de cada etapa P*.

## P2 (Primeiros passos e Início)

- **`listarAtividadesEmAndamento()`** (`GET /atividades/em-andamento`): implementado no mock derivando de
  `estado.sessoes`/`estado.simulados` (até 3, mais recente primeiro). O tipo já inclui `'lista'` e `'diagnostico'`
  (seção 5), mas **nenhuma rota do front ainda existe pra esses dois tipos** — são Fase 2. O Início (faixa principal
  e "Continue de onde parou") já sabe desenhar ícone e texto pra eles, mas o botão "Retomar lista"/"Retomar
  diagnóstico" não tem destino: por ora não renderiza link nenhum nesse caso (`ROTULO_TIPO[...].rota` devolve
  `null`), só o texto. Preencher assim que as rotas existirem.
- **`iniciarSessao({ modo: 'auto' })`** (`POST /sessoes`): o mock resolve o modo de verdade (hoje: prioridade de
  reforço se houver sinal suficiente, senão modo tema) via `escolherModoAutomatico` (`lib/api/mock/engine.ts`) e
  devolve `modelo: null` quando a escolha foi por regra simples (sem reforço ainda) — é esse campo que decide se o
  Treino mostra `CriterioRecomendacao` (âmbar) ou `NotaNeutra` (seção 2, regra 9). A FastAPI real precisa manter essa
  mesma distinção no campo `modelo` de `RecomendacaoResposta`, não só pro modo automático — todo `iniciarSessao`
  precisa devolver `modelo: null` sempre que a recomendação não veio de um modelo de verdade.
- **"Modo padrão de treino"**: a seção 6 (P2, item 1) pede que "Começar treino" (faixa principal, sem atividade em
  andamento) "abra o modo padrão das Configurações, senão a escolha de modo" — mas `modoPadraoTreino` e
  `quantidadePadrao` **não fazem parte do contrato atual de `Preferencias`** (a seção 5 só os cita comentados, como
  "campos de F3 da Fase 2"). Sem esse campo, "Começar treino" hoje sempre leva pra escolha de modo (`/treino`).
  Quando o campo existir, ligar aqui (`src/app/(app)/inicio/inicio-client.tsx`, função `comecarTreino`).
- **`atualizarPerfil(parcial)`** (`PATCH /me`): usado pelos Primeiros passos (marca `onboardingConcluido`) e por uma
  futura tela de apelido (ainda não existe — P3). Implementado no mock.
- **`ResumoGeral`**: os três campos novos (`simuladosConcluidos`, `sessoesConcluidas`, `respondidasSemana`)
  implementados no mock a partir do estado local; a janela de "semana" usa os últimos 7 dias incluindo hoje, mesma
  janela do `WeekStrip`/`Regularidade.semana`. Confirmar com o back-end se a semana deve ser corrida (últimos 7 dias)
  ou de calendário (segunda a domingo) — o mock assume corrida.
- **"Dias de estudo por semana"** (Primeiros passos, passo 3, campo opcional de 1 a 7): **coletado na tela, mas não
  persistido em lugar nenhum** — não existe campo correspondente em `Preferencias` nem em nenhum outro tipo da
  seção 5. O valor é descartado ao enviar o formulário (`src/app/(foco)/boas-vindas/boas-vindas-client.tsx`, função
  `finalizar`, não inclui `diasEstudo` na chamada a `atualizarPreferencias`). Precisa de um campo novo no contrato
  antes de poder salvar de verdade.

## Desempenho e Assunto no Treino (pedido à parte, imagem de referência)

- **`Habilidade` ganhou `area: Area` e `assunto: string` obrigatórios** — fecha a pendência já documentada (decisão 6b
  do PENDENCIAS.md: a habilidade não guardava a própria área). `assunto` é conceito novo, sem equivalente na seção 5
  do prompt de paridade: o nível entre área e habilidade que a tela de Desempenho usa pra agrupar (ex.: Matemática →
  Geometria → H47, H48, H49). **Lista de assuntos por área é só de exemplo** (`lib/api/mock/dados.ts`, `ASSUNTOS`),
  inspirada nos eixos reais do ENEM mas não conferida com a Matriz de Referência oficial — mesmo aviso que já valia
  pros códigos de habilidade. Evitamos propositalmente escrever "Competência N da Matriz do ENEM" na tela (apareceria
  na imagem de referência) por não ter como confirmar o número de verdade — regra de não inventar dado (seção 2).
- **`obterDesempenho(area, periodo)`** (mock): respondidas/acertos/taxa por área, por assunto e por habilidade, mais
  tendência (metade mais antiga vs. mais recente das respostas do período, comparando taxa de acerto — "subindo" ⩾10
  pontos percentuais, "caindo" ⩽-10, senão "estável"; menos de 5 respostas = sem tendência). Tudo client-side, a
  partir de `estado.tentativas` — a API real provavelmente vai querer isso pré-calculado no back-end.
- **`PedidoRecomendacao.habilidades?: string[]`** (plural, convive com `habilidade` singular): "treinar o assunto
  inteiro" — filtro universal no motor (`engine.ts`), vale pra qualquer modo (tema, habilidade, nível, progressão),
  não só "Por habilidade".
- **Treino ganhou a seção "Assunto"**: só aparece com uma única área escolhida, ladrilhos com taxa de acerto (ou
  "Poucos dados") e destaque "Mais fraco"; filtra a Combobox de habilidade, aparece no "Resumo do treino", e o
  `motivo` do cartão "Por habilidade" agora cita assunto + habilidade do reforço atual.
- **Banco de questões crescido** de 60 pra 400 (`TOTAL_QUESTOES_DEMO`) e habilidades de 6 pra ~14-18 por área, pra
  cada assunto ter volume suficiente pra demonstração — mexe só em dado de mock, não no contrato.
- **Rota nova `/desempenho`** (visão geral por área, nossa) e **`/desempenho/[area]`** (o detalhe, seguindo a imagem
  de referência: filtros de área/período, indicadores, lista de assuntos ordenada do pior pro melhor, habilidades do
  assunto selecionado). "Desempenho" entrou no menu principal e nas rotas protegidas.

## Histórico, resumo do simulado e Questões (pedido à parte, canvas de identidade)

Fora da sequência P1–P5: o usuário pediu, com base no canvas de referência (`docs/identidade/referencia/Telas.dc.html`,
bloco `isHistorico`), uma tela de Histórico nova, o painel "Resumo do simulado" em Simulados e um ajuste visual em
Questões. Pendências de contrato geradas:

- **`listarHistorico`/`ItemHistorico`/`Marcacao`**: implementados no mock, mas **não são o mesmo desenho** da seção 5
  do prompt de paridade (`AtividadeHistorico`, por sessão/lista/simulado) — o canvas mostra tentativa por tentativa,
  agrupada por dia, então criamos `ItemHistorico` (por `Tentativa`) em vez de usar `AtividadeHistorico`. Os dois tipos
  podem conviver (uma aba futura "Atividades" no sentido da seção 5, por sessão, ainda não existe) — o grupo precisa
  decidir se isso vira a aba "Atividades" de verdade ou se os dois ficam.
- **Favoritar e marcar para revisar**: `definirMarcacao` existe no mock e as abas "Favoritas"/"Para revisar" do
  Histórico já leem e filtram por isso — mas **não existe nenhum botão na UI pra favoritar/marcar ainda** (isso é
  P5: "Favoritar e marcar para revisar passam a existir também em treino e questão avulsa"). Por ora, as duas abas só
  mostram dado de demonstração semeado direto no mock (`marcacoesDeExemplo`, `lib/api/mock/cenarios.ts`).
  `TODO(equipe)`: construir os botões quando a P5 entrar.
  Endpoint futuro sugerido: `POST /marcacoes/{questaoId}`.
- **Filtro "Resultado" do Histórico** só aparece na aba "Atividades" (nas outras, o filtro de aba já implica um
  resultado ou não faz sentido) — decisão de UX, não de contrato.
- **Navegação**: "Histórico" entrou no menu principal (`components/layout/nav-itens.ts`) e nas rotas protegidas
  (`src/proxy.ts`). Na barra inferior do celular isso deixou 6 itens de largura igual (`flex-1`) em vez dos 5
  originais — ainda cabe e cada alvo de toque continua ≥ 44 px, mas a seção P4 do prompt já antecipa a solução
  definitiva quando Desempenho também entrar: "no celular, o quinto item da barra vira 'Mais'". Ainda não
  implementado — só os 6 itens lado a lado por enquanto.

## P1 (Movimento e paletas)

Nenhuma pendência de contrato — etapa só de front (paletas, movimento, preferências de aparência, todas já
cobertas pela seção 5).
