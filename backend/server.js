const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dataService = require('./services/dataService');

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

// Ruta 1: Dohvaćanje i obrada podataka
app.get('/api/fetch-data', async (req, res) => {
  try {
    console.log('Dohvaćanje i obrada podataka...');
    
    // Dohvati mock podatke
    const rawData = await dataService.fetchMockData();
    
    // Validiraj i obradi podatke
    const processedData = dataService.processData(rawData);
    
    // Spremi u JSON i CSV
    dataService.saveAsJSON(processedData);
    dataService.saveAsCSV(processedData);
    
    res.json({
      success: true,
      message: 'Podaci uspješno dohvaćeni i spremljeni',
      count: processedData.length,
      data: processedData
    });
  } catch (error) {
    console.error('Greška pri dohvaćanju podataka:', error);
    res.status(500).json({
      success: false,
      message: 'Greška pri dohvaćanju podataka',
      error: error.message
    });
  }
});

// Ruta 2: Vraćanje spremljenih podataka
app.get('/api/data', (req, res) => {
  try {
    const jsonPath = path.join(dataDir, 'data.json');
    
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({
        success: false,
        message: 'Podaci još nisu dohvaćeni. Prvo pokreni /api/fetch-data'
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
    console.error('Greška pri čitanju podataka:', error);
    res.status(500).json({
      success: false,
      message: 'Greška pri čitanju podataka',
      error: error.message
    });
  }
});

//Healthcheck ruta
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server radi' });
});

app.listen(PORT, () => {
  console.log(`Server pokrenut na http://localhost:${PORT}`);
  console.log(`Healthcheck: http://localhost:${PORT}/api/health`);
});
