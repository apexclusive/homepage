# Analyse APEXclusive-website (apexclusive/homepage)

Datum: 31 augustus 2026 · 13 pagina's, 4 JS-bestanden, 2 serverless API-endpoints (Vercel)

## Status: doorgevoerde verbeteringen (31 augustus 2026)

- **Eén design-systeem:** alle subpagina's (service-, cases-, juridische, planner- en aanbodpagina) draaien nu op het 2026-homepage-thema (Playfair Display / Manrope / DM Sans, koperaccenten, donkere ink-tinten). Verouderde themalagen (`apex-page.css`, `apex-tool-theme.css`, `apexclusive-compatibility.css`, `apexclusive-offer-luxury.css`, `apexclusive-readability.css`) worden niet meer door deze pagina's geladen (bestanden blijven bewaard voor de tool-subdomeinen die ze mogelijk delen).
- **Sociale weergave compleet:** og:image + twitter:card + favicon + theme-color + canonical + hreflang op álle 13 pagina's; og:title gelijkgetrokken met de page-title.
- **Nieuwe pagina:** `privacyverklaring.html` (AVG) — gelinkt vanuit alle footers, het leadformulier en de voorwaarden.
- **Techniek:** `package.json` met `"type": "module"` toegevoegd (serverless API's op Vercel); `vercel.json` uitgebreid met CSP, `X-Frame-Options` en immutable cache-headers voor versieerde CSS/JS.
- **Eén fonts-URL** op alle pagina's, met alleen gebruikte gewichten (was 3 verschillende URL's / 12+ gewichten).
- **Navigatie:** "Aanbod" toegevoegd aan desktop-nav, mobiel menu en footers; footers op subpagina's zijn nu identiek aan die van de homepage.
- **Contactformulier:** privacy-notitie onder de knop, honeypot-input nu ook `aria-hidden`.
- **Contrast verbeterd** (fine-print, footer-tekst) en `sitemap.xml`/`robots.txt` opgeschoond (subdomein-URL's uit de sitemap, lastmod 2026-08-31).
- **Urus-pagina:** gemigreerd naar de merktaal (Playfair/Manrope, koperaccenten, schildlogo in topbar), 4 overbodige CSS-requests verwijderd, OG-afbeelding 1200×630.

Nog open (bewuste keuzes): KvK/BTW-gegevens invullen in voorwaarden en footer (bedrijfsgegevens), indicatieve tarieven, klantcitaten/recensies, en omgevingsvariabelen (LEAD_WEBHOOK_URL/ZEPTOMAIL_TOKEN/OPENAI_API_KEY) op Vercel instellen.

---

## 1. Eindoordeel

De site is **bovengemiddeld sterk** voor een statische site: uitstekende SEO-fundamenten (canonical, hreflang, Open Graph, JSON-LD met LocalBusiness + FAQ + Vehicle-schema), nette performance-aanpak (LCP-preload, responsive Cloudinary-afbeeldingen met `width`/`height`, lazy loading), en een doordachte conversielijn (honeypot, validatie, mailto-fallback, WhatsApp, AI-concierge met fallback-antwoorden).

De grootste verbeterkansen liggen niet in wat er is, maar in **consistentie**: de homepage en de subpagina's draaien op **twee verschillende design-systemen**, er liggen **dode CSS-bestanden** uit eerdere redesign-rondes in de repo, en de **sociale/SEO-meta is ongelijk verdeeld** over de pagina's.

---

## 2. Wat al goed is (niet aanbreken)

| Gebied | Bevinding |
|---|---|
| **SEO** | Canonical + hreflang op index, sitemap.xml compleet (12 pagina's + 8 subdomeintools), robots.txt, unieke title/description per pagina, precies één H1 per pagina |
| **Structured data** | LocalBusiness (+offer catalog) + FAQPage op index; Vehicle + Offer (met prijs € 252.500) op aanbod-urus.html |
| **Performance** | LCP-hero gepreloaded met `fetchpriority=high` + `imagesrcset`; alle afbeeldingen met `width`/`height` (geen CLS); onder-de-fold beelden `loading="lazy"`; preconnect naar fonts + Cloudinary |
| **Toegankelijkheid** | Skip-link, `aria-live` op form-status, `aria-expanded` op menu/AI-panel, FAQ via native `<details>`, focus-visible-stijlen, `prefers-reduced-motion` afgehandeld, 16px-inputs (geen iOS-zoom) |
| **Conversie** | Honeypot-veld + server-side validatie, veilige fallback naar mailto, `dataLayer`-events zonder externe trackers, telefoon/WhatsApp/e-mail altijd één klik verwijderd |
| **Security** | HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` via vercel.json; API-endpoints met origin-allowlist en input-sanitization |

---

## 3. Prioriteit A — Structuur & techniek

### A1. Twee design-systemen die botsen ⚠️ belangrijkste punt
De homepage (2026-thema) en alle subpagina's (ouder thema) zijn visueel verschillende websites:

| | Homepage | Subpagina's |
|---|---|---|
| Fonts | DM Sans + Manrope + Playfair Display | Cormorant Garamond + Oswald + DM Sans |
| Header | `site-header` (fixed, 84px) | `topbar` (sticky, 78px) |
| CSS-lagen | `apexclusive-modern.css` + 6 laagjes | `apex-page.css` + `apex-tool-theme.css` + `service-page.css` + `apexclusive-compatibility.css` + `apexclusive-subpages.css` |

Een bezoeker die doorklikt van de homepage naar "Aankoopbegeleiding" ziet een **breuk in merkbeleving**: ander lettertype, andere knoppen, andere header. Dit is voor een premium-merk het grootste verbeterpunt.

**Aanbeveling:** migreer de 7 subpagina's naar het 2026-homepage-thema (of bouw één gedeelde themalaag met dezelfde variabelen, knoppenstijl en header). De subpagina's zijn simpel opgebouwd, dus dit is goed te doen — zie actieplan.

### A2. Dode en overlappende bestanden
| Bestand | Status |
|---|---|
| `apexclusive-home-polish.css` | **0 verwijzingen** — dode code, kan weg |
| `apexclusive-luxury.css` | **0 verwijzingen** — dode code, kan weg |
| `apexclusive-a-mark.svg` | **0 verwijzingen** — kan weg |
| `apexclusive-schild-randloos.svg` | geen directe html-ref, maar wél via `url()` in CSS — **niet verwijderen** |
| `apexclusive-quality.css`, `-scale.css`, `-finish.css`, `-overview.css`, `-brand.css`, `-ai.css` | elk 1 verwijzing (index), maar met veel `!important` die elkaar overschrijven |

De opeenvolging modern → brand → ai → quality → scale → finish → overview is **zeven CSS-lagen met `!important`-overrides**. Elke volgende redesign-ronde stapelt zich op de vorige. De cascade is daardoor fragiel: één wijziging in `apexclusive-modern.css` kan stilzwijgend door een `!important` in een later laagje worden teruggedraaid.

**Aanbeveling:** consolideer tot 1–2 CSS-bestanden per thema (home + subpagina) en verwijder `!important` waar mogelijk. Doe dit als onderdeel van A1.

### A3. Risico: serverless API zonder package.json ⚠️
De map `api/` (`apex-lead.js`, `chat.js`) gebruikt **ES-module-syntax** (`export default`), maar er is **geen package.json** in de repo. Op Vercel wordt `api/` automatisch als serverless functions herkend; zonder `"type": "module"` (of `.mjs`-extensie) kan Node de bestanden echter als CommonJS proberen te laden, met een syntaxfout als gevolg. Het leadformulier en de AI-chat hangen hieraan.

**Aanbeveling:**
- Voeg een minimale `package.json` toe met `"type": "module"` (of hernoem naar `.mjs`), en test na deploy:
  - `POST /api/apex-lead` → verwacht 200/503 (nooit 500)
  - `POST /api/chat` → verwacht 200 met `reply`
- Zet de omgevingsvariabelen (`LEAD_WEBHOOK_URL` of `ZEPTOMAIL_TOKEN`/`RESEND_API_KEY`, `OPENAI_API_KEY`) op Vercel, anders valt het formulier structureel terug op mailto.

### A4. Dubbele Google Fonts-lading op plannerpagina's
`import-traject-planner.html`, `sourcing-brief.html` en `verkoopvoorbereiding-planner.html` laden **dezelfde fonts-stylesheet twee keer**: één keer async (`media="print"` + onload-truc) en één keer normaal. Resultaat: dubbele fetch, en de async-truc heeft geen zin omdat de normale `<link>` render-blocking blijft.

**Fix:** één `<link>` (bij voorkeur async met `noscript`-fallback, of gewoon normaal).

### A5. Cache-busting is inconsistent
- Index: `?v=20260831-2` (netjes)
- Plannerpagina's: `?v=20260830-1` / `?v=20260830-2` (één dag ouder — na een deploy krijgen terugkerende bezoekers oude CSS/JS)
- `cases.html`: linkt `apexclusive-modern.css` **zonder versie** (kan maandenlang gecachte CSS serveren)
- `apexclusive-compatibility.css`, `service-page.css`, `header-scroll.js`: zonder versie

**Aanbeveling:** één versie-tag per asset overal gelijktrekken (of automatisch hashen bij deploy).

### A6. Kleine dingetjes
- `robots.txt` mist een afsluitende newline (cosmetisch, geldig).
- `sitemap.xml` bevat 8 URL's van subdomeinen (`bpm.apexclusive.nl` e.d.). Technisch horen die in de sitemap van het betreffende subdomein; het werkt, maar is onderhoudsgevoelig.
- `vercel.json` mist `X-Frame-Options`/`frame-ancestors` en een CSP. Voor een statische site zonder inline-risico's is een eenvoudige CSP (script-src 'self' + inline waar nodig) een mooie verbetering.

---

## 4. Prioriteit B — SEO & sociale weergave

### B1. Deel-pagina's missen Open Graph-afbeeldingen
Alleen `index.html` en `aanbod-urus.html` hebben `og:image` + `twitter:card`. De overige pagina's (cases, aankoopbegeleiding, importbegeleiding, verkoopbegeleiding, sourcing-service, over-apexclusive) tonen bij delen op WhatsApp/LinkedIn **zonder afbeelding** — en voor een visueel product (auto's) is dat juist de krachtigste weergave.

**Fix:** één gedeelde OG-afbeelding (1200×630, bijv. de Urus- of cockpitfoto) op alle pagina's, plus `twitter:card=summary_large_image`.

### B2. Favicon en theme-color ontbreken op 7 pagina's
`cases.html`, de 4 servicepagina's, `over-apexclusive.html` en `algemenevoorwaarden.html` hebben geen favicon en geen `theme-color` (tabs tonen een leeg icoon; op mobiel geen gekleurde statusbalk). De SVG-favicon van index kan op elke pagina worden hergebruikt.

### B3. Og-titel wijkt af van page-title op index
`<title>` zegt "Onafhankelijke aankoopbegeleiding voor exclusieve auto's", `og:title` zegt "Private Vehicle Advisory". Google toont vaak de og:title bij delen, maar voor consistentie in de SERP: gelijktrekken (of bewust verschillend laten, dan de keywordrijke variant overal gebruiken).

### B4. Subpagina's hebben geen Organisatie-schema
Index heeft een rijk LocalBusiness-schema, maar subpagina's slechts een los `Service`-schema zonder `provider`-verwijzing naar een `@id`. Door overal naar `https://apexclusive.nl/#business` te verwijzen versterk je het entiteitsprofiel bij Google.

---

## 5. Prioriteit C — Conversie & vertrouwen

### C1. Privacy/AVG
- Het leadformulier verzamelt persoonsgegevens zonder verwijzing naar een privacyverklaring en zonder toestemmingsvinkje. Voor een commercieel formulier is een **privacyverklaring** (bijv. als subpagina, gekoppeld in de footer én onder het formulier) een aanrader.
- Er is alleen `algemenevoorwaarden.html`. Een korte privacy-pagina (welke gegevens, waarom, bewaartermijn, rechten) dekt de AVG-informatieplicht en kost weinig.

### C2. Wettelijke informatie ontbreekt
In de algemene voorwaarden en footer staat **geen KvK-nummer, geen adres, geen BTW-id**. Voor een Nederlands bedrijf met een website horen KvK en vestigingsadres vermeld te worden (en BTW-id indien van toepassing). Ook in het LocalBusiness-schema staat alleen "Maastricht" — vul het adres aan.

### C3. Navigatie mist het actuele aanbod
De homepage heeft een uitgelichte auto (Lamborghini Urus, sectie `#aanbod`), maar de header-navigatie linkt er niet naartoe. Zeker zolang er één auto te koop staat, is "Aanbod" een van de belangrijkste klikdoelen. Voeg toe aan desktop-nav, mobiel menu en footer.

### C4. Geen sociale bewijskracht
Voor transacties van € 100k+ is vertrouwen alles. Overweeg:
- 1–2 **klantcitaten** (geanonimiseerd) bij de cases of het contactblok
- Link naar een **Google-recensieprofiel** en/of echte klantcases met meer detail (discretie is hier een legitieme keuze — maak die keuze dan bewust)
- Het aantal begeleide importen of jaren ervaring als concreet cijfer in de hero of het "Waarom"-blok

### C5. Prijstransparantie
De sectie "Investering" is bewust vaag ("hangt af van de omvang"). Dat is een keuze, maar een **indicatief tarief** (bijv. "aankoopcontrole vanaf € X, volledig traject vanaf € Y") of een "Hoe het werkt met kosten" zou veel sterker converteren voor serieuze kopers die tussen aanbieders vergelijken.

---

## 6. Prioriteit D — Performance & toegankelijkheid (details)

### D1. Fonts
- Homepage: 3 families, 12 gewichten/stijlen (DM Sans 300–600, Manrope 400–700, Playfair 400–500 + italics) via Google Fonts. Voor een statische site is dit de grootste render-blocking resource.
- Subpagina's laden **andere** families er nog eens bovenop.
- **Aanbeveling:** terug naar 2 families met minder gewichten (bijv. Playfair 400/500 + DM Sans 400–600), of zelfhosten met subsetting (`&text=`, `unicode-range`). Scheelt honderden KB op elke pagina.

### D2. Hero-preload met `crossorigin`
De LCP-preload en de hero-`<img>` hebben een `crossorigin`-attribuut. Cloudinary stuurt normaal CORS-headers mee, maar controleer in DevTools (Netwerk-tab) of de preload niet **twee keer** wordt opgehaald (preload-failure → dubbele download). Zo ja: `crossorigin` verwijderen.

### D3. Contrast van kleine tekst
`fine-print` (.72rem, `#858b86` op donker) en diverse `muted`-kleuren zitten rond de WCAG-AA-grens. Voor kleine tekst is dat risicovol. Controleer met een contrasttool en donker bij twijfel.

### D4. Honeypot-veld aankondiging
Het verborgen honeypot-veld heeft `aria-hidden` op het label, maar de `<input>` zelf niet — sommige screenreaders kondigen het veld alsnog aan. Voeg `aria-hidden="true"` toe aan de input (naast het bestaande `tabindex="-1"`).

### D5. Print-styling
Alleen de homepage heeft een print-blik (`apexclusive-quality.css`). Voor de aanbodpagina (printbare specificaties!) zou een printversie mooi zijn.

---

## 7. Actieplan (voorgestelde volgorde)

**Sprint 1 — Quick wins (½ dag, geen risico):**
1. Enkele Google Fonts-link op de 3 plannerpagina's (A4)
2. OG-afbeelding + twitter:card + favicon + theme-color op alle subpagina's (B1, B2)
3. og:title gelijktrekken met page-title (B3)
4. "Aanbod" toevoegen aan navigatie + footer (C3)
5. Cache-versies gelijktrekken (A5)
6. Honeypot-input `aria-hidden` (D4)

**Sprint 2 — Stabiliteit (1 dag):**
7. `package.json` met `"type": "module"` + deploy-test van beide API's (A3)
8. Dode bestanden verwijderen (`apexclusive-home-polish.css`, `apexclusive-luxury.css`, `apexclusive-a-mark.svg`) (A2)
9. Privacyverklaring + KvK/contactgegevens in voorwaarden en footer (C1, C2)

**Sprint 3 — Merkconsistentie (2–3 dagen):**
10. Subpagina's migreren naar het 2026-homepage-thema, CSS consolideren zonder `!important`-stapeling (A1, A2)
11. Fonts terugbrengen naar 2 families (D1)

**Sprint 4 — Groei (later):**
12. Indicatieve tarieven of kosten-uitleg (C5)
13. Klantcitaten / recensieprofiel (C4)
14. CSP + `X-Frame-Options` in vercel.json (A6)

---

*Rapport gegenereerd uit een volledige statische analyse van de repository; live-status van externe diensten (subdomeinen, Cloudinary) kon vanuit deze omgeving niet worden geverifieerd.*
