const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dataService = require('./services/dataService');
const harvester = require('./services/harvester');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Osiguraj da postoji data folder
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Pokreni harvester pri startu servera
harvester.startHarvester();

// === API ENDPOINTI ===

// Health check
app.get('/api/health', (req, res) => {
  const harvesterStatus = harvester.getHarvesterStatus();
  res.json({ 
    status: 'OK', 
    message: 'Server radi - povezan s cijene.dev API',
    uptime: process.uptime(),
    harvester: harvesterStatus,
    timestamp: new Date().toISOString()
  });
});

// GET /archives - Dohvaća popis dostupnih arhiva s API-ja
app.get('/api/archives', async (req, res) => {
  try {
    const archives = await dataService.fetchArchiveList();
    res.json({
      success: true,
      count: archives.length,
      archives: archives
    });
  } catch (error) {
    dataService.log('error', 'Greška u /archives', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Greška pri dohvaćanju popisa arhiva',
      error: error.message
    });
  }
});

// GET /stores - Lista dostupnih trgovina
app.get('/api/stores', (req, res) => {
  res.json({
    success: true,
    stores: dataService.AVAILABLE_STORES
  });
});

// GET /latest - Najnoviji lokalni podaci
app.get('/api/latest', (req, res) => {
  try {
    const jsonPath = path.join(dataDir, 'data.json');
    
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({
        success: false,
        message: 'Nema dostupnih podataka. Pričekajte da harvester dohvati podatke.'
      });
    }
    
    const fileContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    let data = fileContent.data || fileContent;
    
    // Filtriranje
    const { naziv, trgovina, kategorija, brand, minCijena, maxCijena, grad } = req.query;
    
    if (naziv) {
      data = data.filter(item => 
        item.naziv.toLowerCase().includes(naziv.toLowerCase())
      );
    }
    
    if (trgovina) {
      data = data.filter(item => 
        item.trgovina.toLowerCase() === trgovina.toLowerCase()
      );
    }
    
    if (kategorija) {
      data = data.filter(item => 
        item.kategorija.toLowerCase().includes(kategorija.toLowerCase())
      );
    }
    
    if (brand) {
      data = data.filter(item => 
        item.brand && item.brand.toLowerCase().includes(brand.toLowerCase())
      );
    }
    
    if (grad) {
      data = data.filter(item => 
        item.grad && item.grad.toLowerCase().includes(grad.toLowerCase())
      );
    }
    
    if (minCijena) {
      data = data.filter(item => item.cijena >= parseFloat(minCijena));
    }
    
    if (maxCijena) {
      data = data.filter(item => item.cijena <= parseFloat(maxCijena));
    }
    
    // Paginacija
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginatedData = data.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      archiveDate: fileContent.archiveDate,
      fetchedAt: fileContent.fetchedAt,
      totalCount: data.length,
      count: paginatedData.length,
      page: page,
      limit: limit,
      totalPages: Math.ceil(data.length / limit),
      data: paginatedData
    });
  } catch (error) {
    dataService.log('error', 'Greška u /latest', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Greška pri čitanju podataka',
      error: error.message
    });
  }
});

// GET /archive/:date - Dohvaća arhivu za određeni datum
app.get('/api/archive/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { trgovina } = req.query;
    
    // Validiraj format datuma
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Neispravan format datuma. Koristite YYYY-MM-DD'
      });
    }
    
    const result = await harvester.fetchArchiveByDate(date, trgovina);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    // Paginacija
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginatedData = result.data.combined.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      date: date,
      totalCount: result.data.combined.length,
      count: paginatedData.length,
      page: page,
      limit: limit,
      totalPages: Math.ceil(result.data.combined.length / limit),
      data: paginatedData
    });
  } catch (error) {
    dataService.log('error', 'Greška u /archive/:date', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Greška pri dohvaćanju arhive',
      error: error.message
    });
  }
});

