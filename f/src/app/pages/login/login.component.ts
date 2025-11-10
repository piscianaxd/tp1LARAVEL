import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service'; // Asegúrate de importar

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = '';
  loading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService // ← Agregar esto
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [true]
    });
  }

  get email() { return this.loginForm.get('email')!; }
  get password() { return this.loginForm.get('password')!; }

  togglePassword(){ this.showPassword = !this.showPassword; }

  onSubmit(): void {
    if (this.loginForm.invalid || this.loading) return;
    this.errorMessage = '';
    this.loading = true;

    const payload = this.loginForm.value;
    this.authService.login(payload).subscribe({
      next: (userData) => {
        // Primero navegar al dashboard
        this.router.navigate(['/']).then(() => {
          // 🔥 MOSTRAR BIENVENIDA DESPUÉS de la navegación
          const userName = userData?.user?.name || 'Usuario';
          this.alertService.showSuccess(
            `¡Bienvenido ${userName}!`,
            'Has iniciado sesión correctamente'
          );
        });
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'Credenciales incorrectas o servicio no disponible.';
        this.loading = false;
        
        // Efecto flash de error
        const wrapper = document.querySelector('.auth-wrap');
        if (wrapper) {
          wrapper.classList.add('flash-error');
          setTimeout(() => wrapper.classList.remove('flash-error'), 500);
        }
      },
      complete: () => this.loading = false
    });
  }
}