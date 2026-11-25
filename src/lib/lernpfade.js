/* Lernpfade zum selbstständigen Lernen.

   Reihenfolge der Stationen nach der Progression in Parallelo (Cornelsen,
   Niedersachsen): Probieren → Waage → Äquivalenzumformungen → x auf beiden
   Seiten → Klammern → Sachaufgaben; bei den Gleichungssystemen Lösungspaare →
   Probieren → Gleichsetzen → Einsetzen → Addieren → Verfahrenswahl →
   Sonderfälle → Sachaufgaben. Jeder Pfad endet mit einem Abschlusstest.

   Alles hier ist rein: Generatoren erzeugen Aufgaben, `bewerte` und
   `pruefeVorstufe` beurteilen Eingaben, gerechnet wird exakt mit Brüchen.
   Die Oberfläche steht in components/Lernpfad.jsx. */
import { F, fAdd, fSub, fMul, fDiv, fZero, fStr, P, eqOf } from "./fraction.js";
import { parseEquation } from "./parser.js";
import { representable } from "./model.js";

/* ---------- Zufall ---------- */
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const wahl = (arr) => arr[Math.floor(Math.random() * arr.length)];
const ja = () => Math.random() < 0.5;

/* ---------- Exakte Zahlen ---------- */
const fEq = (a, b) => fZero(fSub(a, b));

/* Liest 3, −2, 1,5, 3/2 oder −3/2 exakt. Leer → null, unlesbar → undefined. */
function zahl(s) {
  const t = String(s == null ? "" : s).replace(/[−–—]/g, "-").replace(/,/g, ".").replace(/\s+/g, "");
  if (!t) return null;
  const m = t.match(/^([+-]?)(\d+(?:\.\d+)?|\.\d+)(?:\/(\d+))?$/);
  if (!m) return undefined;
  const [ganz, nach = ""] = m[2].split(".");
  let f = F(parseInt((ganz || "0") + nach, 10), Math.pow(10, nach.length));
  if (m[3] !== undefined) {
    const d = parseInt(m[3], 10);
    if (d === 0) return undefined;
    f = fDiv(f, F(d));
  }
  return m[1] === "-" ? F(-f.n, f.d) : f;
}

/* Wert eines Terms für gegebene Brüche x, y */
const wert = (p, x, y) => fAdd(fAdd(fMul(p.x, x), fMul(p.y, y)), p.k);

/* Lösung einer Gleichung oder eines 2×2-Systems.
   art: "eine" (x bzw. x und y), "keine", "alle", "zwei" (eine Gleichung mit x und y) */
function loese(gl) {
  if (gl.length === 1) {
    const { L, R } = gl[0];
    if (!fZero(fSub(L.y, R.y))) return { art: "zwei" };
    const a = fSub(L.x, R.x), b = fSub(R.k, L.k);
    if (fZero(a)) return { art: fZero(b) ? "alle" : "keine" };
    return { art: "eine", x: fDiv(b, a) };
  }
  const [A, B] = gl;
  const a1 = fSub(A.L.x, A.R.x), b1 = fSub(A.L.y, A.R.y), c1 = fSub(A.R.k, A.L.k);
  const a2 = fSub(B.L.x, B.R.x), b2 = fSub(B.L.y, B.R.y), c2 = fSub(B.R.k, B.L.k);
  const det = fSub(fMul(a1, b2), fMul(a2, b1));
  if (fZero(det)) {
    const nullZeile = (a, b, c) => fZero(a) && fZero(b) && !fZero(c);
    if (nullZeile(a1, b1, c1) || nullZeile(a2, b2, c2)) return { art: "keine" };
    const passt = fZero(fSub(fMul(a1, c2), fMul(a2, c1))) && fZero(fSub(fMul(b1, c2), fMul(b2, c1)));
    return { art: passt ? "alle" : "keine" };
  }
  return {
    art: "eine",
    x: fDiv(fSub(fMul(c1, b2), fMul(c2, b1)), det),
    y: fDiv(fSub(fMul(a1, c2), fMul(a2, c1)), det),
  };
}

/* ---------- Aufgaben bauen ---------- */
let nr = 0;
/* gl: [{L, R}] wie auf der Waage; zeige: Aufgabentext(e) für die Anzeige */
function aufgabe(gl, extra = {}) {
  const lgs = gl.length === 2;
  const zeige = extra.zeige || gl.map((g, i) => (lgs ? `(${i === 0 ? "I" : "II"})  ` : "") + eqOf(g.L, g.R));
  return { id: ++nr, art: lgs ? "lgs" : "gleichung", gl, zeige, loesung: loese(gl), ...extra };
}
const seitenTausch = (g) => (ja() ? g : { L: g.R, R: g.L });

