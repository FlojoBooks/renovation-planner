# 🏠 Verbouwingsplanner

Een professionele, interactieve tool voor het plannen van je verbouwing — gebouwd met React, TypeScript, Tailwind CSS en Zustand.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript) ![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss) ![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)

---

## ✨ Features

| Feature | Beschrijving |
|---|---|
| **📊 Gantt-chart** | Interactieve SVG Gantt met drag-and-drop, afhankelijkheden en Dag/Week/Maand zoom |
| **🗂️ Kanban-bord** | Taken per status (Te doen / In uitvoering / Geblokkeerd / Klaar) |
| **📋 Lijstweergave** | Tabeloverzicht per fase met voortgangsbalken en snel aanvinken |
| **💰 Budget** | KPI-kaarten, budget vs. werkelijk per fase, boodschappenlijst materialen |
| **📦 Materialen** | Materialen per taak met status (Nodig → Besteld → Geleverd → Gemonteerd) |
| **💬 Opmerkingen** | Notities per taak met tijdstempel, bewerken en verwijderen |
| **👥 Personen** | Meerdere personen per taak toewijzen (Ik, Partner, Aannemer, etc.) |
| **🔗 Afhankelijkheden** | Taak B start pas als Taak A klaar is — zichtbaar in Gantt |
| **💾 Lokale opslag** | Alle data wordt automatisch opgeslagen in localStorage |
| **🔍 Filters** | Filteren op status, prioriteit en toegewezen persoon |

---

## 🚀 Lokaal starten

### Vereisten
- Node.js 18+
- npm 9+

### Installatie

```bash
# 1. Ga naar de projectmap
cd renovation-planner

# 2. Installeer dependencies
npm install

# 3. Start de development server
npm run dev
```

De applicatie is nu beschikbaar op **http://localhost:3000**

### Overige commando's

```bash
npm run build      # Productie build
npm run preview    # Preview van de productie build
npm run lint       # ESLint check
```

---

## 🏗️ Projectstructuur

```
renovation-planner/
├── src/
│   ├── components/          # Gedeelde UI-componenten
│   │   ├── Sidebar.tsx      # Navigatie sidebar
│   │   ├── TopBar.tsx       # Bovenste balk met zoeken/filters
│   │   └── TaskModal.tsx    # Taak detail modal (slide-in panel)
│   ├── views/               # Hoofd weergaven
│   │   ├── GanttView.tsx    # SVG Gantt chart
│   │   ├── KanbanView.tsx   # Kanban bord
│   │   ├── ListView.tsx     # Lijst weergave
│   │   └── BudgetView.tsx   # Budget & materialen overzicht
│   ├── store/
│   │   └── useRenovationStore.ts   # Zustand global state
│   ├── types/
│   │   └── index.ts         # Alle TypeScript interfaces & types
│   ├── data/
│   │   └── seed.ts          # Demo-data (Badkamer, Isolatie, Elektra)
│   ├── utils/
│   │   └── index.ts         # Hulpfuncties, kleur-configs, formattering
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles + Tailwind
├── Dockerfile               # Multi-stage Docker build
├── nginx.conf               # Nginx SPA configuratie
└── vite.config.ts           # Vite + Tailwind configuratie
```

---

## 📦 Data Model

```
Project
├── Subprojects (Fases: Badkamer, Elektra, ...)
│   └── Tasks (met startdatum, einddatum, status, prioriteit)
│       ├── Assignees → Persons[]
│       ├── Dependencies → Task[] (afhankelijkheden)
│       ├── Materials[] (naam, aantal, prijs, status, leverancier)
│       └── Comments[] (auteur, tekst, tijdstempel)
└── BudgetLines[] (begroot vs. werkelijk, per fase & categorie)
```

---

## 🚂 Deploy naar Railway

### Optie 1: Automatisch via GitHub (aanbevolen)

1. **Push naar GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Verbouwingsplanner"
   git remote add origin https://github.com/jouw-username/renovation-planner.git
   git push -u origin main
   ```

2. **Railway project aanmaken:**
   - Ga naar [railway.app](https://railway.app) en log in
   - Klik **"New Project"** → **"Deploy from GitHub repo"**
   - Selecteer je repository

3. **Railway detecteert automatisch** het `Dockerfile` en bouwt de image
   - Build time: ~2-3 minuten
   - De app is beschikbaar op een Railway-domein: `your-app.up.railway.app`

4. **Eigen domein instellen (optioneel):**
   - Ga naar **Settings → Domains**
   - Voeg je eigen domein toe en configureer DNS

### Optie 2: Via Railway CLI

```bash
# Installeer Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy vanuit de projectmap
cd renovation-planner
railway init
railway up
```

### Environment Variables

Deze applicatie slaat data op in **localStorage** — er zijn **geen environment variables nodig** voor de basis setup.

Wil je in de toekomst een backend toevoegen (bijv. Supabase), stel dan in Railway in:

| Variable | Voorbeeld | Beschrijving |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://xyz.supabase.co` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Supabase public anon key |

Railway environment variables stel je in via:
**Project → Settings → Variables → Add Variable**

### Dockerfile uitleg

```dockerfile
# Stage 1: Build (Node 20 Alpine)
FROM node:20-alpine AS builder
RUN npm ci && npm run build

# Stage 2: Serve (Nginx Alpine)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

- **Multi-stage build** — de uiteindelijke image bevat alleen nginx + statische bestanden
- **Grootte:** ~25MB (vs. ~500MB met Node)
- **SPA routing:** nginx.conf stuurt alle routes door naar `index.html`

---

## 🔮 Toekomstige uitbreidingen

### Multi-user samenwerking
Voor echte multi-user functionaliteit voeg je een backend toe:

**Optie A: Supabase (aanbevolen voor snelle setup)**
```bash
npm install @supabase/supabase-js
```
- Real-time updates via Supabase Realtime
- Authenticatie via Supabase Auth
- PostgreSQL database

**Optie B: Node.js + Express + PostgreSQL op Railway**
```bash
# Voeg toe aan Railway project:
# - Railway PostgreSQL service
# - Node.js API service
```

### Bestandsuploads (foto's bij taken)
- Gebruik Supabase Storage of Cloudflare R2
- Voeg `attachment` upload toe aan het Comment component

---

## 🛠️ Tech Stack

| Package | Versie | Doel |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 6 | Build tool + dev server |
| Tailwind CSS | 4 | Utility-first styling |
| Zustand | 5 | State management |
| date-fns | 4 | Datum utilities |
| Lucide React | latest | Icons |
| Nginx | Alpine | Productie webserver |

---

*Gebouwd met ❤️ voor een stressvrije verbouwing.*
