import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // ✅ AGREGAR
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs'; // ✅ AGREGAR forkJoin, of
import { catchError, map } from 'rxjs/operators'; // ✅ AGREGAR

export interface SearchableItem {
  id: number;
  // Campos para Canciones
  name_song?: string;
  artist_song?: string;
  album_song?: string;
  genre_song?: string;
  art_work_song?: string;
  url_song?: string;
  
  // Campos para Playlists
  name_playlist?: string;
  is_public?: boolean;
  user_id?: number;
  
  // Campos para Artistas
  artist_name?: string;
  
  // Campos comunes
  type?: 'song' | 'playlist' | 'artist';
  created_at?: string;
  updated_at?: string;
}

export interface DashboardComponent {
  title: string;
  icon: string;
  description: string;
  route?: string;
  disabled?: boolean;
  type: string;
}

// 🔥 NUEVA INTERFAZ AGREGADA
export interface MusicSearchResults {
  songs: any[];
  playlists: any[];
  artists: any[];
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private currentComponent = new BehaviorSubject<string>('');
  private searchTerm = new BehaviorSubject<string>('');
  private searchData = new BehaviorSubject<any[]>([]);
  private dashboardSearchTerm = new BehaviorSubject<string>('');
  private globalSearchTerm = new BehaviorSubject<string>('');
  
  // 🔥 NUEVO OBSERVABLE AGREGADO
  private musicSearchResults = new BehaviorSubject<MusicSearchResults>({
    songs: [],
    playlists: [],
    artists: []
  });

  // Observables públicos
  currentComponent$ = this.currentComponent.asObservable();
  searchTerm$ = this.searchTerm.asObservable();
  searchData$ = this.searchData.asObservable();
  dashboardSearchTerm$ = this.dashboardSearchTerm.asObservable();
  globalSearchTerm$ = this.globalSearchTerm.asObservable();
  
  // 🔥 NUEVO OBSERVABLE PÚBLICO AGREGADO
  musicSearchResults$ = this.musicSearchResults.asObservable();

  // ✅ AGREGAR HttpClient en el constructor
  constructor(private http: HttpClient) {}

  // Métodos existentes
  setCurrentComponent(component: string) {
    this.currentComponent.next(component);
  }

  setSearchTerm(term: string) {
    this.searchTerm.next(term);
  }

  setSearchData(data: any[]) {
    this.searchData.next(data);
  }

  setGlobalSearchTerm(term: string) {
    this.globalSearchTerm.next(term);
  }

  setDashboardSearchTerm(term: string) {
    this.dashboardSearchTerm.next(term);
  }

  // 🔥 NUEVO MÉTODO AGREGADO
  setMusicSearchResults(results: MusicSearchResults) {
    this.musicSearchResults.next(results);
  }

  clearSearch() {
    this.searchTerm.next('');
  }

  clearDashboardSearch() {
    this.dashboardSearchTerm.next('');
  }

  clearGlobalSearch() {
    this.globalSearchTerm.next('');
  }

  // 🔥 NUEVO MÉTODO AGREGADO
  clearMusicSearchResults() {
    this.musicSearchResults.next({ songs: [], playlists: [], artists: [] });
  }

  // ✅ NUEVO MÉTODO AGREGADO - BÚSQUEDA EN BASE DE DATOS
  searchInDatabase(searchTerm: string): Observable<MusicSearchResults> {
    if (!searchTerm.trim()) {
      return of({ songs: [], playlists: [], artists: [] });
    }

    // Realizar búsquedas en paralelo
    return forkJoin({
      songs: this.searchSongs(searchTerm),
      playlists: this.searchPlaylists(searchTerm),
      artists: this.searchArtists(searchTerm)
    }).pipe(
      catchError(error => {
        console.error('Error en búsqueda:', error);
        return of({ songs: [], playlists: [], artists: [] });
      })
    );
  }

  // ✅ NUEVO MÉTODO - Búsqueda en canciones
  private searchSongs(searchTerm: string): Observable<any[]> {
    return this.http.get<any>(`http://localhost:8000/api/songs`).pipe(
      map(response => {
        // Manejar diferentes estructuras de respuesta
        const songsArray = response.songs || response.data || response || [];
        const normalizedTerm = searchTerm.toLowerCase();
        
        return songsArray.filter((song: any) =>
          song.name_song?.toLowerCase().includes(normalizedTerm) ||
          song.artist_song?.toLowerCase().includes(normalizedTerm) ||
          song.album_song?.toLowerCase().includes(normalizedTerm) ||
          song.genre_song?.toLowerCase().includes(normalizedTerm)
        ).slice(0, 5); // Limitar a 5 resultados
      }),
      catchError(error => {
        console.error('Error buscando canciones:', error);
        return of([]);
      })
    );
  }

  // ✅ NUEVO MÉTODO - Búsqueda en playlists
  private searchPlaylists(searchTerm: string): Observable<any[]> {
    return this.http.get<any>(`http://localhost:8000/api/playlists`).pipe(
      map(response => {
        const playlistsArray = response.playlists || response.data || response || [];
        const normalizedTerm = searchTerm.toLowerCase();
        
        return playlistsArray.filter((playlist: any) =>
          playlist.name_playlist?.toLowerCase().includes(normalizedTerm) ||
          playlist.description?.toLowerCase().includes(normalizedTerm)
        ).slice(0, 5);
      }),
      catchError(error => {
        console.error('Error buscando playlists:', error);
        return of([]);
      })
    );
  }

