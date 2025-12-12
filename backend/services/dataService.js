const fs = require('fs');
const path = require('path');

// Konfiguracija
const CONFIG = {
  TIMEOUT: 5000,          // 5 sekundi timeout
  MAX_RETRIES: 3,         // Max broj pokušaja
  RETRY_DELAY: 1000,      // Početna pauza prije retry-a (ms)
  BACKOFF_MULTIPLIER: 2   // Eksponencijalni backoff
};

// Logger
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logMessage);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Generiranje random cijene za simulaciju promjena
function getRandomPrice(base, variance = 20) {
  return parseFloat((base + (Math.random() - 0.5) * variance).toFixed(2));
}

// Mock podaci - simulacija dohvaćanja iz vanjskog API-ja s timeout i retry
async function fetchMockData() {
  return new Promise((resolve, reject) => {
    // Simulacija network delay
    const delay = Math.random() * 1000;
    
    setTimeout(() => {
      // Simulacija različitih cijena pri svakom dohvatu
      const data = [
        { id: 1, naziv: 'Konzum', grad: 'Zagreb', kategorija: 'Trgovina', cijena: getRandomPrice(150) },
        { id: 2, naziv: 'Plodine', grad: 'Split', kategorija: 'Trgovina', cijena: getRandomPrice(200) },
        { id: 3, naziv: 'Pevec', grad: 'Varaždin', kategorija: 'Trgovina', cijena: getRandomPrice(180) },
        { id: 4, naziv: 'Tommy', grad: 'Rijeka', kategorija: 'Trgovina', cijena: getRandomPrice(175) },
        { id: 5, naziv: 'Lidl', grad: 'Zagreb', kategorija: 'Trgovina', cijena: getRandomPrice(120) },
        { id: 6, naziv: 'Kaufland', grad: 'Osijek', kategorija: 'Trgovina', cijena: getRandomPrice(190) },
        { id: 7, naziv: 'Spar', grad: 'Zagreb', kategorija: 'Trgovina', cijena: getRandomPrice(165) },
        { id: 8, naziv: 'Studenac', grad: 'Split', kategorija: 'Trgovina', cijena: getRandomPrice(95) },
        { id: 9, naziv: 'Billa', grad: 'Zagreb', kategorija: 'Trgovina', cijena: getRandomPrice(155) },
        { id: 10, naziv: 'Interex', grad: 'Pula', kategorija: 'Trgovina', cijena: getRandomPrice(210) },
      ];
      resolve(data);
    }, delay);
  });
}

