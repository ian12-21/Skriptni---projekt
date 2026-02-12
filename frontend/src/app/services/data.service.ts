import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DataItem {
  id: string;
  naziv: string;
  trgovina: string;
  kategorija: string;
  brand: string;
  barcode: string;
  jedinica: string;
  kolicina: string;
  cijena: number;
  cijena_jedinicna: number | null;
  najbolja_cijena_30: number | null;
  anchor_cijena: number | null;
  poslovnica: string | null;
  tip_poslovnice: string | null;
  grad: string | null;
  postanski_broj: string | null;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  archiveDate?: string;
  fetchedAt?: string;
  totalCount: number;
  count: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  data: DataItem[];
}

export interface ArchiveInfo {
  date: string;
  url: string;
  size: number;
  updated: string;
}

export interface StatsResponse {
  success: boolean;
  archiveDate: string;
  stats: {
    totalRecords: number;
    avgCijena: number;
    minCijena: number;
    maxCijena: number;
    uniqueTrgovine: number;
    uniqueKategorije: number;
    trgovine: string[];
    kategorije: string[];
  };
  availableDates: string[];
  availableStores: string[];
}

export interface HarvesterStatus {
  running: boolean;
  currentlyFetching: boolean;
  interval: number;
  lastRun: string | null;
  nextRun: string | null;
  lastResult: {
    success: boolean;
    archiveDate?: string;
    records?: number;
    stores?: number;
    products?: number;
    prices?: number;
    error?: string;
  } | null;
  apiUrl: string;
  archiveUrl: string;
  availableStores: string[];
}

export interface HealthResponse {
  status: string;
  message: string;
  uptime: number;
  harvester: HarvesterStatus;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.apiUrl}/health`);
  }

  getArchives(): Observable<{ success: boolean; count: number; archives: ArchiveInfo[] }> {
    return this.http.get<any>(`${this.apiUrl}/archives`);
  }

  getStores(): Observable<{ success: boolean; stores: string[] }> {
    return this.http.get<any>(`${this.apiUrl}/stores`);
  }

  getLatest(filters?: {
    naziv?: string;
    trgovina?: string;
    kategorija?: string;
    brand?: string;
    grad?: string;
    minCijena?: number;
    maxCijena?: number;
    page?: number;
    limit?: number;
  }): Observable<ApiResponse> {
    let url = `${this.apiUrl}/latest`;
    const params: string[] = [];
    
    if (filters) {
      if (filters.naziv) params.push(`naziv=${encodeURIComponent(filters.naziv)}`);
      if (filters.trgovina) params.push(`trgovina=${encodeURIComponent(filters.trgovina)}`);
      if (filters.kategorija) params.push(`kategorija=${encodeURIComponent(filters.kategorija)}`);
      if (filters.brand) params.push(`brand=${encodeURIComponent(filters.brand)}`);
      if (filters.grad) params.push(`grad=${encodeURIComponent(filters.grad)}`);
      if (filters.minCijena) params.push(`minCijena=${filters.minCijena}`);
      if (filters.maxCijena) params.push(`maxCijena=${filters.maxCijena}`);
      if (filters.page) params.push(`page=${filters.page}`);
      if (filters.limit) params.push(`limit=${filters.limit}`);
    }
    
    if (params.length > 0) url += '?' + params.join('&');
    
    return this.http.get<ApiResponse>(url);
  }

  getArchive(date: string, trgovina?: string, page?: number, limit?: number): Observable<ApiResponse> {
    let url = `${this.apiUrl}/archive/${date}`;
    const params: string[] = [];
    
    if (trgovina) params.push(`trgovina=${encodeURIComponent(trgovina)}`);
    if (page) params.push(`page=${page}`);
    if (limit) params.push(`limit=${limit}`);
    
    if (params.length > 0) url += '?' + params.join('&');
    
    return this.http.get<ApiResponse>(url);
  }

  getStats(date?: string): Observable<StatsResponse> {
    let url = `${this.apiUrl}/stats`;
    if (date) url += `?date=${date}`;
    return this.http.get<StatsResponse>(url);
  }

  triggerHarvest(trgovina?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/harvest`, { trgovina });
  }

  getDates(): Observable<{ success: boolean; count: number; dates: string[] }> {
    return this.http.get<any>(`${this.apiUrl}/dates`);
  }

  getAvailableDates(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/dates`);
  }

  getDataByDate(date: string): Observable<ApiResponse> {
    return this.getArchive(date);
  }

  // Legacy
  fetchData(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/fetch-data`);
  }

  getData(naziv?: string, trgovina?: string): Observable<ApiResponse> {
    return this.getLatest({ naziv, trgovina });
  }

  exportToCSV(data: DataItem[], filename: string = 'export.csv'): void {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = (row as any)[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  exportToJson(data: any[], filename: string = 'export.json'): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
