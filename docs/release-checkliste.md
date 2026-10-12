# Release-Checkliste

## Technik

- [ ] `pnpm check` lokal und in CI grün
- [ ] `npx expo-doctor` ohne Befunde
- [ ] Versionsnummer in `apps/mobile/app.json` erhöht (`version`, Build-Nummern über EAS)
- [ ] Migrationen auf Staging eingespielt und geprüft (`supabase db push`)
- [ ] RLS-Tests grün (`packages/db-tests`)
- [ ] Keine Geheimnisse im Bundle: nur `EXPO_PUBLIC_*`-Werte, die öffentlich sein dürfen
- [ ] API-Schlüssel (Anthropic, Service Role) nur als Server-Umgebungsvariablen
- [ ] Fehler- und Nutzungsmonitoring aktiv, ohne Dokumentinhalte
- [ ] DOCX-Testdokumente in Word (Windows/macOS) und LibreOffice geöffnet und geprüft

## Inhalte und Recht

- [ ] Datenschutzerklärung, Impressum, Nutzungsbedingungen online und in der App verlinkt
- [ ] Einwilligungstexte zur KI-Verarbeitung abgestimmt
- [ ] Aufbewahrungsfristen dokumentiert
- [ ] Auftragsverarbeitungsverträge (Supabase, Anthropic, RevenueCat, Hosting) abgeschlossen
- [ ] Hinweis: App ersetzt keine Rechts-, Steuer- oder Medizinberatung
- [ ] Keine Funktion sichtbar, die nicht implementiert ist (sonst „Demnächst“)

## App Store (Apple)

- [ ] App in App Store Connect angelegt, Bundle-ID `de.akm.quellenklar`
- [ ] Abo-Gruppe mit Pro/Business (monatlich/jährlich) und Zusatzpaket (Verbrauchsartikel)
- [ ] „Mit Apple anmelden“ aktiviert (Pflicht, wenn andere Anmeldungen angeboten werden)
- [ ] Datenschutzangaben („App Privacy“) ausgefüllt
- [ ] Kontolöschung in der App möglich (Apple-Vorgabe)
- [ ] Screenshots (6,9", 6,5", iPad), Beschreibung, Schlüsselwörter auf Deutsch
- [ ] TestFlight-Test abgeschlossen

## Google Play

- [ ] App in der Play Console angelegt, Paketname `de.akm.quellenklar`
- [ ] Abos und In-App-Produkt angelegt
- [ ] Data-Safety-Formular ausgefüllt
- [ ] Link zur Kontolöschung hinterlegt
- [ ] Geschlossener Test mit mindestens 12 Testern über 14 Tage (für neue Entwicklerkonten)
- [ ] Store-Eintrag, Grafiken und Screenshots auf Deutsch

## Nach dem Release

- [ ] Monitoring und Absturzberichte beobachten
- [ ] Kauf, Wiederherstellen und Kündigung mit Testkonten geprüft
