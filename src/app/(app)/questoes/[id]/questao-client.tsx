"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { AreaTag } from "@/components/dominio/area-tag";
import { FaixaChip } from "@/components/dominio/faixa-chip";
import { QuestionView } from "@/components/dominio/question-view";
import { Disclosure } from "@/components/ui/disclosure";
import { ErrorState } from "@/components/ui/error-state";
import { Link as UiLink } from "@/components/ui/link";
import { Skeleton } from "@/components/ui/skeleton";
import { getApi } from "@/lib/api/client";
import { mensagemDoErro } from "@/lib/api/errors";
import type { Correcao, Letra } from "@/lib/api/types";
import {
  filtrosParaQueryString,
  lerFiltrosDaUrl,
  limparDescricaoHabilidadeMock,
  ordenarQuestoes,
  PAGINA_TAMANHO,
  paraFiltrosApi,
} from "@/lib/questoes-filtros";

function rotuloFaixaDerivada(b: number | null): string {
  if (b === null) return "Sem TRI cadastrado para derivar a dificuldade.";
  if (b < -0.5) return `Fácil: parâmetro b = ${b} (menor que -0,5).`;
  if (b > 0.5) return `Difícil: parâmetro b = ${b} (maior que 0,5).`;
  return `Média: parâmetro b = ${b} (entre -0,5 e 0,5).`;
}

function Navegacao({ contexto, id }: { contexto: ReturnType<typeof useContextoLista>; id: string }) {
  const { data } = contexto;
  if (!data) return null;
  const indice = data.ids.indexOf(id);
  if (indice === -1) return null;
  const anteriorId = indice > 0 ? data.ids[indice - 1] : null;
  const proximaId = indice < data.ids.length - 1 ? data.ids[indice + 1] : null;
  if (!anteriorId && !proximaId) return null;

  const sufixo = data.querystring ? `&${data.querystring}` : "";

  return (
    <nav aria-label="Navegação entre questões" className="mt-6 flex items-center justify-between border-t border-rule pt-4">
      {anteriorId ? (
        <UiLink href={`/questoes/${anteriorId}?de=questoes${sufixo}`} className="inline-flex items-center gap-1">
          <ChevronLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Anterior
        </UiLink>
      ) : (
        <span />
      )}
      {proximaId ? (
        <UiLink href={`/questoes/${proximaId}?de=questoes${sufixo}`} className="inline-flex items-center gap-1">
          Próxima
          <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </UiLink>
      ) : (
        <span />
      )}
    </nav>
  );
}

function useContextoLista() {
  const searchParams = useSearchParams();
  const deQuestoes = searchParams.get("de") === "questoes";
  const estado = useMemo(() => lerFiltrosDaUrl(searchParams), [searchParams]);

  const query = useQuery({
    queryKey: ["questoes-contexto", estado.areas, estado.habilidades, estado.anos, estado.faixas, estado.pagina, estado.ordenar],
    queryFn: async () => {
      const resultado = await getApi().listarQuestoes(paraFiltrosApi(estado), {
        pagina: estado.pagina,
        porPagina: PAGINA_TAMANHO,
      });
      const ordenados = ordenarQuestoes(resultado.itens, estado.ordenar);
      return { ids: ordenados.map((q) => q.id), querystring: filtrosParaQueryString(estado) };
    },
    enabled: deQuestoes,
  });

  return query;
}

