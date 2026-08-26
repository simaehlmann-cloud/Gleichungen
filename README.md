# Waagemodell – Gleichungen im Gleichgewicht

Interaktives Waagemodell für den Mathematikunterricht: Gleichungen und lineare
Gleichungssysteme werden enaktiv auf einer Balkenwaage gelöst, während parallel
die symbolische Äquivalenzumformung mitgeschrieben wird.

## Funktionsumfang

- Balkenwaage mit Kugeln (Wert 1) sowie x- und y-Blöcken, per Maus, Finger oder Stift zu bewegen
- **Aufbauphase**: leere, waagerechte Waage, jede Schale einzeln bestücken, die Gleichung entsteht mit
- **Umformphase**: jeder Zug wirkt auf beide Seiten, jeder Schritt erscheint als Protokollzeile `3x + 2 = x + 8 | −2`
- Gleichung eintippen (`3(x − 1) + 4 = x + 9`) und die passende Waage bauen lassen; nicht darstellbare Eingaben werden auf Wunsch mit erlaubten Umformungen waagentauglich gemacht
- Teilen und Vervielfachen als Handlung: Schaleninhalt in gleich große Haufen zerlegen, einen behalten
- Lineare Gleichungssysteme mit zwei Waagen: Einsetzen, Gleichsetzen, Zusammenschütten
- Sachkontexte (Algebra, Marktstand, Streichhölzer), Antikugeln für negative Zwischenschritte
- Aufgabengenerator mit fünf Niveaustufen, Selbstkontrolle, automatische Probe
- Präsentationsmodus mit einklappbarer Bedienung, wahlweise nur die Waage, nur die
  Äquivalenzumformungen oder beides nebeneinander; passt sich Displaygröße und
  Orientierung an, plus Vollbild
- Die Lösung bleibt verborgen, bis sie angefordert oder richtig geraten wurde
- Arbeitsblatt-Export als druckbares HTML, dazu ein Protokoll typischer Stolperstellen für die Lehrkraft
- Schrittleiste mit Vorschau: per Klick zu einem früheren Stand zurückspringen
- Aufgaben als Link teilen (`?eq=3x+2%3Dx%2B8`), Kontext und zweite Gleichung inklusive
- Zehnerbündel ab 15 Teilen; ein Bündel nimmt zehn auf einmal weg
- Rückmeldungen wahlweise fragend (Standard) oder direkt, umschaltbar im Lehrkraft-Bereich
- Vollständig per Tastatur bedienbar: Spielsteine sind fokussierbar, Enter und Leertaste legen auf und nehmen weg
- Der Rechenweg steht in der Adresszeile und überlebt einen Neustart des Browsers
- Zielvorgabe beim Aufbau: „Ziel: x = 3" meldet, ob die gebaute Waage passt
- Kalkülmodus für den Übergang, wenn das Waagemodell an seine Grenze kommt
- Sachsituation: aus der Gleichung wird ein Aufgabentext im gewählten Kontext
- Schritte zurück und wieder vor; in der Präsentation über Pfeil links und rechts

Die Waage wird beim Lösungswert ausgewertet: Solange die Gleichung gilt, steht sie
waagerecht. Eine einseitige Veränderung kippt sie sichtbar.

## Lokal starten

```bash
npm ci
npm run dev      # Entwicklungsserver
npm run build    # Produktionsbuild nach dist/
npm run preview  # Build lokal ansehen
```

Node 20 oder neuer.

## GitHub Pages

1. Repository anlegen und den Inhalt pushen (Branch `main` oder `master`).
2. Der Workflow `.github/workflows/pages.yml` baut bei jedem Push, schaltet Pages
   beim ersten Lauf selbst ein (`enablement: true`) und veröffentlicht.
3. Steht unter **Settings → Pages** noch *Deploy from a branch*, einmal auf
   **GitHub Actions** umstellen — danach läuft alles ohne Zutun.

Der Link ändert sich nie. Nach jedem Lauf steht er zusätzlich in der
Zusammenfassung des Workflows und im Job `deploy` unter *github-pages*.

Die Seite liegt danach unter `https://<benutzername>.github.io/<repository>/`.
Weil `vite.config.js` mit `base: "./"` arbeitet, funktioniert derselbe Build
sowohl im Unterverzeichnis von Pages als auch in der Android-App.

## Android-APK

Der Workflow `.github/workflows/android.yml` läuft bei jedem Push auf `main`:
Er baut die Web-App, erzeugt mit Capacitor das Android-Projekt und kompiliert ein
Debug-APK. Das Ergebnis liegt danach unter **Actions → Lauf auswählen → Artifacts →
`waagemodell-debug-apk`**.

Ein Debug-APK lässt sich direkt auf einem Gerät installieren (Installation aus
unbekannten Quellen erlauben), taugt aber nicht für den Store.

