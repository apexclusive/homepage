# APEXclusive — homepage

Statische website van [apexclusive.nl](https://apexclusive.nl) — onafhankelijke aankoop-,
import- en verkoopbegeleiding voor exclusieve auto's. Gedeployed op Vercel.

## Structuur

```
index.html                     Homepage (hero, aanbod, diensten, werkwijze, cases,
                               ervaringen, over, investering, contact, FAQ, tools,
                               kennisbank, AI-chat, WhatsApp-knop)
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
sourcing-brief.html            Tool: sourcing brief opstellen
verkoopvoorbereiding-planner.html  Tool: verkoop-checklist met voortgang
kennisbank.html                 Kennisbank-overzicht (2 artikelen)
kennisbank-bpm-import.html      Artikel: BPM bij import (Article + FAQPage-schema)
kennisbank-aankoopcontrole.html Artikel: controle vóór aankoop (Article + FAQPage-schema)
api/apex-lead.js               Serverless: ontvangt leadformulier, bezorgt via
                               webhook (Zoho Flow/Make/Zapier) of e-mail (ZeptoMail/Resend)
api/chat.js                    Serverless: AI-concierge (OpenAI gpt-4o-mini), met
                               offline fallback-antwoorden
apex-lead-form.js              Bindt elk <form class="lead-form"> (homepage + dienstpagina's);
                               stuurt naar /api/apex-lead met mailto-fallback
apexclusive-modern.css         Basis thema (tokens, header, hero, secties)
apexclusive-index.css          Homepage: samengevoegde stijllagen (brand, ai,
                               quality, scale, finish, overview — 6 verzoeken → 1)
apexclusive-subpages.css       Merklaag voor alle subpagina's
apexclusive-tools.css          Merklaag voor de tool-pagina's
apexclusive-tool-concierge.*   Chatwidget voor tool-pagina's
apexclusive-ai.css             Bronbestand chatwidget homepage (samengevoegd in index.css)
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
