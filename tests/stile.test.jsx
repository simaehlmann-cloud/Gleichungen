/* Waagen-Stile, Menübereiche, einseitige Züge als Einstellung */
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

  t("Aufgabenbereich ist beim Start offen", !!eingabefeld());
  tippe(eingabefeld(), "3x + 2 = x + 8");
  klick(knopf("Waage bauen"));
  t("nach dem Bauen schließt der Aufgabenbereich", !eingabefeld());
  t("Umformungsleiste sichtbar", !!knopf("− Kugel"));
  t("Standardstil ist klassisch", document.querySelector("[data-waage]").getAttribute("data-waage") === "klassisch");

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

  // Einseitige Züge sind eine bewusste Einstellung
  klick(knopf("Einseitige Züge"));
  const stein = document.querySelector('[data-drop="pan:1:R"] [data-piece="k"]');
  act(() => stein.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  t("einseitig: nur rechts verändert", txt().includes("3x + 2 = x + 7") && txt().includes("nur rechts verändert"));
  t("einseitig: Waage kippt", document.querySelector("[data-winkel]").getAttribute("data-winkel") !== "0");
  klick(knopf("zurück"));
  klick(knopf("Einseitige Züge"));
  const stein2 = document.querySelector('[data-drop="pan:1:R"] [data-piece="k"]');
  act(() => stein2.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  t("gekoppelt: beide Seiten", txt().includes("3x + 1 = x + 7"));

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
