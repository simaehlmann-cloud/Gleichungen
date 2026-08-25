/* Adresszeile: Zustand sichern, Aufgabe teilen, aus dem Link laden */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { makeDom, tools } from "./harness.mjs";
import * as AppModul from "../src/WaagemodellApp.jsx";

export default function (t) {
  {
    const { fehler } = makeDom();
    let root = createRoot(document.getElementById("root"));
    const { txt, knopf, klick, tippe, eingabefeld } = tools(act);
    act(() => root.render(React.createElement(AppModul.default)));
    tippe(eingabefeld(), "3x + 2 = x + 8");
    klick(knopf("Waage bauen"));
    klick(knopf("− Kugel"));
    klick(knopf("− x-Block"));
    t("Zwischenstand erreicht", txt().includes("2x + 1 = 7"));
    t("Zustand steht in der Adresszeile", window.location.search.includes("st="));

    act(() => root.unmount());
    document.getElementById("root").innerHTML = "";
    root = createRoot(document.getElementById("root"));
    act(() => root.render(React.createElement(AppModul.default)));
    t("Stand überlebt den Neustart", txt().includes("2x + 1 = 7"));
    t("Rechenweg bleibt erhalten", txt().includes("3x + 2 = x + 8") && txt().includes("3x + 1 = x + 7"));
    klick(knopf("Lösung anzeigen"));
    t("Aufgabe für die Lösung erhalten", txt().includes("Lösung: x = 3"));
    t("keine Konsolenfehler", fehler.length === 0);
  }
  {
    const { fehler } = makeDom("?eq=2x%20%2B%203%20%3D%2011&ctx=markt");
    const root = createRoot(document.getElementById("root"));
    const { txt, knopf, klick } = tools(act);
    act(() => root.render(React.createElement(AppModul.default)));
    t("Aufgabe aus dem Link geladen", txt().includes("Aufgabe aus dem Link geladen"));
    klick(knopf("Lösung anzeigen"));
    t("Gleichung übernommen", txt().includes("Lösung: ? = 4"));
    t("Kontext übernommen", txt().includes("Mehlsack"));
    t("Teile liegen auf der Schale", document.querySelectorAll('[data-drop="pan:1:L"] [data-piece="x"]').length === 2);
    t("keine Konsolenfehler beim Laden", fehler.length === 0);
  }
}
