// components/auto-playlist/auto-playlist.component.ts
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RandomTrackService, Song } from '../../services/random-track.service';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { HttpErrorResponse } from '@angular/common/http';
import { PlaylistService } from '../../services/playlist.service';
import { PlaylistEventService } from '../../services/playlist-event.service';

interface AutoPlaylist {
  id?: number;
  name: string;
  description: string;
  songs: Song[];
  isGenerated: boolean;
  genre?: string;
  isPersistent?: boolean;
  currentPage?: number;
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
  
  selectedPlaylist = signal<AutoPlaylist | null>(null);
  showPlaylistDetail = signal(false);

  popularPlaylist = signal<AutoPlaylist | null>(null);
  popularPlaylistPage = signal(0);
  popularPlaylistMaxPages = signal(3);

  // MEJORA: Señales para paginación dinámica
  playlistPage = signal(0);
  playlistMaxPages = signal(0); // Cambiado a 0 para cálculo dinámico

  private playlistService = inject(PlaylistService);
  private playlistEventService = inject(PlaylistEventService);

  constructor(
    private randomTrackService: RandomTrackService
  ) {}

  ngOnInit(): void {
    this.generateAutoPlaylists();
    this.loadPopularPlaylist();
  }

  // MEJORA: Métodos para paginación dinámica
  nextPage() {
    const nextPage = this.playlistPage() + 1;
    if (nextPage < this.playlistMaxPages()) {
      this.playlistPage.set(nextPage);
    }
  }

  prevPage() {
    const prevPage = this.playlistPage() - 1;
    if (prevPage >= 0) {
      this.playlistPage.set(prevPage);
    }
  }

  getCurrentPlaylists(): AutoPlaylist[] {
    const allPlaylists = this.playlists();
    const startIndex = this.playlistPage() * 6;
    return allPlaylists.slice(startIndex, startIndex + 6);
  }

  canGoNext(): boolean {
    return (this.playlistPage() + 1) * 6 < this.playlists().length;
  }

  canGoPrev(): boolean {
    return this.playlistPage() > 0;
  }

  // MEJORA: Método para actualizar páginas dinámicamente
  private updateMaxPages() {
    const totalPlaylists = this.playlists().length;
    this.playlistMaxPages.set(Math.ceil(totalPlaylists / 6));
  }

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

  getCurrentPopularSongs(): Song[] {
    const playlist = this.popularPlaylist();
    if (!playlist) return [];
    
    const startIndex = this.popularPlaylistPage() * 6;
    return playlist.songs.slice(startIndex, startIndex + 6);
  }

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

    return Array.from(genres).slice(0, 6);
  }

  private createGenrePlaylists(genres: string[], allSongs: Song[]) {
    const autoPlaylists: AutoPlaylist[] = [];

    // 1. Crear mix por género
    genres.forEach(genre => {
      const genreSongs = allSongs.filter(song => 
        song.genre_song && song.genre_song.toLowerCase().includes(genre.toLowerCase())
      ).slice(0, 6);

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

    // 2. Crear dos mix variados con canciones diferentes
    this.createVariedMixes(allSongs, autoPlaylists);

    this.playlists.set(autoPlaylists);
    this.updateMaxPages(); // ✅ MEJORA: Actualizar páginas dinámicamente
    console.log(`🎵 Se crearon ${autoPlaylists.length} playlists (${this.playlistMaxPages()} páginas)`);
  }

  // 🚀 MÉTODO ROBUSTO PARA CREAR DOS MIX VARIADOS
  private createVariedMixes(allSongs: Song[], autoPlaylists: AutoPlaylist[]) {
    // Mezclar todas las canciones
    const shuffledSongs = [...allSongs].sort(() => Math.random() - 0.5);
    
    // Primer mix variado - primeras 6 canciones
    const varietySongs1 = shuffledSongs.slice(0, 6);
    
    autoPlaylists.push({
      name: 'Mix Más Variado',
      description: 'Una selección diversa de todos los géneros',
      songs: varietySongs1,
      isGenerated: true
    });

    // Segundo mix variado - siguientes 6 canciones (diferentes)
    const varietySongs2 = shuffledSongs.slice(6, 12);
    
    // Si no hay suficientes canciones diferentes, completar con las primeras
    if (varietySongs2.length < 6) {
      const needed = 6 - varietySongs2.length;
      varietySongs2.push(...shuffledSongs.slice(0, needed));
    }

    autoPlaylists.push({
      name: 'Mix para Todo Momento', 
      description: 'La combinación perfecta para cualquier ocasión',
      songs: varietySongs2,
      isGenerated: true
    });
  }

  openPlaylist(playlist: AutoPlaylist) {
    this.selectedPlaylist.set(playlist);
    this.showPlaylistDetail.set(true);
  }

  openPopularPlaylist() {
    if (this.popularPlaylist()) {
      this.selectedPlaylist.set(this.popularPlaylist()!);
      this.showPlaylistDetail.set(true);
    }
  }

  closePlaylist() {
    this.showPlaylistDetail.set(false);
    this.selectedPlaylist.set(null);
  }

  playPlaylist(playlist: AutoPlaylist, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    console.log('Reproducir playlist:', playlist.name, playlist.songs);
  }

  playPopularPlaylist(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const popular = this.popularPlaylist();
    if (popular) {
      console.log('Reproducir Mix Popular:', popular.songs);
    }
  }

  saveAsPlaylist(playlist: AutoPlaylist, event: Event) {
    event.stopPropagation();
    
    if (this.isPlaylistSaved(playlist.name)) {
      console.log('Playlist ya guardada:', playlist.name);
      return;
    }

    this.creatingPlaylist.set(playlist.name);

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
        url_song: song.url_song || ''
      }))
    };

    console.log('Enviando playlist con canciones:', playlistData);

    // Simulación de guardado instantáneo
    setTimeout(() => {
      console.log('Playlist guardada instantáneamente:', playlist.name);
    }, 0);

    // Llamada real al servidor
    this.playlistService.createPlaylist(playlistData).subscribe({
      next: (response: any) => {
        console.log('Playlist confirmada en servidor:', response);
        this.creatingPlaylist.set(null);
        this.error.set(null);
        
        // Emitir evento después de guardar exitosamente
        this.playlistEventService.notifyPlaylistSaved();
        console.log('🔄 Evento de playlist guardada emitido');
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error creando playlist:', err);
        this.creatingPlaylist.set(null);
        this.error.set('Error al sincronizar la playlist');
      }
    });
  }

  isPlaylistSaved(playlistName: string): boolean {
    return this.playlistService.isPlaylistSaved(playlistName);
  }

  getPlaylistSaveState(playlistName: string): string {
    if (this.creatingPlaylist() === playlistName) {
      return 'saving';
    }
    return this.playlistService.isPlaylistSaved(playlistName) ? 'saved' : 'unsaved';
  }

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

  playSong(song: Song, event: Event) {
    event.stopPropagation();
    console.log('Reproducir canción:', song);
  }

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

  formatDuration(seconds: number): string {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}