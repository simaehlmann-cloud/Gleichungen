/* Lernpfade: Daten, Generatoren (Zufallstest), Bewertung, Vorstufen, Lernstand */
import { makeDom } from "./harness.mjs";
import { PFADE, STATIONEN, zahl, loese, bewerte, pruefeVorstufe, loesungsText } from "../src/lib/lernpfade.js";
import { laden, richtigGeloest, geschafft, erreichbar, zuruecksetzen, SCHLUESSEL } from "../src/lib/fortschritt.js";
import { representable } from "../src/lib/model.js";
import { F, fStr, fVal, P } from "../src/lib/fraction.js";
import { parseEquation } from "../src/lib/parser.js";

const gleich = (a, b) => a && b && a.n === b.n && a.d === b.d;
/* Eine richtige Antwort zur Aufgabe, so wie ein Kind sie eintippen würde */
function richtig(a) {
  const l = a.loesung;
  if (a.art === "paar") {
    const g = a.gl[0];
    return { x: "0", y: fStr({ n: g.R.k.n * g.L.y.d, d: g.R.k.d * g.L.y.n }) };
  }
  if (l.art === "keine" || l.art === "alle") return { art: l.art };
  return { x: fStr(l.x).replace("-", "−"), y: l.y ? fStr(l.y) : "" };
}
function falsch(a) {
  const l = a.loesung;
  if (a.art === "paar") return { x: "0", y: "1000" };
  if (l.art !== "eine") return { x: "7" };
  return { x: String(fVal(l.x) + 1), y: l.y ? fStr(l.y) : "" };
}
/* Vorstufe richtig ausfüllen */
const term = (p) => {
  const t = [];
  if (p.x.n) t.push(`${p.x.n}x`); if (p.y.n) t.push(`${p.y.n}y`); if (p.k.n || !t.length) t.push(String(p.k.n));
  return t.join(" + ");
};
const vorstufeRichtig = (a) => a.gl.map((g) => `${term(g.L)} = ${term(g.R)}`);

