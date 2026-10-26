/**
 * Dados fictícios do servidor falso (docs/FRONTEND_PROMPT.md, seção 7.3).
 * Gerados de forma determinística (semente fixa) — mesma saída sempre,
 * no navegador e em `scripts/gerar-mock.ts`. Nunca cole texto de prova real:
 * todo enunciado aqui é inventado e marcado como demonstração.
 */
import type { Area, Bloco, Faixa, Habilidade, Questao } from "../types";

export const SEMENTE = 42;
export const MOCK_MIN_RESPOSTAS = 20; // TODO(equipe): volume mínimo por área (RF09, RF10)
export const TOTAL_QUESTOES_DEMO = 60;

/** Gerador pseudoaleatório determinístico (mulberry32). */
export function criarGerador(semente: number) {
  let estado = semente >>> 0;
  return function aleatorio(): number {
    estado |= 0;
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AREAS: Area[] = ["LC", "CH", "CN", "MT"];

const NOMES_AREA: Record<Area, string> = {
  LC: "Linguagens",
  CH: "Ciências Humanas",
  CN: "Ciências da Natureza",
  MT: "Matemática",
};

/**
 * Habilidades por área, no formato H<n> da Matriz de Referência.
 * TODO(equipe): conferir códigos e descrições com a Matriz oficial antes de publicar.
 */
const DESCRICOES_HABILIDADE: Record<Area, string[]> = {
  LC: [
    "Reconhecer diferentes formas de tratar uma informação na comparação de textos.",
    "Identificar a tese de um texto, considerando sua estrutura argumentativa.",
    "Reconhecer a função social de diferentes gêneros textuais.",
    "Analisar a validade de um argumento a partir das relações lógico-discursivas.",
    "Reconhecer efeitos de sentido decorrentes do uso de recursos linguísticos.",
    "Relacionar informações sobre concepções artísticas e características da produção cultural.",
  ],
  CH: [
    "Compreender a produção e o papel histórico das instituições sociais.",
    "Analisar a influência dos meios de comunicação na construção de valores.",
    "Comparar diferentes pontos de vista sobre um mesmo processo histórico ou geográfico.",
    "Identificar registros de conflitos sociais decorrentes de desigualdades.",
    "Relacionar cidadania e democracia em diferentes conjunturas históricas.",
    "Analisar a geopolítica e as relações de poder entre nações e blocos econômicos.",
  ],
  CN: [
    "Compreender o papel da fotossíntese e da respiração celular no ciclo da matéria.",
    "Associar a solução de problemas do cotidiano a conhecimentos físicos e químicos.",
    "Compreender fenômenos decorrentes da interação entre luz e matéria.",
    "Relacionar informações para compreender a importância da água para a vida.",
    "Analisar fatores socioambientais associados ao uso de recursos energéticos.",
    "Compreender as relações entre os seres vivos e o ambiente em que vivem.",
  ],
  MT: [
    "Resolver situação-problema envolvendo conhecimentos numéricos.",
    "Avaliar propostas de intervenção usando conhecimentos geométricos.",
    "Resolver situação-problema que envolva funções exponenciais ou logarítmicas.",
    "Interpretar informações apresentadas em tabelas e gráficos.",
    "Avaliar a probabilidade de ocorrência de um evento associado a um experimento aleatório.",
    "Utilizar conhecimentos de estatística para analisar dados de pesquisas.",
  ],
};

export function gerarHabilidades(): Habilidade[] {
  const habilidades: Habilidade[] = [];
  let contador = 1;
  for (const area of AREAS) {
    for (const descricao of DESCRICOES_HABILIDADE[area]) {
      habilidades.push({ codigo: `H${contador}`, descricao: `${descricao} (${area})` });
      contador += 1;
    }
  }
  return habilidades;
}

export const HABILIDADES = gerarHabilidades();

export function habilidadesDaArea(area: Area): Habilidade[] {
  const inicio = AREAS.indexOf(area) * DESCRICOES_HABILIDADE[area].length;
  return HABILIDADES.slice(inicio, inicio + DESCRICOES_HABILIDADE[area].length);
}

/** Cortes de dificuldade a partir do parâmetro b. TODO(equipe): cortes por área (RF03). */
export function derivarFaixa(b: number | null): Faixa | null {
  if (b === null) return null;
  if (b < -0.5) return "facil";
  if (b > 0.5) return "dificil";
  return "media";
}

const TEMAS_ENUNCIADO: Record<Area, string[]> = {
  LC: [
    "um texto publicitário sobre consumo consciente",
    "uma tirinha sobre o uso de redes sociais",
    "um poema sobre a vida urbana",
    "uma reportagem sobre variação linguística",
    "um trecho de crônica sobre o cotidiano",
  ],
  CH: [
    "um mapa sobre fluxos migratórios",
    "um excerto sobre a Revolução Industrial",
    "uma charge sobre desigualdade social",
    "um gráfico sobre distribuição de renda",
    "um texto sobre movimentos sociais urbanos",
  ],
  CN: [
    "um experimento sobre decomposição de matéria orgânica",
    "um diagrama do ciclo da água",
    "uma reportagem sobre eficiência energética",
    "um gráfico sobre concentração de poluentes no ar",
    "um esquema sobre cadeias alimentares",
  ],
  MT: [
    "uma tabela de consumo de energia residencial",
    "um gráfico de crescimento populacional",
    "uma planta baixa com escala",
    "uma tabela de juros de um financiamento",
    "um experimento de probabilidade com dados",
  ],
};

function construirEnunciado(indice: number, tema: string, comFigura: boolean, figuraComDescricao: boolean): Bloco[] {
  // Etapa V, item 7: nada de disclaimer no meio do enunciado — o aviso de que é
  // conteúdo de demonstração mora no chip da questão e na faixa global, não aqui.
  // O texto em si é curto e natural, sem o prefixo "Questão de demonstração N".
  const blocos: Bloco[] = [{ tipo: "texto", texto: `Considere ${tema} para responder à questão a seguir.` }];

  if (comFigura) {
    blocos.push({
      tipo: "figura",
      figura: {
        id: `figura-demo-${indice}`,
        src: `/mock/figuras/demo-${(indice % 6) + 1}.svg`,
        alt: figuraComDescricao ? `Ilustração esquemática relacionada a ${tema}.` : null,
        audiodescricao: figuraComDescricao ? `Esquema simplificado relacionado a ${tema}, sem dados reais.` : null,
      },
    });
  }

  blocos.push({ tipo: "texto", texto: "Assinale a alternativa correta." });

  return blocos;
}

function construirAlternativas(indice: number): Questao["alternativas"] {
  const letras: Questao["alternativas"][number]["letra"][] = ["A", "B", "C", "D", "E"];
  return letras.map((letra) => ({
    letra,
    conteudo: [
      { tipo: "texto", texto: `Alternativa ${letra} de demonstração para a questão ${indice}.` },
    ],
  }));
}

function gerarQuestao(indice: number, aleatorio: () => number): Questao {
  const area = AREAS[indice % AREAS.length];
  const temas = TEMAS_ENUNCIADO[area];
  const tema = temas[indice % temas.length];

  const temHabilidade = aleatorio() > 0.15;
  const habilidadesArea = habilidadesDaArea(area);
  const habilidade = temHabilidade
    ? habilidadesArea[Math.floor(aleatorio() * habilidadesArea.length)]
    : null;

  const temTri = aleatorio() > 0.1;
  const a = temTri ? Number((0.6 + aleatorio() * 1.4).toFixed(2)) : null;
  const b = temTri ? Number((aleatorio() * 4 - 2).toFixed(2)) : null;
  const c = temTri ? Number((aleatorio() * 0.25).toFixed(2)) : null;
  const faixa = derivarFaixa(b);

  const comFigura = aleatorio() > 0.6;
  const figuraComDescricao = comFigura && aleatorio() > 0.35;

  const anos = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
  const temAno = aleatorio() > 0.05;
  const ano = temAno ? anos[Math.floor(aleatorio() * anos.length)] : null;

  const temResolucao = aleatorio() > 0.3;

  return {
    id: `demo-${String(indice).padStart(3, "0")}`,
    ano,
    area,
    coItem: `ITEM-DEMO-${String(indice).padStart(4, "0")}`,
    habilidade,
    faixa,
    tri: { a, b, c },
    enunciado: construirEnunciado(indice, tema, comFigura, figuraComDescricao),
    alternativas: construirAlternativas(indice),
    temResolucao,
  };
}

function gerarGabarito(indice: number, aleatorio: () => number): Questao["alternativas"][number]["letra"] {
  const letras: Questao["alternativas"][number]["letra"][] = ["A", "B", "C", "D", "E"];
  return letras[Math.floor(aleatorio() * letras.length)];
}

function gerarResolucao(area: Area): string {
  return `Resolução de demonstração: a alternativa correta decorre da análise do contexto fictício apresentado sobre ${NOMES_AREA[area].toLowerCase()}. Este texto é gerado para desenvolvimento e não deve ser tratado como conteúdo pedagógico real.`;
}

export interface QuestaoComGabarito {
  questao: Questao;
  gabarito: Questao["alternativas"][number]["letra"];
  resolucao: string | null;
}

/** Gera o banco fictício completo (questão + gabarito + resolução, quando houver). */
export function gerarBanco(semente = SEMENTE, total = TOTAL_QUESTOES_DEMO): QuestaoComGabarito[] {
  const aleatorio = criarGerador(semente);
  const banco: QuestaoComGabarito[] = [];
  for (let i = 1; i <= total; i += 1) {
    const questao = gerarQuestao(i, aleatorio);
    const gabarito = gerarGabarito(i, aleatorio);
    const resolucao = questao.temResolucao ? gerarResolucao(questao.area) : null;
    banco.push({ questao, gabarito, resolucao });
  }
  return banco;
}

export const BANCO_DEMO = gerarBanco();

export function questaoPorId(id: string): QuestaoComGabarito | undefined {
  return BANCO_DEMO.find((q) => q.questao.id === id);
}
