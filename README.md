# Mini Centralizator API Podataka

## 📖 Opis Projekta

**Napredni sustav** za periodičko dohvaćanje, validaciju, obradu i prikaz podataka s dnevnom rotacijom datoteka i web sučeljem.

### Ključne Značajke

#### 🔄 Harvester (Automatsko Dohvaćanje)
- **Periodičko dohvaćanje** podataka (konfigurirano svakih 5 minuta za demo, može se postaviti na 24h)
- **Retry mehanizam** s eksponencijalnim backoff-om (3 pokušaja)
- **Timeout zaštita** (5 sekundi)
- **Strukturirano logiranje** svih operacija
- Automatski start pri pokretanju servera
- Mogućnost ručnog pokretanja kroz API

#### 💾 Dnevna Rotacija Datoteka
- Spremanje podataka u **JSON** i **CSV** format
- Automatsko imenovanje datoteka s datumom: `data-YYYY-MM-DD.json`
- Zadržavanje povijesnih zapisa
- Podrška za pretraživanje po datumskom rasponu

#### 🌐 Napredni REST API
- `GET /api/health` - Status servera i harvestera
- `GET /api/latest` - Najnoviji podaci (s filterima)
- `GET /api/range` - Podaci za raspon datuma
- `GET /api/stats` - Statistike i agregati
- `POST /api/harvest` - Ručno pokretanje harvestera
- `GET /api/dates` - Lista dostupnih datuma

#### 📊 Angular Frontend
- **Real-time prikaz** harvester statusa
- **Statistike**: prosjek, min/max cijene, broj gradova
- **Filtriranje** po nazivu i gradu
- **CSV export** direktno iz preglednika
- **Responzivni dizajn** s modernim UI
- Automatsko osvježavanje statusa

### Arhitektura i Metodologija

**Backend arhitektura:**
- `harvester.js` - Periodičko dohvaćanje s retry logikom
- `dataService.js` - Validacija, obrada, spremanje
- `server.js` - Express API rute i middleware

**Validacija i robusnost:**
- Shema validacija svih podataka
- Error handling na svim razinama
- Graceful shutdown s čišćenjem resursa
- Structured logging svih operacija

**Frontend arhitektura:**
- Standalone Angular komponente
- Reactive programming (RxJS)
- Service layer za API komunikaciju
- Separation of concerns

### Tehnološki Stack
- **Backend**: Node.js, Express.js, CORS
- **Frontend**: Angular 17 (standalone), TypeScript, RxJS
- **Spremište**: Lokalni JSON/CSV s dnevnom rotacijom
- **Dev Tools**: Nodemon, Angular CLI

---

## 🚀 Brzi Start - Kako Pokrenuti Projekt

### Korak 1: Provjera Preduvjeta
```bash
node --version  # v18 ili više
npm --version   # bilo koja verzija
```

### Korak 2: Pokretanje Backend Servera

```bash
cd backend
npm install
npm start
```

✅ **Server je pokrenut!** Harvester automatski počinje dohvaćati podatke.

```
[INFO] Pokretanje periodičnog harvestera (interval: 300s)
[INFO] Server pokrenut na http://localhost:3000
```

### Korak 3: Pokretanje Frontend Aplikacije

**U novom terminalu:**

```bash
cd frontend
npm install
npm start
```

✅ **Frontend je aktivan!** Otvori: **http://localhost:4200**

### Korak 4: Korištenje Aplikacije

1. **Harvester radi automatski** - podaci se dohvaćaju periodički
2. **Ručno dohvaćanje**: Klik na "🔄 Ručno Dohvaćanje"
3. **Statistike**: Klik na "📈 Prikaži Statistike"
4. **Filtriranje**: Unesi naziv ili grad i pritisni Enter
5. **Export**: Klik na "💾 Export CSV" za preuzimanje

---

## 📁 Struktura Projekta

```
Skriptni---projekt/
├── backend/
│   ├── data/                    # Automatski generirani lokalni fileovi
│   │   ├── data-2025-12-06.json # Dnevni JSON zapisi
│   │   ├── data-2025-12-06.csv  # Dnevni CSV zapisi
│   │   ├── data.json            # Latest (symlink)
│   │   └── data.csv             # Latest (symlink)
│   ├── services/
│   │   ├── dataService.js       # Validacija, obrada, spremanje
│   │   └── harvester.js         # Periodičko dohvaćanje
│   ├── server.js                # Express API server
│   ├── package.json
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── services/
│   │   │   │   └── data.service.ts  # API klijent
│   │   │   ├── app.component.ts     # Glavna komponenta
│   │   │   ├── app.component.html   # Template
│   │   │   └── app.component.css    # Stilovi
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.css
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
├── primjeri/
│   ├── data.json
│   └── data.csv
└── README.md
```

## 🎯 Detaljne Funkcionalnosti

### 🔄 Harvester Sustav
- **Automatski start** pri pokretanju servera
- **Konfigurirani interval**: 5 minuta (demo), lako podesivo na 24h
- **Retry mehanizam**: 3 pokušaja s eksponencijalnim backoff-om (1s, 2s, 4s)
- **Timeout**: 5 sekundi po pokušaju
- **Graceful shutdown**: Čišćenje resursa pri SIGINT/SIGTERM
- **Status tracking**: Zadnje izvršenje, sljedeće zakazano vrijeme

