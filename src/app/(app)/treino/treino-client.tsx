"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles, SlidersHorizontal, Target, TrendingUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { AreaTile } from "@/components/dominio/area-tile";
import { CriterioRecomendacao } from "@/components/dominio/criterio-recomendacao";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/layout/page-header";
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { getApi } from "@/lib/api/client";
import { mensagemDoErro } from "@/lib/api/errors";
import { cn } from "@/lib/cn";
import { formatarPercentual } from "@/lib/format";
import type { Area, PedidoRecomendacao } from "@/lib/api/types";
import { limparDescricaoHabilidadeMock } from "@/lib/questoes-filtros";
import { revelar } from "@/lib/reveal";
import { salvarFilaSessao, salvarSessaoAtivaId } from "@/lib/sessao-ativa";

type Modo = "tema" | "habilidade" | "nivel" | "progressao";
const AREAS: Area[] = ["LC", "CH", "CN", "MT"];
const ROTULO_AREA: Record<Area, string> = {
  LC: "Linguagens",
  CH: "Ciências Humanas",
  CN: "Ciências da Natureza",
  MT: "Matemática",
};
const QUANTIDADES = [5, 10, 15, 20] as const;

function toggle<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

function EscolherModo() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [modo, setModo] = useState<Modo>((searchParams.get("modo") as Modo) || "tema");
  const [areas, setAreas] = useState<Area[]>(() => {
    const a = searchParams.get("area");
    return a && AREAS.includes(a as Area) ? [a as Area] : [];
  });
  const [habilidade, setHabilidade] = useState<string | null>(searchParams.get("habilidade"));
  const [assunto, setAssunto] = useState<string | null>(searchParams.get("assunto"));
  const [temaTexto, setTemaTexto] = useState("");
  const [quantidade, setQuantidade] = useState(10);
  const [iniciando, setIniciando] = useState(false);
  const [erroIniciar, setErroIniciar] = useState<string | null>(null);

  const { data: reforco } = useQuery({ queryKey: ["reforco"], queryFn: () => getApi().obterReforco() });
  const { data: proficiencias } = useQuery({
    queryKey: ["proficiencias"],
    queryFn: () => getApi().obterProficiencias(),
  });
  const { data: resumoGeral } = useQuery({ queryKey: ["resumo-geral"], queryFn: () => getApi().obterResumoGeral() });

  // Assunto (Desempenho, pedido à parte): só faz sentido com exatamente uma
  // área escolhida — o mesmo nome de assunto não existe nas outras áreas.
  const areaUnica = areas.length === 1 ? areas[0] : null;
  const { data: desempenhoArea } = useQuery({
    queryKey: ["desempenho", areaUnica, "tudo"],
    queryFn: () => getApi().obterDesempenho(areaUnica as Area, "tudo"),
    enabled: areaUnica !== null,
  });
  const assuntoSelecionado = areaUnica ? (desempenhoArea?.assuntos.find((a) => a.nome === assunto) ?? null) : null;
  // Troca de área (ou deixou de ser uma área só): o assunto da área antiga
  // não existe mais pra escolher — limpa assim que detecta, igual ao padrão
  // já usado abaixo pra habilidade/modo.
  const [areaDoAssuntoLimpo, setAreaDoAssuntoLimpo] = useState(areaUnica);
  if (areaUnica !== areaDoAssuntoLimpo) {
    setAreaDoAssuntoLimpo(areaUnica);
    if (assunto) setAssunto(null);
  }

  const semHistorico = resumoGeral ? resumoGeral.respondidas === 0 : false;

  // Ajuste durante a renderização (react.dev "Adjusting state when a prop
  // changes"), em vez de efeito: sem histórico, o modo tema é o único
  // disponível (RF11) — força a seleção assim que soubermos disso.
  const [semHistoricoAplicado, setSemHistoricoAplicado] = useState(false);
  if (semHistorico && !semHistoricoAplicado) {
    setSemHistoricoAplicado(true);
    if (modo !== "tema") setModo("tema");
  }

  const habilidadeDisponivel = reforco?.status === "ok";
  const motivoHabilidade = reforco
    ? `Disponível depois de ${reforco.respostasMinimas} respostas. Faltam ${Math.max(0, reforco.respostasMinimas - reforco.respostasAtuais)}.`
    : undefined;
  // Assunto (Desempenho, pedido à parte): mostra pra onde o reforço aponta
  // agora, já com o nome do assunto da habilidade — só decorativo, não muda o
  // pedido (quem muda o pedido é a escolha de verdade na Combobox/ladrilhos).
  const prioridadeTopo = reforco?.prioridades[0];
  const motivoHabilidadeDisponivel = prioridadeTopo
    ? `Disponível. Reforço indicado agora: ${prioridadeTopo.habilidade.codigo} de ${ROTULO_AREA[prioridadeTopo.area]}, em ${prioridadeTopo.habilidade.assunto}.`
    : "Disponível.";

  const nivelDisponivel = proficiencias?.some((p) => p.status === "ok") ?? false;
  const motivoNivel = proficiencias
    ? (() => {
        const faltando = proficiencias.find((p) => p.status === "dados_insuficientes");
        return faltando
          ? `Disponível depois de ${faltando.respostasMinimas} respostas em uma área. Faltam ${Math.max(0, faltando.respostasMinimas - faltando.respostasConsideradas)}.`
          : "Precisa de proficiência estimada em pelo menos uma área.";
      })()
    : undefined;

  // Mesmo padrão: preenche a habilidade com a 1ª prioridade assim que o
  // reforço carrega, sem travar uma escolha manual posterior do estudante.
  const [habilidadePreenchida, setHabilidadePreenchida] = useState(false);
  if (reforco && !habilidadePreenchida) {
    setHabilidadePreenchida(true);
    if (!habilidade && reforco.prioridades[0]) setHabilidade(reforco.prioridades[0].habilidade.codigo);
  }

  // Assunto (Desempenho, pedido à parte): se a habilidade escolhida pertence
  // ao assunto, vale ela sozinha; senão, vale o assunto inteiro (qualquer
  // habilidade dele) — funciona pra qualquer modo, não só "Por habilidade".
  const codigosDoAssunto = assuntoSelecionado ? assuntoSelecionado.habilidades.map((h) => h.habilidade.codigo) : null;
  const habilidadeValida =
    modo === "habilidade" && habilidade && (!codigosDoAssunto || codigosDoAssunto.includes(habilidade))
      ? habilidade
      : null;

  const pedido: PedidoRecomendacao = useMemo(
    () => ({
      modo,
      areas: areas.length ? areas : undefined,
      habilidade: habilidadeValida ?? undefined,
      habilidades: !habilidadeValida && codigosDoAssunto ? codigosDoAssunto : undefined,
      temaTexto: modo === "tema" && temaTexto ? temaTexto : undefined,
      quantidade: 1,
    }),
    [modo, areas, habilidadeValida, codigosDoAssunto, temaTexto],
  );

  const { data: previa, isFetching: carregandoPrevia } = useQuery({
    queryKey: ["previa-recomendacao", pedido],
    queryFn: () => getApi().obterRecomendacoes(pedido),
  });

  const opcoesHabilidade = useMemo(
    () =>
      (reforco?.prioridades ?? [])
        .filter((p) => !codigosDoAssunto || codigosDoAssunto.includes(p.habilidade.codigo))
        .map((p) => ({
          valor: p.habilidade.codigo,
          rotulo: `${p.habilidade.codigo}: ${limparDescricaoHabilidadeMock(p.habilidade.descricao) ?? "sem descrição"}`,
          grupo: ROTULO_AREA[p.area],
        })),
    [reforco, codigosDoAssunto],
  );

  async function aoComecar() {
    setIniciando(true);
    setErroIniciar(null);
    try {
      const { sessao, primeira } = await getApi().iniciarSessao({
        modo,
        areas: areas.length ? areas : undefined,
        habilidade: habilidadeValida ?? undefined,
        habilidades: !habilidadeValida && codigosDoAssunto ? codigosDoAssunto : undefined,
        temaTexto: modo === "tema" && temaTexto ? temaTexto : undefined,
        quantidade,
      });
      salvarSessaoAtivaId(sessao.id);
      salvarFilaSessao(sessao.id, { itens: primeira.itens, aviso: primeira.aviso, modelo: primeira.modelo });
      router.push(`/treino/${sessao.id}`);
    } catch (erro) {
      setErroIniciar(mensagemDoErro(erro));
      setIniciando(false);
    }
  }

  return (
    <div>
      <PageHeader titulo="Como você quer treinar?" />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div {...revelar(0)} className="flex flex-col gap-6">
          {semHistorico ? (
            <p className="rounded-r-xs border-l-[3px] border-l-rule-strong bg-paper-2 p-3 text-sm text-ink-2">
              Ainda não temos seu histórico, então vamos usar o tema que você escolher.
            </p>
          ) : null}

          {/* Os campos extras de cada modo ficam FORA do RadioCard (que é um
              <button role="radio">): um botão não pode conter outro controle
              focável — "nested-interactive" no axe. */}
          <RadioCardGroup value={modo} onValueChange={(v) => setModo(v as Modo)} className="flex flex-col gap-3">
            <RadioCard
              value="tema"
              titulo="Por tema"
              descricao="Questões parecidas com um tema ou com uma questão que você escolher."
              Icone={Sparkles}
            />

            <RadioCard
              value="habilidade"
              titulo="Por habilidade"
              descricao="Foco nas habilidades em que você mais precisa melhorar."
              disabled={!habilidadeDisponivel}
              motivo={!habilidadeDisponivel ? motivoHabilidade : motivoHabilidadeDisponivel}
              Icone={Target}
            />

            <RadioCard
              value="nivel"
              titulo="Por nível"
              descricao="Questões na dificuldade certa para a sua proficiência."
              disabled={!nivelDisponivel}
              motivo={!nivelDisponivel ? motivoNivel : undefined}
              Icone={SlidersHorizontal}
            />

            <RadioCard
              value="progressao"
              titulo="Progressão com Combo"
              descricao="A dificuldade sobe conforme você acerta em sequência."
              Icone={TrendingUp}
            />
          </RadioCardGroup>

          {modo === "tema" ? (
            <Field
              rotulo="Tema (opcional)"
              placeholder="Ex.: revolução industrial"
              value={temaTexto}
              onChange={(e) => setTemaTexto(e.target.value)}
            />
          ) : null}

          {modo === "habilidade" && habilidadeDisponivel ? (
            <Combobox rotulo="Habilidade" valor={habilidade} onValorChange={setHabilidade} opcoes={opcoesHabilidade} />
          ) : null}

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink">Áreas</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {AREAS.map((area) => (
                <AreaTile key={area} area={area} checked={areas.includes(area)} onCheckedChange={() => setAreas(toggle(areas, area))} />
              ))}
            </div>
          </fieldset>

          {/* Assunto (Desempenho, pedido à parte): só aparece com uma única área
              escolhida — o nome do assunto não existe nas outras. Opcional, sem
              escolha vale a área toda. */}
          {areaUnica && desempenhoArea ? (
            <fieldset>
              <legend className="mb-1 text-sm font-medium text-ink">Assunto de {ROTULO_AREA[areaUnica]}</legend>
              <p className="mb-2 text-sm text-ink-2">Opcional. Aparece quando você escolhe uma única área. Sem escolha, vale a área toda.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  aria-pressed={assunto === null}
                  onClick={() => setAssunto(null)}
                  className={cn(
                    "flex min-h-16 flex-col items-start gap-1 rounded-sm border-2 p-3 text-left motion-safe-transition",
                    assunto === null ? "border-brand bg-brand-soft" : "border-transparent bg-paper-2",
                  )}
                >
                  <span className="text-sm font-medium text-ink">Todos os assuntos</span>
                  <span className="text-xs text-ink-2">Vale a área toda</span>
                </button>
                {desempenhoArea.assuntos.map((a) => (
                  <button
                    key={a.nome}
                    type="button"
                    aria-pressed={assunto === a.nome}
                    onClick={() => {
                      setAssunto(a.nome);
                      if (habilidade && !a.habilidades.some((h) => h.habilidade.codigo === habilidade)) setHabilidade(null);
                    }}
                    className={cn(
                      "flex min-h-16 flex-col items-start gap-1 rounded-sm border-2 p-3 text-left motion-safe-transition",
                      assunto === a.nome ? "border-brand bg-brand-soft" : "border-transparent bg-paper-2",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-ink">
                      {a.nome}
                      {a.maisFraco ? (
                        <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-medium text-ink-2">Mais fraco</span>
                      ) : null}
                    </span>
                    <span className="text-xs text-ink-2">
                      {a.tendencia === null ? "Poucos dados" : `${formatarPercentual((a.taxaAcerto ?? 0) * 100)} de acerto`}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          <div>
            <p className="mb-2 text-sm font-medium text-ink">Quantidade de questões</p>
            <Segmented
              rotulo="Quantidade de questões"
              valor={String(quantidade)}
              onValorChange={(v) => setQuantidade(Number(v))}
              opcoes={QUANTIDADES.map((q) => ({ valor: String(q), rotulo: String(q) }))}
            />
          </div>
        </div>

        <aside {...revelar(1)} className="h-fit rounded-md bg-paper-2 p-5 lg:sticky lg:top-6">
          <p className="font-medium text-ink">Resumo do treino</p>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-2">Modo</dt>
              <dd className="text-ink">
                {modo === "tema" ? "Por tema" : modo === "habilidade" ? "Por habilidade" : modo === "nivel" ? "Por nível" : "Progressão com Combo"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-2">Áreas</dt>
              <dd className="text-ink">{areas.length ? areas.join(", ") : "Todas"}</dd>
            </div>
            {assuntoSelecionado ? (
              <div className="flex justify-between gap-2">
                <dt className="text-ink-2">Assunto</dt>
                <dd className="text-ink">{assuntoSelecionado.nome}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-2">
              <dt className="text-ink-2">Quantidade</dt>
              <dd className="text-ink">{quantidade}</dd>
            </div>
          </dl>

          <div className="mt-4">
            {carregandoPrevia ? (
              <Skeleton className="h-16 w-full" />
            ) : previa?.itens[0] ? (
              <CriterioRecomendacao criterio={previa.itens[0].criterio} />
            ) : previa && previa.itens.length === 0 ? (
              <p className="rounded-r-xs border-l-[3px] border-l-err bg-err-soft p-3 text-sm text-ink">
                {previa.aviso?.texto ?? "Não há questões suficientes para esta combinação."}
              </p>
            ) : null}
          </div>

          {erroIniciar ? <p className="mt-3 text-sm text-err">{erroIniciar}</p> : null}

          <Button
            className="mt-4 w-full"
            onClick={aoComecar}
            carregando={iniciando}
            textoCarregando="Preparando"
            disabled={modo === "habilidade" && !habilidade}
          >
            Começar treino
          </Button>
        </aside>
      </div>
    </div>
  );
}

export function TreinoClient() {
  return (
    <Suspense fallback={null}>
      <EscolherModo />
    </Suspense>
  );
}
