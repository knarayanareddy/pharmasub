# Samenstelling

**Availability is solved. The work is not.** Een offline Next.js-demonstratie voor beargumenteerde substitutieketens bij Nederlandse geneesmiddelentekorten. De regels zijn deterministisch, iedere weigering blijft zichtbaar en alleen een namelijk goedkeurende apotheker kan een document ontgrendelen.

## Starten

```bash
npm install
npm run dev
```

Open de casusbibliotheek, `C-004` voor een bruikbare keten, `C-017` voor nul geldige ketens, het simulatielab en de auditverifier. Via **Casus invoeren** doorloopt een vrije tekortmelding met eigen voorschrift en synthetische flags dezelfde regelgate, goedkeuring, export en audit. Een service worker maakt opnieuw laden van eerder bezochte schermen offline mogelijk.

## Verifiëren

```bash
npm run typecheck
npm test
npm run build
npm run qa
npx tsx scripts/verify-chain.ts
```

- **20 stoffen / 30 casussen:** tien gelijke sterkte, tien sterkte- of verpakkingswijziging, tien zonder geldige keten.
- **Regelgate:** P-SUB-01, P-CI-01, P-PAEDI-01, P-STR-02, P-STR-01, P-IMPORT-01, P-REIMB-01 en P-SOURCE-01 in vaste precedentie.
- **Audit:** canonieke JSON, SHA-256, aaneengesloten volgnummers en een zichtbare manipulatiedemo op regel 7.
- **Swarm:** 240 synthetische persona's, tien exacte quota, 24 rondes, negen gebeurtenissen, 200 ensemble-runs en Wilson-intervallen. Geen LLM en geen voorspelling.
- **Exports:** A4-print, PDF en JSON uitsluitend na goedkeuring. Niets wordt verzonden.

## Data en bronnen

Alle SmPC-extracten, voorkeurslijsten, meldingen, patiëntflags en persona's zijn **synthetische voorbeelddata — geen officiële lijsten**. Velden in de regelgate dragen een bron, peildatum en SHA-256. De contextcijfers komen uit de opgegeven build specificatie, met de daar genoemde publicaties en data uit 2026.

`data/swarm/falsifiers.json` is vóór de ensemble-uitkomsten vastgelegd. De gegenereerde resultaten staan in `data/swarm/runs.json`; de applicatie forceert ze niet naar een gewenste pitch. Op dit moment weerlegt de configuratie onder meer de aanname dat huisartsen een bericht accepteren.

## Belangrijke beoordeling van de specificatie

De specificatie combineert 30 casussen, waarvan er verplicht tien nul geldige ketens moeten hebben, met een dekkingsdoel van minstens 70% over álle 30. Die eisen zijn wiskundig onverenigbaar: maximaal 20/30 = 66,7% van de casussen kan dekking hebben. De implementatie kiest voor de veiligheidsinvariant en rapporteert de werkelijke 20/30 in plaats van het getal aan te passen.

Ook botst de auditsectie enerzijds met ‘alleen approve schrijft’ en export- en open-gebeurtenissen anderzijds. De implementatie houdt `/api/chain` en `/api/export` strikt schrijfvrij; bij goedkeuring worden de casusopenstelling, ketengeneratie en zichtbare weigeringen alsnog vastgelegd.

## Stack

Next.js 16 · React 19 · strict TypeScript · plain CSS · Vitest · JSON/JSONL · self-hosted Inter, IBM Plex Mono en Source Serif 4 · geen runtime externe API of database.
