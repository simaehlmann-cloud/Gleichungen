import { KIND, fZero, fVal, isInt } from "./fraction.js";

const MELDUNGEN = {
  "zu-viel": {
    frage: "Zähl auf beiden Schalen nach: Wo liegen weniger Teile? Mehr, als dort liegt, lässt sich nicht auf beiden Seiten zugleich wegnehmen. Was könntest du stattdessen tun?",
    direkt: "So viele Teile liegen nicht auf beiden Waagschalen. Nimm weniger – oder schalte die Antikugeln ein.",
  },
  "leer-seite": {
    frage: "Auf dieser Schale liegt nichts mehr davon. Was liegt denn noch da, das du wegnehmen könntest?",
    direkt: "Dort liegt nichts mehr, was du wegnehmen könntest.",
  },
  einseitig: {
    frage: "Schau auf den Balken: Was ist mit dem Gleichgewicht passiert? Und gilt die Gleichung von vorhin dann noch?",
    direkt: "Nur eine Seite verändert – die Waage kippt und es steht eine andere Gleichung da. Zum Umformen musst du beide Seiten gleich behandeln.",
  },
  hinueber: {
    frage: "Überleg kurz: Wird die linke Schale leichter, wenn das Teil nach rechts wandert? Und was passiert mit der rechten? Was müsstest du tun, damit beide gleich viel verlieren?",
    direkt: "Ein Teil auf die andere Waagschale zu legen verändert das Gleichgewicht. Nimm es stattdessen auf beiden Seiten weg.",
  },
  umtragen: {
    frage: "Die beiden Waagen wissen nichts voneinander. Woher könnte die eine erfahren, wie schwer ein Block der anderen ist?",
    direkt: "Teile lassen sich nicht von einer Waage zur anderen tragen. Dafür gibt es Einsetzen und Gleichsetzen.",
  },
  "teilt-nicht": {
    frage: (a) => `Probier es im Kopf: Lässt sich jede Schale in ${a.n} gleich große Haufen zerlegen? Welche Zahl ginge auf?`,
    direkt: (a) => `Die Waagschalen lassen sich nicht in ${a.n} gleich große Haufen zerlegen. Probiere einen anderen Teiler.`,
  },
  einsetzen: {
    frage: (a) => `Was verrät dir Waage (${a.label}) über einen einzelnen Block? Solange dort nicht genau ein Block allein liegt, weißt du es noch nicht.`,
    direkt: (a) => `Zum Einsetzen muss auf Waage (${a.label}) ein einzelner Block allein auf einer Waagschale liegen.`,
  },
  gleichsetzen: {
    frage: "Was müsste auf beiden Waagen allein liegen, damit du die anderen beiden Schalen gleichsetzen darfst?",
    direkt: "Zum Gleichsetzen muss auf beiden Waagen derselbe einzelne Block allein liegen.",
  },
  "loesung-falsch": {
    frage: "Setz deinen Wert einmal für die Blöcke ein: Wiegen beide Seiten dann gleich viel? Mit dem Regler kannst du es sehen.",
    direkt: "Das stimmt noch nicht. Stell die Blockgewichte mit dem Regler ein und schau, wann die Waage waagerecht steht.",
  },
  "nicht-darstellbar": {
    frage: "Kannst du weniger als keine Kugel auf eine Schale legen? Oder eine halbe? Ich kann die Gleichung mit erlaubten Umformungen so verändern, dass sie auf die Waage passt.",
    direkt: "So lässt sich das noch nicht auflegen – es kämen negative Anzahlen oder Bruchteile vor. Ich kann es mit erlaubten Umformungen passend machen.",
  },
};

/* ================= Sachkontexte ================= */
const CONTEXTS = {
  algebra: {
    name: "Algebra", sym: { x: "x", y: "y" }, unit: "Kugel", xName: "x-Block", yName: "y-Block",
    story: "Eine Kugel wiegt 1. Wie schwer ist ein Block?",
    verb: "wiegen so viel wie", frage: "Wie schwer ist ein x-Block?",
    nomen: {
      k: { ein: "eine", sg: "Kugel", pl: "Kugeln" },
      x: { ein: "ein", sg: "x-Block", pl: "x-Blöcke" },
      y: { ein: "ein", sg: "y-Block", pl: "y-Blöcke" },
    },
  },
  markt: {
    name: "Marktstand", sym: { x: "?", y: "◇" }, unit: "Kilogewicht", xName: "Mehlsack", yName: "Zuckersack",
    story: "Jedes Gewicht wiegt 1 kg, jeder Sack gleich viel. Wie schwer ist ein Sack?",
    verb: "wiegen so viel wie", frage: "Wie schwer ist ein Mehlsack?",
    nomen: {
      k: { ein: "ein", sg: "Kilogewicht", pl: "Kilogewichte" },
      x: { ein: "ein", sg: "Mehlsack", pl: "Mehlsäcke" },
      y: { ein: "ein", sg: "Zuckersack", pl: "Zuckersäcke" },
    },
  },
  schachtel: {
    name: "Streichhölzer", sym: { x: "?", y: "◇" }, unit: "Streichholz", xName: "Schachtel", yName: "Röhrchen",
    story: "In jeder Schachtel liegen gleich viele Hölzer. Wie viele sind es?",
    verb: "sind so viel wie", frage: "Wie viele Hölzer stecken in einer Schachtel?",
    nomen: {
      k: { ein: "ein", sg: "Streichholz", pl: "Streichhölzer" },
      x: { ein: "eine", sg: "Schachtel", pl: "Schachteln" },
      y: { ein: "ein", sg: "Röhrchen", pl: "Röhrchen" },
    },
  },
};

/* Baut aus einer Gleichung einen Aufgabentext, z. B.
   "Drei Mehlsäcke und 2 Kilogewichte wiegen so viel wie ein Mehlsack und 8 Kilogewichte." */
const REIHENFOLGE = ["x", "y", "k"];
function sachtext(L, R, ctx) {
  const wort = (k, n) => {
    const w = ctx.nomen[k];
    return n === 1 ? `${w.ein} ${w.sg}` : `${n} ${w.pl}`;
  };
  const seite = (p) => {
    const teile = REIHENFOLGE
      .filter((k) => !fZero(p[k]) && isInt(p[k]) && fVal(p[k]) > 0)
      .map((k) => wort(k, fVal(p[k])));
    if (!teile.length) return null;
    return teile.length === 1 ? teile[0] : teile.slice(0, -1).join(", ") + " und " + teile[teile.length - 1];
  };
  const l = seite(L), r = seite(R);
  if (!l || !r) return null;
  const einzahl = REIHENFOLGE.filter((k) => !fZero(L[k])).length === 1
    && REIHENFOLGE.some((k) => fVal(L[k]) === 1);
  const verb = einzahl ? ctx.verb.replace("wiegen", "wiegt").replace("sind", "ist") : ctx.verb;
  return `${l.charAt(0).toUpperCase() + l.slice(1)} ${verb} ${r}. ${ctx.frage}`;
}

export { MELDUNGEN, CONTEXTS, sachtext };
