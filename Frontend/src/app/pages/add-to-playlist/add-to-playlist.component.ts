import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { AddToPlaylistService } from '../../services/add-to-playlist.service';
import { PlaylistService } from '../../services/playlist.service';
import { PlaylistEventService } from '../../services/playlist-event.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-to-playlist',
  standalone: true,
  imports: [CommonModule, FormsModule, MediaUrlPipe],
  templateUrl: './add-to-playlist.component.html',
  styleUrls: ['./add-to-playlist.component.css']
})
export class AddToPlaylistComponent implements OnInit, OnDestroy {
  private addToPlaylistService = inject(AddToPlaylistService);
  private playlistService = inject(PlaylistService);
  private playlistEventService = inject(PlaylistEventService);

  // Acceso a las señales del servicio
  showModal = this.addToPlaylistService.showModal$;
  songToAdd = this.addToPlaylistService.songToAdd$;
  loading = this.addToPlaylistService.loading;
  userPlaylists = this.addToPlaylistService.userPlaylists;
  selectedPlaylistId = this.addToPlaylistService.selectedPlaylistId;

  addingToPlaylist = false;
  successMessage = '';

  private playlistCreatedSubscription!: Subscription;

  ngOnInit() {
    console.log('🎵 AddToPlaylistComponent inicializado');
    console.log('🔍 PlaylistEventService disponible:', !!this.playlistEventService);
    
    // Suscribirse al evento de playlist creada
    this.playlistCreatedSubscription = this.playlistEventService.playlistCreated$.subscribe((playlistId) => {
      console.log('✅ Playlist creada con ID:', playlistId);
    });
  }

  ngOnDestroy() {
    console.log('🧹 AddToPlaylistComponent destruyéndose');
    if (this.playlistCreatedSubscription) {
      this.playlistCreatedSubscription.unsubscribe();
    }
  }

  closeModal() {
    console.log('❌ Cerrando modal de AddToPlaylist');
    this.addToPlaylistService.closeModal();
    this.addingToPlaylist = false;
    this.successMessage = '';
  }

  selectPlaylist(playlistId: number) {
    console.log('📌 Playlist seleccionada:', playlistId);
    this.selectedPlaylistId.set(playlistId);
  }

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
        
        // Notificar que se guardó una playlist
        this.playlistEventService.notifyPlaylistSaved();

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

  // En add-to-playlist.component.ts - CORREGIR este método
  createNewPlaylistAndAdd() {
    const song = this.addToPlaylistService.getCurrentSong();
    if (!song) {
      console.error('❌ No hay canción seleccionada');
      return;
    }

    console.log('🎵 Creando nueva playlist con canción:', song);
    console.log('🔍 PlaylistEventService:', this.playlistEventService);
    console.log('🔍 Método openCreatePlaylistWithSong disponible:', !!this.playlistEventService.openCreatePlaylistWithSong);
    
    // 🔥 IMPORTANTE: Enviar el evento PRIMERO, luego cerrar el modal
    console.log('🚀 EMITIENDO EVENTO openCreatePlaylistWithSong...');
    
    this.playlistEventService.openCreatePlaylistWithSong({
      id: song.id,
      name_song: song.name_song,
      artist_song: song.artist_song,
      album_song: song.album_song || '',
      art_work_song: song.art_work_song || '',
      duration: song.duration || 180
    });
    
    console.log('✅ Evento emitido, cerrando modal...');
    
    // Cerrar el modal después de enviar el evento
    this.closeModal();
  }
}