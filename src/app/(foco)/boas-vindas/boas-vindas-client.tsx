"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AreaTile } from "@/components/dominio/area-tile";
import { SeletorPaleta } from "@/components/dominio/seletor-paleta";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FocusShell } from "@/components/layout/focus-shell";
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getApi } from "@/lib/api/client";
import {
  aplicarAparencia,
  salvarAparenciaCache,
  useTemaResolvido,
  type Movimento,
  type Tema,
  type TamanhoTexto,
} from "@/lib/hooks/use-aparencia";
import { salvarFilaSessao, salvarSessaoAtivaId } from "@/lib/sessao-ativa";
import type { Area, Preferencias } from "@/lib/api/types";

const AREAS: Area[] = ["LC", "CH", "CN", "MT"];
const EXEMPLOS_TEMA = [
  "revolução industrial",
  "funções do 2º grau",
  "ecologia e cadeias alimentares",
  "figuras de linguagem",
];
const TITULOS_PASSO = ["Exame", "Foco", "Rotina", "Aparência"];
const TOTAL_PASSOS = TITULOS_PASSO.length;

const CHAVE_PASSO = "gabaritei:boas-vindas:passo";

function lerPassoSalvo(): number {
  if (typeof window === "undefined") return 0;
  try {
    const valor = Number(window.localStorage.getItem(CHAVE_PASSO));
    return Number.isInteger(valor) && valor >= 0 && valor < TOTAL_PASSOS ? valor : 0;
  } catch {
    return 0;
  }
}

function salvarPassoNoStorage(passo: number): void {
  try {
    window.localStorage.setItem(CHAVE_PASSO, String(passo));
  } catch {
    // modo privado ou storage bloqueado: segue sem lembrar o passo entre reloads
  }
}

function limparPassoDoStorage(): void {
  try {
    window.localStorage.removeItem(CHAVE_PASSO);
  } catch {
    // ignora
  }
}

