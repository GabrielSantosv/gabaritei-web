import type { Area } from "@/lib/api/types";
import { cn } from "@/lib/cn";

const ROTULOS: Record<Area, string> = {
  LC: "Linguagens",
  CH: "Ciências Humanas",
  CN: "Ciências da Natureza",
  MT: "Matemática",
};

const CLASSES: Record<Area, string> = {
  LC: "border-area-lc bg-area-lc-soft text-area-lc",
  CH: "border-area-ch bg-area-ch-soft text-area-ch",
  CN: "border-area-cn bg-area-cn-soft text-area-cn",
  MT: "border-area-mt bg-area-mt-soft text-area-mt",
};

const SWATCH: Record<Area, string> = {
  LC: "bg-area-lc",
  CH: "bg-area-ch",
  CN: "bg-area-cn",
  MT: "bg-area-mt",
};

export interface AreaTagProps {
  area: Area;
  className?: string;
}

/**
 * Sigla + nome curto, fundo *-soft, texto na cor da área (seção 6). Borda e
 * marcador na cor cheia da área (não a *-soft) — mesmo padrão do chip de
 * referência do Início (docs/identidade/referencia/inicio-novo/Apresentacao.dc.html,
 * `demo.chipStyle`/`demo.swatchStyle`), pra ficar mais fácil distinguir as 4
 * áreas lado a lado (pedido do usuário: o filtro de área "ficou apagado").
 */
export function AreaTag({ area, className }: AreaTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        CLASSES[area],
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-xs", SWATCH[area])} />
      <span className="font-mono">{area}</span>
      <span>{ROTULOS[area]}</span>
    </span>
  );
}
