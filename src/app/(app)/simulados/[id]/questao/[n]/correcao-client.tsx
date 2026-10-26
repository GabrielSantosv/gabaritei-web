"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";

import { AreaTag } from "@/components/dominio/area-tag";
import { FaixaChip } from "@/components/dominio/faixa-chip";
import { QuestionView } from "@/components/dominio/question-view";
import { Link } from "@/components/ui/link";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getApi } from "@/lib/api/client";
import { mensagemDoErro } from "@/lib/api/errors";

export function CorrecaoClient() {
  const params = useParams<{ id: string; n: string }>();
  const router = useRouter();
  const id = params.id;
  const n = Number(params.n);

  const {
    data: resultado,
    isLoading: carregandoResultado,
    isError: erroResultado,
    error: erroResultadoDetalhe,
    refetch: refazerResultado,
  } = useQuery({
    queryKey: ["resultado-simulado", id],
    queryFn: () => getApi().obterResultadoSimulado(id),
  });

  const item = resultado?.itens.find((i) => i.n === n);

  const {
    data: questao,
    isLoading: carregandoQuestao,
    isError: erroQuestao,
  } = useQuery({
    queryKey: ["questao", item?.questaoId],
    queryFn: () => getApi().obterQuestao(item!.questaoId),
    enabled: !!item,
  });

  const { data: tentativa } = useQuery({
    queryKey: ["tentativa", `simulado-${id}-${n}`],
    queryFn: () => getApi().obterTentativa(`simulado-${id}-${n}`),
    enabled: !!item && item.resposta !== null,
  });

  if (carregandoResultado || (item && carregandoQuestao) || !resultado) {
    return (
      <div>
        {erroResultado ? (
          <ErrorState mensagem={mensagemDoErro(erroResultadoDetalhe)} onTentarDeNovo={() => refazerResultado()} />
        ) : (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}
      </div>
    );
  }

  if (!item || erroQuestao || !questao) {
    return <ErrorState mensagem="Não encontramos essa questão do simulado." />;
  }

  const anteriorN = n > 1 ? n - 1 : null;
  const proximaN = n < resultado.itens.length ? n + 1 : null;

  return (
    <div>
      <nav aria-label="Migalhas" className="mb-4 flex items-center gap-1.5 text-sm text-ink-2">
        <Link href="/simulados">Simulados</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/simulados/${id}/resultado`}>Resultado</Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink">Questão {n}</span>
      </nav>

      <h1 tabIndex={-1} className="sr-only">
        Correção da questão {n} do simulado
      </h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AreaTag area={questao.area} />
        <span className="text-sm text-ink-2">{questao.habilidade?.codigo ?? "Habilidade não informada"}</span>
        <span className="text-sm text-ink-2">{questao.ano ?? "Ano não informado"}</span>
        <FaixaChip faixa={questao.faixa} />
      </div>

      <QuestionView
        questao={questao}
        modo="revisao"
        respostaSelecionada={item.resposta}
        correcao={
          tentativa?.correcao ?? {
            tentativaId: `simulado-${id}-${n}`,
            correta: item.correta,
            gabarito: item.gabarito,
            resolucao: null,
            respondidaEm: "",
          }
        }
      />

      <nav aria-label="Navegação entre questões" className="mt-6 flex items-center justify-between border-t border-rule pt-4">
        {anteriorN ? (
          <Link href={`/simulados/${id}/questao/${anteriorN}`}>Anterior</Link>
        ) : (
          <span />
        )}
        {proximaN ? (
          <Link href={`/simulados/${id}/questao/${proximaN}`}>Próxima</Link>
        ) : (
          <button
            type="button"
            onClick={() => router.push(`/simulados/${id}/resultado`)}
            className="min-h-12 text-sm font-medium text-brand-ink underline underline-offset-2"
          >
            Voltar ao resultado
          </button>
        )}
      </nav>
    </div>
  );
}
