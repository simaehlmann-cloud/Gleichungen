import React, { useState } from "react";
import { ArrowRight, Lock, X } from "lucide-react";
import { C, MONO, SERIF } from "../lib/tokens.js";
import { P } from "../lib/fraction.js";
import { LEVELS } from "../lib/tasks.js";
import { Waage } from "./Waage.jsx";
import pkg from "../../package.json";

/* Startseite: zwei farbige Blöcke als Einstieg (Gleichungen, Gleichungssysteme),
   darunter klein die Nebenwege. Alles Weitere – Niveaustufe, Beispiel, eigene
   Gleichung, leere Waage – liegt auf der Arbeitsfläche unter „Aufgabe“. */
const ICON = { size: 14, style: { flexShrink: 0 } };

/* Waage zur Begrüßung – nur Bild, nicht bedienbar */
const BEISPIEL = { id: 0, label: "", L: P(3, 0, 2), R: P(1, 0, 8), prot: [] };
const nichts = () => {};

/* Kleine Sinnbilder auf den Blöcken: Kugeln und Blöcke wie auf der Waage */
function Sinnbild({ lgs }) {
  const block = (x, farbe, rand, zeichen) => (
    <g key={zeichen + x}>
      <rect x={x} y={14} width={26} height={26} rx={5} fill={farbe} stroke={rand} strokeWidth={1.5} />
      <text x={x + 13} y={32} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontWeight={700} fontSize={16} fill="#fff">{zeichen}</text>
    </g>
  );
  const kugel = (cx) => <circle key={cx} cx={cx} cy={31} r={8} fill={C.ball} stroke={C.ballEdge} strokeWidth={1.5} />;
  return (
    <svg width={lgs ? 112 : 92} height={46} viewBox={`0 0 ${lgs ? 112 : 92} 46`} aria-hidden="true" style={{ flexShrink: 0 }}>
      {lgs
        ? [block(2, C.x, C.xDark, "x"), block(32, C.y, C.yDark, "y"), kugel(72), kugel(92)]
        : [block(2, C.x, C.xDark, "x"), kugel(46), kugel(66), kugel(84)]}
    </svg>
  );
}

function Startseite({ ctx, stil, voll, kaufbar, level, weiter, onWeiter, onGleichungen, onLgs, onPanel, panel }) {
  const stufe = LEVELS.find((l) => l.id === (level === 5 ? 1 : level)) || LEVELS[0];
  const fuss = [
    ["einstellungen", "Einstellungen"],
    ...(kaufbar ? [["vollversion", voll ? "Vollversion ✓" : "Vollversion"]] : []),
    ["ueber", "Über die App"],
    ["rechtliches", "Datenschutz & Impressum"],
  ];
  return (
    <div className="startseite">
      <header className="start-kopf">
        <div style={{ minWidth: 0, flex: "1 1 260px" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: C.brassDark }}>Waagemodell</div>
          <h1 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 6vw, 40px)", margin: "4px 0 0", fontWeight: 700, lineHeight: 1.1, textWrap: "balance", color: C.ink }}>
            Gleichungen im Gleichgewicht
          </h1>
        </div>
        <div aria-hidden="true" className="start-waage">
          <Waage scale={BEISPIEL} xv={3} yv={1} z={0.62} ctx={ctx} stil={stil} onFocus={nichts} onPieceDown={nichts} onPieceActivate={nichts}
            setHl={nichts} phase="umformen" />
        </div>
      </header>

      {weiter && (
        <button className="start-weiter" onClick={onWeiter}>
          Weiterarbeiten <ArrowRight {...ICON} />
        </button>
      )}

      <div className="start-bloecke">
        <button id="t-gl" className="start-block start-block--gl" onClick={onGleichungen}
          aria-label={`Gleichungen – neue Aufgabe, ${stufe.name}`}>
          <span className="start-block__titel">Gleichungen</span>
          <span className="start-block__unter">Eine Waage, eine Unbekannte</span>
          <span className="start-block__fuss">
            <Sinnbild />
            <span className="start-block__los">Los <ArrowRight {...ICON} /></span>
          </span>
        </button>

        <button id="t-lgs" className="start-block start-block--lgs" onClick={onLgs}
          aria-label={`Lineare Gleichungssysteme – neue Aufgabe${voll ? "" : " (Vollversion)"}`}>
          <span className="start-block__titel">Lineare Gleichungssysteme</span>
          <span className="start-block__unter">Zwei Waagen, zwei Unbekannte</span>
          <span className="start-block__fuss">
            <Sinnbild lgs />
            <span className="start-block__los">
              {voll ? <>Los <ArrowRight {...ICON} /></> : <><Lock size={13} style={{ flexShrink: 0 }} /> Vollversion</>}
            </span>
          </span>
        </button>
      </div>

      <nav aria-label="Weitere" className="start-fuss">
        {fuss.map(([k, name]) => (
          <button key={k} className={"start-fuss__link" + (panel === k ? " ist-offen" : "")} aria-expanded={panel === k} onClick={() => onPanel(k)}>{name}</button>
        ))}
      </nav>
    </div>
  );
}

