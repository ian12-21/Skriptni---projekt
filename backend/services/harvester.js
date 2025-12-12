const dataService = require('./dataService');

// Konfiguracija harvestera
const HARVEST_INTERVAL = 5 * 60 * 1000; // 5 minuta (za demo)
// Za produkciju: 24 * 60 * 60 * 1000 (svaki dan)

let harvesterTimer = null;
let lastHarvestTime = null;
let harvesterRunning = false;

// Glavna harvester funkcija
async function runHarvest() {
  if (harvesterRunning) {
    dataService.log('warn', 'Harvester je već pokrenut, preskačem...');
    return;
  }

  harvesterRunning = true;
  dataService.log('info', '=== Pokretanje harvestera ===');
  
  try {
    // 1. Dohvaćanje podataka s retry/backoff
    const rawData = await dataService.fetchWithRetry();
    
    // 2. Validacija i obrada
    const processedData = dataService.processData(rawData);
    dataService.log('info', 'Podaci validirani i obrađeni', { 
      raw: rawData.length, 
      processed: processedData.length 
    });
    
    // 3. Spremanje s dnevnom rotacijom
    const jsonFile = dataService.saveAsJSON(processedData);
    const csvFile = dataService.saveAsCSV(processedData);
    
    lastHarvestTime = new Date();
    dataService.log('info', '=== Harvester završio uspješno ===', {
      time: lastHarvestTime.toISOString(),
      files: [jsonFile, csvFile]
    });
    
    return {
      success: true,
      time: lastHarvestTime,
      records: processedData.length,
      files: [jsonFile, csvFile]
    };
    
  } catch (error) {
    dataService.log('error', 'Harvester greška', { error: error.message, stack: error.stack });
    return {
      success: false,
      error: error.message,
      time: new Date()
    };
  } finally {
    harvesterRunning = false;
  }
}

// Pokretanje periodičnog harvestera
function startHarvester() {
  if (harvesterTimer) {
    dataService.log('warn', 'Harvester je već pokrenut');
    return;
  }
  
  dataService.log('info', `Pokretanje periodičnog harvestera (interval: ${HARVEST_INTERVAL / 1000}s)`);
  
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
    interval: HARVEST_INTERVAL,
    lastRun: lastHarvestTime,
    nextRun: harvesterTimer && lastHarvestTime 
      ? new Date(lastHarvestTime.getTime() + HARVEST_INTERVAL)
      : null
  };
}

module.exports = {
  startHarvester,
  stopHarvester,
  runHarvest,
  getHarvesterStatus
};
