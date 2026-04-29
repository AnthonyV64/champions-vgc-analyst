"""
Champions VGC — Actualizador Diario Automático
Corre diariamente via GitHub Actions o manualmente.

Hace:
1. Lee URLs de pokepastes del Google Sheets del repositorio
2. Fetchea pokepastes nuevos (solo los que no estaban antes)
3. Fetchea torneos nuevos de Limitless (últimas 48h)
4. Genera tournaments.json y pokemon.json actualizados
5. Clasifica torneos: major (500+p), featured (100-499p), regular (<100p)

Uso local:
  python update_daily.py

Uso en GitHub Actions: automático (ver .github/workflows/update.yml)
"""

import requests, json, re, time, glob, os, csv, io
from collections import defaultdict, Counter
from datetime import datetime, timedelta

# ── Config ────────────────────────────────────────────────────────────────────
API  = "https://play.limitlesstcg.com/api"
WEB  = "https://play.limitlesstcg.com"
SHEETS_CSV = "https://docs.google.com/spreadsheets/d/1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw/export?format=csv&gid=791705272"
CHAMPIONS_KW = ["champion","champ","reg m","reg. m","regulation m","m-a","m/a"]
DAYS_BACK = 2      # para update diario, solo últimas 48h
DAYS_HISTORY = 35  # historial completo para el JSON final
TOP_N = 8

# Tournament size thresholds
MAJOR_THRESHOLD    = 500
FEATURED_THRESHOLD = 100

DATA_DIR = "src/data"  # ruta relativa al repo

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
})

# ── Helpers ───────────────────────────────────────────────────────────────────
ALIASES = {
    "Eternal Flower Floette":"Floette-Eternal","Floette":"Floette-Eternal",
    "Mega Charizard Y":"Charizard","Mega Floette":"Floette-Eternal",
    "Mega Gengar":"Gengar","Mega Tyranitar":"Tyranitar",
    "Mega Aerodactyl":"Aerodactyl","Mega Froslass":"Froslass",
    "Mega Gardevoir":"Gardevoir","Mega Delphox":"Delphox",
    "Mega Kangaskhan":"Kangaskhan","Mega Meganium":"Meganium",
    "Mega Dragonite":"Dragonite","Wash Rotom":"Rotom-Wash",
    "Heat Rotom":"Rotom-Heat","Mega Scizor":"Scizor",
}
NORM_EV = {"HP":"hp","Atk":"atk","Def":"def","SpA":"spa","SpD":"spd","Spe":"spe"}

def norm_name(n):
    n = n.replace(" (F)","").replace(" (M)","").strip()
    return ALIASES.get(n, n)

def norm_evs(evs):
    out = {}
    for k,v in (evs or {}).items():
        key = NORM_EV.get(k, k.lower())
        if key in ("hp","atk","def","spa","spd","spe"): out[key] = v
    return out

def ev_str(evs):
    ORDER = [("hp","HP"),("atk","Atk"),("def","Def"),("spa","SpA"),("spd","SpD"),("spe","Spe")]
    return " / ".join(f"{evs[k]} {lbl}" for k,lbl in ORDER if evs.get(k,0) > 0)

def tournament_tier(players):
    if players >= MAJOR_THRESHOLD:    return "major"
    if players >= FEATURED_THRESHOLD: return "featured"
    return "regular"

def fetch_html(url):
    for i in range(3):
        try:
            r = SESSION.get(url, timeout=12)
            return r.text if r.status_code == 200 else None
        except:
            if i < 2: time.sleep(1.5)
    return None

def fetch_json(url):
    for i in range(3):
        try:
            r = SESSION.get(url, timeout=12)
            r.raise_for_status()
            return r.json()
        except:
            if i < 2: time.sleep(1.5)
    return None