/* ---- Gemeinsamer Rahmen für die Textfenster ---- */
const rahmen = { background: "#fff", border: `1px solid ${C.grid}`, borderRadius: 14, padding: "18px 18px 16px", maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 };
const augenbraue = { fontFamily: MONO, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: C.brassDark };
const h3 = { fontFamily: SERIF, fontSize: 19, margin: "10px 0 0", fontWeight: 700, color: C.ink };
const absatz = { margin: 0, fontSize: 14.5, lineHeight: 1.6, color: C.ink };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14.5, lineHeight: 1.6, color: C.ink };
const zuKnopf = {
  fontFamily: MONO, fontSize: 13, padding: "8px 12px", minHeight: 40, borderRadius: 8, border: `1px solid ${C.ink2}`,
  background: "#fff", color: C.ink, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
};

function Ueber({ onZu }) {
  return (
    <article style={rahmen} aria-labelledby="ueber-titel">
      <div style={augenbraue}>Über die App</div>
      <h2 id="ueber-titel" style={{ fontFamily: SERIF, fontSize: 24, margin: 0, color: C.ink }}>Waagemodell – Gleichungen im Gleichgewicht</h2>
      <p style={absatz}>
        Die App ist ein Werkzeug für den Mathematikunterricht der Sekundarstufe I. Gleichungen und lineare Gleichungssysteme
        werden an einer Balkenwaage gelöst: Was mit den Händen an der Waage geschieht, steht gleichzeitig als
        Äquivalenzumformung in mathematischer Schreibweise daneben. So wird sichtbar, <em>warum</em> eine Umformung erlaubt ist –
        und nicht nur, <em>dass</em> sie funktioniert.
      </p>

      <h3 style={h3}>Die Idee</h3>
      <p style={absatz}>
        Eine Gleichung ist eine Waage im Gleichgewicht. Links und rechts liegt gleich viel. Jeder x-Block wiegt gleich viel,
        nur weiß man nicht, wie viel – das ist die Unbekannte. Kugeln stehen für bekannte Zahlen. Ziel ist es, die Waage so
        umzubauen, dass auf einer Seite ein einzelner Block liegt und das Gleichgewicht erhalten bleibt. Dann kann man auf der
        anderen Seite ablesen, wie schwer er ist.
      </p>

      <h3 style={h3}>So arbeitest du mit der Waage</h3>
      <ul style={liste}>
        <li><strong>Teile auflegen und wegnehmen:</strong> Aus der Kiste unter der Waage ziehst du Kugeln und Blöcke auf eine Schale. Tippst du ein Teil auf der Schale an, nimmst du es wieder herunter.</li>
        <li><strong>Nur eine Seite verändern:</strong> Die Waage kippt. Aus der Gleichung wird eine Ungleichung (&lt; oder &gt;) – genau das zeigt die App an der Waage und in der Schreibweise.</li>
        <li><strong>Beide Seiten gleich verändern:</strong> Das Gleichgewicht ist wieder da. Erst jetzt ist es eine Äquivalenzumformung, und sie wird mit Rechenzeichen notiert, etwa „| − 2“.</li>
        <li><strong>Umformungsleiste:</strong> Mit „− Kugel“ oder „− x-Block“ nimmst du auf beiden Seiten zugleich etwas weg. „In … Haufen teilen“ zerlegt beide Schalen in gleich schwere Haufen – das ist die Division.</li>
        <li><strong>Lösung prüfen:</strong> Mit dem Regler unter „Ausprobieren“ stellst du ein, wie schwer ein Block ist. Die Waage zeigt sofort, ob der Wert passt. Die Probe setzt die Lösung in die Ausgangsgleichung ein.</li>
        <li><strong>Zurück und vor:</strong> Jeder Schritt lässt sich zurücknehmen und wiederholen.</li>
      </ul>

      <h3 style={h3}>Gleichungen</h3>
      <p style={absatz}>Zufallsaufgaben gibt es in vier Stufen, die aufeinander aufbauen:</p>
      <ul style={liste}>
        {LEVELS.filter((l) => l.id !== 5).map((l) => <li key={l.id}><strong>{l.name.replace(/^Stufe (\d) · /, "Stufe $1: ")}</strong> – {l.hint}</li>)}
      </ul>
      <p style={absatz}>
        Unter „Aufgabe“ auf der Arbeitsfläche kannst du die Stufe wechseln, eine Beispielaufgabe wählen, eine eigene Gleichung
        eintippen (z. B. „2(x + 3) = 4x − 2“) oder eine leere Waage Teil für Teil selbst bestücken.
      </p>

      <h3 style={h3}>Lineare Gleichungssysteme</h3>
      <p style={absatz}>
        Zwei Waagen mit zwei Unbekannten, x-Blöcken und y-Blöcken. Die drei Lösungsverfahren werden an den Waagen anschaulich:
      </p>
      <ul style={liste}>
        <li><strong>Einsetzungsverfahren:</strong> Liegt auf einer Waage ein Block allein, darf man ihn auf der anderen Waage durch das ersetzen, was gleich schwer ist.</li>
        <li><strong>Gleichsetzungsverfahren:</strong> Liegt auf beiden Waagen derselbe Block allein, sind die beiden anderen Seiten gleich schwer.</li>
        <li><strong>Additionsverfahren:</strong> Die Inhalte beider Waagen werden zusammengeschüttet. Weil links und rechts jeweils Gleiches hinzukommt, bleibt das Gleichgewicht erhalten.</li>
      </ul>

      <h3 style={h3}>Erweiterungen unter Einstellungen</h3>
      <ul style={liste}>
        <li><strong>Rechenweg rechts:</strong> blendet alle bisherigen Äquivalenzumformungen neben der Waage ein.</li>
        <li><strong>Antikugeln:</strong> Rote Antikugeln stehen für negative Zahlen. Eine Kugel und eine Antikugel heben sich auf.</li>
        <li><strong>Kalkül:</strong> Rechnen ohne die Grenzen des Waagemodells, etwa wenn eine Teilung nicht aufgeht.</li>
        <li><strong>Automatisch beidseitig:</strong> Ein Tippen nimmt ein Teil auf beiden Seiten zugleich weg – für schnelles Arbeiten, wenn das Prinzip verstanden ist.</li>
        <li><strong>Waagenstil:</strong> Comic, klassisch oder realistisch.</li>
      </ul>

      <h3 style={h3}>Für Lehrkräfte</h3>
      <p style={absatz}>
        Die Vollversion ergänzt, was im Unterricht am eigenen Gerät gebraucht wird: einen Präsentationsmodus für Beamer und
        digitale Tafel, zwei Waagen für Gleichungssysteme, Arbeitsblätter zum Ausdrucken (mit und ohne Lösung), eine Übersicht
        der Stolperstellen einer Sitzung, die Sachkontexte Marktstand und Streichhölzer sowie die realistische Laborwaage.
        Über „Link“ lässt sich eine Aufgabe genau so weitergeben, wie sie auf dem Bildschirm steht.
      </p>

      <h3 style={h3}>Didaktischer Hintergrund</h3>
      <p style={absatz}>
        Die App verbindet die enaktive, die ikonische und die symbolische Darstellungsebene. Hinweise sind standardmäßig als
        Fragen formuliert und regen zum Nachdenken an; direkte Hinweise lassen sich einschalten. Das Waagemodell hat Grenzen –
        etwa bei negativen Zahlen oder nicht aufgehenden Teilungen. Die App benennt diese Grenzen ausdrücklich und bietet mit
        Antikugeln und dem Kalkül-Modus einen bewussten Übergang zum formalen Rechnen an.
      </p>

      <h3 style={h3}>Datenschutz</h3>
      <p style={absatz}>
        Die App braucht kein Konto, funktioniert vollständig offline und sammelt keine Daten. Einstellungen bleiben nur auf
        diesem Gerät. Einzelheiten stehen unter „Datenschutz & Impressum“.
      </p>

      <p style={{ ...absatz, fontSize: 13, color: C.ink2, marginTop: 6 }}>
        Version {pkg.version} · Entwickelt von Simon Mählmann · Wisdompeak Apps · <a href="mailto:smaehlmann.appdev@gmail.com" style={{ color: C.xDark }}>smaehlmann.appdev@gmail.com</a>
      </p>
      <div><button style={zuKnopf} onClick={onZu}><X {...ICON} /> schließen</button></div>
    </article>
  );
}

