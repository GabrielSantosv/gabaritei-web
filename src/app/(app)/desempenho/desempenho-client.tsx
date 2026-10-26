"use client";

import { useQuery } from "@tanstack/react-query";

import { AreaTag } from "@/components/dominio/area-tag";
import { Link } from "@/components/ui/link";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getApi } from "@/lib/api/client";
import { formatarPercentual } from "@/lib/format";
import type { Area } from "@/lib/api/types";
import { revelar } from "@/lib/reveal";

const AREAS: Area[] = ["LC", "CH", "CN", "MT"];

function CartaoArea({ area }: { area: Area }) {
  const { data, isLoading } = useQuery({
    queryKey: ["desempenho", area, "tudo"],
    queryFn: () => getApi().obterDesempenho(area, "tudo"),
  });

  return (
    <Link
      href={`/desempenho/${area}`}
      className="flex flex-col gap-3 rounded-md border border-rule bg-card p-5 text-ink no-underline hover:bg-paper-2 motion-safe-transition"
    >
      <AreaTag area={area} />
      {isLoading ? (
        <Skeleton className="h-9 w-20" />
      ) : data && data.respondidas > 0 ? (
        <div>
          <p className="font-display text-3xl font-semibold text-ink">{formatarPercentual((data.taxaAcerto ?? 0) * 100)}</p>
          <p className="text-sm text-ink-2">{data.respondidas} questões respondidas</p>
        </div>
      ) : (
        <p className="text-sm text-ink-2">Sem respostas nesta área ainda.</p>
      )}
    </Link>
  );
}

export function DesempenhoClient() {
  return (
    <div>
      <PageHeader titulo="Desempenho" descricao="Escolha uma área para ver em quais assuntos você mais erra e treinar direto neles." />
      <div {...revelar(0)} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AREAS.map((area) => (
          <CartaoArea key={area} area={area} />
        ))}
      </div>
    </div>
  );
}
