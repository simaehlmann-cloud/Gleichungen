/* Startseite und Voreinstellungen beim ersten Start (ohne gespeicherte Einstellungen) */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { makeDom, tools } from "./harness.mjs";
import * as AppModul from "../src/WaagemodellApp.jsx";

export default function (t) {
  const { fehler } = makeDom("", { frisch: true });
  const root = createRoot(document.getElementById("root"));
  const { txt, knopf, klick, alle, selbst } = tools(act);
  act(() => root.render(React.createElement(AppModul.default)));

  t("Startseite: Gleichungen", !!document.querySelector("#t-gl"));
  t("Startseite: Gleichungssysteme", !!document.querySelector("#t-lgs"));
  t("Startseite: Einstellungen und Über", !!knopf("Einstellungen") && !!knopf("Über die App"));
  t("Startseite: Datenschutz & Impressum", !!knopf("Datenschutz & Impressum"));
  t("Startseite: kein Eingabefeld, keine Auswahllisten", !document.querySelector("input") && !document.querySelector("select"));
  t("Startseite: kein Weiterarbeiten ohne Stand", !knopf("Weiterarbeiten"));
  t("Startseite: Begrüßungswaage im Comic-Stil", document.querySelector("[data-waage]").getAttribute("data-waage") === "comic");

  klick(knopf("Über die App"));
  t("Über die App öffnet sich", txt().includes("sammelt keine Daten"));
  t("Über die App erklärt die Verfahren", txt().includes("Einsetzungsverfahren") && txt().includes("Additionsverfahren"));
  klick(knopf("schließen"));
  t("Über die App schließt sich", !txt().includes("Einsetzungsverfahren"));

  klick(knopf("Datenschutz & Impressum"));
  const rahmen = () => document.querySelector("iframe");
  t("Datenschutzerklärung eingebettet", !!rahmen() && rahmen().getAttribute("src") === "./datenschutz.html");
  klick(knopf("Impressum"));
  t("Impressum eingebettet", rahmen().getAttribute("src") === "./impressum.html");
  klick(knopf("schließen"));
  t("Rechtliches schließt sich", !rahmen());

  klick(document.querySelector("#t-gl"));
  t("Block Gleichungen führt zur Arbeitsfläche", !!knopf("Start") && !!knopf("− Kugel"));
  t("Comic ist die Standardwaage", document.querySelector("[data-waage]").getAttribute("data-waage") === "comic");
  t("Rechenweg ist zuerst ausgeblendet", !txt().includes("Symbolische Ebene"));
  const reihenfolge = [...document.querySelectorAll("[data-waage], [data-drop='tray']")].map((e) => e.getAttribute("data-drop") || "waage");
  t("Kiste liegt unter der Waage", reihenfolge.join(",") === "waage,tray");
  t("Kiste ist beschriftet", document.querySelector("[data-drop='tray']").textContent.includes("Kiste"));

  klick(knopf("Einstellungen"));
  klick(knopf("Rechenweg rechts"));
  t("Rechenweg lässt sich einblenden", txt().includes("Symbolische Ebene"));
  t("Einstellung wird gemerkt", window.localStorage.getItem("waagemodell-rechts") === "1");
  klick(knopf("Rechenweg rechts"));
  t("und wieder ausblenden", !txt().includes("Symbolische Ebene"));

  klick(knopf("Lösung zeigen") || alle("zeigen")[0]);
  t("Lösung erscheint auch ohne rechte Spalte", txt().includes("Lösung:"));

  klick(knopf("Start"));
  t("zurück auf der Startseite", !!document.querySelector("#t-gl"));
  t("jetzt mit Weiterarbeiten", !!knopf("Weiterarbeiten"));
  klick(knopf("Weiterarbeiten"));
  t("Weiterarbeiten behält die Aufgabe", !!knopf("− Kugel"));

  klick(knopf("Start"));
  selbst(true);
  t("Gleichungssystem selbst aufbauen: zwei Waagen", document.querySelectorAll("[data-waage]").length === 2);
  t("keine Konsolenfehler " + JSON.stringify(fehler.slice(0, 1)), fehler.length === 0);
}