/* Datenschutzerklärung und Impressum liegen als eigene Seiten in public/ –
   eine einzige Quelle für App, Web und die Datenschutz-URL im App Store.
   Hier werden sie eingebettet, damit eine laufende Aufgabe erhalten bleibt. */
function Rechtliches({ onZu }) {
  const [seite, setSeite] = useState("datenschutz");
  const reiter = (k, name) => (
    <button key={k} role="tab" aria-selected={seite === k} onClick={() => setSeite(k)}
      style={{ ...zuKnopf, background: seite === k ? C.ink : "#fff", color: seite === k ? C.paper : C.ink, borderColor: seite === k ? C.ink : C.ink2 }}>{name}</button>
  );
  return (
    <section style={rahmen} aria-label="Datenschutz und Impressum">
      <div style={augenbraue}>Datenschutz & Impressum</div>
      <div role="tablist" className="flex flex-wrap gap-2">
        {reiter("datenschutz", "Datenschutzerklärung")}
        {reiter("impressum", "Impressum")}
      </div>
      <iframe key={seite} title={seite === "impressum" ? "Impressum" : "Datenschutzerklärung"} src={`./${seite}.html`}
        style={{ width: "100%", height: "min(70vh, 720px)", border: `1px solid ${C.grid}`, borderRadius: 10, background: "#fff" }} />
      <div><button style={zuKnopf} onClick={onZu}><X {...ICON} /> schließen</button></div>
    </section>
  );
}

export { Startseite, Ueber, Rechtliches };
