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
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  count: number;
  data: DataItem[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  fetchData(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/fetch-data`);
  }

  getData(naziv?: string, grad?: string): Observable<ApiResponse> {
    let url = `${this.apiUrl}/data`;
    const params: string[] = [];
    
    if (naziv) {
      params.push(`naziv=${encodeURIComponent(naziv)}`);
    }
    if (grad) {
      params.push(`grad=${encodeURIComponent(grad)}`);
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get<ApiResponse>(url);
  }
}
