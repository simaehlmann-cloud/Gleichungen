/* Aufbauphase, Tastatur, Zielvorgabe, Bündel, Schrittleiste */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { makeDom, tools } from "./harness.mjs";
import * as AppModul from "../src/WaagemodellApp.jsx";

export default function (t) {
  const { fehler } = makeDom();
  const App = AppModul.default;
  const root = createRoot(document.getElementById("root"));
  const { txt, knopf, klick, tippe, taste, ziehe, eingabefeld } = tools(act);
  act(() => root.render(React.createElement(App)));

  // Aufbau per Ziehen
  ziehe("x", "pan:1:L"); ziehe("x", "pan:1:L");
  for (let i = 0; i < 6; i++) ziehe("k", "pan:1:R");
  t("einseitiges Auflegen im Aufbau", txt().includes("2x = 6"));
  t("Aufbau nennt den passenden Wert", txt().includes("im Gleichgewicht, wenn x = 3"));

  // Zielvorgabe
  const zielFeld = [...document.querySelectorAll("input")].find((i) => i.placeholder === "z. B. 3");
  tippe(zielFeld, "3");
  t("Ziel erreicht", txt().includes("die Waage passt zum Ziel"));
  tippe(zielFeld, "5");
  t("Abweichung gemeldet", txt().includes("noch nicht"));

  // Tastatur
  const kiste = document.querySelector('[data-drop="tray"] [data-piece="k"]');
  t("Spielstein hat aria-label", !!kiste.getAttribute("aria-label"));
  taste(kiste, "Enter");
  t("Enter legt auf die Zielschale", txt().includes("2x + 1 = 6"));
  taste(document.querySelector('[data-drop="pan:1:L"] [data-piece="k"]'), " ");
  t("Leertaste nimmt weg", txt().includes("2x = 6"));

  klick(knopf("Umformen starten"));
  klick(knopf("Lösung anzeigen"));
  t("Umformphase erreicht", txt().includes("Lösung: x = 3"));

  // Schrittleiste
  klick(knopf("+ Kugel"));
  t("Schrittleiste vorhanden", txt().includes("Schritte — Waage (I)"));
  const schritt1 = [...document.querySelectorAll("button")].find((b) => b.title === "zurück zu Schritt 1");
  klick(schritt1);
  t("Sprung zu Schritt 1", txt().includes("2x = 6") && txt().includes("Zurück zu Schritt 1"));

  // Zehnerbündel
  tippe(eingabefeld(), "x + 22 = 25");
  klick(knopf("Waage bauen"));
  t("Bündel statt Einzelteile", document.querySelectorAll('[data-bundle="10"]').length === 4);
  const buendel = document.querySelector('[data-bundle="10"]');
  taste(buendel, "Enter");
  t("Bündel nimmt zehn weg", txt().includes("x + 12 = 15"));
  t("keine Konsolenfehler", fehler.length === 0);
}
