"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AreaTag } from "@/components/dominio/area-tag";
import { AtalhosTecladoDialog } from "@/components/dominio/atalhos-teclado-dialog";
import { CartaoRespostaMini } from "@/components/dominio/cartao-resposta-mini";
import { ComboMeter } from "@/components/dominio/combo-meter";
import { CriterioRecomendacao } from "@/components/dominio/criterio-recomendacao";
import { NotaNeutra } from "@/components/dominio/nota-neutra";
import { FaixaChip } from "@/components/dominio/faixa-chip";
import { QuestionView } from "@/components/dominio/question-view";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { FocusShell } from "@/components/layout/focus-shell";
import { getApi } from "@/lib/api/client";
import { mensagemDoErro } from "@/lib/api/errors";
import { formatarDuracao } from "@/lib/format";
import type { ComboEstado, Correcao, EnvioResultado, Letra, Recomendacao } from "@/lib/api/types";
import { limparFilaSessao, limparSessaoAtivaId, lerFilaSessao, salvarFilaSessao } from "@/lib/sessao-ativa";

interface FilaSalva {
  itens: Recomendacao[];
  aviso: { tipo: string; texto: string } | null;
  // null = recomendação por regra simples (P2, "Deixar o modelo escolher"):
  // o selo de IA (CriterioRecomendacao, regra 9) só aparece quando existe.
  modelo: { nome: string; versao: string } | null;
}

const LETRAS: Letra[] = ["A", "B", "C", "D", "E"];

