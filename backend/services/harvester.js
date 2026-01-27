const dataService = require('./dataService');

// Konfiguracija harvestera
const HARVEST_INTERVAL = 60 * 60 * 1000; // 1 sat

let harvesterTimer = null;
let lastHarvestTime = null;
let harvesterRunning = false;
let lastHarvestResult = null;

// Glavna harvester funkcija
async function runHarvest(trgovinaFilter = null) {
  if (harvesterRunning) {
    dataService.log('warn', 'Harvester je već pokrenut, preskačem...');
    return lastHarvestResult;
  }

  harvesterRunning = true;
  dataService.log('info', '=== Pokretanje harvestera (cijene.dev ZIP arhive) ===');
  
  try {
    // 1. Dohvaćanje najnovije arhive
    const data = await dataService.fetchWithRetry(trgovinaFilter);
    
    dataService.log('info', 'Podaci dohvaćeni i obrađeni', { 
      archiveDate: data.archiveDate,
      combined: data.combined.length,
      stores: data.stores.length,
      products: data.products.length,
      prices: data.prices.length
    });
    
    if (data.combined.length === 0) {
      throw new Error('Nema podataka za spremanje');
    }
    
    // 2. Spremanje s dnevnom rotacijom
    const jsonFile = dataService.saveAsJSON(data, data.archiveDate);
    const csvFile = dataService.saveAsCSV(data, data.archiveDate);
    
    lastHarvestTime = new Date();
    lastHarvestResult = {
      success: true,
      time: lastHarvestTime,
      archiveDate: data.archiveDate,
      records: data.combined.length,
      stores: data.stores.length,
      products: data.products.length,
      prices: data.prices.length,
      files: [jsonFile, csvFile]
    };
    
    dataService.log('info', '=== Harvester završio uspješno ===', lastHarvestResult);
    
    return lastHarvestResult;
    
  } catch (error) {
    dataService.log('error', 'Harvester greška', { error: error.message, stack: error.stack });
    lastHarvestResult = {
      success: false,
      error: error.message,
      time: new Date()
    };
    return lastHarvestResult;
  } finally {
    harvesterRunning = false;
  }
}

// Dohvaćanje arhive za određeni datum
async function fetchArchiveByDate(date, trgovinaFilter = null) {
  dataService.log('info', `Dohvaćanje arhive za datum: ${date}`);
  
  try {
    const zipBuffer = await dataService.downloadArchive(date);
    const data = await dataService.extractAndProcessArchive(zipBuffer, trgovinaFilter);
    data.archiveDate = date;
    
    dataService.log('info', `Arhiva dohvaćena za ${date}`, { records: data.combined.length });
    
    return {
      success: true,
      date: date,
      records: data.combined.length,
      data: data
    };
  } catch (error) {
    dataService.log('error', `Greška pri dohvaćanju arhive za ${date}`, { error: error.message });
    return {
      success: false,
      date: date,
      error: error.message
    };
  }
}

// Pokretanje periodičnog harvestera
function startHarvester() {
  if (harvesterTimer) {
    dataService.log('warn', 'Harvester je već pokrenut');
    return;
  }
  
  dataService.log('info', `Pokretanje periodičnog harvestera (interval: ${HARVEST_INTERVAL / 1000}s)`);
  dataService.log('info', `API endpoint: ${dataService.CONFIG.API_URL}`);
  
  // Prvi harvest odmah
  runHarvest();
  
  // Zatim periodički
  harvesterTimer = setInterval(runHarvest, HARVEST_INTERVAL);
}

// Zaustavljanje harvestera
function stopHarvester() {
  if (harvesterTimer) {
    clearInterval(harvesterTimer);
    harvesterTimer = null;
    dataService.log('info', 'Harvester zaustavljen');
  }
}

// Status harvestera
function getHarvesterStatus() {
  return {
    running: harvesterTimer !== null,
    currentlyFetching: harvesterRunning,
    interval: HARVEST_INTERVAL,
    lastRun: lastHarvestTime,
    nextRun: harvesterTimer && lastHarvestTime 
      ? new Date(lastHarvestTime.getTime() + HARVEST_INTERVAL)
      : null,
    lastResult: lastHarvestResult,
    apiUrl: dataService.CONFIG.API_URL,
    availableStores: dataService.AVAILABLE_STORES
  };
}

module.exports = {
  startHarvester,
  stopHarvester,
  runHarvest,
  fetchArchiveByDate,
  getHarvesterStatus
};
