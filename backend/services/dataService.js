const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');

// Konfiguracija
const CONFIG = {
  API_URL: 'https://api.cijene.dev/v0/list',
  TIMEOUT: 120000,        // 120 sekundi timeout (ZIP-ovi su veliki ~80MB)
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  BACKOFF_MULTIPLIER: 2
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

// Dohvaćanje popisa dostupnih arhiva s API-ja
async function fetchArchiveList() {
  try {
    log('info', `Dohvaćanje popisa arhiva: ${CONFIG.API_URL}`);
    const response = await axios.get(CONFIG.API_URL, {
      timeout: CONFIG.TIMEOUT
    });
    
    const archives = response.data.archives || [];
    log('info', `Pronađeno ${archives.length} arhiva`);
    return archives;
  } catch (error) {
    log('error', 'Greška pri dohvaćanju popisa arhiva', { error: error.message });
    throw error;
  }
}

// Dohvaćanje ZIP arhive - koristi URL iz API odgovora
async function downloadArchive(archiveUrl) {
  log('info', `Preuzimanje arhive: ${archiveUrl}`);
  
  try {
    const response = await axios.get(archiveUrl, {
      responseType: 'arraybuffer',
      timeout: CONFIG.TIMEOUT,
      maxContentLength: 200 * 1024 * 1024, // max 200MB
      maxBodyLength: 200 * 1024 * 1024
    });
    
    log('info', `Arhiva preuzeta: ${(response.data.length / 1024 / 1024).toFixed(2)} MB`);
    return Buffer.from(response.data);
  } catch (error) {
    log('error', `Greška pri preuzimanju arhive`, { 
      error: error.message,
      url: archiveUrl,
      status: error.response?.status
    });
    throw error;
  }
}

// Parsiranje CSV sadržaja
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }
  
  return data;
}

// Parsiranje jedne CSV linije (podržava navodnike)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Ekstrakcija i obrada podataka iz ZIP arhive - OPTIMIZIRANO ZA MEMORIJU
async function extractAndProcessArchive(zipBuffer, trgovinaFilter = null) {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  
  const allData = {
    stores: [],
    products: [],
    prices: [],
    combined: []
  };
  
  // Pronađi sve trgovine u ZIP-u
  const trgovineSet = new Set();
  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const pathParts = entry.entryName.split('/');
    if (pathParts.length >= 2) {
      trgovineSet.add(pathParts[0]);
    }
  }
  
  const trgovine = Array.from(trgovineSet);
  log('info', `Pronađeno ${trgovine.length} trgovina u arhivi`);
  log('info', `Aktivne trgovine za obradu: ${ACTIVE_STORES.join(', ')}`);
  
  // Obradi svaku trgovinu zasebno da smanjimo memory footprint
  for (const trgovina of trgovine) {
    // Preskoči ako nije tražena trgovina
    if (trgovinaFilter && trgovina.toLowerCase() !== trgovinaFilter.toLowerCase()) {
      continue;
    }
    
    // Preskoči ako nije u listi aktivnih trgovina
    if (!ACTIVE_STORES.includes(trgovina.toLowerCase())) {
      continue;
    }
    
    log('info', `Obrađujem trgovinu: ${trgovina}`);
    
    let stores = [];
    let products = [];
    let prices = [];
    
    // Učitaj samo datoteke za ovu trgovinu
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      
      const pathParts = entry.entryName.split('/');
      if (pathParts.length < 2 || pathParts[0] !== trgovina) continue;
      
      const fileName = pathParts[pathParts.length - 1];
      const content = entry.getData().toString('utf8');
      
      if (fileName === 'stores.csv') {
        stores = parseCSV(content);
      } else if (fileName === 'products.csv') {
        products = parseCSV(content);
      } else if (fileName === 'prices.csv') {
        prices = parseCSV(content);
      }
    }
    
    // Kreiraj mape za brzi pristup
    const productMap = new Map();
    for (const product of products) {
      productMap.set(product.product_id, product);
    }
    
    const storeMap = new Map();
    for (const store of stores) {
      storeMap.set(store.store_id, store);
    }
    
    // Uzmi samo uzorak cijena ako ih ima previše (za smanjenje memorije)
    // Uzimamo samo jednu cijenu po proizvodu (prvu poslovnicu)
    const seenProducts = new Set();
    
    for (const price of prices) {
      // Preskoči ako smo već vidjeli ovaj proizvod (uzmi samo jednu cijenu po proizvodu)
      if (seenProducts.has(price.product_id)) continue;
      seenProducts.add(price.product_id);
      
      const product = productMap.get(price.product_id);
      const store = storeMap.get(price.store_id);
      
      if (product) {
        allData.combined.push({
          id: `${trgovina}-${price.product_id}`,
          naziv: product.name || 'N/A',
          trgovina: trgovina,
          kategorija: product.category || 'Ostalo',
          brand: product.brand || '',
          barcode: product.barcode || '',
          jedinica: product.unit || '',
          kolicina: product.quantity || '',
          cijena: parseFloat(price.price) || 0,
          cijena_jedinicna: price.unit_price ? parseFloat(price.unit_price) : null,
          najbolja_cijena_30: price.best_price_30 ? parseFloat(price.best_price_30) : null,
          anchor_cijena: price.anchor_price ? parseFloat(price.anchor_price) : null,
          poslovnica: store ? `${store.address}, ${store.city}` : null,
          tip_poslovnice: store ? store.type : null,
          grad: store ? store.city : null,
          postanski_broj: store ? store.zipcode : null
        });
      }
    }
    
    // Očisti memoriju
    stores = null;
    products = null;
    prices = null;
    productMap.clear();
    storeMap.clear();
    
    log('info', `${trgovina}: ${seenProducts.size} proizvoda`);
  }
  
  log('info', `Ukupno obrađeno: ${allData.combined.length} zapisa`);
  
  return allData;
}