# ── Parser ────────────────────────────────────────────────────────────────────
def parse_showdown_text(text):
    team = []
    for block in re.split(r"\n\s*\n", text.strip()):
        lines = [l.strip() for l in block.strip().splitlines() if l.strip()]
        if not lines: continue
        m = re.match(r"^(.+?)\s*@\s*(.+)$", lines[0])
        if m: name, item = m.group(1).strip(), m.group(2).strip()
        else: name, item = lines[0].strip(), ""
        if not name: continue
        pk = {"name":name,"item":item,"ability":"","nature":"","evs":{},"moves":[]}
        for line in lines[1:]:
            if line.startswith("Ability:"): pk["ability"] = line[8:].strip()
            elif "Nature" in line: pk["nature"] = line.replace("Nature","").strip()
            elif line.startswith("EVs:"):
                for p in line[4:].split("/"):
                    m2 = re.match(r"\s*(\d+)\s+(\w+)", p.strip())
                    if m2: pk["evs"][m2.group(2)] = int(m2.group(1))
            elif line.startswith("- "): pk["moves"].append(line[2:].strip())
        if pk["name"] and (pk["moves"] or pk["ability"]): team.append(pk)
    return team

def parse_limitless_teamlist(html):
    if not html: return []
    m = re.search(r"const teamlist = `(.*?)`", html, re.DOTALL)
    return parse_showdown_text(m.group(1)) if m else []

def parse_pokepaste(html):
    if not html: return []
    blocks = re.findall(r"<pre>(.*?)</pre>", html, re.DOTALL)
    def strip_html(t):
        t = re.sub(r"<[^>]+>","",t)
        return t.replace("&amp;","&").replace("&lt;","<").replace("&gt;",">").replace("&#39;","'")
    return [p for p in [parse_showdown_text(strip_html(b)) for b in blocks] if p for p in p]

# ── Google Sheets reader ──────────────────────────────────────────────────────
def fetch_paste_urls_from_sheets():
    """Lee las URLs de pokepastes del Google Sheets del repositorio."""
    print("Leyendo Google Sheets...")
    r = SESSION.get(SHEETS_CSV, timeout=20)
    if r.status_code != 200:
        print(f"  Error leyendo Sheets: {r.status_code}")
        return []
    
    reader = csv.reader(io.StringIO(r.text))
    rows = list(reader)
    
    # Encontrar la columna de Pokepaste (buscar header)
    paste_col = None
    header_row = None
    for i, row in enumerate(rows[:5]):
        for j, cell in enumerate(row):
            if "pokepaste" in cell.lower() or "paste" in cell.lower():
                paste_col = j
                header_row = i
                break
        if paste_col is not None: break
    
    if paste_col is None:
        # Buscar por URL pattern en todas las celdas de las primeras filas
        for i, row in enumerate(rows[:5]):
            for j, cell in enumerate(row):
                if "pokepast.es" in cell:
                    paste_col = j
                    break
    
    urls = []
    for row in rows[3:]:  # skip headers
        if paste_col is not None and paste_col < len(row):
            cell = row[paste_col].strip()
            if "pokepast.es" in cell:
                # Extract URL
                m = re.search(r"https?://pokepast\.es/[a-f0-9]+", cell)
                if m: urls.append(m.group(0))
    
    # Also scan all cells for pokepaste URLs
    if not urls:
        for row in rows[3:]:
            for cell in row:
                if "pokepast.es" in cell:
                    m = re.search(r"https?://pokepast\.es/[a-f0-9]+", cell)
                    if m and m.group(0) not in urls:
                        urls.append(m.group(0))
    
    print(f"  {len(urls)} URLs encontradas en Sheets")
    return urls

