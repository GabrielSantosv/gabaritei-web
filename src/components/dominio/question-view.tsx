import { apiMode } from "@/lib/api/client";
import type { Correcao, Letra, Questao } from "@/lib/api/types";
import { DemoChip } from "./demo-chip";
import { Enunciado } from "./enunciado";
import { AlternativasRadio } from "./alternativas-radio";
import { Envio } from "./envio";
import { FeedbackCorrecao } from "./feedback-correcao";

export type ModoQuestionView = "resolver" | "correcao" | "revisao";

export interface QuestionViewProps {
  questao: Questao;
  modo: ModoQuestionView;
  respostaSelecionada: Letra | null;
  onRespostaChange?: (letra: Letra) => void;
  onEnviar?: () => void;
  enviando?: boolean;
  correcao?: Correcao | null;
  descricaoImagensAbertaPorPadrao?: boolean;
  /**
   * false no simulado (tela 10): lá a resposta salva ao escolher a
   * alternativa, sem botão "Enviar" nem correção na hora (RF05, RF06).
   */
  mostrarBotaoEnviar?: boolean;
  className?: string;
}

/** Orquestra Enunciado + AlternativasRadio + Envio/FeedbackCorrecao nos 3 modos (seção 9). */
export function QuestionView({
  questao,
  modo,
  respostaSelecionada,
  onRespostaChange,
  onEnviar,
  enviando,
  correcao,
  descricaoImagensAbertaPorPadrao = false,
  mostrarBotaoEnviar = true,
  className,
}: QuestionViewProps) {
  const interativo = modo === "resolver";
  const gabarito = modo === "resolver" ? undefined : correcao?.gabarito ?? null;

  return (
    <div className={className}>
      {apiMode() === "mock" ? <DemoChip className="mb-3" /> : null}
      <Enunciado blocos={questao.enunciado} descricaoAbertaPorPadrao={descricaoImagensAbertaPorPadrao} />
      <AlternativasRadio
        alternativas={questao.alternativas}
        respostaMarcada={respostaSelecionada}
        onRespostaChange={onRespostaChange}
        gabarito={gabarito}
        interativo={interativo}
        className="mt-4"
      />
      {modo === "resolver" && mostrarBotaoEnviar ? (
        <Envio
          respostaSelecionada={respostaSelecionada !== null}
          enviando={enviando}
          onEnviar={() => onEnviar?.()}
          className="mt-4"
        />
      ) : null}
      {(modo === "correcao" || modo === "revisao") && correcao ? (
        <FeedbackCorrecao correcao={correcao} className="mt-4" />
      ) : null}
    </div>
  );
}
