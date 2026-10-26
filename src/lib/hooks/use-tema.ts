"use client";

/**
 * Compat: só o campo `tema`, por cima do cache único de `use-aparencia.ts` (seção
 * 4.5). Existe porque o controle de Tema no Perfil (até a P1 mover pra
 * Configuracoes) e a galeria `/dev/componentes` ainda chamam isto direto.
 */
import { useCallback, useEffect, useState } from "react";
import { aplicarAparencia, lerAparenciaSalva, salvarAparenciaCache, type Tema } from "./use-aparencia";

export type { Tema };

export function lerTemaSalvo(): Tema {
  return lerAparenciaSalva().tema;
}

export function aplicarTema(tema: Tema): void {
  aplicarAparencia({ ...lerAparenciaSalva(), tema });
}

export function useTema() {
  const [tema, setTema] = useState<Tema>("sistema");

  useEffect(() => {
    // Lê localStorage, que só existe no navegador: precisa ser depois da
    // hidratação para o SSR não divergir do cliente (script inline já evita o flash visual).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTema(lerTemaSalvo());
  }, []);

  const definirTema = useCallback((novo: Tema) => {
    setTema(novo);
    aplicarTema(novo);
    salvarAparenciaCache({ tema: novo });
  }, []);

  return { tema, definirTema };
}
