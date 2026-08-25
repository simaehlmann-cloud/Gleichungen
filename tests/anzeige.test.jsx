/* Anzahl-Feld, verborgene Lösung, Ansichten im Präsentationsmodus */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { makeDom, tools } from "./harness.mjs";
import * as AppModul from "../src/WaagemodellApp.jsx";

export default function (t) {
  const { fehler } = makeDom();
  const root = createRoot(document.getElementById("root"));
  const { txt, knopf, klick, tippe, eingabefeld } = tools(act);
  act(() => root.render(React.createElement(AppModul.default)));

  tippe(eingabefeld(), "3x + 4 = x + 10");
  klick(knopf("Waage bauen"));

  // Anzahl-Feld
  const anzahl = () => document.querySelector("input[type=number]");
  tippe(anzahl(), "");
  t("Anzahl lässt sich leeren", anzahl().value === "");
  tippe(anzahl(), "2");
  t("Anzahl lässt sich auf 2 setzen", anzahl().value === "2");
  t("Knopfbeschriftung folgt der Anzahl", !!knopf("in 2 Haufen teilen"));
  klick(knopf("− Kugel"));
  t("zwei Kugeln weggenommen", txt().includes("3x + 2 = x + 8"));
  act(() => anzahl().dispatchEvent(new window.Event("blur", { bubbles: true })));
  t("nach dem Verlassen steht wieder eine Zahl", anzahl().value !== "");

  // Lösung
  t("Lösung ist zunächst verborgen", !txt().includes("Lösung: x =") && !!knopf("Lösung anzeigen"));
  t("Probe bleibt verborgen", !txt().includes("Probe 3x"));
  klick(knopf("Lösung anzeigen"));
  t("Lösung auf Wunsch sichtbar", txt().includes("Lösung: x = 3"));
  klick(knopf("verbergen"));
  t("Lösung wieder verborgen", !txt().includes("Lösung: x = 3"));
  const feld = [...document.querySelectorAll("input")].find((i) => i.value === "" && (i.getAttribute("style") || "").includes("width: 60px"));
  tippe(feld, "3");
  klick(knopf("prüfen"));
  t("richtige Eingabe deckt die Lösung auf", txt().includes("Lösung: x = 3") && txt().includes("Richtig"));

  // Ansichten
  klick(knopf("Präsentation"));
  const protokollSpalte = () => [...document.querySelectorAll("div")].find((d) => (d.textContent || "").startsWith("SYMBOLISCHE") || (d.textContent || "").includes("Symbolische Ebene"));
  const waagenReihe = () => [...document.querySelectorAll("div")].find((d) => (d.getAttribute("style") || "").includes("gap: 8px") && d.querySelector("[data-drop^='pan']"));
  t("beides zeigt Waage und Protokoll", !!waagenReihe() && txt().includes("Symbolische Ebene"));
  klick(knopf("nur Waage"));
  t("nur Waage blendet das Protokoll aus", !!waagenReihe() && !txt().includes("Symbolische Ebene"));
  klick(knopf("nur Umformungen"));
  const reihe = waagenReihe();
  t("nur Umformungen blendet die Waage aus", (!reihe || (reihe.getAttribute("style") || "").includes("display: none")) && txt().includes("Symbolische Ebene"));
  t("Umformknöpfe bleiben erreichbar", !!knopf("− Kugel"));
  klick(knopf("beides"));
  t("zurück auf beides", !!waagenReihe() && txt().includes("Symbolische Ebene"));
  t("keine Konsolenfehler", fehler.length === 0);
}