# ── Spread DB ─────────────────────────────────────────────────────────────────
def build_spread_db(paste_teams):
    """Construye base de datos de spreads desde una lista de equipos parseados."""
    item_evs = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    natures  = defaultdict(Counter)
    abilities = defaultdict(Counter)
    moves_db = defaultdict(Counter)
    
    for entry in paste_teams:
        for pk in entry.get("team", []):
            n = norm_name(pk.get("name",""))
            item = pk.get("item","")
            for stat, val in pk.get("evs",{}).items():
                item_evs[n][item][stat].append(val)
            if pk.get("nature"): natures[n][pk["nature"]] += 1
            if pk.get("ability"): abilities[n][pk["ability"]] += 1
            for mv in pk.get("moves",[]): moves_db[n][mv] += 1
    
    db = {}
    for n in item_evs:
        gen_evs = {}
        all_evs = defaultdict(list)
        for item_data in item_evs[n].values():
            for stat, vals in item_data.items():
                all_evs[stat].extend(vals)
        gen_evs = {s: round(sum(v)/len(v)) for s,v in all_evs.items()}
        
        per_item = {
            item: {stat: round(sum(v)/len(v)) for stat,v in stats.items()}
            for item, stats in item_evs[n].items()
            if sum(len(v) for v in stats.values()) >= 3
        }
        db[n] = {
            "nature": list(natures[n].keys())[:1],
            "evs": gen_evs,
            "item_evs": per_item,
        }
    return db

def get_spread(name, item, db):
    n = norm_name(name)
    s = db.get(n)
    if not s:
        for k in db:
            if n.lower() in k.lower(): s = db[k]; break
    if not s: return {}, ""
    evs = s["item_evs"].get(item) or s["evs"]
    return norm_evs(evs), s["nature"][0] if s["nature"] else ""

# ── Tournaments ───────────────────────────────────────────────────────────────
def get_tournaments(days_back=DAYS_HISTORY):
    cutoff = datetime.now() - timedelta(days=days_back)
    tours, page = [], 1
    while True:
        data = fetch_json(f"{API}/tournaments?game=VGC&limit=50&page={page}")
        if not data: break
        recent = [t for t in data if datetime.fromisoformat(t["date"].replace("Z","")) > cutoff]
        tours.extend(recent)
        if len(data) < 50 or len(recent) < len(data): break
        page += 1
        time.sleep(0.2)
    return sorted(
        [t for t in tours if any(k in t["name"].lower() for k in CHAMPIONS_KW) and t.get("players",0) >= 8],
        key=lambda x: -x["players"]
    )

