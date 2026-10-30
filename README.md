# Madplan

Selvstændig webapp på https://mgforever26.github.io/madplan/

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
