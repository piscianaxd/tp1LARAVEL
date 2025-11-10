import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  profileForm: FormGroup;
  passwordForm: FormGroup;
  deleteForm: FormGroup;
  user: any = null;
  loading = false;
  saving = false;
  changingPassword = false;
  deleting = false;
  message = '';
  errorMessage = '';
  passwordMessage = '';
  passwordError = '';
  deleteError = '';
  activeTab: 'profile' | 'security' | 'logout' = 'profile';

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService
  ) {
    // Formulario para editar perfil
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });

    // Formulario para cambiar contraseña
    this.passwordForm = this.fb.group({
      current_password: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Formulario para eliminar cuenta
    this.deleteForm = this.fb.group({
      password: ['', [Validators.required]]
    });
  }

  // Validador personalizado para contraseñas
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const passwordConfirmation = form.get('password_confirmation')?.value;
    
    if (password && password !== passwordConfirmation) {
      return { passwordMismatch: true };
    }
    return null;
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.profileService.getProfile().subscribe({
      next: (response) => {
        this.user = response.user;
        this.profileForm.patchValue({
          name: this.user.name,
          email: this.user.email
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando perfil:', error);
        this.errorMessage = 'Error al cargar el perfil';
        this.loading = false;
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      this.errorMessage = 'Por favor, corrige los errores en el formulario';
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    this.profileService.updateProfile(this.profileForm.value).subscribe({
      next: (response) => {
        this.user = response.user;
        this.message = 'Perfil actualizado correctamente';
        this.saving = false;
        
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setTimeout(() => this.message = '', 3000);
      },
      error: (error) => {
        console.error('Error actualizando perfil:', error);
        this.errorMessage = error.error?.message || 'Error al actualizar el perfil';
        this.saving = false;
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      this.passwordError = 'Por favor, completa todos los campos correctamente';
      return;
    }

    this.changingPassword = true;
    this.passwordError = '';

    this.profileService.updateProfile(this.passwordForm.value).subscribe({
      next: (response) => {
        this.passwordMessage = 'Contraseña actualizada correctamente';
        this.changingPassword = false;
        this.passwordForm.reset();
        
        setTimeout(() => this.passwordMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error cambiando contraseña:', error);
        this.passwordError = error.error?.message || 'Error al cambiar la contraseña';
        this.changingPassword = false;
      }
    });
  }

  async deleteAccount(): Promise<void> {
    // 1. Validación inicial
    if (this.deleteForm.invalid) {
      this.markFormGroupTouched(this.deleteForm);
      this.alertService.showError('Contraseña requerida', 'Ingresa tu contraseña para confirmar la eliminación');
      return;
    }

    try {
      // 2. Confirmación destructiva con SweetAlert
      const confirmed = await this.alertService.showConfirm({
        swal: {
        title: '⚠️ Eliminar Cuenta Permanentemente',
        text: '¿Estás ABSOLUTAMENTE seguro? Esta acción:',
        html: `
          <div class="text-start">
            <ul>
              <li>❌ Eliminará TODOS tus datos</li>
              <li>🗑️ Borrará tus playlists y favoritos</li>
              <li>🚫 No se podrá deshacer</li>
              <li>🔒 Perderás acceso permanente</li>
            </ul>
            <p class="mt-2"><strong>Escribe tu contraseña para confirmar:</strong></p>
            <input type="password" id="password-confirm" class="form-control" placeholder="Tu contraseña actual">
          </div>
        `,
        icon: 'warning' as const,
        confirmButtonText: 'Sí, eliminar mi cuenta',
        cancelButtonText: 'Cancelar',
        showCancelButton: true,
        preConfirm: () => {
          const passwordInput = document.getElementById('password-confirm') as HTMLInputElement;
          if (!passwordInput.value) {
            this.alertService.showError('Contraseña requerida', 'Debes ingresar tu contraseña');
            return false;
          }
          if (passwordInput.value !== this.deleteForm.get('password')?.value) {
            this.alertService.showError('Contraseña incorrecta', 'La contraseña no coincide');
            return false;
          }
          return true;
        }
      }, });

      if (!confirmed.isConfirmed) return;

      // 3. Procesar eliminación
      this.alertService.showLoading('Eliminando tu cuenta y todos los datos...');
      this.deleting = true;

      // 4. Ejecutar eliminación
      await lastValueFrom(this.profileService.deleteAccount(this.deleteForm.value));

      // 5. Éxito
      this.alertService.showSuccess(
        'Cuenta Eliminada', 
        'Lamentamos verte ir. Todos tus datos han sido eliminados permanentemente.'
      );

      // 6. Limpiar y redirigir
      this.authService.clearSession();
      
      setTimeout(() => {
        this.router.navigate(['/login']);
        this.closeModal();
      }, 3000);

    } catch (error: any) {
      // 7. Manejo elegante de errores
      this.alertService.closeLoading();
      this.deleting = false;

      const errorMessage = this.getFriendlyErrorMessage(error);
      this.deleteError = errorMessage;
      
      this.alertService.showError('No se pudo eliminar la cuenta', errorMessage);
    }
  }

private getFriendlyErrorMessage(error: any): string {
  if (error.status === 401) return 'Contraseña incorrecta. Verifica tus credenciales.';
  if (error.status === 403) return 'No tienes permisos para realizar esta acción.';
  if (error.status === 500) return 'Error del servidor. Intenta nuevamente más tarde.';
  if (error.error?.message) return error.error.message;
  
  return 'Error inesperado. Por favor, contacta al soporte.';
}

  async logout() {
    const overlay = document.querySelector('.modal-overlay') as HTMLElement | null;

    // Ocultar el modal temporalmente
    if (overlay) overlay.style.display = 'none';

    try {
      const result = await this.alertService.showConfirm({
        swal: {
          title: '¿Cerrar sesión?',
          text: '¿Estás seguro de que quieres salir?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, salir',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6'
        }
      });

      if (result.isConfirmed) {
        // 🔥 EJECUTAR EL LOGOUT REAL
        this.authService.logout();
        
        // Cerrar el modal de perfil
        this.closeModal();
        
        // Redirigir al login
        this.router.navigate(['/login']);
        
        // Mostrar confirmación
        this.alertService.showSuccess('Sesión cerrada', 'Has cerrado sesión correctamente');
      }
    } finally {
      // Restaurar el modal solo si el usuario canceló
      if (overlay && !this.authService.isLoggedIn()) {
        overlay.style.display = 'flex'; // o el valor original que uses
      }
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  asetActiveTab(tab: 'profile' | 'security' | 'logout'): void {
    this.activeTab = tab;
    // Limpiar mensajes al cambiar de pestaña
    this.message = '';
    this.errorMessage = '';
    this.passwordMessage = '';
    this.passwordError = '';
    this.deleteError = '';
  }

  // Helper para acceder fácilmente a los controles del formulario
  get pf() { return this.profileForm.controls; }
  get passf() { return this.passwordForm.controls; }
  get df() { return this.deleteForm.controls; }

  // Utilidad para marcar todos los campos como touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}