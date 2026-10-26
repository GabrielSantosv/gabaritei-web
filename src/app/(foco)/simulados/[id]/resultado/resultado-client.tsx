"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";

import { AreaTag } from "@/components/dominio/area-tag";
import { CartaoResposta } from "@/components/dominio/cartao-resposta";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ProgressToMinimum } from "@/components/ui/progress-to-minimum";
import { Skeleton } from "@/components/ui/skeleton";
import { getApi } from "@/lib/api/client";
import { mensagemDoErro } from "@/lib/api/errors";
import { formatarDuracao } from "@/lib/format";

const ROTULO_TENDENCIA: Record<string, string> = { subindo: "Subindo", estavel: "Estável", caindo: "Caindo" };

export function ResultadoClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const {
    data: resultado,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["resultado-simulado", id],
    queryFn: () => getApi().obterResultadoSimulado(id),
  });

  if (isLoading || !resultado) {
    return (
      <AppShell>
        <PageHeader titulo="Resultado do simulado" />
        {isError ? (
          <ErrorState mensagem={mensagemDoErro(error)} onTentarDeNovo={() => refetch()} />
        ) : (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}
      </AppShell>
    );
  }

  const proficienciasDasAreas = resultado.proficiencias.filter((p) => resultado.porArea.some((a) => a.area === p.area));

  return (
    <AppShell>
      <PageHeader titulo="Resultado do simulado" />

      <div className="mb-8 flex flex-wrap items-end gap-x-10 gap-y-4 border-b border-rule pb-8">
        <div>
          <p className="font-display text-4xl text-ink">
            {resultado.acertos} de {resultado.total}
          </p>
        </div>
        <div>
          <p className="font-display text-2xl text-ink">{formatarDuracao(resultado.duracaoSegundos)}</p>
          <p className="mt-1 text-sm text-ink-2">Tempo gasto</p>
        </div>
        <div>
          <p className="font-display text-2xl text-ink">{resultado.emBranco}</p>
          <p className="mt-1 text-sm text-ink-2">Em branco</p>
        </div>
      </div>

      <section className="mb-10">
        <CartaoResposta
          itens={resultado.itens.map((i) => ({
            n: i.n,
            resposta: i.resposta,
            gabarito: i.gabarito,
            correta: i.correta,
            marcada: i.marcada,
          }))}
          hrefBase={(n) => `/simulados/${id}/questao/${n}`}
        />
      </section>

      {resultado.porArea.length > 1 ? (
        <section className="mb-10">
          <h2 className="mb-3 text-lg text-ink">Por área</h2>
          <ul className="flex flex-col gap-2">
            {resultado.porArea.map((a) => (
              <li key={a.area} className="flex items-center justify-between gap-3 border-b border-rule pb-2">
                <AreaTag area={a.area} />
                <span className="text-sm text-ink">
                  {a.acertos} de {a.total}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {resultado.habilidadesFracas.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-3 text-lg text-ink">Habilidades para reforçar</h2>
          <ul className="flex flex-col gap-3">
            {resultado.habilidadesFracas.map((h) => (
              <li key={h.habilidade.codigo} className="flex items-center justify-between gap-3 border-b border-rule pb-3">
                <div className="flex items-center gap-2">
                  <AreaTag area={h.area} />
                  <span className="text-sm text-ink">
                    {h.habilidade.codigo} ({h.acertos} de {h.total})
                  </span>
                </div>
                <Button
                  variante="secundario"
                  onClick={() => router.push(`/treino?modo=habilidade&habilidade=${h.habilidade.codigo}&area=${h.area}`)}
                >
                  Treinar esta habilidade
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {proficienciasDasAreas.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-3 text-lg text-ink">Proficiência estimada</h2>
          <div className="flex flex-col gap-4">
            {proficienciasDasAreas.map((p) => (
              <div key={p.area}>
                {p.status === "ok" ? (
                  <p className="text-sm text-ink">
                    {p.area}: {p.valor} ({p.rotuloEscala}){p.tendencia ? ` (${ROTULO_TENDENCIA[p.tendencia]})` : ""}
                  </p>
                ) : (
                  <ProgressToMinimum
                    atual={p.respostasConsideradas}
                    minimo={p.respostasMinimas}
                    rotulo={`estimar sua proficiência em ${p.area}`}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => router.push("/simulados")}>Novo simulado</Button>
        {resultado.habilidadesFracas.length > 0 ? (
          <Button
            variante="secundario"
            onClick={() => router.push(`/treino?modo=habilidade&habilidade=${resultado.habilidadesFracas[0].habilidade.codigo}`)}
          >
            Treinar as habilidades fracas
          </Button>
        ) : null}
        <Button variante="secundario" onClick={() => router.push("/simulados")}>
          Voltar a Simulados
        </Button>
      </div>
    </AppShell>
  );
}
