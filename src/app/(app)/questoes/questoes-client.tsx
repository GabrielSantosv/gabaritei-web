"use client";

import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useMemo } from "react";

import { AreaTag } from "@/components/dominio/area-tag";
import { FaixaChip } from "@/components/dominio/faixa-chip";
import { StatusChip } from "@/components/dominio/status-chip";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { RemovableChip } from "@/components/ui/removable-chip";
import { Select } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getApi } from "@/lib/api/client";
import { mensagemDoErro } from "@/lib/api/errors";
import type { Area, Faixa, Habilidade, QuestaoResumo } from "@/lib/api/types";
import {
  contarFiltrosAtivos,
  FILTROS_PADRAO,
  filtrosParaQueryString,
  lerFiltrosDaUrl,
  ordenarQuestoes,
  PAGINA_TAMANHO,
  paraFiltrosApi,
  type EstadoFiltros,
  type OrdenarPor,
} from "@/lib/questoes-filtros";
import { revelar } from "@/lib/reveal";

const AREAS: Area[] = ["LC", "CH", "CN", "MT"];
const FAIXAS: { valor: Faixa; rotulo: string }[] = [
  { valor: "facil", rotulo: "Fácil" },
  { valor: "media", rotulo: "Média" },
  { valor: "dificil", rotulo: "Difícil" },
];
const ANOS = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];
const ANOS_ASC = [...ANOS].sort((a, b) => a - b);

/** De/Até (canvas Telas.dc.html): converte o intervalo escolhido pros anos de
 *  verdade que existem no banco — o filtro em si continua sendo uma lista de
 *  anos (seção 7.1, FiltrosQuestoes.anos), só a apresentação virou intervalo. */
function intervaloDeAnos(de: number | null, ate: number | null): number[] {
  if (de === null && ate === null) return [];
  const minimo = de ?? ANOS_ASC[0];
  const maximo = ate ?? ANOS_ASC[ANOS_ASC.length - 1];
  const [lo, hi] = minimo <= maximo ? [minimo, maximo] : [maximo, minimo];
  return ANOS_ASC.filter((a) => a >= lo && a <= hi);
}

const ROTULO_AREA: Record<Area, string> = { LC: "Linguagens", CH: "Ciências Humanas", CN: "Ciências da Natureza", MT: "Matemática" };

function toggle<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

/**
 * Agrupa as habilidades por assunto (ex.: Matemática → Geometria → H47-H49).
 * O filtro de Questões escolhe um assunto inteiro de uma vez — mais fácil de
 * reconhecer do que a lista de ~59 códigos de habilidade que ele substituiu.
 */
function agruparPorAssunto(habilidades: Habilidade[]): Map<string, { area: Area; codigos: string[] }> {
  const porAssunto = new Map<string, { area: Area; codigos: string[] }>();
  for (const h of habilidades) {
    const atual = porAssunto.get(h.assunto) ?? { area: h.area, codigos: [] };
    atual.codigos.push(h.codigo);
    porAssunto.set(h.assunto, atual);
  }
  return porAssunto;
}

/** Acha o nome do assunto cujo conjunto de códigos é exatamente `codigosFiltro`. */
function assuntoDoFiltro(porAssunto: Map<string, { area: Area; codigos: string[] }>, codigosFiltro: string[]): string | null {
  if (codigosFiltro.length === 0) return null;
  const conjunto = new Set(codigosFiltro);
  for (const [nome, v] of porAssunto) {
    if (v.codigos.length === conjunto.size && v.codigos.every((c) => conjunto.has(c))) return nome;
  }
  return null;
}

