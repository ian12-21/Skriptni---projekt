import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, DataItem, StatsResponse } from './services/data.service';
import { interval } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Mini Centralizator Podataka';
  data: DataItem[] = [];
  loading = false;
  error = '';
  message = '';
  
  // Filteri
  filterNaziv = '';
  filterGrad = '';
  
  // Statistike
  stats: StatsResponse | null = null;
  showStats = false;
  
  // Harvester status
  harvesterStatus: any = null;
  
  // Datumi
  availableDates: string[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadData();
    this.loadStats();
    this.loadHealth();
    
    // Osvježi health status svakih 30 sekundi
    interval(30000).subscribe(() => {
      this.loadHealth();
    });
  }

  loadHealth() {
    this.dataService.getHealth().subscribe({
      next: (response) => {
        this.harvesterStatus = response.harvester;
      },
      error: () => {
        // Tiho ignoriraj grešku
      }
    });
  }

  triggerHarvest() {
    this.loading = true;
    this.error = '';
    this.message = '';
    
    this.dataService.triggerHarvest().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.message = `Uspješno dohvaćeno ${response.records} zapisa`;
          this.loadData();
          this.loadStats();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Greška pri dohvaćanju podataka: ' + (err.error?.message || err.message);
      }
    });
  }

  loadData() {
    this.loading = true;
    this.error = '';
    this.message = '';
    
    this.dataService.getLatest(this.filterNaziv, this.filterGrad).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.data = response.data;
          this.message = `Prikazano ${response.count} zapisa`;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Greška pri učitavanju podataka';
      }
    });
  }

  loadStats() {
    this.dataService.getStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response;
          this.availableDates = response.availableDates;
        }
      },
      error: () => {
        // Tiho ignoriraj
      }
    });
  }

  toggleStats() {
    this.showStats = !this.showStats;
  }

  clearFilters() {
    this.filterNaziv = '';
    this.filterGrad = '';
    this.loadData();
  }

  exportCSV() {
    if (this.data.length === 0) {
      this.error = 'Nema podataka za export';
      return;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `export-${timestamp}.csv`;
    
    this.dataService.exportToCSV(this.data, filename);
    this.message = `Eksportirano ${this.data.length} zapisa u ${filename}`;
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('hr-HR');
  }

  formatInterval(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}min`;
  }
}