/* ---- Gleichungen ---- */
const gPlus = () => {
  const x = ri(1, 12), a = ri(1, 9);
  return aufgabe([seitenTausch({ L: P(1, 0, a), R: P(0, 0, x + a) })]);
};
const gMal = () => {
  const a = ri(2, 5), x = ri(1, 8);
  return aufgabe([seitenTausch({ L: P(a, 0, 0), R: P(0, 0, a * x) })]);
};
const gProbieren = () => wahl([gPlus, gMal, () => {
  const a = ri(2, 3), x = ri(1, 6), b = ri(1, 5);
  return aufgabe([{ L: P(a, 0, b), R: P(0, 0, a * x + b) }]);
}])();
const gZwei = () => {
  const a = ri(2, 5), x = ri(1, 8), b = ri(1, 9);
  return aufgabe([seitenTausch({ L: P(a, 0, b), R: P(0, 0, a * x + b) })]);
};
const gBeide = (gross = false) => {
  const x = ri(1, gross ? 9 : 7), c = ri(1, gross ? 5 : 3), a = c + ri(1, gross ? 4 : 3), b = ri(0, gross ? 12 : 6);
  return aufgabe([seitenTausch({ L: P(a, 0, b), R: P(c, 0, (a - c) * x + b) })]);
};
const gKlammer = () => {
  const a = ri(2, 4), b = ri(1, 5), x = ri(1, 6), c = ri(0, a - 1), d = a * (x + b) - c * x;
  const rechts = c ? `${c === 1 ? "" : c}x + ${d}` : String(d);
  const text = ja() ? `${a}(x + ${b}) = ${rechts}` : `${rechts} = ${a}(x + ${b})`;
  const { L, R } = parseEquation(text);
  return aufgabe([{ L, R }], { zeige: [text], vorstufe: { typ: "klammer", text } });
};
const gBruch = () => {
  const c = ri(0, 1), a = c + ri(2, 4), b = ri(0, 5);
  let rest = ri(1, 11);
  while (rest % (a - c) === 0) rest++;
  return aufgabe([{ L: P(a, 0, b), R: P(c, 0, b + rest) }]);
};
const gNegativ = () => {
  const x = ri(1, 5), a = ri(2, 4), b = ri(1, 6);
  return aufgabe([seitenTausch({ L: P(a, 0, a * x + b), R: P(0, 0, b) })]);
};
const gSonder = () => {
  const r = Math.random();
  const a = ri(1, 4);
  if (r < 0.34) {
    let b = ri(0, 8), d = ri(0, 8);
    if (b === d) d = b + ri(1, 4);
    return aufgabe([{ L: P(a + 1, 0, b), R: P(a + 1, 0, d) }]);
  }
  if (r < 0.67) {
    const k = ri(2, 4), b = ri(1, 5);
    const text = `${k}(x + ${b}) = ${k}x + ${k * b}`;
    const { L, R } = parseEquation(text);
    return aufgabe([{ L, R }], { zeige: [text] });
  }
  return gBeide();
};

/* Sachaufgaben mit einer Unbekannten: Text, Bedeutung von x, Gleichung */
const SACH1 = [
  () => { const x = ri(2, 12), a = ri(2, 5), b = ri(1, 9);
    return { text: `Wenn du eine Zahl mit ${a} malnimmst und dann ${b} addierst, erhältst du ${a * x + b}. Wie heißt die Zahl?`, x: "die gesuchte Zahl", gl: { L: P(a, 0, b), R: P(0, 0, a * x + b) } }; },
  () => { const x = ri(3, 15), b = ri(2, 9), c = ri(1, b - 1);
    return { text: `Denk dir eine Zahl. Das Doppelte der Zahl plus ${c} ist genauso viel wie die Zahl plus ${x + c}. Welche Zahl ist es?`, x: "die gedachte Zahl", gl: { L: P(2, 0, c), R: P(1, 0, x + c) } }; },
  () => { const x = ri(8, 16), d = ri(2, 6);
    return { text: `Mia ist ${d} Jahre älter als Tom. Zusammen sind sie ${2 * x + d} Jahre alt. Wie alt ist Tom?`, x: "Toms Alter in Jahren", gl: { L: P(2, 0, d), R: P(0, 0, 2 * x + d) } }; },
  () => { const x = ri(1, 4), n = ri(3, 6), s = ri(2, 5);
    return { text: `Für ${n} gleiche Hefte und einen Stift für ${s} € bezahlst du zusammen ${n * x + s} €. Wie viel kostet ein Heft?`, x: "der Preis eines Heftes in €", gl: { L: P(n, 0, s), R: P(0, 0, n * x + s) } }; },
  () => { const x = ri(3, 9), d = ri(2, 6);
    return { text: `Ein Rechteck ist ${d} cm länger als breit. Sein Umfang beträgt ${4 * x + 2 * d} cm. Wie breit ist es?`, x: "die Breite in cm", gl: { L: P(4, 0, 2 * d), R: P(0, 0, 4 * x + 2 * d) } }; },
];
const gSach = () => {
  const s = wahl(SACH1)();
  return aufgabe([s.gl], { zeige: [s.text], vorstufe: { typ: "sach", text: s.text, variablen: { x: s.x }, anzahl: 1 } });
};

