import { Routes } from '@angular/router';
import { PlaylistComponent } from './pages/playlist/playlist.component';

export const routes: Routes = [
  { path: '', component: PlaylistComponent }, // Ruta principal
  { path: 'playlists', component: PlaylistComponent },
  { path: 'playlist', redirectTo: 'playlists', pathMatch: 'full' },
];