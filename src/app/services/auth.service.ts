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

   currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly authUrl = environment.authApiUrl;

  constructor(private http: HttpClient) {}

  register(data: RegisterRequest) {
    return this.http.post(`${this.authUrl}/register`, data);
  }

  login(data: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, data);
  }

  update(data: UpdateRequest) {
    return this.http.put<LoginResponse>(`${this.authUrl}/update-user/${data.id}`, data).pipe(
      tap((updatedUser) => {
        this.currentUserSubject.next(updatedUser);
        localStorage.setItem('user_session', JSON.stringify(updatedUser));
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