/* ---- Gleichungssysteme ---- */
const lPaar = () => {
  const a = ri(1, 3), b = ri(1, 2), x = ri(0, 5), y = ri(0, 5);
  const g = { L: P(a, b, 0), R: P(0, 0, a * x + b * y) };
  return { ...aufgabe([g]), art: "paar" };
};
const lProbieren = () => {
  const x = ri(1, 5), y = ri(1, 5), a = ri(1, 3), b = ri(1, 3);
  const [a2, b2] = wahl([[a + 1, b], [a, b + 1]]);
  return aufgabe([{ L: P(a, b, 0), R: P(0, 0, a * x + b * y) }, { L: P(a2, b2, 0), R: P(0, 0, a2 * x + b2 * y) }]);
};
/* y = a·x + b, bzw. x = a·y + b, mit natürlichen Zahlen */
const isoliert = (v, a, b) => (v === "y" ? { L: P(0, 1, 0), R: P(a, 0, b) } : { L: P(1, 0, 0), R: P(0, a, b) });
const lGleich = () => {
  for (;;) {
    const v = wahl(["x", "y"]), s = ri(1, 5);
    const a1 = ri(0, 3), a2 = ri(0, 3);
    if (a1 === a2) continue;
    const b1 = ri(0, 6), t = a1 * s + b1, b2 = t - a2 * s;
    if (b2 < 0) continue;
    return aufgabe([isoliert(v, a1, b1), isoliert(v, a2, b2)]);
  }
};
const lEinsetz = () => {
  const v = wahl(["x", "y"]), s = ri(1, 5), a = ri(1, 2), b = ri(0, 4), t = a * s + b;
  const p = ri(1, 3), q = ri(1, 3);
  const [x, y] = v === "y" ? [s, t] : [t, s];
  const I = isoliert(v, a, b), II = { L: P(p, q, 0), R: P(0, 0, p * x + q * y) };
  return aufgabe(ja() ? [I, II] : [II, I]);
};
const lAddier = () => {
  const x = ri(1, 6), y = ri(1, 6), weg = wahl(["x", "y"]), g = ri(1, 3), k2 = ri(1, 3), k1 = k2 + ri(1, 3);
  const [a1, b1, a2, b2] = weg === "y" ? [k1, g, k2, g] : [g, k1, g, k2];
  const I = { L: P(a1, b1, 0), R: P(0, 0, a1 * x + b1 * y) }, II = { L: P(a2, b2, 0), R: P(0, 0, a2 * x + b2 * y) };
  return aufgabe(ja() ? [I, II] : [II, I]);
};
const lSonder = () => {
  const r = Math.random(), a = ri(1, 3), b = ri(1, 3), x = ri(1, 4), y = ri(1, 4), c = a * x + b * y;
  if (r < 0.34) return aufgabe([{ L: P(a, b, 0), R: P(0, 0, c) }, { L: P(a, b, 0), R: P(0, 0, c + ri(1, 5)) }]);
  if (r < 0.67) { const k = ri(2, 3); return aufgabe([{ L: P(a, b, 0), R: P(0, 0, c) }, { L: P(k * a, k * b, 0), R: P(0, 0, k * c) }]); }
  return wahl([lGleich, lEinsetz, lAddier])();
};
const SACH2 = [
  () => { const x = ri(1, 4), y = ri(1, 3);
    return { text: `Ein Heft und ein Stift kosten zusammen ${x + y} €. Zwei Hefte und ein Stift kosten ${2 * x + y} €.`, v: { x: "der Preis eines Heftes in €", y: "der Preis eines Stiftes in €" },
      gl: [{ L: P(1, 1, 0), R: P(0, 0, x + y) }, { L: P(2, 1, 0), R: P(0, 0, 2 * x + y) }] }; },
  () => { const x = ri(3, 12), y = ri(2, 8);
    return { text: `Auf einem Hof leben Hühner und Kaninchen, zusammen ${x + y} Tiere. Sie haben zusammen ${2 * x + 4 * y} Beine.`, v: { x: "die Anzahl der Hühner", y: "die Anzahl der Kaninchen" },
      gl: [{ L: P(1, 1, 0), R: P(0, 0, x + y) }, { L: P(2, 4, 0), R: P(0, 0, 2 * x + 4 * y) }] }; },
  () => { const y = ri(3, 15), d = ri(2, 9), x = y + d;
    return { text: `Zwei Zahlen haben die Summe ${x + y}. Die größere ist um ${d} größer als die kleinere.`, v: { x: "die größere Zahl", y: "die kleinere Zahl" },
      gl: [{ L: P(1, 1, 0), R: P(0, 0, x + y) }, { L: P(1, 0, 0), R: P(0, 1, d) }] }; },
  () => { const x = ri(4, 9), y = ri(2, 6);
    return { text: `Im Kino kosten 2 Erwachsenen- und 3 Kinderkarten zusammen ${2 * x + 3 * y} €. Eine Erwachsenen- und eine Kinderkarte kosten zusammen ${x + y} €.`, v: { x: "der Preis einer Erwachsenenkarte in €", y: "der Preis einer Kinderkarte in €" },
      gl: [{ L: P(2, 3, 0), R: P(0, 0, 2 * x + 3 * y) }, { L: P(1, 1, 0), R: P(0, 0, x + y) }] }; },
];
const lSach = () => {
  const s = wahl(SACH2)();
  return aufgabe(s.gl, { zeige: [s.text], vorstufe: { typ: "sach", text: s.text, variablen: s.v, anzahl: 2 } });
};

