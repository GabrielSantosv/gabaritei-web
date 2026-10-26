"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AreaTag } from "@/components/dominio/area-tag";
import { FoguinhoBadge } from "@/components/dominio/foguinho-badge";
import { WeekStrip } from "@/components/dominio/week-strip";
import { Button } from "@/components/ui/button";
import { CampoSalvo } from "@/components/ui/campo-salvo";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Link } from "@/components/ui/link";
import { PageHeader } from "@/components/layout/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProgressToMinimum } from "@/components/ui/progress-to-minimum";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getApi } from "@/lib/api/client";
import { mensagemDoErro } from "@/lib/api/errors";
import { formatarData } from "@/lib/format";
import { revelar } from "@/lib/reveal";
import type { Preferencias } from "@/lib/api/types";

const ROTULO_TENDENCIA: Record<string, string> = { subindo: "Subindo", estavel: "Estável", caindo: "Caindo" };

function Secao({
  titulo,
  carregando,
  erro,
  onTentarDeNovo,
  children,
}: {
  titulo: string;
  carregando: boolean;
  erro: unknown;
  onTentarDeNovo: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-rule pt-8">
      <h2 className="mb-4 text-lg text-ink">{titulo}</h2>
      {carregando ? (
        <Skeleton className="h-24 w-full" />
      ) : erro ? (
        <ErrorState mensagem={mensagemDoErro(erro)} onTentarDeNovo={onTentarDeNovo} />
      ) : (
        children
      )}
    </section>
  );
}

function BlocoIdentidade() {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);
  const { data: perfil, isLoading, error, refetch } = useQuery({
    queryKey: ["perfil"],
    queryFn: () => getApi().obterPerfil(),
  });

  async function aoSair() {
    setSaindo(true);
    try {
      await getApi().sair();
      router.push("/entrar");
    } finally {
      setSaindo(false);
    }
  }

  if (isLoading || !perfil) {
    return (
      <section>
        {error ? (
          <ErrorState mensagem={mensagemDoErro(error)} onTentarDeNovo={() => refetch()} />
        ) : (
          <Skeleton className="h-20 w-full" />
        )}
      </section>
    );
  }

  return (
    <section className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-display text-2xl text-ink">{perfil.nome}</p>
        <p className="mt-1 text-sm text-ink-2">{perfil.email}</p>
        <p className="mt-1 text-sm text-ink-2">Conta criada em {formatarData(perfil.criadoEm)}.</p>
      </div>
      <Button variante="secundario" onClick={aoSair} carregando={saindo} textoCarregando="Saindo">
        Sair
      </Button>
    </section>
  );
}

function BlocoNumeros() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["resumo-geral"],
    queryFn: () => getApi().obterResumoGeral(),
  });

  return (
    <Secao titulo="Seus números" carregando={isLoading} erro={error} onTentarDeNovo={() => refetch()}>
      {data && data.respondidas > 0 ? (
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <div className="border-r border-rule pr-8">
            <p className="font-display text-2xl text-ink">{data.respondidas}</p>
            <p className="mt-1 text-sm text-ink-2">Respondidas</p>
          </div>
          <div className="border-r border-rule pr-8">
            <p className="font-display text-2xl text-ink">{data.acertos}</p>
            <p className="mt-1 text-sm text-ink-2">Acertos</p>
          </div>
          <div className="border-r border-rule pr-8">
            <p className="font-display text-2xl text-ink">{data.erros}</p>
            <p className="mt-1 text-sm text-ink-2">Erros</p>
          </div>
          <div>
            <p className="font-display text-2xl text-ink">
              {/* check-regras: ignore, "—" aqui é placeholder de valor ausente, não separador (ver PENDENCIAS.md) */}
              {data.taxaAcerto !== null ? `${Math.round(data.taxaAcerto * 100)}%` : "—"}
            </p>
            <p className="mt-1 text-sm text-ink-2">Taxa de acerto</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-2">
          Você ainda não respondeu nenhuma questão.{" "}
          <Link href="/treino">Comece um treino</Link> para ver seus números aqui.
        </p>
      )}
    </Secao>
  );
}

function BlocoFoguinho() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["regularidade"],
    queryFn: () => getApi().obterRegularidade(),
  });

  return (
    <Secao titulo="Foguinho e meta" carregando={isLoading} erro={error} onTentarDeNovo={() => refetch()}>
      {data ? (
        <div>
          <FoguinhoBadge
            atual={data.foguinho.atual}
            melhor={data.foguinho.melhor}
            hojeContou={data.foguinho.hojeContou}
            emRisco={data.foguinho.emRisco}
          />
          <WeekStrip dias={data.semana} className="mt-4" />
          <div className="mt-4 max-w-sm">
            <ProgressBar valor={data.metaSemanal.feito} total={data.metaSemanal.alvo} rotulo="Meta semanal de questões" />
            <p className="mt-1 text-sm text-ink-2">
              {data.metaSemanal.feito} de {data.metaSemanal.alvo} questões esta semana
            </p>
          </div>
        </div>
      ) : null}
    </Secao>
  );
}

