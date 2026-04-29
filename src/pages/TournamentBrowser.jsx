import { useState, useMemo } from 'react'
import tournaments from '../data/tournaments.json'

const PLACE_STYLE = {
  1: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  2: 'bg-gray-400/20 text-gray-300 border border-gray-400/30',
  3: 'bg-orange-600/20 text-orange-400 border border-orange-600/30',
}

function PokemonSlot({ pk }) {
  const isMega = ['Floettite','Charizardite Y','Charizardite X','Froslassite','Gengarite',
    'Tyranitarite','Delphoxite','Aerodactylite','Gardevoirite','Meganiumite','Scizorite',
    'Dragoninite','Gyaradosite','Kangaskhanite','Glimmoranite','Scovillainite',
    'Blastoisinite','Manectite','Starminite','Lucarionite'].includes(pk.item)

  return (
    <div className="bg-gray-800/60 rounded-lg p-2 border border-gray-700/50">
      <div className="flex items-start justify-between gap-1 mb-1">
        <span className="text-xs font-semibold text-gray-100">{pk.name}</span>
        {isMega && <span className="text-[9px] px-1 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">MEGA</span>}
      </div>
      <div className="text-[10px] text-gray-400 mb-1">
        @ {pk.item}
        {pk.ability && <span className="ml-1 text-gray-500">· {pk.ability}</span>}
      </div>
      {pk.nature && (
        <div className="text-[10px] text-purple-400 mb-1">{pk.nature}</div>
      )}
      {pk.evsStr && (
        <div className="text-[9px] text-gray-500 mb-1 leading-tight">{pk.evsStr}</div>
      )}
      {pk.moves?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {pk.moves.map((m, i) => (
            <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded ${i < 2 ? 'bg-brand-900/50 text-brand-300' : 'bg-gray-700/50 text-gray-400'}`}>
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function PlayerRow({ entry }) {
  const placeStyle = PLACE_STYLE[entry.place] || 'bg-gray-800 text-gray-400'
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border-b border-gray-800/50 last:border-0">
      <div
        className="flex items-center gap-3 py-2 px-3 hover:bg-gray-800/30 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold ${placeStyle}`}>
          {entry.place}°
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-100">{entry.player}</div>
          <div className="text-xs text-gray-500">{entry.record}</div>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {entry.team.slice(0, 6).map((pk, i) => (
            <span key={i} className="text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
              {pk.name}
            </span>
          ))}
        </div>
        <span className="text-gray-600 text-xs ml-1">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && entry.team.length > 0 && (
        <div className="px-3 pb-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {entry.team.map((pk, i) => <PokemonSlot key={i} pk={pk} />)}
        </div>
      )}
    </div>
  )
}

export default function TournamentBrowser() {
  const [selected, setSelected] = useState(tournaments[0]?.id || '')
  const [search, setSearch] = useState('')
  const [pokeSearch, setPokeSearch] = useState('')

  const filtered = useMemo(() =>
    tournaments.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  )

  const current = tournaments.find(t => t.id === selected) || tournaments[0]

  // Pokemon search across all tournaments
  const pokeResults = useMemo(() => {
    if (!pokeSearch || pokeSearch.length < 2) return []
    const q = pokeSearch.toLowerCase()
    const results = []
    tournaments.forEach(t => {
      t.top8.forEach(p => {
        p.team.forEach(pk => {
          if (pk.name.toLowerCase().includes(q) || pk.item.toLowerCase().includes(q)) {
            results.push({ tour: t.name, players: t.players, place: p.place, player: p.player, record: p.record, pk })
          }
        })
      })
    })
    return results.slice(0, 50)
  }, [pokeSearch])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-100 mb-1">Tournament Browser</h2>
        <p className="text-sm text-gray-400">82 torneos · 645 equipos completos con spreads e items reales</p>
      </div>

      <div>
        <input
          type="text"
          placeholder="Buscar Pokémon o item en todos los torneos..."
          className="input w-full mb-3"
          value={pokeSearch}
          onChange={e => setPokeSearch(e.target.value)}
        />
        {pokeSearch.length >= 2 && (
          <div className="card p-0 overflow-hidden mb-4">
            <div className="px-4 py-2 border-b border-gray-800 text-xs text-gray-400">{pokeResults.length} resultados</div>
            {pokeResults.map((r, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30">
                <span className={`text-xs px-2 py-0.5 rounded ${PLACE_STYLE[r.place] || 'bg-gray-800 text-gray-400'}`}>{r.place}°</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-200">{r.player} <span className="text-gray-500">({r.record})</span></div>
                  <div className="text-[10px] text-gray-500 truncate">{r.tour.slice(0,50)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-100">{r.pk.name} @ {r.pk.item}</div>
                  <div className="text-[10px] text-gray-500">{r.pk.nature} · {r.pk.evsStr}</div>
                  <div className="flex gap-1 mt-0.5 justify-end flex-wrap">
                    {r.pk.moves?.map((m,i) => <span key={i} className="text-[9px] bg-gray-800 text-gray-400 px-1 rounded">{m}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-2">
          <input
            type="text"
            placeholder="Buscar torneo..."
            className="input w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map(t => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors border ${
                  selected === t.id ? 'bg-brand-600/20 border-brand-500/30' :
                  t.tier === 'major' ? 'bg-yellow-900/10 border-yellow-500/20 hover:bg-yellow-900/20' :
                  t.tier === 'featured' ? 'bg-purple-900/10 border-purple-500/20 hover:bg-purple-900/20' :
                  'border-transparent hover:bg-gray-800'}`}
              >
                {t.tier === 'major' && <div className="text-[9px] font-bold text-yellow-400 mb-0.5">🏆 MAJOR</div>}
                {t.tier === 'featured' && <div className="text-[9px] font-bold text-purple-400 mb-0.5">⭐ FEATURED</div>}
                <div className="text-xs font-medium text-gray-200 leading-tight">{t.name.length > 40 ? t.name.slice(0,38)+'…' : t.name}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{t.players}p · {t.date}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {current && (
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-100 text-sm flex items-center gap-2">
                    {current.tier === 'major' && <span className="text-[9px] font-bold text-yellow-400 bg-yellow-400/15 px-1.5 py-0.5 rounded">🏆 MAJOR</span>}
                    {current.tier === 'featured' && <span className="text-[9px] font-bold text-purple-400 bg-purple-400/15 px-1.5 py-0.5 rounded">⭐ FEATURED</span>}
                    {current.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{current.players} jugadores · {current.date}</p>
                </div>
                <span className="text-xs text-gray-500">Clic en fila para ver equipo</span>
              </div>
              <div>
                {current.top8.map((entry, i) => <PlayerRow key={i} entry={entry} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
