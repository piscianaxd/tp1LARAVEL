import os, re, json, time
import requests
from urllib.parse import quote_plus

# === CONFIG ===
OUTPUT_DIR = os.path.join("public", "media", "artworks")  # cambia si querés otra carpeta
ITUNES_COUNTRY = "US"  # podés probar "AR" también
TIMEOUT = 15
SLEEP_BETWEEN = 0.4  # para no pegar tanto a las APIs

# === DATASET de álbumes (20) con los nombres de archivo EXACTOS de tu seed ===
ALBUMS = [
    {"artist":"Michael Jackson","album":"Thriller","filename":"michael-jackson_thriller.jpg"},
    {"artist":"2Pac","album":"All Eyez on Me","filename":"2pac_all-eyez-on-me.jpg"},
    {"artist":"Justin Bieber","album":"Purpose","filename":"justin-bieber_purpose.jpg"},
    {"artist":"Misfits","album":"Walk Among Us","filename":"misfits_walk-among-us.jpg"},
    {"artist":"Nirvana","album":"Nevermind","filename":"nirvana_nevermind.jpg"},
    {"artist":"mk.gee","album":"Two Star & The Dream Police","filename":"mkgee_two-star.jpg"},
    {"artist":"BROCKHAMPTON","album":"SATURATION","filename":"brockhampton_saturation.jpg"},
    {"artist":"Daft Punk","album":"Discovery","filename":"daft-punk_discovery.jpg"},
    {"artist":"Radiohead","album":"OK Computer","filename":"radiohead_ok-computer.jpg"},
    {"artist":"The Beatles","album":"Abbey Road","filename":"beatles_abbey-road.jpg"},
    {"artist":"Queen","album":"A Night at the Opera","filename":"queen_a-night-at-the-opera.jpg"},
    {"artist":"Kendrick Lamar","album":"DAMN.","filename":"kendrick_damn.jpg"},
    {"artist":"Taylor Swift","album":"1989","filename":"taylor-swift_1989.jpg"},
    {"artist":"Billie Eilish","album":"WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?","filename":"billie-eilish_wwafawdwg.jpg"},
    {"artist":"Bad Bunny","album":"YHLQMDLG","filename":"bad-bunny_yhlqmdlg.jpg"},
    {"artist":"Shakira","album":"Fijación Oral, Vol. 1","filename":"shakira_fijacion-oral-vol1.jpg"},
    {"artist":"Soda Stereo","album":"Canción Animal","filename":"soda-stereo_cancion-animal.jpg"},
    {"artist":"Gustavo Cerati","album":"Bocanada","filename":"cerati_bocanada.jpg"},
    {"artist":"Linkin Park","album":"Hybrid Theory","filename":"linkin-park_hybrid-theory.jpg"},
    {"artist":"Metallica","album":"Master of Puppets","filename":"metallica_master-of-puppets.jpg"},
]

def norm(s: str) -> str:
    """Normaliza para comparar textos (sin tildes, lower, sin signos)."""
    try:
        import unicodedata
        s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    except Exception:
        pass
    s = re.sub(r'[^a-zA-Z0-9]+', ' ', s or '').strip().lower()
    return s

def upscale_itunes(url: str) -> str:
    """iTunes devuelve artworkUrl100; esto intenta subir a 1000x1000."""
    return re.sub(r'/\d+x\d+(bb)?\.(jpg|png)', '/1000x1000bb.jpg', url)

def fetch_itunes_artwork(artist: str, album: str) -> str | None:
    term = quote_plus(f"{artist} {album}")
    url = f"https://itunes.apple.com/search?media=music&entity=album&country={ITUNES_COUNTRY}&limit=10&term={term}"
    r = requests.get(url, timeout=TIMEOUT)
    if not r.ok:
        return None
    data = r.json()
    results = data.get("results", [])
    if not results:
        return None

    # Intento de match exacto por album y artista
    n_artist, n_album = norm(artist), norm(album)
    best = None
    for it in results:
        c_name = norm(it.get("collectionName", ""))
        a_name = norm(it.get("artistName", ""))
        if c_name == n_album and (a_name == n_artist or n_artist in a_name or a_name in n_artist):
            best = it
            break
    if not best:
        # fallback: primero
        best = results[0]

    art = best.get("artworkUrl100")
    if not art:
        return None
    return upscale_itunes(art)

def fetch_musicbrainz_cover(artist: str, album: str) -> str | None:
    """Busca release-group en MusicBrainz y luego portada en Cover Art Archive."""
    # 1) buscar release-group
    params = {
        'query': f'artist:"{artist}" AND releasegroup:"{album}"',
        'fmt': 'json',
        'limit': 5
    }
    r = requests.get("https://musicbrainz.org/ws/2/release-group", params=params, timeout=TIMEOUT, headers={'User-Agent': 'musify-art-fetcher/1.0'})
    if not r.ok:
        return None
    data = r.json()
    groups = data.get('release-groups', [])
    if not groups:
        return None

    # elegir el de tipo Album preferentemente
    rg = None
    n_album = norm(album)
    for g in groups:
        title = g.get('title', '')
        prim_type = g.get('primary-type', '')
        if norm(title) == n_album and (prim_type == 'Album' or prim_type == 'Single' or prim_type == 'EP'):
            rg = g
            break
    if not rg:
        rg = groups[0]

    mbid = rg.get('id')
    if not mbid:
        return None

    # 2) Cover Art Archive
    # intentamos front-500 primero, si no hay, "front"
    for path in [f"https://coverartarchive.org/release-group/{mbid}/front-500",
                 f"https://coverartarchive.org/release-group/{mbid}/front"]:
        r2 = requests.get(path, timeout=TIMEOUT, allow_redirects=True, headers={'User-Agent': 'musify-art-fetcher/1.0'})
        if r2.ok and r2.headers.get("Content-Type","").startswith("image/"):
            return r2.url  # url final (puede ser redirección)
    return None

def download(url: str, dest_path: str) -> bool:
    try:
        with requests.get(url, stream=True, timeout=TIMEOUT) as r:
            if not r.ok:
                return False
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            with open(dest_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
        return True
    except Exception:
        return False

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    ok, fail = 0, 0

    for item in ALBUMS:
        artist = item["artist"]
        album = item["album"]
        filename = item["filename"]
        dest = os.path.join(OUTPUT_DIR, filename)
        if os.path.exists(dest):
            print(f"✓ Existe: {filename} (salteando)")
            continue

        print(f"→ Buscando: {artist} — {album}")
        # 1) iTunes
        art_url = fetch_itunes_artwork(artist, album)
        if art_url:
            print(f"  iTunes: {art_url}")
            if download(art_url, dest):
                print(f"  ✓ Guardado: {dest}")
                ok += 1
                time.sleep(SLEEP_BETWEEN)
                continue
            else:
                print("  × Falló descarga iTunes, probando fallback…")

        # 2) Fallback MusicBrainz + CAA
        art_url = fetch_musicbrainz_cover(artist, album)
        if art_url:
            print(f"  CAA: {art_url}")
            if download(art_url, dest):
                print(f"  ✓ Guardado: {dest}")
                ok += 1
            else:
                print("  × Falló descarga CAA")
                fail += 1
        else:
            print("  × No se encontró portada en iTunes/CAA")
            fail += 1

        time.sleep(SLEEP_BETWEEN)

    print("\n=== Resumen ===")
    print(f"Descargadas OK: {ok}")
    print(f"Fallidas: {fail}")
    print(f"Carpeta: {os.path.abspath(OUTPUT_DIR)}")

if __name__ == "__main__":
    main()
