// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  is_admin?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

type JwtPayload = { exp?: number; [k: string]: any };

const API = 'http://localhost:8000/api';
const LS_KEY = 'auth_token';
const LS_USER = 'auth_user';
const SS_KEY = 'auth_token_ss';
const SS_USER = 'auth_user_ss';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user$ = new BehaviorSubject<User | null>(this.getUser());
  user$ = this._user$.asObservable();

  constructor(private http: HttpClient) {}

  /** LOGIN */
  login(
    credentials: { email: string; password: string },
    remember = true
  ): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/login`, credentials).pipe(
      tap(res => this.setSession(res, remember))
    );
  }

  /** REGISTER (si no querés auto-login, quitá el tap) */
  register(
    payload: { name: string; email: string; password: string; is_admin?: boolean },
    remember = true
  ): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/register`, payload).pipe(
      tap(res => this.setSession(res, remember))
    );
  }

  /** LOGOUT: limpia local y session (llame o no el back) */
  logout(): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });
    return this.http.post(`${API}/logout`, {}, { headers }).pipe(
      tap(() => this.clearSession())
    );
  }

  /** ============ Helpers de sesión ============ */

  private setSession(res: AuthResponse, remember: boolean) {
    // Limpiar ambos almacenes primero
    sessionStorage.removeItem(SS_KEY);  sessionStorage.removeItem(SS_USER);
    localStorage.removeItem(LS_KEY);    localStorage.removeItem(LS_USER);

    const token = res.token;
    const user  = JSON.stringify(res.user);

    if (remember) {
      localStorage.setItem(LS_KEY, token);
      localStorage.setItem(LS_USER, user);
    } else {
      sessionStorage.setItem(SS_KEY, token);
      sessionStorage.setItem(SS_USER, user);
    }
    this._user$.next(res.user);
  }

  clearSession() {
    sessionStorage.removeItem(SS_KEY);  sessionStorage.removeItem(SS_USER);
    localStorage.removeItem(LS_KEY);    localStorage.removeItem(LS_USER);
    this._user$.next(null);
  }

  /** Token activo (no expirado) o null */
  getToken(): string | null {
    const t = sessionStorage.getItem(SS_KEY) || localStorage.getItem(LS_KEY);
    if (!t) return null;

    const exp = this.decodeExp(t);
    if (exp && Date.now() / 1000 > exp) {
      // expirado → limpiar
      this.clearSession();
      return null;
    }
    return t;
  }

  getUser(): User | null {
    try {
      const raw = sessionStorage.getItem(SS_USER) || localStorage.getItem(LS_USER);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  /** ÚNICO criterio del guard */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /** Decodifica exp del JWT sin dependencias (base64url) */
  private decodeExp(token: string): number | undefined {
    const parts = token.split('.');
    if (parts.length !== 3) return undefined;
    try {
      const payload = JSON.parse(
        decodeURIComponent(
          atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
      ) as JwtPayload;
      return payload.exp;
    } catch {
      return undefined;
    }
  }
}