// Fetch s timeout-om
async function fetchWithTimeout(fetchFn, timeout = CONFIG.TIMEOUT) {
  return Promise.race([
    fetchFn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}

// Fetch s retry i exponential backoff
async function fetchWithRetry(retries = CONFIG.MAX_RETRIES) {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      log('info', `Pokušaj dohvaćanja podataka (${attempt}/${retries})`);
      const data = await fetchWithTimeout(fetchMockData);
      log('info', `Uspješno dohvaćeno ${data.length} zapisa`);
      return data;
    } catch (error) {
      lastError = error;
      log('warn', `Neuspješan pokušaj ${attempt}/${retries}: ${error.message}`);
      
      if (attempt < retries) {
        const delay = CONFIG.RETRY_DELAY * Math.pow(CONFIG.BACKOFF_MULTIPLIER, attempt - 1);
        log('info', `Čekam ${delay}ms prije sljedećeg pokušaja...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  log('error', 'Svi pokušaji dohvaćanja podataka su neuspješni', { error: lastError.message });
  throw lastError;
}

// Validacija i obrada podataka
function processData(data) {
  return data
    .filter(item => {
      // Validacija: provjerava postoje li sva potrebna polja
      return item.id && 
             item.naziv && 
             item.grad && 
             item.kategorija && 
             typeof item.cijena === 'number';
    })
    .map(item => {
      // Obrada: čisti i formatira podatke
      return {
        id: item.id,
        naziv: item.naziv.trim(),
        grad: item.grad.trim(),
        kategorija: item.kategorija.trim(),
        cijena: parseFloat(item.cijena.toFixed(2)),
        datum: new Date().toISOString()
      };
    })
    .sort((a, b) => a.naziv.localeCompare(b.naziv)); // Sortira po nazivu
}

// Generiranje naziva datoteke s datumom (YYYY-MM-DD)
function getDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

// Spremanje podataka u JSON s dnevnom rotacijom
function saveAsJSON(data, date = new Date()) {
  const dateStr = getDateString(date);
  const fileName = `data-${dateStr}.json`;
  const filePath = path.join(__dirname, '../data', fileName);
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  log('info', `JSON spremljen: ${fileName}`, { records: data.length });
  
  // Spremanje i u data.json za backward compatibility
  const latestPath = path.join(__dirname, '../data/data.json');
  fs.writeFileSync(latestPath, JSON.stringify(data, null, 2), 'utf8');
  
  return fileName;
}

// Spremanje podataka u CSV s dnevnom rotacijom
function saveAsCSV(data, date = new Date()) {
  if (data.length === 0) return null;
  
  const dateStr = getDateString(date);
  const fileName = `data-${dateStr}.csv`;
  const filePath = path.join(__dirname, '../data', fileName);
  
  // Zaglavlje CSV-a
  const headers = Object.keys(data[0]).join(',');
  
  // Redovi CSV-a
  const rows = data.map(item => 
    Object.values(item).map(val => 
      typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    ).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  
  fs.writeFileSync(filePath, csv, 'utf8');
  log('info', `CSV spremljen: ${fileName}`, { records: data.length });
  
  // Spremanje i u data.csv za backward compatibility
  const latestPath = path.join(__dirname, '../data/data.csv');
  fs.writeFileSync(latestPath, csv, 'utf8');
  
  return fileName;
}

// Dohvaćanje svih dostupnih datuma iz data direktorija
function getAvailableDates() {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) return [];
  
  const files = fs.readdirSync(dataDir);
  const dates = files
    .filter(file => file.match(/^data-\d{4}-\d{2}-\d{2}\.json$/))
    .map(file => file.match(/data-(\d{4}-\d{2}-\d{2})\.json/)[1])
    .sort()
    .reverse();
  
  return dates;
}

// Učitavanje podataka za određeni datum
function loadDataByDate(dateStr) {
  const fileName = `data-${dateStr}.json`;
  const filePath = path.join(__dirname, '../data', fileName);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return data;
}

// Učitavanje podataka za raspon datuma
function loadDataByRange(startDate, endDate) {
  const dates = getAvailableDates();
  const filteredDates = dates.filter(date => date >= startDate && date <= endDate);
  
  const allData = [];
  for (const date of filteredDates) {
    const data = loadDataByDate(date);
    if (data) {
      allData.push(...data.map(item => ({ ...item, fetchDate: date })));
    }
  }
  
  return allData;
}

// Računanje statistika
function calculateStats(data) {
  if (!data || data.length === 0) {
    return {
      totalRecords: 0,
      avgCijena: 0,
      minCijena: 0,
      maxCijena: 0,
      uniqueGradovi: 0,
      uniqueNazivi: 0
    };
  }
  
  const cijene = data.map(item => item.cijena);
  const gradovi = new Set(data.map(item => item.grad));
  const nazivi = new Set(data.map(item => item.naziv));
  
  return {
    totalRecords: data.length,
    avgCijena: parseFloat((cijene.reduce((a, b) => a + b, 0) / cijene.length).toFixed(2)),
    minCijena: Math.min(...cijene),
    maxCijena: Math.max(...cijene),
    uniqueGradovi: gradovi.size,
    uniqueNazivi: nazivi.size,
    gradovi: Array.from(gradovi).sort(),
    nazivi: Array.from(nazivi).sort()
  };
}

module.exports = {
  fetchWithRetry,
  processData,
  saveAsJSON,
  saveAsCSV,
  getAvailableDates,
  loadDataByDate,
  loadDataByRange,
  calculateStats,
  getDateString,
  log
};