def scrape_tournament(t, spread_db):
    standings = fetch_json(f"{API}/tournaments/{t['id']}/standings") or []
    top8 = sorted([p for p in standings if p.get("placing") and p["placing"] <= TOP_N], key=lambda x: x["placing"])
    
    result = {
        "id": t["id"], "name": t["name"],
        "date": t["date"][:10] if t.get("date") else "",
        "players": t["players"],
        "tier": tournament_tier(t["players"]),
        "top8": []
    }
    
    for player in top8:
        placing = player["placing"]
        pid = player.get("player")
        pname = player.get("name") or pid
        rec = player.get("record", {})
        rec_str = f"{rec.get('wins',0)}-{rec.get('losses',0)}" if rec else ""
        
        team = []
        if pid:
            html = fetch_html(f"{WEB}/tournament/{t['id']}/player/{pid}/teamlist")
            team = parse_limitless_teamlist(html)
            time.sleep(0.25)
        
        enriched = []
        for pk in team:
            moves = [m for m in pk.get("moves",[]) if not m.startswith("Tera")]
            if pk.get("evs") and any(v > 0 for v in pk["evs"].values()):
                evs = norm_evs(pk["evs"])
                nat = pk.get("nature","")
            else:
                evs, nat = get_spread(pk["name"], pk["item"], spread_db)
                if not nat and pk.get("nature"): nat = pk["nature"]
            
            enriched.append({
                "name": norm_name(pk["name"]),
                "item": pk["item"],
                "ability": pk.get("ability",""),
                "nature": nat,
                "evs": evs,
                "evsStr": ev_str(evs),
                "moves": moves,
            })
        
        result["top8"].append({"place": placing, "player": pname, "record": rec_str, "team": enriched})
    
    tier_label = {"major":"🏆 MAJOR","featured":"⭐ FEATURED","regular":""}[result["tier"]]
    print(f"  [{result['players']}p] {tier_label} {t['name'][:45]}")
    return result

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("="*60)
    print(f"Champions VGC — Daily Update")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("="*60)
    
    # 1. Load existing tournaments.json if available
    existing_ids = set()
    existing_tours = []
    tours_path = os.path.join(DATA_DIR, "tournaments.json")
    if os.path.exists(tours_path):
        with open(tours_path, encoding="utf-8") as f:
            existing_tours = json.load(f)
        existing_ids = {t["id"] for t in existing_tours}
        print(f"\nTorneos existentes: {len(existing_tours)}")
    
    # 2. Fetch paste URLs from Google Sheets and build spread DB
    print("\n[1/3] Leyendo pastes del repositorio...")
    paste_urls = fetch_paste_urls_from_sheets()
    
    paste_teams = []
    new_paste_count = 0
    # Load cached pastes if available
    pastes_cache = "pastes_cache.json"
    cached_urls = set()
    if os.path.exists(pastes_cache):
        with open(pastes_cache) as f:
            cached = json.load(f)
        paste_teams = cached.get("teams", [])
        cached_urls = {e["url"] for e in paste_teams}
        print(f"  Pastes en caché: {len(paste_teams)}")
    
    # Fetch only new pastes
    new_urls = [u for u in paste_urls if u not in cached_urls]
    print(f"  Pastes nuevos a fetchear: {len(new_urls)}")
    for url in new_urls:
        html = fetch_html(url)
        if html:
            blocks = re.findall(r"<pre>(.*?)</pre>", html, re.DOTALL)
            def sh(t): return re.sub(r"<[^>]+>","",t).replace("&amp;","&").replace("&#39;","'")
            team = []
            for b in blocks:
                pks = parse_showdown_text(sh(b))
                team.extend(pks)
            if team:
                paste_teams.append({"url": url, "team": team})
                new_paste_count += 1
        time.sleep(0.12)
    
    if new_paste_count > 0:
        with open(pastes_cache, "w") as f:
            json.dump({"teams": paste_teams}, f, ensure_ascii=False)
        print(f"  {new_paste_count} pastes nuevos procesados. Total: {len(paste_teams)}")
    
    spread_db = build_spread_db(paste_teams)
    print(f"  Spread DB: {len(spread_db)} pokemon")
    
    # 3. Fetch new tournaments
    print(f"\n[2/3] Buscando torneos nuevos...")
    all_tours_meta = get_tournaments(days_back=DAYS_HISTORY)
    new_tours_meta = [t for t in all_tours_meta if t["id"] not in existing_ids]
    print(f"  Torneos totales: {len(all_tours_meta)}")
    print(f"  Torneos nuevos:  {len(new_tours_meta)}")
    
    if not new_tours_meta and not new_paste_count:
        print("\nNada nuevo — no se actualiza.")
        return False
    
    new_results = []
    for i, t in enumerate(new_tours_meta):
        print(f"\n[{i+1}/{len(new_tours_meta)}] Scrapeando {t['name'][:50]}...")
        result = scrape_tournament(t, spread_db)
        new_results.append(result)
        time.sleep(0.3)
    
    # 4. Merge and save
    print(f"\n[3/3] Guardando datos...")
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Merge tournaments (new first, then existing)
    all_results = new_results + existing_tours
    # Keep top 50 by players
    all_results = sorted(all_results, key=lambda x: -x.get("players",0))[:50]
    # Ensure all have tier field
    for t in all_results:
        if "tier" not in t:
            t["tier"] = tournament_tier(t.get("players",0))
    
    with open(tours_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    majors = sum(1 for t in all_results if t.get("tier") == "major")
    featured = sum(1 for t in all_results if t.get("tier") == "featured")
    
    print(f"\n✅ LISTO")
    print(f"  Total torneos: {len(all_results)} ({majors} major, {featured} featured)")
    print(f"  Guardado en: {tours_path}")
    
    return True  # indica que hubo cambios

if __name__ == "__main__":
    changed = main()
    # GitHub Actions lee este exit code para decidir si hacer commit
    import sys
    sys.exit(0 if changed else 1)
