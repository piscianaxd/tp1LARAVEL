import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  is_admin?: boolean;
  // sumá campos si tu back devuelve más
}
export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Sugerencia: mover a environment.ts
  private apiUrl = 'http://localhost:8000/api';

  // estado reactivo de sesión (útil para header, navbar, etc.)
  private _user$ = new BehaviorSubject<User | null>(this.getUser());
  user$ = this._user$.asObservable();

  constructor(private http: HttpClient) {}

  /** LOGIN */
  login(credentials: { email: string; password: string }, remember = true): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => this.setSession(res, remember))
    );
  }

  /** REGISTER */
  register(payload: { name: string; email: string; password: string; is_admin?: boolean }, remember = true): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap(res => this.setSession(res, remember)) // si NO querés auto-login al registrarse, quitá este tap
    );
  }

  /** LOGOUT (Bearer Sanctum) */
  logout(): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });
    return this.http.post(`${this.apiUrl}/logout`, {}, { headers }).pipe(
      tap(() => this.clearSession())
    );
  }

  /** Helpers de sesión */
  setSession(res: AuthResponse, remember = true) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('token', res.token);
    storage.setItem('user', JSON.stringify(res.user));
    // si cambiaste de storage, limpiá el otro para evitar estados “fantasma”
    (remember ? sessionStorage : localStorage).removeItem('token');
    (remember ? sessionStorage : localStorage).removeItem('user');
    this._user$.next(res.user);
  }

  clearSession() {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    sessionStorage.removeItem('token'); sessionStorage.removeItem('user');
    this._user$.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token') ?? sessionStorage.getItem('token');
  }

  getUser(): User | null {
    try {
      const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user');
      return raw ? JSON.parse(raw) as User : null;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
