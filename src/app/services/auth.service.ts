import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, tap } from 'rxjs';

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id?: string;
  userId: string;
  email: string;
  fullName: string;
  phoneNumber:string;
}

export interface UserCoupon {
  id: string;
  couponId: string;
  status: string;
  createdAt: string;
  redeemedAt: string | null;
  orderId: string | null;
  source: string | null;
  expiresAt: string | null;
  couponCodeSnapshot: string;
  couponNameSnapshot: string;
  couponDescriptionSnapshot: string;
  benefitTypeSnapshot: string;
  benefitValueSnapshot: number;
  eventTypeSnapshot: string | null;
}

export interface UpdateRequest {
  id: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface ChangePasswordRequest {
  email: string;
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly sessionStorageKey = 'user_session';

   currentUserSubject = new BehaviorSubject<LoginResponse | null>(this.getStoredUserSession());

  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly authUrl = environment.authApiUrl;

  constructor(private http: HttpClient) {}

  getStoredUserSession(): LoginResponse | null {
    const storedSession = localStorage.getItem(this.sessionStorageKey) ?? sessionStorage.getItem(this.sessionStorageKey);

    if (!storedSession) {
      return null;
    }

    try {
      return JSON.parse(storedSession) as LoginResponse;
    } catch (error) {
      console.error('Error al parsear datos de sesión', error);
      this.clearStoredUserSession();
      return null;
    }
  }

  setStoredUserSession(user: LoginResponse, rememberUser: boolean): void {
    this.clearStoredUserSession();

    const storage = rememberUser ? localStorage : sessionStorage;
    storage.setItem(this.sessionStorageKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  clearStoredUserSession(): void {
    localStorage.removeItem(this.sessionStorageKey);
    sessionStorage.removeItem(this.sessionStorageKey);
    this.currentUserSubject.next(null);
  }

  register(data: RegisterRequest) {
    return this.http.post(`${this.authUrl}/register`, data);
  }

  login(data: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, data);
  }

  update(data: UpdateRequest) {
    return this.http.put<LoginResponse>(`${this.authUrl}/update-user/${data.id}`, data).pipe(
      tap((updatedUser) => {
        const rememberUser = !!localStorage.getItem(this.sessionStorageKey);
        this.setStoredUserSession(updatedUser, rememberUser);
      })
    );
  }

  changePassword(data: ChangePasswordRequest) {
    return this.http.post(`${this.authUrl}/change-password`, data);
  }

  getUserCoupons(userId: string) {
    return this.http.get<UserCoupon[]>(`${this.authUrl}/users/${userId}/coupons`);
  }

}
