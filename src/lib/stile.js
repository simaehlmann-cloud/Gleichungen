/* Darstellungsstile der Waage. Alle Stile zeigen dasselbe Modell; sie
   unterscheiden sich nur in Geometrie, Farben und im Ausschwingen.

   Geometrie in Einheiten der 400er-Box (wird mit z skaliert):
   - pivotY  Höhe des Drehpunkts
   - hang    Abstand Balkenende → Schalenrand (0 = Schale sitzt auf dem Balken)
   - hoehe   Gesamthöhe der Box
   - feder   [Steifigkeit, Dämpfung] des Ausschwingens */
const STILE = {
  klassisch: {
    name: "Klassisch", pivotY: 232, hang: -7, arm: 132, hoehe: 318,
    feder: [150, 16],
    text: "#22312B", text2: "#5A6B62", ok: "#3E7A56", neg: "#B0453A", akzent: "#7A5B22",
  },
  comic: {
    name: "Comic", pivotY: 62, hang: 148, arm: 114, hoehe: 352,
    feder: [220, 9],
    text: "#1B1B1B", text2: "#4A3F2A", ok: "#1E7A44", neg: "#C0392B", akzent: "#1B1B1B",
    schrift: '"Chalkboard SE", "Comic Sans MS", "Marker Felt", system-ui, sans-serif',
  },
  real: {
    name: "Realistisch", pivotY: 58, hang: 148, arm: 116, hoehe: 352,
    feder: [36, 2.8],
    text: "#EDEFE8", text2: "#C8CDD2", ok: "#B9E0C4", neg: "#F0A091", akzent: "#E9CF8A",
  },
};
const STIL_KEYS = Object.keys(STILE);
const stilOf = (k) => STILE[k] || STILE.comic;

const STIL_SPEICHER = "waagemodell-stil";
function stilLaden() {
  try {
    const v = typeof window !== "undefined" && window.localStorage ? window.localStorage.getItem(STIL_SPEICHER) : null;
    return STILE[v] ? v : "comic";
  } catch (e) { return "comic"; }
}
function stilSpeichern(k) {
  try { if (typeof window !== "undefined" && window.localStorage) window.localStorage.setItem(STIL_SPEICHER, k); } catch (e) { /* privater Modus */ }
}

export { STILE, STIL_KEYS, stilOf, stilLaden, stilSpeichern };
