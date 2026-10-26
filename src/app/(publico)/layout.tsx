import { PublicShell } from "@/components/layout/public-shell";

export default function PublicoLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
