import { Track } from '../models/track/track.model';

// Ajustá si tu DTO difiere
export interface SongDto {
  id: number;
  name_song: string;
  artist_song: string;
  album_song: string;
  art_work_song: string;
  url_song: string;
}

export function songToTrack(s: SongDto): Track {
  return {
    id: s.id,
    title: s.name_song,
    artist: s.artist_song,
    album: s.album_song,
    artwork: s.art_work_song, // /media/artworks/...
    url: s.url_song,          // /media/audio/...
  };
}
