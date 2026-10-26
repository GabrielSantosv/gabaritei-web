"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { apiMode } from "@/lib/api/client";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DemoBanner } from "@/components/dominio/demo-banner";
import { ScenarioSwitcher } from "@/components/dominio/scenario-switcher";
import { AparenciaSync } from "@/components/layout/aparencia-sync";
import { FocoNoH1 } from "@/components/layout/foco-no-h1";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          {apiMode() === "mock" ? <DemoBanner /> : null}
          <AparenciaSync />
          <FocoNoH1 />
          {children}
          <ScenarioSwitcher />
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
