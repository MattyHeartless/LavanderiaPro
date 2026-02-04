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
  userId: string;
  email: string;
  fullName: string;
  phoneNumber:string;
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

}