function BlocoProficiencia() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["proficiencias"],
    queryFn: () => getApi().obterProficiencias(),
  });

  return (
    <Secao titulo="Proficiência por área" carregando={isLoading} erro={error} onTentarDeNovo={() => refetch()}>
      {data && data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <caption>
              {/* sr-only no texto, não no <caption> direto: <caption> tem display:table-caption,
                  que resiste a position:absolute em alguns motores — mais seguro esconder um
                  <span> comum dentro dele do que confiar no caption inteiro virar um box 1x1. */}
              <span className="sr-only">Proficiência estimada por área, tendência e respostas consideradas</span>
            </caption>
            <thead>
              <tr className="border-b border-rule-strong">
                <th scope="col" className="py-2 pr-4 font-medium text-ink">Área</th>
                <th scope="col" className="py-2 pr-4 font-medium text-ink">Proficiência</th>
                <th scope="col" className="py-2 pr-4 font-medium text-ink">Tendência</th>
                <th scope="col" className="py-2 font-medium text-ink">Respostas consideradas</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.area} className="border-b border-rule">
                  <td className="py-3 pr-4">
                    <AreaTag area={p.area} />
                  </td>
                  <td className="py-3 pr-4 text-ink">
                    {p.status === "ok" ? (
                      `${p.valor} (${p.rotuloEscala})`
                    ) : (
                      <ProgressToMinimum
                        atual={p.respostasConsideradas}
                        minimo={p.respostasMinimas}
                        rotulo={`estimar sua proficiência em ${p.area}`}
                      />
                    )}
                  </td>
                  <td className="py-3 pr-4 text-ink-2">
                    {p.status === "ok" && p.tendencia ? ROTULO_TENDENCIA[p.tendencia] : "Não informado"}
                  </td>
                  <td className="py-3 text-ink-2">{p.respostasConsideradas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-ink-2">Nenhum dado de proficiência ainda.</p>
      )}
    </Secao>
  );
}

function BlocoReforco() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["reforco"],
    queryFn: () => getApi().obterReforco(),
  });

  return (
    <Secao titulo="Reforço prioritário" carregando={isLoading} erro={error} onTentarDeNovo={() => refetch()}>
      {data?.status === "dados_insuficientes" ? (
        <ProgressToMinimum atual={data.respostasAtuais} minimo={data.respostasMinimas} rotulo="apontar o que reforçar" />
      ) : data && data.prioridades.length > 0 ? (
        <ol className="flex flex-col gap-3">
          {data.prioridades.slice(0, 5).map((p) => (
            <li key={p.habilidade.codigo} className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3">
              <div className="flex items-center gap-2">
                <AreaTag area={p.area} />
                <span className="text-sm text-ink">{p.habilidade.codigo}</span>
                <span className="text-sm text-ink-2">
                  {Math.round(p.taxaAcerto * 100)}% de acerto em {p.respostas} respostas
                </span>
              </div>
              <Button
                variante="secundario"
                onClick={() => router.push(`/treino?modo=habilidade&habilidade=${p.habilidade.codigo}&area=${p.area}`)}
              >
                Treinar
              </Button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-ink-2">Nenhuma prioridade de reforço no momento.</p>
      )}
    </Secao>
  );
}

function BlocoPreferencias() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["preferencias"],
    queryFn: () => getApi().obterPreferencias(),
  });

  const [local, setLocal] = useState<Preferencias | null>(null);
  const [salvandoCampo, setSalvandoCampo] = useState<keyof Preferencias | null>(null);

  const preferencias = local ?? data ?? null;

  async function salvar(campo: keyof Preferencias, valor: Preferencias[keyof Preferencias]) {
    if (!preferencias) return;
    const atualizadas = { ...preferencias, [campo]: valor };
    setLocal(atualizadas);
    setSalvandoCampo(campo);
    try {
      await getApi().atualizarPreferencias({ [campo]: valor });
    } finally {
      setSalvandoCampo(null);
    }
  }

  return (
    <Secao titulo="Preferências" carregando={isLoading} erro={error} onTentarDeNovo={() => refetch()}>
      {preferencias ? (
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="mb-2 text-sm font-medium text-ink">Aparência</h3>
            <p className="text-sm text-ink-2">
              Tema, paleta, movimento e tamanho do texto ficam em{" "}
              <Link href="/configuracoes">Configurações</Link>.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-ink">Acessibilidade</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Switch
                rotulo="Abrir descrição das figuras por padrão"
                checked={preferencias.descricaoImagensAberta}
                onCheckedChange={(valor) => void salvar("descricaoImagensAberta", valor)}
                className="shrink-0"
              />
              <CampoSalvo salvando={salvandoCampo === "descricaoImagensAberta"} />
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-ink">Estudo</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end gap-3">
                <Field
                  rotulo="Meta semanal de questões"
                  type="number"
                  min={1}
                  className="max-w-40"
                  value={preferencias.metaSemanal}
                  onChange={(e) => {
                    const valor = Math.max(1, Number(e.target.value) || 1);
                    void salvar("metaSemanal", valor);
                  }}
                />
                <CampoSalvo salvando={salvandoCampo === "metaSemanal"} />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Switch
                  rotulo="Atalhos de teclado nas questões"
                  descricao="Letras A a E, Enter para enviar e N para a próxima."
                  checked={preferencias.atalhosTeclado}
                  onCheckedChange={(valor) => void salvar("atalhosTeclado", valor)}
                  className="shrink-0"
                />
                <CampoSalvo salvando={salvandoCampo === "atalhosTeclado"} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Secao>
  );
}

export function PerfilClient() {
  return (
    <div>
      <PageHeader titulo="Perfil" />
      <div className="flex flex-col gap-8">
        <div {...revelar(0)}>
          <BlocoIdentidade />
        </div>
        <div {...revelar(1)}>
          <BlocoNumeros />
        </div>
        <div {...revelar(2)}>
          <BlocoFoguinho />
        </div>
        <div {...revelar(3)}>
          <BlocoProficiencia />
        </div>
        <div {...revelar(4)}>
          <BlocoReforco />
        </div>
        <div {...revelar(5)}>
          <BlocoPreferencias />
        </div>
      </div>
    </div>
  );
}