// Dohvaćanje i obrada najnovije arhive
async function fetchLatestArchive(trgovinaFilter = null) {
  // 1. Dohvati popis arhiva s API-ja
  const archives = await fetchArchiveList();
  
  if (!archives || archives.length === 0) {
    throw new Error('Nema dostupnih arhiva');
  }
  
  // 2. Sortiraj po datumu (najnoviji prvi)
  archives.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const latestArchive = archives[0];
  log('info', `Najnovija arhiva: ${latestArchive.date}`, { 
    url: latestArchive.url,
    size: `${(latestArchive.size / 1024 / 1024).toFixed(2)} MB`,
    updated: latestArchive.updated
  });
  
  // 3. Preuzmi ZIP koristeći URL iz API odgovora
  const zipBuffer = await downloadArchive(latestArchive.url);
  
  // 4. Ekstrahiraj i obradi
  const data = await extractAndProcessArchive(zipBuffer, trgovinaFilter);
  data.archiveDate = latestArchive.date;
  data.archiveUpdated = latestArchive.updated;
  data.archiveUrl = latestArchive.url;
  
  return data;
}

// Fetch s retry i exponential backoff
async function fetchWithRetry(trgovinaFilter = null, retries = CONFIG.MAX_RETRIES) {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      log('info', `Pokušaj dohvaćanja arhive (${attempt}/${retries})`);
      
      const data = await fetchLatestArchive(trgovinaFilter);
      
      log('info', `Uspješno dohvaćeno ${data.combined.length} zapisa`);
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
  
  log('error', 'Svi pokušaji dohvaćanja neuspješni', { error: lastError.message });
  throw lastError;
}

// Generiranje naziva datoteke s datumom
function getDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

