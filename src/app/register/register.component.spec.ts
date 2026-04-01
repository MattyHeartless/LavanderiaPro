import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['register']);
    authServiceSpy.register.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate password requirements correctly', () => {
    component.model.password = 'Abcdef1!';
    expect(component.isPasswordValid).toBeFalse();

    component.model.password = 'Abcdef123!';
    expect(component.isPasswordValid).toBeTrue();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();

    component.togglePassword();
    expect(component.showPassword).toBeTrue();

    component.togglePassword();
    expect(component.showPassword).toBeFalse();
  });
});
