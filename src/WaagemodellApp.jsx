import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus, Minus, RotateCcw, Eye, Divide, X as XIcon, ArrowLeftRight, Lightbulb,
  Check, Undo2, Redo2, Maximize2, Presentation, Trash2, Link2, Link2Off, Play,
  Dices, Printer, GraduationCap, Scissors, Copy, AlertTriangle, ChevronDown, ChevronUp, Link as LinkIcon,
} from "lucide-react";

import { C, MONO, SERIF } from "./lib/tokens.js";
import {
  F, fAdd, fSub, fMul, fDiv, fVal, fZero, fAbs, fStr, isInt,
  KIND, P, panAdd, panScale, panVal, panEmpty, termParts, termStr, eqOf, noteStr,
} from "./lib/fraction.js";
import { parseEquation } from "./lib/parser.js";
import { representable, repairSteps, levelValues, mkScale, withStep, resetUid } from "./lib/model.js";
import { MELDUNGEN, CONTEXTS, sachtext } from "./lib/texts.js";
import { A1, A2, LEVELS, genTask, genNeg } from "./lib/tasks.js";
import { Piece } from "./components/Piece.jsx";
import { Waage } from "./components/Waage.jsx";

/* ================= App ================= */
export default function WaagemodellApp() {
  const [mode, setMode] = useState("einzeln");
  const [scales, setScales] = useState(() => [mkScale("I", P(), P())]);
  const [task, setTask] = useState([]);
  const [phase, setPhase] = useState("bauen");
  const [activeId, setActiveId] = useState(1);
  const [partnerId, setPartnerId] = useState(null);
  const [anti, setAnti] = useState(false);
  const [showY, setShowY] = useState(false);
  const [coupled, setCoupled] = useState(true);
  const [ctxKey, setCtxKey] = useState("algebra");
  const [xv, setXv] = useState(1);
  const [yv, setYv] = useState(1);
  const [edit, setEdit] = useState(false);
  const [amount, setAmount] = useState("1");
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [presenting, setPresenting] = useState(false);
  const [compact, setCompact] = useState(true);
  const [ansicht, setAnsicht] = useState("beides");
  const [eq1, setEq1] = useState("3x + 2 = x + 8");
  const [eq2, setEq2] = useState("2x + y = 12");
  const [pending, setPending] = useState(null);
  const [stage, setStage] = useState(null);
  const [level, setLevel] = useState(1);
  const [guessX, setGuessX] = useState("");
  const [guessY, setGuessY] = useState("");
  const [log, setLog] = useState([]);
  const [showTeacher, setShowTeacher] = useState(false);
  const [hintStyle, setHintStyle] = useState("frage");
  const [activeSide, setActiveSide] = useState("L");
  const [kalkuel, setKalkuel] = useState(false);
  const [ziel, setZiel] = useState("");
  const [zeigeLoesung, setZeigeLoesung] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [share, setShare] = useState(null);
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
  const startSuche = useRef(typeof window !== "undefined" ? window.location.search : "");
  const wiederhergestellt = useRef(false);

  const ctx = CONTEXTS[ctxKey];
  const active = scales.find((s) => s.id === activeId) || scales[0];
  const partner = scales.find((s) => s.id === partnerId && s.id !== active.id) || scales.find((s) => s.id !== active.id) || null;
  const hasY = mode === "lgs" || showY || scales.some((s) => !fZero(s.L.y) || !fZero(s.R.y));

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
  const bare = presenting && compact;
  const zeigeWaage = !presenting || ansicht !== "protokoll";
  const zeigeProt = !presenting || ansicht !== "waage";
  const alleinstehend = presenting && ansicht !== "beides";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const z = useMemo(() => {
    if (!presenting) return clamp((vp.w - 40) / 410, 0.62, 1);
    const cols = twoUp && landscape ? 2 : 1;
    const anteil = ansicht === "waage" ? 1 : 0.58;
    const paneW = (landscape ? vp.w * anteil : vp.w) - 60;
    const paneH = (landscape ? vp.h - (bare ? 90 : 170) : vp.h * (twoUp ? 0.30 : 0.52) + (bare ? 60 : 0)) - 20;
    return clamp(Math.min(paneW / (cols * 410), paneH / 325), 0.6, 2.6);
  }, [presenting, vp, landscape, twoUp, bare, ansicht]);
  /* Eigener Faktor für die Schriftgröße im Protokoll */
  const zP = useMemo(() => {
    if (!presenting) return 1;
    if (ansicht !== "protokoll") return z;
    return clamp(Math.min(vp.w / 640, vp.h / 460), 1, 2.8);
  }, [presenting, ansicht, z, vp]);

  const amt = Math.max(1, Math.min(99, Math.round(Number(String(amount).replace(",", ".")) || 1)));
  const amtSplit = Math.max(2, amt);

  const meldung = (kind, a) => {
    const m = MELDUNGEN[kind];
    if (!m) return "";
    const v = m[hintStyle] || m.direkt;
    return typeof v === "function" ? v(a || {}) : v;
  };
  const warn = (kind, a, aktion) => {
    const t = MELDUNGEN[kind] ? meldung(kind, a) : String(a || "");
    setMsg({ t, ok: false, aktion });
    setLog((l) => [...l, { kind, t, when: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), eq: eqOf(active.L, active.R, ctx.sym) }]);
  };

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
  const commit = (next, message) => { setPast((p) => [...p.slice(-40), scales]); setFuture([]); setScales(next); setStage(null); if (message) setMsg(message); };
  const undo = () => {
    if (!past.length) return;
    setFuture((f) => [scales, ...f].slice(0, 40));
    setScales(past[past.length - 1]); setPast(past.slice(0, -1)); setStage(null);
    setMsg({ t: "Ein Schritt zurück.", ok: true });
  };
  const redo = () => {
    if (!future.length) return;
    setPast((p) => [...p.slice(-40), scales]);
    setScales(future[0]); setFuture(future.slice(1)); setStage(null);
    setMsg({ t: "Wieder vorwärts.", ok: true });
  };

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
    if (!anti && !kalkuel && [L, R].some((p) => KIND.some((k) => fVal(p[k]) < 0))) {
      warn("zu-viel", null, kalkuel ? null : { label: "ohne Waage weiterrechnen", run: () => setKalkuel(true) }); return;
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
    if (!anti && !kalkuel && KIND.some((k) => fVal(np[k]) < 0)) { warn("leer-seite"); return; }
    const L = side === "L" ? np : s.L, R = side === "R" ? np : s.R;
    animatePan(id, kind, side === "L" ? [[fVal(s.L[kind]), fVal(L[kind])], null] : [null, [fVal(s.R[kind]), fVal(R[kind])]]);
    setPast((p) => [...p.slice(-40), scales]);
    setScales(scales.map((v) => (v.id === id ? withStep(v, L, R, { op: "one", side }, true) : v)));
    setStage(null);
    warn("einseitig");
  };

  /* ---- Teilen & Vervielfachen als Handlung ---- */
  const startStage = (type) => {
    const n = amtSplit;
    if (type === "div") {
      const teilbar = [active.L, active.R].every((p) => KIND.every((k) => isInt(fDiv(p[k], F(n)))));
      if (!teilbar) {
        if (kalkuel) {
          const f = F(1, n);
          commit(scales.map((v) => (v.id === active.id ? withStep(v, panScale(active.L, f), panScale(active.R, f), { op: "div", n, frei: true }) : v)),
            { t: `Ohne Waage gerechnet: beide Seiten durch ${n} geteilt.`, ok: true });
          return;
        }
        warn("teilt-nicht", { n }, { label: "ohne Waage weiterrechnen", run: () => setKalkuel(true) });
        return;
      }
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
  const startDrag = (e, kind, from, sign = 1, menge = 1) => {
    e.preventDefault(); e.stopPropagation();
    dragRef.current = { kind, from, sign, menge, x0: e.clientX, y0: e.clientY, moved: false };
    setDragView({ kind, sign, menge, from, x: e.clientX, y: e.clientY });
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
      setDragView({ kind: d.kind, sign: d.sign, menge: d.menge, from: d.from, x: e.clientX, y: e.clientY });
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

  const pieceActivate = (kind, from) => {
    const m = from.menge || 1;
    if (phase === "bauen") buildDrop(from.scaleId, from.side, kind, -from.sign * m);
    else if (coupled) bothSides(from.scaleId, kind, -from.sign * m);
    else oneSide(from.scaleId, from.side, kind, -from.sign * m);
  };
  const trayActivate = (kind, sign) => {
    if (phase === "bauen") buildDrop(activeId, activeSide, kind, sign);
    else bothSides(activeId, kind, sign);
  };

  const jumpTo = (id, i) => {
    const s = scales.find((v) => v.id === id); if (!s || i >= s.prot.length - 1) return;
    const r = s.prot[i];
    const prot = s.prot.slice(0, i + 1).map((e, j) => (j === i ? { ...e, note: null, bad: false } : e));
    commit(scales.map((v) => (v.id === id ? { ...v, L: r.L, R: r.R, prot } : v)),
      { t: `Zurück zu Schritt ${i + 1}. Alles danach ist verworfen.`, ok: true });
  };

  const buildDrop = (id, side, kind, n) => {
    const s = scales.find((v) => v.id === id); if (!s || !n) return;
    const oldV = fVal(s[side][kind]);
    const nv = fAdd(s[side][kind], F(n));
    if (!anti && fVal(nv) < 0) { setMsg({ t: meldung("leer-seite"), ok: false }); return; }
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
    const m = d.menge || 1;
    const take = () => (bauen ? buildDrop(d.from.scaleId, d.from.side, d.kind, -d.from.sign * m)
      : coupled ? bothSides(d.from.scaleId, d.kind, -d.from.sign * m)
        : oneSide(d.from.scaleId, d.from.side, d.kind, -d.from.sign * m));
    if (!d.moved && fromPan) { take(); return; }
    if (!d.moved && !fromPan) {
      if (bauen) buildDrop(activeId, "L", d.kind, d.sign * m); else bothSides(activeId, d.kind, d.sign * m);
      return;
    }
    if (!target) { setMsg({ t: "Leg die Teile auf eine Waagschale oder zurück in die Kiste.", ok: false }); return; }
    if (target === "tray") { if (fromPan) take(); return; }
    const parts = target.split(":"); const scaleId = Number(parts[1]), side = parts[2];
    if (fromPan) {
      if (d.from.scaleId !== scaleId) { warn("umtragen"); return; }
      if (d.from.side !== side) {
        if (bauen) { buildDrop(scaleId, d.from.side, d.kind, -d.from.sign * m); buildDrop(scaleId, side, d.kind, d.from.sign * m); return; }
        warn("hinueber"); return;
      }
      return;
    }
    if (bauen) buildDrop(scaleId, side, d.kind, d.sign * m);
    else if (coupled) bothSides(scaleId, d.kind, d.sign * m);
    else oneSide(scaleId, side, d.kind, d.sign * m);
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
    if (!iso) { warn("einsetzen", { label: src.label }); return; }
    const teile = (p) => {
      const c = iso.v === "x" ? p.x : p.y;
      const rest = iso.v === "x" ? { ...p, x: F(0) } : { ...p, y: F(0) };
      return { rest, dazu: panScale(iso.expr, c), neu: panAdd(rest, panScale(iso.expr, c)) };
    };
    const tl = teile(dst.L), tr = teile(dst.R);
    const neu = mkScale(`${dst.label}′`, tl.neu, tr.neu);
    const eintritt = {};
    [["L", tl], ["R", tr]].forEach(([side, t]) => {
      KIND.forEach((k) => {
        if (fZero(t.dazu[k])) return;
        const alt = Math.abs(fVal(t.rest[k]));
        if (Number.isInteger(alt) && Math.abs(fVal(t.neu[k])) > alt && Math.abs(fVal(t.neu[k])) <= 14) eintritt[`${neu.id}:${side}:${k}`] = alt;
      });
    });
    commit([...scales, neu], { t: `Jeder ${iso.v === "x" ? ctx.xName : ctx.yName} aus (${dst.label}) wurde durch den Inhalt der anderen Waagschale von (${src.label}) ersetzt – beides wiegt ja gleich viel.`, ok: true });
    setActiveId(neu.id);
    if (Object.keys(eintritt).length) {
      setEnter(eintritt);
      clearTimeout(enterTimer.current);
      enterTimer.current = setTimeout(() => setEnter(null), 700);
    }
  };
  const gleichsetzen = (aId, bId) => {
    const A = scales.find((s) => s.id === aId), B = scales.find((s) => s.id === bId);
    const ia = isolated(A), ib = isolated(B);
    if (!ia || !ib || ia.v !== ib.v) { warn("gleichsetzen"); return; }
    const neu = mkScale(`${A.label}=${B.label}`, ia.expr, ib.expr);
    commit([...scales, neu], { t: `Beide Waagen tragen dasselbe – also wiegen auch die beiden anderen Waagschalen gleich viel.`, ok: true });
    setActiveId(neu.id);
  };
  const addieren = (aId, bId, minus) => {
    const A = scales.find((s) => s.id === aId), B = scales.find((s) => s.id === bId), f = F(minus ? -1 : 1);
    const neu = mkScale(`${A.label}${minus ? "−" : "+"}${B.label}`, panAdd(A.L, panScale(B.L, f)), panAdd(A.R, panScale(B.R, f)));
    commit([...scales, neu], { t: minus ? `Von jeder Waagschale von (${A.label}) wurde der Inhalt von (${B.label}) abgenommen.` : `Der Inhalt von (${B.label}) wurde auf die passenden Waagschalen von (${A.label}) geschüttet.`, ok: true });
    setActiveId(neu.id);
  };

  /* ---- Laden ---- */
  const setup = (list, m, ph = "umformen") => {
    resetUid();
    const ns = list.map((p, i) => mkScale(i === 0 ? "I" : "II", p.L, p.R));
    setPast([]); setScales(ns); setTask(ph === "umformen" ? list.map((p) => ({ L: p.L, R: p.R })) : []);
    setActiveId(1); setMode(m); setXv(1); setYv(1); setStage(null); setPending(null); setGuessX(""); setGuessY(""); setPhase(ph); setProbing(false); setZeigeLoesung(false);
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
      if (!anti && !kalkuel && fVal(p[item]) < 0) return s;
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
        setMsg({ t: meldung("nicht-darstellbar"), ok: false });
        return;
      }
      setup(parsed, mode);
      setMsg({ t: "Waage aufgebaut. Jedes Teil steht für einen Summanden der Gleichung.", ok: true });
    } catch (err) { setPending(null); warn("eingabe", String(err.message || err)); }
  };
  const fixPending = () => {
    if (!pending) return;
    resetUid();
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
    const p = (s) => {
      const m = String(s).replace(",", ".").trim();
      if (!m) return null;
      let v;
      if (m.includes("/")) { const [a, b] = m.split("/"); v = Number(a) / Number(b); }
      else v = Number(m);
      return Number.isFinite(v) ? v : NaN;
    };
    const gx = p(guessX), gy = p(guessY);
    const brauchtY = !!loesung.y;
    if (gx === null || (brauchtY && gy === null)) {
      setMsg({ t: `Trag deine Lösung erst in das Feld „meine Lösung ${ctx.sym.x} =${brauchtY ? `" und „${ctx.sym.y} ="` : "\u201c"} ein – dann vergleiche ich.`, ok: true });
      return;
    }
    if (Number.isNaN(gx) || (gy !== null && Number.isNaN(gy))) {
      setMsg({ t: "Das kann ich nicht als Zahl lesen. Erlaubt sind zum Beispiel 3, −2, 1,5 oder 3/2.", ok: false });
      return;
    }
    const okX = Math.abs(gx - fVal(loesung.x)) < 1e-9;
    const okY = !brauchtY || Math.abs(gy - fVal(loesung.y)) < 1e-9;
    if (okX && okY) {
      setMsg({ t: "Richtig – setze zur Sicherheit noch in die Ausgangsgleichung ein, die Probe steht rechts.", ok: true });
      setXv(fVal(loesung.x)); if (loesung.y) setYv(fVal(loesung.y)); setProbing(true); setZeigeLoesung(true);
    } else warn("loesung-falsch");
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
${task.map((t) => sachtext(t.L, t.R, ctx)).filter(Boolean).map((x) => `<p>${esc(x)}</p>`).join("")}
${leer ? "<h3>Dein Rechenweg</h3>" + leerzeilen : rows}
<h3>Lösung</h3><p style="font-family:Menlo,monospace">${leer ? "________________" : esc(loesung.text)}</p>
${leer ? "" : (probe || []).map((p) => `<p class="meta">Probe ${esc(p.eq)}: ${p.l} = ${p.r} ${p.ok ? "✓" : "✗"}</p>`).join("")}
${kalkuel ? '<p class="meta">Teile des Rechenwegs entstanden im Kalk\u00fclmodus, also ohne die Grenzen des Waagemodells.</p>' : ""}
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

  /* ---- Zustand in der Adresszeile ---- */
  const codeF = (f) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);
  const codePan = (p) => KIND.map((k) => codeF(p[k])).join(",");
  const codeNote = (n) => {
    if (!n) return "";
    if (n.op === "add") return `a${n.kind}${n.n}`;
    if (n.op === "mul") return `m${n.n}`;
    if (n.op === "div") return `d${n.n}${n.frei ? "f" : ""}`;
    if (n.op === "swap") return "s";
    if (n.op === "one") return `o${n.side}`;
    return "";
  };
  const parseF = (t) => (t.includes("/") ? F(Number(t.split("/")[0]), Number(t.split("/")[1])) : F(Number(t)));
  const parsePan = (t) => { const teile = t.split(",").map(parseF); const o = {}; KIND.forEach((k, i) => { o[k] = teile[i] || F(0); }); return o; };
  const parseNote = (t) => {
    if (!t) return null;
    if (t[0] === "a") return { op: "add", kind: t[1], n: Number(t.slice(2)) };
    if (t[0] === "m") return { op: "mul", n: Number(t.slice(1)) };
    if (t[0] === "d") return { op: "div", n: Number(t.slice(1).replace("f", "")), frei: t.endsWith("f") };
    if (t[0] === "s") return { op: "swap" };
    if (t[0] === "o") return { op: "one", side: t[1] };
    return null;
  };
  const codeState = () => {
    const teile = scales.map((sc) => sc.label + "!" + sc.prot.map((r) => `${codePan(r.L)}:${codePan(r.R)}${r.note ? "*" + codeNote(r.note) + (r.bad ? "!" : "") : ""}`).join(";"));
    return [mode, phase, ctxKey, task.length, teile.join("~")].join("|");
  };
  const decodeState = (t) => {
    const [m, ph, c, tl, rest] = t.split("|");
    resetUid();
    const sc = rest.split("~").map((blk) => {
      const [label, steps] = blk.split("!");
      const prot = steps.split(";").map((st) => {
        const [pans, note] = st.split("*");
        const [l, r] = pans.split(":");
        const bad = note ? note.endsWith("!") : false;
        return { L: parsePan(l), R: parsePan(r), note: parseNote(bad ? note.slice(0, -1) : note), bad };
      });
      const letzte = prot[prot.length - 1];
      return { ...mkScale(label, letzte.L, letzte.R), prot };
    });
    return { mode: m, phase: ph, ctxKey: c, taskLen: Number(tl), scales: sc };
  };
  useEffect(() => {
    if (typeof window === "undefined" || !window.history.replaceState) return;
    if (!wiederhergestellt.current) return;
    try {
      const q = new URLSearchParams(window.location.search);
      q.delete("eq"); q.delete("eq2"); q.delete("ctx");
      q.set("st", codeState());
      window.history.replaceState(window.history.state || { waage: 1 }, "", `${window.location.pathname}?${q.toString()}`);
    } catch (e) { /* Adresszeile nicht änderbar */ }
  }, [scales, phase, mode, ctxKey, task]);

  /* ---- Aufgabe als Link ---- */
  const linkFor = () => {
    const basis = task && task.length ? task : scales.slice(0, mode === "lgs" ? 2 : 1).map((s) => ({ L: s.L, R: s.R }));
    const q = new URLSearchParams();
    q.set("eq", eqOf(basis[0].L, basis[0].R));
    if (basis[1]) q.set("eq2", eqOf(basis[1].L, basis[1].R));
    if (ctxKey !== "algebra") q.set("ctx", ctxKey);
    const loc = typeof window !== "undefined" ? window.location : { origin: "", pathname: "" };
    return `${loc.origin}${loc.pathname}?${q.toString()}`;
  };
  const teilen = () => {
    const url = linkFor();
    setShare(url);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          () => setMsg({ t: "Link kopiert – wer ihn öffnet, bekommt genau diese Aufgabe.", ok: true }),
          () => setMsg({ t: "Der Link steht unten zum Kopieren bereit.", ok: true }));
        return;
      }
    } catch (e) { /* Zwischenablage nicht verfügbar */ }
    setMsg({ t: "Der Link steht unten zum Kopieren bereit.", ok: true });
  };
  useEffect(() => {
    try {
      const q = new URLSearchParams(startSuche.current);
      const st = q.get("st");
      if (st) {
        const d = decodeState(st);
        setScales(d.scales); setMode(d.mode); setPhase(d.phase);
        if (CONTEXTS[d.ctxKey]) setCtxKey(d.ctxKey);
        setTask(d.taskLen ? d.scales.slice(0, d.taskLen).map((sc) => ({ L: sc.prot[0].L, R: sc.prot[0].R })) : []);
        setActiveId(d.scales[0].id); setPast([]);
        setMsg({ t: "Stand aus der Adresszeile wiederhergestellt.", ok: true });
        wiederhergestellt.current = true;
        return;
      }
      const e1 = q.get("eq"), e2 = q.get("eq2"), c = q.get("ctx");
      if (c && CONTEXTS[c]) setCtxKey(c);
      wiederhergestellt.current = true;
      if (!e1) return;
      const parsed = (e2 ? [e1, e2] : [e1]).map(parseEquation);
      const fertig = parsed.map((pp) => (representable(pp.L, pp.R) ? pp : repairSteps(pp.L, pp.R)));
      setup(fertig.map((pp) => ({ L: pp.L, R: pp.R })), e2 ? "lgs" : "einzeln");
      setEq1(e1); if (e2) setEq2(e2);
      setMsg({ t: "Aufgabe aus dem Link geladen.", ok: true });
    } catch (err) {
      wiederhergestellt.current = true;
      setMsg({ t: `Der Link lässt sich nicht lesen: ${err.message || err}`, ok: false });
    }
  }, []);

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
      const imFeld = e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName);
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); }
      if (e.key === "Escape" && presenting) setPresenting(false);
      // Pfeiltasten nur in der Präsentation, sonst kollidieren sie mit der
      // Tastaturnavigation durch die Spielsteine.
      if (imFeld || !presenting) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); undo(); }
      if (e.key === "ArrowRight") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [presenting, past, future, scales]);

  /* ---- UI ---- */
  const btn = (extra = {}) => ({
    fontFamily: MONO, fontSize: 12 * (presenting ? 1.15 : 1), padding: presenting ? "8px 12px" : "6px 10px",
    borderRadius: 6, border: `1px solid ${C.ink2}`, background: "#fff", color: C.ink, cursor: "pointer", ...extra,
  });
  const chip = (on) => btn({ background: on ? C.ink : "#fff", color: on ? C.paper : C.ink, borderColor: C.ink });
  const card = { background: "#fff", border: `1px solid ${C.grid}`, borderRadius: 10, padding: 12 };
  const eyebrow = { fontFamily: MONO, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: C.brassDark, marginBottom: 8 };
  const miniPan = (p) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {KIND.filter((k) => !fZero(p[k])).map((k) => (
        <span key={k} style={{ display: "inline-flex", alignItems: "center", fontFamily: MONO, fontSize: 9, color: C.ink2 }}>
          {fStr(fAbs(p[k]))}
          <span style={{
            display: "inline-block", width: 8, height: 8, marginLeft: 2,
            borderRadius: k === "k" ? "50%" : 2,
            background: k === "k" ? C.ball : k === "x" ? C.x : C.y,
            border: `1px solid ${k === "k" ? C.ballEdge : "transparent"}`,
            opacity: fVal(p[k]) < 0 ? 0.5 : 1,
          }} />
        </span>
      ))}
      {panEmpty(p) && <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink2 }}>–</span>}
    </span>
  );

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
        [data-piece]:focus-visible, button:focus-visible { outline: 3px solid #2C5F8A; outline-offset: 2px; }
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
          {presenting && ["beides", "waage", "protokoll"].map((a) => (
            <button key={a} style={chip(ansicht === a)} onClick={() => setAnsicht(a)}
              title={a === "beides" ? "Waage und Umformungen nebeneinander" : a === "waage" ? "nur die Waage" : "nur die Äquivalenzumformungen"}>
              {a === "beides" ? "beides" : a === "waage" ? "nur Waage" : "nur Umformungen"}
            </button>
          ))}
          {presenting && <button style={chip(compact)} onClick={() => setCompact(!compact)}>
            {compact ? <ChevronDown size={12} style={{ display: "inline" }} /> : <ChevronUp size={12} style={{ display: "inline" }} />} Bedienung {compact ? "einblenden" : "ausblenden"}
          </button>}
          {bare ? null : phase === "bauen"
            ? <button style={btn({ background: C.ok, color: "#fff", borderColor: C.ok })} onClick={startUmformen}>Umformen starten</button>
            : <button style={chip(coupled)} onClick={() => setCoupled(!coupled)}>{coupled ? <Link2 size={12} style={{ display: "inline" }} /> : <Link2Off size={12} style={{ display: "inline" }} />} {coupled ? "beidseitig" : "frei"}</button>}
          {!bare && <button style={btn()} onClick={() => leereWaage(mode)}>leere Waage</button>}
          <button style={btn({ opacity: past.length ? 1 : 0.45 })} onClick={undo} title="Strg+Z, in der Präsentation auch Pfeil links"><Undo2 size={12} style={{ display: "inline" }} /> zurück</button>
          <button style={btn({ opacity: future.length ? 1 : 0.45 })} onClick={redo} title="Pfeil rechts in der Präsentation"><Redo2 size={12} style={{ display: "inline" }} /> vor</button>
          {!bare && <button style={chip(kalkuel)} onClick={() => setKalkuel(!kalkuel)} title="Rechnen ohne die Grenzen des Waagemodells">Kalkül {kalkuel ? "an" : "aus"}</button>}
          {!bare && <button style={chip(anti)} onClick={() => setAnti(!anti)} title="Rote Antikugeln: eine Kugel und eine Antikugel heben sich auf">Antikugeln {anti ? "an" : "aus"}</button>}
          {!bare && mode !== "lgs" && <button style={chip(showY)} onClick={() => setShowY(!showY)} title="Stellt zusätzlich violette y-Blöcke bereit">y-Blöcke {showY ? "an" : "aus"}</button>}
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
            <button style={btn()} onClick={teilen} title="Erzeugt einen Link, der genau diese Aufgabe öffnet"><LinkIcon size={12} style={{ display: "inline" }} /> Link</button>
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
              <button style={chip(hintStyle === "frage")} onClick={() => setHintStyle(hintStyle === "frage" ? "direkt" : "frage")}
                title="Fragend regt zum Nachdenken an, direkt sagt sofort, was zu tun ist">
                Hinweise: {hintStyle === "frage" ? "fragend" : "direkt"}
              </button>
            </div>
            {sheet && <textarea readOnly value={sheet} onFocus={(e) => e.target.select()} style={{ width: "100%", height: 120, marginTop: 8, fontFamily: MONO, fontSize: 11, padding: 8, border: `1px solid ${C.grid}`, borderRadius: 6 }} />}
          </div>
        )}

        {share && !presenting && (
          <div style={{ ...card, marginBottom: 12 }}>
            <div style={eyebrow}>Link zu dieser Aufgabe</div>
            <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
              <input readOnly value={share} onFocus={(e) => e.target.select()}
                style={{ flex: "1 1 260px", fontFamily: MONO, fontSize: 12, padding: "6px 8px", border: `1px solid ${C.ink2}`, borderRadius: 6 }} />
              <button style={btn()} onClick={() => setShare(null)}>schließen</button>
            </div>
          </div>
        )}

        <div className="flex gap-4" style={{
          alignItems: "flex-start",
          flexWrap: presenting && landscape ? "nowrap" : "wrap",
        }}>
          <div style={{
            flex: alleinstehend ? "1 1 100%" : presenting && landscape ? "1 1 58%" : "1 1 460px",
            minWidth: presenting ? 0 : 340,
          }}>
            <div data-drop="tray" style={{
              ...card, marginBottom: 10, display: bare ? "none" : "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              outline: hot === "tray" ? `2px dashed ${C.brassDark}` : "none", background: hot === "tray" ? "rgba(168,130,60,.15)" : "#fff",
            }}>
              <span style={{ ...eyebrow, margin: 0 }}>Kiste</span>
              {["k", "x", ...(hasY ? ["y"] : [])].map((k) => (
                <Piece key={k} kind={k} ctx={ctx} z={z} title={k === "k" ? ctx.unit : k === "x" ? ctx.xName : ctx.yName}
                  onPointerDown={(e) => startDrag(e, k, "tray", 1)} onActivate={() => trayActivate(k, 1)} />
              ))}
              {anti && <span style={{ display: "flex", gap: 6, alignItems: "center", paddingLeft: 8, borderLeft: `1px dashed ${C.grid}` }}>
                {["k", "x", ...(hasY ? ["y"] : [])].map((k) => <Piece key={"n" + k} kind={k} neg ctx={ctx} z={z} title="Antiteil"
                  onPointerDown={(e) => startDrag(e, k, "tray", -1)} onActivate={() => trayActivate(k, -1)} />)}
              </span>}
              {phase === "bauen" && (
                <button style={btn({ padding: "4px 8px" })} onClick={() => setActiveSide(activeSide === "L" ? "R" : "L")}
                  title="Wohin die Tastatureingabe legt">Zielschale: {activeSide === "L" ? "links" : "rechts"}</button>
              )}
              <span style={{ fontSize: 12.5, color: C.ink2, flex: "1 1 150px" }}>
                {anti ? "Ein rotes Antiteil und ein normales Teil heben sich gegenseitig auf." : "Auf eine Waagschale ziehen legt dazu, in die Kiste ziehen nimmt weg."}
              </span>
              <Trash2 size={16} color={C.ink2} />
            </div>

            {phase === "umformen" && task.length > 0 && ctxKey !== "algebra" && sachtext(task[0].L, task[0].R, ctx) && (
              <div style={{ ...card, marginBottom: 8, borderLeft: `4px solid ${C.brass}` }}>
                <div style={eyebrow}>Sachsituation</div>
                <div style={{ fontSize: 14.5, lineHeight: 1.5 }}>
                  {task.map((t, i) => <div key={i}>{sachtext(t.L, t.R, ctx)}</div>)}
                </div>
              </div>
            )}

            {zeigeWaage && <div className="flex flex-wrap" style={{ gap: 8 }}>
              {scales.map((s, idx) => {
                const az = anzeige(s);
                return (
                <div key={s.id} style={{ flex: `1 1 ${400 * z}px` }}>
                  <Waage scale={s} xv={az.x} yv={az.y} hint={az.hint} z={z} ctx={ctx} hot={hot} stage={stage}
                    drag={dragView} coupled={coupled && phase === "umformen"} hl={hl} setHl={setHl} enter={enter}
                    broken={s.prot.some((r) => r.bad)} phase={phase} kalkuel={kalkuel}
                    active={scales.length > 1 && s.id === activeId}
                    onFocus={() => setActiveId(s.id)}
                    onPieceDown={(e, kind, from) => { setActiveId(s.id); startDrag(e, kind, from, from.sign, from.menge || 1); }}
                    onPieceActivate={(kind, from) => { setActiveId(s.id); pieceActivate(kind, from); }} />
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
            </div>}

            {active.prot.length > 1 && !bare && zeigeWaage && (
              <div style={{ ...card, marginTop: 10 }}>
                <div style={eyebrow}>Schritte — Waage ({active.label})</div>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                  {active.prot.map((r, i) => {
                    const jetzt = i === active.prot.length - 1;
                    return (
                      <button key={i} onClick={() => jumpTo(active.id, i)} title={jetzt ? "aktueller Stand" : `zurück zu Schritt ${i + 1}`}
                        style={{
                          flex: "0 0 auto", textAlign: "left", padding: "6px 8px", borderRadius: 8, cursor: jetzt ? "default" : "pointer",
                          border: `1px solid ${jetzt ? C.brassDark : C.grid}`, background: jetzt ? "rgba(168,130,60,.12)" : "#fff",
                        }}>
                        <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink2, marginBottom: 3 }}>{i + 1}{r.note ? `  ${r.bad ? "⚠" : "|"} ${noteStr(r.note, ctx.sym)}` : ""}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {miniPan(r.L)}<span style={{ fontFamily: MONO, fontSize: 10 }}>=</span>{miniPan(r.R)}
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: 11, marginTop: 3, color: jetzt ? C.ink : C.ink2 }}>{eqOf(r.L, r.R, ctx.sym)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
                <div className="flex items-center gap-2" style={{ flexWrap: "wrap", marginTop: 8, borderTop: `1px dashed ${C.grid}`, paddingTop: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 12 }}>Ziel: {ctx.sym.x} =</span>
                  <input value={ziel} onChange={(e) => setZiel(e.target.value)} placeholder="z. B. 3"
                    style={{ width: 64, fontFamily: MONO, fontSize: 13, padding: "4px 6px", border: `1px solid ${C.ink2}`, borderRadius: 6 }} />
                  {ziel.trim() !== "" && (() => {
                    const soll = Number(String(ziel).replace(",", "."));
                    const lv = levelValues(active.L, active.R, xv, yv);
                    const passt = lv.ok && Number.isFinite(soll) && Math.abs(lv.x - soll) < 1e-9;
                    return <span style={{ fontFamily: MONO, fontSize: 12, color: passt ? C.ok : C.ink2 }}>
                      {passt ? "✓ die Waage passt zum Ziel" : lv.ok ? `noch nicht – aktuell ${ctx.sym.x} = ${Math.round(lv.x * 100) / 100}` : "so geht die Waage nie ins Gleichgewicht"}
                    </span>;
                  })()}
                </div>
              </div>
            )}

            <div style={{ ...card, marginTop: 10, opacity: phase === "bauen" ? 0.45 : 1, pointerEvents: phase === "bauen" ? "none" : "auto" }}>
              <div style={eyebrow}>Auf beiden Seiten zugleich{scales.length > 1 ? ` — Waage (${active.label})` : ""}</div>
              <div className="flex items-center gap-2" style={{ flexWrap: "wrap", marginBottom: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 12 }}>Anzahl</span>
                <input type="number" min={1} max={99} value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onBlur={() => setAmount(String(amt))}
                  aria-label="Anzahl der Teile je Umformung"
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

            <div style={{ ...card, marginTop: 10, display: phase === "bauen" || bare ? "none" : "block" }}>
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
                <button style={btn()} onClick={() => { if (loesung.x) setXv(fVal(loesung.x)); if (loesung.y) setYv(fVal(loesung.y)); setProbing(true); setZeigeLoesung(true); }}><Eye size={11} style={{ display: "inline" }} /> zeigen</button>
                {probing && <button style={btn()} onClick={() => setProbing(false)}>Probieren beenden</button>}
                {gefunden && <span style={{ fontFamily: MONO, fontSize: 12, color: C.ok }}>alle Waagen waagerecht</span>}
              </div>
            </div>
          </div>

          {zeigeProt && <div style={{
            flex: alleinstehend ? "1 1 100%" : presenting && landscape ? "1 1 42%" : "1 1 320px",
            minWidth: presenting ? 0 : 290,
          }}>
            <div style={card}>
              <div style={eyebrow}>{phase === "bauen" ? "Deine Gleichung entsteht" : "Symbolische Ebene"}</div>
              {scales.map((s) => (
                <div key={s.id} style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: SERIF, fontWeight: 700, color: C.brassDark, fontSize: 15 * zP, marginBottom: 4 }}>({s.label})</div>
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
                      <div key={i} className="flex" style={{ fontFamily: MONO, fontSize: 14 * zP, lineHeight: 1.8, color: live ? C.ink : C.ink2 }}>
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
                : zeigeLoesung
                  ? <div style={{ borderTop: `1px solid ${C.grid}`, paddingTop: 8, fontFamily: MONO, fontSize: 13 * zP }}>
                    Lösung: <strong>{loesung.text}</strong>
                    <button style={btn({ padding: "2px 8px", marginLeft: 8 })} onClick={() => setZeigeLoesung(false)}>verbergen</button>
                  </div>
                  : <div style={{ borderTop: `1px solid ${C.grid}`, paddingTop: 8 }}>
                    <button style={btn()} onClick={() => setZeigeLoesung(true)}><Eye size={11} style={{ display: "inline" }} /> Lösung anzeigen</button>
                  </div>}
              {phase === "umformen" && zeigeLoesung && probe && loesung.x && probe.map((p) => (
                <div key={p.i} style={{ fontFamily: MONO, fontSize: 12 * zP, color: C.ink2 }}>Probe {p.eq}: {p.l} = {p.r} {p.ok ? "✓" : "✗"}</div>
              ))}
            </div>

            <div role="status" aria-live="polite" style={{
              display: "flex", gap: 8, marginTop: 10, padding: 12, borderRadius: 10,
              background: msg.ok ? "rgba(62,122,86,.10)" : "rgba(176,69,58,.10)",
              border: `1px solid ${msg.ok ? C.ok : C.neg}`,
            }}>
              <Lightbulb size={16} color={msg.ok ? C.ok : C.neg} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13.5 * Math.min(zP, 1.6), lineHeight: 1.45 }}>
                {msg.t}
                {msg.aktion && (
                  <div style={{ marginTop: 8 }}>
                    <button style={btn({ borderColor: C.ink, background: C.ink, color: C.paper })}
                      onClick={() => { msg.aktion.run(); setMsg({ t: "Kalkülmodus: Die Waage ist verlassen, negative Anzahlen und ungerade Teilungen sind jetzt erlaubt. Das Protokoll läuft weiter.", ok: true }); }}>
                      {msg.aktion.label}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!presenting && (
              <div style={{ marginTop: 10, fontSize: 12.5, color: C.ink2, lineHeight: 1.5 }}>
                <strong style={{ color: C.ink }}>Legende:</strong> {ctx.unit} = 1 · {ctx.xName} = {ctx.sym.x}{hasY ? ` · ${ctx.yName} = ${ctx.sym.y}` : ""}.
                Tippen nimmt beidseitig weg, Strg/Cmd + Z geht zurück.
              </div>
            )}
          </div>}
        </div>
      </div>
    </div>
  );
}
