import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, ChangePasswordRequest, UpdateRequest } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { UtilService } from '../../shared/util';

@Component({
  selector: 'app-profile',
  imports: [RouterLink, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  readonly minPasswordLength = 10;
  isSaving = false;
  isMobileMenuOpen = false;
  showCurrentPassword = false;
  showNewPassword = false;
  isNewPasswordFocused = false;
  passwordErrorMessage = '';
  model: UpdateRequest = {
    id: '',
    email: '',
    fullName: '',
    phoneNumber: ''
  };

  passwordModel : ChangePasswordRequest = {
    email: '',
    currentPassword: '',
    newPassword: ''
  };
  public user_session: any = null;

  constructor(
     private authService: AuthService,
    private router: Router,
    public util: UtilService
  ) {}

  
  ngOnInit() {

    this.loadUserData();
  }

  get newPasswordChecks() {
    const password = this.model.newPassword ?? '';

    return [
      {
        label: `Mínimo ${this.minPasswordLength} caracteres`,
        passed: password.length >= this.minPasswordLength
      },
      {
        label: 'Al menos una mayúscula',
        passed: /[A-Z]/.test(password)
      },
      {
        label: 'Al menos una minúscula',
        passed: /[a-z]/.test(password)
      },
      {
        label: 'Al menos un número',
        passed: /\d/.test(password)
      },
      {
        label: 'Al menos un caracter especial',
        passed: /[^A-Za-z0-9]/.test(password)
      }
    ];
  }

  get isNewPasswordValid() {
    return this.newPasswordChecks.every((rule) => rule.passed);
  }

  get isPasswordChangeRequested() {
    return !!this.model.currentPassword || !!this.model.newPassword;
  }

  get canSubmitPasswordChange() {
    return !!this.model.currentPassword && !!this.model.newPassword && this.isNewPasswordValid;
  }

  toggleCurrentPassword() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  onNewPasswordFocus() {
    this.isNewPasswordFocused = true;
  }

  onNewPasswordBlur() {
    this.isNewPasswordFocused = false;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  loadUserData() {
    const data = this.authService.getStoredUserSession();
    
    if (data) {
      try {
        this.user_session = data;
        this.model.fullName = this.user_session.fullName;
        this.model.email = this.user_session.email;
        this.model.phoneNumber = this.user_session.phoneNumber;
        this.model.id = this.user_session.id;
        console.log('Datos cargados:', this.model);
      } catch (error) {
        console.error('Error al recuperar la sesión del usuario', error);
      }
    }
  }

  updateUserData() {
    if (this.isPasswordChangeRequested && !this.canSubmitPasswordChange) {
      this.passwordErrorMessage = 'Para cambiar la contraseña, captura la actual y una nueva contraseña válida.';
      return;
    }

    this.passwordErrorMessage = '';
    this.isSaving = true;
    this.authService.update(this.model).subscribe({
      next: (response) => {
         this.isSaving = false;
        this.user_session = response;
        console.log('Usuario actualizado:', response);
       if (this.model.currentPassword != "" && this.model.newPassword != "") {
          //Actualiza la contraseña
          this.passwordModel.email = this.model.email!;
          this.passwordModel.currentPassword = this.model.currentPassword!;
          this.passwordModel.newPassword = this.model.newPassword!;
          this.authService.changePassword(this.passwordModel).subscribe({
            next: (response) => {
              this.isSaving = false;
              console.log("Contraseña actualizada:", response);
            },
            error: (error) => {
              this.isSaving = false;
              console.error("Error al actualizar contraseña:", error);
            }
          });
       }
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error al actualizar usuario:', error);
      }
    });
  }
}
