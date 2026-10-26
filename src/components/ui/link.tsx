import NextLink from "next/link";
import { cn } from "@/lib/cn";

export type LinkProps = React.ComponentPropsWithoutRef<typeof NextLink>;

/** Sempre sublinhado (seção 9): link nunca depende só da cor para ser identificado. */
export function Link({ className, ...props }: LinkProps) {
  return (
    <NextLink
      className={cn("text-brand-ink underline underline-offset-2 hover:text-brand-hover", className)}
      {...props}
    />
  );
}
