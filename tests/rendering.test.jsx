/* Wacht darüber, dass keine JSX-Klammern als Text im Dokument landen. */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { makeDom } from "./harness.mjs";
import * as AppModul from "../src/WaagemodellApp.jsx";
export default function (t) {
  makeDom();
  const root = createRoot(document.getElementById("root"));
  act(() => root.render(React.createElement(AppModul.default)));
  const treffer = [];
  const lauf = (n) => {
    if (n.nodeType === 3) { const v = n.nodeValue.trim(); if (v === "}" || v === "{") treffer.push((n.parentElement.getAttribute("style") || "").slice(0, 90)); }
    else if (n.tagName !== "STYLE") n.childNodes.forEach(lauf);
  };
  lauf(document.body);
  t("keine losen Klammern im gerenderten Text " + JSON.stringify(treffer), treffer.length === 0);
}
