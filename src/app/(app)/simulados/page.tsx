import type { Metadata } from "next";
import { SimuladosClient } from "./simulados-client";

export const metadata: Metadata = { title: "Simulados" };

export default function SimuladosPage() {
  return <SimuladosClient />;
}
