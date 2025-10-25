// app.routes.ts
import { Routes } from '@angular/router';
import { PlaylistComponent } from './pages/playlist/playlist.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { authGuard } from './services/auth-guard.service';

export const routes: Routes = [
  // Redirige raíz a /playlists (el guard decidirá si te deja pasar o te manda a /login)
  { path: '', pathMatch: 'full', redirectTo: 'playlists' },

  // Públicas
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Protegidas
  { path: 'playlists', component: PlaylistComponent, canActivate: [authGuard] },

  // (Opcional futuro)
  // { path: 'playlists/:id', component: PlaylistDetailComponent, canActivate: [authGuard] },

  // Wildcard
  { path: '**', redirectTo: 'playlists' }
];
