# Mini Centralizator API Podataka

## 📖 Opis Projekta

Ovo je **full-stack aplikacija** koja demonstrira osnovne koncepte modernog web razvoja. Projekt se sastoji od dva glavna dijela:

### Backend (Node.js + Express.js)
Backend server koji:
- Dohvaća podatke (u ovom slučaju mock podatke za hrvatske trgovačke lance)
- Validira i čisti podatke
- Obrađuje podatke (sortiranje, formatiranje)
- Sprema podatke lokalno u **JSON** i **CSV** format
- Nudi RESTful API endpointe za frontend
- Podržava filtriranje podataka po različitim kriterijima

### Frontend (Angular)
Moderna web aplikacija koja:
- Komunicira s backend API-jem
- Prikazuje podatke u preglednoj tablici
- Omogućava filtriranje podataka u realnom vremenu
- Nudi jednostavno i intuitivno korisničko sučelje
- Responzivna je i radi na svim uređajima

### Tehnološki Stack
- **Backend**: Node.js, Express.js, CORS
- **Frontend**: Angular 17 (standalone components), TypeScript, RxJS
- **Spremište**: Lokalni JSON i CSV fileovi

---

## 🚀 Brzi Start - Kako Pokrenuti Projekt

### Korak 1: Provjera Preduvjeta
Osigurajte da imate instaliran:
- **Node.js** (v18+): Preuzmite s [nodejs.org](https://nodejs.org/)
- **npm** dolazi automatski s Node.js

Provjerite instalaciju:
```bash
node --version  # Trebalo bi biti v18 ili više
npm --version   # Bilo koja verzija
```

### Korak 2: Pokretanje Backend Servera

Otvorite terminal i izvršite:

```bash
# 1. Navigirajte u backend direktorij
cd backend

# 2. Instalirajte sve potrebne pakete
npm install

# 3. Pokrenite server
npm start
```

✅ Server je pokrenut kada vidite poruku:
```
Server pokrenut na http://localhost:3000
Healthcheck: http://localhost:3000/api/health
```

### Korak 3: Pokretanje Frontend Aplikacije

**Otvorite NOVI terminal** (ostavite backend da radi) i izvršite:

```bash
# 1. Navigirajte u frontend direktorij
cd frontend

# 2. Instalirajte sve potrebne pakete
npm install

# 3. Pokrenite Angular aplikaciju
npm start
```

✅ Frontend je pokrenut kada vidite:
```
** Angular Live Development Server is listening on localhost:4200 **
```

### Korak 4: Korištenje Aplikacije

1. Otvorite web preglednik i idite na: **http://localhost:4200**
2. Kliknite gumb **"Dohvati Podatke"** - backend će generirati mock podatke i spremiti ih
3. Podaci će se automatski prikazati u tablici
4. Koristite **filtere** za pretragu po nazivu ili gradu
5. Kliknite **"Prikaži Podatke"** za ponovno učitavanje spremljenih podataka

---

## 📁 Struktura Projekta

```
Skriptni---projekt/
├── backend/              # Node.js + Express server
│   ├── data/            # Lokalno spremište (JSON/CSV)
│   ├── services/        # Logika za obradu podataka
│   │   └── dataService.js
│   ├── server.js        # Glavni Express server
│   ├── package.json
│   └── .gitignore
├── frontend/            # Angular aplikacija
│   ├── src/
│   │   ├── app/
│   │   │   ├── services/
│   │   │   │   └── data.service.ts
│   │   │   ├── app.component.ts
│   │   │   ├── app.component.html
│   │   │   └── app.component.css
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.css
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
├── primjeri/            # Primjeri JSON/CSV formata
│   ├── data.json
│   └── data.csv
└── README.md
```

## 🚀 Funkcionalnosti

### Backend (Node.js + Express)
- ✅ Dohvaćanje mock podataka (simulacija vanjskog API-ja)
- ✅ Validacija i obrada podataka
- ✅ Spremanje u JSON i CSV format
- ✅ RESTful API endpointi
- ✅ Filtriranje podataka po nazivu i gradu
- ✅ CORS podrška za frontend komunikaciju

### Frontend (Angular)
- ✅ Jednostavno korisničko sučelje
- ✅ Gumb za dohvaćanje podataka s backend API-ja
- ✅ Tablica za prikaz podataka
- ✅ Filtriranje po nazivu i gradu
- ✅ Responzivni dizajn
- ✅ Obrada greške i učitavanja stanja

## 📋 Preduvjeti

Prije pokretanja projekta, instalirajte:
- **Node.js** (v18 ili noviji) - [Download](https://nodejs.org/)
- **npm** (dolazi s Node.js)

## 🔧 Instalacija

### 1. Backend Setup

```bash
# Navigirajte u backend direktorij
cd backend

# Instalirajte dependencies
npm install

# Pokreni server
npm start
```

Server će biti pokrenut na: **http://localhost:3000**

**Backend API Endpointi:**
- `GET /api/health` - Healthcheck
- `GET /api/fetch-data` - Dohvaća i obrađuje podatke, sprema ih lokalno
- `GET /api/data` - Vraća spremljene podatke
- `GET /api/data?naziv=Lidl` - Filtrira podatke po nazivu
- `GET /api/data?grad=Zagreb` - Filtrira podatke po gradu

### 2. Frontend Setup

**U novom terminalu:**

```bash
# Navigirajte u frontend direktorij
cd frontend

# Instalirajte dependencies
npm install

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

Možete testirati backend direktno:

```bash
# Healthcheck
curl http://localhost:3000/api/health

# Dohvati i spremi podatke
curl http://localhost:3000/api/fetch-data

# Prikaži sve podatke
curl http://localhost:3000/api/data

# Filtriraj po nazivu
curl "http://localhost:3000/api/data?naziv=Lidl"

# Filtriraj po gradu
curl "http://localhost:3000/api/data?grad=Zagreb"
```

## 🎯 Razvoj

### Backend Development Mode
```bash
cd backend
npm install -g nodemon  # Za auto-restart
npm run dev
```

### Frontend Development Mode
```bash
cd frontend
npm start  # Auto-refresh na promjene
```

## 📦 Production Build

### Frontend Build
```bash
cd frontend
npm run build
# Build se nalazi u frontend/dist/
```

## 🐛 Troubleshooting

**Problem:** Backend ne radi
- Provjerite je li port 3000 slobodan
- Provjerite `node --version` (treba biti v18+)

**Problem:** Frontend ne može dohvatiti podatke
- Provjerite je li backend pokrenut na port 3000
- Provjerite konzolu preglednika za CORS greške

**Problem:** Angular servira grešku
- Očistite cache: `rm -rf frontend/node_modules frontend/.angular`
- Reinstalirajte: `cd frontend && npm install`

## 👤 Autor

Ian

## 📅 Datum

Prosinac 2025

---

**Napomena:** Ovo je edukativni projekt koji demonstrira osnovne koncepte full-stack razvoja.
