"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, MoreHorizontal, TrendingDown, TrendingUp } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { ErrorState } from "@/components/ui/error-state";
import { Link } from "@/components/ui/link";
import { PageHeader } from "@/components/layout/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { getApi } from "@/lib/api/client";
import { mensagemDoErro } from "@/lib/api/errors";
import { cn } from "@/lib/cn";
import { formatarPercentual } from "@/lib/format";
import type { Area, DesempenhoAssunto, PeriodoDesempenho, Tendencia } from "@/lib/api/types";
import { revelar } from "@/lib/reveal";
import { salvarFilaSessao, salvarSessaoAtivaId } from "@/lib/sessao-ativa";

const AREAS: Area[] = ["LC", "CH", "CN", "MT"];
const NOME_AREA: Record<Area, string> = {
  LC: "Linguagens",
  CH: "Ciências Humanas",
  CN: "Ciências da Natureza",
  MT: "Matemática",
};
const PERIODOS: { valor: PeriodoDesempenho; rotulo: string }[] = [
  { valor: "7", rotulo: "7 dias" },
  { valor: "30", rotulo: "30 dias" },
  { valor: "90", rotulo: "90 dias" },
  { valor: "tudo", rotulo: "Tudo" },
];

function IconeTendencia({ tendencia }: { tendencia: Tendencia | null }) {
  // Nunca cor de alerta pra queda (seção 4.3: "sem cor de alerta para queda")
  // — a diferença fica só no ícone e no texto, tudo em --ink-2.
  if (tendencia === null) return <MoreHorizontal className="size-3.5" strokeWidth={1.75} aria-hidden="true" />;
  if (tendencia === "subindo") return <TrendingUp className="size-3.5" strokeWidth={1.75} aria-hidden="true" />;
  if (tendencia === "caindo") return <TrendingDown className="size-3.5" strokeWidth={1.75} aria-hidden="true" />;
  return <ChevronRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />;
}

function RotuloTendencia({ tendencia }: { tendencia: Tendencia | null }) {
  const texto = tendencia === null ? "Poucos dados" : tendencia === "subindo" ? "Subindo" : tendencia === "caindo" ? "Caindo" : "Estável";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
      <IconeTendencia tendencia={tendencia} />
      {texto}
    </span>
  );
}

function faixaDeCodigos(assunto: DesempenhoAssunto): string {
  if (assunto.habilidades.length === 0) return "";
  if (assunto.habilidades.length === 1) return assunto.habilidades[0].habilidade.codigo;
  return `${assunto.habilidades[0].habilidade.codigo} a ${assunto.habilidades[assunto.habilidades.length - 1].habilidade.codigo}`;
}

function BarraTaxa({ taxaAcerto }: { taxaAcerto: number | null }) {
  if (taxaAcerto === null) return <span className="text-xs text-ink-2">Sem dados</span>;
  return (
    <div className="flex items-center gap-2">
      <ProgressBar valor={Math.round(taxaAcerto * 100)} total={100} rotulo="Taxa de acerto" mostrarNumero={false} className="w-20" />
      <span className="text-sm font-medium text-ink">{formatarPercentual(taxaAcerto * 100)}</span>
    </div>
  );
}

