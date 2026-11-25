/* Lernpfade in der App: Übersicht, Einführung, Üben, Fortschritt, Vorstufen,
   Verfahrenspflicht, Waage ausgeblendet, Sperre ohne Vollversion */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { makeDom, tools } from "./harness.mjs";
import * as AppModul from "../src/WaagemodellApp.jsx";
import { loese } from "../src/lib/lernpfade.js";
import { parseEquation } from "../src/lib/parser.js";
import { fStr } from "../src/lib/fraction.js";
import { SCHLUESSEL } from "../src/lib/fortschritt.js";

const warte = () => act(() => new Promise((r) => setTimeout(r, 0)));
const klickWarte = (b) => act(async () => { b.dispatchEvent(new window.MouseEvent("click", { bubbles: true })); await new Promise((r) => setTimeout(r, 0)); });

export default async function (t) {
  await new Promise((r) => setTimeout(r, 800));
  const { fehler } = makeDom("", { frisch: true });
  const { txt, knopf, klick, tippe } = tools(act);
  let root = createRoot(document.getElementById("root"));
  const neu = (stand) => {
    act(() => root.unmount());
    document.getElementById("root").innerHTML = "";
    window.history.replaceState(null, "", "/"); // sonst stellt ?st= die Arbeitsfläche wieder her
    if (stand) window.localStorage.setItem(SCHLUESSEL, JSON.stringify({ v: 1, s: stand }));
    root = createRoot(document.getElementById("root"));
    act(() => root.render(React.createElement(AppModul.default)));
  };
  act(() => root.render(React.createElement(AppModul.default)));

  /* Aufgabe aus der Anzeige lesen und exakt lösen */
  const zeilen = () => [...document.querySelectorAll("[data-lp-aufgabe] > div")].map((d) => d.textContent).filter((z) => z.includes("="))
    .map((z) => z.replace(/^\((I|II)\)\s*/, ""));
  const loesung = () => loese(zeilen().map(parseEquation));
  const station = (id) => document.querySelector(`[data-station="${id}"]`);
  const feld = (a) => document.querySelector(`[data-lp-${a}]`);
  const antworte = () => {
    const l = loesung();
    tippe(feld("x"), fStr(l.x).replace("-", "−"));
    if (l.y) tippe(feld("y"), fStr(l.y));
    klick(knopf("prüfen"));
  };
  const status = () => (document.querySelector("section[aria-label='Lernpfad'] [role='status']") || { textContent: "" }).textContent;

  /* ---- Startseite → Übersicht ---- */
  t("Startseite: Block Lernpfade", !!document.querySelector("#t-lp"));
  klick(document.querySelector("#t-lp"));
  t("Übersicht: beide Pfade", !!document.querySelector("[data-pfad='gl']") && !!document.querySelector("[data-pfad='lgs']"));
  t("Übersicht: 20 Stationen", document.querySelectorAll("[data-station]").length === 20);
  t("Übersicht: Station 1 offen, Station 2 gesperrt", !station("gl-1").disabled && station("gl-2").disabled && !station("lgs-1").disabled && station("lgs-2").disabled);
  t("Übersicht: Web ohne Kaufsperre", !txt().includes("Vollversion"));

  /* ---- Einführung ---- */
  klick(station("gl-1"));
  t("Einführung: Merkkasten und Beispiel", txt().includes("Merke") && txt().includes("Beispiel") && txt().includes("Gleichungen durch Probieren lösen"));
  klick(knopf("Übersicht"));
  t("Einführung: zurück zur Übersicht", !!station("gl-1"));
  klick(station("gl-1"));
  klick(knopf("Los geht"));

  /* ---- Üben ---- */
  t("Lernpfad-Aufgabe nicht in der Adresszeile", !window.location.search.includes("st="));
  t("Leiste erscheint", !!document.querySelector("section[aria-label='Lernpfad']") && !!feld("x"));
  t("eine Waage", document.querySelectorAll("[data-waage]").length === 1);
  t("Kopfleiste: Lernpfade statt Start, kein Aufgabe-Knopf", !!knopf("Lernpfade") && !knopf("Start") && !knopf("Aufgabe"));
  t("keine freie Lösungskontrolle", !txt().includes("meine Lösung") && !knopf("Lösung anzeigen"));
  t("Station 1: Ausprobieren mit Regler", !!document.querySelector("input[type='range']"));
  t("Station 1: Waage wiegt sofort mit dem Reglerwert", txt().includes("Probiermodus"));
  t("kein Präsentationsknopf im Lernpfad", !knopf("Präsentation"));
  t("Lösung zeigen erst nach einem Versuch", !knopf("Lösung zeigen"));
  klick(knopf("prüfen"));
  t("leere Eingabe: Hinweis", status().includes("Trag deine Lösung"));
  t("leere Eingabe zählt nicht als Versuch", !knopf("Lösung zeigen"));
  klick([...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Tipp"));
  t("Tipp erscheint", txt().includes("Bewege den Regler für x"));
  tippe(feld("x"), String(Number(fStr(loesung().x)) + 1));
  klick(knopf("prüfen"));
  t("falsche Antwort: Probe-Hinweis", /stimmt noch nicht|Vorzeichen|Division/.test(status()));
  t("Stolperstelle notiert", txt().includes("Einstellungen · 1"));
  t("jetzt Lösung zeigen möglich", !!knopf("Lösung zeigen"));
  klick(knopf("Lösung zeigen"));
  t("Lösung gezeigt, zählt nicht", status().includes("zählt nicht mit") && !window.localStorage.getItem(SCHLUESSEL));
  t("Nächste Aufgabe", !!knopf("Nächste Aufgabe"));
  for (let i = 0; i < 3; i++) {
    klick(knopf("Nächste Aufgabe"));
    antworte();
  }
  t("drei richtig: Station geschafft", status().includes("Station geschafft"));
  t("Lernstand gespeichert", JSON.parse(window.localStorage.getItem(SCHLUESSEL)).s["gl-1"] === 3);
  t("Punkte voll", document.querySelector("section[aria-label='Lernpfad'] [aria-label='3 von 3 geschafft']") !== null);
  klick(knopf("Zur nächsten Station"));
  t("weiter zur Einführung Station 2", txt().includes("Mit der Waage: auf beiden Seiten wegnehmen") && !!knopf("Los geht"));
  klick(knopf("Übersicht"));
  t("Station 2 jetzt offen, 1 geschafft", !station("gl-2").disabled && station("gl-1").textContent.includes("geschafft"));
  klick(knopf("Start"));
  t("nach dem Lernpfad kein Weiterarbeiten mit der Lernpfad-Aufgabe", !knopf("Weiterarbeiten"));
  klick(document.querySelector("#t-gl"));
  t("freies Arbeiten danach ohne Stationswerkzeuge", !document.querySelector("input[type='range']") && !document.querySelector("section[aria-label='Lernpfad']") && !!knopf("Aufgabe"));

  /* ---- Klammer-Vorstufe ---- */
  neu({ "gl-1": 3, "gl-2": 3, "gl-3": 3, "gl-4": 3, "gl-5": 3, "gl-6": 3 });
  klick(document.querySelector("#t-lp"));
  t("gespeicherter Stand: Station 7 offen", !station("gl-7").disabled && station("gl-8").disabled);
  klick(station("gl-7")); klick(knopf("Los geht"));
  t("Klammer: erst Vorstufe, keine Waage", !!feld("vor") && !document.querySelector("[data-waage]") && txt().includes("ohne Klammer"));
  const roh = zeilen()[0];
  tippe(feld("vor"), roh);
  klick(knopf("prüfen"));
  t("Klammer: noch Klammer → Hinweis", status().includes("Klammer"));
  t("Vorstufe: kein Zurück/Vor für unsichtbare Waagen", !knopf("zurück") && !knopf("vor"));
  const g = parseEquation(roh);
  const term = (p) => [p.x.n ? `${p.x.n}x` : "", p.k.n ? String(p.k.n) : ""].filter(Boolean).join(" + ") || "0";
  tippe(feld("vor"), `${term(g.L)} = ${term(g.R)}`);
  klick(knopf("prüfen"));
  t("Klammer: richtig → Waage erscheint", !!document.querySelector("[data-waage]") && status().includes("Richtig aufgelöst"));
  t("Klammer: Rechenweg eingeblendet", txt().includes("Symbolische Ebene"));
  t("Klammer: Lösung im Rechenweg verborgen", !knopf("Lösung anzeigen"));
  antworte();
  t("Klammer: gelöst zählt", JSON.parse(window.localStorage.getItem(SCHLUESSEL)).s["gl-7"] === 1);

  /* Vorstufe: Lösung zeigen nach Fehlversuch lädt die Gleichung */
  klick(knopf("Nächste Aufgabe"));
  tippe(feld("vor"), "x = 1");
  klick(knopf("prüfen"));
  klick(knopf("Lösung zeigen"));
  t("Vorstufe aufgedeckt: Waage da, zählt nicht", !!document.querySelector("[data-waage]") && status().includes("zählt nicht mit"));
  antworte();
  t("aufgedeckte Aufgabe zählt nicht", JSON.parse(window.localStorage.getItem(SCHLUESSEL)).s["gl-7"] === 1);

  /* ---- Waage ausgeblendet (Station 6) ---- */
  klick(knopf("Übersicht"));
  klick(station("gl-6")); klick(knopf("Los geht"));
  t("Station 6: eigene Meldung ohne Waage", txt().includes("Forme mit den Tasten um"));
  t("Station 6: Waage verborgen, Umformen geht", !document.querySelector("[data-waage]") && !!knopf("− Kugel") && txt().includes("Symbolische Ebene"));
  klick(knopf("Waage als Hilfe"));
  t("Waage als Hilfe einblendbar", !!document.querySelector("[data-waage]"));
  klick(knopf("Waage ausblenden"));
  t("und wieder aus", !document.querySelector("[data-waage]"));

  /* ---- Sonderfälle ---- */
  klick(knopf("Übersicht"));
  neu({ "gl-1": 3, "gl-2": 3, "gl-3": 3, "gl-4": 3, "gl-5": 3, "gl-6": 3, "gl-7": 3, "gl-8": 3 });
  klick(document.querySelector("#t-lp"));
  klick(station("gl-9")); klick(knopf("Los geht"));
  t("Sonderfall-Knöpfe", !!knopf("keine Lösung") && !!knopf("jede Zahl ist Lösung"));
  let versuche = 0;
  while (versuche++ < 30) {
    const l = loesung();
    if (l.art === "keine") klick(knopf("keine Lösung"));
    else if (l.art === "alle") klick(knopf("jede Zahl ist Lösung"));
    else antworte();
    if (!knopf("Nächste Aufgabe")) break;
    if (JSON.parse(window.localStorage.getItem(SCHLUESSEL)).s["gl-9"] >= 3) break;
    klick(knopf("Nächste Aufgabe"));
  }
  t("Sonderfälle: richtig erkannt und gezählt", JSON.parse(window.localStorage.getItem(SCHLUESSEL)).s["gl-9"] >= 3);

  /* ---- Sachaufgabe (Zufall festgelegt: erste Vorlage, kleinste Werte) ---- */
  klick(knopf("Übersicht"));
  neu({ "gl-1": 3, "gl-2": 3, "gl-3": 3, "gl-4": 3, "gl-5": 3, "gl-6": 3, "gl-7": 3, "gl-8": 3, "gl-9": 3 });
  klick(document.querySelector("#t-lp"));
  klick(station("gl-10"));
  const zufall = Math.random; Math.random = () => 0;
  klick(knopf("Los geht"));
  Math.random = zufall;
  t("Sach: Text und Bedeutung von x", txt().includes("Wenn du eine Zahl mit 2 malnimmst und dann 1 addierst, erhältst du 5") && txt().includes("die gesuchte Zahl"));
  tippe(feld("vor"), "2x + 1 = 6");
  klick(knopf("Gleichung prüfen"));
  t("Sach: falsche Gleichung", status().includes("passt noch nicht"));
  tippe(feld("vor"), "1 + 2x = 5");
  klick(knopf("Gleichung prüfen"));
  t("Sach: eigene Gleichung auf der Waage", !!document.querySelector("[data-waage]") && txt().includes("2x + 1 = 5"));
  tippe(feld("x"), "2"); klick(knopf("prüfen"));
  t("Sach: gelöst", status().startsWith("Richtig"));

  /* ---- LGS: Einsetzungsverfahren ist Pflicht ---- */
  klick(knopf("Übersicht"));
  neu({ "lgs-1": 3, "lgs-2": 3, "lgs-3": 3 });
  klick(document.querySelector("#t-lp"));
  klick(station("lgs-4")); klick(knopf("Los geht"));
  t("LGS: zwei Waagen ohne Vollversion-Sperre", document.querySelectorAll("[data-waage]").length === 2);
  antworte();
  t("LGS: richtig, aber ohne Einsetzen zählt nicht", status().includes("Einsetzungsverfahren") && !knopf("Nächste Aufgabe"));
  const einsetzen = () => [...document.querySelectorAll("button")].filter((b) => /einsetzen$/.test(b.textContent.trim()))
    .forEach((b) => { if (document.querySelectorAll("[data-waage]").length === 2) klick(b); });
  einsetzen();
  t("LGS: Einsetzen erzeugt neue Waage", document.querySelectorAll("[data-waage]").length === 3);
  klick(knopf("zurück"));
  t("LGS: zurück nimmt das Einsetzen zurück", document.querySelectorAll("[data-waage]").length === 2);
  klick(knopf("prüfen"));
  t("LGS: zurückgenommenes Einsetzen zählt nicht", status().includes("Einsetzungsverfahren"));
  einsetzen();
  klick(knopf("prüfen"));
  t("LGS: mit Einsetzen zählt", status().startsWith("Richtig") && JSON.parse(window.localStorage.getItem(SCHLUESSEL)).s["lgs-4"] === 1);
  klick(knopf("Nächste Aufgabe"));
  t("neue Aufgabe: Verfahren wieder zurückgesetzt", document.querySelectorAll("[data-waage]").length === 2);
  antworte();
  t("neue Aufgabe verlangt erneut Einsetzen", status().includes("Einsetzungsverfahren"));

  /* ---- Abschlusstest: keine Tipps, keine Lösung ---- */
  klick(knopf("Übersicht"));
  neu({ "lgs-1": 3, "lgs-2": 3, "lgs-3": 3, "lgs-4": 3, "lgs-5": 3, "lgs-6": 3, "lgs-7": 3, "lgs-8": 3 });
  klick(document.querySelector("#t-lp"));
  klick(station("lgs-test")); klick(knopf("Los geht"));
  tippe(feld("x"), "999"); tippe(feld("y"), "999"); klick(knopf("prüfen"));
  const genau = (w) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === w);
  t("Test: kein Tipp, keine Lösung", !genau("Tipp") && !knopf("Lösung zeigen") && status().length > 0);
  for (let i = 0; i < 5; i++) { antworte(); klick(knopf("Nächste Aufgabe")); }
  t("Test: bestanden", station("lgs-test") === null && JSON.parse(window.localStorage.getItem(SCHLUESSEL)).s["lgs-test"] === 5);
  klick(knopf("Übersicht"));
  t("Übersicht: LGS komplett", document.querySelector("[data-pfad='lgs']").textContent.includes("9 von 9 Stationen geschafft"));
  klick(knopf("Fortschritt zurücksetzen"));
  t("Zurücksetzen fragt nach", !station("lgs-2").disabled && !!knopf("Ja, zurücksetzen"));
  klick(knopf("Abbrechen"));
  t("Abbrechen behält den Stand", !station("lgs-2").disabled);
  klick(knopf("Fortschritt zurücksetzen"));
  klick(knopf("Ja, zurücksetzen"));
  t("Zurücksetzen", station("lgs-2").disabled && !JSON.parse(window.localStorage.getItem(SCHLUESSEL)).s["lgs-1"]);

  /* ---- Sperre ohne Vollversion (iOS ohne Kauf) ---- */
  window.localStorage.removeItem("waagemodell-voll");
  let besitz = false;
  const ids = [];
  window.__waageStore = {
    status: async ({ id }) => ({ available: true, owned: besitz && id === "de.schule.waagemodell.vollversion" }),
    product: async () => ({ id: "x", price: "3,99 €" }),
    buy: async ({ id }) => { ids.push(id); besitz = true; return { result: "purchased" }; },
    restore: async () => ({ owned: besitz }),
    addListener: async () => ({ remove() {} }),
  };
  neu({ "gl-1": 3 });
  await warte();
  klick(document.querySelector("#t-lp"));
  t("ohne Kauf: Station 1 frei, Station 2 mit Schloss", !station("gl-2").disabled && station("gl-2").textContent.includes("Vollversion") && !station("gl-1").textContent.includes("Vollversion"));
  klick(station("gl-1")); klick(knopf("Los geht"));
  t("ohne Kauf: Station 1 spielbar", !!feld("x"));
  klick(knopf("Übersicht"));
  klick(station("gl-2"));
  t("ohne Kauf: Einführung lesbar, Start gesperrt", txt().includes("Merke") && !knopf("Los geht") && !!knopf("Mit der Vollversion weiterlernen"));
  klick(knopf("Mit der Vollversion weiterlernen"));
  t("Kaufbereich nennt Lernpfade", txt().includes("Jeder Lernpfad ab Station 2 gehört zur Vollversion") && !!knopf("Vollversion kaufen · 3,99 €"));
  await klickWarte(knopf("Vollversion kaufen"));
  t("Kauf: richtige Produkt-ID", ids[0] === "de.schule.waagemodell.vollversion");
  t("nach Kauf: Station 2 startbar", !!knopf("Los geht"));
  klick(knopf("Los geht"));
  t("nach Kauf: Station 2 läuft", !!feld("x"));
  delete window.__waageStore;
  window.localStorage.removeItem(SCHLUESSEL);
  window.localStorage.removeItem("waagemodell-voll");
  t("keine Konsolenfehler " + JSON.stringify(fehler.slice(0, 2)), fehler.length === 0);
  act(() => root.unmount());
}
