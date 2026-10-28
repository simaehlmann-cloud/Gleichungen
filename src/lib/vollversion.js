/* Vollversion als einmaliger In-App-Kauf (nur iOS-App).

   Kostenlos: alles, was Schülerinnen und Schüler zum Üben brauchen.
   Vollversion: was die Lehrkraft am eigenen Gerät nutzt (siehe FUNKTIONEN).

   Ohne Kauf-Plugin – im Browser, auf Android und in den Tests – ist alles frei.
   Der Kaufstatus wird nur zwischengespeichert, damit die App offline sofort richtig
   startet; maßgeblich ist immer die von Apple signierte Transaktion. */
import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";

const PRODUKT = "de.schule.waagemodell.vollversion";
const SPEICHER = "waagemodell-voll";

const FUNKTIONEN = {
  praesentation: "Präsentationsmodus",
  lgs: "Zwei Waagen (Gleichungssysteme)",
  lehrkraft: "Arbeitsblätter und Stolperstellen",
  kontext: "Sachkontexte Marktstand und Streichhölzer",
  stil: "Realistische Waage (Laborwaage mit Zeiger)",
};

/* Tests können ein Ersatz-Plugin über window.__waageStore setzen. */
let nativ = null;
function shop() {
  if (typeof window !== "undefined" && window.__waageStore) return window.__waageStore;
  try {
    if (Capacitor.getPlatform() !== "ios" || !Capacitor.isPluginAvailable("WaageStore")) return null;
    if (!nativ) nativ = registerPlugin("WaageStore");
    return nativ;
  } catch (e) { return null; }
}

const lesen = () => { try { return window.localStorage.getItem(SPEICHER) === "1"; } catch (e) { return false; } };
const merken = (v) => { try { window.localStorage.setItem(SPEICHER, v ? "1" : "0"); } catch (e) { /* privater Modus */ } };

function useVollversion() {
  const [s] = useState(shop);
  const [gekauft, setGekauft] = useState(() => (s ? lesen() : true));
  const [verfuegbar, setVerfuegbar] = useState(true);
  const [preis, setPreis] = useState("");
  const [beschaeftigt, setBeschaeftigt] = useState(false);
  const [hinweis, setHinweis] = useState(null);
  const lebt = useRef(true);
  useEffect(() => () => { lebt.current = false; }, []);

  const setzen = useCallback((v) => { if (!lebt.current) return; setGekauft(v); merken(v); }, []);

  const auffrischen = useCallback(async () => {
    if (!s) return;
    try {
      const r = await s.status({ id: PRODUKT });
      if (!lebt.current) return;
      if (r && r.available === false) { setVerfuegbar(false); setzen(true); return; }
      setzen(!!(r && r.owned));
    } catch (e) { /* offline o. Ä.: letzten bekannten Stand behalten */ }
    try {
      const p = await s.product({ id: PRODUKT });
      if (lebt.current && p && typeof p.price === "string") setPreis(p.price.trim().slice(0, 24));
    } catch (e) { /* Preis bleibt leer, die Taste zeigt dann keinen Betrag */ }
  }, [s, setzen]);

  useEffect(() => {
    if (!s) return undefined;
    auffrischen();
    let weg = null;
    if (typeof s.addListener === "function") {
      Promise.resolve(s.addListener("change", () => auffrischen())).then((h) => { weg = h; }).catch(() => {});
    }
    const sichtbar = () => { if (document.visibilityState === "visible") auffrischen(); };
    document.addEventListener("visibilitychange", sichtbar);
    return () => { document.removeEventListener("visibilitychange", sichtbar); if (weg && weg.remove) weg.remove(); };
  }, [s, auffrischen]);

  const kaufen = useCallback(async () => {
    if (!s || beschaeftigt) return;
    setBeschaeftigt(true); setHinweis(null);
    try {
      const r = await s.buy({ id: PRODUKT });
      const erg = r && r.result;
      if (erg === "purchased") { setzen(true); setHinweis({ t: "Danke! Die Vollversion ist freigeschaltet.", ok: true }); }
      else if (erg === "pending") setHinweis({ t: "Der Kauf wartet noch auf Bestätigung, etwa durch „Kaufen anfragen“ in der Familie. Die Vollversion schaltet sich dann von selbst frei.", ok: true });
      else setHinweis({ t: "Kauf abgebrochen. Es wurde nichts berechnet.", ok: true });
    } catch (e) {
      const text = String((e && e.message) || e);
      setHinweis(/product not found/i.test(text)
        ? { t: "Der App Store kennt die Vollversion noch nicht. Das Produkt ist in App Store Connect noch nicht vollständig eingerichtet oder noch nicht freigegeben – bitte später noch einmal versuchen.", ok: false, code: "kein-produkt" }
        : { t: `Der Kauf hat nicht geklappt: ${text}. Bitte später noch einmal versuchen.`, ok: false });
    } finally { if (lebt.current) setBeschaeftigt(false); }
  }, [s, beschaeftigt, setzen]);

  const wiederherstellen = useCallback(async () => {
    if (!s || beschaeftigt) return;
    setBeschaeftigt(true); setHinweis(null);
    try {
      const r = (await s.restore({ id: PRODUKT })) || {};
      setzen(!!r.owned);
      if (r.owned) setHinweis({ t: "Kauf wiederhergestellt. Die Vollversion ist freigeschaltet.", ok: true });
      else if (r.cancelled) setHinweis({ t: "Anmeldung abgebrochen.", ok: true });
      else if (r.error) setHinweis({ t: `Abgleich mit dem App Store nicht möglich: ${r.error}`, ok: false });
      else setHinweis({ t: "Für diese Apple-ID ist kein Kauf der Vollversion hinterlegt.", ok: false });
    } catch (e) {
      setHinweis({ t: `Abgleich mit dem App Store nicht möglich: ${String((e && e.message) || e)}`, ok: false });
    } finally { if (lebt.current) setBeschaeftigt(false); }
  }, [s, beschaeftigt, setzen]);

  return { voll: !s || gekauft, kaufbar: !!s && verfuegbar, preis, beschaeftigt, hinweis, kaufen, wiederherstellen };
}

export { useVollversion, FUNKTIONEN, PRODUKT };
