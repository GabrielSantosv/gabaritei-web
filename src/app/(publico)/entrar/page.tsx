import type { Metadata } from "next";
import { EntrarClient } from "./entrar-client";

export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage() {
  return <EntrarClient />;
}
