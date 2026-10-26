"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Layers, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AreaTile } from "@/components/dominio/area-tile";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Link } from "@/components/ui/link";
import { PageHeader } from "@/components/layout/page-header";
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getApi } from "@/lib/api/client";
import { mensagemDoErro } from "@/lib/api/errors";
import { formatarData, formatarDuracao } from "@/lib/format";
import { revelar } from "@/lib/reveal";
import type { Area, SimuladoConfig } from "@/lib/api/types";

type Escopo = "area" | "dia" | "personalizado";

const PARES_DIA: { valor: string; areas: Area[]; rotulo: string }[] = [
  { valor: "lc-ch", areas: ["LC", "CH"], rotulo: "Linguagens e Ciências Humanas" },
  { valor: "cn-mt", areas: ["CN", "MT"], rotulo: "Ciências da Natureza e Matemática" },
];

const AREAS: Area[] = ["LC", "CH", "CN", "MT"];
const NOME_AREA: Record<Area, string> = {
  LC: "Linguagens",
  CH: "Ciências Humanas",
  CN: "Ciências da Natureza",
  MT: "Matemática",
};

function EmAndamento() {
  const { data: simulados } = useQuery({ queryKey: ["simulados"], queryFn: () => getApi().listarSimulados() });
  const emAndamento = simulados?.find((s) => s.status === "em_andamento");
  if (!emAndamento) return null;

  return (
    <div className="mb-8 rounded-md bg-paper-2 p-5">
      <p className="font-medium text-ink">
        Simulado em andamento: {emAndamento.respondidas} de {emAndamento.total}
      </p>
      {emAndamento.limiteEm ? (
        <p className="mt-1 text-sm text-ink-2">Tempo limite em {formatarData(emAndamento.limiteEm)}</p>
      ) : null}
      <Link href={`/simulados/${emAndamento.id}`} className="mt-2 inline-block">
        Continuar
      </Link>
    </div>
  );
}

/** Decorativo (canvas Telas.dc.html): simula o formato de 3 colunas do cartão de
 *  verdade, só pra dar noção de tamanho — os números concretos já estão no dl
 *  acima, nenhuma informação nova vive só aqui (por isso o pai é aria-hidden). */