function ResolverQuestao({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tentativaId = searchParams.get("tentativa");
  const contexto = useContextoLista();

  const [resposta, setResposta] = useState<Letra | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [correcao, setCorrecao] = useState<Correcao | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const {
    data: questao,
    isLoading: carregandoQuestao,
    isError: erroQuestao,
    error: erroQuestaoDetalhe,
    refetch: refazerQuestao,
  } = useQuery({
    queryKey: ["questao", id],
    queryFn: () => getApi().obterQuestao(id),
  });

  const {
    data: tentativa,
    isLoading: carregandoTentativa,
    isError: erroTentativa,
  } = useQuery({
    queryKey: ["tentativa", tentativaId],
    queryFn: () => getApi().obterTentativa(tentativaId as string),
    enabled: !!tentativaId,
  });

  async function aoEnviar() {
    if (!resposta) return;
    setEnviando(true);
    setErroEnvio(null);
    try {
      const resultado = await getApi().enviarResposta({
        questaoId: id,
        letra: resposta,
        modo: "livre",
        sessaoId: null,
        recomendacaoId: null,
        chaveIdempotencia: crypto.randomUUID(),
      });
      setCorrecao(resultado.correcao);
    } catch (erro) {
      setErroEnvio(mensagemDoErro(erro));
    } finally {
      setEnviando(false);
    }
  }

  if (carregandoQuestao || (tentativaId && carregandoTentativa)) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  if (erroQuestao || !questao) {
    return <ErrorState mensagem={mensagemDoErro(erroQuestaoDetalhe)} onTentarDeNovo={() => refazerQuestao()} />;
  }

  if (tentativaId && (erroTentativa || !tentativa)) {
    return <ErrorState mensagem="Não encontramos essa tentativa." />;
  }

  const modo = tentativaId ? "revisao" : correcao ? "correcao" : "resolver";
  const correcaoAtual = tentativaId ? (tentativa?.correcao ?? null) : correcao;
  const respostaAtual = tentativaId ? (tentativa?.resposta ?? null) : resposta;

  return (
    <div>
      <nav aria-label="Migalhas" className="mb-4 flex items-center gap-1.5 text-sm text-ink-2">
        <UiLink href="/questoes">Questões</UiLink>
        <span aria-hidden="true">/</span>
        <span>ENEM {questao.ano ?? "s/ ano"}</span>
        <span aria-hidden="true">/</span>
        <span className="text-ink">Questão</span>
      </nav>

      <h1 tabIndex={-1} className="sr-only">
        Questão de {questao.area} {questao.ano ? `de ${questao.ano}` : ""}
      </h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AreaTag area={questao.area} />
        <span className="text-sm text-ink-2">
          {limparDescricaoHabilidadeMock(questao.habilidade?.descricao ?? null) ?? "Habilidade não informada"}
        </span>
        <span className="text-sm text-ink-2">{questao.ano ?? "Ano não informado"}</span>
        <FaixaChip faixa={questao.faixa} />
        {questao.coItem ? <span className="font-mono text-xs text-ink-2">{questao.coItem}</span> : null}
      </div>

      <Disclosure titulo="Detalhes técnicos" className="mb-4">
        <dl className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs">
          <div className="flex gap-1">
            <dt>a:</dt>
            <dd>{questao.tri.a ?? "não informado"}</dd>
          </div>
          <div className="flex gap-1">
            <dt>b:</dt>
            <dd>{questao.tri.b ?? "não informado"}</dd>
          </div>
          <div className="flex gap-1">
            <dt>c:</dt>
            <dd>{questao.tri.c ?? "não informado"}</dd>
          </div>
        </dl>
        <p className="mt-2 text-sm">{rotuloFaixaDerivada(questao.tri.b)}</p>
      </Disclosure>

      {erroEnvio ? <ErrorState mensagem={erroEnvio} className="mb-4" onTentarDeNovo={aoEnviar} /> : null}

      <QuestionView
        questao={questao}
        modo={modo}
        respostaSelecionada={respostaAtual}
        onRespostaChange={setResposta}
        onEnviar={aoEnviar}
        enviando={enviando}
        correcao={correcaoAtual}
      />

      {modo === "correcao" ? (
        <button
          type="button"
          onClick={() => router.push("/questoes")}
          className="mt-4 min-h-12 text-sm font-medium text-brand-ink underline underline-offset-2"
        >
          Voltar para Questões
        </button>
      ) : null}

      <Navegacao contexto={contexto} id={id} />
    </div>
  );
}

export function QuestaoClient() {
  const params = useParams<{ id: string }>();
  return (
    <Suspense fallback={null}>
      <ResolverQuestao id={params.id} />
    </Suspense>
  );
}
