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
- Präsentationsmodus, der sich an Displaygröße und Orientierung anpasst, plus Vollbild
- Arbeitsblatt-Export als druckbares HTML, dazu ein Protokoll typischer Stolperstellen für die Lehrkraft

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

1. Repository anlegen und den Inhalt pushen (Branch `main`).
2. Unter **Settings → Pages** bei *Source* **GitHub Actions** auswählen.
3. Der Workflow `.github/workflows/pages.yml` baut bei jedem Push und veröffentlicht.

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

## Aufbau des Projekts

```
index.html                  Einstiegsseite
src/main.jsx                React-Einstieg
src/WaagemodellApp.jsx      die gesamte Anwendung
src/index.css               Grundlayout und die wenigen Utility-Klassen
public/                     Icons und Web-App-Manifest
capacitor.config.json       Konfiguration der nativen Hülle
.github/workflows/          Pages, Debug-APK, signiertes Release
```

Die Anwendung kommt ohne Backend und ohne Datenspeicherung aus; alles läuft im
Browser. Die Zurück-Taste nimmt einen Rechenschritt zurück, statt die App zu
schließen.

## Lizenz

MIT – siehe `LICENSE`.
