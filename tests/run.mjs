/* Führt alle tests/*.test.jsx aus: bündeln mit esbuild, dann in jsdom laufen lassen. */
import { readdirSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const hier = dirname(fileURLToPath(import.meta.url));
const dateien = readdirSync(hier).filter((f) => f.endsWith(".test.jsx")).sort();
/* Ins Projektverzeichnis bauen, damit node_modules auflösbar bleibt. */
const tmp = join(hier, ".build");
mkdirSync(tmp, { recursive: true });
let bestanden = 0, gescheitert = 0;

for (const datei of dateien) {
  const out = join(tmp, datei.replace(".jsx", ".mjs"));
  await build({
    entryPoints: [join(hier, datei)],
    bundle: true, platform: "node", format: "esm", outfile: out,
    external: ["jsdom"], logLevel: "silent",
  });
  const modul = await import(pathToFileURL(out).href);
  const ergebnisse = [];
  const t = (name, bedingung) => {
    ergebnisse.push({ name, ok: !!bedingung });
    if (bedingung) bestanden++; else gescheitert++;
  };
  process.stdout.write(`\n${datei}\n`);
  try {
    await modul.default(t);
  } catch (e) {
    gescheitert++;
    ergebnisse.push({ name: "Ausnahme: " + (e && e.message), ok: false });
  }
  for (const r of ergebnisse) process.stdout.write(`  ${r.ok ? "✓" : "✗"} ${r.name}\n`);
}

rmSync(tmp, { recursive: true, force: true });
process.stdout.write(`\n${bestanden} bestanden, ${gescheitert} gescheitert\n`);
process.exit(gescheitert ? 1 : 0);
