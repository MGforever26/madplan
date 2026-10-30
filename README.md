# Madplan

Målet er, at den selvstændige webapp publiceres på https://mgforever26.github.io/madplan/.

## Aktuel status 30. oktober 2026

- Frontend, opskriftsdatabase og alle otte aktive ekstrafiler er samlet i dette repository. Statisk syntakskontrol er bestået.
- **GitHub Pages er endnu ikke aktiveret i dette repository**. Adressen ovenfor kan derfor endnu ikke bruges til daglig drift.
- Den aktive udgave ligger indtil videre på `https://mgforever26.github.io/investeringsdashboard/madplan/`. Dens `index.html` indeholder nu den samlede kode direkte og kræver ikke en loader.
- Næste trin: Gå til `Settings > Pages` i dette repository, vælg `Deploy from a branch`, branch `main`, folder `/(root)`, og gem. Kontrollér derefter webadressen, data og synkronisering på begge telefoner.
- Først efter godkendt test skal den gamle side ændres til viderestilling. Slet ikke det gamle repository, før tidligere installerede mobilgenveje også er afklaret.
- Backendens Google Apps Script og Google Sheet er fortsat eksterne. Dette repository indeholder synkroniseringsklienten og en README om Apps Script, men **ikke en fuld kopi af den deployede backendkode eller Google Sheetets data**.

## Indhold

- `index.html` er den komplette aktive madplan med ugevisning og indkøbsliste.
- `recipes.json` indeholder opskriftsdatabasen.
- `shared-sync.js` håndterer fælles uge og synkronisering via Google Apps Script.
- `history.js` og `learning.js` håndterer historik, variation og forslag.
- De øvrige JavaScript-filer bevarer de hidtidige rettelser af kategorier, mængder, ugefunktion og liste.
- `manifest.webmanifest` og `icon.svg` bruges til mobilens webapp.

## Drift og datalagring

Appen publiceres via GitHub Pages. En del af tilstanden lagres lokalt i browseren, mens fælles ugens data synkroniseres via det eksisterende Google Apps Script-endpoint og et Google Sheet. Den eksterne tjeneste skal fortsat fungere, selv om al webappkode ligger i dette repository.

Appens oprindelige version i `MGforever26/investeringsdashboard/madplan` brugte en loader, der hentede dette repositorys `index.html` og tilføjede funktioner dynamisk. Disse funktioner er nu indarbejdet direkte, og filerne ligger lokalt her.

## Migrering 30. oktober 2026

Backup før flytningen: branch `backup-before-consolidation-2026-10-30` i begge oprindelige repositories.

Den gamle URL bør først fjernes, når begge telefoner har fået den nye adresse og praktiske tests af synkronisering, historik og indkøbslister er gennemført. Ellers kan gemte genveje ophøre med at virke.
