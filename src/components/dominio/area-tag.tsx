import type { Area } from "@/lib/api/types";
import { cn } from "@/lib/cn";

const ROTULOS: Record<Area, string> = {
  LC: "Linguagens",
  CH: "Ciências Humanas",
  CN: "Ciências da Natureza",
  MT: "Matemática",
};

const CLASSES: Record<Area, string> = {
  LC: "bg-area-lc-soft text-area-lc",
  CH: "bg-area-ch-soft text-area-ch",
  CN: "bg-area-cn-soft text-area-cn",
  MT: "bg-area-mt-soft text-area-mt",
};

export interface AreaTagProps {
  area: Area;
  className?: string;
}

/** Sigla + nome curto, fundo *-soft, texto na cor da área (seção 6). */
export function AreaTag({ area, className }: AreaTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        CLASSES[area],
        className,
      )}
    >
      <span className="font-mono">{area}</span>
      <span>{ROTULOS[area]}</span>
    </span>
  );
}