  // ✅ NUEVO MÉTODO - Búsqueda de artistas (extraídos de las canciones)
  private searchArtists(searchTerm: string): Observable<any[]> {
    return this.http.get<any>(`http://localhost:8000/api/songs`).pipe(
      map(response => {
        const songsArray = response.songs || response.data || response || [];
        const normalizedTerm = searchTerm.toLowerCase();
        const artistsMap = new Map();
        
        songsArray.forEach((song: any) => {
          if (song.artist_song && 
              song.artist_song.toLowerCase().includes(normalizedTerm)) {
            
            if (!artistsMap.has(song.artist_song)) {
              const artistSongs = songsArray.filter((s: any) => 
                s.artist_song === song.artist_song
              );
              
              artistsMap.set(song.artist_song, {
                name: song.artist_song,
                type: 'artist',
                songCount: artistSongs.length,
                image: song.art_work_song || null
              });
            }
          }
        });

        return Array.from(artistsMap.values()).slice(0, 5);
      }),
      catchError(error => {
        console.error('Error buscando artistas:', error);
        return of([]);
      })
    );
  }

  // 🔥 MÉTODO EXISTENTE - BÚSQUEDA DE MÚSICA (LOCAL)
  searchMusic(songs: any[], playlists: any[], searchTerm: string): MusicSearchResults {
    if (!searchTerm.trim()) {
      return { songs: [], playlists: [], artists: [] };
    }

    const normalizedTerm = searchTerm.toLowerCase().trim();
    
    // Buscar en canciones
    const filteredSongs = songs.filter(song => 
      song.name_song?.toLowerCase().includes(normalizedTerm) ||
      song.artist_song?.toLowerCase().includes(normalizedTerm) ||
      song.album_song?.toLowerCase().includes(normalizedTerm) ||
      song.genre_song?.toLowerCase().includes(normalizedTerm)
    );

    // Buscar en playlists
    const filteredPlaylists = playlists.filter(playlist =>
      playlist.name_playlist?.toLowerCase().includes(normalizedTerm)
    );

    // Extraer artistas únicos
    const artistMatches = new Map();
    songs.forEach(song => {
      if (song.artist_song && song.artist_song.toLowerCase().includes(normalizedTerm)) {
        if (!artistMatches.has(song.artist_song)) {
          const artistSongs = songs.filter(s => s.artist_song === song.artist_song);
          artistMatches.set(song.artist_song, {
            name: song.artist_song,
            type: 'artist',
            songCount: artistSongs.length,
            image: artistSongs[0]?.art_work_song || null
          });
        }
      }
    });
    
    const filteredArtists = Array.from(artistMatches.values());

    return {
      songs: filteredSongs,
      playlists: filteredPlaylists,
      artists: filteredArtists
    };
  }

  // Métodos existentes que se mantienen...

  // 🔥 MÉTODO PARA BUSCAR COMPONENTES DEL DASHBOARD
  searchDashboardComponents(components: DashboardComponent[], searchTerm: string): DashboardComponent[] {
    if (!searchTerm) return components;
    
    const normalizedTerm = searchTerm.toLowerCase().trim();
    
    return components.filter(component => 
      component.title.toLowerCase().includes(normalizedTerm) ||
      component.description.toLowerCase().includes(normalizedTerm) ||
      (component.type && component.type.toLowerCase().includes(normalizedTerm))
    );
  }

  // 🔥 MÉTODO MEJORADO - Búsqueda universal por componente
  search<T extends SearchableItem>(items: T[], term: string, componentType: string): T[] {
    if (!term) return items;
    
    const normalizedTerm = term.trim().toLowerCase();
    
    if (!normalizedTerm) return items;
    
    const searchWords = normalizedTerm.split(/\s+/).filter(word => word.length > 0);
    
    if (searchWords.length === 0) return items;
    
    return items.filter(item => {
      const searchableFields = this.getSearchableFields(item, componentType);
      
      const searchableText = searchableFields
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      return searchWords.every(word => {
        const cleanWord = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return searchableText.includes(cleanWord);
      });
    });
  }

  // 🔍 Método para determinar qué campos buscar según el componente
  private getSearchableFields(item: SearchableItem, componentType: string): string[] {
    const fields: string[] = [];

    switch (componentType) {
      case 'songs':
        fields.push(
          item.name_song || '',
          item.artist_song || '',
          item.album_song || '',
          item.genre_song || ''
        );
        break;

      case 'playlists':
        fields.push(
          item.name_playlist || ''
        );
        break;

      case 'artists':
        fields.push(
          item.artist_name || '',
          item.artist_song || ''
        );
        break;

      default:
        // Búsqueda genérica para música
        fields.push(
          item.name_song || '',
          item.artist_song || '',
          item.name_playlist || '',
          item.artist_name || '',
          item.album_song || '',
          item.genre_song || ''
        );
    }

    return fields;
  }

  // 🔥 MÉTODO RÁPIDO - Búsqueda simple por un campo específico
  searchByField<T extends SearchableItem>(
    items: T[], 
    term: string, 
    field: keyof SearchableItem
  ): T[] {
    if (!term) return items;
    
    const normalizedTerm = term.trim().toLowerCase();
    
    return items.filter(item => {
      const fieldValue = item[field];
      if (fieldValue === undefined || fieldValue === null) return false;
      
      return fieldValue.toString().toLowerCase().includes(normalizedTerm);
    });
  }

  // 🔥 MÉTODO PARA BÚSQUEDA AVANZADA CON MÚLTIPLES CAMPOS
  advancedSearch<T extends SearchableItem>(
    items: T[], 
    searchCriteria: Partial<SearchableItem>
  ): T[] {
    return items.filter(item => {
      return Object.entries(searchCriteria).every(([key, value]) => {
        if (value === undefined || value === null || value === '') return true;
        
        const itemValue = item[key as keyof SearchableItem];
        if (itemValue === undefined || itemValue === null) return false;
        
        return itemValue.toString().toLowerCase().includes(value.toString().toLowerCase());
      });
    });
  }
}