### 💾 Dnevna Rotacija
- **Format**: `data-YYYY-MM-DD.json` i `data-YYYY-MM-DD.csv`
- **Automatsko** imenovanje po trenutnom datumu
- **Backward compatibility**: Zadržava `data.json` i `data.csv`
- **Povijesni zapisi**: Sve datoteke se čuvaju
- **Pretraživanje**: API podrška za datumske raspone

### 🌐 REST API Endpoints

| Endpoint | Method | Opis | Parametri |
|----------|--------|------|-----------|
| `/api/health` | GET | Status servera i harvestera | - |
| `/api/latest` | GET | Najnoviji podaci | `?naziv=...&grad=...` |
| `/api/range` | GET | Podaci za raspon | `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` |
| `/api/stats` | GET | Statistike i agregati | `?date=YYYY-MM-DD` (optional) |
| `/api/harvest` | POST | Ručno pokretanje | - |
| `/api/dates` | GET | Lista dostupnih datuma | - |

**Legacy endpoints (kompatibilnost):**
- `GET /api/fetch-data` - Stari način ručnog dohvaćanja
- `GET /api/data` - Stari način dohvata s filterima

### 📊 Frontend Mogućnosti
- ✅ **Real-time status** harvestera (refresh svakih 30s)
- ✅ **Statistike dashboard**: 6 ključnih metrika
- ✅ **Filtriranje**: Po nazivu i gradu (live search)
- ✅ **CSV Export**: Download podataka u CSV format
- ✅ **Responzivni dizajn**: Mobile-first pristup
- ✅ **Error handling**: Jasne poruke grešaka
- ✅ **Loading states**: Visual feedback pri učitavanju

### 📈 Statistike (Stats API)
```json
{
  "totalRecords": 10,
  "avgCijena": 167.30,
  "minCijena": 95.25,
  "maxCijena": 210.00,
  "uniqueGradovi": 6,
  "uniqueNazivi": 10,
  "gradovi": ["Zagreb", "Split", "Osijek", ...],
  "nazivi": ["Konzum", "Lidl", ...]
}
```

---
# Pokreni Angular development server
npm start
```

Aplikacija će biti pokrenuta na: **http://localhost:4200**

## 📖 Kako Koristiti

1. **Pokrenite Backend** (port 3000)
2. **Pokrenite Frontend** (port 4200)
3. Otvorite preglednik na **http://localhost:4200**
4. Kliknite **"Dohvati Podatke"** - dohvaća podatke s backenда i sprema ih u `backend/data/`
5. Kliknite **"Prikaži Podatke"** - učitava spremljene podatke
6. Koristite **filtere** za pretragu po nazivu ili gradu
7. Kliknite **"Očisti Filtere"** za reset

## 📄 Format Podataka

### JSON Format (`backend/data/data.json`)
```json
[
  {
    "id": 1,
    "naziv": "Konzum",
    "grad": "Zagreb",
    "kategorija": "Trgovina",
    "cijena": 150.50,
    "datum": "2025-12-06T10:30:00.000Z"
  }
]
```

### CSV Format (`backend/data/data.csv`)
```csv
id,naziv,grad,kategorija,cijena,datum
1,Konzum,Zagreb,Trgovina,150.5,2025-12-06T10:30:00.000Z
```

## 🛠️ Tehnologije

**Backend:**
- Node.js
- Express.js
- CORS
- Axios (za buduće eksterne API pozive)

**Frontend:**
- Angular 17 (standalone components)
- TypeScript
- RxJS
- HttpClient

## 📝 Mock Podaci

Backend koristi mock podatke za hrvatske trgovačke lance:
- Konzum, Plodine, Pevec, Tommy
- Lidl, Kaufland, Spar, Studenac
- Billa, Interex

## 🔍 Testiranje API-ja

### cURL primjeri

```bash
# 1. Health check (status servera i harvestera)
curl http://localhost:3000/api/health

# 2. Ručno pokretanje harvestera
curl -X POST http://localhost:3000/api/harvest

# 3. Najnoviji podaci
curl http://localhost:3000/api/latest

# 4. Filtriranje po nazivu
curl "http://localhost:3000/api/latest?naziv=Lidl"

# 5. Filtriranje po gradu
curl "http://localhost:3000/api/latest?grad=Zagreb"

# 6. Statistike
curl http://localhost:3000/api/stats

# 7. Podaci za raspon datuma
curl "http://localhost:3000/api/range?startDate=2025-12-01&endDate=2025-12-06"

