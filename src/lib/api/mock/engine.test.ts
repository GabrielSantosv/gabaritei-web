import { describe, expect, it } from "vitest";
import { calcularFoguinho, estadoInicialCombo, reduzirCombo } from "./engine";

describe("reduzirCombo", () => {
  const config = { acertosPorDegrau: 3, noErro: "reduz" as const };

  it("sobe um degrau a cada N acertos seguidos", () => {
    let estado = estadoInicialCombo(config);
    estado = reduzirCombo(estado, true);
    estado = reduzirCombo(estado, true);
    expect(estado.evento).toBeNull();
    estado = reduzirCombo(estado, true);
    expect(estado.evento).toBe("subiu");
    expect(estado.degrau).toBe(1);
    expect(estado.faixaAlvo).toBe("media");
    expect(estado.atual).toBe(0);
  });

  it("no topo, não sobe mais e marca no_topo", () => {
    let estado = estadoInicialCombo(config);
    // 3 acertos sobem para média, mais 3 para difícil (topo), mais 3 batem no topo.
    for (let i = 0; i < 9; i += 1) estado = reduzirCombo(estado, true);
    expect(estado.degrau).toBe(2);
    expect(estado.acertosParaSubir).toBeNull();
    expect(estado.evento).toBe("no_topo");
  });

  it("com noErro 'reduz', o erro desce um degrau em vez de reiniciar do zero", () => {
    let estado = estadoInicialCombo(config);
    estado = reduzirCombo(estado, true);
    estado = reduzirCombo(estado, true);
    estado = reduzirCombo(estado, true); // sobe para degrau 1 (média)
    estado = reduzirCombo(estado, false);
    expect(estado.evento).toBe("desceu");
    expect(estado.degrau).toBe(0);
    expect(estado.faixaAlvo).toBe("facil");
  });

  it("com noErro 'reinicia', o erro sempre volta para o degrau 0", () => {
    let estado = estadoInicialCombo({ acertosPorDegrau: 2, noErro: "reinicia" });
    estado = reduzirCombo(estado, true);
    estado = reduzirCombo(estado, true); // sobe para degrau 1
    estado = reduzirCombo(estado, true);
    estado = reduzirCombo(estado, true); // sobe para degrau 2
    estado = reduzirCombo(estado, false);
    expect(estado.evento).toBe("reiniciou");
    expect(estado.degrau).toBe(0);
  });
});

describe("calcularFoguinho", () => {
  function dataHaDias(dias: number): string {
    const d = new Date("2026-03-10T12:00:00Z");
    d.setDate(d.getDate() - dias);
    return d.toISOString().slice(0, 10);
  }

  it("conta dias consecutivos até hoje", () => {
    const hoje = new Date("2026-03-10T12:00:00Z");
    const dias = [dataHaDias(0), dataHaDias(1), dataHaDias(2)];
    const resultado = calcularFoguinho(dias, 0, hoje);
    expect(resultado.atual).toBe(3);
    expect(resultado.hojeContou).toBe(true);
    expect(resultado.emRisco).toBe(false);
  });

  it("sem atividade hoje mas com ontem, fica em risco sem zerar ainda", () => {
    const hoje = new Date("2026-03-10T12:00:00Z");
    const dias = [dataHaDias(1), dataHaDias(2)];
    const resultado = calcularFoguinho(dias, 0, hoje);
    expect(resultado.atual).toBe(2);
    expect(resultado.hojeContou).toBe(false);
    expect(resultado.emRisco).toBe(true);
  });

  it("um dia inteiro sem atividade reinicia a contagem para zero", () => {
    const hoje = new Date("2026-03-10T12:00:00Z");
    const dias = [dataHaDias(3), dataHaDias(4)];
    const resultado = calcularFoguinho(dias, 0, hoje);
    expect(resultado.atual).toBe(0);
    expect(resultado.emRisco).toBe(false);
  });
});
