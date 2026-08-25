/* Reine Rechenlogik ohne Oberfläche */
import { F, fStr, fVal, isInt, fSub, fDiv, termStr, P } from "../src/lib/fraction.js";
import { parseEquation } from "../src/lib/parser.js";
import { representable, repairSteps, levelValues } from "../src/lib/model.js";
import { genTask, genNeg } from "../src/lib/tasks.js";
import { sachtext, CONTEXTS } from "../src/lib/texts.js";

const loese = (L, R) => { const a = fSub(L.x, R.x), b = fSub(R.k, L.k); return a.n === 0 ? null : fDiv(b, a); };

export default function (t) {
  t("Brüche kürzen", fStr(F(6, 4)) === "3/2" && fStr(F(4, 2)) === "2");
  t("Termdarstellung", termStr(P(3, 0, 2)) === "3x + 2" && termStr(P(-1, 0, 0)) === "−x");
  t("Klammern werden ausmultipliziert", (() => { const e = parseEquation("2(x + 3) = 4x - 2"); return termStr(e.L) === "2x + 6" && termStr(e.R) === "4x − 2"; })());
  t("Dezimalzahlen als Brüche", termStr(parseEquation("0,5x = 2").L) === "1/2x");
  t("Nichtlineares wird abgelehnt", (() => { try { parseEquation("x*x = 4"); return false; } catch { return true; } })());
  t("Fehlende Klammer wird gemeldet", (() => { try { parseEquation("2(x + 3 = 4"); return false; } catch { return true; } })());
  t("Darstellbarkeit erkannt", representable(P(3, 0, 2), P(1, 0, 8)) && !representable(P(1, 0, -2), P(0, 0, 3)));
  t("Reparatur macht waagentauglich", (() => { const e = parseEquation("x/2 + 1 = 3 - x"); const r = repairSteps(e.L, e.R); return representable(r.L, r.R) && termStr(r.L) === "3x + 2" && termStr(r.R) === "6"; })());
  t("Reparatur erhält die Lösung", (() => { const e = parseEquation("x/2 + 1 = 3 - x"); const r = repairSteps(e.L, e.R); return fStr(loese(e.L, e.R)) === fStr(loese(r.L, r.R)); })());
  t("Gleichgewichtswert exakt", (() => { const lv = levelValues(P(2, 0, 1), P(0, 0, 4)); return lv.ok && fStr(lv.xF) === "3/2"; })());
  t("Unlösbares erkannt", !levelValues(P(3, 0, 2), P(3, 0, 5)).ok);

  let fehler = 0;
  for (const stufe of [1, 2, 3, 5]) {
    for (let i = 0; i < 150; i++) {
      const g = genTask(stufe);
      if (stufe === 5) { if (g.mode !== "lgs" || g.scales.length !== 2) fehler++; continue; }
      const s = g.scales[0];
      if (!representable(s.L, s.R)) fehler++;
      const x = loese(s.L, s.R);
      if (x === null) { fehler++; continue; }
      if (stufe === 3 && isInt(x)) fehler++;
      if ((stufe === 1 || stufe === 2) && (!isInt(x) || fVal(x) < 1)) fehler++;
    }
  }
  t("Generator liefert saubere Aufgaben (600 Läufe)", fehler === 0);
  t("Negativ-Generator hat negative Lösung", (() => {
    for (let i = 0; i < 100; i++) { const s = genNeg().scales[0]; if (!representable(s.L, s.R) || fVal(loese(s.L, s.R)) >= 0) return false; }
    return true;
  })());
  t("Sachtext Mehrzahl", sachtext(P(3, 0, 2), P(1, 0, 8), CONTEXTS.markt) === "3 Mehlsäcke und 2 Kilogewichte wiegen so viel wie ein Mehlsack und 8 Kilogewichte. Wie schwer ist ein Mehlsack?");
  t("Sachtext Einzahl", sachtext(P(1, 0, 0), P(0, 0, 4), CONTEXTS.schachtel) === "Eine Schachtel ist so viel wie 4 Streichhölzer. Wie viele Hölzer stecken in einer Schachtel?");
  t("Sachtext ohne Inhalt entfällt", sachtext(P(0, 0, 0), P(0, 0, 4), CONTEXTS.markt) === null);
}
