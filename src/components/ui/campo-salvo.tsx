/** "Salvando…"/"Salvo" ao lado de um campo que salva sozinho, sem botão global
 *  (Perfil e Configuracoes). Região aria-live pra quem usa leitor de tela saber
 *  que salvou sem precisar ficar olhando a tela. */
export function CampoSalvo({ salvando }: { salvando: boolean }) {
  return (
    <span aria-live="polite" className="text-xs text-ink-2">
      {salvando ? "Salvando…" : "Salvo"}
    </span>
  );
}