function CartaoRespostaPreview({ quantidade }: { quantidade: number }) {
  const porColuna = Math.ceil(quantidade / 3);
  const colunas = [0, 1, 2].map((c) =>
    Array.from({ length: porColuna }, (_, i) => c * porColuna + i + 1).filter((n) => n <= quantidade),
  );
  return (
    <div className="flex justify-between gap-3">
      {colunas.map((coluna, i) => (
        <div key={i} className="flex flex-col gap-1">
          {coluna.map((n) => (
            <div key={n} className="flex items-center gap-1.5">
              <span className="w-5 font-mono text-[11px] text-ink-2">{n}</span>
              <span className="size-3.5 shrink-0 rounded-full border border-rule-strong" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function NovoSimulado() {
  const router = useRouter();
  const [escopo, setEscopo] = useState<Escopo>("personalizado");
  const [parDia, setParDia] = useState(PARES_DIA[0].valor);
  const [areasPersonalizado, setAreasPersonalizado] = useState<Area[]>(["MT"]);
  const [quantidade, setQuantidade] = useState(10);
  const [comLimite, setComLimite] = useState(false);
  const [duracaoMinutos, setDuracaoMinutos] = useState(30);
  const [cronometroVisivel, setCronometroVisivel] = useState(true);
  const [iniciando, setIniciando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const areas: Area[] =
    escopo === "area"
      ? areasPersonalizado.slice(0, 1)
      : escopo === "dia"
        ? (PARES_DIA.find((p) => p.valor === parDia)?.areas ?? [])
        : areasPersonalizado;
  const quantidadeFinal = escopo === "area" ? 45 : escopo === "dia" ? 90 : quantidade;

  const escopoTexto =
    escopo === "area"
      ? `Uma área${areasPersonalizado[0] ? `, ${NOME_AREA[areasPersonalizado[0]]}` : ""}`
      : escopo === "dia"
        ? `Dia completo, ${PARES_DIA.find((p) => p.valor === parDia)?.rotulo ?? ""}`
        : `Personalizado${areasPersonalizado.length > 0 ? `, ${areasPersonalizado.length} ${areasPersonalizado.length === 1 ? "área" : "áreas"}` : ""}`;

  async function aoIniciar() {
    setErro(null);
    if (escopo === "area" && areasPersonalizado.length === 0) {
      setErro("Escolha uma área.");
      return;
    }
    setIniciando(true);
    try {
      const config: SimuladoConfig = {
        escopo,
        areas,
        quantidade: quantidadeFinal,
        ano: null,
        duracaoMinutos: comLimite ? duracaoMinutos : null,
        cronometroVisivel,
      };
      const simulado = await getApi().criarSimulado(config);
      router.push(`/simulados/${simulado.id}`);
    } catch (e) {
      setErro(mensagemDoErro(e));
    } finally {
      setIniciando(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
    <section className="rounded-md border-t-2 border-t-ink bg-card p-6">
      <h2 className="text-lg text-ink">Novo simulado</h2>

      <RadioCardGroup value={escopo} onValueChange={(v) => setEscopo(v as Escopo)} className="mt-4 flex flex-col gap-3">
        <RadioCard value="area" titulo="Uma área" descricao="45 questões de uma única área." Icone={Layers} />
        <RadioCard value="dia" titulo="Dia completo" descricao="90 questões, duas áreas do mesmo dia de prova." Icone={CalendarDays} />
        <RadioCard
          value="personalizado"
          titulo="Personalizado"
          descricao="Escolha as áreas e a quantidade (10 a 90)."
          Icone={Settings2}
        />
      </RadioCardGroup>

      {escopo === "area" ? (
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-medium text-ink">Área</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {AREAS.map((area) => (
              <AreaTile
                key={area}
                area={area}
                checked={areasPersonalizado.includes(area)}
                onCheckedChange={() => setAreasPersonalizado(areasPersonalizado.includes(area) ? [] : [area])}
              />
            ))}
          </div>
        </fieldset>
      ) : null}

      {escopo === "dia" ? (
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-medium text-ink">Dia</legend>
          <RadioCardGroup value={parDia} onValueChange={setParDia} className="flex flex-col gap-2">
            {PARES_DIA.map((p) => (
              <RadioCard key={p.valor} value={p.valor} titulo={p.rotulo} />
            ))}
          </RadioCardGroup>
        </fieldset>
      ) : null}

      {escopo === "personalizado" ? (
        <div className="mt-4 flex flex-col gap-4">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink">Áreas</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {AREAS.map((area) => (
                <AreaTile
                  key={area}
                  area={area}
                  checked={areasPersonalizado.includes(area)}
                  onCheckedChange={() =>
                    setAreasPersonalizado(
                      areasPersonalizado.includes(area)
                        ? areasPersonalizado.filter((a) => a !== area)
                        : [...areasPersonalizado, area],
                    )
                  }
                />
              ))}
            </div>
          </fieldset>
          <Field
            rotulo="Quantidade de questões (10 a 90)"
            type="number"
            min={10}
            max={90}
            value={quantidade}
            onChange={(e) => setQuantidade(Math.min(90, Math.max(10, Number(e.target.value) || 10)))}
          />
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 border-t border-rule pt-5">
        <Switch rotulo="Com tempo limite" checked={comLimite} onCheckedChange={setComLimite} />
        {comLimite ? (
          <Field
            rotulo="Minutos"
            type="number"
            min={1}
            value={duracaoMinutos}
            onChange={(e) => setDuracaoMinutos(Math.max(1, Number(e.target.value) || 1))}
            dica={`Sugestão: 3 min por questão (${quantidadeFinal * 3} min).`}
          />
        ) : null}
        <Switch rotulo="Mostrar cronômetro" checked={cronometroVisivel} onCheckedChange={setCronometroVisivel} />
      </div>

      <p className="mt-5 text-sm text-ink-2">
        Você só vê a correção no final. Pode sair e voltar, mas o tempo continua correndo.
      </p>
    </section>

    {/* Painel de resumo ao lado do formulário, com questões e duração calculadas na
        hora (etapa V, item 6) — mesmo padrão já usado em /treino. Cartão-resposta
        (canvas Telas.dc.html, bloco isSimulados): preview decorativo de 3 colunas,
        só pra dar uma ideia do tamanho da prova — os números já estão no dl acima,
        então fica aria-hidden. */}
    <aside className="h-fit rounded-md border border-rule bg-card p-5 lg:sticky lg:top-6">
      <h2 className="font-display text-lg text-ink">Resumo do simulado</h2>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-ink-2">Escopo</dt>
        <dd className="font-medium text-ink">{escopoTexto}</dd>
        <dt className="text-ink-2">Questões</dt>
        <dd className="font-medium text-ink">{quantidadeFinal}</dd>
        <dt className="text-ink-2">Tempo</dt>
        <dd className="font-medium text-ink">
          {comLimite ? `${duracaoMinutos} min` : `${quantidadeFinal * 3} min (sugestão, sem limite)`}
        </dd>
        <dt className="text-ink-2">Cronômetro</dt>
        <dd className="font-medium text-ink">{cronometroVisivel ? "Visível" : "Oculto"}</dd>
      </dl>

      <div aria-hidden="true" className="mt-4 flex flex-col gap-2.5 rounded-md border border-rule bg-paper p-3.5">
        <p className="font-display text-sm font-semibold text-ink">Seu cartão-resposta</p>
        <CartaoRespostaPreview quantidade={quantidadeFinal} />
        <p className="text-xs text-ink-2">
          3 colunas de {Math.ceil(quantidadeFinal / 3)} linhas, como na prova.
        </p>
      </div>

      {erro ? <p className="mt-3 text-sm text-err">{erro}</p> : null}

      <Button className="mt-4 w-full" onClick={aoIniciar} carregando={iniciando} textoCarregando="Preparando">
        Iniciar simulado
      </Button>
    </aside>
    </div>
  );
}

function Concluidos() {
  const { data: simulados, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["simulados"],
    queryFn: () => getApi().listarSimulados(),
  });

  const concluidos = simulados?.filter((s) => s.status === "finalizado") ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }
  if (isError) return <ErrorState mensagem={mensagemDoErro(error)} onTentarDeNovo={() => refetch()} />;
  if (concluidos.length === 0) {
    return <EmptyState titulo="Você ainda não fez nenhum simulado." />;
  }

  return (
    <ul>
      {concluidos.map((s) => (
        <li key={s.id} className="border-b border-rule py-3">
          <Link href={`/simulados/${s.id}/resultado`} className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex flex-col text-sm text-ink">
              <span>{s.rotulo}</span>
              <span className="text-ink-2">{formatarData(s.iniciadoEm)}</span>
            </span>
            <span className="text-sm text-ink-2">
              {s.acertos ?? 0} de {s.total}
              {s.duracaoSegundos !== null ? `, ${formatarDuracao(s.duracaoSegundos)}` : ""}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SimuladosClient() {
  return (
    <div>
      <PageHeader titulo="Simulados" />
      <div {...revelar(0)}>
        <EmAndamento />
      </div>
      <div {...revelar(1)}>
        <NovoSimulado />
      </div>
      <section {...revelar(2)} className="mt-10">
        <h2 className="mb-3 text-lg text-ink">Concluídos</h2>
        <Concluidos />
      </section>
    </div>
  );
}
