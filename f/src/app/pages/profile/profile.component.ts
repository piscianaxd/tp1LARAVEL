import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';

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
    private router: Router
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

  deleteAccount(): void {
    if (this.deleteForm.invalid) {
      this.markFormGroupTouched(this.deleteForm);
      this.deleteError = 'La contraseña es requerida';
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      return;
    }

    this.deleting = true;
    this.deleteError = '';

    this.profileService.deleteAccount(this.deleteForm.value).subscribe({
      next: (response) => {
        this.deleting = false;
        this.authService.clearSession();
        this.router.navigate(['/login']);
        this.closeModal();
      },
      error: (error) => {
        console.error('Error eliminando cuenta:', error);
        this.deleteError = error.error?.message || 'Error al eliminar la cuenta';
        this.deleting = false;
      }
    });
  }

  logout(): void {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      this.authService.logout().subscribe({
        next: () => {
          this.authService.clearSession();
          this.router.navigate(['/login']);
          this.closeModal();
        },
        error: (error) => {
          console.error('Error haciendo logout:', error);
          // Forzar logout incluso si hay error
          this.authService.clearSession();
          this.router.navigate(['/login']);
          this.closeModal();
        }
      });
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  setActiveTab(tab: 'profile' | 'security' | 'logout'): void {
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