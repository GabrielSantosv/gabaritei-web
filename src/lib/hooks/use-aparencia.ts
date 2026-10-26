"use client";

/**
 * Primeira pintura sem piscar (docs/FRONTEND_PARIDADE.md, seção 4.5). Cache único em
 * `localStorage["gabaritei:aparencia"]` para os 4 atributos do `<html>`
 * (tema/paleta/movimento/tamanho do texto). A fonte da verdade é `Preferencias` na
 * API; este cache só existe para a pintura antes da hidratação — sempre que
 * `Preferencias` carrega ou muda, quem chamou `atualizarPreferencias` deve chamar
 * `salvarAparenciaCache` + `aplicarAparencia` também (ver Configuracoes/Perfil).
 */
import { useCallback, useEffect, useState } from "react";
import type { Preferencias } from "@/lib/api/types";
import { atualizarThemeColor, paletaValida, paletasPermitidas } from "@/lib/paletas";

export type Tema = Preferencias["tema"];
export type Movimento = Preferencias["reduzirMovimento"];
export type TamanhoTexto = Preferencias["tamanhoTexto"];
export type PaletaId = Preferencias["paleta"];

export interface AparenciaCache {
  tema: Tema;
  paleta: PaletaId;
  movimento: Movimento;
  tamanhoTexto: TamanhoTexto;
}

const CHAVE = "gabaritei:aparencia";

const PADRAO: AparenciaCache = {
  tema: "sistema",
  paleta: "floresta",
  movimento: "sistema",
  tamanhoTexto: 100,
};

function pertence<T>(valor: unknown, opcoes: readonly T[]): valor is T {
  return (opcoes as readonly unknown[]).includes(valor);
}

export function lerAparenciaSalva(): AparenciaCache {
  if (typeof window === "undefined") return PADRAO;
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return PADRAO;
    const salvo = JSON.parse(bruto) as Partial<AparenciaCache>;
    return {
      tema: pertence(salvo.tema, ["sistema", "claro", "escuro"] as const) ? salvo.tema : PADRAO.tema,
      paleta: paletaValida(salvo.paleta),
      movimento: pertence(salvo.movimento, ["sistema", "sim"] as const) ? salvo.movimento : PADRAO.movimento,
      tamanhoTexto: pertence(salvo.tamanhoTexto, [100, 115, 130] as const) ? salvo.tamanhoTexto : PADRAO.tamanhoTexto,
    };
  } catch {
    return PADRAO;
  }
}

export function salvarAparenciaCache(parcial: Partial<AparenciaCache>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify({ ...lerAparenciaSalva(), ...parcial }));
  } catch {
    // modo privado ou storage bloqueado: aplica mesmo assim, só não persiste
  }
}

const ATRIBUTO_TEMA: Record<Exclude<Tema, "sistema">, "light" | "dark"> = {
  claro: "light",
  escuro: "dark",
};

/** Aplica os 4 atributos no `<html>` e atualiza `<meta name="theme-color">`. */
export function aplicarAparencia(aparencia: AparenciaCache): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  if (aparencia.tema === "sistema") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", ATRIBUTO_TEMA[aparencia.tema]);

  root.setAttribute("data-palette", aparencia.paleta);

  if (aparencia.movimento === "sim") root.setAttribute("data-motion", "reduzido");
  else root.removeAttribute("data-motion");

  if (aparencia.tamanhoTexto === 100) root.removeAttribute("data-tamanho-texto");
  else root.setAttribute("data-tamanho-texto", String(aparencia.tamanhoTexto));

  const escuro =
    aparencia.tema === "escuro" ||
    (aparencia.tema === "sistema" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  atualizarThemeColor(aparencia.paleta, Boolean(escuro));
}

/** Script inline do `<head>` (layout.tsx). Sem import, try/catch: se o localStorage
 *  falhar (navegação privada), o app segue com os padrões. A lista de paletas
 *  permitidas vem de `NEXT_PUBLIC_PALETAS` (inlinada em build, igual a paletas.ts). */
export const SCRIPT_APARENCIA_INICIAL = `(function(){try{
var a=JSON.parse(window.localStorage.getItem('${CHAVE}')||'{}');
var el=document.documentElement;
if(a.tema==='claro')el.setAttribute('data-theme','light');
else if(a.tema==='escuro')el.setAttribute('data-theme','dark');
var permitidas=${JSON.stringify(paletasPermitidas())};
el.setAttribute('data-palette', permitidas.indexOf(a.paleta)!==-1 ? a.paleta : 'floresta');
if(a.movimento==='sim')el.setAttribute('data-motion','reduzido');
if(a.tamanhoTexto===115||a.tamanhoTexto===130)el.setAttribute('data-tamanho-texto',String(a.tamanhoTexto));
}catch(e){}})();`;

/** Hook para telas que editam a aparência (Configuracoes): estado local +
 *  aplica no DOM + persiste no cache. Quem chama ainda precisa persistir na API
 *  (`atualizarPreferencias`) — este hook não sabe nada de rede. */
export function useAparencia() {
  const [aparencia, setAparencia] = useState<AparenciaCache>(PADRAO);

  useEffect(() => {
    // Lê localStorage, que só existe no navegador: precisa ser depois da
    // hidratação para o SSR não divergir do cliente (script inline já evita o flash visual).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAparencia(lerAparenciaSalva());
  }, []);

  const definirAparencia = useCallback((parcial: Partial<AparenciaCache>) => {
    setAparencia((atual) => {
      const nova = { ...atual, ...parcial };
      aplicarAparencia(nova);
      salvarAparenciaCache(parcial);
      return nova;
    });
  }, []);

  /** Sincroniza o cache com `Preferencias` quando a API carrega ou muda (seção 4.5). */
  const sincronizarComPreferencias = useCallback((preferencias: Preferencias) => {
    const nova: AparenciaCache = {
      tema: preferencias.tema,
      paleta: preferencias.paleta,
      movimento: preferencias.reduzirMovimento,
      tamanhoTexto: preferencias.tamanhoTexto,
    };
    setAparencia(nova);
    aplicarAparencia(nova);
    salvarAparenciaCache(nova);
  }, []);

  return { aparencia, definirAparencia, sincronizarComPreferencias };
}

/** Resolve "sistema" para "light"/"dark" de verdade — usado pra pré-visualizar as
 *  amostras de paleta no tema ativo (Configuracoes, seção 6: "as amostras refletem
 *  o tema ativo"), já que html[data-palette] só existe mesmo na paleta selecionada. */
export function useTemaResolvido(tema: Tema): "light" | "dark" {
  const [escuro, setEscuro] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia("(prefers-color-scheme: dark)");
    const atualizar = () => setEscuro(tema === "escuro" || (tema === "sistema" && consulta.matches));
    atualizar();
    consulta.addEventListener("change", atualizar);
    return () => consulta.removeEventListener("change", atualizar);
  }, [tema]);

  return escuro ? "dark" : "light";
}
