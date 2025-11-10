import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:8000/api/profile';

  constructor(private http: HttpClient) {}

  private getHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return { headers };
  }

  getProfile(): Observable<any> {
    return this.http.get(this.apiUrl, this.getHeaders())
      .pipe(
        catchError(this.handleError)
      );
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put(this.apiUrl, profileData, this.getHeaders())
      .pipe(
        catchError(this.handleError)
      );
  }

  // ✅ VERSIÓN CORREGIDA - Opción 3 (Recomendada)
  deleteAccount(password: string): Observable<any> {
    const options = {
      headers: this.getHeaders().headers,
      body: { password }
    };

    return this.http.delete(this.apiUrl, options)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any) {
    console.error('Error en ProfileService:', error);
    
    let errorMessage = 'Error del servidor';
    if (error.status === 401) {
      errorMessage = 'No autorizado';
    } else if (error.status === 422) {
      errorMessage = error.error?.message || 'Datos inválidos';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}