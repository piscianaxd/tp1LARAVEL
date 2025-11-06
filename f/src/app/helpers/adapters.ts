import { Track } from '../models/track/track.model';



// ✅ DTO mínimo que el adapter necesita
export interface SongDto {
  id: number;
  name_song: string;
  artist_song: string;
  album_song: string;
  url_song: string;
  art_work_song?: string;
  genre_song?: string;
}

// ✅ type guard: valida que un SearchableItem es una canción utilizable
export function isSongDto(x: any): x is SongDto {
  return x
    && typeof x.id === 'number'
    && typeof x.name_song === 'string'
    && typeof x.artist_song === 'string'
    && typeof x.album_song === 'string'
    && typeof x.url_song === 'string';
}

// Ponelo en el mismo archivo, fuera de la clase o como método privado.
export function dtoToTrack(song: {
  id: number;
  name_song: string;
  artist_song: string;
  album_song: string;
  url_song: string;
  art_work_song: string;
  genre_song: string;
}): Track {
  return {
    id: song.id,
    title: song.name_song,
    artist: song.artist_song,
    album: song.album_song,
    url: song.url_song,
    artwork: song.art_work_song,
    genre: song.genre_song
  };
}



// (tu adapter existente)
export function songToTrack(s: SongDto): Track {
  return {
    id: s.id,
    title: s.name_song,
    artist: s.artist_song,
    album: s.album_song,
    artwork: s.art_work_song ?? '',
    url: s.url_song,
    genre: s.genre_song ?? '',
  };

  
}
