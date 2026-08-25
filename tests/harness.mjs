/* Minimaler Testrahmen: jsdom + React, ohne Testframework.
   Jede Testdatei exportiert eine Funktion, die `t` bekommt. */
import { JSDOM } from "jsdom";

export function makeDom(search = "") {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    pretendToBeVisual: true,
    url: "http://localhost/" + search,
  });
  const setze = (k, v) => {
    try { globalThis[k] = v; }
    catch { Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true }); }
  };
  setze("window", dom.window);
  for (const k of ["document", "navigator", "HTMLElement", "HTMLInputElement",
    "HTMLSelectElement", "MouseEvent", "KeyboardEvent", "PointerEvent", "Event"]) {
    setze(k, dom.window[k]);
  }
  // Ältere jsdom-Fassungen kennen PointerEvent nicht – dann genügt ein Ersatz auf MouseEvent-Basis.
  if (typeof dom.window.PointerEvent !== "function") {
    class PointerEventErsatz extends dom.window.MouseEvent {
      constructor(typ, init = {}) { super(typ, init); this.pointerId = init.pointerId || 1; this.pointerType = init.pointerType || "mouse"; }
    }
    dom.window.PointerEvent = PointerEventErsatz;
    setze("PointerEvent", PointerEventErsatz);
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const fehler = [];
  console.error = (...a) => { const s = String(a[0]); if (!s.includes("ReactDOMTestUtils")) fehler.push(s.slice(0, 200)); };
  return { dom, fehler };
}

export function tools(act) {
  const txt = () => document.body.textContent;
  const alle = (t) => [...document.querySelectorAll("button")].filter((b) => b.textContent.trim().startsWith(t));
  const knopf = (t) => alle(t)[0];
  const klick = (b) => act(() => b.dispatchEvent(new window.MouseEvent("click", { bubbles: true })));
  /* Eingabe simulieren. jsdom stellt synthetische input-Ereignisse nicht für jedes
     Feld zu, deshalb wird zusätzlich der React-Handler direkt aufgerufen – es ist
     derselbe Handler, den der Browser bei echter Eingabe auslöst. */
  const tippe = (el, v) => act(() => {
    const proto = el.tagName === "SELECT" ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
    el.dispatchEvent(new window.Event("input", { bubbles: true }));
    const schluessel = Object.keys(el).find((k) => k.startsWith("__reactProps"));
    const props = schluessel ? el[schluessel] : null;
    if (props && props.onChange && props.value !== v) props.onChange({ target: { value: v } });
  });
  const taste = (el, k) => act(() => el.dispatchEvent(new window.KeyboardEvent("keydown", { key: k, bubbles: true })));
  const ziehe = (kind, ziel) => {
    const src = document.querySelector(`[data-drop="tray"] [data-piece="${kind}"]`);
    act(() => src.dispatchEvent(new window.PointerEvent("pointerdown", { bubbles: true, clientX: 5, clientY: 5 })));
    document.elementFromPoint = () => document.querySelector(`[data-drop="${ziel}"]`);
    act(() => window.dispatchEvent(new window.PointerEvent("pointermove", { bubbles: true, clientX: 300, clientY: 200 })));
    act(() => window.dispatchEvent(new window.PointerEvent("pointerup", { bubbles: true, clientX: 300, clientY: 200 })));
  };
  const eingabefeld = () => [...document.querySelectorAll("input")].find((i) => (i.value || "").includes("="));
  return { txt, alle, knopf, klick, tippe, taste, ziehe, eingabefeld };
}
