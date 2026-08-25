/* Kernablauf: Gleichung bauen, umformen, teilen, zurücknehmen */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { makeDom, tools } from "./harness.mjs";
import * as AppModul from "../src/WaagemodellApp.jsx";

export default function (t) {
  const { fehler } = makeDom();
  const App = AppModul.default;
  const root = createRoot(document.getElementById("root"));
  const { txt, knopf, klick, tippe, eingabefeld } = tools(act);
  act(() => root.render(React.createElement(App)));

  t("Start: leere Waage im Gleichgewicht", txt().includes("leer") && txt().includes("im Gleichgewicht"));
  tippe(eingabefeld(), "3x + 2 = x + 8");
  klick(knopf("Waage bauen"));
  t("Eingabe erzeugt Blöcke", document.querySelectorAll('[data-drop="pan:1:L"] [data-piece="x"]').length === 3);
  t("Eingabe erzeugt Kugeln", document.querySelectorAll('[data-drop="pan:1:R"] [data-piece="k"]').length === 8);
  const winkel = () => {
    const b = [...document.querySelectorAll("div")].map((d) => d.getAttribute("style") || "")
      .filter((s) => s.includes("rotate(") && s.includes("linear-gradient(180deg"))[0] || "";
    const m = /rotate\(([-\d.]+)deg\)/.exec(b);
    return m ? parseFloat(m[1]) : null;
  };
  t("gültige Gleichung steht waagerecht", winkel() === 0);
  klick(knopf("− Kugel"));
  t("beidseitig Kugel weg", txt().includes("3x + 1 = x + 7"));
  klick(knopf("− x-Block"));
  klick(knopf("− Kugel"));
  t("zu 2x = 6 umgeformt", txt().includes("2x = 6"));
  t("weiter waagerecht", winkel() === 0);
  tippe(document.querySelector("input[type=number]"), "2");
  klick(knopf("in 2 Haufen teilen"));
  t("Teilen zeigt Haufen", txt().includes("Haufen weg"));
  klick(knopf("Haufen wegnehmen"));
  t("Ergebnis x = 3", txt().includes("x = 3"));
  klick(knopf("zurück"));
  t("Undo führt zurück", txt().includes("2x = 6"));
  t("keine Konsolenfehler", fehler.length === 0);
}
