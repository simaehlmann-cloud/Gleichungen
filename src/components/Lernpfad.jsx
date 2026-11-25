import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, Lightbulb, Lock, RotateCcw, Scale } from "lucide-react";
import { C, MONO, SERIF } from "../lib/tokens.js";
import { PFADE, STATIONEN } from "../lib/lernpfade.js";
import { geschafft, erreichbar } from "../lib/fortschritt.js";

/* Lernpfade: Übersicht mit Stationen, Einführung einer Station (Merkkasten und
   Beispiel) und die Leiste über der Arbeitsfläche, die Aufgabe, Eingabe,
   Rückmeldung und Fortschritt zeigt. Rechnen und Bewerten: lib/lernpfade.js. */
const ICON = { size: 14, style: { flexShrink: 0 } };
const karte = { background: "#fff", border: `1px solid ${C.grid}`, borderRadius: 14, padding: "16px 16px 14px" };
const augenbraue = { fontFamily: MONO, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: C.brassDark };
const knopf = (extra = {}) => ({
  fontFamily: MONO, fontSize: 13, padding: "8px 12px", minHeight: 40, borderRadius: 8, border: `1px solid ${C.ink2}`,
  background: "#fff", color: C.ink, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, ...extra,
});
const haupt = (farbe = C.ink) => knopf({ background: farbe, color: "#fff", borderColor: farbe });
const feld = { fontFamily: MONO, fontSize: 15, padding: "8px 10px", border: `1px solid ${C.ink2}`, borderRadius: 6, minHeight: 40, boxSizing: "border-box" };

/* Punkte für den Fortschritt einer Station */
function Punkte({ n, ziel, gross }) {
  const d = gross ? 12 : 8;
  return (
    <span aria-label={`${Math.min(n, ziel)} von ${ziel} geschafft`} style={{ display: "inline-flex", gap: gross ? 5 : 3 }}>
      {Array.from({ length: ziel }, (_, i) => (
        <span key={i} style={{ width: d, height: d, borderRadius: "50%", border: `1.5px solid ${C.ok}`, background: i < n ? C.ok : "transparent" }} />
      ))}
    </span>
  );
}

function Status({ stand, s, voll }) {
  if (geschafft(stand, s.id)) return <span style={{ color: C.ok, display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 12 }}><Check size={14} /> geschafft</span>;
  if (!erreichbar(stand, s.id)) return <span style={{ color: C.ink2, display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 12 }}><Lock size={12} /> später</span>;
  if (s.index > 0 && !voll) return <span style={{ color: C.brassDark, display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 12 }}><Lock size={12} /> Vollversion</span>;
  return <Punkte n={stand[s.id] || 0} ziel={s.ziel} />;
}

