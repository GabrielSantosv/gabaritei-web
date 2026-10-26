import { BookOpen, ClipboardList, Dumbbell, History, Home } from "lucide-react";

export interface NavItem {
  href: string;
  rotulo: string;
  icone: typeof Home;
}

/** Itens do AppShell (seção 8): Início, Treino, Questões, Simulados, Histórico — Perfil fica no rodapé. */
export const ITENS_NAV: NavItem[] = [
  { href: "/inicio", rotulo: "Início", icone: Home },
  { href: "/treino", rotulo: "Treino", icone: Dumbbell },
  { href: "/questoes", rotulo: "Questões", icone: BookOpen },
  { href: "/simulados", rotulo: "Simulados", icone: ClipboardList },
  { href: "/historico", rotulo: "Histórico", icone: History },
];
