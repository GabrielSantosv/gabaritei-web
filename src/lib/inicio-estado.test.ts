import { describe, expect, it } from "vitest";
import { estadoCartaoAtividade, estadoCartaoProximo } from "./inicio-estado";
import type { AtividadeEmAndamento, Criterio } from "@/lib/api/types";

const atividade: AtividadeEmAndamento = {
  id: "s1",
  tipo: "sessao",
  titulo: "Treino de Matemática",
  area: "MT",
  feitas: 3,
  total: 10,
  atualizadaEm: new Date().toISOString(),
};

describe("estadoCartaoAtividade (cartão 1: Seu próximo passo)", () => {
  it("carregando enquanto a consulta não termina", () => {
    expect(
      estadoCartaoAtividade({ carregando: true, erro: false, atividade: undefined, rotaAtividade: null, respondidas: undefined }),
    ).toEqual({ tipo: "carregando" });
  });

  it("erro quando a consulta falha", () => {
    expect(
      estadoCartaoAtividade({ carregando: false, erro: true, atividade: undefined, rotaAtividade: null, respondidas: 0 }),
    ).toEqual({ tipo: "erro" });
  });

  it("atividade em andamento com rota conhecida", () => {
    expect(
      estadoCartaoAtividade({ carregando: false, erro: false, atividade, rotaAtividade: "/treino/s1", respondidas: 12 }),
    ).toEqual({ tipo: "em-andamento", atividade, rota: "/treino/s1" });
  });

  it("nada em andamento, mas a conta já tem histórico", () => {
    expect(
      estadoCartaoAtividade({ carregando: false, erro: false, atividade: undefined, rotaAtividade: null, respondidas: 40 }),
    ).toEqual({ tipo: "nada-em-andamento" });
  });

  it("conta nova (zero respostas e nada em andamento)", () => {
    expect(
      estadoCartaoAtividade({ carregando: false, erro: false, atividade: undefined, rotaAtividade: null, respondidas: 0 }),
    ).toEqual({ tipo: "conta-nova" });
  });

  it("atividade sem rota própria (lista/diagnóstico, Fase 2) não trava num botão sem destino", () => {
    expect(
      estadoCartaoAtividade({ carregando: false, erro: false, atividade, rotaAtividade: null, respondidas: 40 }),
    ).toEqual({ tipo: "nada-em-andamento" });
  });
});

const criterio: Criterio = { modo: "habilidade", texto: "Mesma habilidade (H21) em que você acertou 38%." };

describe("estadoCartaoProximo (cartão 2: Seu próximo passo)", () => {
  it("carregando enquanto a consulta não termina", () => {
    expect(
      estadoCartaoProximo({ carregando: true, erro: false, statusReforco: undefined, respostasAtuais: undefined, respostasMinimas: undefined }),
    ).toEqual({ tipo: "carregando" });
  });

  it("erro quando a consulta falha", () => {
    expect(
      estadoCartaoProximo({ carregando: false, erro: true, statusReforco: undefined, respostasAtuais: undefined, respostasMinimas: undefined }),
    ).toEqual({ tipo: "erro" });
  });

  it("dados insuficientes (ou conta nova) pro reforço", () => {
    expect(
      estadoCartaoProximo({ carregando: false, erro: false, statusReforco: "dados_insuficientes", respostasAtuais: 4, respostasMinimas: 15 }),
    ).toEqual({ tipo: "dados-insuficientes", atual: 4, minimo: 15 });
  });

  it("prévia com modelo quando o contrato traz uma (ainda não acontece hoje)", () => {
    expect(
      estadoCartaoProximo({
        carregando: false,
        erro: false,
        statusReforco: "ok",
        respostasAtuais: 40,
        respostasMinimas: 15,
        previa: { criterio, area: "MT", versaoModelo: "0.3.1" },
      }),
    ).toEqual({ tipo: "previa-modelo", criterio, area: "MT", versaoModelo: "0.3.1" });
  });

  it("escolha automática sem prévia (o caso de hoje, contrato sem modo 'auto')", () => {
    expect(
      estadoCartaoProximo({ carregando: false, erro: false, statusReforco: "ok", respostasAtuais: 40, respostasMinimas: 15 }),
    ).toEqual({ tipo: "escolha-automatica" });
  });
});