function Einfuehrung({ s, stand, voll, onStart, onSperre, onZurueck }) {
  const pfad = PFADE.find((p) => p.id === s.pfad);
  const gesperrt = s.index > 0 && !voll;
  return (
    <article style={{ ...karte, maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }} aria-labelledby="lp-intro-titel">
      <div style={augenbraue}>{pfad.titel} · Station {s.index + 1} von {pfad.stationen.length}</div>
      <h2 id="lp-intro-titel" style={{ fontFamily: SERIF, fontSize: 26, margin: 0, color: C.ink, lineHeight: 1.15 }}>{s.titel}</h2>
      <div style={{ borderLeft: `4px solid ${C.brass}`, background: "rgba(168,130,60,.08)", padding: "10px 12px", borderRadius: "0 8px 8px 0" }}>
        <div style={{ ...augenbraue, marginBottom: 6 }}>Merke</div>
        {s.merk.map((m, i) => <p key={i} style={{ margin: i ? "8px 0 0" : 0, fontSize: 15, lineHeight: 1.55, color: C.ink }}>{m}</p>)}
      </div>
      {s.beispiel.length > 0 && (
        <div>
          <div style={{ ...augenbraue, marginBottom: 6 }}>Beispiel</div>
          <table style={{ borderCollapse: "collapse", fontFamily: MONO, fontSize: 15 }}>
            <tbody>
              {s.beispiel.map(([gl, notiz], i) => (
                <tr key={i}>
                  <td style={{ padding: "3px 14px 3px 0", whiteSpace: "nowrap" }}>{gl}</td>
                  <td style={{ padding: "3px 0", color: C.brassDark }}>{notiz}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ margin: 0, fontSize: 14, color: C.ink2 }}>
        {s.test ? `Löse ${s.ziel} Aufgaben richtig, dann hast du den Lernpfad abgeschlossen.` : `Löse ${s.ziel} Aufgaben richtig, dann ist die Station geschafft und die nächste öffnet sich.`}
        {" "}Bisher: {Math.min(stand[s.id] || 0, s.ziel)} von {s.ziel}.
      </p>
      <div className="flex flex-wrap gap-2">
        <button style={knopf()} onClick={onZurueck}><ArrowLeft {...ICON} /> Übersicht</button>
        {gesperrt
          ? <button style={haupt(C.brassDark)} onClick={onSperre}><Lock {...ICON} /> Mit der Vollversion weiterlernen</button>
          : <button style={haupt(C.ok)} onClick={() => onStart(s.id)}>Los geht’s <ArrowRight {...ICON} /></button>}
      </div>
    </article>
  );
}

function LernpfadUebersicht({ stand, voll, onStart, onSperre, onStartseite, onZuruecksetzen, auswahl, setAuswahl }) {
  /* Zurücksetzen braucht eine Bestätigung – ein versehentliches Tippen soll keinen Lernstand löschen */
  const [bestaetigen, setBestaetigen] = useState(null);
  if (auswahl && STATIONEN[auswahl]) {
    return <Einfuehrung s={STATIONEN[auswahl]} stand={stand} voll={voll} onStart={onStart} onSperre={onSperre} onZurueck={() => setAuswahl(null)} />;
  }
  return (
    <section aria-label="Lernpfade" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="flex flex-wrap items-center gap-2">
        <button style={knopf()} onClick={onStartseite}><ArrowLeft {...ICON} /> Start</button>
        <h1 style={{ fontFamily: SERIF, fontSize: "clamp(24px, 5vw, 32px)", margin: "0 0 0 6px", color: C.ink }}>Lernpfade</h1>
      </div>
      <p style={{ margin: 0, fontSize: 14.5, color: C.ink2, maxWidth: 720 }}>
        Schritt für Schritt allein lernen – in der Reihenfolge deines Mathebuchs. Jede Station beginnt mit einem Merkkasten und
        einem Beispiel. Danach übst du an der Waage. Dein Fortschritt bleibt auf diesem Gerät gespeichert.
      </p>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {PFADE.map((p) => {
          const fertig = p.stationen.filter((s) => geschafft(stand, s.id)).length;
          return (
            <div key={p.id} style={karte} data-pfad={p.id}>
              <div style={augenbraue}>{fertig} von {p.stationen.length} Stationen geschafft</div>
              <h2 style={{ fontFamily: SERIF, fontSize: 22, margin: "4px 0 2px", color: C.ink }}>{p.titel}</h2>
              <div style={{ fontSize: 14, color: C.ink2, marginBottom: 10 }}>{p.unter}</div>
              <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {p.stationen.map((s) => {
                  const offen = erreichbar(stand, s.id);
                  return (
                    <li key={s.id}>
                      <button data-station={s.id} disabled={!offen} onClick={() => setAuswahl(s.id)}
                        aria-label={`Station ${s.index + 1}: ${s.titel}${offen ? "" : " (noch gesperrt)"}`}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "10px 12px", minHeight: 48,
                          borderRadius: 10, border: `1px solid ${geschafft(stand, s.id) ? C.ok : C.grid}`, cursor: offen ? "pointer" : "default",
                          background: offen ? "#fff" : "#F4F5F1", color: offen ? C.ink : C.ink2, opacity: offen ? 1 : 0.75,
                        }}>
                        <span style={{ fontFamily: MONO, fontSize: 12, width: 22, flexShrink: 0, color: C.ink2 }}>{s.test ? "★" : s.index + 1}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontWeight: 600, fontSize: 14.5 }}>{s.titel}</span>
                          <span style={{ display: "block", fontSize: 12.5, color: C.ink2 }}>{s.kurz}</span>
                        </span>
                        <Status stand={stand} s={s} voll={voll} />
                      </button>
                    </li>
                  );
                })}
              </ol>
              {p.stationen.some((s) => stand[s.id]) && (bestaetigen === p.id
                ? <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 10 }}>
                  <span style={{ fontSize: 13 }}>Alle Stationen dieses Pfads auf null?</span>
                  <button style={knopf({ fontSize: 12, minHeight: 34, padding: "4px 10px", color: C.neg, borderColor: C.neg })}
                    onClick={() => { onZuruecksetzen(p.id); setBestaetigen(null); }}>Ja, zurücksetzen</button>
                  <button style={knopf({ fontSize: 12, minHeight: 34, padding: "4px 10px" })} onClick={() => setBestaetigen(null)}>Abbrechen</button>
                </div>
                : <button style={{ ...knopf({ fontSize: 12, minHeight: 34, padding: "4px 10px", marginTop: 10, color: C.ink2, borderColor: C.grid }) }}
                  onClick={() => setBestaetigen(p.id)}><RotateCcw size={12} /> Fortschritt zurücksetzen</button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---- Leiste über der Arbeitsfläche ---- */
function LernpfadLeiste({ station: s, lp, stand, waageHilfe, onWaageHilfe, onPruefen, onVorstufe, onTipp, onLoesung, onNaechste, onWeiter, onUebersicht }) {
  const a = lp.aufgabe;
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [v1, setV1] = useState("");
  const [v2, setV2] = useState("");
  const pfad = PFADE.find((p) => p.id === s.pfad);
  const naechste = pfad.stationen[s.index + 1];
  const istGeschafft = geschafft(stand, s.id);
  const lgsArt = a.art === "lgs" || a.art === "paar";
  const enter = (f) => (e) => { if (e.key === "Enter") f(); };
  const pruefen = () => onPruefen({ x, y });
  const vorstufe = () => onVorstufe(a.vorstufe.anzahl === 2 ? [v1, v2] : v1);

  return (
    <section aria-label="Lernpfad" style={{ ...karte, marginBottom: 12, borderColor: C.ok, borderWidth: 2, display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="flex flex-wrap items-center gap-2" style={{ justifyContent: "space-between" }}>
        <div style={{ minWidth: 0 }}>
          <div style={augenbraue}>{pfad.titel} · Station {s.index + 1} von {pfad.stationen.length}</div>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 19, color: C.ink }}>{s.titel}</div>
        </div>
        <Punkte n={stand[s.id] || 0} ziel={s.ziel} gross />
      </div>

      <div data-lp-aufgabe style={{ background: "rgba(62,122,86,.07)", borderRadius: 8, padding: "10px 12px" }}>
        {a.vorstufe && a.vorstufe.typ === "sach"
          ? <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.5 }}>{a.zeige[0]}</p>
          : a.zeige.map((z, i) => <div key={i} style={{ fontFamily: MONO, fontSize: 18, lineHeight: 1.5 }}>{z}</div>)}
        {a.art === "paar" && <div style={{ fontSize: 13.5, color: C.ink2, marginTop: 4 }}>Finde ein Zahlenpaar (x | y), das die Gleichung erfüllt.</div>}
      </div>

      {lp.stufe === "vor" && a.vorstufe.typ === "klammer" && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="lp-v1" style={{ fontSize: 14 }}>Schreib die Gleichung ohne Klammer:</label>
          <input id="lp-v1" data-lp-vor value={v1} onChange={(e) => setV1(e.target.value)} onKeyDown={enter(vorstufe)} autoComplete="off"
            style={{ ...feld, flex: "1 1 220px" }} />
          <button style={haupt()} onClick={vorstufe}><Check {...ICON} /> prüfen</button>
        </div>
      )}
      {lp.stufe === "vor" && a.vorstufe.typ === "sach" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 14 }}>
            {Object.entries(a.vorstufe.variablen).map(([k, t]) => <div key={k}><em style={{ fontFamily: SERIF, fontWeight: 700 }}>{k}</em> = {t}</div>)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="lp-v1" style={{ fontSize: 14 }}>{a.vorstufe.anzahl === 2 ? "Gleichung (I):" : "Deine Gleichung:"}</label>
            <input id="lp-v1" data-lp-vor value={v1} onChange={(e) => setV1(e.target.value)} onKeyDown={enter(vorstufe)} autoComplete="off" style={{ ...feld, flex: "1 1 200px" }} />
          </div>
          {a.vorstufe.anzahl === 2 && (
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="lp-v2" style={{ fontSize: 14 }}>Gleichung (II):</label>
              <input id="lp-v2" data-lp-vor value={v2} onChange={(e) => setV2(e.target.value)} onKeyDown={enter(vorstufe)} autoComplete="off" style={{ ...feld, flex: "1 1 200px" }} />
            </div>
          )}
          <div><button style={haupt()} onClick={vorstufe}><Check {...ICON} /> Gleichung prüfen</button></div>
        </div>
      )}

      {lp.stufe === "loesen" && !lp.erledigt && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="lp-x" style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 17 }}>x =</label>
          <input id="lp-x" data-lp-x value={x} onChange={(e) => setX(e.target.value)} onKeyDown={enter(pruefen)} inputMode="text" autoComplete="off" style={{ ...feld, width: 90 }} />
          {lgsArt && <>
            <label htmlFor="lp-y" style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 17 }}>y =</label>
            <input id="lp-y" data-lp-y value={y} onChange={(e) => setY(e.target.value)} onKeyDown={enter(pruefen)} inputMode="text" autoComplete="off" style={{ ...feld, width: 90 }} />
          </>}
          <button style={haupt()} onClick={pruefen}><Check {...ICON} /> prüfen</button>
          {s.sonder && <>
            <span style={{ fontSize: 13, color: C.ink2 }}>oder:</span>
            <button style={knopf()} onClick={() => onPruefen({ art: "keine" })}>keine Lösung</button>
            <button style={knopf()} onClick={() => onPruefen({ art: "alle" })}>{a.art === "lgs" ? "unendlich viele Lösungen" : "jede Zahl ist Lösung"}</button>
          </>}
        </div>
      )}

      {lp.meldung && (
        <div role="status" aria-live="polite" style={{
          padding: "10px 12px", borderRadius: 8, fontSize: 14.5, lineHeight: 1.45,
          background: lp.meldung.ok ? "rgba(62,122,86,.12)" : "rgba(176,69,58,.10)", border: `1px solid ${lp.meldung.ok ? C.ok : C.neg}`,
        }}>{lp.meldung.t}</div>
      )}
      {lp.tipp > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {s.tipps.slice(0, lp.tipp).map((tp, i) => (
            <div key={i} style={{ fontSize: 14, display: "flex", gap: 6 }}><Lightbulb size={15} color={C.brassDark} style={{ flexShrink: 0, marginTop: 2 }} /> {tp}</div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {lp.erledigt && <button style={haupt(C.ok)} onClick={onNaechste}>Nächste Aufgabe <ArrowRight {...ICON} /></button>}
        {lp.erledigt && istGeschafft && naechste && <button style={haupt()} onClick={() => onWeiter(naechste.id)}>Zur nächsten Station <ArrowRight {...ICON} /></button>}
        {!lp.erledigt && lp.tipp < s.tipps.length && <button style={knopf()} onClick={onTipp}><Lightbulb {...ICON} /> Tipp</button>}
        {!lp.erledigt && lp.versucht && !lp.gezeigt && !s.test && <button style={knopf()} onClick={onLoesung}><Eye {...ICON} /> Lösung zeigen</button>}
        {s.waage === "aus" && lp.stufe === "loesen" && (
          <button style={knopf()} aria-pressed={waageHilfe} onClick={onWaageHilfe}><Scale {...ICON} /> Waage {waageHilfe ? "ausblenden" : "als Hilfe einblenden"}</button>
        )}
        <button style={{ ...knopf(), marginLeft: "auto" }} onClick={onUebersicht}><ArrowLeft {...ICON} /> Übersicht</button>
      </div>
    </section>
  );
}

export { LernpfadUebersicht, LernpfadLeiste, Punkte };
