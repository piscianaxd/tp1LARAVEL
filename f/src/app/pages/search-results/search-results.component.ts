import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SearchService } from '../../services/search.service';
import { Subscription } from 'rxjs';
import { PlayerService } from '../../services/player.service';
import { Track } from '../../models/track/track.model';
import { songToTrack, isSongDto, SongDto } from '../../helpers/adapters';
import { SearchableItem } from '../../services/search.service';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css']
})
export class SearchResultsComponent implements OnInit, OnDestroy {
  songResults: SearchableItem[] = []; // tipado correcto
  playlistResults: any[] = [];
  artistResults: any[] = [];
  showResults = false;
  hasNoResults = false;
  isLoading = false;
  currentSearchTerm: string = '';



  private searchSubscription: Subscription = new Subscription();

  constructor(public searchService: SearchService, private player: PlayerService
   ) {}


  play(item: SearchableItem) {
    // solo canciones válidas (descarta playlists/artistas o canciones incompletas)
    const songs: SongDto[] = this.songResults.filter(isSongDto);

    // si el click fue sobre una canción válida:
    if (isSongDto(item)) {
      const t: Track = songToTrack(item);
      const queue: Track[] = songs.map(songToTrack);
      this.player.playNow(t, queue);
    } else {
      console.warn('El item clickeado no es una canción reproducible.', item);
    }
  }

  playAll() {
    const songs: SongDto[] = this.songResults.filter(isSongDto);
    const q: Track[] = songs.map(songToTrack);
    if (q.length) this.player.playNow(q[0], q);
  }

  ngOnInit() {
    // Escuchar cambios en el término de búsqueda global
    this.searchSubscription.add(
      this.searchService.globalSearchTerm$.subscribe(term => {
        this.currentSearchTerm = term;
        if (term && term.length > 0) {
          this.performSearch(term);
        } else {
          this.closeResults();
        }
      })
    );
  }

  performSearch(term: string) {
    this.isLoading = true;
    this.showResults = true;
    
    // ✅ USAR EL NUEVO MÉTODO DEL SERVICIO
    this.searchService.searchInDatabase(term).subscribe({
      next: (response: any) => {
        // ✅ Asignar datos reales desde los endpoints
        this.songResults = response.songs || [];
        this.playlistResults = response.playlists || [];
        this.artistResults = response.artists || [];
        
        this.hasNoResults = this.songResults.length === 0 && 
                           this.playlistResults.length === 0 && 
                           this.artistResults.length === 0;
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error en búsqueda:', error);
        this.isLoading = false;
        this.hasNoResults = true;
        
        // ✅ Fallback a datos mock si todo falla
        this.useMockDataAsFallback(term);
      }
    });
  }

  private useMockDataAsFallback(term: string) {
    const mockSongs = this.getMockSongs();
    const mockPlaylists = this.getMockPlaylists();
    
    const results = this.searchService.searchMusic(mockSongs, mockPlaylists, term);
    this.songResults = results.songs.slice(0, 5);
    this.playlistResults = results.playlists.slice(0, 5);
    this.artistResults = results.artists.slice(0, 5);
    
    this.hasNoResults = this.songResults.length === 0 && 
                       this.playlistResults.length === 0 && 
                       this.artistResults.length === 0;
  }

  private getMockSongs() {
    return [
      { 
        id: 1, 
        name_song: 'Bohemian Rhapsody', 
        artist_song: 'Queen', 
        album_song: 'A Night at the Opera', 
        genre_song: 'Rock'
      },
      { 
        id: 2, 
        name_song: 'Blinding Lights', 
        artist_song: 'The Weeknd', 
        album_song: 'After Hours', 
        genre_song: 'Pop'
      }
    ];
  }

  private getMockPlaylists() {
    return [
      { 
        id: 1, 
        name_playlist: 'Rock Clásico', 
        is_public: true, 
        song_count: 25
      }
    ];
  }

  searchByArtist(artistName: string) {
    this.searchService.setGlobalSearchTerm(artistName);
  }

  closeResults() {
    this.showResults = false;
    this.isLoading = false;
    this.songResults = [];
    this.playlistResults = [];
    this.artistResults = [];
    this.hasNoResults = false;
    this.currentSearchTerm = '';
  }

  onResultClick() {
    this.closeResults();
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
}