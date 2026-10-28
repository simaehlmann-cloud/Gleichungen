import React, { useEffect, useRef, useState } from "react";
import { C, MONO, SERIF } from "../lib/tokens.js";
import { stilOf } from "../lib/stile.js";
import { F, KIND, panScale, panVal, panEmpty, termStr, eqOf } from "../lib/fraction.js";
import { Piece, pieces } from "./Piece.jsx";

/* ================= Ausschwingen =================
   Gedämpfte Feder statt CSS-Übergang: jeder Stil schwingt anders aus
   (klassisch knapp, Comic federnd, realistisch träge). Ohne matchMedia
   (Tests) oder bei reduzierter Bewegung springt der Winkel sofort. */
function useFeder(ziel, [k, d]) {
  const [w, setW] = useState(ziel);
  const st = useRef({ w: ziel, v: 0, raf: 0, last: 0 });
  useEffect(() => {
    const s = st.current;
    const still = typeof window === "undefined" || typeof window.matchMedia !== "function"
      || typeof window.requestAnimationFrame !== "function"
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) { s.w = ziel; s.v = 0; setW(ziel); return undefined; }
    const schritt = (t) => {
      const dt = Math.min(0.033, s.last ? (t - s.last) / 1000 : 0.016);
      s.last = t;
      s.v += (k * (ziel - s.w) - d * s.v) * dt;
      s.w += s.v * dt;
      if (Math.abs(s.v) < 0.01 && Math.abs(ziel - s.w) < 0.01) { s.w = ziel; s.v = 0; s.raf = 0; s.last = 0; setW(ziel); return; }
      setW(s.w);
      s.raf = window.requestAnimationFrame(schritt);
    };
    s.raf = window.requestAnimationFrame(schritt);
    return () => { if (s.raf) window.cancelAnimationFrame(s.raf); s.raf = 0; s.last = 0; };
  }, [ziel, k, d]);
  return w;
}

/* ================= Gestelle =================
   Gezeichnet in der 400er-Box; das SVG wird mit z skaliert und liegt hinter
   den Schalen, damit Ziehen und Tastatur an den echten Knöpfen bleiben. */
const rad = (g) => (g * Math.PI) / 180;

function GestellKlassisch({ S, ends, winkel }) {
  const cx = 200, py = S.pivotY;
  return (
    <>
      <defs>
        <linearGradient id="kBalken" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.brass} /><stop offset="1" stopColor={C.brassDark} /></linearGradient>
      </defs>
      <rect x={cx - 5} y={py} width="10" height="40" fill={C.wood} />
      <rect x={cx - 46} y={py + 38} width="92" height="10" rx="4" fill={C.wood} />
      <rect x={cx - S.arm} y={py - 5} width={S.arm * 2} height="10" rx="5" fill="url(#kBalken)"
        transform={`rotate(${-winkel} ${cx} ${py})`} style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,.3))" }} />
      <circle cx={cx} cy={py} r="6" fill={C.brassDark} stroke={C.brass} strokeWidth="2" />
    </>
  );
}

