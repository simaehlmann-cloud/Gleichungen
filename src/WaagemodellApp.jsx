import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus, Minus, RotateCcw, Eye, Divide, X as XIcon, ArrowLeftRight, Lightbulb,
  Check, Undo2, Maximize2, Presentation, Trash2, Link2, Link2Off, Play,
  Dices, Printer, GraduationCap, Scissors, Copy, AlertTriangle,
} from "lucide-react";

/* ================= Tokens ================= */
const C = {
  paper: "#EDEFE8", grid: "#D6DCD0", ink: "#22312B", ink2: "#5A6B62",
  brass: "#A8823C", brassDark: "#7A5B22", wood: "#8C7350",
  x: "#2C5F8A", xDark: "#1E4363", y: "#6B4E8C", yDark: "#4C3765",
  ball: "#E8E2D2", ballEdge: "#B9AE93", neg: "#B0453A", negDark: "#82302A", ok: "#3E7A56",
  sack: "#8A6A3C", sackDark: "#5F4726", iron: "#7C8489", ironDark: "#565C60",
};
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const SERIF = "Iowan Old Style, Palatino Linotype, Georgia, serif";

/* ================= Brüche ================= */
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
  if (n.op === "mul") return `· ${n.n}`;
  if (n.op === "div") return `: ${n.n}`;
  if (n.op === "swap") return "Seiten tauschen";
  if (n.op === "one") return `nur ${n.side === "L" ? "links" : "rechts"} verändert`;
  return "";
}

/* ================= Parser ================= */
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

/* ================= Waagentauglichkeit ================= */
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

/* ================= Sachkontexte ================= */
const CONTEXTS = {
  algebra: {
    name: "Algebra", sym: { x: "x", y: "y" }, unit: "Kugel", xName: "x-Block", yName: "y-Block",
    story: "Eine Kugel wiegt 1. Wie schwer ist ein Block?",
  },
  markt: {
    name: "Marktstand", sym: { x: "?", y: "◇" }, unit: "Kilogewicht", xName: "Mehlsack", yName: "Zuckersack",
    story: "Jedes Gewicht wiegt 1 kg, jeder Sack gleich viel. Wie schwer ist ein Sack?",
  },
  schachtel: {
    name: "Streichhölzer", sym: { x: "?", y: "◇" }, unit: "Streichholz", xName: "Schachtel", yName: "Röhrchen",
    story: "In jeder Schachtel liegen gleich viele Hölzer. Wie viele sind es?",
  },
};

/* ================= Aufgaben & Generator ================= */
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

let uid = 0;
const mkScale = (label, L, R) => ({ id: ++uid, label, L, R, prot: [{ L, R, note: null }] });
const withStep = (s, L, R, note, bad) => {
  const prot = s.prot.slice();
  prot[prot.length - 1] = { ...prot[prot.length - 1], note, bad };
  return { ...s, L, R, prot: [...prot, { L, R, note: null }] };
};

/* ================= Spielsteine ================= */
function look(kind, neg, ctx) {
  if (neg) return { shape: "round", bg: `radial-gradient(circle at 32% 28%, #d98a80, ${C.neg} 62%, ${C.negDark})`, border: C.negDark, fg: "#fff", label: kind === "k" ? "−1" : "−" + ctx.sym[kind] };
  if (kind === "k") {
    if (ctx === CONTEXTS.markt) return { shape: "sq", bg: `linear-gradient(160deg, ${C.iron}, ${C.ironDark})`, border: C.ironDark, fg: "#fff", label: "1kg", small: true };
    if (ctx === CONTEXTS.schachtel) return { shape: "stick", bg: "#D9B36C", border: "#8A6A2E", fg: C.ink, label: "" };
    return { shape: "round", bg: `radial-gradient(circle at 32% 28%, #fbf8ef, ${C.ball} 62%, #cfc5ab)`, border: C.ballEdge, fg: C.ink, label: "" };
  }
  const base = kind === "x" ? (ctx === CONTEXTS.algebra ? C.x : C.sack) : (ctx === CONTEXTS.algebra ? C.y : C.yDark);
  const dark = kind === "x" ? (ctx === CONTEXTS.algebra ? C.xDark : C.sackDark) : C.yDark;
  return { shape: "sq", bg: `linear-gradient(160deg, ${base}, ${dark})`, border: dark, fg: "#fff", label: ctx.sym[kind] };
}
function Piece({ kind, neg, ctx, z = 1, label, onPointerDown, onHover, ghost, title, deco = {}, placeholder }) {
  const L = look(kind, neg, ctx);
  const w = (kind === "k" ? (L.shape === "stick" ? 12 : 26) : 30) * z;
  const h = (L.shape === "stick" ? 30 : kind === "k" ? 26 : 30) * z;
  const ring = deco.mark ? `0 0 0 3px rgba(168,130,60,.60)` : deco.glow ? `0 0 0 3px rgba(44,95,138,.55)` : null;
  if (placeholder) return (
    <div style={{
      width: w, height: h, borderRadius: L.shape === "round" ? "50%" : 5 * z,
      border: `2px dashed ${C.brassDark}`, opacity: .7, background: "rgba(168,130,60,.12)",
    }} />
  );
  return (
    <button data-piece={kind} data-neg={neg ? "1" : "0"}
      onPointerDown={onPointerDown}
      onPointerEnter={onHover ? () => onHover(kind) : undefined}
      onPointerLeave={onHover ? () => onHover(null) : undefined}
      title={title} style={{
        width: w, height: h, padding: 0, touchAction: "none", userSelect: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: L.shape === "round" ? "50%" : 5 * z,
        background: L.bg, border: `1.5px solid ${L.border}`, color: L.fg,
        fontSize: (L.small || label ? 10 : 14) * z, fontWeight: 700,
        fontFamily: kind === "k" ? MONO : SERIF, fontStyle: kind === "k" ? "normal" : "italic",
        boxShadow: [ring, ghost ? "0 6px 14px rgba(0,0,0,.35)" : "0 1px 2px rgba(0,0,0,.28)"].filter(Boolean).join(", "),
        cursor: onPointerDown ? "grab" : "default",
        opacity: deco.dim ? 0.3 : 1,
        transform: ghost ? "scale(1.15)" : deco.mark || deco.glow ? "translateY(-3px)" : "none",
        transition: "transform .18s ease, box-shadow .18s ease, opacity .18s ease",
        animation: deco.enter ? "waageDrop .42s cubic-bezier(.34,1.3,.5,1)" : deco.mark ? "waagePulse 1.1s ease-in-out infinite" : "none",
      }}>{label !== undefined ? label : L.label}</button>
  );
}
function pieces(count, kind, ctx, z, onDown, opts = {}) {
  const out = []; const v = fVal(count);
  if (v === 0) return out;
  const neg = v < 0, abs = fAbs(count);
  const down = onDown ? (e) => onDown(e, neg ? -1 : 1) : undefined;
  if (!isInt(abs)) return [<Piece key={kind + "f"} kind={kind} neg={neg} ctx={ctx} z={z} onHover={opts.onHover}
    deco={{ glow: opts.glow }} label={fStr(abs) + (kind === "k" ? "" : ctx.sym[kind])} onPointerDown={down} />];
  const n = abs.n, shown = Math.min(n, 14);
  for (let i = 0; i < shown; i++) {
    const last = i === shown - 1;
    out.push(<Piece key={kind + i} kind={kind} neg={neg} ctx={ctx} z={z} onPointerDown={down} onHover={opts.onHover}
      deco={{
        dim: opts.dimLast && last, mark: opts.markLast && last, glow: opts.glow,
        enter: opts.enterFrom != null && i >= opts.enterFrom,
      }} />);
  }
  if (n > 14) out.push(<span key={kind + "r"} style={{ fontFamily: MONO, fontSize: 12 * z, color: C.ink2, alignSelf: "center" }}>+{n - 14}</span>);
  return out;
}

