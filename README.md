# Klantenportaal — CRM & Ticketsysteem

Een op zichzelf staand CRM- en klantenportaal met ticketing, kennisbank, rapportages
en gebruikersbeheer — vergelijkbaar met Freshdesk/Zendesk, volledig in eigen beheer.

## Stack

- **Backend:** Node.js, TypeScript, Express, Prisma ORM, PostgreSQL, JWT + refresh tokens, RBAC
- **Frontend:** React (Vite), TypeScript, Tailwind CSS, shadcn/ui-stijl componenten, TanStack Query, React Hook Form + Zod
- **Infra:** Docker Compose (Postgres + backend + frontend/nginx)

## Wat is er gebouwd (v1 kernplatform)

- Authenticatie (JWT + refresh tokens) en rolgebaseerde toegang (RBAC) met configureerbare rollen/rechten
- CRM: bedrijven, contactpersonen, contracten, klantportaal-accounts
- Ticketsysteem: configureerbare statussen/prioriteiten/categorieën/labels, conversatie (chat), interne notities, volledige audit trail/historie, tijdregistratie, bijlagen
- Kennisbank: markdown-artikelen, categorieën, tags, versiegeschiedenis, publiek/intern
- Dashboard met kerncijfers en grafieken, per-status/categorie/medewerker-overzichten
- In-app notificaties, globale zoekfunctie (tickets/klanten/bedrijven/kennisbank/gebruikers)
- Klantenportaal (aparte, vereenvoudigde navigatie voor klanten) met eigen tickets en kennisbank

## Nog niet gebouwd (bewust uit scope voor v1, wel voorbereid in de architectuur)

E-mailintegratie (IMAP/SMTP/M365/Gmail), realtime (SignalR/WebSockets), AI-assistentie,
workflow-automatisering/SLA-escalaties, facturatie, multi-tenant, mobile apps. Dit zijn
losstaande vervolgtrajecten bovenop het huidige fundament.

## Lokaal draaien

### Vereisten
Node.js 20+, PostgreSQL (lokaal of via Docker)

### Backend
```bash
cd backend
cp .env.example .env   # pas DATABASE_URL/secrets aan indien nodig
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev             # http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev              # http://localhost:5173 (proxyt /api naar de backend)
```

### Met Docker Compose
```bash
docker compose up --build
# frontend: http://localhost:8080, backend: http://localhost:4000
```
Na de eerste start eenmalig seeden: `docker compose exec backend npm run prisma:seed`.

## Standaard inloggegevens (na seed)

| Rol | E-mail | Wachtwoord |
|---|---|---|
| Beheerder | admin@klantenportaal.nl | Admin123! |
| Medewerker | medewerker@klantenportaal.nl | Medewerker123! |
| Klant | klant@acme.nl | Klant123! |

**Wijzig deze wachtwoorden en JWT-secrets voordat je dit in productie gebruikt.**
