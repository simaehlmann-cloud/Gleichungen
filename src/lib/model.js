import { F, fSub, fDiv, fVal, fZero, isInt, lcm, KIND, panAdd, panScale } from "./fraction.js";

const representable = (L, R) => [L, R].every((p) => KIND.every((k) => isInt(p[k]) && fVal(p[k]) >= 0));
function repairSteps(L, R) {
  const steps = []; let d = 1;
  [L, R].forEach((p) => KIND.forEach((k) => { d = lcm(d, p[k].d); }));
  if (d > 1) { L = panScale(L, F(d)); R = panScale(R, F(d)); steps.push({ op: "mul", n: d }); }
  KIND.forEach((k) => {
    const m = Math.min(fVal(L[k]), fVal(R[k]));
    if (m < 0) {
      const dd = { x: F(0), y: F(0), k: F(0) }; dd[k] = F(-m);
      L = panAdd(L, dd); R = panAdd(R, dd); steps.push({ op: "add", kind: k, n: -m });
    }
  });
  return { L, R, steps };
}

/* Welche Blockgewichte bringen diese Waage ins Gleichgewicht?
   a·x + b·y = c  — löst nach der beteiligten Variablen auf. */
function levelValues(L, R, xFallback = 1, yFallback = 1) {
  const a = fSub(L.x, R.x), b = fSub(L.y, R.y), c = fSub(R.k, L.k);
  if (!fZero(a) && fZero(b)) { const xF = fDiv(c, a); return { x: fVal(xF), y: yFallback, xF, ok: true }; }
  if (!fZero(a)) { const x = (fVal(c) - fVal(b) * yFallback) / fVal(a); return { x, y: yFallback, ok: true }; }
  if (!fZero(b)) { const yF = fDiv(c, b); return { x: xFallback, y: fVal(yF), yF, ok: true }; }
  return { x: xFallback, y: yFallback, ok: fZero(c) };
}

/* Rückmeldungen in zwei Tonlagen: fragend lädt zum Nachdenken ein,
   direkt sagt, was zu tun ist. Umschaltbar im Lehrkraft-Bereich. */



let uid = 0;
const resetUid = () => { uid = 0; };
const mkScale = (label, L, R) => ({ id: ++uid, label, L, R, prot: [{ L, R, note: null }] });
const withStep = (s, L, R, note, bad) => {
  const prot = s.prot.slice();
  prot[prot.length - 1] = { ...prot[prot.length - 1], note, bad };
  return { ...s, L, R, prot: [...prot, { L, R, note: null }] };
};

export { representable, repairSteps, levelValues, mkScale, withStep, resetUid };