function GestellComic({ S, ends, winkel, uid, schief }) {
  const cx = 200, py = S.pivotY, ink = "#1B1B1B", fuss = S.pivotY + 190;
  const blick = Math.max(-3.5, Math.min(3.5, -winkel * 0.5));
  return (
    <>
      <defs>
        <pattern id={`cPunkte${uid}`} width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.7" fill="#F6D98A" /></pattern>
      </defs>
      <rect x="2" y="2" width="396" height={S.hoehe - 4} rx="16" fill="#FFF1C9" />
      <rect x="2" y="2" width="396" height={S.hoehe - 4} rx="16" fill={`url(#cPunkte${uid})`} />
      <path d={`M${cx} ${py} L${cx - 34} ${fuss} L${cx + 34} ${fuss} Z`} fill="#F25F5C" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
      <rect x={cx - 56} y={fuss - 4} width="112" height="18" rx="9" fill="#F25F5C" stroke={ink} strokeWidth="4" />
      {[-11, 11].map((dx) => (
        <g key={dx}>
          <circle cx={cx + dx} cy={py + 120} r="7.5" fill="#fff" stroke={ink} strokeWidth="2.5" />
          <circle cx={cx + dx + blick} cy={py + 121} r="3.3" fill={ink} />
        </g>
      ))}
      <path d={schief ? `M${cx - 12} ${py + 145} q6 -6 12 0 t12 0` : `M${cx - 11} ${py + 140} Q${cx} ${py + 152} ${cx + 11} ${py + 140}`}
        fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      {ends.map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y} L${x - 60} ${y + S.hang} M${x} ${y} L${x + 60} ${y + S.hang}`} stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
          <path d={`M${x - 78} ${y + S.hang} Q${x} ${y + S.hang + 44} ${x + 78} ${y + S.hang} Z`} fill="#3EC1D3" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
          <path d={`M${x - 52} ${y + S.hang + 11} Q${x - 24} ${y + S.hang + 22} ${x} ${y + S.hang + 23}`} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7" />
        </g>
      ))}
      <g transform={`rotate(${-winkel} ${cx} ${py})`}>
        <rect x={cx - S.arm - 8} y={py - 10} width={S.arm * 2 + 16} height="20" rx="10" fill="#FFC93C" stroke={ink} strokeWidth="4" />
        <path d={`M${cx - S.arm + 10} ${py - 4} H${cx - 30}`} stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7" />
      </g>
      <circle cx={cx} cy={py} r="8" fill="#fff" stroke={ink} strokeWidth="3.5" />
    </>
  );
}

function GestellReal({ S, ends, winkel, uid }) {
  const cx = 200, py = S.pivotY, tisch = py + 210, H = S.hoehe;
  const skala = [];
  for (let a = -15; a <= 15; a += 3) {
    const r1 = a === 0 ? 116 : 124, r2 = 136, s = Math.sin(rad(a)), c = Math.cos(rad(a));
    skala.push(<line key={a} x1={cx + r1 * s} y1={py + r1 * c} x2={cx + r2 * s} y2={py + r2 * c} stroke="#3A2A10" strokeWidth={a === 0 ? 2 : 1.1} />);
  }
  const bogen = (() => {
    const p = (r, a) => [cx + r * Math.sin(rad(a)), py + r * Math.cos(rad(a))];
    const [x1, y1] = p(140, -18), [x2, y2] = p(140, 18), [x3, y3] = p(112, 18), [x4, y4] = p(112, -18);
    return `M${x1} ${y1} A140 140 0 0 0 ${x2} ${y2} L${x3} ${y3} A112 112 0 0 1 ${x4} ${y4} Z`;
  })();
  const id = (n) => `${n}${uid}`;
  return (
    <>
      <defs>
        <clipPath id={id("rBox")}><rect x="2" y="2" width="396" height={H - 4} rx="16" /></clipPath>
        <linearGradient id={id("rWand")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A4148" /><stop offset="1" stopColor="#262B30" /></linearGradient>
        <linearGradient id={id("rTisch")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7A4E2D" /><stop offset=".12" stopColor="#5E3A20" /><stop offset="1" stopColor="#3E2614" /></linearGradient>
        <linearGradient id={id("rMessing")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F3D68C" /><stop offset=".45" stopColor="#C9A04B" /><stop offset="1" stopColor="#7C5A1C" /></linearGradient>
        <linearGradient id={id("rSaeule")} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8A6A2A" /><stop offset=".35" stopColor="#F0D592" /><stop offset=".6" stopColor="#C39A45" /><stop offset="1" stopColor="#6E501A" /></linearGradient>
        <linearGradient id={id("rMarmor")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2F4A40" /><stop offset=".5" stopColor="#1D3029" /><stop offset="1" stopColor="#2A4038" /></linearGradient>
        <radialGradient id={id("rSchale")} cx=".5" cy=".2" r=".9"><stop offset="0" stopColor="#F7E2A6" /><stop offset=".5" stopColor="#C9A04B" /><stop offset="1" stopColor="#6E501A" /></radialGradient>
        <radialGradient id={id("rSchatten")}><stop offset="0" stopColor="#000" stopOpacity=".55" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
      </defs>
      <g clipPath={`url(#${id("rBox")})`}>
        <rect width="400" height={H} fill={`url(#${id("rWand")})`} />
        <rect y={tisch} width="400" height={H - tisch} fill={`url(#${id("rTisch")})`} />
        <path d={`M0 ${tisch + 8} H400 M0 ${tisch + 21} H400 M0 ${tisch + 40} H400`} stroke="#2E1C0F" strokeWidth="1" opacity=".35" />
        {ends.map(([x, y], i) => {
          const abstand = tisch - (y + S.hang + 12);
          return <ellipse key={i} cx={x} cy={tisch + 9} rx="72" ry="6" fill={`url(#${id("rSchatten")})`} opacity={Math.max(0.15, Math.min(0.9, 1 - abstand / 120))} />;
        })}
        <ellipse cx={cx} cy={tisch + 8} rx="90" ry="7" fill={`url(#${id("rSchatten")})`} />
      </g>
      <rect x={cx - 7} y={py} width="14" height={tisch - py - 14} fill={`url(#${id("rSaeule")})`} />
      <path d={bogen} fill="#EFE6CF" stroke="#8A6A2A" strokeWidth="1.2" />
      {skala}
      <path d={`M${cx - 18} ${tisch - 14} H${cx + 18} L${cx + 24} ${tisch - 6} H${cx - 24} Z`} fill={`url(#${id("rMessing")})`} />
      <rect x={cx - 72} y={tisch - 7} width="144" height="13" rx="3" fill={`url(#${id("rMarmor")})`} stroke="#11201A" />
      {ends.map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y} L${x - 66} ${y + S.hang} M${x} ${y} L${x + 66} ${y + S.hang} M${x} ${y} L${x} ${y + S.hang - 4}`}
            stroke="#B9A06A" strokeWidth="1.5" strokeDasharray="4 2.5" fill="none" />
          <path d={`M${x - 78} ${y + S.hang} Q${x} ${y + S.hang + 20} ${x + 78} ${y + S.hang} Z`} fill="#6E501A" />
          <ellipse cx={x} cy={y + S.hang} rx="78" ry="7" fill={`url(#${id("rSchale")})`} stroke="#5C4214" strokeWidth=".8" />
        </g>
      ))}
      <g transform={`rotate(${-winkel} ${cx} ${py})`}>
        <path d={`M${cx - S.arm} ${py - 3} L${cx - 10} ${py - 7} L${cx + 10} ${py - 7} L${cx + S.arm} ${py - 3} L${cx + S.arm} ${py + 3} L${cx + 10} ${py + 8} L${cx - 10} ${py + 8} L${cx - S.arm} ${py + 3} Z`}
          fill={`url(#${id("rMessing")})`} stroke="#5C4214" strokeWidth=".8" />
        <circle cx={cx - S.arm} cy={py} r="3.5" fill="#5C4214" /><circle cx={cx + S.arm} cy={py} r="3.5" fill="#5C4214" />
        <line x1={cx} y1={py} x2={cx} y2={py + 132} stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" />
        <path d={`M${cx - 3.5} ${py + 132} L${cx} ${py + 142} L${cx + 3.5} ${py + 132} Z`} fill="#1E1E1E" />
      </g>
      <path d={`M${cx - 8} ${py} L${cx} ${py - 12} L${cx + 8} ${py} Z`} fill="#E9CF8A" stroke="#5C4214" strokeWidth=".8" />
      <circle cx={cx} cy={py} r="4.5" fill="#3A2A10" />
    </>
  );
}

