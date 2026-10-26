"use client";

import { useQuery } from "@tanstack/react-query";
import { Flag } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { AreaTag } from "@/components/dominio/area-tag";
import { CartaoRespostaMini } from "@/components/dominio/cartao-resposta-mini";
import { FaixaChip } from "@/components/dominio/faixa-chip";
import { QuestionView } from "@/components/dominio/question-view";
import { Timer } from "@/components/dominio/timer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { FocusShell } from "@/components/layout/focus-shell";
import { getApi } from "@/lib/api/client";
import { mensagemDoErro } from "@/lib/api/errors";
import type { Letra } from "@/lib/api/types";

export function SimuladoClient() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const {
    data: simulado,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({ queryKey: ["simulado", id], queryFn: () => getApi().obterSimulado(id) });

  const [posicao, setPosicao] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [mostrarFinalizar, setMostrarFinalizar] = useState(false);
  const [mostrarTempoEsgotado, setMostrarTempoEsgotado] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  // Calculado uma única vez na montagem (useState preguiçoso), não a cada
  // renderização — Date.now() direto no corpo do componente violaria a
  // regra de pureza (react-hooks/purity).
  const [segundosIniciais] = useState<number | null>(() => {
    if (!simulado?.limiteEm) return null;
    return Math.max(0, Math.round((new Date(simulado.limiteEm).getTime() - Date.now()) / 1000));
  });

  async function finalizarEIrParaResultado() {
    setFinalizando(true);
    try {
      await getApi().finalizarSimulado(id);
    } catch {
      // segue mesmo se falhar: cada resposta já foi salva individualmente
    }
    router.push(`/simulados/${id}/resultado`);
  }

  if (isLoading || !simulado) {
    return (
      <FocusShell titulo="Simulado" mensagemSaida="" onConfirmarSaida={() => {}}>
        {isError ? (
          <ErrorState mensagem={mensagemDoErro(error)} onTentarDeNovo={() => refetch()} />
        ) : (
          <Skeleton className="h-64 w-full" />
        )}
      </FocusShell>
    );
  }

  if (simulado.status === "finalizado") {
    router.replace(`/simulados/${id}/resultado`);
    return null;
  }

  const item = simulado.itens.find((i) => i.n === posicao) ?? simulado.itens[0];
  const total = simulado.itens.length;
  const emBranco = simulado.itens.filter((i) => i.resposta === null);
  const marcadas = simulado.itens.filter((i) => i.marcada);
  const respondidas = total - emBranco.length;

  async function aoSelecionar(letra: Letra) {
    setSalvando(true);
    try {
      await getApi().salvarRespostaSimulado(id, item.n, item.resposta === letra ? null : letra);
      await refetch();
    } finally {
      setSalvando(false);
    }
  }

  async function aoLimpar() {
    setSalvando(true);
    try {
      await getApi().salvarRespostaSimulado(id, item.n, null);
      await refetch();
    } finally {
      setSalvando(false);
    }
  }

  async function aoMarcar() {
    await getApi().marcarRevisao(id, item.n, !item.marcada);
    await refetch();
  }

  const cartao = (
    <div>
      <ul className="mb-3 flex flex-wrap gap-3 text-xs text-ink-2">
        <li className="flex items-center gap-1.5">
          <span className="flex size-4 items-center justify-center rounded-xs border border-rule-strong bg-paper-2" />
          Respondida
        </li>
        <li className="flex items-center gap-1.5">
          <span className="flex size-4 items-center justify-center rounded-xs border border-rule-strong" />
          Em branco
        </li>
        <li className="flex items-center gap-1.5">
          <Flag className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          Marcada
        </li>
      </ul>
      <CartaoRespostaMini
        variante="simulado"
        atual={posicao}
        onSelecionar={setPosicao}
        itens={simulado.itens.map((i) => ({ n: i.n, resposta: i.resposta, marcada: i.marcada }))}
      />
    </div>
  );

  const progresso = (
    <div className="flex items-center gap-3">
      <span className="text-sm text-ink-2">
        Questão {posicao} de {total}
      </span>
      <span aria-live="polite" className="text-xs text-ink-2">
        {salvando ? "Salvando…" : "Salvo"}
      </span>
      {simulado.config.cronometroVisivel && segundosIniciais !== null ? (
        <Timer
          segundosRestantes={segundosIniciais}
          onZero={() => {
            setMostrarTempoEsgotado(true);
            void finalizarEIrParaResultado();
          }}
          onAvisoMinutos={() => {}}
        />
      ) : null}
    </div>
  );

  return (
    <FocusShell
      titulo="Simulado"
      progresso={progresso}
      mensagemSaida={`Você respondeu ${respondidas} de ${total}. O que já foi respondido fica salvo.`}
      onConfirmarSaida={() => router.push("/simulados")}
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <AreaTag area={item.questao.area} />
              <span className="text-sm text-ink-2">{item.questao.habilidade?.codigo ?? "Habilidade não informada"}</span>
              <FaixaChip faixa={item.questao.faixa} />
            </div>
            <button
              type="button"
              aria-pressed={item.marcada}
              onClick={aoMarcar}
              className="flex min-h-12 items-center gap-1.5 rounded-sm border border-rule-strong px-3 text-sm text-ink hover:bg-paper-2"
            >
              <Flag className={item.marcada ? "size-4 fill-current" : "size-4"} strokeWidth={1.75} aria-hidden="true" />
              {item.marcada ? "Marcada para revisar" : "Marcar para revisar"}
            </button>
          </div>

          <QuestionView
            questao={item.questao}
            modo="resolver"
            respostaSelecionada={item.resposta}
            onRespostaChange={aoSelecionar}
            descricaoImagensAbertaPorPadrao={false}
            mostrarBotaoEnviar={false}
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variante="secundario" onClick={aoLimpar} disabled={!item.resposta}>
              Limpar resposta
            </Button>
            <Button variante="discreto" onClick={() => setPosicao((p) => Math.max(1, p - 1))} disabled={posicao === 1}>
              Anterior
            </Button>
            <Button variante="discreto" onClick={() => setPosicao((p) => Math.min(total, p + 1))} disabled={posicao === total}>
              Próxima
            </Button>

            <Dialog open={mostrarFinalizar} onOpenChange={setMostrarFinalizar}>
              <DialogTrigger asChild>
                <Button className="ml-auto">Finalizar</Button>
              </DialogTrigger>
              <DialogContent
                titulo="Finalizar simulado?"
                descricao={`Você respondeu ${respondidas} de ${total}. ${
                  emBranco.length > 0 ? `${emBranco.length} em branco: ${emBranco.map((i) => i.n).join(", ")}.` : ""
                } ${marcadas.length > 0 ? `${marcadas.length} marcadas para revisar.` : ""}`}
              >
                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variante="secundario">Voltar ao simulado</Button>
                  </DialogClose>
                  <Button variante="perigoso" carregando={finalizando} onClick={finalizarEIrParaResultado}>
                    Finalizar e ver resultado
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-8 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variante="secundario">Cartão-resposta</Button>
              </SheetTrigger>
              <SheetContent titulo="Cartão-resposta" lado="baixo">
                {cartao}
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <aside className="hidden lg:block">{cartao}</aside>
      </div>

      <Dialog open={mostrarTempoEsgotado} onOpenChange={setMostrarTempoEsgotado}>
        <DialogContent titulo="O tempo acabou." descricao="Suas respostas foram enviadas.">
          <p className="sr-only" aria-live="assertive">
            O tempo acabou. Suas respostas foram enviadas.
          </p>
        </DialogContent>
      </Dialog>
    </FocusShell>
  );
}
