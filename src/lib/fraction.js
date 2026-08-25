/* Exakte Bruchrechnung und Termdarstellung */
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = b; b = a % b; a = t; } return a || 1; };
const lcm = (a, b) => (a * b) / gcd(a, b);
const F = (n, d = 1) => { if (d === 0) return { n: 0, d: 1 }; if (d < 0) { n = -n; d = -d; } const k = gcd(n, d); return { n: n / k, d: d / k }; };
const fAdd = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
const fSub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
const fMul = (a, b) => F(a.n * b.n, a.d * b.d);
const fDiv = (a, b) => (b.n === 0 ? F(0) : F(a.n * b.d, a.d * b.n));
const fVal = (a) => a.n / a.d;
const fZero = (a) => a.n === 0;
const fAbs = (a) => F(Math.abs(a.n), a.d);
const fStr = (a) => (a.d === 1 ? String(a.n) : `${a.n}/${a.d}`);
const isInt = (a) => a.d === 1;

/* ================= Terme ================= */
const KIND = ["k", "x", "y"];
const P = (x = 0, y = 0, k = 0) => ({ x: F(x), y: F(y), k: F(k) });
const panAdd = (p, q) => ({ x: fAdd(p.x, q.x), y: fAdd(p.y, q.y), k: fAdd(p.k, q.k) });
const panScale = (p, f) => ({ x: fMul(p.x, f), y: fMul(p.y, f), k: fMul(p.k, f) });
const panVal = (p, xv, yv) => fVal(p.x) * xv + fVal(p.y) * yv + fVal(p.k);
const panEmpty = (p) => KIND.every((k) => fZero(p[k]));
const SYM = { x: "x", y: "y" };

function termParts(p, sym = SYM) {
  const parts = [];
  const push = (c, kind, s) => {
    if (fZero(c)) return;
    const a = fStr(fAbs(c));
    parts.push({ kind, neg: c.n < 0, s: s ? (a === "1" ? s : a + s) : a });
  };
  push(p.x, "x", sym.x); push(p.y, "y", sym.y); push(p.k, "k", "");
  return parts;
}
function termStr(p, sym = SYM) {
  const parts = termParts(p, sym);
  if (!parts.length) return "0";
  return parts.map((t, i) => (i === 0 ? (t.neg ? "−" : "") + t.s : (t.neg ? " − " : " + ") + t.s)).join("");
}
const eqOf = (L, R, sym = SYM) => `${termStr(L, sym)} = ${termStr(R, sym)}`;

function noteStr(n, sym = SYM) {
  if (!n) return "";
  if (n.text) return n.text;
  const s = n.kind === "k" ? "" : sym[n.kind];
  if (n.op === "add") { const a = Math.abs(n.n); return `${n.n < 0 ? "−" : "+"} ${a === 1 && s ? s : a + s}`; }
  if (n.op === "mul") return `· ${n.n}${n.frei ? " (ohne Waage)" : ""}`;
  if (n.op === "div") return `: ${n.n}${n.frei ? " (ohne Waage)" : ""}`;
  if (n.op === "swap") return "Seiten tauschen";
  if (n.op === "one") return `nur ${n.side === "L" ? "links" : "rechts"} verändert`;
  return "";
}

export { gcd, lcm, F, fAdd, fSub, fMul, fDiv, fVal, fZero, fAbs, fStr, isInt,
  KIND, P, panAdd, panScale, panVal, panEmpty, SYM, termParts, termStr, eqOf, noteStr };
