import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import "@/styles/globals.css";
import { SCRIPT_APARENCIA_INICIAL } from "@/lib/hooks/use-aparencia";
import { Providers } from "./providers";

const serif = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
  display: "swap",
});

const sans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Gabaritei",
    template: "%s | Gabaritei",
  },
  description:
    "Gabaritei: recomendação adaptativa de questões do ENEM, sempre dizendo o critério da recomendação.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // themeColor é metadado lido pelo SO/navegador (cor da barra de endereço), fora da
  // cascata CSS — não há como referenciar var(--paper) aqui. Os hex têm que continuar
  // batendo com --paper claro/escuro em tokens.css manualmente se o token mudar.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f2ec" }, // check-regras: ignore
    { media: "(prefers-color-scheme: dark)", color: "#121714" }, // check-regras: ignore
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_APARENCIA_INICIAL }} />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
