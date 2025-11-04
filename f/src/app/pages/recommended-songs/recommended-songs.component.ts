import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RecommendedSongsService } from '../../services/recommended-songs.service';
import { AuthService } from '../../services/auth.service';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { HttpClient } from '@angular/common/http';
import { PlayerService } from '../../services/player.service';
import { Track } from '../../models/track/track.model';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [CommonModule, MediaUrlPipe],
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

  constructor(
    private recommendedSongsService: RecommendedSongsService,
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

    // Primero verificamos el historial del usuario
    this.recommendedSongsService.getUserHistory().subscribe({
      next: (historyResponse: any) => {
        const userHistory = historyResponse.data || [];
        
        // Si no tiene historial, mostramos mensaje
        if (userHistory.length === 0) {
          console.log('Usuario sin historial de escucha');
          this.recommendations.set([]);
          this.loading.set(false);
          return;
        }

        // Si tiene historial, generamos recomendaciones
        this.generateRecommendationsFromHistory(userHistory);
      },
      error: (historyError) => {
        console.error('Error cargando historial:', historyError);
        this.error.set('Error al cargar tu historial de música.');
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
        console.error('Error cargando canciones:', songsError);
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

    console.log('Géneros preferidos del usuario:', topGenres);

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
      artwork: song.cover,
      url: song.audioFile
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
    console.warn('Error cargando imagen:', song.cover);
  }
}