import { cn } from "@/lib/cn";

/** Skeleton de carregamento. Mostrar só depois de ~200 ms de espera (RNF02). */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("pulso rounded-xs bg-paper-2", className)}
      {...props}
    />
  );
}
