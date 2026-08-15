import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user';
import { AuthResponse } from '../models/auth-response';

@Injectable({
  providedIn: 'root'
})
export class Authentication {
  private apiBaseUrl = 'http://localhost:3000/api';
  private tokenKey = 'travlr-token';

  loggedIn = signal<boolean>(this.hasValidToken());

  constructor(private http: HttpClient) {}

  public getToken(): string {
    return localStorage.getItem(this.tokenKey) ?? '';
  }

  public saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.loggedIn.set(true);
  }

  public logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.loggedIn.set(false);
  }

  public login(user: User): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/login`, user)
      .pipe(
        tap((response: AuthResponse) => {
          this.saveToken(response.token);
        })
      );
  }

  public register(user: User): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/register`, user)
      .pipe(
        tap((response: AuthResponse) => {
          this.saveToken(response.token);
        })
      );
  }

  public isLoggedIn(): boolean {
    return this.loggedIn();
  }

  private hasValidToken(): boolean {
    const token = localStorage.getItem(this.tokenKey);

    if (!token) {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }
}