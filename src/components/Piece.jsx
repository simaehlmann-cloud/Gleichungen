import React from "react";
import { C, MONO, SERIF } from "../lib/tokens.js";
import { CONTEXTS } from "../lib/texts.js";
import { fVal, fAbs, fStr, isInt } from "../lib/fraction.js";

/* ================= Spielsteine ================= */
/* Der Kontext wird über seinen Namen erkannt, weil die App ihn um den
   gewählten Stil ergänzt (ctx = { ...CONTEXTS[k], stil }). */
const ist = (ctx, k) => ctx && ctx.name === CONTEXTS[k].name;

function lookKlassisch(kind, neg, ctx) {
  if (neg) return { shape: "round", bg: `radial-gradient(circle at 32% 28%, #d98a80, ${C.neg} 62%, ${C.negDark})`, border: C.negDark, fg: "#fff", label: kind === "k" ? "−1" : "−" + ctx.sym[kind] };
  if (kind === "k") {
    if (ist(ctx, "markt")) return { shape: "sq", bg: `linear-gradient(160deg, ${C.iron}, ${C.ironDark})`, border: C.ironDark, fg: "#fff", label: "1kg", small: true };
    if (ist(ctx, "schachtel")) return { shape: "stick", bg: "#D9B36C", border: "#8A6A2E", fg: C.ink, label: "" };
    return { shape: "round", bg: `radial-gradient(circle at 32% 28%, #fbf8ef, ${C.ball} 62%, #cfc5ab)`, border: C.ballEdge, fg: C.ink, label: "" };
  }
  const base = kind === "x" ? (ist(ctx, "algebra") ? C.x : C.sack) : (ist(ctx, "algebra") ? C.y : C.yDark);
  const dark = kind === "x" ? (ist(ctx, "algebra") ? C.xDark : C.sackDark) : C.yDark;
  return { shape: "sq", bg: `linear-gradient(160deg, ${base}, ${dark})`, border: dark, fg: "#fff", label: ctx.sym[kind] };
}

/* Comic: flache, kräftige Farben, dicke Kontur, versetzter Schatten */
const COMIC = { k: "#FF9F1C", x: "#6C63FF", y: "#EF476F", neg: "#E63946", markt: "#8D99AE", sack: "#C68B59", holz: "#F4C95D" };
function lookComic(kind, neg, ctx) {
  const glanz = (c) => `radial-gradient(circle at 30% 28%, #fff 0 2.5px, ${c} 3.5px)`;
  const comic = { border: "#1B1B1B", borderW: 2.5, schatten: "2px 2px 0 #1B1B1B", font: '"Chalkboard SE", "Comic Sans MS", "Marker Felt", system-ui, sans-serif' };
  if (neg) return { ...comic, shape: "round", bg: glanz(COMIC.neg), fg: "#fff", label: kind === "k" ? "−1" : "−" + ctx.sym[kind] };
  if (kind === "k") {
    if (ist(ctx, "markt")) return { ...comic, shape: "sq", bg: COMIC.markt, fg: "#fff", label: "1kg", small: true };
    if (ist(ctx, "schachtel")) return { ...comic, shape: "stick", bg: COMIC.holz, fg: "#1B1B1B", label: "" };
    return { ...comic, shape: "round", bg: glanz(COMIC.k), fg: "#1B1B1B", label: "" };
  }
  const farbe = kind === "x" ? (ist(ctx, "algebra") ? COMIC.x : COMIC.sack) : COMIC.y;
  return { ...comic, shape: "sq", bg: farbe, fg: "#fff", label: ctx.sym[kind] };
}

/* Realistisch: Stahlkugeln, Nussbaumwürfel mit Goldprägung */
function lookReal(kind, neg, ctx) {
  const real = { schatten: "0 2px 3px rgba(0,0,0,.55)" };
  if (neg) return { ...real, shape: "round", bg: "radial-gradient(circle at 32% 28%, #f6c3a8, #b5562e 55%, #5a2412)", border: "#4a1d0e", fg: "#fff", label: kind === "k" ? "−1" : "−" + ctx.sym[kind] };
  if (kind === "k") {
    if (ist(ctx, "markt")) return { ...real, shape: "sq", bg: "linear-gradient(160deg, #9aa1a6, #4a5055)", border: "#2f3438", fg: "#fff", label: "1kg", small: true };
    if (ist(ctx, "schachtel")) return { ...real, shape: "stick", bg: "linear-gradient(90deg, #e2c48a, #b9935a)", border: "#7a5a2a", fg: C.ink, label: "" };
    return { ...real, shape: "round", bg: "radial-gradient(circle at 34% 28%, #ffffff 0, #d5dadf 22%, #7e868e 68%, #3e444a 100%)", border: "#2f3438", fg: C.ink, label: "" };
  }
  if (kind === "x" && !ist(ctx, "algebra")) return { ...real, shape: "sq", bg: "linear-gradient(160deg, #c9a46a, #8a6a3c 60%, #5f4726)", border: "#3e2e18", fg: "#fff", label: ctx.sym[kind] };
  const holz = kind === "x" ? "linear-gradient(150deg, #8b5a34, #6a4024 55%, #4a2b16)" : "linear-gradient(150deg, #3d5f52, #24403a 55%, #142822)";
  return { ...real, shape: "sq", bg: holz, border: "#1e120a", fg: "#E6C77A", label: ctx.sym[kind] };
}

