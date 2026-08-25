/* Gleichungssysteme, Sachsituation, Kalkülmodus, Rückmeldungen */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { makeDom, tools } from "./harness.mjs";
import * as AppModul from "../src/WaagemodellApp.jsx";

export default function (t) {
  const { fehler } = makeDom();
  const root = createRoot(document.getElementById("root"));
  const { txt, knopf, klick, tippe } = tools(act);
  act(() => root.render(React.createElement(AppModul.default)));

  klick(knopf("Zwei Waagen"));
  const felder = [...document.querySelectorAll("input")].filter((i) => (i.value || "").includes("="));
  tippe(felder[0], "x = y + 2");
  tippe(felder[1], "x + y = 10");
  klick(knopf("Waage bauen"));
  t("beide Waagen gebaut", txt().includes("x = y + 2") && txt().includes("x + y = 10"));
  klick(knopf("(I) in (II) einsetzen"));
  t("Einsetzungsverfahren", txt().includes("2y + 2 = 10"));
  klick(knopf("Lösung anzeigen"));
  t("Lösung des Systems", txt().includes("x = 6") && txt().includes("y = 4"));
  klick(knopf("gleichsetzen"));
  t("Gleichsetzen wird begründet abgelehnt", txt().includes("Was müsste auf beiden Waagen allein liegen"));

  // Kalkülmodus
  klick(knopf("Eine Waage"));
  const feld = [...document.querySelectorAll("input")].find((i) => (i.value || "").includes("="));
  tippe(feld, "2x + 3 = 11");
  klick(knopf("Waage bauen"));
  tippe(document.querySelector("input[type=number]"), "4");
  klick(knopf("in 4 Haufen teilen"));
  t("nicht aufgehende Teilung wird erklärt", txt().includes("Lässt sich jede Schale in 4"));
  t("Ausweg wird angeboten", !!knopf("ohne Waage weiterrechnen"));
  klick(knopf("ohne Waage weiterrechnen"));
  klick(knopf("in 4 Haufen teilen"));
  t("Kalkülmodus rechnet weiter", txt().includes("Ohne Waage gerechnet"));

  // Sachsituation
  const auswahl = [...document.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.textContent === "Marktstand"));
  tippe(auswahl, "markt");
  t("Sachsituation erscheint", txt().includes("Sachsituation") && txt().includes("Mehlsäcke"));
  t("keine Konsolenfehler", fehler.length === 0);
}
