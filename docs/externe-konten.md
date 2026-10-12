# Zwingend extern anzulegende Konten und Schlüssel

Diese Konten kann nur der Betreiber selbst anlegen. Schlüssel gehören **nie** ins Repository.

| #   | Dienst                           | Wofür                                                         | Ab Phase | Kosten (Stand Planung, bitte prüfen)             | Ergebnis / Schlüssel                                                                                   |
| --- | -------------------------------- | ------------------------------------------------------------- | -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| 1   | **GitHub**                       | Code, CI                                                      | 1        | kostenlos                                        | Repo `Kanne242/quellenklar` ✔                                                                          |
| 2   | **Expo / EAS**                   | Cloud-Builds, Store-Übermittlung                              | 2        | kostenloser Einstieg                             | Expo-Konto, `eas login`                                                                                |
| 3   | **Supabase**                     | Datenbank, Anmeldung, Dateien                                 | 2        | kostenloser Einstieg, Produktion kostenpflichtig | Projekt in Region **EU (Frankfurt)**; `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| 4   | **Anthropic (Claude API)**       | KI-Prüfung                                                    | 3        | nutzungsabhängig                                 | `ANTHROPIC_API_KEY` (nur Server), Ausgabenlimit setzen                                                 |
| 5   | **Hosting für die API**          | Betrieb von `services/api`                                    | 3        | je nach Anbieter                                 | EU-Region wählen; Umgebungsvariablen dort hinterlegen                                                  |
| 6   | **Apple Developer Program**      | iOS-Veröffentlichung, Apple-Anmeldung, In-App-Käufe           | 5        | 99 USD/Jahr                                      | Team-ID, App-Store-Connect-API-Schlüssel                                                               |
| 7   | **Google Play Console**          | Android-Veröffentlichung, Abos                                | 5        | einmalig 25 USD                                  | Dienstkonto-JSON für Übermittlung                                                                      |
| 8   | **RevenueCat**                   | Abo-Verwaltung iOS/Android                                    | 5        | kostenloser Einstieg                             | öffentliche SDK-Schlüssel (iOS/Android), Webhook-Secret                                                |
| 9   | **Domain + Website**             | Datenschutzerklärung, Impressum, Nutzungsbedingungen, Support | 5        | je nach Anbieter                                 | URLs für App und Stores                                                                                |
| 10  | **Malware-Prüfung**              | Scan hochgeladener Anlagen                                    | 2/5      | je nach Lösung                                   | z. B. ClamAV im eigenen Container oder ein Scan-Dienst                                                 |
| 11  | **Fehler-Monitoring** (optional) | Absturzberichte ohne Inhalte                                  | 5        | kostenloser Einstieg                             | DSN, EU-Datenhaltung wählen                                                                            |

## Rechtliches (kein Konto, aber Pflicht vor Veröffentlichung)

- Auftragsverarbeitungsverträge (AVV/DPA) mit Supabase, Anthropic, RevenueCat, Hosting
- Impressum mit ladungsfähiger Anschrift
- Datenschutzerklärung inkl. KI-Verarbeitung, Speicherorte, Aufbewahrungsfristen
- Für Apple/Google als gewerblicher Anbieter: Angaben nach dem Digital Services Act (Händlerstatus)

## Offene Entscheidung

- **Bundle-ID / Paketname:** vorläufig `de.akm.quellenklar`. Vor der ersten Store-Einreichung
  festlegen – danach nicht mehr änderbar.
