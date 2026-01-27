import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DataService, DataItem, StatsResponse, HarvesterStatus, ArchiveInfo } from './services/data.service';
import { interval } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Cijene.dev - Pregled Cijena';
  data: DataItem[] = [];
  loading = false;
  error = '';
  message = '';
  
  // Filteri
  filterNaziv = '';
  filterTrgovina = '';
  filterKategorija = '';
  filterBrand = '';
  filterGrad = '';
  minCijena: number | null = null;
  maxCijena: number | null = null;
  
  // Paginacija
  currentPage = 1;
  pageSize = 50;
  totalPages = 1;
  totalRecords = 0;
  
  // Statistike
  stats: StatsResponse | null = null;
  showStats = false;
  
  // Arhive
  archives: ArchiveInfo[] = [];
  showArchives = false;
  
  // Harvester status
  harvesterStatus: HarvesterStatus | null = null;
  archiveDate: string = '';
  
  // Dropdown opcije
  trgovine: string[] = [];
  kategorije: string[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadData();
    this.loadStats();
    this.loadHealth();
    
    // Osvježi status svakih 30 sekundi
    interval(30000).subscribe(() => this.loadHealth());
  }

  loadHealth() {
    this.dataService.getHealth().subscribe({
      next: (response) => {
        this.harvesterStatus = response.harvester;
        if (this.trgovine.length === 0) {
          this.trgovine = response.harvester.availableStores || [];
        }
      },
      error: () => {}
    });
  }

  triggerHarvest() {
    this.loading = true;
    this.error = '';
    this.message = '';
    
    this.dataService.triggerHarvest(this.filterTrgovina || undefined).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.message = `✅ Uspješno dohvaćeno ${response.records} zapisa za datum ${response.archiveDate}`;
          this.loadData();
          this.loadStats();
        } else {
          this.error = response.error || 'Nepoznata greška';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Greška: ' + (err.error?.message || err.message);
      }
    });
  }

  loadData() {
    this.loading = true;
    this.error = '';
    
    const filters = {
      naziv: this.filterNaziv || undefined,
      trgovina: this.filterTrgovina || undefined,
      kategorija: this.filterKategorija || undefined,
      brand: this.filterBrand || undefined,
      grad: this.filterGrad || undefined,
      minCijena: this.minCijena || undefined,
      maxCijena: this.maxCijena || undefined,
      page: this.currentPage,
      limit: this.pageSize
    };
    
    this.dataService.getLatest(filters).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.data = response.data;
          this.totalRecords = response.totalCount;
          this.totalPages = response.totalPages || 1;
          this.archiveDate = response.archiveDate || '';
          this.message = `Prikazano ${response.count} od ${response.totalCount} zapisa`;
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
          this.kategorije = response.stats.kategorije || [];
          if (this.trgovine.length === 0) {
            this.trgovine = response.availableStores || [];
          }
        }
      },
      error: () => {}
    });
  }

  loadArchives() {
    this.dataService.getArchives().subscribe({
      next: (response) => {
        if (response.success) {
          this.archives = response.archives;
        }
      },
      error: () => {}
    });
  }

  toggleStats() {
    this.showStats = !this.showStats;
  }

  toggleArchives() {
    this.showArchives = !this.showArchives;
    if (this.showArchives && this.archives.length === 0) {
      this.loadArchives();
    }
  }

  clearFilters() {
    this.filterNaziv = '';
    this.filterTrgovina = '';
    this.filterKategorija = '';
    this.filterBrand = '';
    this.filterGrad = '';
    this.minCijena = null;
    this.maxCijena = null;
    this.currentPage = 1;
    this.loadData();
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadData();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadData();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadData();
    }
  }

  exportCSV() {
    if (this.data.length === 0) {
      this.error = 'Nema podataka za export';
      return;
    }
    const filename = `cijene-${this.archiveDate || 'export'}.csv`;
    this.dataService.exportToCSV(this.data, filename);
    this.message = `Eksportirano ${this.data.length} zapisa`;
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('hr-HR');
  }

  formatInterval(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  }

  formatCijena(cijena: number | null): string {
    if (cijena === null || cijena === undefined) return '-';
    return cijena.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }

  formatBytes(bytes: number): string {
    return this.dataService.formatBytes(bytes);
  }
}