/* ---------- Stationen ---------- */
const ZIEL = 3;
const PFADE = [
  {
    id: "gl", titel: "Gleichungen lösen", unter: "Vom Probieren bis zur Sachaufgabe",
    stationen: [
      { id: "gl-1", titel: "Gleichungen durch Probieren lösen", kurz: "Lösung finden und Probe machen",
        merk: ["Eine Gleichung besteht aus zwei Termen mit einem Gleichheitszeichen dazwischen. Eine Zahl ist eine Lösung, wenn beim Einsetzen links und rechts dasselbe herauskommt.",
          "Mit dem Regler stellst du ein, wie schwer ein x-Block ist. Steht die Waage waagerecht, hast du die Lösung gefunden."],
        beispiel: [["2x + 3 = 11", "x = 3?  2·3 + 3 = 9 ≠ 11"], ["2x + 3 = 11", "x = 4?  2·4 + 3 = 11 ✓"], ["x = 4", "Lösung"]],
        tipps: ["Bewege den Regler für x unten auf der Seite. Wann steht die Waage waagerecht?", "Setz deine Zahl für x ein und rechne beide Seiten aus. Sind sie gleich?"],
        probieren: true, gen: gProbieren },
      { id: "gl-2", titel: "Mit der Waage: auf beiden Seiten wegnehmen", kurz: "x + a = b",
        merk: ["Eine Gleichung ist wie eine Waage im Gleichgewicht. Nimmst du auf beiden Seiten dasselbe weg, bleibt sie im Gleichgewicht.",
          "Nimm so lange Kugeln auf beiden Seiten weg, bis der x-Block allein liegt."],
        beispiel: [["x + 5 = 9", "| − 5"], ["x = 4", ""]],
        tipps: ["Wie viele Kugeln liegen beim x-Block? Genau so viele nimmst du auf beiden Seiten weg.", "Nutze „− Kugel“ mit der passenden Anzahl."],
        gen: gPlus },
      { id: "gl-3", titel: "Mit der Waage: in gleiche Haufen teilen", kurz: "a·x = b",
        merk: ["Liegen mehrere gleiche x-Blöcke allein auf einer Seite, teilst du beide Seiten in gleich viele Haufen. Ein Haufen bleibt liegen.",
          "In der Schreibweise ist das die Division durch dieselbe Zahl auf beiden Seiten."],
        beispiel: [["3x = 12", "| : 3"], ["x = 4", ""]],
        tipps: ["Wie viele x-Blöcke liegen auf der Waage? In so viele Haufen teilst du.", "Stell die Anzahl ein und tippe auf „in … Haufen teilen“."],
        gen: gMal },
      { id: "gl-4", titel: "Zwei Schritte: erst wegnehmen, dann teilen", kurz: "a·x + b = c",
        merk: ["Erst nimmst du die Kugeln weg, die neben den x-Blöcken liegen. Dann teilst du.",
          "Hinter jede Zeile schreibst du, was du auf beiden Seiten getan hast, zum Beispiel „| − 3“."],
        beispiel: [["2x + 3 = 11", "| − 3"], ["2x = 8", "| : 2"], ["x = 4", ""]],
        tipps: ["Zuerst müssen die Kugeln bei den x-Blöcken weg.", "Wenn nur noch x-Blöcke auf einer Seite liegen: teilen."],
        gen: gZwei },
      { id: "gl-5", titel: "x auf beiden Seiten", kurz: "a·x + b = c·x + d",
        merk: ["Liegen auf beiden Seiten x-Blöcke, nimmst du zuerst auf beiden Seiten gleich viele x-Blöcke weg.",
          "Danach geht es weiter wie gewohnt: Kugeln wegnehmen, dann teilen."],
        beispiel: [["4x + 1 = 2x + 9", "| − 2x"], ["2x + 1 = 9", "| − 1"], ["2x = 8", "| : 2"], ["x = 4", ""]],
        tipps: ["Auf welcher Seite liegen weniger x-Blöcke? So viele kannst du auf beiden Seiten wegnehmen.", "Danach sind die Kugeln dran, ganz zum Schluss das Teilen."],
        rechts: true, gen: () => gBeide(false) },
      { id: "gl-6", titel: "Äquivalenzumformungen ohne Waage", kurz: "Nur noch in Zeichen rechnen",
        merk: ["Jetzt rechnest du in der Schreibweise. Die Waage ist ausgeblendet, du kannst sie aber jederzeit als Hilfe einblenden.",
          "Erlaubt ist alles, was auf beiden Seiten gleich geschieht: dieselbe Zahl oder dasselbe x addieren oder subtrahieren, mit derselben Zahl (außer 0) multiplizieren oder durch sie dividieren."],
        beispiel: [["7x + 4 = 3x + 24", "| − 3x"], ["4x + 4 = 24", "| − 4"], ["4x = 20", "| : 4"], ["x = 5", ""]],
        tipps: ["Ordne: x-Terme auf eine Seite, Zahlen auf die andere.", "Teile am Ende durch die Zahl vor dem x."],
        rechts: true, waage: "aus", gen: () => gBeide(true) },
      { id: "gl-7", titel: "Klammern zuerst auflösen", kurz: "a·(x + b) = …",
        merk: ["Steht eine Klammer in der Gleichung, löst du sie zuerst auf: Jeder Summand in der Klammer wird mit dem Faktor davor malgenommen.",
          "Danach löst du die Gleichung wie gewohnt."],
        beispiel: [["3(x + 2) = x + 14", "Klammer auflösen"], ["3x + 6 = x + 14", "| − x"], ["2x + 6 = 14", "| − 6"], ["2x = 8", "| : 2"], ["x = 4", ""]],
        tipps: ["a(x + b) = a·x + a·b. Vergiss nicht, auch die Zahl in der Klammer malzunehmen.", "Nach dem Auflösen: x-Blöcke abgleichen, Kugeln wegnehmen, teilen."],
        rechts: true, gen: gKlammer },
      { id: "gl-8", titel: "Brüche und negative Zahlen", kurz: "Wenn die Waage an ihre Grenze kommt",
        merk: ["Nicht jede Gleichung hat eine natürliche Zahl als Lösung. Geht eine Teilung nicht auf, ist die Lösung ein Bruch – rechne dann ohne Waage weiter.",
          "Für negative Zahlen gibt es rote Antikugeln: Eine Kugel und eine Antikugel heben sich auf."],
        beispiel: [["3x + 2 = 7", "| − 2"], ["3x = 5", "| : 3"], ["x = 5/3", ""]],
        tipps: ["Die Lösung darf ein Bruch sein, zum Beispiel 5/3, oder negativ, zum Beispiel −2.", "Ist rechts weniger als links bei den Kugeln? Dann helfen Antikugeln."],
        rechts: true, anti: true, gen: () => (ja() ? gBruch() : gNegativ()) },
      { id: "gl-9", titel: "Keine Lösung oder unendlich viele", kurz: "Sonderfälle erkennen",
        merk: ["Fallen beim Umformen alle x weg, bleibt eine Aussage ohne x übrig.",
          "Ist sie falsch (etwa 3 = 5), hat die Gleichung keine Lösung. Ist sie wahr (etwa 6 = 6), ist jede Zahl eine Lösung."],
        beispiel: [["2x + 3 = 2x + 5", "| − 2x"], ["3 = 5", "falsch: keine Lösung"]],
        tipps: ["Nimm auf beiden Seiten gleich viele x-Blöcke weg. Was bleibt übrig?", "Bleibt nur eine Zahlengleichung übrig, entscheide: wahr oder falsch?"],
        rechts: true, sonder: true, gen: gSonder },
      { id: "gl-10", titel: "Sachaufgaben mit Gleichungen", kurz: "Gleichung aufstellen und lösen",
        merk: ["Lies genau: Was ist gesucht? Das ist dein x.", "Übersetze den Text in eine Gleichung, löse sie und prüfe, ob das Ergebnis zum Text passt."],
        beispiel: [["Eine Zahl mal 3 plus 4 ergibt 19.", "x = die Zahl"], ["3x + 4 = 19", "| − 4"], ["3x = 15", "| : 3"], ["x = 5", "Probe: 3·5 + 4 = 19 ✓"]],
        tipps: ["Schreib den Text Stück für Stück in Zeichen: „mal 3“ wird 3x, „plus 4“ wird + 4.", "Bei „zusammen“ addierst du die beiden Teile."],
        rechts: true, gen: gSach },
      { id: "gl-test", titel: "Abschlusstest Gleichungen", kurz: "Gemischte Aufgaben ohne Tipps", test: true,
        merk: ["Fünf gemischte Aufgaben aus dem ganzen Lernpfad. Tipps gibt es hier nicht – zeig, was du kannst!"],
        beispiel: [], tipps: [], ziel: 5, rechts: true, anti: true,
        gen: () => wahl([gZwei, () => gBeide(true), gKlammer, gBruch, gNegativ])() },
    ],
  },
  {
    id: "lgs", titel: "Lineare Gleichungssysteme", unter: "Zwei Waagen, zwei Unbekannte",
    stationen: [
      { id: "lgs-1", titel: "Gleichungen mit zwei Variablen", kurz: "Lösungspaare finden",
        merk: ["Eine Gleichung wie x + y = 7 hat viele Lösungen. Jede Lösung ist ein Zahlenpaar, zum Beispiel x = 3 und y = 4.",
          "Finde ein Paar, das die Gleichung erfüllt. Mit den Reglern siehst du an der Waage, ob es passt."],
        beispiel: [["x + y = 7", "x = 3, y = 4: 3 + 4 = 7 ✓"], ["x + y = 7", "x = 0, y = 7 ✓"]],
        tipps: ["Wähl für x eine kleine Zahl und rechne aus, was y dann sein muss.", "Setz beide Zahlen ein: Kommt rechts das Richtige heraus?"],
        probieren: true, gen: lPaar },
      { id: "lgs-2", titel: "Was ist ein Gleichungssystem?", kurz: "Ein Paar für beide Waagen",
        merk: ["Ein lineares Gleichungssystem besteht aus zwei Gleichungen mit denselben Variablen. Gesucht ist das Zahlenpaar, das beide Gleichungen zugleich erfüllt.",
          "Probiere mit den Reglern: Erst wenn beide Waagen waagerecht stehen, hast du die Lösung."],
        beispiel: [["(I) x + y = 5   (II) 2x + y = 7", ""], ["x = 2, y = 3", "(I) 2 + 3 = 5 ✓  (II) 4 + 3 = 7 ✓"]],
        tipps: ["Suche zuerst Paare für Gleichung (I) und prüfe sie dann in (II).", "Beide Waagen müssen gleichzeitig waagerecht stehen."],
        probieren: true, gen: lProbieren },
      { id: "lgs-3", titel: "Gleichsetzungsverfahren", kurz: "Zweimal dieselbe Variable allein",
        merk: ["Liegt auf beiden Waagen derselbe Block allein, wiegen die beiden anderen Seiten gleich viel. Du setzt sie gleich und erhältst eine Gleichung mit nur einer Variablen.",
          "Hast du x, setzt du es in eine der Gleichungen ein und berechnest y."],
        beispiel: [["(I) y = 2x + 1   (II) y = x + 4", "gleichsetzen"], ["2x + 1 = x + 4", "| − x | − 1"], ["x = 3", "in (II): y = 3 + 4 = 7"]],
        tipps: ["Tippe bei „verbinden mit“ auf „gleichsetzen“.", "Löse die neue Gleichung und setze das Ergebnis in eine Ausgangsgleichung ein."],
        rechts: true, verfahren: "gleichsetzen", gen: lGleich },
      { id: "lgs-4", titel: "Einsetzungsverfahren", kurz: "Eine Variable ersetzen",
        merk: ["Liegt auf einer Waage ein Block allein, darfst du ihn auf der anderen Waage durch das ersetzen, was gleich schwer ist.",
          "So verschwindet eine Variable. Die neue Gleichung löst du wie gewohnt."],
        beispiel: [["(I) y = x + 2   (II) x + y = 10", "(I) in (II) einsetzen"], ["x + x + 2 = 10", "zusammenfassen"], ["2x + 2 = 10", "| − 2 | : 2"], ["x = 4", "in (I): y = 6"]],
        tipps: ["Welche Waage trägt einen einzelnen Block? Die setzt du in die andere ein.", "Tippe auf „(…) in (…) einsetzen“."],
        rechts: true, verfahren: "einsetzen", gen: lEinsetz },
      { id: "lgs-5", titel: "Additionsverfahren", kurz: "Waagen zusammenschütten",
        merk: ["Du darfst den Inhalt einer Waage auf die passenden Schalen der anderen schütten oder von ihnen wegnehmen – links und rechts kommt jeweils Gleiches dazu.",
          "Ziel: Eine Variable fällt weg."],
        beispiel: [["(I) 3x + y = 11   (II) x + y = 5", "(I) − (II)"], ["2x = 6", "| : 2"], ["x = 3", "in (II): y = 2"]],
        tipps: ["Bei welcher Variablen stehen in beiden Gleichungen gleich viele Blöcke?", "Wähle die Waage mit mehr Blöcken aus und nimm die andere ab: „(…) − (…)“."],
        rechts: true, verfahren: "addieren", gen: lAddier },
      { id: "lgs-6", titel: "Welches Verfahren passt?", kurz: "Selbst entscheiden",
        merk: ["Steht eine Variable schon allein: Einsetzen. Steht sie zweimal allein: Gleichsetzen. Haben beide Gleichungen gleich viele x oder y: Addieren bzw. Subtrahieren.",
          "Jedes Verfahren führt zum Ziel – manche sind nur kürzer."],
        beispiel: [], tipps: ["Schau dir beide Gleichungen genau an: Steht irgendwo ein Block allein?", "Gleiche Anzahl Blöcke in beiden Gleichungen? Dann lohnt sich das Additionsverfahren."],
        rechts: true, gen: () => wahl([lGleich, lEinsetz, lAddier])() },
      { id: "lgs-7", titel: "Keine Lösung oder unendlich viele", kurz: "Sonderfälle bei Systemen",
        merk: ["Fallen beim Umformen beide Variablen weg, bleibt eine Aussage ohne Variable.",
          "Ist sie falsch, hat das System keine Lösung. Ist sie wahr, gibt es unendlich viele Lösungspaare."],
        beispiel: [["(I) x + y = 4   (II) x + y = 6", "(II) − (I)"], ["0 = 2", "falsch: keine Lösung"]],
        tipps: ["Vergleiche die linken Seiten der beiden Gleichungen. Sind sie gleich oder Vielfache voneinander?", "Bleibt nach dem Umformen 0 = 0 oder 0 = eine andere Zahl?"],
        rechts: true, sonder: true, gen: lSonder },
      { id: "lgs-8", titel: "Sachaufgaben mit zwei Unbekannten", kurz: "Zwei Gleichungen aufstellen",
        merk: ["Lege fest, wofür x und y stehen. Jede Information im Text wird zu einer Gleichung.", "Löse das System und prüfe, ob die Zahlen zum Text passen."],
        beispiel: [["Hühner (x) und Kaninchen (y): 10 Tiere, 28 Beine", ""], ["(I) x + y = 10   (II) 2x + 4y = 28", ""], ["x = 6, y = 4", "Probe: 6 + 4 = 10, 12 + 16 = 28 ✓"]],
        tipps: ["Jeder Satz mit einer Zahl liefert eine Gleichung.", "„zusammen“ heißt addieren; „um … größer“ heißt: die eine ist die andere plus …"],
        rechts: true, gen: lSach },
      { id: "lgs-test", titel: "Abschlusstest Gleichungssysteme", kurz: "Gemischte Aufgaben ohne Tipps", test: true,
        merk: ["Fünf gemischte Gleichungssysteme. Das Verfahren wählst du selbst, Tipps gibt es keine."],
        beispiel: [], tipps: [], ziel: 5, rechts: true,
        gen: () => wahl([lGleich, lEinsetz, lAddier])() },
    ],
  },
];
PFADE.forEach((p) => p.stationen.forEach((s, i) => { s.pfad = p.id; s.index = i; if (!s.ziel) s.ziel = ZIEL; }));
const STATIONEN = Object.fromEntries(PFADE.flatMap((p) => p.stationen).map((s) => [s.id, s]));
const pfadVon = (id) => PFADE.find((p) => p.id === (STATIONEN[id] || {}).pfad);

