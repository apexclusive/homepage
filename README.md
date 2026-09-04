# APEXclusive — homepage

Statische website van [apexclusive.nl](https://apexclusive.nl) — onafhankelijke aankoop-,
import- en verkoopbegeleiding voor exclusieve auto's. Gedeployed op Vercel.

## Structuur

```
index.html                     Homepage (hero, aanbod, diensten, werkwijze, dossiers,
                               over, investering, contact, FAQ, 14 hulpmiddelen,
                               deel-banner, kennisbank, AI-chat, WhatsApp-knop)
icons/                         Favicon-set: favicon.ico/-16/-32, apple-touch-icon,
                               PWA-iconen 192/512 (schildlogo op donkere plaat)
site.webmanifest               PWA-manifest (standalone, donkere huisstijl)
aanbod-urus.html               Verkooppagina Lamborghini Urus (galerij + lightbox,
                               FAQ + FAQPage-schema, cross-links, WhatsApp-knop)
aankoopbegeleiding.html        Dienstpagina
importbegeleiding.html         Dienstpagina
verkoopbegeleiding.html        Dienstpagina
sourcing-service.html          Dienstpagina
cases.html                     Gerealiseerde trajecten
over-apexclusive.html          Over APEXclusive
algemenevoorwaarden.html       Juridisch
privacyverklaring.html         Juridisch (AVG)
import-traject-planner.html    Tool: import-checklist met voortgang (localStorage)
import-handleiding.html         Product: doe-het-zelf import handleiding A-Z (€99, Product-schema)
sourcing-brief.html            Tool: sourcing brief opstellen
verkoopvoorbereiding-planner.html  Tool: verkoop-checklist met voortgang
maandkosten-calculator.html        Tool: wat kost uw auto per maand (TCO, live)
top100-rij-anthems.html            Tool: top 100 rij-anthems met Spotify + Tidal-links
apexclusive-anthems.js             Rij-anthems: data (100 tracks) + zoeken/filteren/downloaden
apexclusive-anthems.css            Rij-anthems: specifieke stijlen
apexclusive-share.js               Deel-component: Web Share API + WhatsApp/copy-fallback
kennisbank.html                 Kennisbank-overzicht (10 artikelen)
kennisbank-bpm-import.html      Artikel: BPM bij import (Article + FAQPage-schema)
kennisbank-importeren-duitsland.html Artikel: auto importeren uit Duitsland (Article + FAQPage-schema)
kennisbank-aankoopcontrole.html Artikel: controle vóór aankoop (Article + FAQPage-schema)
kennisbank-verkoop.html         Artikel: exclusieve auto verkopen (Article + FAQPage-schema)
kennisbank-maandkosten.html     Artikel: maandkosten exclusieve auto (Article + FAQPage-schema)
kennisbank-restwaarde.html      Artikel: restwaarde & afschrijving (Article + FAQPage-schema)
kennisbank-porsche-911.html     Artikel: Porsche 911 kopen — modelgids (Article + FAQPage-schema)
kennisbank-g-klasse.html        Artikel: Mercedes G-Klasse kopen — modelgids (Article + FAQPage-schema)
kennisbank-top10-waardevast.html Artikel: top 10 waardevaste auto's 2026 (Article + FAQPage + ItemList-schema)
kennisbank-urus.html          Artikel: Lamborghini Urus kopen — modelgids (Article + FAQPage-schema)
kennisbank-macan.html        Artikel: Porsche Macan kopen — modelgids (Article + FAQPage-schema)
kennisbank-cayenne.html      Artikel: Porsche Cayenne kopen — modelgids (Article + FAQPage-schema)
kennisbank-range-rover.html  Artikel: Range Rover kopen — modelgids (Article + FAQPage-schema)
kennisbank-bmw-x5.html       Artikel: BMW X5 kopen — modelgids (Article + FAQPage-schema)
kennisbank-beste-importautos.html Artikel: top 10 beste importauto's 2026 (Article + FAQPage + ItemList-schema)
kennisbank-taycan.html        Artikel: Porsche Taycan kopen — modelgids (Article + FAQPage-schema)
kennisbank-audi-rsq8.html     Artikel: Audi RS Q8 kopen — modelgids (Article + FAQPage-schema)
kennisbank-top10-snelste-afschrijving.html Artikel: top 10 snelst afschrijvende auto's 2026 (Article + ItemList + FAQPage)
kennisbank-audi-etron-gt.html Artikel: Audi e-tron GT kopen — modelgids (Article + FAQPage-schema)
kennisbank-bmw-7-serie.html   Artikel: BMW 7 Serie kopen — modelgids (Article + FAQPage-schema)
kennisbank-mercedes-eqs.html Artikel: Mercedes EQS kopen — modelgids (Article + FAQPage-schema)
kennisbank-bmw-i7.html       Artikel: BMW i7 kopen — modelgids (Article + FAQPage-schema)
restwaarde-vergelijker.html   Tool: vergelijk de 5-jaars afschrijving van twee modellen (WebApplication + ItemList-schema)
api/apex-lead.js               Serverless: ontvangt leadformulier, bezorgt via
                               webhook (Zoho Flow/Make/Zapier) of e-mail (ZeptoMail/Resend)
api/chat.js                    Serverless: AI-concierge (OpenAI gpt-4o-mini) met
                               volledige site-kennis (diensten, 14 tools, kennisbank,
                               aanbod, dossiers) in de system-prompt; gebruikt de
                               toolContext van de tool-pagina's voor contextuele
                               antwoorden; offline fallback in u-vorm
apex-lead-form.js              Bindt elk <form class="lead-form"> (homepage + dienstpagina's);
                               stuurt naar /api/apex-lead met mailto-fallback
apexclusive-modern.css         Basis thema (tokens, header, hero, secties)
apexclusive-index.css          Homepage: alle samengevoegde stijllagen in één
                               bestand (was 14 losse bronbestanden, verwijderd)
apexclusive-subpages.css       Merklaag voor alle subpagina's
apexclusive-tools.css          Merklaag voor de tool-pagina's
apexclusive-tool-concierge.*   Chatwidget voor tool-pagina's
apexclusive-modern.js          Menu, scroll-header, leadformulier, AI-chat, scrollspy
apexclusive-funnel-events.js   dataLayer-events (geen externe trackers)
404.html                       Merkgebonden 404-pagina (Vercel serveert hem automatisch)
.well-known/security.txt       Beveiligingscontact voor onderzoekers
vercel.json                    Redirects, security headers (CSP), cachebeleid
```

## Contact- en conversie-elementen

- **Zwevende WhatsApp-knop** (linksonder) op alle pagina's, ook de tool-pagina's
  en de 404; op aanbod-urus met een specifieke vooraf ingevulde vraag. Officiële
  `wa.me`-links: mobiel opent de app, desktop opent WhatsApp Web — geen
  embedded widget (bewuste keuze, zie ANALYSE-verbeterpunten.md).
- **AI-concierge** (rechtsonder, homepage): chat met OpenAI-fallback, nu met
  `role="dialog"` + focus-trap voor toetsenbordgebruikers.
- **Leadformulier** op homepage + dienstpagina's + over-pagina; honneypot,
  server-side validatie en mailto-fallback.
- **Scrollspy**: actieve sectie wordt gemarkeerd in de hoofdnavigatie.
- **14 hulpmiddelen** in vier groepen (kopen & controleren, kosten & regelen,
  sourcen & verkopen, plannen & beleven); elk met icoon, korte functie-uitleg en
  externe link naar het betreffende subdomein (`target="_blank"` +
  sr-only-notitie). "Tools" staat in de hoofd- en mobiele navigatie en in de footer.
- **Deel-banner (mond-tot-mond)** onder de hulpmiddelen: Web Share API met
  WhatsApp- en kopieer-fallback (`apexclusive-share.js`), gevoed door
  Nielsen-data (92% vertrouwt een aanbeveling boven reclame).
- **Favicon-set**: eigen gerasterd schildlogo (tricolore contour, zilveren A) als
  multi-size favicon.ico, PNG-favicons, apple-touch-icon, PWA-iconen en
  Safari-pinned-tab (mask-icon, koper).
- **Zichtbare breadcrumbs** op alle 15 subpagina's (afgeleid van de
  BreadcrumbList-JSON-LD; laatste item aria-current).