function PainelArea({ area }: { area: Area }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const periodo = (searchParams.get("periodo") as PeriodoDesempenho) || "30";

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["desempenho", area, periodo],
    queryFn: () => getApi().obterDesempenho(area, periodo),
  });

  const [assuntoSelecionado, setAssuntoSelecionado] = useState<string | null>(null);
  // Primeiro da lista (já vem ordenado do mais fraco pro mais forte) assim
  // que os dados chegam, sem travar uma escolha manual posterior.
  const [assuntoPreenchido, setAssuntoPreenchido] = useState(false);
  if (data && !assuntoPreenchido) {
    setAssuntoPreenchido(true);
    if (data.assuntos[0]) setAssuntoSelecionado(data.assuntos[0].nome);
  }

  function mudarPeriodo(novo: PeriodoDesempenho) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", novo);
    router.replace(`/desempenho/${area}?${params.toString()}`, { scroll: false });
  }

  async function treinarAssunto(assunto: DesempenhoAssunto) {
    const codigos = assunto.habilidades.map((h) => h.habilidade.codigo);
    const { sessao, primeira } = await getApi().iniciarSessao({
      modo: "habilidade",
      areas: [area],
      habilidades: codigos,
      quantidade: 10,
    });
    salvarSessaoAtivaId(sessao.id);
    salvarFilaSessao(sessao.id, { itens: primeira.itens, aviso: primeira.aviso, modelo: primeira.modelo });
    router.push(`/treino/${sessao.id}`);
  }

  const assunto = data?.assuntos.find((a) => a.nome === assuntoSelecionado) ?? null;
  const codigosDoAssunto = assunto ? assunto.habilidades.map((h) => h.habilidade.codigo) : [];
  const faixaHabilidades = assunto ? faixaDeCodigos(assunto) : "";

  return (
    <div>
      <PageHeader
        titulo={`Desempenho em ${NOME_AREA[area]}`}
        descricao="Veja em quais assuntos você mais erra e treine direto neles."
      />

      <div {...revelar(0)} className="flex flex-wrap items-center gap-2">
        {AREAS.map((a) => (
          <Link
            key={a}
            href={`/desempenho/${a}?periodo=${periodo}`}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium no-underline motion-safe-transition",
              a === area ? "border-brand bg-brand-soft text-brand-ink" : "border-rule-strong text-ink hover:bg-paper-2",
            )}
          >
            {a} {NOME_AREA[a]}
          </Link>
        ))}
        <span className="mx-1 h-6 w-px bg-rule" aria-hidden="true" />
        {PERIODOS.map((p) => (
          <button
            key={p.valor}
            type="button"
            aria-pressed={periodo === p.valor}
            onClick={() => mudarPeriodo(p.valor)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium motion-safe-transition",
              periodo === p.valor ? "border-ink bg-ink text-paper" : "border-rule-strong text-ink hover:bg-paper-2",
            )}
          >
            {p.rotulo}
          </button>
        ))}
      </div>

      <div {...revelar(1)} className="mt-6">
        {isLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : isError ? (
          <ErrorState mensagem={mensagemDoErro(error)} onTentarDeNovo={() => refetch()} />
        ) : data ? (
          <div className="grid grid-cols-2 divide-x divide-y divide-rule rounded-md border border-rule bg-card sm:grid-cols-4 sm:divide-y-0">
            <div className="p-4">
              <p className="font-display text-2xl text-ink">{data.respondidas}</p>
              <p className="text-xs text-ink-2">Respondidas</p>
              <p className="text-xs text-ink-2">Em {NOME_AREA[area]}</p>
            </div>
            <div className="p-4">
              <p className="font-display text-2xl text-ink">{data.acertos}</p>
              <p className="text-xs text-ink-2">Acertos</p>
              <p className="text-xs text-ink-2">Questões que você acertou</p>
            </div>
            <div className="p-4">
              <p className="font-display text-2xl text-ink">
                {data.taxaAcerto !== null ? formatarPercentual(data.taxaAcerto * 100) : "Sem dados"}
              </p>
              <p className="text-xs text-ink-2">Taxa de acerto</p>
              <p className="text-xs text-ink-2">Média da área</p>
            </div>
            <div className="p-4">
              <p className="font-display text-xl text-ink">{data.assuntoMaisFraco?.nome ?? "Sem dados"}</p>
              <p className="text-xs text-ink-2">Assunto mais fraco</p>
              {data.assuntoMaisFraco ? (
                <p className="text-xs text-ink-2">
                  {formatarPercentual(data.assuntoMaisFraco.taxaAcerto * 100)} de acerto em {data.assuntoMaisFraco.respondidas} respostas
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {data && data.assuntos.length > 0 ? (
        <div {...revelar(2)} className="mt-6 rounded-md border border-rule bg-card">
          <div className="p-5 pb-3">
            <h2 className="font-display text-lg text-ink">Assuntos de {NOME_AREA[area]}</h2>
            <p className="mt-1 text-sm text-ink-2">
              Do que você mais erra pro que você mais acerta. Escolha um assunto pra ver as habilidades dele. Com menos de 5
              respostas, o assunto fica no fim da lista.
            </p>
          </div>
          <ul>
            {data.assuntos.map((a) => (
              <li
                key={a.nome}
                className={cn(
                  "flex flex-wrap items-center gap-3 border-t border-rule px-5 py-4 motion-safe-transition",
                  assuntoSelecionado === a.nome && "bg-brand-soft",
                )}
              >
                {/* O botão cobre nome/código/números (seleciona o assunto); "Treinar"
                    é um link irmão, fora do botão — dois controles não podem ficar
                    aninhados ("nested-interactive" no axe). */}
                <button
                  type="button"
                  aria-current={assuntoSelecionado === a.nome ? "true" : undefined}
                  onClick={() => setAssuntoSelecionado(a.nome)}
                  className="flex min-w-0 flex-1 flex-wrap items-center gap-3 text-left hover:text-ink"
                >
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-ink-2 motion-safe-transition",
                      assuntoSelecionado === a.nome ? "rotate-0" : "-rotate-90",
                    )}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">{a.nome}</span>
                      {a.maisFraco ? (
                        <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-medium text-ink-2">Mais fraco</span>
                      ) : null}
                    </span>
                    {a.habilidades.length > 0 ? (
                      <span className="font-mono text-xs text-ink-2">{faixaDeCodigos(a)}</span>
                    ) : null}
                  </span>
                  <span className="w-20 shrink-0 text-right text-sm text-ink-2">{a.respondidas}</span>
                  <span className="w-32 shrink-0">
                    <BarraTaxa taxaAcerto={a.taxaAcerto} />
                  </span>
                  <span className="w-24 shrink-0">
                    <RotuloTendencia tendencia={a.tendencia} />
                  </span>
                </button>
                <Link href={`/treino?modo=habilidade&area=${area}&assunto=${encodeURIComponent(a.nome)}`} className="shrink-0 text-sm font-medium">
                  Treinar
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : data ? (
        <div {...revelar(2)} className="mt-6">
          <ErrorState mensagem="Nenhum assunto cadastrado para esta área ainda." onTentarDeNovo={() => refetch()} />
        </div>
      ) : null}

      {assunto ? (
        <div {...revelar(3)} className="mt-6 rounded-md border border-rule bg-card p-5">
          <h2 className="font-display text-lg text-ink">Habilidades de {assunto.nome}</h2>
          <p className="mt-1 text-sm text-ink-2">
            Habilidades {faixaHabilidades}. Com menos de 5 respostas, ainda não há tendência.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/questoes?areas=${area}&habilidades=${codigosDoAssunto.join(",")}`}
              className="inline-flex min-h-12 items-center rounded-sm border border-rule-strong px-4 text-sm font-medium text-ink no-underline hover:bg-paper-2"
            >
              Ver questões de {assunto.nome}
            </Link>
            <button
              type="button"
              onClick={() => void treinarAssunto(assunto)}
              className="inline-flex min-h-12 items-center rounded-sm bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-hover"
            >
              Treinar {assunto.nome}, 10 questões
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-md border border-rule">
            <ul>
              {assunto.habilidades.map((h) => (
                <li
                  key={h.habilidade.codigo}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-card px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{h.habilidade.descricao ?? "Habilidade sem descrição"}</p>
                    <p className="font-mono text-xs text-ink-2">{h.habilidade.codigo}</p>
                  </div>
                  <span className="w-16 shrink-0 text-right text-sm text-ink-2">{h.respondidas}</span>
                  <span className="w-32 shrink-0">
                    <BarraTaxa taxaAcerto={h.taxaAcerto} />
                  </span>
                  <span className="w-24 shrink-0">
                    <RotuloTendencia tendencia={h.tendencia} />
                  </span>
                  <Link
                    href={`/treino?modo=habilidade&habilidade=${h.habilidade.codigo}&area=${area}`}
                    className="shrink-0 text-sm font-medium"
                  >
                    Treinar
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AreaInvalida() {
  return (
    <div>
      <PageHeader titulo="Desempenho" />
      <ErrorState mensagem="Área não encontrada." onTentarDeNovo={() => {}} />
      <Link href="/desempenho" className="mt-4 inline-block">
        Voltar para Desempenho
      </Link>
    </div>
  );
}

function DesempenhoAreaInterno() {
  const params = useParams<{ area: string }>();
  const area = params.area?.toUpperCase();
  if (!AREAS.includes(area as Area)) return <AreaInvalida />;
  return <PainelArea area={area as Area} />;
}

export function DesempenhoAreaClient() {
  return (
    <Suspense fallback={null}>
      <DesempenhoAreaInterno />
    </Suspense>
  );
}