// GET /stats - Statistike
app.get('/api/stats', (req, res) => {
  try {
    const { date } = req.query;
    let data;
    let archiveDate;
    
    if (date) {
      data = dataService.loadDataByDate(date);
      archiveDate = date;
      if (!data) {
        return res.status(404).json({
          success: false,
          message: `Nema podataka za datum ${date}`
        });
      }
    } else {
      const jsonPath = path.join(dataDir, 'data.json');
      if (!fs.existsSync(jsonPath)) {
        return res.status(404).json({
          success: false,
          message: 'Nema dostupnih podataka'
        });
      }
      const fileContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      data = fileContent.data || fileContent;
      archiveDate = fileContent.archiveDate || 'latest';
    }
    
    const stats = dataService.calculateStats(data);
    const availableDates = dataService.getAvailableDates();
    
    res.json({
      success: true,
      archiveDate: archiveDate,
      stats: stats,
      availableDates: availableDates,
      availableStores: dataService.AVAILABLE_STORES
    });
  } catch (error) {
    dataService.log('error', 'Greška u /stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Greška pri računanju statistika',
      error: error.message
    });
  }
});

// POST /harvest - Ručno pokretanje harvestera
app.post('/api/harvest', async (req, res) => {
  try {
    const { trgovina } = req.body || {};
    dataService.log('info', 'Ručno pokrenuto dohvaćanje podataka', { trgovina });
    
    const result = await harvester.runHarvest(trgovina);
    
    res.json({
      success: result.success,
      message: result.success ? 'Podaci uspješno dohvaćeni s cijene.dev' : 'Greška pri dohvaćanju',
      ...result
    });
  } catch (error) {
    dataService.log('error', 'Greška u /harvest', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Greška pri dohvaćanju podataka',
      error: error.message
    });
  }
});

// GET /dates - Lista dostupnih lokalnih datuma
app.get('/api/dates', (req, res) => {
  try {
    const dates = dataService.getAvailableDates();
    res.json({
      success: true,
      count: dates.length,
      dates: dates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// === LEGACY ENDPOINTI ===

app.get('/api/fetch-data', async (req, res) => {
  try {
    const result = await harvester.runHarvest();
    res.json({
      success: result.success,
      message: result.success ? 'Podaci uspješno dohvaćeni' : 'Greška',
      count: result.records || 0,
      files: result.files || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Greška pri dohvaćanju podataka',
      error: error.message
    });
  }
});

app.get('/api/data', (req, res) => {
  try {
    const jsonPath = path.join(dataDir, 'data.json');
    
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({
        success: false,
        message: 'Podaci još nisu dohvaćeni'
      });
    }
    
    const fileContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    let data = fileContent.data || fileContent;
    
    const { naziv, trgovina } = req.query;
    
    if (naziv) {
      data = data.filter(item => 
        item.naziv.toLowerCase().includes(naziv.toLowerCase())
      );
    }
    
    if (trgovina) {
      data = data.filter(item => 
        item.trgovina.toLowerCase() === trgovina.toLowerCase()
      );
    }
    
    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Greška pri čitanju podataka',
      error: error.message
    });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  dataService.log('info', 'Zaustavljanje servera...');
  harvester.stopHarvester();
  process.exit(0);
});

process.on('SIGTERM', () => {
  dataService.log('info', 'Zaustavljanje servera...');
  harvester.stopHarvester();
  process.exit(0);
});

app.listen(PORT, () => {
  dataService.log('info', `Server pokrenut na http://localhost:${PORT}`);
  dataService.log('info', `API: ${dataService.CONFIG.API_URL}`);
  // console.log(`\nAPI Endpointi:`);
  // console.log(`  GET  /api/health        - Status servera`);
  // console.log(`  GET  /api/archives      - Popis dostupnih arhiva s cijene.dev`);
  // console.log(`  GET  /api/stores        - Lista trgovina`);
  // console.log(`  GET  /api/latest        - Najnoviji lokalni podaci`);
  // console.log(`  GET  /api/archive/:date - Dohvati arhivu za datum`);
  // console.log(`  GET  /api/stats         - Statistike`);
  // console.log(`  POST /api/harvest       - Ručno pokretanje harvestera`);
  // console.log(`  GET  /api/dates         - Lokalno spremljeni datumi`);
});
