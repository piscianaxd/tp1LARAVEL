import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { AddToPlaylistService } from '../../services/add-to-playlist.service';
import { PlaylistService } from '../../services/playlist.service';

@Component({
  selector: 'app-add-to-playlist',
  standalone: true,
  imports: [CommonModule, FormsModule, MediaUrlPipe],
  templateUrl: './add-to-playlist.component.html',
  styleUrls: ['./add-to-playlist.component.css']
})
export class AddToPlaylistComponent {
  private addToPlaylistService = inject(AddToPlaylistService);
  private playlistService = inject(PlaylistService);

  // Acceso a las señales del servicio
  showModal = this.addToPlaylistService.showModal$;
  songToAdd = this.addToPlaylistService.songToAdd$;
  loading = this.addToPlaylistService.loading;
  userPlaylists = this.addToPlaylistService.userPlaylists;
  selectedPlaylistId = this.addToPlaylistService.selectedPlaylistId;

  addingToPlaylist = false;
  successMessage = '';

  closeModal() {
    this.addToPlaylistService.closeModal();
    this.addingToPlaylist = false;
    this.successMessage = '';
  }

  selectPlaylist(playlistId: number) {
    this.selectedPlaylistId.set(playlistId);
  }

  // En add-to-playlist-modal.component.ts
  addToPlaylist() {
    const playlistId = this.selectedPlaylistId();
    const song = this.addToPlaylistService.getCurrentSong();

    console.log('🔧 Datos para agregar:', { playlistId, song });

    if (!playlistId || !song) {
      const errorMsg = 'Selecciona una playlist y una canción';
      console.error('❌ Error de validación:', errorMsg);
      this.addToPlaylistService.error.set(errorMsg);
      return;
    }

    this.addingToPlaylist = true;
    this.successMessage = '';
    this.addToPlaylistService.error.set(null);

    console.log('📤 Enviando solicitud al servidor...');

    this.playlistService.addSongToPlaylist(playlistId, song.id).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del servidor:', response);
        this.addingToPlaylist = false;
        this.successMessage = `"${song.name_song}" agregada a la playlist exitosamente`;
        
        setTimeout(() => {
          this.closeModal();
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Error completo:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error response:', error.error);
        
        this.addingToPlaylist = false;
        
        let errorMessage = 'Error al agregar la canción a la playlist';
        
        if (error.status === 409) {
          errorMessage = 'Esta canción ya está en la playlist';
        } else if (error.status === 404) {
          errorMessage = 'Playlist no encontrada';
        } else if (error.status === 400) {
          errorMessage = 'Datos inválidos';
        } else if (error.status === 401) {
          errorMessage = 'No autorizado - Debes iniciar sesión';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        console.error('❌ Mensaje de error final:', errorMessage);
        this.addToPlaylistService.error.set(errorMessage);
      }
    });
  }

  createNewPlaylistAndAdd() {
    const song = this.addToPlaylistService.getCurrentSong();
    if (!song) return;

    const playlistName = `${song.name_song} - Favoritas`;
    
    this.addingToPlaylist = true;
    this.successMessage = '';

    this.playlistService.createPlaylist({
      name_playlist: playlistName,
      is_public: false
    }).subscribe({
      next: (newPlaylist: any) => {
        // Agregar la canción a la nueva playlist
        this.playlistService.addSongToPlaylist(newPlaylist.id, song.id).subscribe({
          next: (response) => {
            console.log('✅ Nueva playlist creada y canción agregada:', response);
            this.addingToPlaylist = false;
            this.successMessage = `Nueva playlist creada y canción agregada`;
            
            // Recargar playlists del usuario
            this.addToPlaylistService.loadUserPlaylists();
            
            setTimeout(() => {
              this.closeModal();
            }, 2000);
          },
          error: (error) => {
            console.error('❌ Error agregando canción a nueva playlist:', error);
            this.addingToPlaylist = false;
            this.successMessage = 'Playlist creada pero error al agregar la canción';
          }
        });
      },
      error: (error) => {
        console.error('❌ Error creando nueva playlist:', error);
        this.addingToPlaylist = false;
        this.successMessage = 'Error al crear la nueva playlist';
      }
    });
  }
}