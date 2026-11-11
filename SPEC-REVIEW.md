# End-to-end review van `build-pharmacy.md`

## Beoordeling

De specificatie is sterk waar zij veiligheid als zichtbaar productgedrag behandelt in plaats van als disclaimer. De beste keuzes zijn de permanente weigeringskolom, `onbekend` als eersteklas antwoord, deterministische regels met precedentie, een branded approval type, hash-geketende audit en falsifiers die vóór de ensemble-uitkomsten vaststaan. Die kern is onverkort geïmplementeerd.

De specificatie bevat ook enkele tegenstrijdige acceptatie-eisen. De implementatie kiest telkens voor de strengere veiligheids- of controle-eis en legt die keuze hier vast.

## Gevonden conflicten en genomen besluiten

### 1. 70% dekking is onverenigbaar met tien verplichte nul-antwoordcasussen

Tien van de dertig casussen moeten nul geldige ketens teruggeven. Daardoor kunnen maximaal twintig casussen dekking hebben: **20/30 = 66,7%**, niet ≥70%. De implementatie behoudt T-20 en rapporteert de werkelijke dekking. De tests of fixtures zijn niet verzwaard om het doel kunstmatig te halen.

### 2. Alleen `approve` schrijft, maar openen/genereren/exporteren moeten ook worden gelogd

De API-sectie maakt `POST /api/approve` de enige schrijver naast de auditendpoint, terwijl de auditsectie ook `CASE_OPENED`, `CHAINS_GENERATED` en `ADVICE_EXPORTED` vraagt. De implementatie houdt chain generation en export volledig schrijfvrij. Bij de eerste goedkeuring logt de approve-route de casusopenstelling, ketengeneratie, iedere zichtbare weigering en daarna de goedkeuring. Export blijft schrijfvrij; er wordt dus geen `ADVICE_EXPORTED`-regel toegevoegd.

### 3. Een import zonder registratie niet emitten versus een zichtbare importweigering

§7 zegt dat een import zonder buitenlandse registratie niet wordt geëmitteerd; andere onderdelen vragen een zichtbare `P-IMPORT-01`-weigering en T-18 verbiedt iedere geëmitteerde import zonder registratie. De generator volgt §7 en T-18: een dergelijke kandidaat komt nooit in de chainlijst. De gate ondersteunt de regel nog steeds defensief. De tien nul-antwoordcasussen gebruiken andere, expliciet zichtbare regeluitkomsten.

### 4. Het auditbestand moet vertrouwen kunnen weigeren

Een hash verifier alleen tonen is onvoldoende als export een gemanipuleerde goedkeuring toch zou accepteren. `latestApproval` en custom-case snapshots worden daarom alleen teruggegeven wanneer de volledige keten verifieert. Na manipulatie is export geblokkeerd totdat de demolog wordt hersteld.

### 5. Het voorbeeld “78/200” is geen verwachte uitkomst

De engine gebruikt de opgegeven priors, agentregels, events en seeds, maar de voorbeeldfrequentie in §13.2 is niet een aanvullende invariant. De applicatie rapporteert de werkelijk berekende ensemble-uitkomsten uit `data/swarm/runs.json`. Zij worden niet naar 78/200 of een andere pitchvriendelijke waarde geforceerd. De huidige configuratie weerlegt in 200/200 runs de GP-berichtaanname; die falsifier krijgt een prominente plaats.

### 6. De verkoopkanaal-spanning is deels in de priors ingebouwd

`wholesaler.hops = .88`, `regulator.hops = .66` en `regulator.refuse = .90` zijn aannames. De gegenereerde tegenspraak mag daarom niet als veldonderzoek worden gepresenteerd. Het rapport toont zowel de gemeten divergentie als de .25-drempel en benoemt expliciet dat dit geen empirisch bewijs is.

### 7. Klinische en vergoedingsdata blijven demonstratiemateriaal

De meegeleverde SmPC-velden en preferentiemomentopnamen zijn synthetisch en dragen dat label, een peildatum en een hash. Ze zijn geen actuele CBG/EMA- of verzekeraarsdata. Voor reëel gebruik zijn een formele klinische review, gelicentieerde en gedateerde bronfeeds, een classificatieadvies en een apothekersprotocol nodig. De applicatie claimt geen klinische validatie of vergoedingsgarantie.

### 8. De energiewaarden zijn aannames uit de specificatie

±1,0 kWh warm en ±2,6 kWh koud per 1.000 casussen worden als context weergegeven, niet als metingen van deze implementatie. De cachebeslissing op documenthash is architectonisch overgenomen; er worden geen eigen meetcijfers verzonnen.

### 9. Offline betekent meer dan geen externe API

Er zijn geen runtime-API-afhankelijkheden of CDN-fonts. Een service worker cachet bovendien eerder bezochte documenten, scripts en fonts voor offline reloads. Goedkeuring en audit blijven bewust lokale serveroperaties; offline UI-caching wordt niet misbruikt om een goedkeuring te vervalsen.

## Gebouwde dekking

- Vrije notice-intake met deterministische veldherkenning, expliciete voorschriftvelden en alleen synthetische patiëntflags.
- Twintig stoffen, dertig vaste casussen en tien nul-antwoordcasussen.
- Permanente drie-kolommenbeoordeling met geldige ketens én alle weigeringen/onbekenden.
- Apothekersgoedkeuring, bewerkbare GP- en B1-documenten, A4, PDF en JSON.
- Hash-chained JSONL, verifier, regeltabel en tamper-row-7-demo.
- Interactieve 240-agent canvas, 24 rondes, negen events, druk- en vermengingshendels, beslissingslijn, agentprofielen, ensemble-CI's en falsifierrapport.
- Instrument v1/v2, dekkingsmatrix, 14 items en synthetische CSV-antwoorden.
- Zelf-gehoste fonts, responsive CSS, reduced-motion-ondersteuning en offline documentcaching.

## Verificatie

De repository bevat T-01 t/m T-20 in `tests/wall.test.tsx`, fixture-QA in `scripts/qa.ts`, ensemblegeneratie in `scripts/gen-swarm.ts` en auditverificatie in `scripts/verify-chain.ts`. Daarnaast zijn de gebundelde en custom API-flows live getest: ongeautoriseerde export geeft 409, chain generation schrijft niet, goedkeuring ontgrendelt export en manipulatie geeft exact `brokenAt: 7` gevolgd door `null` na reset.
