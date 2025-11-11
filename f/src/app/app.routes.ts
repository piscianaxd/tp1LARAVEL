// app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { authGuard, authMatchGuard } from './services/auth-guard.service';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // públicas
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // protegidas
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    canMatch: [authMatchGuard]
  },

  { path: '**', redirectTo: 'login' }
];
