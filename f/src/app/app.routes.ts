import { Routes } from '@angular/router';
import { PlaylistComponent } from './pages/playlist/playlist.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  { path: '', component: PlaylistComponent }, // Ruta principal
  { path: 'playlists', component: PlaylistComponent },
  { path: 'playlist', redirectTo: 'playlists', pathMatch: 'full' },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
];