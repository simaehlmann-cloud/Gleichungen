/* Vollversion: Sperren ohne Kauf, Kauf, Wiederherstellen, Web ohne Sperren */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { makeDom, tools } from "./harness.mjs";
import * as AppModul from "../src/WaagemodellApp.jsx";

const warte = () => act(() => new Promise((r) => setTimeout(r, 0)));
/* Klick, dessen Folgen erst nach einem Promise eintreffen (Kauf, Abgleich) */
const klickWarte = (b) => act(async () => {
  b.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));
});

export default async function (t) {
  /* Frühere Testdateien lassen Animations-Timer der App zurück (Node-Timer, nicht
     an ein Fenster gebunden). Diese Datei wartet als einzige echte Zeit ab; damit
     deren späte Updates nicht hier als Konsolenfehler zählen, erst auslaufen lassen. */
  await new Promise((r) => setTimeout(r, 800));
  const { fehler } = makeDom();
  const { txt, knopf, klick, tippe, eingabefeld } = tools(act);
  const aufrufe = [];
  let besitz = false;
  window.__waageStore = {
    status: async () => { aufrufe.push("status"); return { available: true, owned: besitz }; },
    product: async () => ({ id: "x", price: "4,99 €" }),
    buy: async ({ id }) => { aufrufe.push("buy:" + id); besitz = true; return { result: "purchased" }; },
    restore: async () => { aufrufe.push("restore"); return { owned: besitz, error: "", cancelled: false }; },
    addListener: async () => ({ remove() {} }),
  };
  let root = createRoot(document.getElementById("root"));
  act(() => root.render(React.createElement(AppModul.default)));
  await warte();

  t("Status wird beim Start abgefragt", aufrufe.includes("status"));
  tippe(eingabefeld(), "3x + 2 = x + 8");
  klick(knopf("Waage bauen"));
  t("kostenlos: Umformen geht", !!knopf("− Kugel"));
  klick(knopf("− Kugel"));
  t("kostenlos: Umformung wirkt", txt().includes("3x + 1 = x + 7"));

  klick(knopf("Präsentation"));
  t("Präsentation gesperrt", !knopf("Präsentation beenden") && txt().includes("Präsentationsmodus gehört zur Vollversion"));
  t("Preis wird angezeigt", !!knopf("Vollversion kaufen · 4,99 €"));
  t("Wiederherstellen ist da", !!knopf("Kauf wiederherstellen"));

  klick(knopf("Einstellungen"));
  klick(knopf("Comic"));
  t("Comic ist frei", document.querySelector("[data-waage]").getAttribute("data-waage") === "comic");
  klick(knopf("Realistisch"));
  t("realistische Waage gesperrt", document.querySelector("[data-waage]").getAttribute("data-waage") === "comic" && txt().includes("Realistische Waage (Laborwaage mit Zeiger) gehört zur Vollversion"));
  klick(knopf("Aufgabe"));
  klick(knopf("Zwei Waagen"));
  t("Zwei Waagen gesperrt", txt().includes("Zwei Waagen (Gleichungssysteme) gehört zur Vollversion") && document.querySelectorAll("[data-waage]").length === 1);

  await klickWarte(knopf("Kauf wiederherstellen"));
  t("Wiederherstellen ohne Kauf meldet das", txt().includes("kein Kauf der Vollversion hinterlegt"));

  await klickWarte(knopf("Vollversion kaufen"));
  t("Kauf mit der richtigen Produkt-ID", aufrufe.includes("buy:de.schule.waagemodell.vollversion"));
  t("nach dem Kauf freigeschaltet", txt().includes("Danke! Die Vollversion ist freigeschaltet."));
  klick(knopf("Präsentation"));
  t("Präsentation geht jetzt", !!knopf("Präsentation beenden"));
  klick(knopf("Präsentation beenden"));
  t("Kaufstatus gemerkt", window.localStorage.getItem("waagemodell-voll") === "1");

  // Neustart offline: der gemerkte Stand gilt sofort
  act(() => root.unmount());
  document.getElementById("root").innerHTML = "";
  window.__waageStore.status = async () => { throw new Error("offline"); };
  root = createRoot(document.getElementById("root"));
  act(() => root.render(React.createElement(AppModul.default)));
  await warte();
  klick(knopf("Präsentation"));
  t("offline bleibt die Vollversion", !!knopf("Präsentation beenden"));
  klick(knopf("Präsentation beenden"));

  // Erstattung: Status meldet nicht mehr gekauft
  act(() => root.unmount());
  document.getElementById("root").innerHTML = "";
  window.__waageStore.status = async () => ({ available: true, owned: false });
  root = createRoot(document.getElementById("root"));
  act(() => root.render(React.createElement(AppModul.default)));
  await warte();
  klick(knopf("Präsentation"));
  t("nach Erstattung wieder gesperrt", !knopf("Präsentation beenden"));

  // Ohne Kauf-Plugin (Web, Android): alles frei, kein Kaufbereich
  act(() => root.unmount());
  document.getElementById("root").innerHTML = "";
  delete window.__waageStore;
  root = createRoot(document.getElementById("root"));
  act(() => root.render(React.createElement(AppModul.default)));
  await warte();
  klick(knopf("Präsentation"));
  t("Web: Präsentation frei", !!knopf("Präsentation beenden"));
  klick(knopf("Präsentation beenden"));
  klick(knopf("Einstellungen"));
  t("Web: kein Kaufbereich", !txt().includes("Vollversion"));
  t("keine Konsolenfehler " + JSON.stringify(fehler.slice(0, 2)), fehler.length === 0);
}
