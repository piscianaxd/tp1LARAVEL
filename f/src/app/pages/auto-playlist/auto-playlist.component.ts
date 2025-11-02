import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RandomTrackService, Song } from '../../services/random-track.service';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { HttpErrorResponse } from '@angular/common/http';
import { PlaylistService } from '../../services/playlist.service';

interface AutoPlaylist {
  id?: number;
  name: string;
  description: string;
  songs: Song[];
  isGenerated: boolean;
  genre?: string;
  isPersistent?: boolean; // Nueva propiedad para playlists persistentes
  currentPage?: number;   // Paginación para playlists persistentes
}

@Component({
  selector: 'app-auto-playlists',
  standalone: true,
  imports: [CommonModule, MediaUrlPipe],
  templateUrl: './auto-playlist.component.html',
  styleUrls: ['./auto-playlist.component.css']
})
export class AutoPlaylistsComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  playlists = signal<AutoPlaylist[]>([]);
  creatingPlaylist = signal<string | null>(null);
  
  // Estado para la vista detallada
  selectedPlaylist = signal<AutoPlaylist | null>(null);
  showPlaylistDetail = signal(false);

  // Playlist persistente (Mix Popular)
  popularPlaylist = signal<AutoPlaylist | null>(null);
  popularPlaylistPage = signal(0);
  popularPlaylistMaxPages = signal(3); // 3 páginas × 6 canciones = 18 canciones

  // Servicio inyectado para guardado instantáneo
  private playlistService = inject(PlaylistService);

  constructor(
    private randomTrackService: RandomTrackService
  ) {}

  ngOnInit(): void {
    this.generateAutoPlaylists();
    this.loadPopularPlaylist();
  }

  // Cargar playlist popular persistente
  loadPopularPlaylist() {
    this.randomTrackService.getRandomSongs(18).subscribe({
      next: (response) => {
        const popularSongs = response.songs;
        
        this.popularPlaylist.set({
          name: 'Mix Popular',
          description: 'Las canciones más populares de la plataforma',
          songs: popularSongs,
          isGenerated: true,
          isPersistent: true,
          currentPage: 0
        });
      },
      error: (err) => {
        console.error('Error loading popular playlist:', err);
      }
    });
  }

  // Navegación para playlist popular
  nextPopularPage() {
    const nextPage = this.popularPlaylistPage() + 1;
    if (nextPage < this.popularPlaylistMaxPages()) {
      this.popularPlaylistPage.set(nextPage);
    }
  }

  prevPopularPage() {
    const prevPage = this.popularPlaylistPage() - 1;
    if (prevPage >= 0) {
      this.popularPlaylistPage.set(prevPage);
    }
  }

  // Obtener canciones de la página actual del Mix Popular
  getCurrentPopularSongs(): Song[] {
    const playlist = this.popularPlaylist();
    if (!playlist) return [];
    
    const startIndex = this.popularPlaylistPage() * 6;
    return playlist.songs.slice(startIndex, startIndex + 6);
  }

  // Verificar si se puede navegar en el Mix Popular
  canGoNextPopular(): boolean {
    return this.popularPlaylistPage() < this.popularPlaylistMaxPages() - 1;
  }

  canGoPrevPopular(): boolean {
    return this.popularPlaylistPage() > 0;
  }

  generateAutoPlaylists() {
    this.loading.set(true);
    this.error.set(null);

    this.randomTrackService.getRandomSongs(50).subscribe({
      next: (response) => {
        const allSongs = response.songs;
        const genres = this.extractGenres(allSongs);
        this.createGenrePlaylists(genres, allSongs);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading songs:', err);
        this.error.set('No se pudieron cargar las canciones para generar playlists.');
        this.loading.set(false);
      }
    });
  }

  private extractGenres(songs: Song[]): string[] {
    const genres = new Set<string>();
    
    songs.forEach(song => {
      if (song.genre_song && song.genre_song.trim()) {
        const genre = song.genre_song.trim();
        genres.add(genre);
      }
    });

    if (genres.size === 0) {
      return ['Rock', 'Pop', 'Jazz', 'Electrónica', 'Hip Hop'];
    }

    return Array.from(genres).slice(0, 6); // Reducido a 6 para dejar espacio al Mix Popular
  }

  private createGenrePlaylists(genres: string[], allSongs: Song[]) {
    const autoPlaylists: AutoPlaylist[] = [];

    // Playlists por género
    genres.forEach(genre => {
      const genreSongs = allSongs.filter(song => 
        song.genre_song && song.genre_song.toLowerCase().includes(genre.toLowerCase())
      ).slice(0, 6); // Solo 6 canciones por género

      if (genreSongs.length > 0) {
        autoPlaylists.push({
          name: `${genre} Mix`,
          description: `Lo mejor del género ${genre}`,
          songs: genreSongs,
          isGenerated: true,
          genre: genre
        });
      }
    });

    // Mix Variado (no persistente)
    const varietySongs = [...allSongs]
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);

    autoPlaylists.push({
      name: 'Mix Variado',
      description: 'Una selección diversa de todos los géneros',
      songs: varietySongs,
      isGenerated: true
    });

    this.playlists.set(autoPlaylists);
  }

  // Abrir vista detallada de playlist
  openPlaylist(playlist: AutoPlaylist) {
    this.selectedPlaylist.set(playlist);
    this.showPlaylistDetail.set(true);
  }

  // Abrir vista detallada del Mix Popular
  openPopularPlaylist() {
    if (this.popularPlaylist()) {
      this.selectedPlaylist.set(this.popularPlaylist()!);
      this.showPlaylistDetail.set(true);
    }
  }

  // Cerrar vista detallada
  closePlaylist() {
    this.showPlaylistDetail.set(false);
    this.selectedPlaylist.set(null);
  }

  // Reproducir toda la playlist
  playPlaylist(playlist: AutoPlaylist, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    console.log('Reproducir playlist:', playlist.name, playlist.songs);
  }

  // Reproducir Mix Popular
  playPopularPlaylist(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const popular = this.popularPlaylist();
    if (popular) {
      console.log('Reproducir Mix Popular:', popular.songs);
    }
  }

  // ========== MÉTODOS NUEVOS PARA GUARDADO INSTANTÁNEO ==========
  
  // Método modificado para guardar playlist con canciones
  saveAsPlaylist(playlist: AutoPlaylist, event: Event) {
    event.stopPropagation();
    
    // Verificar si ya está guardada
    if (this.isPlaylistSaved(playlist.name)) {
      console.log('Playlist ya guardada:', playlist.name);
      return;
    }

    // Marcar como guardando instantáneamente
    this.creatingPlaylist.set(playlist.name);

    // Preparar datos con las canciones
    const playlistData = {
      name_playlist: playlist.name,
      is_public: true,
      songs: playlist.songs.map(song => ({
        id: song.id,
        name_song: song.name_song,
        artist_song: song.artist_song,
        album_song: song.album_song || '',
        art_work_song: song.art_work_song || '',
        genre_song: song.genre_song || '',
        url_song: song.url_song || '' // Añadir url_song si existe
      }))
    };

    console.log('Enviando playlist con canciones:', playlistData);

    // Simulación de guardado instantáneo
    setTimeout(() => {
      console.log('Playlist guardada instantáneamente:', playlist.name);
    }, 0);

    // Llamada real al servidor (en segundo plano)
    this.playlistService.createPlaylist(playlistData).subscribe({
      next: (response: any) => {
        console.log('Playlist confirmada en servidor:', response);
        this.creatingPlaylist.set(null);
        this.error.set(null);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error creando playlist:', err);
        this.creatingPlaylist.set(null);
        this.error.set('Error al sincronizar la playlist');
      }
    });
  }

  // Verificar si una playlist ya está guardada
  isPlaylistSaved(playlistName: string): boolean {
    // Usamos el servicio para verificar el estado
    return this.playlistService.isPlaylistSaved(playlistName);
  }

  // Obtener el estado de guardado de una playlist
  getPlaylistSaveState(playlistName: string): string {
    if (this.creatingPlaylist() === playlistName) {
      return 'saving';
    }
    return this.playlistService.isPlaylistSaved(playlistName) ? 'saved' : 'unsaved';
  }

  // Modificar el template para usar el estado de guardado
  getSaveButtonIcon(playlistName: string): string {
    const state = this.getPlaylistSaveState(playlistName);
    
    switch (state) {
      case 'saving':
        return 'bi-arrow-repeat loading';
      case 'saved':
        return 'bi-check-circle-fill';
      default:
        return 'bi-plus-circle';
    }
  }

  getSaveButtonText(playlistName: string): string {
    const state = this.getPlaylistSaveState(playlistName);
    
    switch (state) {
      case 'saving':
        return 'Guardando...';
      case 'saved':
        return 'Guardada';
      default:
        return 'Guardar Playlist';
    }
  }

  // ========== FIN MÉTODOS NUEVOS ==========

  // Reproducir canción individual
  playSong(song: Song, event: Event) {
    event.stopPropagation();
    console.log('Reproducir canción:', song);
  }

  // Cache busting para imágenes
  noImg = new Set<number>();
  
  bust(id: number) {
    return `?v=${id}`;
  }

  onImgError(ev: Event, song: Song) {
    this.noImg.add(song.id);
    console.warn('IMG ERROR:', song.art_work_song, (ev.target as HTMLImageElement).currentSrc);
  }

  getCoverImage(playlist: AutoPlaylist): string {
    if (playlist.songs.length > 0 && playlist.songs[0].art_work_song) {
      return playlist.songs[0].art_work_song;
    }
    return '';
  }

  getPopularCoverImage(): string {
    const popular = this.popularPlaylist();
    if (popular && popular.songs.length > 0 && popular.songs[0].art_work_song) {
      return popular.songs[0].art_work_song;
    }
    return '';
  }

  getSongCount(playlist: AutoPlaylist): string {
    const count = playlist.songs.length;
    return count === 1 ? '1 canción' : `${count} canciones`;
  }

  getPopularSongCount(): string {
    const popular = this.popularPlaylist();
    if (!popular) return '0 canciones';
    const count = popular.songs.length;
    return count === 1 ? '1 canción' : `${count} canciones`;
  }

  // Formatear duración
  formatDuration(seconds: number): string {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}