# 8. Lista dostupnih datuma
curl http://localhost:3000/api/dates
```

### Odgovor primjeri

**Health Check:**
```json
{
  "status": "OK",
  "uptime": 1234.56,
  "harvester": {
    "running": true,
    "interval": 300000,
    "lastRun": "2025-12-06T10:30:00.000Z",
    "nextRun": "2025-12-06T10:35:00.000Z"
  }
}
```

**Statistics:**
```json
{
  "success": true,
  "stats": {
    "totalRecords": 10,
    "avgCijena": 167.30,
    "minCijena": 95.25,
    "maxCijena": 210.00,
    "uniqueGradovi": 6,
    "uniqueNazivi": 10,
    "gradovi": ["Zagreb", "Split", "Osijek", "Rijeka", "Varaždin", "Pula"],
    "nazivi": ["Billa", "Interex", "Kaufland", ...]
  },
  "availableDates": ["2025-12-06", "2025-12-05", ...]
}
```

---

## ⚙️ Konfiguracija

### Harvester Interval

Za promjenu intervala dohvaćanja, uredi `backend/services/harvester.js`:

```javascript
// Za demo (5 minuta)
const HARVEST_INTERVAL = 5 * 60 * 1000;

// Za produkciju (svaki dan)
const HARVEST_INTERVAL = 24 * 60 * 60 * 1000;
```

### Timeout i Retry

U `backend/services/dataService.js`:

```javascript
const CONFIG = {
  TIMEOUT: 5000,          // 5 sekundi
  MAX_RETRIES: 3,         // 3 pokušaja
  RETRY_DELAY: 1000,      // 1 sekunda početna pauza
  BACKOFF_MULTIPLIER: 2   // Eksponencijalni rast
};
```

---

## 🎯 Razvoj

### Backend Development Mode
```bash
cd backend
npm install -g nodemon  # Za auto-restart
npm run dev             # Watch mode
```

### Frontend Development Mode
```bash
cd frontend
npm start  # Live reload na promjene
```

### Pregled Logova

Backend logira sve operacije:
```
[2025-12-06T10:30:00.000Z] [INFO] === Pokretanje harvestera ===
[2025-12-06T10:30:00.123Z] [INFO] Pokušaj dohvaćanja podataka (1/3)
[2025-12-06T10:30:00.456Z] [INFO] Uspješno dohvaćeno 10 zapisa
[2025-12-06T10:30:00.789Z] [INFO] JSON spremljen: data-2025-12-06.json
[2025-12-06T10:30:01.012Z] [INFO] CSV spremljen: data-2025-12-06.csv
[2025-12-06T10:30:01.234Z] [INFO] === Harvester završio uspješno ===
```

---

## 🚨 Rizici i Mitigacija

### Identificirani Rizici

1. **Nestabilnost vanjskih API-ja**
   - **Mitigacija**: Timeout (5s), retry s backoff-om, fallback na cached podatke
   
2. **Rate limiting**
   - **Mitigacija**: Konfigurirani intervali, exponential backoff
   
3. **Rast volumena podataka**
   - **Mitigacija**: Dnevna rotacija, moguće dodati čišćenje starih datoteka
   
4. **Performanse pri velikim rasponima**
   - **Mitigacija**: Implementacija straničenja, agregacije na serveru

### Ograničenja

- **Nema baze podataka**: Namjerno koristi lokalne fileove za jednostavnost
- **Nema autentikacije**: Edukativni projekt, ne za produkciju
- **Mock podaci**: Koristi simulirane podatke umjesto vanjskih API-ja
- **Skalabilnost**: Ograničena na jedan server bez load balancinga

---

## 📦 Production Build

### Frontend Build
```bash
cd frontend
npm run build
# Output: frontend/dist/mini-centralizator-frontend/
```

### Deployment Opcije

**Staticko hostanje** (frontend):
- Vercel, Netlify, GitHub Pages
- Samo deployaj `dist/` folder

**Backend hosting**:
- Heroku, Railway, Render
- Postaviti environment variables ako trebaju

---

## 🐛 Troubleshooting

**Problem:** Harvester ne radi
- Provjeri logove u terminalu
- Provjeri `http://localhost:3000/api/health`

**Problem:** Backend ne radi
- Provjeri je li port 3000 slobodan: `lsof -i :3000`
- Provjeri Node.js verziju: `node --version` (v18+)

**Problem:** Frontend ne može dohvatiti podatke
- Provjeri je li backend pokrenut
- Provjeri browser console za CORS greške
- Provjeri URL u `data.service.ts`

**Problem:** Angular build greška
- Očisti cache: `rm -rf frontend/node_modules frontend/.angular`
- Reinstaliraj: `cd frontend && npm install`

**Problem:** CSV export ne radi
- Provjeri browser konzolu
- Možda je blokiran download, dozvoli u browseru

---

## 📚 Dodatni Resursi

- [Node.js dokumentacija](https://nodejs.org/docs)
- [Express.js guide](https://expressjs.com/en/guide/routing.html)
- [Angular dokumentacija](https://angular.io/docs)
- [RxJS operators](https://rxjs.dev/guide/operators)

---

## 👤 Autor

Ian

## 📅 Datum

Prosinac 2025

---

**Napomena:** Ovo je edukativni projekt koji demonstrira napredne koncepte full-stack razvoja:
- Asinkrono I/O programiranje
- Error handling i retry mehanizmi
- Dnevna rotacija datoteka
- RESTful API dizajn
- Reactive programming (RxJS)
- Moderne Angular standalone komponente

