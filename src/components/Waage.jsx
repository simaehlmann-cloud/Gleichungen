import React from "react";
import { C, MONO, SERIF } from "../lib/tokens.js";
import { F, KIND, panScale, panVal, panEmpty, termStr, eqOf } from "../lib/fraction.js";
import { Piece, pieces } from "./Piece.jsx";

/* ================= Waage ================= */
function Waage({ scale, xv, yv, z, ctx, active, onFocus, onPieceDown, onPieceActivate, hot, stage, drag, coupled, hl, setHl, enter, broken, phase, hint, kalkuel }) {
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
      <div role="status" aria-live="polite" style={{
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
        ({scale.label})
        {phase === "bauen" && <span style={{ fontFamily: MONO, fontSize: 11 * z, color: C.ink2, paddingLeft: 6 }}>Aufbau</span>}
        {kalkuel && <span style={{ fontFamily: MONO, fontSize: 11 * z, color: C.neg, paddingLeft: 6 }} title="Die Grenzen des Waagemodells sind aufgehoben">Kalkül</span>}
      </div>
    </div>
  );
}

export { Waage };
