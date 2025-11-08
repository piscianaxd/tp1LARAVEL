import os, sys, time, json, shutil, unicodedata, requests
from urllib.parse import quote_plus

# === CONFIG ===
AUDIO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__),
        '..', 'musify', 'public', 'media', 'audio'))
SAMPLE_MP3 = os.path.join(os.path.dirname(__file__), 'sample.mp3')
TIMEOUT = 15
SLEEP_BETWEEN = 0.5  # para no pegarle tan rápido a las APIs

# === DATASET (copiado de tu seeder) ===
albums = [
    {'artist':'Michael Jackson','album':'Thriller','genre':'Pop','art':'michael-jackson_thriller.jpg',
     'tracks':['Wanna Be Startin’ Somethin’','Thriller','Beat It','Billie Jean','Human Nature']},
    {'artist':'2Pac','album':'All Eyez on Me','genre':'Hip-Hop','art':'2pac_all-eyez-on-me.jpg',
     'tracks':['Ambitionz Az a Ridah','All Eyez on Me','2 of Amerikaz Most Wanted','How Do U Want It','California Love']},
    {'artist':'Justin Bieber','album':'Purpose','genre':'Pop','art':'justin-bieber_purpose.jpg',
     'tracks':['What Do You Mean?','Sorry','Love Yourself','Company','Mark My Words']},
    {'artist':'Misfits','album':'Walk Among Us','genre':'Punk','art':'misfits_walk-among-us.jpg',
     'tracks':['20 Eyes','I Turned into a Martian','Astro Zombies','Hatebreeders','Skulls']},
    {'artist':'Nirvana','album':'Nevermind','genre':'Rock','art':'nirvana_nevermind.jpg',
     'tracks':['Smells Like Teen Spirit','In Bloom','Come As You Are','Lithium','Drain You']},
    {'artist':'mk.gee','album':'Two Star & The Dream Police','genre':'Indie','art':'mkgee_two-star.jpg',
     'tracks':['New Low','Candy','Are You Looking Up','How Many Miles','How It All Ends']},
    {'artist':'BROCKHAMPTON','album':'SATURATION','genre':'Hip-Hop','art':'brockhampton_saturation.jpg',
     'tracks':['HEAT','GOLD','STAR','BOYS','FAKE']},
    {'artist':'Daft Punk','album':'Discovery','genre':'Electronic','art':'daft-punk_discovery.jpg',
     'tracks':['One More Time','Aerodynamic','Digital Love','Harder, Better, Faster, Stronger','Something About Us']},
    {'artist':'Radiohead','album':'OK Computer','genre':'Alternative','art':'radiohead_ok-computer.jpg',
     'tracks':['Airbag','Paranoid Android','Subterranean Homesick Alien','Karma Police','No Surprises']},
    {'artist':'The Beatles','album':'Abbey Road','genre':'Rock','art':'beatles_abbey-road.jpg',
     'tracks':['Come Together','Something','Here Comes the Sun','Oh! Darling','I Want You (She’s So Heavy)']},
    {'artist':'Queen','album':'A Night at the Opera','genre':'Rock','art':'queen_a-night-at-the-opera.jpg',
     'tracks':['Bohemian Rhapsody','You’re My Best Friend','Love of My Life','’39','I’m in Love with My Car']},
    {'artist':'Kendrick Lamar','album':'DAMN.','genre':'Hip-Hop','art':'kendrick_damn.jpg',
     'tracks':['DNA.','HUMBLE.','ELEMENT.','LOVE.','LOYALTY.']},
    {'artist':'Taylor Swift','album':'1989','genre':'Pop','art':'taylor-swift_1989.jpg',
     'tracks':['Blank Space','Style','Out of the Woods','Shake It Off','Wildest Dreams']},
    {'artist':'Billie Eilish','album':'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?','genre':'Pop','art':'billie-eilish_wwafawdwg.jpg',
     'tracks':['bad guy','bury a friend','when the party’s over','you should see me in a crown','wish you were gay']},
    {'artist':'Bad Bunny','album':'YHLQMDLG','genre':'Latin','art':'bad-bunny_yhlqmdlg.jpg',
     'tracks':['Si Veo a Tu Mamá','La Difícil','La Santa','Yo Perreo Sola','Safaera']},
    {'artist':'Shakira','album':'Fijación Oral, Vol. 1','genre':'Latin','art':'shakira_fijacion-oral-vol1.jpg',
     'tracks':['La Tortura','Día de Enero','No','Obtener un Sí','Las de la Intuición']},
    {'artist':'Soda Stereo','album':'Canción Animal','genre':'Rock','art':'soda-stereo_cancion-animal.jpg',
     'tracks':['Canción Animal','De Música Ligera','Un Millón de Años Luz','1990','En el Séptimo Día']},
    {'artist':'Gustavo Cerati','album':'Bocanada','genre':'Alternative','art':'cerati_bocanada.jpg',
     'tracks':['Tabú','Bocanada','Puente','Paseo Inmoral','Raíz']},
    {'artist':'Linkin Park','album':'Hybrid Theory','genre':'Rock','art':'linkin-park_hybrid-theory.jpg',
     'tracks':['Papercut','One Step Closer','With You','Crawling','In the End']},
    {'artist':'Metallica','album':'Master of Puppets','genre':'Metal','art':'metallica_master-of-puppets.jpg',
     'tracks':['Battery','Master of Puppets','The Thing That Should Not Be','Welcome Home (Sanitarium)','Disposable Heroes']},
]

