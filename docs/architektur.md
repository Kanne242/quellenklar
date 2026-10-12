# Architekturentscheidung (ADR-001)

**Status:** angenommen · **Datum:** 12.10.2026

## Kontext

QuellenKlar ist eine deutschsprachige Mobile-App (iOS/Android), die strukturierte Eingaben in ein
vollständig bearbeitbares DOCX überführt. Kernanforderungen: keine Schlüssel im Client, KI nur
serverseitig, strikte Datentrennung je Nutzer, stabile Quellen-/Anlagen-IDs, EU-Datenhaltung,
Offline-Entwürfe.

## Entscheidung

| Bereich         | Wahl                                                              | Begründung                                                                |
| --------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| App             | Expo SDK 57, React Native 0.86, TypeScript, Expo Router           | Laut Spezifikation; Cloud-Builds über EAS, kein lokales Xcode nötig       |
| Navigation      | Expo Router mit nativen Tabs                                      | Echte iOS-/Android-Tableisten, barrierearm                                |
| Formulare       | React Hook Form + Zod                                             | Schemas in `packages/shared` werden in App **und** API identisch genutzt  |
| Lokaler Zustand | Zustand + AsyncStorage                                            | Schlank; automatische Entwurfsspeicherung                                 |
| Serverzustand   | TanStack Query                                                    | Ab Phase 2 für Synchronisierung                                           |
| Backend         | Supabase (EU) + Node.js-API mit **Hono**                          | Hono ist klein, typsicher und gut testbar (`app.request`)                 |
| Datenbank       | Postgres mit RLS, Trigger für ID-Vergabe                          | Integrität liegt in der Datenbank, nicht nur im Client                    |
| KI              | Anthropic Claude über die API (nur Server)                        | Ab Phase 3                                                                |
| DOCX            | `docx` (npm) + gezielte OOXML-Ergänzungen                         | Ab Phase 4                                                                |
| Abos            | RevenueCat                                                        | Ab Phase 5                                                                |
| Tests           | Vitest (Pakete/API/DB), Jest + React Native Testing Library (App) | `jest-expo` ist der offizielle Weg für Expo; Vitest für reines TypeScript |
| DB-Tests        | PGlite (eingebettetes Postgres)                                   | Migrationen und RLS laufen in CI ohne Docker                              |

### Abweichungen von der Spezifikation (kurz begründet)

1. **`node-linker=hoisted` in pnpm:** React Native/Metro arbeitet mit flachem `node_modules`
   zuverlässiger.
2. **Testrunner gemischt:** Jest nur für die App (React-Native-Transformationen); alle übrigen
   Pakete nutzen Vitest.
3. **`packages/ui` enthält Tokens, keine RN-Komponenten:** So kann auch die Dokumentengine die
   Markenfarben nutzen. Die RN-Komponenten liegen in `apps/mobile/src/components`.
4. **`packages/db-tests`** ist zusätzlich hinzugekommen, um RLS automatisiert zu prüfen.
5. **Web** ist kein Ziel. Die App lässt sich zwar als Web-Version bauen (`output: single`),
   wird aber nur für iOS und Android optimiert und getestet.

## Datenmodell (Übersicht)

```text
auth.users 1─1 users 1─n projects 1─1 document_metadata
                    │            ├─n content_sections
                    │            ├─n table_definitions 1─n table_rows ─┐
                    │            ├─n sources (Q01…) ───── row_source_links ┘
                    │            ├─n attachments (A01…) ─ attachment_links → Zeile | Abschnitt | Quelle
                    │            ├─n review_runs 1─n review_changes
                    │            ├─n open_checks
                    │            └─n exports
                    ├─n subscriptions          (nur Backend schreibt)
                    └─n usage_credits (Ledger) (nur Backend schreibt)
plan_config  – Preise und Limits je Tarif (Remote-Konfiguration)
```

**Wichtige Regeln in der Datenbank**

- Quellen-/Anlagen-IDs vergibt ein Trigger über einen Zähler im Projekt. Gelöschte IDs werden
  nie neu vergeben, IDs sind nach der Vergabe unveränderlich, Clients können den Zähler nicht
  verändern.
- Verknüpfungen nutzen zusammengesetzte Fremdschlüssel `(id, project_id)` – Links über
  Projektgrenzen hinweg sind unmöglich.
- Ein Export kann nur „erfolgreich“ sein, wenn Speicherpfad, Größe und Zeitpunkt gesetzt sind;
  Dateinamen sind je Projekt eindeutig (kein stilles Überschreiben).
- Prüfpunkte lassen sich nur mit Zeitstempel auflösen.
- „1 aktives Projekt“ im kostenlosen Tarif wird per Trigger serverseitig erzwungen.
- Soft-Delete (`deleted_at`) nur bei Projekten, Tabellenzeilen, Quellen und Anlagen.
- Kontolöschung (`auth.users`) löscht kaskadierend alle Daten.

## Sicherheitsprinzipien

- Keine Geheimnisse im Client oder Repository; `.env` ist ignoriert, `.env.example` enthält
  nur Platzhalter.
- Logs enthalten nur Metadaten (Methode, Pfad, Status, Dauer); Felder wie `content`, `body`,
  `token` werden vor der Ausgabe entfernt.
- Storage-Buckets sind privat; Uploads laufen ab Phase 2 über das Backend (Typ-, Größen- und
  Malware-Prüfung), Clients erhalten kurzlebige signierte URLs.
