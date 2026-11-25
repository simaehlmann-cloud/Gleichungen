/* Lernstand der Lernpfade – nur auf diesem Gerät (localStorage), ohne Namen.
   Gespeichert wird je Station die Zahl richtig gelöster Aufgaben. */
import { PFADE, STATIONEN } from "./lernpfade.js";

const SCHLUESSEL = "waagemodell-lernpfade";

function laden() {
  try {
    const roh = JSON.parse(window.localStorage.getItem(SCHLUESSEL) || "null");
    if (!roh || roh.v !== 1 || typeof roh.s !== "object" || roh.s === null) return {};
    const aus = {};
    /* Nur bekannte Stationen und plausible Zahlen übernehmen */
    for (const [id, n] of Object.entries(roh.s)) {
      if (STATIONEN[id] && Number.isInteger(n) && n > 0) aus[id] = Math.min(n, 999);
    }
    return aus;
  } catch (e) { return {}; }
}

function speichern(stand) {
  try { window.localStorage.setItem(SCHLUESSEL, JSON.stringify({ v: 1, s: stand })); } catch (e) { /* privater Modus */ }
}

/* Gibt den neuen Stand zurück (unverändertes Objekt bleibt unberührt) */
function richtigGeloest(stand, id) {
  const neu = { ...stand, [id]: Math.min((stand[id] || 0) + 1, 999) };
  speichern(neu);
  return neu;
}

const geschafft = (stand, id) => (stand[id] || 0) >= STATIONEN[id].ziel;

/* Eine Station ist erreichbar, wenn alle davor im selben Pfad geschafft sind. */
function erreichbar(stand, id) {
  const st = STATIONEN[id];
  const pfad = PFADE.find((p) => p.id === st.pfad);
  return pfad.stationen.slice(0, st.index).every((s) => geschafft(stand, s.id));
}

function zuruecksetzen(pfadId) {
  const ids = new Set(PFADE.find((p) => p.id === pfadId).stationen.map((s) => s.id));
  const neu = Object.fromEntries(Object.entries(laden()).filter(([id]) => !ids.has(id)));
  speichern(neu);
  return neu;
}

export { laden, richtigGeloest, geschafft, erreichbar, zuruecksetzen, SCHLUESSEL };
