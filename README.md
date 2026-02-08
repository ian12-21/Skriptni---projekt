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

### Korak 1: Pokretanje Backend Servera

```bash
cd backend
npm install
npm start
```

### Korak 2: Pokretanje Frontend Aplikacije

**U novom terminalu:**

```bash
cd frontend
npm install
npm start
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

### CSV Format (`backend/data/data.csv`)
```csv
id,naziv,grad,kategorija,cijena,datum
1,Konzum,Zagreb,Trgovina,150.5,2025-12-06T10:30:00.000Z
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

**Napomena:** Ovo je edukativni projekt koji demonstrira napredne koncepte full-stack razvoja:
- Asinkrono I/O programiranje
- Error handling i retry mehanizmi
- Dnevna rotacija datoteka
- RESTful API dizajn
- Reactive programming (RxJS)
- Moderne Angular standalone komponente

