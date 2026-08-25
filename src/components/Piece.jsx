import React from "react";
import { C, MONO, SERIF } from "../lib/tokens.js";
import { CONTEXTS } from "../lib/texts.js";
import { fVal, fAbs, fStr, isInt } from "../lib/fraction.js";

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
          border: `1.5px solid ${L.border}`, boxShadow: "0 1px 2px rgba(0,0,0,.25)",
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
