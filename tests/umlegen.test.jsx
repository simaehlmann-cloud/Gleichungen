/* Aufbauphase: Teile zwischen den Schalen umlegen */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { makeDom, tools } from "./harness.mjs";
import * as AppModul from "../src/WaagemodellApp.jsx";
export default function (t) {
  makeDom();
  const root = createRoot(document.getElementById("root"));
  const { txt, ziehe } = tools(act);
  act(() => root.render(React.createElement(AppModul.default)));
  ziehe("x", "pan:1:L"); ziehe("k", "pan:1:L"); ziehe("k", "pan:1:L");
  t("Ausgangslage steht", txt().includes("x + 2 = 0"));
  // Teil von links nach rechts schieben (im Aufbau erlaubt)
  const stein = document.querySelector('[data-drop="pan:1:L"] [data-piece="k"]');
  act(() => stein.dispatchEvent(new window.PointerEvent("pointerdown", { bubbles: true, clientX: 5, clientY: 5 })));
  document.elementFromPoint = () => document.querySelector('[data-drop="pan:1:R"]');
  act(() => window.dispatchEvent(new window.PointerEvent("pointermove", { bubbles: true, clientX: 300, clientY: 200 })));
  act(() => window.dispatchEvent(new window.PointerEvent("pointerup", { bubbles: true, clientX: 300, clientY: 200 })));
  const links = document.querySelectorAll('[data-drop="pan:1:L"] [data-piece="k"]').length;
  const rechts = document.querySelectorAll('[data-drop="pan:1:R"] [data-piece="k"]').length;
  t("Umlegen verschiebt statt zu verdoppeln", links === 1 && rechts === 1);
  t("Gleichung passt zum Umlegen", txt().includes("x + 1 = 1"));
  t("Hinweis erklärt die Grenze", txt().includes("Im Aufbau darfst du Teile umlegen"));
}
