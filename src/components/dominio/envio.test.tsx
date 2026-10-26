import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Envio } from "./envio";

describe("Envio", () => {
  it("sem alternativa selecionada: explica em vez de enviar (regra da seção 9)", async () => {
    const onEnviar = vi.fn();
    render(<Envio respostaSelecionada={false} onEnviar={onEnviar} />);

    await userEvent.click(screen.getByRole("button", { name: "Enviar resposta" }));

    expect(onEnviar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Escolha uma alternativa antes de enviar.");
  });

  it("com alternativa selecionada: envia ao clicar", async () => {
    const onEnviar = vi.fn();
    render(<Envio respostaSelecionada={true} onEnviar={onEnviar} />);

    await userEvent.click(screen.getByRole("button", { name: "Enviar resposta" }));

    expect(onEnviar).toHaveBeenCalledOnce();
  });

  it("enviando: mostra texto de carregamento e não deixa clicar de novo", () => {
    const onEnviar = vi.fn();
    render(<Envio respostaSelecionada={true} enviando onEnviar={onEnviar} />);

    const botao = screen.getByRole("button", { name: /Enviando/ });
    expect(botao).toBeDisabled();
  });
});
