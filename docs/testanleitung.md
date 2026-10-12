# Testanleitung iOS und Android

## 1. Automatisierte Tests

```bash
pnpm install
pnpm check
```

| Paket                      | Runner          | Inhalt                                                           |
| -------------------------- | --------------- | ---------------------------------------------------------------- |
| `packages/shared`          | Vitest          | ID-Vergabe, Datumsformat, Formularvalidierung, Tarife, KI-Schema |
| `packages/ui`              | Vitest          | WCAG-AA-Kontraste in Hell und Dunkel                             |
| `packages/document-engine` | Vitest          | A4-Maße, Seitenränder in Twips, Dokumentreihenfolge              |
| `packages/db-tests`        | Vitest + PGlite | Migrationen, RLS, stabile IDs, Kontingente, Kaskadenlöschung     |
| `services/api`             | Vitest          | Endpunkte, Authentifizierung, Konfiguration, Log-Schutz          |
| `apps/mobile`              | Jest + RNTL     | Projektlogik, Formular „Neues Projekt“, Barrierefreiheit         |

## 2. Manuell auf dem Smartphone (Expo Go)

1. **Expo Go** installieren (App Store / Google Play), Version für SDK 57.
2. Rechner und Smartphone ins selbe WLAN.
3. Im Projektordner `pnpm dev:mobile` ausführen.
4. QR-Code scannen: iPhone mit der Kamera-App, Android direkt in Expo Go.
   Funktioniert das WLAN nicht: `pnpm --filter @quellenklar/mobile start --tunnel`.

### Prüfliste Phase 1

**Onboarding**

- [ ] Drei Seiten, „Weiter“/„Zurück“ funktionieren, Seitenzähler stimmt.
- [ ] „Überspringen“ führt direkt zur Projektübersicht.
- [ ] Nach Neustart der App erscheint das Onboarding nicht erneut.

**Projekte**

- [ ] Leerer Zustand mit „Neues Projekt anlegen“.
- [ ] Leerer Name → Meldung „Projektname fehlt.“
- [ ] Projekt anlegen → Projektseite öffnet sich, Status „Entwurf“.
- [ ] Zweites aktives Projekt im kostenlosen Tarif → verständliche Meldung.
- [ ] Umbenennen, Duplizieren (nach Archivieren des Originals), Archivieren, Wiederherstellen.
- [ ] Löschen fragt nach Bestätigung und nennt Inhalte/Anlagen.
- [ ] Suche und Filter (Status, Kategorie) wirken sofort.
- [ ] Anzeige „Lokal gespeichert“; Daten bleiben nach App-Neustart erhalten.

**Vorlagen und Konto**

- [ ] „Mit dieser Vorlage starten“ setzt die Kategorie im Formular.
- [ ] Nicht verfügbare Funktionen tragen das Kennzeichen „Demnächst“.
- [ ] „Alle lokalen Daten löschen“ fragt nach und führt zurück zum Onboarding.

**Darstellung und Barrierefreiheit**

- [ ] Hell- und Dunkelmodus (Systemeinstellung umschalten).
- [ ] Große Schrift (iOS: Bedienungshilfen → Anzeige & Textgröße; Android: Schriftgröße) –
      Texte bleiben lesbar, nichts wird abgeschnitten.
- [ ] VoiceOver (iOS) / TalkBack (Android): Schaltflächen, Auswahlchips und Überschriften
      werden sinnvoll angesagt.

## 3. Entwicklungs-Build (ab Phase 2/5)

Für native Module außerhalb von Expo Go (z. B. Apple-Anmeldung, In-App-Käufe) wird ein
Entwicklungs-Build benötigt:

```bash
npx eas-cli@latest build --profile development --platform ios
npx eas-cli@latest build --profile development --platform android
```
