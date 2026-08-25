import { F, fZero, fDiv, panAdd, panScale, P } from "./fraction.js";

function numFrac(s) {
  if (!s.includes(".")) return F(parseInt(s, 10));
  const [a, b = ""] = s.split(".");
  return F(parseInt((a || "0") + b, 10), Math.pow(10, b.length));
}
function tokenize(src) {
  const s = src.replace(/[−–—]/g, "-").replace(/[·×]/g, "*").replace(/:/g, "/").replace(/,/g, ".").replace(/\s+/g, "");
  const t = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; t.push({ t: "num", v: s.slice(i, j) }); i = j; }
    else if (/[xyXY?]/.test(c)) { t.push({ t: "var", v: c === "?" ? "x" : c.toLowerCase() }); i++; }
    else if ("+-*/()".includes(c)) { t.push({ t: c }); i++; }
    else throw new Error(`Das Zeichen „${c}" kenne ich nicht.`);
  }
  return t;
}
const linConst = (p) => fZero(p.x) && fZero(p.y);
const linMul = (a, b) => {
  if (linConst(a)) return panScale(b, a.k);
  if (linConst(b)) return panScale(a, b.k);
  throw new Error("Nur lineare Gleichungen: x·x oder x·y geht nicht.");
};
const linDiv = (a, b) => {
  if (!linConst(b) || fZero(b.k)) throw new Error("Teilen geht nur durch eine Zahl außer null.");
  return panScale(a, fDiv(F(1), b.k));
};
function parseExpr(tk, st) {
  let v = parseTerm(tk, st);
  while (st.i < tk.length && (tk[st.i].t === "+" || tk[st.i].t === "-")) {
    const op = tk[st.i++].t, r = parseTerm(tk, st);
    v = op === "+" ? panAdd(v, r) : panAdd(v, panScale(r, F(-1)));
  }
  return v;
}
function parseTerm(tk, st) {
  let v = parseFactor(tk, st);
  while (st.i < tk.length) {
    const c = tk[st.i];
    if (c.t === "*" || c.t === "/") { st.i++; const r = parseFactor(tk, st); v = c.t === "*" ? linMul(v, r) : linDiv(v, r); }
    else if (c.t === "num" || c.t === "var" || c.t === "(") v = linMul(v, parseFactor(tk, st));
    else break;
  }
  return v;
}
function parseFactor(tk, st) {
  if (st.i >= tk.length) throw new Error("Die Gleichung hört mitten im Term auf.");
  const c = tk[st.i];
  if (c.t === "-") { st.i++; return panScale(parseFactor(tk, st), F(-1)); }
  if (c.t === "+") { st.i++; return parseFactor(tk, st); }
  if (c.t === "num") { st.i++; return { x: F(0), y: F(0), k: numFrac(c.v) }; }
  if (c.t === "var") { st.i++; return c.v === "x" ? P(1, 0, 0) : P(0, 1, 0); }
  if (c.t === "(") { st.i++; const v = parseExpr(tk, st); if (!tk[st.i] || tk[st.i].t !== ")") throw new Error("Da fehlt eine schließende Klammer."); st.i++; return v; }
  throw new Error("Unerwartetes Zeichen in der Gleichung.");
}
function parseEquation(str) {
  const parts = String(str).split("=");
  if (parts.length !== 2) throw new Error("Die Eingabe braucht genau ein Gleichheitszeichen.");
  if (!parts[0].trim() || !parts[1].trim()) throw new Error("Auf beiden Seiten muss ein Term stehen.");
  const side = (s) => { const tk = tokenize(s), st = { i: 0 }; const v = parseExpr(tk, st); if (st.i < tk.length) throw new Error("Der Term lässt sich nicht ganz lesen."); return v; };
  return { L: side(parts[0]), R: side(parts[1]) };
}

export { parseEquation, tokenize };
