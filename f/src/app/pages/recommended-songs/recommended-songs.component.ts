import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RecommendedSongsService } from '../../services/recommended-songs.service';
import { AuthService } from '../../services/auth.service';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { TrackContextComponent } from '../track-context/track-context.component';
import { AddToPlaylistService } from '../../services/add-to-playlist.service';
import { HttpClient } from '@angular/common/http';
import { PlayerService } from '../../services/player.service';
import { Track } from '../../models/track/track.model';
import { Song } from '../../services/mixes.service';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [CommonModule, MediaUrlPipe, TrackContextComponent],
  templateUrl: './recommended-songs.component.html',
  styleUrls: ['./recommended-songs.component.css']
})
export class RecommendationsComponent implements OnInit, AfterViewInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  
  loading = signal(true);
  error = signal<string | null>(null);
  recommendations = signal<any[]>([]);
  currentUser = signal<any>(null);

  // Control de flechas de navegación
  canScrollLeft = signal(false);
  canScrollRight = signal(false);

  // Control de imágenes fallidas
  failedImages = new Set<string>();

  //señal para el menú contextual
  showContextMenu = signal(false);
  contextMenuPosition = signal({ x: 0, y: 0 });
  selectedTrackForContextMenu = signal<Song | null>(null);

  constructor(
    private recommendedSongsService: RecommendedSongsService,
    private addToPlaylistService: AddToPlaylistService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private playerService: PlayerService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadCurrentUser();
    this.loadUserRecommendations();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.checkScroll(), 100);
  }

  loadCurrentUser(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      this.currentUser.set(user);
    }
  }

  // Método principal para cargar recomendaciones
  loadUserRecommendations(): void {
    this.loading.set(true);

    const user = this.currentUser();
    if (!user || !user.id) {
      this.error.set('Usuario no identificado');
      this.loading.set(false);
      return;
    }

    // PRIMERO: Intentar con recommended-songs
    this.recommendedSongsService.getTopGenres(user.id).subscribe({
      next: (topGenresResponse: any) => {
        const topGenres = topGenresResponse.topGenres || [];
        
        if (topGenres.length === 0) {
          // FALLBACK: si no hay géneros en recommended-songs, usar historial
          this.fallbackToHistoryMethod();
        } else {
          // Usar los géneros de la tabla recommended-songs
          this.generateRecommendationsFromTopGenres(topGenres);
        }
      },
      error: (error) => {
        // FALLBACK en caso de error
        this.fallbackToHistoryMethod();
      }
    });
  }

  // Método para generar recomendaciones desde géneros top
  private generateRecommendationsFromTopGenres(topGenres: string[]): void {
    this.recommendedSongsService.getAllSongs().subscribe({
      next: (songsResponse: any) => {
        const allSongs = songsResponse.songs || [];
        
        // Obtener historial para excluir canciones ya escuchadas
        this.recommendedSongsService.getUserHistory().subscribe({
          next: (historyResponse: any) => {
            const userHistory = historyResponse.data || [];
            const heardSongIds = userHistory.map((item: any) => item.cancion.id);

            // Filtrar canciones no escuchadas de los géneros top
            let recommendedSongs = allSongs.filter((song: any) => {
              const songGenre = song.genre_song.toLowerCase();
              return !heardSongIds.includes(song.id) && topGenres.includes(songGenre);
            });

            // Mezclar y limitar a 10 canciones
            recommendedSongs = this.shuffleArray(recommendedSongs).slice(0, 10);

            // Formatear para el frontend
            const formattedRecommendations = recommendedSongs.map((song: any) => ({
              id: song.id,
              title: song.name_song,
              artist: song.artist_song,
              genre: song.genre_song,
              album: song.album_song,
              audioFile: song.url_song,
              cover: song.art_work_song
            }));

            this.recommendations.set(formattedRecommendations);
            this.loading.set(false);
            setTimeout(() => this.checkScroll(), 100);
          },
          error: (historyError) => {
            this.error.set('Error al cargar tu historial.');
            this.loading.set(false);
          }
        });
      },
      error: (songsError) => {
        this.error.set('Error al cargar el catálogo de canciones.');
        this.loading.set(false);
      }
    });
  }

  // Método fallback (usar historial cuando recommended-songs no tiene datos)
  private fallbackToHistoryMethod(): void {
    this.recommendedSongsService.getUserHistory().subscribe({
      next: (historyResponse: any) => {
        const userHistory = historyResponse.data || [];
        
        if (userHistory.length === 0) {
          this.recommendations.set([]);
          this.loading.set(false);
          return;
        }

        this.generateRecommendationsFromHistory(userHistory);
      },
      error: (historyError) => {
        this.error.set('Error al cargar tus preferencias.');
        this.loading.set(false);
      }
    });
  }

  // Generar recomendaciones basadas en el historial
  generateRecommendationsFromHistory(userHistory: any[]): void {
    // Cargamos todas las canciones para poder recomendar
    this.recommendedSongsService.getAllSongs().subscribe({
      next: (songsResponse: any) => {
        const allSongs = songsResponse.songs || [];
        const recommendations = this.generateSmartRecommendations(allSongs, userHistory);
        this.recommendations.set(recommendations);
        this.loading.set(false);
        // Revisar scroll después de cargar las recomendaciones
        setTimeout(() => this.checkScroll(), 100);
      },
      error: (songsError) => {
        this.error.set('Error al cargar el catálogo de canciones.');
        this.loading.set(false);
      }
    });
  }

  // Algoritmo de recomendaciones inteligentes
  generateSmartRecommendations(allSongs: any[], userHistory: any[]): any[] {
    if (allSongs.length === 0) return [];

    // 1. Extraer IDs de canciones ya escuchadas
    const heardSongIds = userHistory.map((item: any) => item.cancion.id);

    // 2. Analizar géneros más escuchados
    const genreCounts: { [key: string]: number } = {};
    userHistory.forEach((item: any) => {
      const genre = item.cancion.genero.toLowerCase();
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });

    // 3. Ordenar géneros por popularidad
    const sortedGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([genre]) => genre);

    const topGenres = sortedGenres.slice(0, 2); // Top 2 géneros

    // 4. Filtrar canciones no escuchadas de los géneros preferidos
    let recommendedSongs = allSongs.filter((song: any) => {
      const songGenre = song.genre_song.toLowerCase();
      return !heardSongIds.includes(song.id) && topGenres.includes(songGenre);
    });

    // 5. Mezclar y limitar a 10 canciones
    recommendedSongs = this.shuffleArray(recommendedSongs).slice(0, 10);

    // 6. Formatear para el frontend
    return recommendedSongs.map((song: any) => ({
      id: song.id,
      title: song.name_song,
      artist: song.artist_song,
      genre: song.genre_song,
      album: song.album_song,
      audioFile: song.url_song,
      cover: song.art_work_song
    }));
  }

  // Mezclar array
  shuffleArray(array: any[]): any[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // ===== MÉTODOS PARA NAVEGACIÓN HORIZONTAL =====

  scrollLeft(): void {
    if (this.scrollContainer) {
      const container = this.scrollContainer.nativeElement;
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  }

  scrollRight(): void {
    if (this.scrollContainer) {
      const container = this.scrollContainer.nativeElement;
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  onScroll(): void {
    this.checkScroll();
  }

  private checkScroll(): void {
    if (!this.scrollContainer) return;
    
    const container = this.scrollContainer.nativeElement;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    this.canScrollLeft.set(scrollLeft > 0);
    this.canScrollRight.set(scrollLeft < scrollWidth - clientWidth - 10);
  }

  // ===== FUNCIÓN DE CONVERSIÓN =====
  private songToTrack(song: any): Track {
    return {
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      art_work_songs: song.cover,
      url: song.audioFile,
      genre: song.genre
    };
  }

  // ===== MÉTODO PARA SELECCIONAR CANCIÓN =====
  selectSong(song: any): void {
    // Usar el PlayerService real
    if (this.isSelected(song)) {
      // Si ya está seleccionada, pausar o reanudar
      this.playerService.togglePlayPause();
    } else {
      // Nueva canción seleccionada - convertir al formato Track
      const track = this.songToTrack(song);
      
      // Reproducir con PlayerService
      this.playerService.playNow(track);
      
      // ✅ NOTA: Ya NO necesitamos llamar a incrementUserGenre aquí
      // porque el PlayerService ahora lo hace automáticamente
    }
  }

  // ===== MÉTODO PARA VERIFICAR SELECCIÓN =====
  isSelected(song: any): boolean {
    // Verificar contra el reproductor real
    const currentSong = this.playerService.current();
    return currentSong?.id === song.id;
  }

  handleImageError(event: any, song: any): void {
    // Marcar esta imagen como fallida
    this.failedImages.add(song.cover);
    // Ocultar la imagen problemática
    const img = event.target;
    img.style.display = 'none';
  }
  // Agrega este método en tu clase RecommendationsComponent
  playSong(song: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    // Convertir la canción al formato Track
    const track: Track = {
      id: song.id,
      title: song.title || song.name_song,
      artist: song.artist || song.artist_song,
      album: song.album || song.album_song,
      art_work_songs: song.cover || song.art_work_song,
      url: song.audioFile || song.url_song,
      genre: song.genre || song.genre_song
    };

    // Crear una queue con todas las recomendaciones
    const queue: Track[] = this.recommendations().map(rec => ({
      id: rec.id,
      title: rec.title || rec.name_song,
      artist: rec.artist || rec.artist_song,
      album: rec.album || rec.album_song,
      art_work_songs: rec.cover || rec.art_work_song,
      url: rec.audioFile || rec.url_song,
      genre: rec.genre || rec.genre_song
    }));

    // Reproducir la canción seleccionada con toda la queue
    this.playerService.playNow(track, queue);
  }
    // Métodos para el menú contextual
    onTrackContextMenu(event: MouseEvent, song: Song) {
      event.preventDefault();
      event.stopPropagation();

      this.selectedTrackForContextMenu.set(song);
      this.contextMenuPosition.set({ x: event.clientX, y: event.clientY });
      this.showContextMenu.set(true);
      
      setTimeout(() => {
        document.addEventListener('click', this.closeContextMenuOnClickOutside.bind(this));
        document.addEventListener('contextmenu', this.closeContextMenuOnRightClick.bind(this));
      });
    }
  
    addToPlaylist(song: Song, event: Event): void {
      event.stopPropagation(); // Importante para evitar que se propague el click
  
      this.addToPlaylistService.openModal({
        id: song.id,
          name_song: song.name_song,
          artist_song: song.artist_song,
          album_song: song.album_song,
          art_work_song: song.art_work_song
        });
      }
  
    private closeContextMenuOnClickOutside(event: MouseEvent) {
      const contextMenu = document.querySelector('.context-menu');
      if (contextMenu && !contextMenu.contains(event.target as Node)) {
        this.closeContextMenu();
        this.removeEventListeners();
      }
    }
  
    private closeContextMenuOnRightClick() {
      this.closeContextMenu();
      this.removeEventListeners();
    }
  
    private removeEventListeners() {
      document.removeEventListener('click', this.closeContextMenuOnClickOutside.bind(this));
      document.removeEventListener('contextmenu', this.closeContextMenuOnRightClick.bind(this));
    }
  
    closeContextMenu() {
      this.showContextMenu.set(false);
      this.selectedTrackForContextMenu.set(null);
      this.removeEventListeners();
    }
  
    onContextMenuPlay() {
      const song = this.selectedTrackForContextMenu();
      if (song) {
        this.playSong(song, new Event('click'));
      }
      this.closeContextMenu();
    }
  
    onContextMenuAddToPlaylist() {
      const song = this.selectedTrackForContextMenu();
      if (song) {
        this.addToPlaylistService.openModal({
          id: song.id,
          name_song: song.name_song,
          artist_song: song.artist_song,
          album_song: song.album_song,
          art_work_song: song.art_work_song,
        });
      }
      this.closeContextMenu();
    }
}