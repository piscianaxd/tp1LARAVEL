import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  deleteForm: FormGroup;
  user: any = null;
  loading = false;
  saving = false;
  deleting = false;
  message = '';
  errorMessage = '';
  deleteError = '';

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {
    // Formulario para editar perfil
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      current_password: [''],
      password: ['', [Validators.minLength(8)]],
      password_confirmation: ['']
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
    // Verificar si está logueado
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.profileService.getProfile().subscribe({
      next: (response) => {
        this.user = response.user;
        // Llenar el formulario con los datos del usuario
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
      this.errorMessage = 'Por favor, corrige los errores en el formulario';
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    // Preparar datos para enviar (solo enviar campos con valores)
    const formData = { ...this.profileForm.value };
    
    // Si no se está cambiando la contraseña, eliminar campos de contraseña
    if (!formData.password) {
      delete formData.current_password;
      delete formData.password;
      delete formData.password_confirmation;
    }

    this.profileService.updateProfile(formData).subscribe({
      next: (response) => {
        this.user = response.user;
        this.message = 'Perfil actualizado correctamente';
        this.saving = false;
        
        // Actualizar usuario en localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => this.message = '', 3000);
      },
      error: (error) => {
        console.error('Error actualizando perfil:', error);
        this.errorMessage = error.message || 'Error al actualizar el perfil';
        this.saving = false;
      }
    });
  }

  deleteAccount(): void {
    if (this.deleteForm.invalid) {
      this.deleteError = 'La contraseña es requerida';
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      return;
    }

    this.deleting = true;
    this.deleteError = '';

    this.profileService.deleteAccount(this.deleteForm.value.password).subscribe({
      next: (response) => {
        this.deleting = false;
        this.authService.clearSession();
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error eliminando cuenta:', error);
        this.deleteError = error.message || 'Error al eliminar la cuenta';
        this.deleting = false;
      }
    });
  }

  // Helper para acceder fácilmente a los controles del formulario
  get pf() { return this.profileForm.controls; }
  get df() { return this.deleteForm.controls; }
}