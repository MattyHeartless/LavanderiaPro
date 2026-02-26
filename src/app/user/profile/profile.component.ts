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
  isSaving = false;
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

  loadUserData() {
    const data = localStorage.getItem('user_session');
    
    if (data) {
      try {
        // Convertimos el string de nuevo a un objeto JS
        this.user_session = JSON.parse(data);
        this.model.fullName = this.user_session.fullName;
        this.model.email = this.user_session.email;
        this.model.phoneNumber = this.user_session.phoneNumber;
        this.model.id = this.user_session.id;
        console.log('Datos cargados:', this.model);
      } catch (error) {
        console.error('Error al parsear datos del localStorage', error);
      }
    }
  }

  updateUserData() {
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
