import React from "react";
import { Dices, Play, PenLine, Settings2, Sparkles, Info, Lock, ArrowRight } from "lucide-react";
import { C, MONO, SERIF } from "../lib/tokens.js";
import { P } from "../lib/fraction.js";
import { A1, A2, LEVELS } from "../lib/tasks.js";
import { Waage } from "./Waage.jsx";
import pkg from "../../package.json";

/* Startseite: zwei Wege in die Arbeit (Gleichungen, Gleichungssysteme),
   darunter Weiterarbeiten, Einstellungen, Vollversion und Über die App. */
const knopf = (extra = {}) => ({
  fontFamily: MONO, fontSize: 13, padding: "9px 12px", minHeight: 40, borderRadius: 8,
  border: `1px solid ${C.ink2}`, background: "#fff", color: C.ink, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6, ...extra,
});
const dunkel = knopf({ background: C.ink, color: C.paper, borderColor: C.ink });
const kachel = {
  background: "#fff", border: `1px solid ${C.grid}`, borderRadius: 14, padding: 18,
  display: "flex", flexDirection: "column", gap: 12, minWidth: 0,
};
const titel = { fontFamily: SERIF, fontSize: 22, fontWeight: 700, margin: 0 };
const unter = { fontSize: 14, color: C.ink2, margin: 0, lineHeight: 1.45 };
const ICON = { size: 14, style: { flexShrink: 0 } };

/* Waage zur Begrüßung – nur Bild, nicht bedienbar */
const BEISPIEL = { id: 0, label: "", L: P(3, 0, 2), R: P(1, 0, 8), prot: [] };
const nichts = () => {};

