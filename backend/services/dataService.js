const fs = require('fs');
const path = require('path');

// Mock podaci - simulacija dohvaćanja iz vanjskog API-ja
function fetchMockData() {
  return Promise.resolve([
    { id: 1, naziv: 'Konzum', grad: 'Zagreb', kategorija: 'Trgovina', cijena: 150.50 },
    { id: 2, naziv: 'Plodine', grad: 'Split', kategorija: 'Trgovina', cijena: 200.00 },
    { id: 3, naziv: 'Pevec', grad: 'Varaždin', kategorija: 'Trgovina', cijena: 180.25 },
    { id: 4, naziv: 'Tommy', grad: 'Rijeka', kategorija: 'Trgovina', cijena: 175.00 },
    { id: 5, naziv: 'Lidl', grad: 'Zagreb', kategorija: 'Trgovina', cijena: 120.75 },
    { id: 6, naziv: 'Kaufland', grad: 'Osijek', kategorija: 'Trgovina', cijena: 190.50 },
    { id: 7, naziv: 'Spar', grad: 'Zagreb', kategorija: 'Trgovina', cijena: 165.00 },
    { id: 8, naziv: 'Studenac', grad: 'Split', kategorija: 'Trgovina', cijena: 95.25 },
    { id: 9, naziv: 'Billa', grad: 'Zagreb', kategorija: 'Trgovina', cijena: 155.80 },
    { id: 10, naziv: 'Interex', grad: 'Pula', kategorija: 'Trgovina', cijena: 210.00 },
  ]);
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

// Spremanje podataka u JSON
function saveAsJSON(data) {
  const filePath = path.join(__dirname, '../data/data.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`JSON spremljen: ${filePath}`);
}

// Spremanje podataka u CSV
function saveAsCSV(data) {
  if (data.length === 0) return;
  
  // Zaglavlje CSV-a
  const headers = Object.keys(data[0]).join(',');
  
  // Redovi CSV-a
  const rows = data.map(item => 
    Object.values(item).map(val => 
      typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    ).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  
  const filePath = path.join(__dirname, '../data/data.csv');
  fs.writeFileSync(filePath, csv, 'utf8');
  console.log(`CSV spremljen: ${filePath}`);
}

module.exports = {
  fetchMockData,
  processData,
  saveAsJSON,
  saveAsCSV
};
