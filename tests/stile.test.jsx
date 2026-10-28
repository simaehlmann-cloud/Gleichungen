/* Waagen-Stile, Menübereiche, einseitige Züge mit Ungleichung, automatisch beidseitig */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { makeDom, tools } from "./harness.mjs";
import * as AppModul from "../src/WaagemodellApp.jsx";

export default function (t) {
  const { fehler } = makeDom();
  let root = createRoot(document.getElementById("root"));
  const { txt, knopf, klick, tippe, eingabefeld } = tools(act);
  act(() => root.render(React.createElement(AppModul.default)));

  t("Eingabe steht auf der Startseite", !!eingabefeld());
  tippe(eingabefeld(), "3x + 2 = x + 8");
  klick(knopf("Waage bauen"));
  t("nach dem Bauen geht es zur Arbeitsfläche", !eingabefeld() && !!knopf("Start"));
  t("Umformungsleiste sichtbar", !!knopf("− Kugel"));
  t("Stil aus dem Speicher (Testrahmen: klassisch)", document.querySelector("[data-waage]").getAttribute("data-waage") === "klassisch");

  klick(knopf("Einstellungen"));
  for (const [name, key] of [["Comic", "comic"], ["Realistisch", "real"]]) {
    klick(knopf(name));
    const w = document.querySelector("[data-waage]");
    t(`${name}: Stil gewechselt`, w.getAttribute("data-waage") === key);
    t(`${name}: Steine liegen weiter auf der Schale`, document.querySelectorAll('[data-drop="pan:1:L"] [data-piece="x"]').length === 3);
    t(`${name}: Gestell gezeichnet`, !!w.querySelector("svg"));
    t(`${name}: waagerecht`, w.getAttribute("data-winkel") === "0");
  }
  t("Stil wird gemerkt", window.localStorage.getItem("waagemodell-stil") === "real");

  // Standard: ein Zug wirkt nur auf eine Seite, es entsteht eine Ungleichung
  const enter = (el) => act(() => el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  enter(document.querySelector('[data-drop="pan:1:R"] [data-piece="k"]'));
  t("einseitig: rechts leichter, Ungleichung", txt().includes("3x + 2 > x + 7") && txt().includes("nur rechts verändert"));
  t("einseitig: Waage kippt", document.querySelector("[data-winkel]").getAttribute("data-winkel") !== "0");
  t("einseitig: Relation an der Waage", document.querySelector("[data-relation]").getAttribute("data-relation") === ">");
  t("einseitig: Umformungsleiste wartet", (() => { klick(knopf("− Kugel")); return txt().includes("Erst die Waage wieder ins Gleichgewicht") && !txt().includes("3x + 1 = x + 6"); })());
  enter(document.querySelector('[data-drop="pan:1:L"] [data-piece="k"]'));
  t("ausgeglichen: eine Äquivalenzumformung im Protokoll", txt().includes("3x + 1 = x + 7") && txt().includes("| − 1") && !document.querySelector("[data-ungleichung]"));
  t("ausgeglichen: wieder waagerecht", document.querySelector("[data-winkel]").getAttribute("data-winkel") === "0");
  // Verschiedenes auf beiden Seiten: waagerecht, aber keine Äquivalenzumformung
  enter(document.querySelector('[data-drop="pan:1:L"] [data-piece="x"]'));
  for (let i = 0; i < 3; i++) enter(document.querySelector('[data-drop="pan:1:R"] [data-piece="k"]'));
  t("ungleich verändert: erkannt", txt().includes("ungleich verändert") && txt().includes("keine Äquivalenzumformung"));
  for (let i = 0; i < 4; i++) klick(knopf("zurück"));
  t("zurück stellt den Stand her", txt().includes("3x + 1 = x + 7") && !document.querySelector("[data-ungleichung]"));
  // Automatisch beidseitig (Einstellung)
  klick(knopf("Automatisch beidseitig"));
  enter(document.querySelector('[data-drop="pan:1:R"] [data-piece="k"]'));
  t("automatisch beidseitig: beide Seiten", txt().includes("3x = x + 6"));
  klick(knopf("Automatisch beidseitig"));

  // Phasenschalter
  klick(knopf("1 · Aufbauen"));
  t("Phasenschalter führt in den Aufbau", txt().includes("Umformen starten") && !knopf("− Kugel"));
  klick(knopf("2 · Umformen"));
  t("und zurück ins Umformen", !!knopf("− Kugel"));

  // Neustart: Stil bleibt
  act(() => root.unmount());
  document.getElementById("root").innerHTML = "";
  root = createRoot(document.getElementById("root"));
  act(() => root.render(React.createElement(AppModul.default)));
  t("Stil überlebt den Neustart", document.querySelector("[data-waage]").getAttribute("data-waage") === "real");
  t("keine Konsolenfehler", fehler.length === 0);
}
