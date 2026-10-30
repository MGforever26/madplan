# Madplan

Målet er, at den selvstændige webapp publiceres på https://mgforever26.github.io/madplan/.

## Aktuel status 30. oktober 2026

- Den selvstændige app er publiceret på GitHub Pages: https://mgforever26.github.io/madplan/.
- Den tidligere adresse på https://mgforever26.github.io/investeringsdashboard/madplan/ er bevaret som alternativ, indtil begge telefoner er kontrolleret.
- Den fælles uge bruger fortsat den eksisterende Google Apps Script-backend. Den kører uden at flytte eller nulstille den nuværende uge.
- Backendens deployede Apps Script-kode ligger ikke i dette repository og er ikke blevet ændret.

## Indhold

- `index.html` er den komplette aktive madplan med ugevisning og indkøbsliste.
- `recipes.json` indeholder opskriftsdatabasen.
- `shared-sync.js` håndterer fælles uge og synkronisering via Google Apps Script.
- `history.js` og `learning.js` håndterer historik, variation og forslag.
- `archive.js` opbevarer et indeks over særskilte historikposter og håndterer hentning af historik på en ny telefon.
- De øvrige JavaScript-filer bevarer de hidtidige rettelser af kategorier, mængder, ugefunktion og liste.
- `manifest.webmanifest` og `icon.svg` bruges til mobilens webapp.

## Forslagene »Oplagte denne uge«

Når en ny uge oprettes, udvælger appen fem nye forslag. Historisk faktisk valgte retter prioriteres via hyppighed, tid siden sidste brug og observeret tilbagevendende rytme. De seneste to ugers forslag springes som hovedregel over, hvis der findes alternativer.

Ved kort historik varierer forslagene på tværs af opskriftsdatabasen. Listen gemmes som en del af ugens metadata og synkroniseres, så begge telefoner viser samme fem forslag gennem ugen. Midlertidige testuger uden tilstrækkelig varighed regnes ikke som historiske madvaner.

## Langtidslagring af historik

- Lokal kapacitet: op til **520 afsluttede uger** og **10.000 læringshændelser**. Dette er lagergrænser, ikke en garanti for ti års fuldstændig historik, hvis browserens lokale data slettes.
- Den aktive uge gemmes som før. Når der er flere end to afsluttede uger, flyttes de ældre uger automatisk til selvstændige arkivposter via samme Google Apps Script-endpoint.
- Hver arkivpost rummer én afsluttet uge eller et udsnit på højst 28 læringshændelser. Serveren skal kvittere med samme versionsnummer via en efterfølgende læsning, før arkivposten føjes til indekset.
- Hovedposten gemmer et kompakt arkivindeks sammen med ugens madplan, indkøbsliste, regler og endnu ikke arkiveret historik. Ved installation på en anden telefon hentes arkivposterne gradvist og sammenflettes med den lokale historik.
- I tilfælde af fejl ved arkivering gemmes den aktuelle uge stadig, **hvis** den fulde endnu ikke arkiverede datamængde kan være i hovedposten. Ellers afvises skrivningen frem for at kassere historik. Status viser, når historikarkivet afventer.
- Separat lokal historik og læringslog bevares i de eksisterende nøgler. De almindelige browser-snapshots er forkortet for at undgå at bruge lagerplads på unødvendige kopier.
- Historik og læringshændelser indsamles og arkiveres automatisk, når brugeren ændrer madplanen eller indkøbslisten. Brugerens daglige arbejdsgang kræver ingen manuel eksport. Konkrete mønsterforslag kan vises, når appen har tilstrækkelig kvalificeret historik.
- Automatisk arkivering er gennemgået med simuleret server og bl.a. 14 afsluttede uger, 336 hændelser samt en kapacitetsberegning for 520 uger og 10.000 hændelser. **Faktisk arkivskrivning via den deployede Apps Script-backend er ikke verificeret**. Den praktiske ende-til-ende-kontrol er stadig nødvendig.

## Drift og datalagring

Appen publiceres via GitHub Pages. En del af tilstanden lagres lokalt i browseren, mens fælles ugens data synkroniseres via det eksisterende Google Apps Script-endpoint og et Google Sheet. Den eksterne tjeneste skal fortsat fungere, selv om al webappkode ligger i dette repository.

Appens oprindelige version i `MGforever26/investeringsdashboard/madplan` brugte en loader, der hentede dette repositorys `index.html` og tilføjede funktioner dynamisk. Disse funktioner er nu indarbejdet direkte, og filerne ligger lokalt her.

## Migrering 30. oktober 2026

Backup før flytningen: branch `backup-before-consolidation-2026-10-30` i begge oprindelige repositories.

Den gamle URL bør først fjernes, når begge telefoner har fået den nye adresse og praktiske tests af synkronisering, historik og indkøbslister er gennemført. Ellers kan gemte genveje ophøre med at virke.
