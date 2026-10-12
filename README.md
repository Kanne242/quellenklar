# QuellenKlar – Dokumente & Belege

**Strukturieren. Prüfen. Belegen. Exportieren.**

QuellenKlar führt Nutzer Schritt für Schritt durch die Erfassung von Inhalten, Tabellen, Quellen und
Anlagen und erzeugt daraus ein vollständig bearbeitbares Word-Dokument (`.docx`).

> **Stand: Phase 1 – Architektur und Grundgerüst.** Der Dokumentassistent, die KI-Prüfung, der
> DOCX-Export und die Abonnements folgen in den Phasen 2–5. In der App sind diese Funktionen als
> „Demnächst“ gekennzeichnet (Produktregel 10).

## Inhalt des Repositorys

```text
apps/mobile               Expo-App (React Native, TypeScript, Expo Router)
services/api              Backend-API (Node.js, Hono) – KI nur serverseitig
packages/shared           Zod-Schemas, Typen, ID-Vergabe (Q01/A01), Tarife, KI-Antwortschema
packages/ui               Design-Tokens (Farben, Abstände, Typografie) inkl. Kontrastprüfung
packages/document-engine  DOCX-Engine – Phase 1: Seitenlayout/Typografie als geprüfte Konstanten
packages/db-tests         Tests für Migrationen und Row-Level-Security (eingebettetes Postgres)
supabase/                 Migrationen, Testdaten (seed.sql), lokale Supabase-Konfiguration
docs/                     Architektur, API, Tests, Release, externe Konten
```

## Voraussetzungen

| Werkzeug     | Version                  | Hinweis                                                          |
| ------------ | ------------------------ | ---------------------------------------------------------------- |
| Node.js      | ≥ 22.12 (siehe `.nvmrc`) | z. B. über `nvm install`                                         |
| pnpm         | 10.28.0                  | `corepack enable` aktiviert die im Repo festgelegte Version      |
| Expo Go      | SDK 57                   | auf iPhone/Android aus dem App Store bzw. Play Store             |
| Supabase CLI | optional                 | nur für lokale Datenbank (`npx supabase start`, benötigt Docker) |

## Installation

```bash
git clone https://github.com/Kanne242/quellenklar.git
cd quellenklar
corepack enable
pnpm install
```

## Starten

```bash
# Mobile App (QR-Code mit Expo Go scannen)
pnpm dev:mobile

# API lokal (benötigt .env, siehe .env.example)
cp .env.example .env
pnpm dev:api          # http://localhost:8787/health

# Lokale Datenbank inkl. Testdaten (Docker erforderlich)
npx supabase start
npx supabase db reset # spielt Migrationen + seed.sql ein
```

Testkonto der lokalen Datenbank: `demo@example.org` / `Demo-Passwort-2026` (nur lokal, fiktive Daten).

## Prüfen

```bash
pnpm typecheck   # TypeScript in allen Paketen
pnpm lint        # ESLint
pnpm test        # Vitest (Pakete, API, Datenbank) + Jest (App)
pnpm check       # alles nacheinander
```

Die gleichen Prüfungen laufen in GitHub Actions bei jedem Push (`.github/workflows/ci.yml`).

## Was Phase 1 enthält

- **Monorepo** mit pnpm-Workspaces, gesperrten Paketversionen (`pnpm-lock.yaml`), gemeinsamer
  TypeScript-, ESLint- und Prettier-Konfiguration, CI.
- **App:** Navigation mit vier Hauptbereichen (Projekte, Neu erstellen, Vorlagen, Konto),
  überspringbares Onboarding (3 Seiten), Designsystem in Hell/Dunkel mit geprüften Kontrasten,
  Projekte lokal anlegen, suchen, filtern, umbenennen, duplizieren, archivieren und löschen
  (mit Bestätigung), automatischer lokaler Speicherung mit Statusanzeige, Tariflimit „1 aktives
  Projekt“ im kostenlosen Tarif, Platzhalter-Icon.
- **Datenmodell:** alle 16 Tabellen als SQL-Migrationen mit strikter Row-Level-Security,
  stabiler ID-Vergabe (Q01, A01 – nie neu vergeben), serverseitiger Tarifkonfiguration,
  Verbrauchsbuch, privaten Storage-Buckets und fiktiven Testdaten.
- **API:** Grundgerüst mit Health-Check, Tarifübersicht, Supabase-Authentifizierung,
  einheitlichen deutschen Fehlermeldungen, Sicherheits-Headern und Logs ohne Dokumentinhalte.
- **Gemeinsame Logik:** Formularschemas mit deutschen Fehlermeldungen, Datumsformat TT.MM.JJJJ,
  „nicht angegeben“ / „PRÜFEN: …“, Kontingentprüfung, strenges KI-Antwortschema.

## Dokumentation

- [Architekturentscheidung](docs/architektur.md)
- [API-Dokumentation](docs/api.md)
- [Testanleitung iOS und Android](docs/testanleitung.md)
- [Release-Checkliste](docs/release-checkliste.md)
- [Extern anzulegende Konten und Schlüssel](docs/externe-konten.md)