function look(kind, neg, ctx) {
  const s = ctx && ctx.stil;
  return s === "comic" ? lookComic(kind, neg, ctx) : s === "real" ? lookReal(kind, neg, ctx) : lookKlassisch(kind, neg, ctx);
}
function Piece({ kind, neg, ctx, z = 1, label, onPointerDown, onActivate, onHover, ghost, title, deco = {}, placeholder }) {
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
      onKeyDown={onActivate ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onActivate(); } } : undefined}
      onPointerEnter={onHover ? () => onHover(kind) : undefined}
      onPointerLeave={onHover ? () => onHover(null) : undefined}
      title={title} aria-label={title || (neg ? "Minus-" : "") + (kind === "k" ? ctx.unit : kind === "x" ? ctx.xName : ctx.yName)}
      style={{
        width: w, height: h, padding: 0, touchAction: "none", userSelect: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: L.shape === "round" ? "50%" : 5 * z,
        background: L.bg, border: `${L.borderW || 1.5}px solid ${L.border}`, color: L.fg,
        fontSize: (L.small || label ? 10 : L.font ? 16 : 14) * z, fontWeight: 700,
        fontFamily: L.font || (kind === "k" ? MONO : SERIF), fontStyle: kind === "k" || L.font ? "normal" : "italic",
        boxShadow: [ring, ghost ? "0 6px 14px rgba(0,0,0,.35)" : (L.schatten || "0 1px 2px rgba(0,0,0,.28)")].filter(Boolean).join(", "),
        cursor: onPointerDown ? "grab" : "default",
        opacity: deco.dim ? 0.3 : 1,
        transform: ghost ? "scale(1.15)" : deco.mark || deco.glow ? "translateY(-3px)" : "none",
        transition: "transform .18s ease, box-shadow .18s ease, opacity .18s ease",
        animation: deco.enter ? "waageDrop .42s cubic-bezier(.34,1.3,.5,1)" : deco.mark ? "waagePulse 1.1s ease-in-out infinite" : "none",
      }}>{label !== undefined ? label : L.label}</button>
  );
}
function Bundle({ kind, neg, ctx, z = 1, onPointerDown, onActivate, title }) {
  const L = look(kind, neg, ctx);
  const w = (kind === "k" ? 26 : 30) * z;
  return (
    <button data-piece={kind} data-neg={neg ? "1" : "0"} data-bundle="10" onPointerDown={onPointerDown} title={title}
      aria-label={`Zehnerbündel ${kind === "k" ? ctx.unit : kind === "x" ? ctx.xName : ctx.yName}`}
      onKeyDown={onActivate ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onActivate(); } } : undefined}
      style={{
        position: "relative", width: w + 8 * z, height: (kind === "k" ? 26 : 30) * z + 6 * z,
        padding: 0, background: "none", border: "none", touchAction: "none", cursor: onPointerDown ? "grab" : "default",
      }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          position: "absolute", left: i * 3 * z, top: (2 - i) * 3 * z, width: w, height: (kind === "k" ? 26 : 30) * z,
          borderRadius: L.shape === "round" ? "50%" : 5 * z, background: L.bg,
          border: `${L.borderW || 1.5}px solid ${L.border}`, boxShadow: L.schatten || "0 1px 2px rgba(0,0,0,.25)",
        }} />
      ))}
      <span style={{
        position: "absolute", right: -2 * z, bottom: -2 * z, background: C.ink, color: C.paper,
        fontFamily: MONO, fontSize: 9 * z, fontWeight: 700, borderRadius: 8, padding: `${1 * z}px ${4 * z}px`,
      }}>10</span>
    </button>
  );
}
function pieces(count, kind, ctx, z, onDown, opts = {}) {
  const out = []; const v = fVal(count);
  if (v === 0) return out;
  const neg = v < 0, abs = fAbs(count);
  const down = onDown ? (e) => onDown(e, neg ? -1 : 1, 1) : undefined;
  const act1 = opts.onActivate ? () => opts.onActivate(kind, neg ? -1 : 1, 1) : undefined;
  const act10 = opts.onActivate ? () => opts.onActivate(kind, neg ? -1 : 1, 10) : undefined;
  if (!isInt(abs)) return [<Piece key={kind + "f"} kind={kind} neg={neg} ctx={ctx} z={z} onHover={opts.onHover}
    deco={{ glow: opts.glow }} label={fStr(abs) + (kind === "k" ? "" : ctx.sym[kind])} onPointerDown={down} />];
  const n = abs.n;
  if (n > 14) {
    const bundles = Math.floor(n / 10), rest = n % 10;
    const downB = onDown ? (e) => onDown(e, neg ? -1 : 1, 10) : undefined;
    for (let b = 0; b < bundles; b++) {
      out.push(<Bundle key={kind + "b" + b} kind={kind} neg={neg} ctx={ctx} z={z} onPointerDown={downB} onActivate={act10}
        title={`Zehnerbündel – nimmt 10 auf einmal weg`} />);
    }
    for (let i = 0; i < rest; i++) {
      out.push(<Piece key={kind + "r" + i} kind={kind} neg={neg} ctx={ctx} z={z} onPointerDown={down} onActivate={act1}
        onHover={opts.onHover} deco={{ glow: opts.glow }} />);
    }
    return out;
  }
  const shown = n;
  for (let i = 0; i < shown; i++) {
    const last = i === shown - 1;
    out.push(<Piece key={kind + i} kind={kind} neg={neg} ctx={ctx} z={z} onPointerDown={down} onActivate={act1} onHover={opts.onHover}
      deco={{
        dim: opts.dimLast && last, mark: opts.markLast && last, glow: opts.glow,
        enter: opts.enterFrom != null && i >= opts.enterFrom,
      }} />);
  }
  return out;
}

export { look, Piece, Bundle, pieces };
