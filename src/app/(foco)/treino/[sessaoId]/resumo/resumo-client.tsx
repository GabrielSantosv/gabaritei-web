"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";

import { CartaoRespostaMini } from "@/components/dominio/cartao-resposta-mini";
import { CriterioRecomendacao } from "@/components/dominio/criterio-recomendacao";
import { FoguinhoBadge } from "@/components/dominio/foguinho-badge";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ProgressToMinimum } from "@/components/ui/progress-to-minimum";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCaption, TableHead, TableRow, TableTd, TableTh } from "@/components/ui/table";
import { getApi } from "@/lib/api/client";
import { mensagemDoErro } from "@/lib/api/errors";
import { formatarDuracao, formatarPercentual } from "@/lib/format";

const ROTULO_TENDENCIA: Record<string, string> = { subindo: "Subindo", estavel: "Estável", caindo: "Caindo" };

export function ResumoClient() {
  const params = useParams<{ sessaoId: string }>();
  const router = useRouter();
  const sessaoId = params.sessaoId;

  const { data: resumo, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["resumo-sessao", sessaoId],
    queryFn: () => getApi().obterResumoSessao(sessaoId),
  });

  if (isLoading || !resumo) {
    return (
      <AppShell>
        <PageHeader titulo="Sessão concluída" />
        {isError ? (
          <ErrorState mensagem={mensagemDoErro(error)} onTentarDeNovo={() => refetch()} />
        ) : (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}
      </AppShell>
    );
  }

  const taxaAcerto = resumo.itens.length > 0 ? resumo.sessao.acertos / resumo.itens.length : null;
  const areasDaSessao = [...new Set(resumo.itens.map((i) => i.area))];
  const proficienciasDaSessao = resumo.proficiencias.filter((p) => areasDaSessao.includes(p.area));

  return (
    <AppShell>
      <PageHeader titulo="Sessão concluída" />

      <div className="mb-8 flex flex-wrap items-end gap-x-10 gap-y-4 border-b border-rule pb-8">
        <div>
          <p className="font-display text-4xl text-ink">
            {resumo.sessao.acertos} de {resumo.itens.length}
          </p>
          {/* check-regras: ignore, "—" aqui é placeholder de valor ausente, não separador (ver PENDENCIAS.md) */}
          <p className="mt-1 text-sm text-ink-2">{taxaAcerto !== null ? formatarPercentual(taxaAcerto * 100) : "—"} de acerto</p>
        </div>
        <div>
          <p className="font-display text-2xl text-ink">
            {/* check-regras: ignore, "—" aqui é placeholder de valor ausente, não separador (ver PENDENCIAS.md) */}
            {resumo.sessao.duracaoSegundos !== null ? formatarDuracao(resumo.sessao.duracaoSegundos) : "—"}
          </p>
          <p className="mt-1 text-sm text-ink-2">Tempo total</p>
        </div>
        {resumo.sessao.combo ? (
          <div>
            <p className="font-display text-2xl text-ink">×{resumo.sessao.combo.melhor}</p>
            <p className="mt-1 text-sm text-ink-2">Maior Combo</p>
          </div>
        ) : null}
      </div>

      {resumo.itens.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg text-ink">Questões desta sessão</h2>
          <CartaoRespostaMini
            variante="resumo"
            itens={resumo.itens.map((i) => ({
              n: i.posicao,
              letra: i.letra,
              correta: i.correta,
              href: `/questoes/${i.questaoId}?tentativa=${i.tentativaId}`,
            }))}
          />
        </section>
      ) : null}

      {resumo.porHabilidade.length > 0 ? (
        <section className="mb-8">
          <Table>
            <TableCaption>Por habilidade</TableCaption>
            <TableHead>
              <TableRow>
                <TableTh>Habilidade</TableTh>
                <TableTh>Acertos</TableTh>
              </TableRow>
            </TableHead>
            <TableBody>
              {resumo.porHabilidade.map((h, i) => (
                <TableRow key={i}>
                  <TableTd>{h.habilidade?.codigo ?? "Não informada"}</TableTd>
                  <TableTd>
                    {h.acertos} de {h.total}
                  </TableTd>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 text-lg text-ink">Foguinho</h2>
        <FoguinhoBadge
          atual={resumo.foguinho.atual}
          melhor={resumo.foguinho.melhor}
          hojeContou={resumo.foguinho.hojeContou}
          emRisco={resumo.foguinho.emRisco}
        />
      </section>

      {proficienciasDaSessao.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg text-ink">Proficiência</h2>
          <div className="flex flex-col gap-4">
            {proficienciasDaSessao.map((p) => (
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

      {resumo.proxima ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg text-ink">Próxima sugestão</h2>
          <CriterioRecomendacao criterio={resumo.proxima.criterio} />
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => router.push(`/treino?modo=${resumo.sessao.modo}`)}>Treinar mais</Button>
        <Button variante="secundario" onClick={() => router.push("/inicio")}>
          Voltar ao início
        </Button>
      </div>
    </AppShell>
  );
}
