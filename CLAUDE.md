# QuellenKlar – Hinweise für die Weiterentwicklung

- Monorepo mit pnpm (`node-linker=hoisted`). Befehle immer vom Repo-Root: `pnpm check`.
- Spezifikation: Claude-Projekt „App_QuellenKlar“. Phasenplan 1–5; aktueller Stand siehe README.
- Produktregeln sind verbindlich: nichts erfinden, „nicht angegeben“, „PRÜFEN: …“, Q01/A01 stabil,
  KI nur serverseitig, nicht implementierte Funktionen als „Demnächst“ kennzeichnen.
- Gemeinsame Schemas/Regeln gehören nach `packages/shared` und werden in App und API genutzt.
- Datenbankänderungen nur als neue Migration in `supabase/migrations`; Tests in `packages/db-tests`.
- App: Routen nur in `apps/mobile/src/app`, keine Tests oder Hilfsdateien dort ablegen.
  Native Pakete mit den Versionen aus `expo/bundledNativeModules.json` installieren.
- UI-Texte auf Deutsch, Fehlermeldungen mit konkreter Handlungsoption.