Lokal geht dasselbe mit installiertem Android SDK:

```bash
npm run build
npx cap add android     # nur beim ersten Mal
npx cap sync android
cd android && ./gradlew assembleDebug
```

Der Ordner `android/` steht in `.gitignore` und wird bei jedem Lauf neu erzeugt.
Wer Icons, Berechtigungen oder den App-Namen dauerhaft anpassen will, nimmt
`npx cap add android` einmal lokal vor und committet den Ordner; dann entfällt der
`cap add`-Schritt im Workflow.

## Play Store

Für den Store braucht es ein **signiertes App Bundle**. Einmalig einen Schlüssel erzeugen:

```bash
keytool -genkey -v -keystore upload.keystore -alias upload \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 upload.keystore   # Ausgabe kopieren
```

Dann unter **Settings → Secrets and variables → Actions** vier Secrets anlegen:

| Secret | Inhalt |
|---|---|
| `KEYSTORE_BASE64` | die base64-Ausgabe von oben |
| `KEYSTORE_PASSWORD` | Passwort des Keystores |
| `KEY_ALIAS` | `upload` |
| `KEY_PASSWORD` | Passwort des Schlüssels |

Ein Tag startet den Release-Build:

```bash
git tag v1.0.0 && git push --tags
```

Der Workflow `android-release.yml` legt `app-release.aab` (für den Store) und
`app-release.apk` als Artefakte ab. Die `.aab`-Datei wird in der Google Play
Console hochgeladen. Vor der ersten Veröffentlichung noch anpassen:
`appId` in `capacitor.config.json` auf eine eigene Domain-Umkehrung setzen sowie
`versionCode` und `versionName` in `android/app/build.gradle` pflegen.

Für iOS und den Apple App Store gilt derselbe Weg mit `npx cap add ios`, dafür
werden allerdings ein Mac-Runner und ein Apple-Developer-Konto gebraucht.

## Tests

```bash
npm test
```

Der Rahmen kommt ohne Testframework aus: `tests/run.mjs` bündelt jede Datei
`tests/*.test.jsx` mit esbuild und führt sie in jsdom aus. Neun Suiten mit
92 Prüfungen decken ab:

| Datei | Inhalt |
|---|---|
| `lib.test.jsx` | Bruchrechnung, Parser, Reparatur, Generator (600 Zufallsaufgaben), Sachtexte |
| `umformen.test.jsx` | Gleichung bauen, umformen, teilen, Undo, Balkenstellung |
| `bedienung.test.jsx` | Aufbauphase, Tastatur, Zielvorgabe, Schrittleiste, Zehnerbündel |
| `lgs.test.jsx` | Einsetzen, Gleichsetzen, Kalkülmodus, Sachsituation |
| `zustand.test.jsx` | Adresszeile: Zustand sichern, Neustart, Aufgabe aus dem Link |
| `zusatz.test.jsx` | Zurück und Vor, Tastenkürzel, Ansagen, Kalkül-Kennzeichnung |
| `anzeige.test.jsx` | Anzahl-Feld, verborgene Lösung, Ansichten im Präsentationsmodus |
| `rendering.test.jsx` | wacht über verirrte JSX-Klammern im gerenderten Text |
| `umlegen.test.jsx` | Teile zwischen den Schalen umlegen, nur im Aufbau erlaubt |

Der Workflow `.github/workflows/tests.yml` führt sie bei jedem Push und jedem
Pull Request aus.

## Aufbau des Projekts

```
index.html                     Einstiegsseite
src/main.jsx                   React-Einstieg
src/WaagemodellApp.jsx         Oberfläche und Ablaufsteuerung
src/lib/fraction.js            exakte Bruchrechnung, Terme, Waagschalen
src/lib/parser.js              Gleichungen aus Text lesen
src/lib/model.js               Darstellbarkeit, Reparatur, Gleichgewichtswerte
src/lib/texts.js               Rückmeldungen, Sachkontexte, Aufgabentexte
src/lib/tasks.js               Aufgabensammlung und Generator
src/lib/tokens.js              Farben und Schriften
src/components/Piece.jsx       Kugeln, Blöcke, Zehnerbündel
src/components/Waage.jsx       die Balkenwaage
src/index.css                  Grundlayout und die wenigen Utility-Klassen
tests/                         Testrahmen und Suiten
public/                        Icons und Web-App-Manifest
capacitor.config.json          Konfiguration der nativen Hülle
.github/workflows/             Tests, Pages, Debug-APK, signiertes Release
```

Die Anwendung kommt ohne Backend und ohne Datenspeicherung aus; alles läuft im
Browser. Die Zurück-Taste nimmt einen Rechenschritt zurück, statt die App zu
schließen.

## Lizenz

MIT – siehe `LICENSE`.