function Startseite({ ctx, stil, voll, kaufbar, level, setLevel, eq1, setEq1, onBauen, onZufall, onBeispiel, onSelbst, weiter, onWeiter, onPanel, panel }) {
  const z = 0.72;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
        <div style={{ minWidth: 0, flex: "1 1 280px" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: C.brassDark }}>Waagemodell</div>
          <h1 style={{ fontFamily: SERIF, fontSize: 34, margin: "2px 0 6px", fontWeight: 700, textWrap: "balance" }}>Gleichungen im Gleichgewicht</h1>
          <p style={{ ...unter, maxWidth: 520 }}>Leg Kugeln und Blöcke auf die Waage. Was du auf einer Seite tust, kippt sie – was du auf beiden Seiten tust, ist eine Äquivalenzumformung.</p>
        </div>
        <div aria-hidden="true" style={{ pointerEvents: "none", flex: "0 0 auto" }}>
          <Waage scale={BEISPIEL} xv={3} yv={1} z={z} ctx={ctx} stil={stil} onFocus={nichts} onPieceDown={nichts} onPieceActivate={nichts}
            setHl={nichts} phase="umformen" />
        </div>
      </header>

      {weiter && (
        <button style={{ ...dunkel, alignSelf: "flex-start", fontSize: 14 }} onClick={onWeiter}>
          Weiterarbeiten <ArrowRight {...ICON} />
        </button>
      )}

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <section style={kachel} aria-labelledby="t-gl">
          <h2 id="t-gl" style={titel}>Gleichungen</h2>
          <p style={unter}>Eine Waage, eine Unbekannte. Von „Kugeln wegnehmen“ bis zu Brüchen und Antikugeln.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <select style={knopf()} value={level === 5 ? 1 : level} onChange={(e) => setLevel(+e.target.value)} aria-label="Niveaustufe">
              {LEVELS.filter((l) => l.id !== 5).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <button style={dunkel} onClick={() => onZufall(level === 5 ? 1 : level)}><Dices {...ICON} /> Neue Aufgabe</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <input value={eq1} onChange={(e) => setEq1(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onBauen()}
              placeholder="z. B. 2(x + 3) = 4x − 2" aria-label="Gleichung eingeben"
              style={{ flex: "1 1 170px", minWidth: 0, fontFamily: MONO, fontSize: 15, padding: "9px 10px", border: `1px solid ${C.ink2}`, borderRadius: 8 }} />
            <button style={knopf()} onClick={onBauen}><Play {...ICON} /> Waage bauen</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button style={knopf()} onClick={() => onSelbst("einzeln")}><PenLine {...ICON} /> Selbst aufbauen</button>
            <select style={knopf()} value="" onChange={(e) => onBeispiel("einzeln", +e.target.value)} aria-label="Beispielaufgabe Gleichungen">
              <option value="" disabled>Beispiel …</option>
              {A1.map((a, i) => <option key={i} value={i}>{a.name}</option>)}
            </select>
          </div>
        </section>

        <section style={kachel} aria-labelledby="t-lgs">
          <h2 id="t-lgs" style={titel}>{!voll && <Lock size={16} style={{ marginRight: 6 }} aria-label="Vollversion" />}Lineare Gleichungssysteme</h2>
          <p style={unter}>Zwei Waagen, zwei Unbekannte. Lösen durch Einsetzen, Gleichsetzen oder Zusammenschütten.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button style={dunkel} onClick={() => onZufall(5)}><Dices {...ICON} /> Neue Aufgabe</button>
            <button style={knopf()} onClick={() => onSelbst("lgs")}><PenLine {...ICON} /> Selbst aufbauen</button>
            <select style={knopf()} value="" onChange={(e) => onBeispiel("lgs", +e.target.value)} aria-label="Beispielaufgabe Gleichungssysteme">
              <option value="" disabled>Beispiel …</option>
              {A2.map((a, i) => <option key={i} value={i}>{a.name}</option>)}
            </select>
          </div>
          {!voll && <p style={{ ...unter, fontSize: 13 }}>Gehört zur Vollversion.</p>}
        </section>
      </div>

      <nav aria-label="Weitere" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button style={knopf(panel === "einstellungen" ? { background: C.ink, color: C.paper } : {})} aria-expanded={panel === "einstellungen"} onClick={() => onPanel("einstellungen")}><Settings2 {...ICON} /> Einstellungen</button>
        {kaufbar && <button style={knopf(panel === "vollversion" ? { background: C.ink, color: C.paper } : {})} aria-expanded={panel === "vollversion"} onClick={() => onPanel("vollversion")}><Sparkles {...ICON} /> Vollversion{voll ? " ✓" : ""}</button>}
        <button style={knopf(panel === "ueber" ? { background: C.ink, color: C.paper } : {})} aria-expanded={panel === "ueber"} onClick={() => onPanel("ueber")}><Info {...ICON} /> Über die App</button>
      </nav>
    </div>
  );
}

function Ueber({ onZu }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.grid}`, borderRadius: 10, padding: 16, maxWidth: 680, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: C.brassDark }}>Über die App</div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
        <strong>Waagemodell – Gleichungen im Gleichgewicht</strong>, Version {pkg.version}. Ein Werkzeug für den Mathematikunterricht:
        Gleichungen und Gleichungssysteme werden enaktiv an der Balkenwaage gelöst, die Äquivalenzumformungen laufen symbolisch mit.
      </p>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.6 }}>
        <li>Ein Teil auf nur einer Seite wegnehmen oder dazulegen kippt die Waage: aus der Gleichung wird eine Ungleichung.</li>
        <li>Dasselbe auf der anderen Seite stellt das Gleichgewicht wieder her – das ist eine Äquivalenzumformung und wird notiert.</li>
        <li>Den Rechenweg blendest du unter Einstellungen → „Rechenweg rechts“ ein.</li>
      </ul>
      <p style={{ margin: 0, fontSize: 13, color: C.ink2, lineHeight: 1.5 }}>
        Datenschutz: Die App braucht kein Konto, funktioniert offline und sammelt keine Daten. Einstellungen bleiben nur auf diesem Gerät.
      </p>
      <p style={{ margin: 0, fontSize: 13, color: C.ink2 }}>Entwickelt von Simon Mählmann · Wisdompeak Apps</p>
      <div><button style={knopf()} onClick={onZu}>schließen</button></div>
    </div>
  );
}

export { Startseite, Ueber };
