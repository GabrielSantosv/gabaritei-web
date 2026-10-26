import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Já temos CLAUDE.md apontando para docs/FRONTEND_PROMPT.md (seção "Como usar"
  // do prompt); não precisamos do AGENTS.md gerado automaticamente pelo Next.
  agentRules: false,
  // bottom-left (o padrão) cobre o "Sair" no rodapé da Sidebar (seção 8). O
  // ScenarioSwitcher (scenario-switcher.tsx) foi pro bottom-right pelo mesmo
  // motivo — os dois ficam em cantos diferentes, sem se cobrir.
  devIndicators: {
    position: "top-right",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
