<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SongSavedDb;

class SongSavedDbSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Config: “trampita” local
        // Ajustá si preferís storage público de Laravel (ver notas abajo).
        $ART_BASE = '/media/artworks/'; // p.ej. backend/public/media/artworks/
        $AUDIO_BASE = '/media/audio/';  // p.ej. backend/public/media/audio/

        $albums = [
            // 1) Michael Jackson — Thriller (Pop)
            [
                'artist' => 'Michael Jackson',
                'album'  => 'Thriller',
                'genre'  => 'Pop',
                'art'    => 'michael-jackson_thriller.jpg',
                'tracks' => ['Wanna Be Startin’ Somethin’','Thriller','Beat It','Billie Jean','Human Nature'],
            ],
            // 2) 2Pac — All Eyez on Me (Hip-Hop)
            [
                'artist' => '2Pac',
                'album'  => 'All Eyez on Me',
                'genre'  => 'Hip-Hop',
                'art'    => '2pac_all-eyez-on-me.jpg',
                'tracks' => ['Ambitionz Az a Ridah','All Eyez on Me','2 of Amerikaz Most Wanted','How Do U Want It','California Love'],
            ],
            // 3) Justin Bieber — Purpose (Pop)
            [
                'artist' => 'Justin Bieber',
                'album'  => 'Purpose',
                'genre'  => 'Pop',
                'art'    => 'justin-bieber_purpose.jpg',
                'tracks' => ['What Do You Mean?','Sorry','Love Yourself','Company','Mark My Words'],
            ],
            // 4) Misfits — Walk Among Us (Punk Rock)
            [
                'artist' => 'Misfits',
                'album'  => 'Walk Among Us',
                'genre'  => 'Punk',
                'art'    => 'misfits_walk-among-us.jpg',
                'tracks' => ['20 Eyes','I Turned into a Martian','Astro Zombies','Hatebreeders','Skulls'],
            ],
            // 5) Nirvana — Nevermind (Grunge)
            [
                'artist' => 'Nirvana',
                'album'  => 'Nevermind',
                'genre'  => 'Rock',
                'art'    => 'nirvana_nevermind.jpg',
                'tracks' => ['Smells Like Teen Spirit','In Bloom','Come As You Are','Lithium','Drain You'],
            ],
            // 6) mk.gee — Two Star & The Dream Police (Indie/Alt)
            [
                'artist' => 'mk.gee',
                'album'  => 'Two Star & The Dream Police',
                'genre'  => 'Indie',
                'art'    => 'mkgee_two-star.jpg',
                'tracks' => ['New Low','Candy','Are You Looking Up','How Many Miles','How It All Ends'],
            ],
            // 7) BROCKHAMPTON — SATURATION (Hip-Hop/Alt)
            [
                'artist' => 'BROCKHAMPTON',
                'album'  => 'SATURATION',
                'genre'  => 'Hip-Hop',
                'art'    => 'brockhampton_saturation.jpg',
                'tracks' => ['HEAT','GOLD','STAR','BOYS','FAKE'],
            ],
            // 8) Daft Punk — Discovery (Electronic)
            [
                'artist' => 'Daft Punk',
                'album'  => 'Discovery',
                'genre'  => 'Electronic',
                'art'    => 'daft-punk_discovery.jpg',
                'tracks' => ['One More Time','Aerodynamic','Digital Love','Harder, Better, Faster, Stronger','Something About Us'],
            ],
            // 9) Radiohead — OK Computer (Alternative)
            [
                'artist' => 'Radiohead',
                'album'  => 'OK Computer',
                'genre'  => 'Alternative',
                'art'    => 'radiohead_ok-computer.jpg',
                'tracks' => ['Airbag','Paranoid Android','Subterranean Homesick Alien','Karma Police','No Surprises'],
            ],
            // 10) The Beatles — Abbey Road (Rock)
            [
                'artist' => 'The Beatles',
                'album'  => 'Abbey Road',
                'genre'  => 'Rock',
                'art'    => 'beatles_abbey-road.jpg',
                'tracks' => ['Come Together','Something','Here Comes the Sun','Oh! Darling','I Want You (She’s So Heavy)'],
            ],
            // 11) Queen — A Night at the Opera (Rock)
            [
                'artist' => 'Queen',
                'album'  => 'A Night at the Opera',
                'genre'  => 'Rock',
                'art'    => 'queen_a-night-at-the-opera.jpg',
                'tracks' => ['Bohemian Rhapsody','You’re My Best Friend','Love of My Life','’39','I’m in Love with My Car'],
            ],
            // 12) Kendrick Lamar — DAMN. (Hip-Hop)
            [
                'artist' => 'Kendrick Lamar',
                'album'  => 'DAMN.',
                'genre'  => 'Hip-Hop',
                'art'    => 'kendrick_damn.jpg',
                'tracks' => ['DNA.','HUMBLE.','ELEMENT.','LOVE.','LOYALTY.'],
            ],
            // 13) Taylor Swift — 1989 (Pop)
            [
                'artist' => 'Taylor Swift',
                'album'  => '1989',
                'genre'  => 'Pop',
                'art'    => 'taylor-swift_1989.jpg',
                'tracks' => ['Blank Space','Style','Out of the Woods','Shake It Off','Wildest Dreams'],
            ],
            // 14) Billie Eilish — WHEN WE ALL FALL ASLEEP, WHERE DO WE GO? (Pop)
            [
                'artist' => 'Billie Eilish',
                'album'  => 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?',
                'genre'  => 'Pop',
                'art'    => 'billie-eilish_wwafawdwg.jpg',
                'tracks' => ['bad guy','bury a friend','when the party’s over','you should see me in a crown','wish you were gay'],
            ],
            // 15) Bad Bunny — YHLQMDLG (Latin/Reggaetón)
            [
                'artist' => 'Bad Bunny',
                'album'  => 'YHLQMDLG',
                'genre'  => 'Latin',
                'art'    => 'bad-bunny_yhlqmdlg.jpg',
                'tracks' => ['Si Veo a Tu Mamá','La Difícil','La Santa','Yo Perreo Sola','Safaera'],
            ],
            // 16) Shakira — Fijación Oral, Vol. 1 (Latin/Pop)
            [
                'artist' => 'Shakira',
                'album'  => 'Fijación Oral, Vol. 1',
                'genre'  => 'Latin',
                'art'    => 'shakira_fijacion-oral-vol1.jpg',
                'tracks' => ['La Tortura','Día de Enero','No','Obtener un Sí','Las de la Intuición'],
            ],
            // 17) Soda Stereo — Canción Animal (Rock/LatAm)
            [
                'artist' => 'Soda Stereo',
                'album'  => 'Canción Animal',
                'genre'  => 'Rock',
                'art'    => 'soda-stereo_cancion-animal.jpg',
                'tracks' => ['Canción Animal','De Música Ligera','Un Millón de Años Luz','1990','En el Séptimo Día'],
            ],
            // 18) Gustavo Cerati — Bocanada (Alternative/LatAm)
            [
                'artist' => 'Gustavo Cerati',
                'album'  => 'Bocanada',
                'genre'  => 'Alternative',
                'art'    => 'cerati_bocanada.jpg',
                'tracks' => ['Tabú','Bocanada','Puente','Paseo Inmoral','Raíz'],
            ],
            // 19) Linkin Park — Hybrid Theory (Nu Metal)
            [
                'artist' => 'Linkin Park',
                'album'  => 'Hybrid Theory',
                'genre'  => 'Rock',
                'art'    => 'linkin-park_hybrid-theory.jpg',
                'tracks' => ['Papercut','One Step Closer','With You','Crawling','In the End'],
            ],
            // 20) Metallica — Master of Puppets (Metal)
            [
                'artist' => 'Metallica',
                'album'  => 'Master of Puppets',
                'genre'  => 'Metal',
                'art'    => 'metallica_master-of-puppets.jpg',
                'tracks' => ['Battery','Master of Puppets','The Thing That Should Not Be','Welcome Home (Sanitarium)','Disposable Heroes'],
            ],
        ];

        $rows = [];
        foreach ($albums as $a) {
            foreach ($a['tracks'] as $title) {
                $rows[] = [
                    'url_song'       => $AUDIO_BASE . $this->slug($a['artist']) . '/' . $this->slug($a['album']) . '/' . $this->slug($title) . '.mp3',
                    'name_song'      => $title,
                    'genre_song'     => $a['genre'],
                    'artist_song'    => $a['artist'],
                    'album_song'     => $a['album'],
                    'art_work_song'  => $ART_BASE . $this->slug($a['artist']) . '_' . $this->slug($a['album']) . '.jpg',
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ];
            }
        }

        // Mezclamos para que no queden por bloque de álbum
        shuffle($rows);

        // Insert masivo (100 filas)
        // Si tu tabla tiene timestamps por defecto, podés usar SongSavedDb::insert($rows)
        // Aquí prefiero create() en lote para respetar mutators/eventos si los tenés
        foreach ($rows as $row) {
            SongSavedDb::updateOrCreate(
                [
                    'name_song'   => $row['name_song'],
                    'artist_song' => $row['artist_song'],
                    'album_song'  => $row['album_song'],
                ],
                $row
            );
        }
    }

    private function slug(string $s): string
    {
        $s = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
        $s = preg_replace('/[^A-Za-z0-9]+/', '-', $s);
        $s = trim($s ?? '', '-');
        return strtolower($s);
    }
}