export function BoasVindasClient() {
  const router = useRouter();
  const { data: perfil } = useQuery({ queryKey: ["perfil"], queryFn: () => getApi().obterPerfil() });
  const { data } = useQuery({ queryKey: ["preferencias"], queryFn: () => getApi().obterPreferencias() });

  // Começa em 0 (igual ao servidor) e só restaura o passo salvo depois de
  // montar — ler localStorage no inicializador do useState causaria
  // hydration mismatch, já que o servidor nunca tem acesso a ele.
  const [passo, setPasso] = useState(0);
  const tituloPassoRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Lê localStorage, que só existe no navegador: precisa ser depois da
    // hidratação para o SSR não divergir do cliente (mesmo padrão de use-aparencia.ts).
    const salvo = lerPassoSalvo();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (salvo > 0) setPasso(salvo);
  }, []);

  const [areas, setAreas] = useState<Area[]>([]);
  const [temaTexto, setTemaTexto] = useState("");
  const [metaSemanal, setMetaSemanal] = useState(50);
  const [diasEstudo, setDiasEstudo] = useState<number | "">("");
  const [descricaoImagensAberta, setDescricaoImagensAberta] = useState(false);
  const [prefsAplicadas, setPrefsAplicadas] = useState(false);
  const [finalizando, setFinalizando] = useState<"treino" | "inicio" | null>(null);
  // Override otimista do passo 4 (Aparência): sem isso, o radiogroup da Paleta
  // e os Segmented continuam mostrando o valor antigo da query depois de um
  // clique, mesmo com aplicarAparencia já tendo re-pintado a tela inteira.
  const [aparenciaLocal, setAparenciaLocal] = useState<Preferencias | null>(null);
  const preferencias = aparenciaLocal ?? data;

  // Preenche a meta e a preferência de figuras com o que já existe (padrão da
  // API), só na primeira vez que Preferencias carrega — depois disso o
  // estudante é quem manda, mesmo que um refetch em segundo plano devolva o
  // valor antigo enquanto a chamada de salvar ainda está a caminho.
  if (data && !prefsAplicadas) {
    setPrefsAplicadas(true);
    setMetaSemanal(data.metaSemanal);
    setDescricaoImagensAberta(data.descricaoImagensAberta);
  }

  const temaResolvido = useTemaResolvido(preferencias?.tema ?? "sistema");

  function irPara(novoPasso: number) {
    setPasso(novoPasso);
    salvarPassoNoStorage(novoPasso);
    tituloPassoRef.current?.focus();
  }

  async function salvarAparenciaCampo<C extends keyof Preferencias>(campo: C, valor: Preferencias[C]) {
    if (!preferencias) return;
    const atualizadas = { ...preferencias, [campo]: valor };
    setAparenciaLocal(atualizadas);
    const aparencia = {
      tema: atualizadas.tema,
      paleta: atualizadas.paleta,
      movimento: atualizadas.reduzirMovimento,
      tamanhoTexto: atualizadas.tamanhoTexto,
    };
    aplicarAparencia(aparencia);
    salvarAparenciaCache(aparencia);
    await getApi().atualizarPreferencias({ [campo]: valor });
  }

  async function finalizar(destino: "treino" | "inicio") {
    setFinalizando(destino);
    try {
      await getApi().atualizarPerfil({ onboardingConcluido: true });
      await getApi().atualizarPreferencias({
        metaSemanal,
        descricaoImagensAberta,
      });
      limparPassoDoStorage();

      if (destino === "treino") {
        const { sessao, primeira } = await getApi().iniciarSessao({
          modo: "tema",
          areas: areas.length ? areas : undefined,
          temaTexto: temaTexto || undefined,
          quantidade: 10,
        });
        salvarSessaoAtivaId(sessao.id);
        salvarFilaSessao(sessao.id, { itens: primeira.itens, aviso: primeira.aviso, modelo: primeira.modelo });
        router.push(`/treino/${sessao.id}`);
      } else {
        router.push("/inicio");
      }
    } finally {
      setFinalizando(null);
    }
  }

  async function pular() {
    await getApi().atualizarPerfil({ onboardingConcluido: true });
    limparPassoDoStorage();
    router.push("/inicio");
  }

  const primeiroNome = perfil?.nome.split(" ")[0] ?? "";
  const ultimoPasso = passo === TOTAL_PASSOS - 1;

  return (
    <FocusShell
      titulo="Primeiros passos"
      progresso={
        <span aria-live="polite" className="text-sm text-ink-2">
          Passo {passo + 1} de {TOTAL_PASSOS}
        </span>
      }
      mensagemSaida="Você pode terminar os primeiros passos depois, em Configurações."
      onConfirmarSaida={() => void pular()}
    >
      <ol className="flex flex-col gap-8">
        <li>
          <h1 ref={tituloPassoRef} tabIndex={-1} className="text-2xl text-ink">
            {TITULOS_PASSO[passo]}
          </h1>

          {passo === 0 ? (
            <div className="mt-6">
              <RadioCardGroup value="enem" className="flex flex-col gap-3">
                <RadioCard value="enem" titulo="ENEM" descricao="O Gabaritei recomenda questões do ENEM, sempre dizendo o critério." />
                <RadioCard value="fuvest" titulo="FUVEST" disabled motivo="Em breve. Por enquanto, só ENEM." />
                <RadioCard value="unicamp" titulo="UNICAMP" disabled motivo="Em breve. Por enquanto, só ENEM." />
              </RadioCardGroup>
            </div>
          ) : null}

          {passo === 1 ? (
            <div className="mt-6 flex flex-col gap-6">
              <div>
                <p className="mb-3 text-sm font-medium text-ink">Quais áreas você quer priorizar?</p>
                <div className="grid grid-cols-2 gap-3">
                  {AREAS.map((area) => (
                    <AreaTile
                      key={area}
                      area={area}
                      checked={areas.includes(area)}
                      onCheckedChange={() =>
                        setAreas((atual) => (atual.includes(area) ? atual.filter((a) => a !== area) : [...atual, area]))
                      }
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-ink-2">Sem escolha, o modelo usa as quatro.</p>
              </div>

              <div>
                <Field
                  rotulo="Quer começar por algum tema? (opcional)"
                  placeholder="Ex.: revolução industrial"
                  value={temaTexto}
                  onChange={(e) => setTemaTexto(e.target.value)}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {EXEMPLOS_TEMA.map((exemplo) => (
                    <button
                      key={exemplo}
                      type="button"
                      onClick={() => setTemaTexto(exemplo)}
                      className="min-h-9 rounded-full border border-rule-strong px-3 text-sm text-ink-2 motion-safe-transition hover:bg-paper-2"
                    >
                      {exemplo}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {passo === 2 ? (
            <div className="mt-6 flex flex-col gap-6">
              <div>
                <p className="mb-2 text-sm font-medium text-ink">Meta de questões por semana</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Segmented
                    rotulo="Meta de questões por semana"
                    valor={[20, 50, 100].includes(metaSemanal) ? String(metaSemanal) : "outro"}
                    onValorChange={(v) => {
                      if (v !== "outro") setMetaSemanal(Number(v));
                    }}
                    opcoes={[
                      { valor: "20", rotulo: "20" },
                      { valor: "50", rotulo: "50" },
                      { valor: "100", rotulo: "100" },
                      { valor: "outro", rotulo: "Outro" },
                    ]}
                  />
                  <Field
                    rotulo="Outro valor"
                    type="number"
                    min={1}
                    className="max-w-28"
                    value={metaSemanal}
                    onChange={(e) => setMetaSemanal(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>
              </div>

              <Field
                rotulo="Dias de estudo por semana (opcional)"
                type="number"
                min={1}
                max={7}
                className="max-w-28"
                value={diasEstudo}
                onChange={(e) => {
                  const valor = e.target.value;
                  if (valor === "") {
                    setDiasEstudo("");
                    return;
                  }
                  setDiasEstudo(Math.max(1, Math.min(7, Number(valor) || 1)));
                }}
              />

              <Switch
                rotulo="Abrir a descrição das figuras por padrão"
                checked={descricaoImagensAberta}
                onCheckedChange={setDescricaoImagensAberta}
              />
            </div>
          ) : null}

          {passo === 3 ? (
            <div className="mt-6 flex flex-col gap-6">
              {!preferencias ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <>
                  <div>
                    <p className="mb-2 text-sm font-medium text-ink">Tema</p>
                    <Segmented
                      rotulo="Tema"
                      valor={preferencias.tema}
                      onValorChange={(v) => void salvarAparenciaCampo("tema", v as Tema)}
                      opcoes={[
                        { valor: "sistema", rotulo: "Sistema" },
                        { valor: "claro", rotulo: "Claro" },
                        { valor: "escuro", rotulo: "Escuro" },
                      ]}
                    />
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-ink">Paleta</p>
                    <SeletorPaleta
                      valor={preferencias.paleta}
                      temaResolvido={temaResolvido}
                      onValorChange={(v) => void salvarAparenciaCampo("paleta", v)}
                    />
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-ink">Movimento</p>
                    <Segmented
                      rotulo="Movimento"
                      valor={preferencias.reduzirMovimento}
                      onValorChange={(v) => void salvarAparenciaCampo("reduzirMovimento", v as Movimento)}
                      opcoes={[
                        { valor: "sistema", rotulo: "Sistema" },
                        { valor: "sim", rotulo: "Reduzido" },
                      ]}
                    />
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-ink">Tamanho do texto</p>
                    <Segmented
                      rotulo="Tamanho do texto"
                      valor={String(preferencias.tamanhoTexto)}
                      onValorChange={(v) => void salvarAparenciaCampo("tamanhoTexto", Number(v) as TamanhoTexto)}
                      opcoes={[
                        { valor: "100", rotulo: "100%" },
                        { valor: "115", rotulo: "115%" },
                        { valor: "130", rotulo: "130%" },
                      ]}
                    />
                  </div>

                  <p className="text-sm text-ink-2">Escolha um visual. Dá para mudar depois em Configurações.</p>
                </>
              )}
            </div>
          ) : null}
        </li>
      </ol>

      {ultimoPasso ? (
        <p className="mt-8 font-display text-xl text-ink">
          Tudo pronto{primeiroNome ? `, ${primeiroNome}` : ""}.
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-6">
        <div className="flex gap-3">
          {passo > 0 ? (
            <Button variante="secundario" onClick={() => irPara(passo - 1)}>
              Voltar
            </Button>
          ) : null}
          <Button variante="discreto" onClick={() => void pular()}>
            Pular por enquanto
          </Button>
        </div>

        {ultimoPasso ? (
          <div className="flex flex-wrap gap-3">
            <Button
              variante="secundario"
              onClick={() => void finalizar("inicio")}
              carregando={finalizando === "inicio"}
              textoCarregando="Preparando"
            >
              Ir para o início
            </Button>
            <Button onClick={() => void finalizar("treino")} carregando={finalizando === "treino"} textoCarregando="Preparando">
              Começar um treino
            </Button>
          </div>
        ) : (
          <Button onClick={() => irPara(passo + 1)}>Continuar</Button>
        )}
      </div>
    </FocusShell>
  );
}
