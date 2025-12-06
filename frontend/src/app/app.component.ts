import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, DataItem } from './services/data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Mini Centralizator Podataka';
  data: DataItem[] = [];
  loading = false;
  error = '';
  message = '';
  
  // Filteri
  filterNaziv = '';
  filterGrad = '';

  constructor(private dataService: DataService) {}

  fetchData() {
    this.loading = true;
    this.error = '';
    this.message = '';
    
    this.dataService.fetchData().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.data = response.data;
          this.message = `Uspješno dohvaćeno ${response.count} zapisa`;
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
    
    this.dataService.getData(this.filterNaziv, this.filterGrad).subscribe({
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

  clearFilters() {
    this.filterNaziv = '';
    this.filterGrad = '';
    this.loadData();
  }
}
