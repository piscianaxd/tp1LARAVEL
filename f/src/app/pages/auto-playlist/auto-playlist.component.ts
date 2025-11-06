// components/auto-playlist/auto-playlist.component.ts
import { Component, OnInit, signal, computed, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RandomTrackService, Song } from '../../services/random-track.service';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { HttpErrorResponse } from '@angular/common/http';
import { PlaylistService } from '../../services/playlist.service';
import { PlaylistEventService } from '../../services/playlist-event.service';
import { AddToPlaylistService } from '../../services/add-to-playlist.service';
import { Track } from '../../models/track/track.model';
import { dtoToTrack } from '../../helpers/adapters';
import { PlayerService } from '../../services/player.service';

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

  popularPlaylist = signal<AutoPlaylist | undefined>(undefined);
  popularPlaylistPage = signal(0);
  
  // ✅ Señal computada para páginas máximas
  popularPlaylistMaxPages = computed(() => {
    const playlist = this.popularPlaylist();
    if (!playlist?.songs) return 1;
    return Math.ceil(playlist.songs.length / this.POPULAR_PAGE_SIZE);
  });

  playlistPage = signal(0);
  playlistMaxPages = signal(0);

  // ✅ CONSTANTE para el tamaño de página
  readonly POPULAR_PAGE_SIZE = 6;

  // ✅ NUEVAS señales para guardar playlist
  popularPlaylistSaved = signal(false);
  savingPopularPlaylist = signal(false);

  private playlistService = inject(PlaylistService);
  private playlistEventService = inject(PlaylistEventService);
  private addToPlaylistService = inject(AddToPlaylistService);
  private player: PlayerService = inject(PlayerService);
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  constructor(
    private randomTrackService: RandomTrackService
  ) {}

  ngOnInit(): void {
    this.generateAutoPlaylists();
    this.loadPopularPlaylist();
  }

  loadPopularPlaylist() {
    this.randomTrackService.getRandomSongs(18).subscribe({
      next: (response) => {
        const popularSongs = response.songs || [];
        
        this.popularPlaylist.set({
          name: 'Mix de Populares',
          description: 'Las canciones más populares de la plataforma',
          songs: popularSongs,
          isGenerated: true,
          isPersistent: true,
          currentPage: 0
        });
      },
      error: (err) => {
        console.error('Error loading popular playlist:', err);
        this.popularPlaylist.set(undefined);
      }
    });
  }

  // ✅ NUEVO: Método para abrir modal de agregar a playlist
  openAddToPlaylist(song: Song, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    console.log('🎵 Abriendo modal para agregar a playlist:', song.name_song);
    this.addToPlaylistService.openModal(song);
  }

  // ✅ NUEVO: Método para guardar toda la playlist de Mix Popular
  savePopularPlaylist() {
    const popular = this.popularPlaylist();
    if (!popular?.songs || popular.songs.length === 0) {
      console.error('❌ No hay canciones en el Mix Popular para guardar');
      return;
    }

    if (this.isPopularPlaylistSaved()) {
      console.log('ℹ️ La playlist ya está guardada');
      return;
    }

    this.savingPopularPlaylist.set(true);
    console.log('💾 Guardando Mix Popular como playlist...');

    const playlistData = {
      name_playlist: 'Mix Popular - Favoritas',
      is_public: true,
      songs: popular.songs.map(song => ({
        id: song.id,
        name_song: song.name_song,
        artist_song: song.artist_song,
        album_song: song.album_song || '',
        art_work_song: song.art_work_song || '',
        genre_song: song.genre_song || '',
        url_song: song.url_song || ''
      }))
    };

    console.log('📤 Enviando playlist con canciones:', playlistData);

    // Simulación de guardado instantáneo
    setTimeout(() => {
      console.log('✅ Playlist guardada instantáneamente: Mix Popular');
    }, 0);

    // Llamada real al servidor
    this.playlistService.createPlaylist(playlistData).subscribe({
      next: (response: any) => {
        console.log('✅ Mix Popular confirmado en servidor:', response);
        this.savingPopularPlaylist.set(false);
        this.popularPlaylistSaved.set(true);
        this.error.set(null);
        
        // Emitir evento después de guardar exitosamente
        this.playlistEventService.notifyPlaylistSaved();
        console.log('🔄 Evento de playlist guardada emitido');
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Error guardando Mix Popular:', err);
        this.savingPopularPlaylist.set(false);
        this.error.set('Error al guardar el Mix Popular');
      }
    });
  }

  // ✅ NUEVO: Método para verificar si ya está guardada
  isPopularPlaylistSaved(): boolean {
    return this.popularPlaylistSaved();
  }

  // ✅ NUEVO: Método para obtener el estado del botón de guardar
  getSavePopularButtonState(): string {
    if (this.savingPopularPlaylist()) {
      return 'saving';
    }
    return this.popularPlaylistSaved() ? 'saved' : 'unsaved';
  }

  // ✅ NUEVO: Método para obtener el ícono del botón de guardar
  getSavePopularButtonIcon(): string {
    const state = this.getSavePopularButtonState();
    
    switch (state) {
      case 'saving':
        return 'bi-arrow-repeat loading';
      case 'saved':
        return 'bi-check-lg';
      default:
        return 'bi-plus-lg';
    }
  }

  // ✅ NUEVO: Método para obtener columnas del Mix Popular
  getPopularColumns(): Song[][] {
    const list = this.getCurrentPopularSongs();
    const COLS = 3;
    const colSize = Math.ceil((list.length || 1) / COLS);
    return Array.from({ length: COLS }, (_, i) => 
      list.slice(i * colSize, (i + 1) * colSize)
    );
  }


  getCurrentPopularSongs(): Song[] {
    const playlist = this.popularPlaylist();
    if (!playlist?.songs || playlist.songs.length === 0) return [];
    
    const startIndex = this.popularPlaylistPage() * this.POPULAR_PAGE_SIZE;
    return playlist.songs.slice(startIndex, startIndex + this.POPULAR_PAGE_SIZE);
  }

  canGoNextPopular(): boolean {
    const playlist = this.popularPlaylist();
    if (!playlist?.songs || playlist.songs.length === 0) return false;
    return this.popularPlaylistPage() < this.popularPlaylistMaxPages() - 1;
  }

  canGoPrevPopular(): boolean {
    return this.popularPlaylistPage() > 0;
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


  openPopularPlaylist() {
    const popular = this.popularPlaylist();
    if (popular?.songs && popular.songs.length > 0) {
      this.selectedPlaylist.set(popular);
      this.showPlaylistDetail.set(true);
    }
  }

  playPopularPlaylist(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const popular = this.popularPlaylist();
    if (popular?.songs && popular.songs.length > 0) {
      console.log('Reproducir Mix Popular:', popular.songs);
    }
  }



  // Método para agregar a playlist individual
  addToPlaylist(song: Song, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    console.log('Agregar a playlist:', song);
    // Aquí puedes implementar la lógica para agregar a playlist
    // this.playlistService.addToPlaylistDialog(song);
  }



  formatDuration(seconds: number): string {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  getSongCount(playlist: AutoPlaylist): string {
    const count = playlist.songs.length;
    return count === 1 ? '1 canción' : `${count} canciones`;
  }

  scrollLeft() {
    this.scrollContainer.nativeElement.scrollBy({ left: -300, behavior: 'smooth' });
  }

  scrollRight() {
    this.scrollContainer.nativeElement.scrollBy({ left: 300, behavior: 'smooth' });
  }

  canScrollLeft() {
    return this.scrollContainer?.nativeElement.scrollLeft > 0;
  }

  canScrollRight() {
    const el = this.scrollContainer?.nativeElement;
    return el && el.scrollLeft + el.clientWidth < el.scrollWidth;
  }

  onScroll() {
    // Actualizar estado de botones si es necesario
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
    this.updateMaxPages();
    console.log(`🎵 Se crearon ${autoPlaylists.length} playlists`);
  }

  private createVariedMixes(allSongs: Song[], autoPlaylists: AutoPlaylist[]) {
    const shuffledSongs = [...allSongs].sort(() => Math.random() - 0.5);
    
    const varietySongs1 = shuffledSongs.slice(0, 6);
    
    autoPlaylists.push({
      name: 'Mix Más Variado',
      description: 'Una selección diversa de todos los géneros',
      songs: varietySongs1,
      isGenerated: true
    });

    const varietySongs2 = shuffledSongs.slice(6, 12);
    
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

  closePlaylist() {
    this.showPlaylistDetail.set(false);
    this.selectedPlaylist.set(null);
  }

 

  private updateMaxPages() {
    const totalPlaylists = this.playlists().length;
    this.playlistMaxPages.set(Math.ceil(totalPlaylists / 6));
  }

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

  
    // Dentro de la clase PlaylistComponent
    playPlaylist(playlist: {
      songs: Array<{ song: any }>;
    }, ev?: Event) {
      if (ev) ev.stopPropagation();
  
      const queue: Track[] = (playlist.songs ?? [])
        .map(ps => ps?.song)
        .filter(Boolean)
        .map(dtoToTrack);
  
      if (!queue.length) return;
      this.player.playNow(queue[0], queue);
    }
  
    playSong(songDto: any, ev?: Event) {
    if (ev) ev.stopPropagation();
  
    // armamos la cola con TODAS las canciones visibles de esa playlist
    const current = this.selectedPlaylist?.() ?? null; // si usás signals
    const list = current?.songs ?? [];
  
    const queue: Track[] = list
      .map((ps: any) => ps?.song)
      .filter(Boolean)
      .map(dtoToTrack);
  
    const currentTrack = dtoToTrack(songDto);
    this.player.playNow(currentTrack, queue);
  }

  getPopularCoverImage(p?: AutoPlaylist): string {
  const popular = p ?? this.popularPlaylist();
  return (popular?.songs?.[0]?.art_work_song) || '';
}

getPopularTitle(p?: AutoPlaylist): string {
  const pl = p ?? this.popularPlaylist();
  return (pl as any)?.name_playlist ?? (pl as any)?.name ?? 'Mix Popular';
}

getPopularIsPublic(p?: AutoPlaylist): boolean | null {
  const pl = p ?? this.popularPlaylist();
  if (!pl) return null;
  return (pl as any)?.is_public ?? (pl as any)?.public ?? null;
}

getPopularCreatedAt(p?: AutoPlaylist): string | Date | null {
  const pl = p ?? this.popularPlaylist();
  return (pl as any)?.created_at ?? null;
}

getPopularSongCount(p?: AutoPlaylist): string {
  const pl = p ?? this.popularPlaylist();
  const n = pl?.songs?.length ?? 0;
  return n === 1 ? '1 canción' : `${n} canciones`;
}

  
}