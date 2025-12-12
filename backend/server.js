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

// === NOVI API ENDPOINTI ===

// Health check s detaljima
app.get('/api/health', (req, res) => {
  const harvesterStatus = harvester.getHarvesterStatus();
  res.json({ 
    status: 'OK', 
    message: 'Server radi',
    uptime: process.uptime(),
    harvester: harvesterStatus,
    timestamp: new Date().toISOString()
  });
});

// GET /latest - Dohvaća zadnje spremljene podatke
app.get('/api/latest', (req, res) => {
  try {
    const jsonPath = path.join(dataDir, 'data.json');
    
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({
        success: false,
        message: 'Nema dostupnih podataka'
      });
    }
    
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Filtriranje prema query parametrima
    let filteredData = data;
    const { naziv, grad } = req.query;
    
    if (naziv) {
      filteredData = filteredData.filter(item => 
        item.naziv.toLowerCase().includes(naziv.toLowerCase())
      );
    }
    
    if (grad) {
      filteredData = filteredData.filter(item => 
        item.grad.toLowerCase().includes(grad.toLowerCase())
      );
    }
    
    res.json({
      success: true,
      count: filteredData.length,
      data: filteredData
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

// GET /range - Dohvaća podatke za raspon datuma
app.get('/api/range', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Potrebni su parametri startDate i endDate (format: YYYY-MM-DD)'
      });
    }
    
    const data = dataService.loadDataByRange(startDate, endDate);
    
    // Filtriranje
    let filteredData = data;
    const { naziv, grad } = req.query;
    
    if (naziv) {
      filteredData = filteredData.filter(item => 
        item.naziv.toLowerCase().includes(naziv.toLowerCase())
      );
    }
    
    if (grad) {
      filteredData = filteredData.filter(item => 
        item.grad.toLowerCase().includes(grad.toLowerCase())
      );
    }
    
    res.json({
      success: true,
      dateRange: { startDate, endDate },
      count: filteredData.length,
      data: filteredData
    });
  } catch (error) {
    dataService.log('error', 'Greška u /range', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Greška pri čitanju podataka',
      error: error.message
    });
  }
});

// GET /stats - Vraća statistike
app.get('/api/stats', (req, res) => {
  try {
    const { date } = req.query;
    let data;
    
    if (date) {
      // Statistika za određeni datum
      data = dataService.loadDataByDate(date);
      if (!data) {
        return res.status(404).json({
          success: false,
          message: `Nema podataka za datum ${date}`
        });
      }
    } else {
      // Statistika za najnovije podatke
      const jsonPath = path.join(dataDir, 'data.json');
      if (!fs.existsSync(jsonPath)) {
        return res.status(404).json({
          success: false,
          message: 'Nema dostupnih podataka'
        });
      }
      data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }
    
    const stats = dataService.calculateStats(data);
    const availableDates = dataService.getAvailableDates();
    
    res.json({
      success: true,
      date: date || 'latest',
      stats: stats,
      availableDates: availableDates
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
    dataService.log('info', 'Ručno pokrenuto dohvaćanje podataka');
    const result = await harvester.runHarvest();
    
    res.json({
      success: result.success,
      message: result.success ? 'Podaci uspješno dohvaćeni' : 'Greška pri dohvaćanju',
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

// GET /dates - Lista dostupnih datuma
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

// === LEGACY ENDPOINTI (za backward compatibility) ===


// Legacy: POST za manualno dohvaćanje (preusmjeravanje na /harvest)
app.get('/api/fetch-data', async (req, res) => {
  try {
    dataService.log('info', 'Legacy endpoint /fetch-data pozvan');
    const result = await harvester.runHarvest();
    
    res.json({
      success: result.success,
      message: result.success ? 'Podaci uspješno dohvaćeni i spremljeni' : 'Greška',
      count: result.records || 0,
      files: result.files || []
    });
  } catch (error) {
    dataService.log('error', 'Greška u /fetch-data', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Greška pri dohvaćanju podataka',
      error: error.message
    });
  }
});

// Legacy: GET /data (preusmjeravanje na /latest)
app.get('/api/data', (req, res) => {
  try {
    const jsonPath = path.join(dataDir, 'data.json');
    
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({
        success: false,
        message: 'Podaci još nisu dohvaćeni'
      });
    }
    
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Filtriranje
    let filteredData = data;
    const { naziv, grad } = req.query;
    
    if (naziv) {
      filteredData = filteredData.filter(item => 
        item.naziv.toLowerCase().includes(naziv.toLowerCase())
      );
    }
    
    if (grad) {
      filteredData = filteredData.filter(item => 
        item.grad.toLowerCase().includes(grad.toLowerCase())
      );
    }
    
    res.json({
      success: true,
      count: filteredData.length,
      data: filteredData
    });
  } catch (error) {
    dataService.log('error', 'Greška u /data', { error: error.message });
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
  dataService.log('info', `API dokumentacija:`);
  console.log(`  - GET  /api/health       - Status servera i harvestera`);
  console.log(`  - GET  /api/latest       - Najnoviji podaci`);
  console.log(`  - GET  /api/range        - Podaci za raspon datuma`);
  console.log(`  - GET  /api/stats        - Statistike`);
  console.log(`  - POST /api/harvest      - Ručno pokretanje harvestera`);
  console.log(`  - GET  /api/dates        - Lista dostupnih datuma`);
});
