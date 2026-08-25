import { P } from "./fraction.js";

const A1 = [
  { name: "3x + 2 = x + 8", L: P(3, 0, 2), R: P(1, 0, 8) },
  { name: "2x + 3 = 11", L: P(2, 0, 3), R: P(0, 0, 11) },
  { name: "4x + 1 = 2x + 9", L: P(4, 0, 1), R: P(2, 0, 9) },
  { name: "5 + 2x = 3x + 1", L: P(2, 0, 5), R: P(3, 0, 1) },
  { name: "6x = 2x + 12", L: P(6, 0, 0), R: P(2, 0, 12) },
];
const A2 = [
  { name: "x + y = 8  /  2x + y = 11", A: { L: P(1, 1, 0), R: P(0, 0, 8) }, B: { L: P(2, 1, 0), R: P(0, 0, 11) } },
  { name: "x = y + 2  /  x + y = 10", A: { L: P(1, 0, 0), R: P(0, 1, 2) }, B: { L: P(1, 1, 0), R: P(0, 0, 10) } },
  { name: "2x + y = 12  /  x + 3y = 16", A: { L: P(2, 1, 0), R: P(0, 0, 12) }, B: { L: P(1, 3, 0), R: P(0, 0, 16) } },
];
const LEVELS = [
  { id: 1, name: "Stufe 1 · wegnehmen", hint: "Kugeln wegnehmen, dann Blöcke aufteilen." },
  { id: 2, name: "Stufe 2 · Blöcke auf beiden Seiten", hint: "Erst Blöcke abgleichen, dann Kugeln." },
  { id: 3, name: "Stufe 3 · geht nicht glatt auf", hint: "Am Ende bleibt ein Bruchteil – teile die Kugeln in gleiche Haufen." },
  { id: 4, name: "Stufe 4 · Antikugeln", hint: "Hier reichen die Kugeln nicht: rote Antikugeln übernehmen." },
  { id: 5, name: "Stufe 5 · zwei Waagen", hint: "Einsetzen, gleichsetzen oder zusammenschütten." },
];
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function genTask(level) {
  if (level === 5) {
    for (let t = 0; t < 200; t++) {
      const x = ri(1, 6), y = ri(1, 6);
      const a1 = ri(1, 3), b1 = ri(1, 3), a2 = ri(1, 3), b2 = ri(1, 3);
      if (a1 * b2 - a2 * b1 === 0) continue;
      return { mode: "lgs", scales: [{ L: P(a1, b1, 0), R: P(0, 0, a1 * x + b1 * y) }, { L: P(a2, b2, 0), R: P(0, 0, a2 * x + b2 * y) }] };
    }
  }
  if (level === 1) { const a = ri(2, 4), x = ri(1, 6), b = ri(1, 8); return { mode: "einzeln", scales: [{ L: P(a, 0, b), R: P(0, 0, a * x + b) }] }; }
  if (level === 2) {
    const x = ri(1, 6), c = ri(1, 3), a = c + ri(1, 3), d = ri(1, 6), b = ri(0, 6);
    return { mode: "einzeln", scales: [{ L: P(a, 0, b), R: P(c, 0, (a - c) * x + b) }] };
  }
  if (level === 3) {
    const c = ri(0, 1), a = c + ri(2, 4), b = ri(0, 5);
    let rest = ri(1, 11);
    while (rest % (a - c) === 0) rest++;
    return { mode: "einzeln", scales: [{ L: P(a, 0, b), R: P(c, 0, b + rest) }] };
  }
  return genNeg();
}
function genNeg() {
  const x = ri(1, 5), a = ri(2, 4), b = ri(1, 6);
  return { mode: "einzeln", scales: [{ L: P(a, 0, a * x + b), R: P(0, 0, b) }] };
}

export { A1, A2, LEVELS, genTask, genNeg };
