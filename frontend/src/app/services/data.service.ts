import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DataItem {
  id: number;
  naziv: string;
  grad: string;
  kategorija: string;
  cijena: number;
  datum?: string;
  fetchDate?: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  count: number;
  data: DataItem[];
}

export interface StatsResponse {
  success: boolean;
  date: string;
  stats: {
    totalRecords: number;
    avgCijena: number;
    minCijena: number;
    maxCijena: number;
    uniqueGradovi: number;
    uniqueNazivi: number;
    gradovi: string[];
    nazivi: string[];
  };
  availableDates: string[];
}

export interface HarvesterStatus {
  running: boolean;
  interval: number;
  lastRun: string | null;
  nextRun: string | null;
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

  // Health check
  getHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.apiUrl}/health`);
  }

  // Najnoviji podaci
  getLatest(naziv?: string, grad?: string): Observable<ApiResponse> {
    let url = `${this.apiUrl}/latest`;
    const params: string[] = [];
    
    if (naziv) params.push(`naziv=${encodeURIComponent(naziv)}`);
    if (grad) params.push(`grad=${encodeURIComponent(grad)}`);
    
    if (params.length > 0) url += '?' + params.join('&');
    
    return this.http.get<ApiResponse>(url);
  }

  // Podaci za raspon datuma
  getRange(startDate: string, endDate: string, naziv?: string, grad?: string): Observable<ApiResponse> {
    let url = `${this.apiUrl}/range?startDate=${startDate}&endDate=${endDate}`;
    
    if (naziv) url += `&naziv=${encodeURIComponent(naziv)}`;
    if (grad) url += `&grad=${encodeURIComponent(grad)}`;
    
    return this.http.get<ApiResponse>(url);
  }

  // Statistike
  getStats(date?: string): Observable<StatsResponse> {
    let url = `${this.apiUrl}/stats`;
    if (date) url += `?date=${date}`;
    
    return this.http.get<StatsResponse>(url);
  }

  // Ručno pokretanje harvestera
  triggerHarvest(): Observable<any> {
    return this.http.post(`${this.apiUrl}/harvest`, {});
  }

  // Lista dostupnih datuma
  getDates(): Observable<{ success: boolean; count: number; dates: string[] }> {
    return this.http.get<any>(`${this.apiUrl}/dates`);
  }

  // Legacy metode (za kompatibilnost)
  fetchData(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/fetch-data`);
  }

  getData(naziv?: string, grad?: string): Observable<ApiResponse> {
    return this.getLatest(naziv, grad);
  }

  // Export u CSV
  exportToCSV(data: DataItem[], filename: string = 'export.csv'): void {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = (row as any)[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