export default function (t) {
  makeDom("", { frisch: true });

  /* ---- Zahlen lesen ---- */
  t("zahl: ganze Zahl", gleich(zahl("3"), F(3)));
  t("zahl: Minuszeichen typografisch", gleich(zahl("−2"), F(-2)));
  t("zahl: Komma", gleich(zahl("1,5"), F(3, 2)));
  t("zahl: Bruch", gleich(zahl("3/2"), F(3, 2)));
  t("zahl: negativer Bruch", gleich(zahl("-5/3"), F(-5, 3)));
  t("zahl: Leerzeichen", gleich(zahl(" 4 "), F(4)));
  t("zahl: leer ist null", zahl("") === null && zahl("  ") === null);
  t("zahl: Unsinn ist undefined", zahl("3x") === undefined && zahl("1/0") === undefined && zahl("--2") === undefined && zahl("1.2.3") === undefined);

  /* ---- Löser ---- */
  const L = (s) => { const g = parseEquation(s); return [g]; };
  t("loese: eine Lösung", gleich(loese(L("3x + 2 = x + 8")).x, F(3)));
  t("loese: Bruch", gleich(loese(L("3x = 5")).x, F(5, 3)));
  t("loese: keine", loese(L("2x + 3 = 2x + 5")).art === "keine");
  t("loese: alle", loese(L("2(x + 1) = 2x + 2")).art === "alle");
  const S = (a, b) => [parseEquation(a), parseEquation(b)];
  const s1 = loese(S("x + y = 10", "x - y = 2"));
  t("loese LGS: eindeutig", gleich(s1.x, F(6)) && gleich(s1.y, F(4)));
  t("loese LGS: keine", loese(S("x + y = 4", "x + y = 6")).art === "keine");
  t("loese LGS: alle", loese(S("x + y = 4", "2x + 2y = 8")).art === "alle");
  t("loese LGS: 0 = 3 als Zeile", loese(S("0x = 3", "x + y = 2")).art === "keine");

  /* ---- Aufbau der Pfade ---- */
  t("zwei Pfade", PFADE.length === 2 && PFADE[0].id === "gl" && PFADE[1].id === "lgs");
  t("Gleichungen: 11 Stationen, letzte ist Test", PFADE[0].stationen.length === 11 && PFADE[0].stationen[10].test);
  t("LGS: 9 Stationen, letzte ist Test", PFADE[1].stationen.length === 9 && PFADE[1].stationen[8].test);
  t("Stations-IDs eindeutig", Object.keys(STATIONEN).length === 20);
  t("jede Station hat Titel, Merktext, Ziel", Object.values(STATIONEN).every((s) => s.titel && s.merk.length && s.ziel >= 3));
  t("Tests ohne Tipps", Object.values(STATIONEN).filter((s) => s.test).every((s) => s.tipps.length === 0 && s.ziel === 5));

  /* ---- Zufallstest: jede Station 300 Aufgaben ---- */
  for (const st of Object.values(STATIONEN)) {
    const probleme = [];
    for (let i = 0; i < 300; i++) {
      const a = st.gen();
      const l = a.loesung;
      if (!a.gl.every((g) => representable(g.L, g.R))) probleme.push("nicht waagentauglich " + a.zeige.join(" / "));
      if (a.art === "paar") { if (l.art !== "zwei") probleme.push("Paar ohne zwei Variablen"); }
      else if (!st.sonder && l.art !== "eine") probleme.push("keine eindeutige Lösung " + a.zeige.join(" / "));
      if (!st.sonder && l.art === "eine" && !st.id.startsWith("gl-8") && !st.test && l.x.d !== 1) probleme.push("Bruchlösung " + a.zeige.join(" / "));
      if (l.art === "eine" && l.y && (l.y.d !== 1 || l.y.n < 0 || l.x.n < 0)) probleme.push("LGS-Lösung nicht natürlich " + a.zeige.join(" / "));
      if (st.id === "gl-8" && l.art === "eine" && l.x.d === 1 && l.x.n >= 0) probleme.push("gl-8 ohne Bruch/negativ " + a.zeige.join(" / "));
      if (a.zeige.some((z) => /NaN|undefined/.test(z))) probleme.push("Anzeige kaputt");
      if (a.gl.length === 2 && !["lgs"].includes(a.art)) probleme.push("Art falsch");
      /* Bewertung: Richtiges zählt (mit dem Verfahren), Falsches nicht */
      const mitVerfahren = new Set(st.verfahren ? [st.verfahren] : []);
      if (a.vorstufe) {
        const v = pruefeVorstufe(a, vorstufeRichtig(a));
        if (!v.ok) probleme.push("Vorstufe abgelehnt: " + vorstufeRichtig(a).join(" / ") + " – " + v.text);
      }
      if (!bewerte(a, richtig(a), st, mitVerfahren).ok) probleme.push("richtige Antwort abgelehnt " + a.zeige.join(" / ") + " " + JSON.stringify(richtig(a)));
      if (bewerte(a, falsch(a), st, mitVerfahren).ok) probleme.push("falsche Antwort angenommen " + a.zeige.join(" / "));
      if (!loesungsText(a)) probleme.push("kein Lösungstext");
    }
    t(`${st.id}: 300 Zufallsaufgaben fehlerfrei ${probleme.slice(0, 2).join(" | ")}`, probleme.length === 0);
  }
  /* Sonderfall-Stationen erzeugen alle drei Arten */
  for (const id of ["gl-9", "lgs-7"]) {
    const arten = new Set(); for (let i = 0; i < 300; i++) arten.add(STATIONEN[id].gen().loesung.art);
    t(`${id}: keine, alle und eine Lösung kommen vor`, arten.has("keine") && arten.has("alle") && arten.has("eine"));
  }

  /* ---- Bewertung im Einzelnen ---- */
  const auf = (s, extra = {}) => ({ art: "gleichung", gl: [parseEquation(s)], zeige: [s], loesung: loese([parseEquation(s)]), ...extra });
  const a1 = auf("2x + 3 = 11");
  t("bewerte: richtig", bewerte(a1, { x: "4" }).ok);
  t("bewerte: 4,0 ist auch richtig", bewerte(a1, { x: "4,0" }).ok);
  t("bewerte: 8/2 ist auch richtig", bewerte(a1, { x: "8/2" }).ok);
  t("bewerte: leer", bewerte(a1, { x: "" }).leer);
  t("bewerte: Unsinn", bewerte(a1, { x: "vier" }).leer);
  t("bewerte: Vorzeichenfehler erkannt", /Vorzeichen/.test(bewerte(a1, { x: "-4" }).text));
  t("bewerte: Kehrwert erkannt", /Division/.test(bewerte(a1, { x: "1/4" }).text));
  t("bewerte: Probe bei falschem Wert", /Links kommt 13 heraus, rechts 11/.test(bewerte(a1, { x: "5" }).text));
  t("bewerte: Sonderfall gewählt, aber eindeutig", !bewerte(a1, { art: "keine" }).ok);
  const a2 = auf("2x + 3 = 2x + 5");
  t("bewerte: keine Lösung erkannt", bewerte(a2, { art: "keine" }).ok && !bewerte(a2, { art: "alle" }).ok);
  t("bewerte: Zahl bei Sonderfall", !bewerte(a2, { x: "1" }, { sonder: true }).ok);
  const sys = { art: "lgs", gl: S("y = x + 2", "x + y = 10"), zeige: [] };
  sys.loesung = loese(sys.gl);
  const st4 = STATIONEN["lgs-4"];
  t("bewerte LGS: ohne Einsetzen zählt nicht", bewerte(sys, { x: "4", y: "6" }, st4, new Set()).richtigOhneVerfahren);
  t("bewerte LGS: anderes Verfahren zählt nicht", !bewerte(sys, { x: "4", y: "6" }, st4, new Set(["addieren"])).ok);
  t("bewerte LGS: mit Einsetzen zählt", bewerte(sys, { x: "4", y: "6" }, st4, new Set(["einsetzen"])).ok);
  t("bewerte LGS: nur x richtig", /x stimmt/.test(bewerte(sys, { x: "4", y: "5" }, st4, new Set(["einsetzen"])).text));
  t("bewerte LGS: y fehlt", bewerte(sys, { x: "4", y: "" }).leer);
  const paar = { art: "paar", gl: [parseEquation("2x + y = 7")], zeige: [] }; paar.loesung = loese(paar.gl);
  t("bewerte Paar: jedes passende Paar", bewerte(paar, { x: "1", y: "5" }).ok && bewerte(paar, { x: "3,5", y: "0" }).ok && bewerte(paar, { x: "-1", y: "9" }).ok);
  t("bewerte Paar: unpassend", !bewerte(paar, { x: "1", y: "1" }).ok);
  t("Lösungstext Paar", loesungsText(paar) === "zum Beispiel x = 0 und y = 7, oder y = 0 und x = 7/2");

  /* ---- Vorstufen ---- */
  const k = { gl: [parseEquation("3(x + 2) = x + 14")], vorstufe: { typ: "klammer", text: "3(x + 2) = x + 14" } };
  k.loesung = loese(k.gl);
  t("Klammer: richtig aufgelöst", pruefeVorstufe(k, "3x + 6 = x + 14").ok);
  t("Klammer: Reihenfolge egal", pruefeVorstufe(k, "6 + 3x = 14 + x").ok);
  t("Klammer: Klammer noch da", /Klammer/.test(pruefeVorstufe(k, "3(x + 2) = x + 14").text));
  t("Klammer: nur ersten Summanden malgenommen", !pruefeVorstufe(k, "3x + 2 = x + 14").ok);
  t("Klammer: schon weitergerechnet", /weitergerechnet/.test(pruefeVorstufe(k, "2x = 8").text));
  t("Klammer: leer", !pruefeVorstufe(k, "").ok);
  t("Klammer: unlesbar", /lesen/.test(pruefeVorstufe(k, "3x + = 2").text));
  const s = { gl: [parseEquation("3x + 4 = 19")], vorstufe: { typ: "sach", anzahl: 1 } }; s.loesung = loese(s.gl);
  t("Sach: eigene Formulierung", pruefeVorstufe(s, "4 + 3x = 19").ok);
  t("Sach: gleichwertig, aber anders", pruefeVorstufe(s, "3x = 15").ok);
  t("Sach: nicht waagentauglich → Aufgabe auf die Waage", pruefeVorstufe(s, "19 - 3x = 4").ok && pruefeVorstufe(s, "19 - 3x = 4").gl === s.gl);
  t("Sach: falsch", !pruefeVorstufe(s, "3x + 4 = 20").ok);
  t("Sach: x fällt weg", !pruefeVorstufe(s, "x + 4 - x = 4 + 0x").ok);
  t("Sach: y bei einer Variablen", /eine Variable/.test(pruefeVorstufe(s, "3y + 4 = 19").text));
  const s2 = { gl: S("x + y = 10", "2x + 4y = 28"), vorstufe: { typ: "sach", anzahl: 2 } }; s2.loesung = loese(s2.gl);
  t("Sach LGS: richtig", pruefeVorstufe(s2, ["x + y = 10", "2x + 4y = 28"]).ok);
  t("Sach LGS: zweimal dasselbe", /dasselbe/.test(pruefeVorstufe(s2, ["x + y = 10", "2x + 2y = 20"]).text));
  t("Sach LGS: zweite falsch", /\(II\)/.test(pruefeVorstufe(s2, ["x + y = 10", "4x + 2y = 28"]).text));
  t("Sach LGS: ohne y", /x und y/.test(pruefeVorstufe(s2, ["x = 6", "2x = 12"]).text));
  t("Sach LGS: eine fehlt", !pruefeVorstufe(s2, ["x + y = 10", ""]).ok);

  /* ---- Lernstand ---- */
  window.localStorage.removeItem(SCHLUESSEL);
  t("Lernstand: anfangs leer", Object.keys(laden()).length === 0);
  let st = richtigGeloest({}, "gl-1"); st = richtigGeloest(st, "gl-1");
  t("Lernstand: zählt und speichert", laden()["gl-1"] === 2);
  t("Lernstand: Station 2 noch zu", !erreichbar(st, "gl-2") && erreichbar(st, "gl-1"));
  st = richtigGeloest(st, "gl-1");
  t("Lernstand: geschafft nach 3", geschafft(st, "gl-1") && erreichbar(st, "gl-2") && !erreichbar(st, "gl-3"));
  t("Lernstand: LGS unabhängig", erreichbar(st, "lgs-1") && !erreichbar(st, "lgs-2"));
  window.localStorage.setItem(SCHLUESSEL, "{kaputt");
  t("Lernstand: kaputtes JSON → leer", Object.keys(laden()).length === 0);
  window.localStorage.setItem(SCHLUESSEL, JSON.stringify({ v: 1, s: { "gl-1": 2, "fremd": 5, "gl-2": -1, "gl-3": "3", "gl-4": 1.5 } }));
  const gef = laden();
  t("Lernstand: nur gültige Einträge", gef["gl-1"] === 2 && !("fremd" in gef) && !("gl-2" in gef) && !("gl-3" in gef) && !("gl-4" in gef));
  window.localStorage.setItem(SCHLUESSEL, JSON.stringify({ v: 2, s: { "gl-1": 2 } }));
  t("Lernstand: fremde Version → leer", Object.keys(laden()).length === 0);
  window.localStorage.setItem(SCHLUESSEL, JSON.stringify({ v: 1, s: { "gl-1": 3, "lgs-1": 3 } }));
  zuruecksetzen("gl");
  t("Lernstand: Zurücksetzen nur für einen Pfad", !laden()["gl-1"] && laden()["lgs-1"] === 3);
  window.localStorage.removeItem(SCHLUESSEL);
  void P;
}