function PainelFiltros({
  estado,
  habilidades,
  onMudar,
}: {
  estado: EstadoFiltros;
  habilidades: Habilidade[];
  onMudar: (novo: Partial<EstadoFiltros>) => void;
}) {
  const porAssunto = useMemo(() => agruparPorAssunto(habilidades), [habilidades]);
  const opcoesAssunto = useMemo(
    () => [...porAssunto.entries()].map(([nome, v]) => ({ valor: nome, rotulo: nome, grupo: ROTULO_AREA[v.area] })),
    [porAssunto],
  );
  const assuntoSelecionado = assuntoDoFiltro(porAssunto, estado.habilidades);

  // De/Até (canvas Telas.dc.html): mostra o intervalo que já está selecionado;
  // se o estado de anos veio de uma URL montada à mão com lacunas, mostra só
  // o intervalo que envolve tudo — o filtro de verdade (estado.anos) não muda.
  const deAno = estado.anos.length > 0 ? Math.min(...estado.anos) : null;
  const ateAno = estado.anos.length > 0 ? Math.max(...estado.anos) : null;

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Área</legend>
        <div className="flex flex-col gap-1">
          {AREAS.map((area) => (
            <Checkbox
              key={area}
              rotulo={<AreaTag area={area} />}
              checked={estado.areas.includes(area)}
              onCheckedChange={() => onMudar({ areas: toggle(estado.areas, area), pagina: 1 })}
            />
          ))}
        </div>
      </fieldset>

      <div>
        <Combobox
          rotulo="Assunto"
          placeholder="Todos"
          valor={assuntoSelecionado}
          onValorChange={(nome) => onMudar({ habilidades: nome ? porAssunto.get(nome)?.codigos ?? [] : [], pagina: 1 })}
          opcoes={opcoesAssunto}
        />
        {estado.habilidades.length > 0 ? (
          <p className="mt-1.5 text-xs text-ink-2">Questões sem esse dado cadastrado não aparecem neste filtro.</p>
        ) : null}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Ano</legend>
        <div className="flex gap-3">
          <Select
            rotulo="De"
            value={deAno !== null ? String(deAno) : ""}
            onChange={(e) => {
              const novoDe = e.target.value ? Number(e.target.value) : null;
              onMudar({ anos: intervaloDeAnos(novoDe, ateAno), pagina: 1 });
            }}
            opcoes={[{ valor: "", rotulo: "Todos" }, ...ANOS_ASC.map((a) => ({ valor: String(a), rotulo: String(a) }))]}
          />
          <Select
            rotulo="Até"
            value={ateAno !== null ? String(ateAno) : ""}
            onChange={(e) => {
              const novoAte = e.target.value ? Number(e.target.value) : null;
              onMudar({ anos: intervaloDeAnos(deAno, novoAte), pagina: 1 });
            }}
            opcoes={[{ valor: "", rotulo: "Todos" }, ...ANOS_ASC.map((a) => ({ valor: String(a), rotulo: String(a) }))]}
          />
        </div>
        {estado.anos.length > 0 ? (
          <p className="mt-1.5 text-xs text-ink-2">Questões sem esse dado cadastrado não aparecem neste filtro.</p>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Dificuldade</legend>
        <div className="flex flex-col gap-1">
          {FAIXAS.map((f) => (
            <Checkbox
              key={f.valor}
              rotulo={f.rotulo}
              checked={estado.faixas.includes(f.valor)}
              onCheckedChange={() => onMudar({ faixas: toggle(estado.faixas, f.valor), pagina: 1 })}
            />
          ))}
        </div>
      </fieldset>

      {contarFiltrosAtivos(estado) > 0 ? (
        <button
          type="button"
          onClick={() => onMudar(FILTROS_PADRAO)}
          className="self-start text-sm font-medium text-brand-ink underline underline-offset-2"
        >
          Limpar filtros
        </button>
      ) : null}
    </div>
  );
}

function LinhaQuestao({ questao, contexto }: { questao: QuestaoResumo; contexto: string }) {
  return (
    <li className="border-b border-rule last:border-b-0">
      <Link
        href={`/questoes/${questao.id}?de=questoes${contexto ? `&${contexto}` : ""}`}
        className="flex flex-col gap-2.5 px-5 py-4 hover:bg-paper-2 focus-visible:bg-paper-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <AreaTag area={questao.area} />
            <span className="font-mono text-xs text-ink-2">{questao.habilidade?.codigo ?? "Habilidade não informada"}</span>
            <span className="text-xs text-ink-2">{questao.ano ?? "Ano não informado"}</span>
            <FaixaChip faixa={questao.faixa} />
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-ink-2">{questao.trecho}</p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <StatusChip status={questao.ultimaTentativa === "acertou" ? "acertou" : questao.ultimaTentativa === "errou" ? "errou" : "nao_respondida"} />
          <span className="text-sm font-medium text-brand-ink">Resolver</span>
        </div>
      </Link>
    </li>
  );
}

function ListaQuestoes() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const estado = useMemo(() => lerFiltrosDaUrl(searchParams), [searchParams]);

  function onMudar(parcial: Partial<EstadoFiltros>) {
    const novo = { ...estado, ...parcial };
    const qs = filtrosParaQueryString(novo);
    router.replace(qs ? `/questoes?${qs}` : "/questoes", { scroll: false });
  }

  const { data: habilidades } = useQuery({
    queryKey: ["habilidades"],
    queryFn: () => getApi().listarHabilidades(),
  });

  const {
    data: pagina,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["questoes", estado.areas, estado.habilidades, estado.anos, estado.faixas, estado.pagina],
    queryFn: () =>
      getApi().listarQuestoes(paraFiltrosApi(estado), { pagina: estado.pagina, porPagina: PAGINA_TAMANHO }),
  });

  const itensOrdenados = useMemo(() => (pagina ? ordenarQuestoes(pagina.itens, estado.ordenar) : []), [pagina, estado.ordenar]);
  const totalPaginas = pagina ? Math.max(1, Math.ceil(pagina.total / PAGINA_TAMANHO)) : 1;
  const filtrosAtivos = contarFiltrosAtivos(estado);
  const porAssunto = useMemo(() => agruparPorAssunto(habilidades ?? []), [habilidades]);

  const chips: { rotulo: string; aoRemover: () => void }[] = [
    ...estado.areas.map((a) => ({ rotulo: ROTULO_AREA[a], aoRemover: () => onMudar({ areas: toggle(estado.areas, a), pagina: 1 }) })),
    // A Combobox escolhe um assunto inteiro de uma vez, então o chip representa
    // o assunto todo (não um código isolado) — ver agruparPorAssunto/assuntoDoFiltro.
    ...(estado.habilidades.length > 0
      ? [
          {
            rotulo: assuntoDoFiltro(porAssunto, estado.habilidades) ?? estado.habilidades.join(", "),
            aoRemover: () => onMudar({ habilidades: [], pagina: 1 }),
          },
        ]
      : []),
    // De/Até (canvas Telas.dc.html): um chip só pro intervalo todo, não um por ano.
    ...(estado.anos.length > 0
      ? [
          {
            rotulo:
              Math.min(...estado.anos) === Math.max(...estado.anos)
                ? String(estado.anos[0])
                : `${Math.min(...estado.anos)} a ${Math.max(...estado.anos)}`,
            aoRemover: () => onMudar({ anos: [], pagina: 1 }),
          },
        ]
      : []),
    ...estado.faixas.map((f) => ({
      rotulo: FAIXAS.find((x) => x.valor === f)?.rotulo ?? f,
      aoRemover: () => onMudar({ faixas: toggle(estado.faixas, f), pagina: 1 }),
    })),
  ];

  return (
    <div>
      <PageHeader titulo="Questões" />

      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="mb-4 flex min-h-12 items-center gap-2 rounded-sm border border-rule-strong bg-card px-4 text-sm font-medium text-ink"
            >
              <SlidersHorizontal className="size-4" strokeWidth={1.75} aria-hidden="true" />
              Filtros{filtrosAtivos > 0 ? `, ${filtrosAtivos} ativos` : ""}
            </button>
          </SheetTrigger>
          <SheetContent titulo="Filtros" lado="direita">
            <PainelFiltros estado={estado} habilidades={habilidades ?? []} onMudar={onMudar} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside
          {...revelar(0)}
          className="hidden h-fit flex-col gap-5 rounded-md border border-rule bg-card p-5 lg:flex"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-ink">Filtros</h2>
            {filtrosAtivos > 0 ? <span className="text-sm text-ink-2">{filtrosAtivos} ativos</span> : null}
          </div>
          <PainelFiltros estado={estado} habilidades={habilidades ?? []} onMudar={onMudar} />
        </aside>

        <div {...revelar(1)}>
          {chips.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {chips.map((chip, i) => (
                <RemovableChip key={i} rotulo={chip.rotulo} onRemover={chip.aoRemover}>
                  {chip.rotulo}
                </RemovableChip>
              ))}
            </div>
          ) : null}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="font-display text-lg font-semibold text-ink">
              {isLoading ? "Buscando questões…" : pagina ? `${pagina.total} ${pagina.total === 1 ? "questão encontrada" : "questões encontradas"}` : null}
            </p>
            <div className="flex items-center gap-2.5">
              <label htmlFor="ordenar-por" className="text-sm text-ink-2">
                Ordenar por
              </label>
              <select
                id="ordenar-por"
                value={estado.ordenar}
                onChange={(e) => onMudar({ ordenar: e.target.value as OrdenarPor })}
                className="min-h-11 rounded-sm border border-rule-strong bg-card px-3 text-sm text-ink"
              >
                <option value="ano_desc">Ano, mais recente primeiro</option>
                <option value="ano_asc">Ano, mais antigo primeiro</option>
                <option value="faixa_asc">Dificuldade, da fácil para a difícil</option>
                <option value="faixa_desc">Dificuldade, da difícil para a fácil</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState mensagem={mensagemDoErro(error)} onTentarDeNovo={() => refetch()} />
          ) : itensOrdenados.length === 0 ? (
            <EmptyState
              titulo="Nenhuma questão com esses filtros."
              descricao={filtrosAtivos > 0 ? "Tente remover algum filtro." : undefined}
              acao={
                filtrosAtivos > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {chips.map((chip, i) => (
                      <RemovableChip key={i} rotulo={chip.rotulo} onRemover={chip.aoRemover}>
                        Tirar {chip.rotulo}
                      </RemovableChip>
                    ))}
                  </div>
                ) : undefined
              }
            />
          ) : (
            <>
              <ul className="overflow-hidden rounded-md border border-rule bg-card">
                {itensOrdenados.map((q) => (
                  <LinhaQuestao key={q.id} questao={q} contexto={filtrosParaQueryString(estado)} />
                ))}
              </ul>
              <Pagination
                className="mt-6 justify-center"
                paginaAtual={estado.pagina}
                totalPaginas={totalPaginas}
                onPaginaChange={(p) => onMudar({ pagina: p })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function QuestoesClient() {
  return (
    <Suspense fallback={null}>
      <ListaQuestoes />
    </Suspense>
  );
}
