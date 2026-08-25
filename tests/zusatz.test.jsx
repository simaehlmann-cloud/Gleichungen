/* Wiederholen, Tastenkürzel, Ansagen, Kalkül-Kennzeichnung, Arbeitsblatt */
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
  const pfeil = (k) => act(() => window.dispatchEvent(new window.KeyboardEvent("keydown", { key: k, bubbles: true })));

  tippe(eingabefeld(), "3x + 2 = x + 8");
  klick(knopf("Waage bauen"));
  klick(knopf("− Kugel"));
  t("Umformung angewandt", txt().includes("3x + 1 = x + 7"));
  klick(knopf("zurück"));
  t("zurückgenommen", txt().includes("3x + 2 = x + 8") && !txt().includes("3x + 1 = x + 7"));
  klick(knopf("vor"));
  t("wiederhergestellt", txt().includes("3x + 1 = x + 7"));
  klick(knopf("Präsentation"));
  pfeil("ArrowLeft");
  t("Pfeil links nimmt zurück", !txt().includes("3x + 1 = x + 7"));
  pfeil("ArrowRight");
  t("Pfeil rechts stellt wieder her", txt().includes("3x + 1 = x + 7"));
  klick(knopf("Präsentation beenden"));
  klick(knopf("− Kugel"));
  klick(knopf("vor"));
  t("neue Umformung verwirft die Vorwärtsliste", txt().includes("3x = x + 6"));

  t("Rückmeldungen werden angesagt", !!document.querySelector('[role="status"][aria-live="polite"]'));

  // Kalkülmodus sichtbar machen
  tippe(document.querySelector("input[type=number]"), "4");
  klick(knopf("in 4 Haufen teilen"));
  klick(knopf("ohne Waage weiterrechnen"));
  t("Waage trägt das Kalkül-Kennzeichen", txt().includes("Kalkül"));
  klick(knopf("in 4 Haufen teilen"));
  t("Protokoll kennzeichnet den Schritt", txt().includes("(ohne Waage)"));

  // Antikugeln für y
  klick(knopf("y-Blöcke"));
  klick(knopf("Antikugeln"));
  t("Antiteil auch für y", document.querySelectorAll('[data-drop="tray"] [data-piece="y"]').length === 2);
  t("keine Konsolenfehler", fehler.length === 0);
}