const GESTELL = { klassisch: GestellKlassisch, comic: GestellComic, real: GestellReal };

/* ================= Waage ================= */
function Waage({ scale, xv, yv, z, ctx, stil = "klassisch", active, onFocus, onPieceDown, onPieceActivate, hot, stage, drag, coupled, hl, setHl, enter, broken, phase, hint, kalkuel }) {
  const S = stilOf(stil);
  const haengt = S.hang > 0;
  const cx = 200, py = S.pivotY;
  const staged = stage && stage.scaleId === scale.id;
  const diff = panVal(scale.L, xv, yv) - panVal(scale.R, xv, yv);
  const ziel = staged ? 0 : Math.max(-11, Math.min(11, diff * 2.2));
  const winkel = useFeder(ziel, S.feder);
  const a = rad(winkel);
  const ends = [[cx - Math.cos(a) * S.arm, py + Math.sin(a) * S.arm], [cx + Math.cos(a) * S.arm, py - Math.sin(a) * S.arm]];
  const balanced = Math.abs(diff) < 1e-9;
  const mine = drag && drag.from !== "tray" && drag.from.scaleId === scale.id;
  const Gestell = GESTELL[stil] || GestellKlassisch;
  const schrift = S.schrift || MONO;

  const renderGroups = (p) => {
    const n = stage.n;
    const part = stage.type === "div" ? panScale(p, F(1, n)) : p;
    return (
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} style={{
            border: `1.5px dashed ${i === 0 && stage.type === "div" ? S.ok : S.akzent}`,
            borderRadius: 6, padding: 3, display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center",
            background: i === 0 && stage.type === "div" ? "rgba(62,122,86,.18)" : "transparent",
          }}>
            {KIND.flatMap((k) => pieces(part[k], k, ctx, z * 0.8, null))}
          </div>
        ))}
      </div>
    );
  };

  const renderPan = (side, i) => {
    const p = scale[side];
    const isHot = hot === `pan:${scale.id}:${side}`;
    const fromHere = mine && drag.from.side === side;
    const partnerHere = mine && coupled && drag.from.side !== side;
    const trayGhost = drag && drag.from === "tray" && (coupled || isHot);
    const [ex, ey] = ends[i];
    const term = (
      <div style={{
        textAlign: "center", fontFamily: MONO, fontSize: 13 * z, color: S.text,
        ...(haengt ? { position: "absolute", left: 0, right: 0, top: `calc(100% + ${(stil === "comic" ? 26 : 14) * z}px)` } : { marginTop: 4 * z }),
      }}>{termStr(p, ctx.sym)}</div>
    );
    return (
      <div data-drop={`pan:${scale.id}:${side}`} style={{
        position: "absolute", left: ex * z, top: (ey + S.hang) * z,
        transform: "translate(-50%,-100%)", width: (haengt ? 156 : 176) * z,
      }}>
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 4 * z, justifyContent: "center", alignItems: "flex-end",
          minHeight: 42 * z, padding: `${6 * z}px ${6 * z}px ${(haengt ? 3 : 8) * z}px`,
          borderBottom: haengt ? "none" : `${4 * z}px solid ${C.brassDark}`,
          borderRadius: haengt ? 6 : "3px 3px 6px 6px",
          background: isHot ? "rgba(168,130,60,.30)" : haengt ? "transparent" : "rgba(168,130,60,.10)",
          outline: isHot ? `2px dashed ${S.akzent}` : "none",
          transition: "background .2s ease",
        }}>
          {staged ? renderGroups(p)
            : panEmpty(p) && !trayGhost ? <span style={{ fontFamily: schrift, fontSize: 12 * z, color: S.text2 }}>leer</span>
              : KIND.flatMap((k) => pieces(p[k], k, ctx, z, (e, sign, menge) => onPieceDown(e, k, { scaleId: scale.id, side, sign, menge }), {
                dimLast: fromHere && drag.kind === k,
                markLast: partnerHere && drag.kind === k,
                glow: hl && hl.scaleId === scale.id && hl.side === side && hl.kind === k,
                enterFrom: enter && enter[`${scale.id}:${side}:${k}`],
                onHover: (kk) => setHl(kk ? { scaleId: scale.id, side, kind: kk } : null),
                onActivate: (k2, sign, menge) => onPieceActivate(k2, { scaleId: scale.id, side, sign, menge }),
              }))}
          {trayGhost && !staged && <Piece placeholder kind={drag.kind} neg={drag.sign < 0} ctx={ctx} z={z} />}
        </div>
        {term}
      </div>
    );
  };

  const status = staged ? (stage.type === "div" ? `in ${stage.n} gleiche Haufen geteilt` : `${stage.n}-mal nebeneinander`)
    : broken ? "nicht mehr äquivalent zur Aufgabe"
      : hint ? hint
        : balanced ? "im Gleichgewicht" : diff > 0 ? "links schwerer" : "rechts schwerer";
  const textY = haengt ? S.hoehe - 64 : py + 52;

  return (
    <div onPointerDown={onFocus} data-waage={stil} data-winkel={Math.round(ziel * 100) / 100} style={{
      position: "relative", width: 400 * z, height: S.hoehe * z, margin: "0 auto",
      outline: active ? `2px solid ${C.brass}` : "2px solid transparent", borderRadius: 16,
    }}>
      <svg aria-hidden="true" viewBox={`0 0 400 ${S.hoehe}`} width={400 * z} height={S.hoehe * z}
        style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", overflow: "visible" }}>
        <Gestell S={S} ends={ends} winkel={winkel} uid={scale.id} schief={!balanced || broken} />
      </svg>
      {renderPan("L", 0)}{renderPan("R", 1)}
      <div role="status" aria-live="polite" style={{
        position: "absolute", left: (cx - 170) * z, top: textY * z, width: 340 * z, textAlign: "center", whiteSpace: "nowrap",
        fontFamily: schrift, fontSize: (stil === "comic" ? 13 : 11) * z, fontWeight: stil === "comic" ? 700 : 400,
        color: staged ? S.akzent : broken ? S.neg : balanced ? S.ok : S.neg,
        letterSpacing: stil === "real" ? ".05em" : 0, textTransform: stil === "real" ? "uppercase" : "none",
      }}>{status}</div>
      <div style={{
        position: "absolute", left: (cx - 120) * z, top: (textY + 17) * z, width: 240 * z, textAlign: "center",
        fontFamily: MONO, fontSize: 14 * z, fontWeight: 700, color: S.text,
      }}>{eqOf(scale.L, scale.R, ctx.sym)}</div>
      <div style={{ position: "absolute", left: 12 * z, top: 8 * z, fontFamily: SERIF, fontSize: 20 * z, fontWeight: 700, color: S.akzent }}>
        ({scale.label})
        {phase === "bauen" && <span style={{ fontFamily: MONO, fontSize: 11 * z, color: S.text2, paddingLeft: 6 }}>Aufbau</span>}
        {kalkuel && <span style={{ fontFamily: MONO, fontSize: 11 * z, color: S.neg, paddingLeft: 6 }} title="Die Grenzen des Waagemodells sind aufgehoben">Kalkül</span>}
      </div>
    </div>
  );
}

export { Waage };
