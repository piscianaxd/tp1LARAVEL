import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;
  errorMessage = '';
  backendErrors: Record<string, string[]> = {};

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ){
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      is_admin: [false]
    });
  }

  get name(){ return this.form.get('name')!; }
  get email(){ return this.form.get('email')!; }
  get password(){ return this.form.get('password')!; }

  togglePassword(){ this.showPassword = !this.showPassword; }

  onSubmit(){
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.errorMessage = '';
    this.backendErrors = {};

    const payload = this.form.value; // {name,email,password,is_admin}

    this.auth.register(payload).subscribe({
      next: (res) => {
        // Podés guardar token si querés entrar directo:
        // this.auth.setToken(res.token);
        this.router.navigate(['/']); // o a '/login' si preferís
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 422 && typeof err.error === 'object') {
          this.backendErrors = err.error; // { email: ['ya ha sido tomado'], ... }
          this.errorMessage = 'Revisá los campos marcados.';
        } else {
          this.errorMessage = err.error?.message || 'No pudimos completar el registro.';
        }
      },
      complete: () => this.loading = false
    });
  }
}