/* ---------- Vorstufen: Klammer auflösen, Gleichung aufstellen ---------- */
const gleichPan = (p, q) => ["x", "y", "k"].every((k) => fEq(p[k], q[k]));

function pruefeVorstufe(auf, eingaben) {
  const v = auf.vorstufe;
  const texte = (Array.isArray(eingaben) ? eingaben : [eingaben]).map((t) => String(t || "").trim());
  if (texte.some((t) => !t)) return { ok: false, text: v.anzahl === 2 ? "Trag beide Gleichungen ein." : "Trag zuerst eine Gleichung ein." };
  let gl;
  try { gl = texte.map(parseEquation); }
  catch (e) { return { ok: false, text: `Das kann ich nicht lesen: ${e.message || e}` }; }

  if (v.typ === "klammer") {
    if (/[()]/.test(texte[0])) return { ok: false, text: "Da steht noch eine Klammer. Multipliziere den Faktor mit jedem Summanden in der Klammer." };
    const soll = auf.gl[0];
    if (gleichPan(gl[0].L, soll.L) && gleichPan(gl[0].R, soll.R)) return { ok: true, text: "Richtig aufgelöst! Jetzt liegt die Gleichung auf der Waage.", gl: auf.gl };
    const l = loese(gl);
    if (l.art === "eine" && auf.loesung.art === "eine" && fEq(l.x, auf.loesung.x)) {
      return { ok: false, text: "Deine Gleichung hat zwar dieselbe Lösung, du hast aber schon weitergerechnet. Löse nur die Klammer auf und lass den Rest stehen." };
    }
    return { ok: false, text: "Das stimmt noch nicht. Hast du jeden Summanden in der Klammer mit dem Faktor davor malgenommen?" };
  }

  /* Sachaufgabe: jede Gleichung muss zur Situation passen (von der gesuchten
     Lösung erfüllt werden), und zusammen müssen sie genau diese Lösung liefern. */
  const soll = auf.loesung;
  const nutztY = gl.some((g) => !fZero(g.L.y) || !fZero(g.R.y));
  if (v.anzahl === 1 && nutztY) return { ok: false, text: "Hier reicht eine Variable: Nenne die gesuchte Größe x." };
  if (v.anzahl === 2 && !nutztY) return { ok: false, text: "Es gibt zwei gesuchte Größen: Verwende x und y, wie oben festgelegt." };
  const yWert = soll.y || F(0);
  const falsch = gl.findIndex((g) => !fEq(wert(g.L, soll.x, yWert), wert(g.R, soll.x, yWert)));
  if (falsch >= 0) {
    return { ok: false, text: v.anzahl === 2
      ? `Gleichung (${falsch === 0 ? "I" : "II"}) passt noch nicht zum Text. Lies den passenden Satz noch einmal genau.`
      : "Deine Gleichung passt noch nicht zum Text. Lies Satz für Satz und übersetze in Zeichen." };
  }
  const l = loese(gl);
  if (l.art !== "eine") {
    return { ok: false, text: v.anzahl === 2
      ? "Beide Gleichungen sagen dasselbe. Jede Information im Text gehört in eine eigene Gleichung."
      : "In deiner Gleichung fällt x weg. Kommt die gesuchte Größe wirklich vor?" };
  }
  /* Passt die eigene Gleichung auf die Waage, wird sie verwendet – sonst die
     gleichwertige aus der Aufgabe. */
  return { ok: true, text: "Die Gleichung passt zum Text. Jetzt löse sie!", gl: gl.every((g) => representable(g.L, g.R)) ? gl : auf.gl };
}

