// app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { authGuard } from './services/auth-guard.service';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
  
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  // Públicas
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Protegidas
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  // (Opcional futuro)
  // { path: 'playlists/:id', component: PlaylistDetailComponent, canActivate: [authGuard] },

  // Wildcard
  { path: '**', redirectTo: 'playlists' }
];
