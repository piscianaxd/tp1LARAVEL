// src/app/models/track.ts
export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  artwork: string;  // /media/artworks/...
  url: string;      // /media/audio/...
  genre: string;
}