export function SessaoClient() {
  const params = useParams<{ sessaoId: string }>();
  const sessaoId = params.sessaoId;
  const router = useRouter();

  const [filaSalva] = useState<FilaSalva>(
    () => lerFilaSessao<FilaSalva>(sessaoId) ?? { itens: [], aviso: null, modelo: null },
  );
  const [fila, setFila] = useState<Recomendacao[]>(filaSalva.itens);

  const {
    data: sessao,
    isLoading: carregandoSessao,
    refetch: refazerSessao,
  } = useQuery({
    queryKey: ["sessao", sessaoId],
    queryFn: () => getApi().obterSessao(sessaoId),
  });
  const { data: preferencias } = useQuery({
    queryKey: ["preferencias"],
    queryFn: () => getApi().obterPreferencias(),
  });

  const [posicao, setPosicao] = useState(0);
  const [combo, setCombo] = useState<ComboEstado | null>(null);
  const [sincronizado, setSincronizado] = useState(false);
  if (sessao && !sincronizado) {
    setSincronizado(true);
    if (sessao.respondidas > 0) setPosicao(sessao.respondidas);
    if (sessao.combo) setCombo(sessao.combo);
  }

  const [resposta, setResposta] = useState<Letra | null>(null);
  const [resultado, setResultado] = useState<EnvioResultado | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [chaveAtual, setChaveAtual] = useState(() => crypto.randomUUID());
  const [mostrarAtalhos, setMostrarAtalhos] = useState(false);
  const [inicioSessao] = useState(() => Date.now());
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  // Letra marcada em cada posição já respondida NESTA aba (seção 9, CartaoRespostaMini
  // variante treino). Se a sessão foi retomada depois de um reload, as posições
  // anteriores ficam sem letra conhecida — mostram só o número.
  const [respostasDadas, setRespostasDadas] = useState<(Letra | null)[]>([]);

  const total = sessao?.total ?? fila.length;
  const item = fila[posicao] as Recomendacao | undefined;
  const ultimaQuestao = posicao + 1 >= total;

  async function finalizarEIrParaResumo() {
    try {
      await getApi().encerrarSessao(sessaoId);
    } catch {
      // mesmo se falhar, o mock já salvou cada tentativa individualmente
    }
    limparSessaoAtivaId();
    limparFilaSessao(sessaoId);
    router.push(`/treino/${sessaoId}/resumo`);
  }

  async function aoEnviar() {
    if (!resposta || !item || enviando) return;
    setEnviando(true);
    setErroEnvio(null);
    try {
      const r = await getApi().enviarResposta({
        questaoId: item.questao.id,
        letra: resposta,
        modo: sessao?.modo ?? "livre",
        sessaoId,
        recomendacaoId: item.id,
        chaveIdempotencia: chaveAtual,
      });
      setResultado(r);
      setRespostasDadas((atual) => {
        const copia = [...atual];
        copia[posicao] = resposta;
        return copia;
      });
      if (r.combo) setCombo(r.combo);
      if (sessao?.modo === "progressao" && r.proxima) {
        const novaFila = [...fila, r.proxima];
        setFila(novaFila);
        salvarFilaSessao(sessaoId, { itens: novaFila, aviso: filaSalva.aviso, modelo: filaSalva.modelo });
      }
      void refazerSessao(); // atualiza "Nesta sessão" (acertos/erros) com o estado real do servidor
    } catch (erro) {
      setErroEnvio(mensagemDoErro(erro));
    } finally {
      setEnviando(false);
    }
  }

  function aoAvancar() {
    if (ultimaQuestao) {
      void finalizarEIrParaResumo();
      return;
    }
    setPosicao((p) => p + 1);
    setResposta(null);
    setResultado(null);
    setErroEnvio(null);
    setChaveAtual(crypto.randomUUID());
  }

  // Atalhos de teclado (seção 10.2, tela 5): A–E escolhem, Enter envia, N
  // avança. Listener estável via ref — só o handler muda, não a inscrição.
  const handlersRef = useRef({ aoEnviar, aoAvancar, resposta, resultado });
  useEffect(() => {
    handlersRef.current = { aoEnviar, aoAvancar, resposta, resultado };
  });

  useEffect(() => {
    if (preferencias && !preferencias.atalhosTeclado) return;
    function aoTeclar(e: KeyboardEvent) {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const alvo = e.target as HTMLElement | null;
      if (alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA")) return;
      if (e.key === "?") {
        setMostrarAtalhos(true);
        return;
      }
      const { aoEnviar: enviar, aoAvancar: avancar, resultado: resultadoAtual } = handlersRef.current;
      const letra = e.key.toUpperCase();
      if (!resultadoAtual && (LETRAS as string[]).includes(letra)) {
        setResposta(letra as Letra);
        return;
      }
      if (e.key === "Enter") {
        if (resultadoAtual) avancar();
        else void enviar();
        return;
      }
      if (letra === "N" && resultadoAtual) {
        avancar();
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [preferencias]);

  async function aoEncerrarConfirmado() {
    await finalizarEIrParaResumo();
  }

  if (carregandoSessao || !sessao) {
    return (
      <FocusShell titulo="Treino" mensagemSaida="" onConfirmarSaida={() => {}}>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-48 w-full" />
        </div>
      </FocusShell>
    );
  }

  if (!item) {
    return (
      <FocusShell titulo="Treino" mensagemSaida="O que já foi respondido fica salvo." onConfirmarSaida={aoEncerrarConfirmado}>
        <ErrorState
          titulo="Não conseguimos continuar esta sessão"
          mensagem="A lista de questões desta sessão não está mais disponível nesta aba (ex.: a aba foi recarregada)."
          oQueFazer="Volte e escolha o modo de treino de novo: o que você já respondeu continua salvo."
        />
        <Button className="mt-4" onClick={() => router.push("/treino")}>
          Escolher modo de novo
        </Button>
      </FocusShell>
    );
  }

  const progresso = (
    <div className="flex items-center gap-3">
      <span className="text-sm text-ink-2">
        Questão {posicao + 1} de {total}
      </span>
      <CartaoRespostaMini
        variante="treino"
        atual={posicao + 1}
        itens={Array.from({ length: total }, (_, i) => ({
          n: i + 1,
          letra: respostasDadas[i] ?? null,
        }))}
        className="hidden sm:flex"
      />
    </div>
  );

  return (
    <FocusShell
      titulo={`Treino, ${item.questao.area}`}
      progresso={progresso}
      mensagemSaida={`Você respondeu ${sessao.respondidas} de ${total}. O que já foi respondido fica salvo.`}
      onConfirmarSaida={aoEncerrarConfirmado}
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          {filaSalva.aviso ? (
            <p className="mb-3 rounded-r-xs border-l-[3px] border-l-rule-strong bg-paper-2 p-3 text-sm text-ink-2">
              {filaSalva.aviso.texto}
            </p>
          ) : null}

          {filaSalva.modelo ? (
            <CriterioRecomendacao criterio={item.criterio} versaoModelo={filaSalva.modelo.versao} className="mb-4" />
          ) : (
            <NotaNeutra texto={item.criterio.texto} className="mb-4" />
          )}

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <AreaTag area={item.questao.area} />
            <span className="text-sm text-ink-2">{item.questao.habilidade?.codigo ?? "Habilidade não informada"}</span>
            <span className="text-sm text-ink-2">{item.questao.ano ?? "Ano não informado"}</span>
            <FaixaChip faixa={item.questao.faixa} />
          </div>

          {erroEnvio ? (
            <ErrorState
              mensagem="Não conseguimos enviar. Sua resposta continua marcada."
              onTentarDeNovo={aoEnviar}
              className="mb-4"
            />
          ) : null}

          <QuestionView
            questao={item.questao}
            modo={resultado ? "correcao" : "resolver"}
            respostaSelecionada={resposta}
            onRespostaChange={setResposta}
            onEnviar={aoEnviar}
            enviando={enviando}
            correcao={resultado?.correcao as Correcao | undefined}
            descricaoImagensAbertaPorPadrao={preferencias?.descricaoImagensAberta ?? false}
          />

          <div aria-live="polite" className="sr-only">
            {resultado ? (resultado.correcao.correta ? "Você acertou." : "Você errou.") : null}
          </div>

          {resultado ? (
            <Button className="mt-4" onClick={aoAvancar}>
              {ultimaQuestao ? "Ver resumo" : "Próxima questão"}
            </Button>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4">
          {combo ? <ComboMeter estado={combo} /> : null}

          <div className="rounded-md bg-paper-2 p-4">
            <p className="mb-2 text-sm font-medium text-ink">Nesta sessão</p>
            <dl className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-2">Acertos</dt>
                <dd className="text-ink">{sessao.acertos}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-2">Erros</dt>
                <dd className="text-ink">{sessao.respondidas - sessao.acertos}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-2">Tempo</dt>
                <dd className="font-mono text-ink">{formatarDuracao((agora - inicioSessao) / 1000)}</dd>
              </div>
            </dl>
          </div>

          <button
            type="button"
            onClick={() => setMostrarAtalhos(true)}
            className="min-h-12 self-start text-sm font-medium text-brand-ink underline underline-offset-2"
          >
            Ver atalhos de teclado
          </button>
        </aside>
      </div>

      <AtalhosTecladoDialog
        aberto={mostrarAtalhos}
        onOpenChange={setMostrarAtalhos}
        itens={[
          { tecla: "A a E", acao: "Escolher alternativa" },
          { tecla: "Enter", acao: "Enviar resposta ou avançar" },
          { tecla: "N", acao: "Próxima questão (depois de corrigida)" },
          { tecla: "?", acao: "Abrir esta lista" },
        ]}
      />
    </FocusShell>
  );
}