- **Sectie-ritme** op de homepage: Dossiers donkerder dan Werkwijze, Over en
  Kennisbank in een warmere lichte tint — geen twee identieke achtergronden
  meer naast elkaar.
- **ItemList-JSON-LD** met de 14 hulpmiddelen (naam + URL per tool).
- **Tool-pagina's** linken naar de bijbehorende dienst (planner → begeleiding);
  de 4e link in "Verder lezen" wordt als volle-breedte-banner getoond.

## Vereisten voor deploy (Vercel)

Voeg deze omgevingsvariabelen toe bij het project (Settings → Environment Variables):

| Variabele | Nodig voor | Toelichting |
|---|---|---|
| `LEAD_WEBHOOK_URL` | Leadformulier | POST met JSON naar Zoho Flow / Make / Zapier / n8n |
| `ZEPTOMAIL_TOKEN` | Leadformulier (alt) | E-mail via ZeptoMail; vereist `LEAD_FROM_EMAIL` |
| `RESEND_API_KEY` | Leadformulier (alt) | E-mail via Resend; vereist `LEAD_FROM_EMAIL` |
| `LEAD_FROM_EMAIL` | E-mailroutes | Afzender op een geverifieerd domein |
| `LEAD_TO_EMAIL` | E-mailroutes | Ontvanger (standaard info@apexclusive.nl) |
| `OPENAI_API_KEY` | AI-concierge | Zonder sleutel antwoordt de chat met een vaste fallback |

Zonder bezorgmethode antwoordt `/api/apex-lead` met 503 en opent de site het
mailprogramma van de bezoeker (mailto-fallback) — een aanvraag gaat nooit stil verloren.

## Ontwikkelen

```bash
python3 -m http.server 4173          # lokale preview (API's werken dan niet)
```

API's lokaal testen kan met Vercel CLI: `vercel dev`.

## Cache-versies

CSS/JS worden met `?v=YYYYMMDD-N` ingeladen. Bij elke wijziging aan een
stylesheet of script: versie verhogen in álle HTML-bestanden die ernaar verwijzen,
zodat terugkerende bezoekers niet eindeloos oude bestanden uit cache krijgen.

## Design-tokens

Het thema leeft in `:root` van `apexclusive-modern.css`:

- `--ink` #0b0e0e · `--paper` #f1eee8 · `--copper` #ba7e53 · `--copper-light` #e2b28e
- `--serif` Playfair Display · `--display` Manrope · `--sans` DM Sans

Subpagina's erven deze tokens via `apexclusive-subpages.css`; de tool-pagina's
via `apexclusive-tools.css` (eigen `--tool-*`-tokens, zelfde palet).