/* ---------- Bewertung ---------- */
const NAMEN = { einsetzen: "Einsetzungsverfahren", gleichsetzen: "Gleichsetzungsverfahren", addieren: "Additionsverfahren" };
const KNOPF = { einsetzen: "„(…) in (…) einsetzen“", gleichsetzen: "„gleichsetzen“", addieren: "„(…) + (…)“ oder „(…) − (…)“" };

/* antwort: { x, y } als Text oder { art: "keine" | "alle" }; verwendet: Set der benutzten Verfahren */
function bewerte(auf, antwort, station = {}, verwendet = new Set()) {
  const l = auf.loesung;
  if (auf.art === "paar") {
    const x = zahl(antwort.x), y = zahl(antwort.y);
    if (x === null || y === null) return { ok: false, leer: true, text: "Trag für x und für y eine Zahl ein." };
    if (x === undefined || y === undefined) return { ok: false, leer: true, text: "Das kann ich nicht als Zahl lesen. Erlaubt sind zum Beispiel 3, −2, 1,5 oder 3/2." };
    const g = auf.gl[0];
    return fEq(wert(g.L, x, y), wert(g.R, x, y))
      ? { ok: true, text: `Richtig: Mit x = ${fStr(x)} und y = ${fStr(y)} ist die Gleichung erfüllt.` }
      : { ok: false, text: `Setz ein: Links kommt ${fStr(wert(g.L, x, y))} heraus, rechts ${fStr(wert(g.R, x, y))}. Das ist nicht gleich.` };
  }

  if (antwort.art) {
    if (antwort.art === l.art) return { ok: true, text: l.art === "keine" ? "Richtig: Es bleibt eine falsche Aussage – keine Lösung." : "Richtig: Es bleibt eine wahre Aussage – unendlich viele Lösungen." };
    if (l.art === "eine") return { ok: false, text: "Hier gibt es genau eine Lösung. Forme weiter um, bis eine Variable allein steht." };
    return { ok: false, text: "Schau noch einmal auf die Aussage, die am Ende übrig bleibt: Ist sie wahr oder falsch?" };
  }

  const x = zahl(antwort.x), y = auf.art === "lgs" ? zahl(antwort.y) : F(0);
  if (x === null || y === null) return { ok: false, leer: true, text: auf.art === "lgs" ? "Trag deine Lösung für x und y ein." : "Trag deine Lösung für x ein." };
  if (x === undefined || y === undefined) return { ok: false, leer: true, text: "Das kann ich nicht als Zahl lesen. Erlaubt sind zum Beispiel 3, −2, 1,5 oder 3/2." };
  if (l.art !== "eine") {
    return { ok: false, text: station.sonder
      ? "Setz deine Zahl in die Gleichung ein. Fallen beim Umformen alle Variablen weg? Dann wähle unten „keine Lösung“ oder „unendlich viele“."
      : "Diese Aufgabe hat keine eindeutige Lösung." };
  }

  const okX = fEq(x, l.x), okY = auf.art !== "lgs" || fEq(y, l.y);
  if (!(okX && okY)) {
    if (auf.art === "lgs") {
      if (okX) return { ok: false, text: "x stimmt! Setz x in eine der beiden Gleichungen ein und berechne y daraus." };
      if (okY) return { ok: false, text: "y stimmt! Setz y in eine der beiden Gleichungen ein und berechne x daraus." };
      return { ok: false, text: "Das Paar erfüllt noch nicht beide Gleichungen. Mach die Probe in (I) und in (II)." };
    }
    if (fEq(x, F(-l.x.n, l.x.d)) && !fZero(l.x)) return { ok: false, text: "Fast: Prüfe das Vorzeichen. Setz deine Zahl ein und rechne beide Seiten aus." };
    if (!fZero(x) && fEq(fDiv(F(1), x), l.x)) return { ok: false, text: "Prüfe die letzte Division: Was wird durch was geteilt?" };
    const g = auf.gl[0];
    return { ok: false, text: `Probe mit x = ${fStr(x)}: Links kommt ${fStr(wert(g.L, x, F(0)))} heraus, rechts ${fStr(wert(g.R, x, F(0)))}. Das stimmt noch nicht.` };
  }
  if (station.verfahren && !verwendet.has(station.verfahren)) {
    return { ok: false, richtigOhneVerfahren: true, text: `Die Lösung stimmt! In dieser Station geht es aber um das ${NAMEN[station.verfahren]}. Nutze ${KNOPF[station.verfahren]} an den Waagen, dann zählt die Aufgabe.` };
  }
  return { ok: true, text: auf.art === "lgs" ? `Richtig: x = ${fStr(l.x)} und y = ${fStr(l.y)}.` : `Richtig: x = ${fStr(l.x)}.` };
}

function loesungsText(auf) {
  const l = auf.loesung;
  if (auf.art === "paar") {
    const g = auf.gl[0], a = g.L.x, b = g.L.y, c = g.R.k;
    return `zum Beispiel x = 0 und y = ${fStr(fDiv(c, b))}${fZero(a) ? "" : `, oder y = 0 und x = ${fStr(fDiv(c, a))}`}`;
  }
  if (l.art === "keine") return "keine Lösung";
  if (l.art === "alle") return auf.art === "lgs" ? "unendlich viele Lösungspaare" : "jede Zahl ist eine Lösung";
  return auf.art === "lgs" ? `x = ${fStr(l.x)}, y = ${fStr(l.y)}` : `x = ${fStr(l.x)}`;
}

export { PFADE, STATIONEN, pfadVon, zahl, loese, bewerte, pruefeVorstufe, loesungsText, NAMEN };