/* ================= Waage ================= */
function Waage({ scale, xv, yv, z, ctx, active, onFocus, onPieceDown, hot, stage, drag, coupled, hl, setHl, enter, broken, phase, hint }) {
  const arm = 132 * z, beamY = 232 * z, cx = 200 * z, panW = 176 * z;
  const staged = stage && stage.scaleId === scale.id;
  const diff = panVal(scale.L, xv, yv) - panVal(scale.R, xv, yv);
  const angle = staged ? 0 : Math.max(-11, Math.min(11, diff * 2.2));
  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a) * arm, dy = Math.sin(a) * arm;
  const balanced = Math.abs(diff) < 1e-9;
  const mine = drag && drag.from !== "tray" && drag.from.scaleId === scale.id;

  const renderGroups = (p) => {
    const n = stage.n;
    const part = stage.type === "div" ? panScale(p, F(1, n)) : p;
    return (
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} style={{
            border: `1.5px dashed ${i === 0 && stage.type === "div" ? C.ok : C.brassDark}`,
            borderRadius: 6, padding: 3, display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center",
            background: i === 0 && stage.type === "div" ? "rgba(62,122,86,.12)" : "transparent",
          }}>
            {KIND.flatMap((k) => pieces(part[k], k, ctx, z * 0.8, null))}
          </div>
        ))}
      </div>
    );
  };

  const renderPan = (side) => {
    const p = scale[side];
    const isHot = hot === `pan:${scale.id}:${side}`;
    const fromHere = mine && drag.from.side === side;
    const partnerHere = mine && coupled && drag.from.side !== side;
    const trayGhost = drag && drag.from === "tray" && (coupled || isHot);
    return (
      <div data-drop={`pan:${scale.id}:${side}`} style={{
        position: "absolute", left: cx + (side === "L" ? -dx : dx), top: beamY + (side === "L" ? dy : -dy),
        transform: "translate(-50%,-100%)", width: panW,
        transition: "left .5s cubic-bezier(.34,1.25,.5,1), top .5s cubic-bezier(.34,1.25,.5,1)",
      }}>
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 4 * z, justifyContent: "center", alignItems: "flex-end",
          minHeight: 42 * z, padding: `${6 * z}px ${6 * z}px ${8 * z}px`,
          borderBottom: `${4 * z}px solid ${C.brassDark}`, borderRadius: "3px 3px 6px 6px",
          background: isHot ? "rgba(168,130,60,.30)" : "rgba(168,130,60,.10)",
          outline: isHot ? `2px dashed ${C.brassDark}` : "none",
          transition: "background .2s ease",
        }}>
          {staged ? renderGroups(p)
            : panEmpty(p) && !trayGhost ? <span style={{ fontFamily: MONO, fontSize: 12 * z, color: C.ink2 }}>leer</span>
              : KIND.flatMap((k) => pieces(p[k], k, ctx, z, (e, sign) => onPieceDown(e, k, { scaleId: scale.id, side, sign }), {
                dimLast: fromHere && drag.kind === k,
                markLast: partnerHere && drag.kind === k,
                glow: hl && hl.scaleId === scale.id && hl.side === side && hl.kind === k,
                enterFrom: enter && enter[`${scale.id}:${side}:${k}`],
                onHover: (kk) => setHl(kk ? { scaleId: scale.id, side, kind: kk } : null),
              }))}
          {trayGhost && !staged && <Piece placeholder kind={drag.kind} neg={drag.sign < 0} ctx={ctx} z={z} />}
        </div>
        <div style={{ textAlign: "center", fontFamily: MONO, fontSize: 13 * z, marginTop: 4 * z }}>{termStr(p, ctx.sym)}</div>
      </div>
    );
  };

  return (
    <div onPointerDown={onFocus} style={{
      position: "relative", width: 400 * z, height: 318 * z, margin: "0 auto",
      outline: active ? `2px solid ${C.brass}` : "2px solid transparent", borderRadius: 10,
    }}>
      {renderPan("L")}{renderPan("R")}
      <div style={{
        position: "absolute", left: cx - arm, top: beamY - 5 * z, width: arm * 2, height: 10 * z,
        background: `linear-gradient(180deg, ${C.brass}, ${C.brassDark})`, borderRadius: 5 * z,
        transform: `rotate(${angle}deg)`, transformOrigin: "50% 50%",
        transition: "transform .5s cubic-bezier(.34,1.45,.5,1)",
        boxShadow: "0 1px 3px rgba(0,0,0,.3)",
      }} />
      <div style={{ position: "absolute", left: cx - 6 * z, top: beamY - 12 * z, width: 12 * z, height: 12 * z, borderRadius: "50%", background: C.brassDark, border: `2px solid ${C.brass}` }} />
      <div style={{ position: "absolute", left: cx - 5 * z, top: beamY, width: 10 * z, height: 40 * z, background: C.wood }} />
      <div style={{ position: "absolute", left: cx - 46 * z, top: beamY + 38 * z, width: 92 * z, height: 10 * z, borderRadius: 4, background: C.wood }} />
      <div style={{
        position: "absolute", left: cx - 110 * z, top: beamY + 52 * z, width: 220 * z, textAlign: "center",
        fontFamily: MONO, fontSize: 11 * z, color: staged ? C.brassDark : broken ? C.neg : balanced ? C.ok : C.neg,
      }}>{staged ? (stage.type === "div" ? `in ${stage.n} gleiche Haufen geteilt` : `${stage.n}-mal nebeneinander`)
        : broken ? "nicht mehr äquivalent zur Aufgabe"
          : hint ? hint
            : balanced ? "im Gleichgewicht" : diff > 0 ? "links schwerer" : "rechts schwerer"}</div>
      <div style={{
        position: "absolute", left: cx - 110 * z, top: beamY + 68 * z, width: 220 * z, textAlign: "center",
        fontFamily: MONO, fontSize: 14 * z, fontWeight: 700, color: C.ink,
      }}>{eqOf(scale.L, scale.R, ctx.sym)}</div>
      <div style={{ position: "absolute", left: 0, top: 0, fontFamily: SERIF, fontSize: 20 * z, fontWeight: 700, color: C.brassDark }}>
        ({scale.label}){phase === "bauen" && <span style={{ fontFamily: MONO, fontSize: 11 * z, color: C.ink2, paddingLeft: 6 }}>Aufbau</span>}
      </div>
    </div>
  );
}

