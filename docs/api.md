# API-Dokumentation

Basis-URL lokal: `http://localhost:8787` · Format: JSON · Sprache der Fehlermeldungen: Deutsch

## Authentifizierung

Geschützte Endpunkte erwarten ein Supabase-Zugriffstoken:

```http
Authorization: Bearer <access_token>
```

Das Token stammt aus der Supabase-Anmeldung in der App. Die API prüft es serverseitig über
Supabase Auth. Es wird kein Service-Role-Key an die App ausgegeben.

## Fehlerformat

```json
{ "error": { "code": "unauthorized", "message": "Bitte melde dich an, um fortzufahren." } }
```

| HTTP | `code`           | Bedeutung                                                    |
| ---- | ---------------- | ------------------------------------------------------------ |
| 401  | `unauthorized`   | Kein oder ungültiges Token                                   |
| 404  | `not_found`      | Unbekannter Pfad                                             |
| 500  | `internal_error` | Unerwarteter Fehler (Details nur im Serverlog, ohne Inhalte) |

## Endpunkte (Phase 1)

### `GET /health`

Zustand des Dienstes.

```json
{ "status": "ok", "version": "0.1.0" }
```

### `GET /v1/plans`

Öffentliche Tarifübersicht (Standardwerte; ab Phase 5 aus der Tabelle `plan_config`).
`null` bei Projekten/Exporten bedeutet „im Rahmen fairer technischer Nutzung“.
KI-Kontingente sind immer eine konkrete Zahl.

```json
{
  "plans": [
    {
      "id": "free",
      "name": "Kostenlos",
      "priceMonthlyEur": 0,
      "priceYearlyEur": null,
      "limits": {
        "maxActiveProjects": 1,
        "monthlyDocxExports": 2,
        "monthlyFullReviews": 1,
        "…": "…"
      }
    }
  ],
  "addon": { "id": "reviews_10", "name": "Zusatzpaket", "reviews": 10, "priceEur": 4.99 }
}
```

### `GET /v1/me` 🔒

Angemeldeter Nutzer.

```json
{ "id": "00000000-0000-4000-8000-000000000001", "email": "demo@example.org" }
```

## Geplante Endpunkte

| Phase | Endpunkt                                       | Zweck                                                       |
| ----- | ---------------------------------------------- | ----------------------------------------------------------- |
| 2     | `POST /v1/projects/:id/attachments`            | Upload mit Typ-/Größen-/Malware-Prüfung                     |
| 2     | `POST /v1/sync`                                | Entwurfssynchronisierung mit Konflikterkennung (`revision`) |
| 3     | `POST /v1/projects/:id/reviews`                | KI-Prüfung (`language` · `language_consistency` · `full`)   |
| 3     | `GET /v1/usage`                                | Verbrauch und Rücksetzdatum                                 |
| 4     | `POST /v1/projects/:id/exports`                | DOCX erzeugen, Exporthistorie                               |
| 5     | `POST /v1/webhooks/revenuecat`                 | Abo-Status aus den Stores                                   |
| 5     | `GET /v1/account/export`, `DELETE /v1/account` | Datenexport und Kontolöschung                               |

## KI-Antwortschema (ab Phase 3)

Jede Antwort wird gegen `reviewResultSchema` (`packages/shared/src/review.ts`) validiert.
Unbekannte Felder sind unzulässig. Bei ungültigem JSON wird genau **ein** Reparaturversuch
ausgeführt; schlägt auch dieser fehl, erhält der Nutzer eine verständliche Fehlermeldung, und
es werden keine Teilergebnisse übernommen.