def slug(s: str) -> str:
    if not isinstance(s, str):
        s = str(s)
    s = unicodedata.normalize('NFKD', s)
    s = s.encode('ascii', 'ignore').decode('ascii')
    out, prev_dash = [], False
    for ch in s:
        if ch.isalnum():
            out.append(ch.lower()); prev_dash = False
        else:
            if not prev_dash:
                out.append('-'); prev_dash = True
    return ''.join(out).strip('-')

def ensure_dirs(p: str):
    os.makedirs(os.path.dirname(p), exist_ok=True)

def get_deezer_preview(artist: str, track: str) -> str | None:
    # https://api.deezer.com/search?q=artist:"..." track:"..."
    q = f'artist:"{artist}" track:"{track}"'
    url = f'https://api.deezer.com/search?q={quote_plus(q)}'
    try:
        r = requests.get(url, timeout=TIMEOUT)
        if r.ok:
            data = r.json()
            for it in data.get('data', []):
                prev = it.get('preview')
                if prev:  # mp3 128kbps / ~30s
                    return prev
    except Exception:
        return None
    return None

def get_itunes_preview(artist: str, track: str) -> str | None:
    # https://itunes.apple.com/search?term=...&media=music&entity=song&limit=5
    term = quote_plus(f'{artist} {track}')
    url = f'https://itunes.apple.com/search?term={term}&media=music&entity=song&limit=5'
    try:
        r = requests.get(url, timeout=TIMEOUT, headers={'User-Agent': 'PreviewFetcher/1.0'})
        if r.ok:
            data = r.json()
            for it in data.get('results', []):
                prev = it.get('previewUrl')  # m4a ~30s
                if prev:
                    return prev
    except Exception:
        return None
    return None

def download(url: str, dst: str) -> bool:
    try:
        with requests.get(url, stream=True, timeout=TIMEOUT) as r:
            if not r.ok:
                return False
            ensure_dirs(dst)
            with open(dst, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk: f.write(chunk)
        return True
    except Exception:
        return False

def main():
    print('[i] AUDIO_ROOT =', AUDIO_ROOT)
    os.makedirs(AUDIO_ROOT, exist_ok=True)

    missing_sample = not (os.path.exists(SAMPLE_MP3) and os.path.getsize(SAMPLE_MP3) > 0)
    if missing_sample:
        print('[!] sample.mp3 no encontrado. Si una preview no se consigue, no habrá fallback local.')

    created, skipped, from_dz, from_it = 0, 0, 0, 0

    for a in albums:
        a_slug = slug(a['artist']); alb_slug = slug(a['album'])
        for t in a['tracks']:
            t_slug = slug(t)
            # prioridad: Deezer (mp3), fallback: iTunes (m4a)
            dst_mp3 = os.path.join(AUDIO_ROOT, a_slug, alb_slug, f'{t_slug}.mp3')
            dst_m4a = os.path.join(AUDIO_ROOT, a_slug, alb_slug, f'{t_slug}.m4a')
            if os.path.exists(dst_mp3) or os.path.exists(dst_m4a):
                skipped += 1
                continue

            url = get_deezer_preview(a['artist'], t)
            ext = 'mp3'
            if not url:
                url = get_itunes_preview(a['artist'], t)
                ext = 'm4a' if url else None

            if url and ext:
                dst = dst_mp3 if ext == 'mp3' else dst_m4a
                ok = download(url, dst)
                if ok:
                    created += 1
                    from_dz += (ext == 'mp3')
                    from_it += (ext == 'm4a')
                    print(f'[+] {a_slug}/{alb_slug}/{t_slug}.{ext}')
                else:
                    print(f'[x] fallo descarga: {url}')
            else:
                # fallback local si existe sample.mp3
                if not missing_sample:
                    ensure_dirs(dst_mp3)
                    shutil.copyfile(SAMPLE_MP3, dst_mp3)
                    created += 1
                    print(f'[~] fallback sample -> {a_slug}/{alb_slug}/{t_slug}.mp3')
                else:
                    print(f'[!] sin preview: {a["artist"]} - {t}')

            time.sleep(SLEEP_BETWEEN)

    print(f'\n[done] nuevos: {created}, omitidos: {skipped}, deezer: {from_dz}, itunes: {from_it}')
    print(f'Base: {AUDIO_ROOT}')
    print('Recordá: usá estos previews solo para demo/desarrollo.')

if __name__ == '__main__':
    main()