/* ================= App ================= */
export default function WaagemodellApp() {
  const [mode, setMode] = useState("einzeln");
  const [scales, setScales] = useState(() => [mkScale("I", P(), P())]);
  const [task, setTask] = useState([]);
  const [phase, setPhase] = useState("bauen");
  const [activeId, setActiveId] = useState(1);
  const [partnerId, setPartnerId] = useState(null);
  const [anti, setAnti] = useState(false);
  const [coupled, setCoupled] = useState(true);
  const [ctxKey, setCtxKey] = useState("algebra");
  const [xv, setXv] = useState(1);
  const [yv, setYv] = useState(1);
  const [edit, setEdit] = useState(false);
  const [amount, setAmount] = useState(1);
  const [past, setPast] = useState([]);
  const [presenting, setPresenting] = useState(false);
  const [eq1, setEq1] = useState("3x + 2 = x + 8");
  const [eq2, setEq2] = useState("2x + y = 12");
  const [pending, setPending] = useState(null);
  const [stage, setStage] = useState(null);
  const [level, setLevel] = useState(1);
  const [guessX, setGuessX] = useState("");
  const [guessY, setGuessY] = useState("");
  const [log, setLog] = useState([]);
  const [showTeacher, setShowTeacher] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [msg, setMsg] = useState({ t: "Zieh die Teile mit Maus oder Finger. Bei gekoppeltem Ziehen passiert dasselbe auf beiden Waagschalen.", ok: true });
  const [probing, setProbing] = useState(false);
  const [hl, setHl] = useState(null);
  const [enter, setEnter] = useState(null);
  const [fly, setFly] = useState([]);
  const flyId = useRef(0);
  const enterTimer = useRef(null);
  const flyTimers = useRef([]);
  useEffect(() => () => { clearTimeout(enterTimer.current); flyTimers.current.forEach(clearTimeout); }, []);
  const rootRef = useRef(null);

  const ctx = CONTEXTS[ctxKey];
  const active = scales.find((s) => s.id === activeId) || scales[0];
  const partner = scales.find((s) => s.id === partnerId && s.id !== active.id) || scales.find((s) => s.id !== active.id) || null;
  const hasY = mode === "lgs" || scales.some((s) => !fZero(s.L.y) || !fZero(s.R.y));

  const [vp, setVp] = useState({ w: 1024, h: 768 });
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth || 1024, h: window.innerHeight || 768 });
    on();
    window.addEventListener("resize", on);
    window.addEventListener("orientationchange", on);
    return () => { window.removeEventListener("resize", on); window.removeEventListener("orientationchange", on); };
  }, []);
  const landscape = vp.w >= vp.h;
  const twoUp = scales.length > 1;
  const z = useMemo(() => {
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    if (!presenting) return clamp((vp.w - 40) / 410, 0.62, 1);
    const cols = twoUp && landscape ? 2 : 1;
    const paneW = (landscape ? vp.w * 0.58 : vp.w) - 60;
    const paneH = (landscape ? vp.h - 170 : vp.h * (twoUp ? 0.30 : 0.52)) - 20;
    return clamp(Math.min(paneW / (cols * 410), paneH / 325), 0.6, 2.4);
  }, [presenting, vp, landscape, twoUp]);

  const amt = Math.max(1, Math.round(Number(amount) || 1));
  const amtSplit = Math.max(2, amt);

  const warn = (kind, t) => { setMsg({ t, ok: false }); setLog((l) => [...l, { kind, t, when: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), eq: eqOf(active.L, active.R, ctx.sym) }]); };

  /* ---- Lösung & Probe ---- */
  const loesung = useMemo(() => {
    const base = task && task.length ? task : [{ L: scales[0].L, R: scales[0].R }];
    if (base.length === 1) {
      const b0 = base[0];
      if (!fZero(b0.L.y) || !fZero(b0.R.y)) return { text: "zwei Variablen – Lösungspaare probieren" };
      const a = fSub(b0.L.x, b0.R.x), b = fSub(b0.R.k, b0.L.k);
      if (fZero(a)) return { text: fZero(b) ? "alle Zahlen sind Lösung" : "keine Lösung" };
      const x = fDiv(b, a); return { x, text: `${ctx.sym.x} = ${fStr(x)}` };
    }
    const [A, B] = base;
    const a1 = fSub(A.L.x, A.R.x), b1 = fSub(A.L.y, A.R.y), c1 = fSub(A.R.k, A.L.k);
    const a2 = fSub(B.L.x, B.R.x), b2 = fSub(B.L.y, B.R.y), c2 = fSub(B.R.k, B.L.k);
    const det = fSub(fMul(a1, b2), fMul(a2, b1));
    if (fZero(det)) return { text: "keine eindeutige Lösung" };
    const x = fDiv(fSub(fMul(c1, b2), fMul(c2, b1)), det);
    const y = fDiv(fSub(fMul(a1, c2), fMul(a2, c1)), det);
    return { x, y, text: `${ctx.sym.x} = ${fStr(x)},  ${ctx.sym.y} = ${fStr(y)}` };
  }, [scales, task, ctx]);

  const probe = useMemo(() => {
    if (!loesung.x || !task) return null;
    const xn = fVal(loesung.x), yn = loesung.y ? fVal(loesung.y) : 0;
    return task.map((t, i) => ({ i, l: panVal(t.L, xn, yn), r: panVal(t.R, xn, yn), eq: eqOf(t.L, t.R, ctx.sym), ok: Math.abs(panVal(t.L, xn, yn) - panVal(t.R, xn, yn)) < 1e-9 }));
  }, [loesung, task, ctx]);

  const solNums = useMemo(() => {
    if (phase !== "umformen" || !loesung.x) return null;
    return { x: fVal(loesung.x), y: loesung.y ? fVal(loesung.y) : 1 };
  }, [phase, loesung]);

  const anzeige = (s) => {
    if (probing) return { x: xv, y: yv, ok: true, hint: null };
    if (solNums) return { ...solNums, ok: true, hint: null };
    const lv = levelValues(s.L, s.R, xv, yv);
    if (!lv.ok) return { ...lv, hint: "so kommt sie nie ins Gleichgewicht" };
    const nice = (f, v) => (f ? fStr(f) : Math.round(v * 100) / 100);
    let hint = null;
    if (!fZero(fSub(s.L.x, s.R.x)) && fZero(fSub(s.L.y, s.R.y))) hint = `im Gleichgewicht, wenn ${ctx.sym.x} = ${nice(lv.xF, lv.x)}`;
    else if (fZero(fSub(s.L.x, s.R.x)) && !fZero(fSub(s.L.y, s.R.y))) hint = `im Gleichgewicht, wenn ${ctx.sym.y} = ${nice(lv.yF, lv.y)}`;
    return { ...lv, hint };
  };

  /* ---- Zustand ---- */
  const commit = (next, message) => { setPast((p) => [...p.slice(-40), scales]); setScales(next); setStage(null); if (message) setMsg(message); };
  const undo = () => { if (!past.length) return; setScales(past[past.length - 1]); setPast(past.slice(0, -1)); setStage(null); setMsg({ t: "Ein Schritt zurück.", ok: true }); };

  /* ---- Animationen ---- */
  const rectOf = (sel) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect() : null; };
  const animatePan = (id, kind, pairs) => {
    const target = rectOf('[data-drop="tray"]');
    const items = []; const entering = {};
    ["L", "R"].forEach((side, i) => {
      const pr = pairs[i]; if (!pr) return;
      const [o, nv] = pr.map(Math.abs);
      if (!Number.isInteger(o)) return;
      if (nv < o) {
        const els = document.querySelectorAll(`[data-drop="pan:${id}:${side}"] [data-piece="${kind}"]`);
        Array.from(els).slice(-(o - nv)).forEach((el) => {
          const r = el.getBoundingClientRect();
          items.push({
            id: ++flyId.current, kind, neg: el.getAttribute("data-neg") === "1",
            x: r.left, y: r.top,
            dx: target ? target.left + target.width / 2 - r.left - r.width / 2 : 0,
            dy: target ? target.top + 18 - r.top : 70,
          });
        });
      } else if (nv > o) entering[`${id}:${side}:${kind}`] = o;
    });
    if (items.length) {
      setFly((f) => [...f, ...items]);
      const t = setTimeout(() => {
        setFly((f) => f.filter((v) => !items.some((i2) => i2.id === v.id)));
        flyTimers.current = flyTimers.current.filter((x) => x !== t);
      }, 460);
      flyTimers.current.push(t);
    }
    if (Object.keys(entering).length) {
      setEnter(entering);
      clearTimeout(enterTimer.current);
      enterTimer.current = setTimeout(() => setEnter(null), 480);
    }
  };

  const bothSides = (id, kind, n) => {
    const s = scales.find((v) => v.id === id); if (!s || n === 0) return;
    const d = { x: F(0), y: F(0), k: F(0) }; d[kind] = F(n);
    const L = panAdd(s.L, d), R = panAdd(s.R, d);
    if (!anti && [L, R].some((p) => KIND.some((k) => fVal(p[k]) < 0))) {
      warn("zu-viel", "So viele Teile liegen nicht auf beiden Waagschalen. Nimm weniger – oder schalte die Antikugeln ein."); return;
    }
    animatePan(id, kind, [[fVal(s.L[kind]), fVal(L[kind])], [fVal(s.R[kind]), fVal(R[kind])]]);
    const wort = kind === "k" ? (Math.abs(n) === 1 ? `ein ${ctx.unit}` : `${Math.abs(n)} ${ctx.unit}e`) : `${Math.abs(n)}× ${kind === "x" ? ctx.xName : ctx.yName}`;
    commit(scales.map((v) => (v.id === id ? withStep(v, L, R, { op: "add", kind, n }) : v)),
      { t: `Auf beiden Seiten ${wort} ${n < 0 ? "weggenommen" : "dazugelegt"} – das Gleichgewicht bleibt.`, ok: true });
  };
  const oneSide = (id, side, kind, n) => {
    const s = scales.find((v) => v.id === id); if (!s) return;
    const d = { x: F(0), y: F(0), k: F(0) }; d[kind] = F(n);
    const np = panAdd(s[side], d);
    if (!anti && KIND.some((k) => fVal(np[k]) < 0)) { warn("zu-viel", "Dort liegt nichts mehr, was du wegnehmen könntest."); return; }
    const L = side === "L" ? np : s.L, R = side === "R" ? np : s.R;
    animatePan(id, kind, side === "L" ? [[fVal(s.L[kind]), fVal(L[kind])], null] : [null, [fVal(s.R[kind]), fVal(R[kind])]]);
    setPast((p) => [...p.slice(-40), scales]);
    setScales(scales.map((v) => (v.id === id ? withStep(v, L, R, { op: "one", side }, true) : v)));
    setStage(null);
    warn("einseitig", "Nur eine Seite verändert – die Waage kippt und es steht eine andere Gleichung da. Zum Umformen musst du beide Seiten gleich behandeln.");
  };

  /* ---- Teilen & Vervielfachen als Handlung ---- */
  const startStage = (type) => {
    const n = amtSplit;
    if (type === "div") {
      const teilbar = [active.L, active.R].every((p) => KIND.every((k) => isInt(fDiv(p[k], F(n)))));
      if (!teilbar) { warn("teilt-nicht", `Die Waagschalen lassen sich nicht in ${n} gleich große Haufen zerlegen. Probiere einen anderen Teiler.`); return; }
    }
    setStage({ scaleId: active.id, type, n });
    setMsg({ t: type === "div" ? `Beide Waagschalen sind in ${n} gleich schwere Haufen zerlegt. Nimm auf beiden Seiten ${n - 1} Haufen weg – ein Haufen bleibt liegen.` : `Beide Waagschalen ${n}-mal nebeneinander gelegt. Schütte sie zusammen – das Gleichgewicht bleibt.`, ok: true });
  };
  const applyStage = () => {
    if (!stage) return;
    const s = scales.find((v) => v.id === stage.scaleId);
    const f = stage.type === "div" ? F(1, stage.n) : F(stage.n);
    commit(scales.map((v) => (v.id === s.id ? withStep(v, panScale(s.L, f), panScale(s.R, f), { op: stage.type, n: stage.n }) : v)),
      { t: stage.type === "div" ? "Auf jeder Seite ist ein Haufen liegen geblieben." : "Zusammengeschüttet.", ok: true });
    setStage(null);
  };
  const swapSides = () => commit(scales.map((v) => (v.id === active.id ? withStep(v, v.R, v.L, { op: "swap" }) : v)), { t: "Die Waagschalen wurden vertauscht.", ok: true });

  /* ---- Drag & Drop ---- */
  const dragRef = useRef(null);
  const [dragView, setDragView] = useState(null);
  const [hot, setHot] = useState(null);
  const startDrag = (e, kind, from, sign = 1) => {
    e.preventDefault(); e.stopPropagation();
    dragRef.current = { kind, from, sign, x0: e.clientX, y0: e.clientY, moved: false };
    setDragView({ kind, sign, from, x: e.clientX, y: e.clientY });
  };
  const dropTargetAt = (cx2, cy2) => {
    if (typeof document === "undefined" || typeof document.elementFromPoint !== "function") return null;
    const el = document.elementFromPoint(cx2, cy2);
    const node = el && el.closest ? el.closest("[data-drop]") : null;
    return node ? node.getAttribute("data-drop") : null;
  };
  useEffect(() => {
    if (!dragView) return;
    const move = (e) => {
      const d = dragRef.current; if (!d) return;
      if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 6) d.moved = true;
      setDragView({ kind: d.kind, sign: d.sign, from: d.from, x: e.clientX, y: e.clientY });
      setHot(dropTargetAt(e.clientX, e.clientY));
    };
    const up = (e) => {
      const d = dragRef.current; dragRef.current = null; setDragView(null); setHot(null);
      if (!d) return;
      handleDrop(d, dropTargetAt(e.clientX, e.clientY));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
  }, [dragView, scales, coupled, anti, activeId, ctxKey, phase, stage]);

  const buildDrop = (id, side, kind, n) => {
    const s = scales.find((v) => v.id === id); if (!s || !n) return;
    const oldV = fVal(s[side][kind]);
    const nv = fAdd(s[side][kind], F(n));
    if (!anti && fVal(nv) < 0) { setMsg({ t: "Auf dieser Waagschale liegt nichts mehr davon.", ok: false }); return; }
    const p = { ...s[side], [kind]: nv };
    animatePan(id, kind, side === "L" ? [[oldV, fVal(nv)], null] : [null, [oldV, fVal(nv)]]);
    const next = scales.map((v) => {
      if (v.id !== id) return v;
      const ns = { ...v, [side]: p };
      return { ...ns, prot: [{ L: ns.L, R: ns.R, note: null }] };
    });
    commit(next, { t: "Aufbau: die Gleichung entsteht Stück für Stück mit.", ok: true });
    setTask([]);
  };

  function handleDrop(d, target) {
    if (stage) { setMsg({ t: "Erst den Teilen-Schritt abschließen oder abbrechen.", ok: false }); return; }
    const bauen = phase === "bauen";
    const fromPan = d.from !== "tray";
    const take = () => (bauen ? buildDrop(d.from.scaleId, d.from.side, d.kind, -d.from.sign)
      : coupled ? bothSides(d.from.scaleId, d.kind, -d.from.sign)
        : oneSide(d.from.scaleId, d.from.side, d.kind, -d.from.sign));
    if (!d.moved && fromPan) { take(); return; }
    if (!d.moved && !fromPan) {
      if (bauen) buildDrop(activeId, "L", d.kind, d.sign); else bothSides(activeId, d.kind, d.sign);
      return;
    }
    if (!target) { setMsg({ t: "Leg die Teile auf eine Waagschale oder zurück in die Kiste.", ok: false }); return; }
    if (target === "tray") { if (fromPan) take(); return; }
    const parts = target.split(":"); const scaleId = Number(parts[1]), side = parts[2];
    if (fromPan) {
      if (d.from.scaleId !== scaleId) { warn("umtragen", "Teile lassen sich nicht von einer Waage zur anderen tragen. Dafür gibt es Einsetzen und Gleichsetzen."); return; }
      if (d.from.side !== side) {
        if (bauen) { buildDrop(scaleId, d.from.side, d.kind, -d.from.sign); buildDrop(scaleId, side, d.kind, d.from.sign); return; }
        warn("hinueber", "Ein Teil auf die andere Waagschale zu legen verändert das Gleichgewicht. Nimm es stattdessen auf beiden Seiten weg."); return;
      }
      return;
    }
    if (bauen) buildDrop(scaleId, side, d.kind, d.sign);
    else if (coupled) bothSides(scaleId, d.kind, d.sign);
    else oneSide(scaleId, side, d.kind, d.sign);
  }

  /* ---- LGS ---- */
  const isolated = (s) => {
    const test = (p, q) => {
      if (fVal(p.x) === 1 && fZero(p.y) && fZero(p.k)) return { v: "x", expr: q };
      if (fVal(p.y) === 1 && fZero(p.x) && fZero(p.k)) return { v: "y", expr: q };
      return null;
    };
    return test(s.L, s.R) || test(s.R, s.L);
  };
  const einsetzen = (srcId, dstId) => {
    const src = scales.find((s) => s.id === srcId), dst = scales.find((s) => s.id === dstId);
    const iso = isolated(src);
    if (!iso) { warn("einsetzen", `Zum Einsetzen muss auf Waage (${src.label}) ein einzelner Block allein auf einer Waagschale liegen.`); return; }
    const rep = (p) => {
      const c = iso.v === "x" ? p.x : p.y;
      const rest = iso.v === "x" ? { ...p, x: F(0) } : { ...p, y: F(0) };
      return panAdd(rest, panScale(iso.expr, c));
    };
    commit([...scales, mkScale(`${dst.label}′`, rep(dst.L), rep(dst.R))],
      { t: `Jeder ${iso.v === "x" ? ctx.xName : ctx.yName} aus (${dst.label}) wurde durch den Inhalt der anderen Waagschale von (${src.label}) ersetzt – beides wiegt ja gleich viel.`, ok: true });
    setActiveId(uid);
  };
  const gleichsetzen = (aId, bId) => {
    const A = scales.find((s) => s.id === aId), B = scales.find((s) => s.id === bId);
    const ia = isolated(A), ib = isolated(B);
    if (!ia || !ib || ia.v !== ib.v) { warn("gleichsetzen", "Zum Gleichsetzen muss auf beiden Waagen derselbe einzelne Block allein liegen."); return; }
    commit([...scales, mkScale(`${A.label}=${B.label}`, ia.expr, ib.expr)], { t: `Beide Waagen tragen dasselbe – also wiegen auch die beiden anderen Waagschalen gleich viel.`, ok: true });
    setActiveId(uid);
  };
  const addieren = (aId, bId, minus) => {
    const A = scales.find((s) => s.id === aId), B = scales.find((s) => s.id === bId), f = F(minus ? -1 : 1);
    commit([...scales, mkScale(`${A.label}${minus ? "−" : "+"}${B.label}`, panAdd(A.L, panScale(B.L, f)), panAdd(A.R, panScale(B.R, f)))],
      { t: minus ? `Von jeder Waagschale von (${A.label}) wurde der Inhalt von (${B.label}) abgenommen.` : `Der Inhalt von (${B.label}) wurde auf die passenden Waagschalen von (${A.label}) geschüttet.`, ok: true });
    setActiveId(uid);
  };

  /* ---- Laden ---- */
  const setup = (list, m, ph = "umformen") => {
    uid = 0;
    const ns = list.map((p, i) => mkScale(i === 0 ? "I" : "II", p.L, p.R));
    setPast([]); setScales(ns); setTask(ph === "umformen" ? list.map((p) => ({ L: p.L, R: p.R })) : []);
    setActiveId(1); setMode(m); setXv(1); setYv(1); setStage(null); setPending(null); setGuessX(""); setGuessY(""); setPhase(ph); setProbing(false);
  };
  const leereWaage = (m) => {
    setup(m === "lgs" ? [{ L: P(), R: P() }, { L: P(), R: P() }] : [{ L: P(), R: P() }], m, "bauen");
    setMsg({ t: "Leere Waage im Gleichgewicht. Leg Teile auf – die Gleichung entsteht rechts mit.", ok: true });
  };
  const startUmformen = () => {
    if (scales.every((s) => panEmpty(s.L) && panEmpty(s.R))) { setMsg({ t: "Die Waage ist noch leer. Leg erst Teile auf.", ok: false }); return; }
    const ns = scales.map((s) => ({ ...s, prot: [{ L: s.L, R: s.R, note: null }] }));
    commit(ns, { t: "Ab jetzt zählt nur noch, was auf beiden Seiten gleichzeitig passiert.", ok: true });
    setTask(ns.slice(0, mode === "lgs" ? 2 : 1).map((s) => ({ L: s.L, R: s.R })));
    setPhase("umformen");
  };
  const build = (id, side, item, delta) => {
    const next = scales.map((s) => {
      if (s.id !== id) return s;
      const p = { ...s[side], [item]: fAdd(s[side][item], F(delta)) };
      if (!anti && fVal(p[item]) < 0) return s;
      const ns = { ...s, [side]: p };
      return { ...ns, prot: [{ L: ns.L, R: ns.R, note: null }] };
    });
    commit(next);
    setTask(phase === "bauen" ? [] : next.slice(0, mode === "lgs" ? 2 : 1).map((s) => ({ L: s.L, R: s.R })));
  };
  const load = (m, i) => {
    if (m === "einzeln") { const a = A1[i]; setup([{ L: a.L, R: a.R }], m); }
    else { const a = A2[i]; setup([a.A, a.B], m); }
    setMsg({ t: "Neue Aufgabe. Nimm auf beiden Seiten dasselbe weg, bis ein Block allein liegt.", ok: true });
  };
  const zufall = (lvl) => {
    const g = lvl === 4 ? genNeg() : genTask(lvl);
    setup(g.scales, g.mode);
    if (lvl === 4) setAnti(true);
    setLevel(lvl);
    setMsg({ t: (LEVELS.find((l) => l.id === lvl) || {}).hint || "Los geht's.", ok: true });
  };
  const buildFromInput = () => {
    try {
      const list = mode === "einzeln" ? [eq1] : [eq1, eq2];
      const parsed = list.map(parseEquation);
      if (parsed.some((p) => !representable(p.L, p.R))) {
        setPending(parsed);
        setMsg({ t: "So lässt sich das noch nicht auflegen – es kämen negative Anzahlen oder Bruchteile vor. Ich kann es mit erlaubten Umformungen passend machen.", ok: false });
        return;
      }
      setup(parsed, mode);
      setMsg({ t: "Waage aufgebaut. Jedes Teil steht für einen Summanden der Gleichung.", ok: true });
    } catch (err) { setPending(null); warn("eingabe", String(err.message || err)); }
  };
  const fixPending = () => {
    if (!pending) return;
    uid = 0;
    const ns = pending.map((p, i) => {
      const r = repairSteps(p.L, p.R);
      let cur = mkScale(i === 0 ? "I" : "II", p.L, p.R), L = p.L, R = p.R;
      r.steps.forEach((st) => {
        let nl, nr;
        if (st.op === "mul") { nl = panScale(L, F(st.n)); nr = panScale(R, F(st.n)); }
        else { const d = { x: F(0), y: F(0), k: F(0) }; d[st.kind] = F(st.n); nl = panAdd(L, d); nr = panAdd(R, d); }
        cur = withStep(cur, nl, nr, st); L = nl; R = nr;
      });
      return cur;
    });
    setPast([]); setScales(ns); setTask(pending.map((p) => ({ L: p.L, R: p.R }))); setActiveId(1); setPending(null); setStage(null); setPhase("umformen");
    setMsg({ t: "Die nötigen Umformungen stehen im Protokoll – danach liegt alles im positiven Bereich und passt auf die Waage.", ok: true });
  };

  /* ---- Selbstkontrolle ---- */
  const pruefen = () => {
    if (!loesung.x) { setMsg({ t: "Für diese Aufgabe gibt es keine eindeutige Lösung.", ok: false }); return; }
    const p = (s) => { const m = String(s).replace(",", ".").trim(); if (!m) return null; if (m.includes("/")) { const [a, b] = m.split("/"); return Number(a) / Number(b); } return Number(m); };
    const gx = p(guessX), gy = p(guessY);
    const okX = gx !== null && Math.abs(gx - fVal(loesung.x)) < 1e-9;
    const okY = !loesung.y || (gy !== null && Math.abs(gy - fVal(loesung.y)) < 1e-9);
    if (okX && okY) { setMsg({ t: "Richtig – setze zur Sicherheit noch in die Ausgangsgleichung ein, die Probe steht rechts.", ok: true }); if (loesung.x) setXv(fVal(loesung.x)); if (loesung.y) setYv(fVal(loesung.y)); setProbing(true); }
    else warn("loesung-falsch", "Das stimmt noch nicht. Stell die Blockgewichte mit dem Regler ein und schau, wann die Waage waagerecht steht.");
  };

  /* ---- Arbeitsblatt ---- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sheetHTML = (leer, mitLog) => {
    const rows = scales.map((s) => `<h3>Waage (${esc(s.label)})</h3><table>${s.prot.map((r) => `<tr><td class="eq">${esc(eqOf(r.L, r.R, ctx.sym))}</td><td class="op">${leer ? "" : (r.note ? (r.bad ? "⚠ " : "| ") + esc(noteStr(r.note, ctx.sym)) : "")}</td></tr>`).join("")}</table>`).join("");
    const leerzeilen = leer ? `<table>${"<tr><td class='eq'>&nbsp;</td><td class='op'>|</td></tr>".repeat(6)}</table>` : "";
    const logHTML = mitLog && log.length ? `<h3>Notierte Stolperstellen</h3><ul>${log.map((l) => `<li><b>${esc(l.when)}</b> · ${esc(l.kind)} · ${esc(l.eq)} — ${esc(l.t)}</li>`).join("")}</ul>` : "";
    return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Waagemodell – Arbeitsblatt</title>
<style>body{font-family:Georgia,serif;color:#22312B;max-width:700px;margin:32px auto;padding:0 16px}
h1{font-size:22px;border-bottom:2px solid #22312B;padding-bottom:6px}h3{margin:18px 0 4px;font-size:15px;color:#7A5B22}
table{border-collapse:collapse;width:100%}td{padding:4px 0;font-family:Menlo,monospace;font-size:15px}
td.eq{border-bottom:1px dotted #bbb}td.op{width:150px;color:#7A5B22;border-bottom:1px dotted #bbb;padding-left:12px}
.meta{font-size:12px;color:#5A6B62}ul{font-size:13px;line-height:1.6}@media print{body{margin:0}}</style></head><body>
<h1>Äquivalenzumformungen am Waagemodell</h1>
<p class="meta">Kontext: ${esc(ctx.name)} · ${esc(ctx.story)}</p>
<h3>Aufgabe</h3><p style="font-family:Menlo,monospace;font-size:17px">${task.map((t) => esc(eqOf(t.L, t.R, ctx.sym))).join("<br>")}</p>
${leer ? "<h3>Dein Rechenweg</h3>" + leerzeilen : rows}
<h3>Lösung</h3><p style="font-family:Menlo,monospace">${leer ? "________________" : esc(loesung.text)}</p>
${leer ? "" : (probe || []).map((p) => `<p class="meta">Probe ${esc(p.eq)}: ${p.l} = ${p.r} ${p.ok ? "✓" : "✗"}</p>`).join("")}
${logHTML}</body></html>`;
  };
  const download = (leer, mitLog) => {
    const html = sheetHTML(leer, mitLog);
    try {
      if (typeof URL === "undefined" || !URL.createObjectURL) throw new Error("kein Download");
      const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      const a = document.createElement("a");
      a.href = url; a.download = `waagemodell-arbeitsblatt${leer ? "-leer" : ""}.html`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setSheet(html);
      setMsg({ t: "Arbeitsblatt heruntergeladen. Falls der Browser das blockiert, steht der Quelltext unten zum Kopieren.", ok: true });
    } catch (e) { setSheet(html); setMsg({ t: "Download nicht möglich – der Quelltext steht unten zum Kopieren.", ok: false }); }
  };

  const gefunden = loesung.x && Math.abs(fVal(loesung.x) - xv) < 1e-9 && (!loesung.y || Math.abs(fVal(loesung.y) - yv) < 1e-9);
  const goFullscreen = () => {
    const el = rootRef.current;
    if (!document.fullscreenElement && el && el.requestFullscreen) el.requestFullscreen().catch(() => { });
    else if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
  };
  const undoRef = useRef(undo);
  const pastRef = useRef(past);
  useEffect(() => { undoRef.current = undo; pastRef.current = past; });
  useEffect(() => {
    let armed = false;
    const arm = () => {
      try {
        const st = window.history.state;
        if (!st || !st.waage) window.history.pushState({ waage: Date.now() }, "");
        armed = true;
      } catch (e) { armed = false; }
    };
    arm();
    const onPop = () => {
      if (!armed) return;
      arm();
      if (pastRef.current.length) undoRef.current();
      else setMsg({ t: "Die Zurück-Taste nimmt hier nur Rechenschritte zurück – die App bleibt offen.", ok: true });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    const key = (e) => {
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); }
      if (e.key === "Escape" && presenting) setPresenting(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [presenting, past, scales]);

  /* ---- UI ---- */
  const btn = (extra = {}) => ({
    fontFamily: MONO, fontSize: 12 * (presenting ? 1.15 : 1), padding: presenting ? "8px 12px" : "6px 10px",
    borderRadius: 6, border: `1px solid ${C.ink2}`, background: "#fff", color: C.ink, cursor: "pointer", ...extra,
  });
  const chip = (on) => btn({ background: on ? C.ink : "#fff", color: on ? C.paper : C.ink, borderColor: C.ink });
  const card = { background: "#fff", border: `1px solid ${C.grid}`, borderRadius: 10, padding: 12 };
  const eyebrow = { fontFamily: MONO, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: C.brassDark, marginBottom: 8 };

  return (
    <div ref={rootRef} style={{
      minHeight: "100%", padding: presenting ? "14px 16px 32px" : "20px 16px 48px", color: C.ink,
      background: `repeating-linear-gradient(0deg, ${C.grid} 0 1px, transparent 1px 26px), repeating-linear-gradient(90deg, ${C.grid} 0 1px, transparent 1px 26px), ${C.paper}`,
      fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
    }}>
      <style>{`
        @keyframes waageFly { to { transform: translate(var(--dx), var(--dy)) scale(.35); opacity: 0 } }
        @keyframes waageDrop { from { transform: translateY(-26px) scale(.75); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes waagePulse { 0%,100% { box-shadow: 0 0 0 3px rgba(168,130,60,.60) } 50% { box-shadow: 0 0 0 8px rgba(168,130,60,.14) } }
        @media (prefers-reduced-motion: reduce) { * { animation-duration: .01ms !important; transition-duration: .01ms !important } }
      `}</style>
      {fly.map((f) => (
        <div key={f.id} style={{
          position: "fixed", left: f.x, top: f.y, zIndex: 55, pointerEvents: "none",
          "--dx": `${f.dx}px`, "--dy": `${f.dy}px`, animation: "waageFly .45s ease-in forwards",
        }}>
          <Piece kind={f.kind} neg={f.neg} ctx={ctx} z={z} />
        </div>
      ))}
      {dragView && (
        <div style={{ position: "fixed", left: dragView.x, top: dragView.y, transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 60 }}>
          <Piece kind={dragView.kind} neg={dragView.sign < 0} ctx={ctx} z={z} ghost />
        </div>
      )}

      <div style={{ maxWidth: presenting ? 1400 : 1120, margin: "0 auto" }}>
        {!presenting && (
          <header style={{ borderBottom: `2px solid ${C.ink}`, paddingBottom: 10, marginBottom: 14 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: C.brassDark }}>Waagemodell</div>
            <h1 style={{ fontFamily: SERIF, fontSize: 30, margin: "2px 0 0", fontWeight: 700 }}>Gleichungen im Gleichgewicht</h1>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: C.ink2, maxWidth: 680 }}>{ctx.story} Jeder Zug erscheint rechts sofort als Äquivalenzumformung.</p>
          </header>
        )}

        <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: 10 }}>
          <button style={chip(presenting)} onClick={() => setPresenting(!presenting)}><Presentation size={12} style={{ display: "inline" }} /> {presenting ? "Präsentation beenden" : "Präsentation"}</button>
          {presenting && <button style={btn()} onClick={goFullscreen}><Maximize2 size={12} style={{ display: "inline" }} /> Vollbild</button>}
          {phase === "bauen"
            ? <button style={btn({ background: C.ok, color: "#fff", borderColor: C.ok })} onClick={startUmformen}>Umformen starten</button>
            : <button style={chip(coupled)} onClick={() => setCoupled(!coupled)}>{coupled ? <Link2 size={12} style={{ display: "inline" }} /> : <Link2Off size={12} style={{ display: "inline" }} />} {coupled ? "beidseitig" : "frei"}</button>}
          <button style={btn()} onClick={() => leereWaage(mode)}>leere Waage</button>
          <button style={btn({ opacity: past.length ? 1 : 0.45 })} onClick={undo}><Undo2 size={12} style={{ display: "inline" }} /> zurück</button>
          <button style={chip(anti)} onClick={() => setAnti(!anti)} title="Rote Antikugeln: eine Kugel und eine Antikugel heben sich auf">Antikugeln {anti ? "an" : "aus"}</button>
          {!presenting && <>
            <select style={btn()} value={ctxKey} onChange={(e) => setCtxKey(e.target.value)}>
              {Object.entries(CONTEXTS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
            <button style={chip(mode === "einzeln")} onClick={() => leereWaage("einzeln")}>Eine Waage</button>
            <button style={chip(mode === "lgs")} onClick={() => leereWaage("lgs")}>Zwei Waagen</button>
            <select style={btn()} value="" onChange={(e) => load(mode, +e.target.value)}>
              <option value="" disabled>Aufgabe wählen …</option>
              {(mode === "einzeln" ? A1 : A2).map((a, i) => <option key={i} value={i}>{a.name}</option>)}
            </select>
            {phase === "bauen" && <button style={chip(edit)} onClick={() => setEdit(!edit)}>Bestücken</button>}
            <button style={chip(showTeacher)} onClick={() => setShowTeacher(!showTeacher)}><GraduationCap size={12} style={{ display: "inline" }} /> Lehrkraft{log.length ? ` (${log.length})` : ""}</button>
          </>}
        </div>

        {!presenting && (
          <div className="flex flex-wrap gap-2" style={{ marginBottom: 12 }}>
            <div style={{ ...card, flex: "1 1 320px" }}>
              <div style={eyebrow}>Aufgabengenerator</div>
              <div className="flex flex-wrap items-center gap-2">
                <select style={btn()} value={level} onChange={(e) => setLevel(+e.target.value)}>
                  {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <button style={btn({ background: C.ink, color: C.paper, borderColor: C.ink })} onClick={() => zufall(level)}>
                  <Dices size={12} style={{ display: "inline" }} /> Zufallsaufgabe
                </button>
                <span style={{ fontSize: 12.5, color: C.ink2, flex: "1 1 160px" }}>{(LEVELS.find((l) => l.id === level) || {}).hint}</span>
              </div>
            </div>
            <div style={{ ...card, flex: "1 1 320px" }}>
              <div style={eyebrow}>Gleichung eintippen</div>
              <div className="flex flex-wrap items-center gap-2">
                <input value={eq1} onChange={(e) => setEq1(e.target.value)} onKeyDown={(e) => e.key === "Enter" && buildFromInput()}
                  placeholder="z. B. 2(x + 3) = 4x − 2"
                  style={{ flex: "1 1 180px", fontFamily: MONO, fontSize: 14, padding: "8px 10px", border: `1px solid ${C.ink2}`, borderRadius: 6 }} />
                {mode === "lgs" && <input value={eq2} onChange={(e) => setEq2(e.target.value)} onKeyDown={(e) => e.key === "Enter" && buildFromInput()}
                  placeholder="zweite Gleichung"
                  style={{ flex: "1 1 180px", fontFamily: MONO, fontSize: 14, padding: "8px 10px", border: `1px solid ${C.ink2}`, borderRadius: 6 }} />}
                <button style={btn({ background: C.ink, color: C.paper, borderColor: C.ink })} onClick={buildFromInput}><Play size={12} style={{ display: "inline" }} /> Waage bauen</button>
                {pending && <button style={btn({ borderColor: C.brassDark, color: C.brassDark })} onClick={fixPending}>waagentauglich machen</button>}
              </div>
            </div>
          </div>
        )}

        {showTeacher && !presenting && (
          <div style={{ ...card, marginBottom: 12 }}>
            <div style={eyebrow}>Stolperstellen in dieser Sitzung</div>
            {log.length === 0 ? <div style={{ fontSize: 13, color: C.ink2 }}>Noch nichts notiert. Hier sammeln sich typische Fehlversuche: einseitiges Verändern, Hinüberschieben, zu viel wegnehmen, nicht aufgehende Teilungen, falsche Lösungen.</div> : (
              <>
                <div className="flex flex-wrap gap-2" style={{ marginBottom: 8 }}>
                  {Object.entries(log.reduce((m, l) => ({ ...m, [l.kind]: (m[l.kind] || 0) + 1 }), {})).map(([k, v]) => (
                    <span key={k} style={{ fontFamily: MONO, fontSize: 12, border: `1px solid ${C.grid}`, borderRadius: 20, padding: "3px 10px" }}>{k} · {v}</span>
                  ))}
                </div>
                <div style={{ maxHeight: 160, overflow: "auto", fontSize: 12.5, lineHeight: 1.55 }}>
                  {log.slice().reverse().map((l, i) => (
                    <div key={i} style={{ borderBottom: `1px dotted ${C.grid}`, padding: "3px 0" }}>
                      <AlertTriangle size={11} color={C.neg} style={{ display: "inline", marginRight: 4 }} />
                      <span style={{ fontFamily: MONO, color: C.ink2 }}>{l.when} · {l.eq}</span> — {l.t}
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="flex flex-wrap gap-2" style={{ marginTop: 10 }}>
              <button style={btn()} onClick={() => download(false, true)}><Printer size={12} style={{ display: "inline" }} /> Arbeitsblatt mit Lösung</button>
              <button style={btn()} onClick={() => download(true, false)}><Printer size={12} style={{ display: "inline" }} /> Blanko zum Ausfüllen</button>
              <button style={btn()} onClick={() => setSheet(sheet ? null : sheetHTML(false, true))}><Copy size={12} style={{ display: "inline" }} /> Quelltext anzeigen</button>
              <button style={btn({ color: C.neg, borderColor: C.neg })} onClick={() => setLog([])}>Protokoll leeren</button>
            </div>
            {sheet && <textarea readOnly value={sheet} onFocus={(e) => e.target.select()} style={{ width: "100%", height: 120, marginTop: 8, fontFamily: MONO, fontSize: 11, padding: 8, border: `1px solid ${C.grid}`, borderRadius: 6 }} />}
          </div>
        )}

        <div className="flex gap-4" style={{
          alignItems: "flex-start",
          flexWrap: presenting && landscape ? "nowrap" : "wrap",
        }}>
          <div style={{ flex: presenting && landscape ? "1 1 58%" : "1 1 460px", minWidth: presenting ? 0 : 340 }}>
            <div data-drop="tray" style={{
              ...card, marginBottom: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              outline: hot === "tray" ? `2px dashed ${C.brassDark}` : "none", background: hot === "tray" ? "rgba(168,130,60,.15)" : "#fff",
            }}>
              <span style={{ ...eyebrow, margin: 0 }}>Kiste</span>
              {["k", "x", ...(hasY ? ["y"] : [])].map((k) => (
                <Piece key={k} kind={k} ctx={ctx} z={z} title={k === "k" ? ctx.unit : k === "x" ? ctx.xName : ctx.yName} onPointerDown={(e) => startDrag(e, k, "tray", 1)} />
              ))}
              {anti && <span style={{ display: "flex", gap: 6, alignItems: "center", paddingLeft: 8, borderLeft: `1px dashed ${C.grid}` }}>
                {["k", "x"].map((k) => <Piece key={"n" + k} kind={k} neg ctx={ctx} z={z} title="Antiteil" onPointerDown={(e) => startDrag(e, k, "tray", -1)} />)}
              </span>}
              <span style={{ fontSize: 12.5, color: C.ink2, flex: "1 1 150px" }}>
                {anti ? "Ein rotes Antiteil und ein normales Teil heben sich gegenseitig auf." : "Auf eine Waagschale ziehen legt dazu, in die Kiste ziehen nimmt weg."}
              </span>
              <Trash2 size={16} color={C.ink2} />
            </div>

            <div className="flex flex-wrap" style={{ gap: 8 }}>
              {scales.map((s, idx) => {
                const az = anzeige(s);
                return (
                <div key={s.id} style={{ flex: `1 1 ${400 * z}px` }}>
                  <Waage scale={s} xv={az.x} yv={az.y} hint={az.hint} z={z} ctx={ctx} hot={hot} stage={stage}
                    drag={dragView} coupled={coupled && phase === "umformen"} hl={hl} setHl={setHl} enter={enter}
                    broken={s.prot.some((r) => r.bad)} phase={phase}
                    active={scales.length > 1 && s.id === activeId}
                    onFocus={() => setActiveId(s.id)}
                    onPieceDown={(e, kind, from) => { setActiveId(s.id); startDrag(e, kind, from, from.sign); }} />
                  {idx >= (task.length || (mode === "lgs" ? 2 : 1)) && (
                    <div style={{ textAlign: "center", marginTop: -6 }}>
                      <button style={btn({ padding: "2px 8px", color: C.ink2 })}
                        onClick={() => { const next = scales.filter((v) => v.id !== s.id); commit(next); if (activeId === s.id) setActiveId(next[0].id); }}>
                        Waage ({s.label}) schließen
                      </button>
                    </div>
                  )}
                  {edit && !presenting && phase === "bauen" && (
                    <div style={{ ...card, marginTop: 4, padding: 8 }}>
                      {["L", "R"].map((side) => (
                        <div key={side} className="flex items-center gap-2" style={{ marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: MONO, fontSize: 12, width: 52 }}>{side === "L" ? "links" : "rechts"}</span>
                          {KIND.map((it) => (
                            <span key={it} className="flex items-center gap-1">
                              <button style={btn({ padding: "2px 7px" })} onClick={() => build(s.id, side, it, -1)}>−</button>
                              <span style={{ fontFamily: MONO, fontSize: 12, minWidth: 28, textAlign: "center" }}>{fStr(s[side][it])}{it === "k" ? "●" : ctx.sym[it]}</span>
                              <button style={btn({ padding: "2px 7px" })} onClick={() => build(s.id, side, it, 1)}>+</button>
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                );
              })}
            </div>

            {stage && (
              <div style={{ ...card, marginTop: 10, borderColor: C.brassDark, background: "rgba(168,130,60,.10)" }}>
                <div className="flex flex-wrap items-center gap-2">
                  <Scissors size={14} color={C.brassDark} />
                  <span style={{ fontSize: 13.5, flex: "1 1 220px" }}>
                    {stage.type === "div" ? `Nimm auf beiden Seiten ${stage.n - 1} von ${stage.n} Haufen weg – der grüne bleibt liegen.` : `Beide Waagschalen liegen ${stage.n}-mal da. Alles zusammenschütten?`}
                  </span>
                  <button style={btn({ background: C.ok, color: "#fff", borderColor: C.ok })} onClick={applyStage}>
                    {stage.type === "div" ? "Haufen wegnehmen" : "zusammenschütten"}
                  </button>
                  <button style={btn()} onClick={() => setStage(null)}>abbrechen</button>
                </div>
              </div>
            )}

            {phase === "bauen" && (
              <div style={{ ...card, marginTop: 10, borderColor: C.ok }}>
                <div style={eyebrow}>Aufbau</div>
                <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13.5, flex: "1 1 220px" }}>
                    Teile aus der Kiste auf die Schalen ziehen – jede Seite für sich. Rechts wächst die Gleichung mit.
                  </span>
                  <button style={btn({ background: C.ok, color: "#fff", borderColor: C.ok })} onClick={startUmformen}>Umformen starten</button>
                </div>
              </div>
            )}

            <div style={{ ...card, marginTop: 10, opacity: phase === "bauen" ? 0.45 : 1, pointerEvents: phase === "bauen" ? "none" : "auto" }}>
              <div style={eyebrow}>Auf beiden Seiten zugleich{scales.length > 1 ? ` — Waage (${active.label})` : ""}</div>
              <div className="flex items-center gap-2" style={{ flexWrap: "wrap", marginBottom: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 12 }}>Anzahl</span>
                <input type="number" min={1} max={20} value={amount} onChange={(e) => setAmount(+e.target.value || 1)}
                  style={{ width: 54, fontFamily: MONO, fontSize: 13, padding: "4px 6px", border: `1px solid ${C.ink2}`, borderRadius: 6 }} />
                {[{ it: "k", lbl: ctx.unit }, { it: "x", lbl: ctx.xName }, ...(hasY ? [{ it: "y", lbl: ctx.yName }] : [])].map((b) => (
                  <span key={b.it} className="flex items-center gap-1">
                    <button title={`${amt} ${b.lbl} auf beiden Seiten wegnehmen`} style={btn({ borderColor: C.neg, color: C.neg })} onClick={() => bothSides(activeId, b.it, -amt)}>− {b.lbl}</button>
                    <button title={`${amt} ${b.lbl} auf beiden Seiten dazulegen`} style={btn({ borderColor: C.ok, color: C.ok })} onClick={() => bothSides(activeId, b.it, amt)}>+ {b.lbl}</button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
                <button style={btn()} onClick={() => startStage("div")}><Divide size={11} style={{ display: "inline" }} /> in {amtSplit} Haufen teilen</button>
                <button style={btn()} onClick={() => startStage("mul")}><XIcon size={11} style={{ display: "inline" }} /> {amtSplit}-mal nebeneinander</button>
                <button style={btn()} onClick={swapSides}><ArrowLeftRight size={11} style={{ display: "inline" }} /> Seiten tauschen</button>
                <button style={btn()} onClick={() => { setPhase("bauen"); setTask([]); setMsg({ t: "Zurück im Aufbau: du kannst jede Seite wieder einzeln verändern.", ok: true }); }}>zurück zum Aufbau</button>
                <button style={btn()} onClick={() => zufall(level)}><RotateCcw size={11} style={{ display: "inline" }} /> neue Aufgabe</button>
              </div>
              {scales.length >= 2 && partner && (
                <div style={{ borderTop: `1px dashed ${C.grid}`, marginTop: 10, paddingTop: 10 }}>
                  <div style={eyebrow}>Waage ({active.label}) verbinden mit</div>
                  <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
                    <select style={btn()} value={partner.id} onChange={(e) => setPartnerId(+e.target.value)}>
                      {scales.filter((s) => s.id !== active.id).map((s) => <option key={s.id} value={s.id}>Waage ({s.label})</option>)}
                    </select>
                    <button style={btn()} onClick={() => einsetzen(partner.id, active.id)}>({partner.label}) in ({active.label}) einsetzen</button>
                    <button style={btn()} onClick={() => einsetzen(active.id, partner.id)}>({active.label}) in ({partner.label}) einsetzen</button>
                    <button style={btn()} onClick={() => gleichsetzen(active.id, partner.id)}>gleichsetzen</button>
                    <button style={btn()} onClick={() => addieren(active.id, partner.id, false)}>({active.label}) + ({partner.label})</button>
                    <button style={btn()} onClick={() => addieren(active.id, partner.id, true)}>({active.label}) − ({partner.label})</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ ...card, marginTop: 10, display: phase === "bauen" ? "none" : "block" }}>
              <div style={eyebrow}>Wie schwer ist ein {ctx.xName}?</div>
              <div style={{ fontSize: 12.5, color: C.ink2, marginBottom: 8 }}>
                {probing
                  ? "Probiermodus: die Waage wiegt mit deinem eingestellten Wert. Stimmt er, steht sie waagerecht."
                  : "Die Waage steht waagerecht, weil die Gleichung gilt. Zum Ausprobieren den Regler bewegen."}
              </div>
              {[["x", xv, setXv, ctxKey === "algebra" ? C.x : C.sack], ...(hasY ? [["y", yv, setYv, C.y]] : [])].map(([sym, val, set, col]) => (
                <div key={sym} className="flex items-center gap-3" style={{ marginBottom: 6 }}>
                  <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, color: col, width: 18 }}>{ctx.sym[sym]}</span>
                  <input type="range" min={-6} max={14} step={0.5} value={val} onChange={(e) => { set(+e.target.value); setProbing(true); }} style={{ flex: 1, accentColor: col }} />
                  <span style={{ fontFamily: MONO, fontSize: 13, width: 42, textAlign: "right" }}>{val}</span>
                </div>
              ))}
              <div className="flex items-center gap-2" style={{ marginTop: 6, flexWrap: "wrap" }}>
                <span style={{ fontFamily: MONO, fontSize: 12 }}>meine Lösung {ctx.sym.x} =</span>
                <input value={guessX} onChange={(e) => setGuessX(e.target.value)} style={{ width: 60, fontFamily: MONO, fontSize: 13, padding: "4px 6px", border: `1px solid ${C.ink2}`, borderRadius: 6 }} />
                {hasY && <>
                  <span style={{ fontFamily: MONO, fontSize: 12 }}>{ctx.sym.y} =</span>
                  <input value={guessY} onChange={(e) => setGuessY(e.target.value)} style={{ width: 60, fontFamily: MONO, fontSize: 13, padding: "4px 6px", border: `1px solid ${C.ink2}`, borderRadius: 6 }} />
                </>}
                <button style={btn()} onClick={pruefen}><Check size={11} style={{ display: "inline" }} /> prüfen</button>
                <button style={btn()} onClick={() => { if (loesung.x) setXv(fVal(loesung.x)); if (loesung.y) setYv(fVal(loesung.y)); setProbing(true); }}><Eye size={11} style={{ display: "inline" }} /> zeigen</button>
                {probing && <button style={btn()} onClick={() => setProbing(false)}>Probieren beenden</button>}
                {gefunden && <span style={{ fontFamily: MONO, fontSize: 12, color: C.ok }}>alle Waagen waagerecht</span>}
              </div>
            </div>
          </div>

          <div style={{ flex: presenting && landscape ? "1 1 42%" : "1 1 320px", minWidth: presenting ? 0 : 290 }}>
            <div style={card}>
              <div style={eyebrow}>{phase === "bauen" ? "Deine Gleichung entsteht" : "Symbolische Ebene"}</div>
              {scales.map((s) => (
                <div key={s.id} style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: SERIF, fontWeight: 700, color: C.brassDark, fontSize: 15 * z, marginBottom: 4 }}>({s.label})</div>
                  {s.prot.map((r, i) => {
                    const live = i === s.prot.length - 1;
                    const seite = (p, side) => {
                      const parts = termParts(p, ctx.sym);
                      if (!parts.length) return <span>0</span>;
                      return parts.map((t, j) => {
                        const on = live && hl && hl.scaleId === s.id && hl.side === side && hl.kind === t.kind;
                        return (
                          <span key={j}>
                            {j === 0 ? (t.neg ? "−" : "") : (t.neg ? " − " : " + ")}
                            <span
                              onPointerEnter={live ? () => setHl({ scaleId: s.id, side, kind: t.kind }) : undefined}
                              onPointerLeave={live ? () => setHl(null) : undefined}
                              style={{
                                background: on ? "rgba(44,95,138,.20)" : "transparent",
                                borderBottom: live ? `1px dotted ${C.grid}` : "none",
                                borderRadius: 3, padding: "1px 2px", cursor: live ? "default" : "inherit",
                                transition: "background .15s ease",
                              }}>{t.s}</span>
                          </span>
                        );
                      });
                    };
                    return (
                      <div key={i} className="flex" style={{ fontFamily: MONO, fontSize: 14 * z, lineHeight: 1.8, color: live ? C.ink : C.ink2 }}>
                        <span style={{ flex: 1, whiteSpace: "nowrap" }}>{seite(r.L, "L")} = {seite(r.R, "R")}</span>
                        {r.note && <span style={{ color: r.bad ? C.neg : C.brassDark, paddingLeft: 12, whiteSpace: "nowrap" }}>{r.bad ? "⚠ " : "| "}{noteStr(r.note, ctx.sym)}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
              {phase === "bauen"
                ? <div style={{ borderTop: `1px solid ${C.grid}`, paddingTop: 8, fontSize: 13 }}>
                  Sobald die Gleichung stimmt, auf „Umformen starten“ tippen – danach wirkt jeder Zug auf beide Seiten.
                </div>
                : <div style={{ borderTop: `1px solid ${C.grid}`, paddingTop: 8, fontFamily: MONO, fontSize: 13 * z }}>Lösung: <strong>{loesung.text}</strong></div>}
              {phase === "umformen" && probe && loesung.x && probe.map((p) => (
                <div key={p.i} style={{ fontFamily: MONO, fontSize: 12 * z, color: C.ink2 }}>Probe {p.eq}: {p.l} = {p.r} {p.ok ? "✓" : "✗"}</div>
              ))}
            </div>

            <div style={{
              display: "flex", gap: 8, marginTop: 10, padding: 12, borderRadius: 10,
              background: msg.ok ? "rgba(62,122,86,.10)" : "rgba(176,69,58,.10)",
              border: `1px solid ${msg.ok ? C.ok : C.neg}`,
            }}>
              <Lightbulb size={16} color={msg.ok ? C.ok : C.neg} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13.5 * z, lineHeight: 1.45 }}>{msg.t}</div>
            </div>

            {!presenting && (
              <div style={{ marginTop: 10, fontSize: 12.5, color: C.ink2, lineHeight: 1.5 }}>
                <strong style={{ color: C.ink }}>Legende:</strong> {ctx.unit} = 1 · {ctx.xName} = {ctx.sym.x}{hasY ? ` · ${ctx.yName} = ${ctx.sym.y}` : ""}.
                Tippen nimmt beidseitig weg, Strg/Cmd + Z geht zurück.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
