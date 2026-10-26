/**
 * Gera um retrato (JSON) do banco fictício de `lib/api/mock/dados.ts` para o
 * grupo revisar fora do navegador. O app em si NÃO depende deste arquivo —
 * `dados.ts` gera os mesmos dados em tempo de execução (mesma semente).
 *
 * Uso: npx tsx scripts/gerar-mock.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { BANCO_DEMO, HABILIDADES } from "../src/lib/api/mock/dados";

function main() {
  const destino = resolve(__dirname, "../docs/mock-gerado.json");
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(
    destino,
    JSON.stringify(
      {
        geradoEm: new Date().toISOString(),
        totalQuestoes: BANCO_DEMO.length,
        totalHabilidades: HABILIDADES.length,
        habilidades: HABILIDADES,
        questoes: BANCO_DEMO,
      },
      null,
      2,
    ),
  );
  console.log(`Gerado ${BANCO_DEMO.length} questões e ${HABILIDADES.length} habilidades em ${destino}`);
}

main();
