import type { Metadata } from "next";
import { InicioClient } from "./inicio-client";

export const metadata: Metadata = { title: "Início" };

export default function InicioPage() {
  return <InicioClient />;
}