// Spremanje podataka u JSON
function saveAsJSON(data, date = null) {
  const dateStr = date || getDateString();
  const fileName = `data-${dateStr}.json`;
  const filePath = path.join(__dirname, '../data', fileName);
  
  const saveData = {
    archiveDate: data.archiveDate || dateStr,
    archiveUpdated: data.archiveUpdated || new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    count: data.combined.length,
    data: data.combined
  };
  
  fs.writeFileSync(filePath, JSON.stringify(saveData, null, 2), 'utf8');
  log('info', `JSON spremljen: ${fileName}`, { records: data.combined.length });
  
  // Spremi i u data.json za backward compatibility
  const latestPath = path.join(__dirname, '../data/data.json');
  fs.writeFileSync(latestPath, JSON.stringify(saveData, null, 2), 'utf8');
  
  return fileName;
}

// Spremanje u CSV
function saveAsCSV(data, date = null) {
  if (!data.combined || data.combined.length === 0) return null;
  
  const dateStr = date || getDateString();
  const fileName = `data-${dateStr}.csv`;
  const filePath = path.join(__dirname, '../data', fileName);
  
  const headers = Object.keys(data.combined[0]).join(',');
  
  const rows = data.combined.map(item => 
    Object.values(item).map(val => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  
  fs.writeFileSync(filePath, csv, 'utf8');
  log('info', `CSV spremljen: ${fileName}`, { records: data.combined.length });
  
  const latestPath = path.join(__dirname, '../data/data.csv');
  fs.writeFileSync(latestPath, csv, 'utf8');
  
  return fileName;
}

// Dohvaćanje dostupnih lokalnih datuma
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

// Učitavanje lokalnih podataka
function loadDataByDate(dateStr) {
  const fileName = `data-${dateStr}.json`;
  const filePath = path.join(__dirname, '../data', fileName);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return fileContent.data || fileContent;
}

// Računanje statistika
function calculateStats(data) {
  if (!data || data.length === 0) {
    return {
      totalRecords: 0,
      avgCijena: 0,
      minCijena: 0,
      maxCijena: 0,
      uniqueTrgovine: 0,
      uniqueKategorije: 0,
      trgovine: [],
      kategorije: []
    };
  }
  
  const cijene = data.map(item => item.cijena).filter(c => c > 0);
  const trgovine = [...new Set(data.map(item => item.trgovina))].filter(Boolean).sort();
  const kategorije = [...new Set(data.map(item => item.kategorija))].filter(Boolean).sort();
  
  return {
    totalRecords: data.length,
    avgCijena: cijene.length > 0 ? parseFloat((cijene.reduce((a, b) => a + b, 0) / cijene.length).toFixed(2)) : 0,
    minCijena: cijene.length > 0 ? Math.min(...cijene) : 0,
    maxCijena: cijene.length > 0 ? Math.max(...cijene) : 0,
    uniqueTrgovine: trgovine.length,
    uniqueKategorije: kategorije.length,
    trgovine: trgovine,
    kategorije: kategorije
  };
}

// Lista dostupnih trgovina - AKTIVNE (za obradu)
const ACTIVE_STORES = [
  'konzum',
  'spar', 
  'dm',
  'plodine'
];

// Lista svih trgovina (zakomentirane za buduće korištenje)
const AVAILABLE_STORES = [
  'Konzum', 'Spar', 'dm', 'Plodine',
  // 'Studenac',
  // 'Lidl',
  // 'Tommy',
  // 'Kaufland',
  // 'Eurospin',
  // 'KTC',
  // 'METRO',
  // 'Trgocentar',
  // 'Žabac',
  // 'Vrutak',
  // 'Ribola',
  // 'NTL',
  // 'Boso',
  // 'Lorenco',
  // 'Jadranka',
  // 'Brodokomerc',
  // 'Trgovina-Krk',
  // 'Roto'
];

module.exports = {
  fetchArchiveList,
  downloadArchive,
  extractAndProcessArchive,
  fetchLatestArchive,
  fetchWithRetry,
  parseCSV,
  saveAsJSON,
  saveAsCSV,
  getAvailableDates,
  loadDataByDate,
  calculateStats,
  getDateString,
  log,
  CONFIG,
  AVAILABLE_STORES,
  ACTIVE_STORES
};
