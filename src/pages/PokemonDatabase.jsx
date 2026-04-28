import { useState, useMemo } from 'react'
import pokemonData from '../data/pokemon.json'
import TypeBadge from '../components/TypeBadge'

const STAT_ORDER = ['hp','atk','def','spa','spd','spe']
const STAT_LABELS = {hp:'HP',atk:'Atk',def:'Def',spa:'SpA',spd:'SpD',spe:'Spe'}
const STAT_COLORS = {hp:'bg-red-500',atk:'bg-orange-500',def:'bg-blue-500',spa:'bg-purple-500',spd:'bg-green-500',spe:'bg-yellow-500'}
const MAX_STAT = 170

function StatBar({ stat, value }) {
  const pct = Math.min(100, (value / MAX_STAT) * 100)
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-8">{STAT_LABELS[stat]}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div className={`${STAT_COLORS[stat]} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-300 w-8 text-right">{value}</span>
    </div>
  )
}

function MetaSetCard({ set }) {
  const isMega = set.isMega
  return (
    <div className={`rounded-lg p-3 border ${isMega ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-gray-700/50 bg-gray-800/40'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-200">{set.item}</span>
        <div className="flex items-center gap-1.5">
          {isMega && <span className="text-[9px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded font-medium">MEGA</span>}
          <span className="text-[10px] text-gray-500">{set.count} pastes ({set.usagePct}%)</span>
        </div>
      </div>
      <div className="flex gap-3 text-[10px] text-gray-400 mb-2">
        <span className="text-purple-400">{set.nature}</span>
        <span>{set.ability}</span>
      </div>
      {set.evsStr && (
        <div className="text-[10px] text-gray-500 mb-2 font-mono">{set.evsStr}</div>
      )}
      <div className="flex flex-wrap gap-1">
        {set.moves.map((m, i) => (
          <span key={i} className={`text-[10px] px-2 py-0.5 rounded ${i < 2 ? 'bg-brand-900/60 text-brand-300' : 'bg-gray-700/60 text-gray-400'}`}>
            {m}
          </span>
        ))}
      </div>
    </div>
  )
}

function PokemonCard({ pokemon, onClick, selected }) {
  return (
    <div
      onClick={() => onClick(pokemon)}
      className={`card cursor-pointer transition-all hover:border-brand-500/50 ${selected ? 'border-brand-500/60 bg-brand-900/10' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-semibold text-gray-100 text-sm">{pokemon.name}</div>
          <div className="flex gap-1 mt-1">
            {pokemon.types.map(t => <TypeBadge key={t} type={t} />)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-brand-400">{pokemon.metaUsagePct}%</div>
          <div className="text-[10px] text-gray-500">uso meta</div>
        </div>
      </div>
      <div className="text-xs text-gray-500 truncate">
        {pokemon.topItem} · {pokemon.topNature} · {pokemon.topMoves?.slice(0,2).join(', ')}
      </div>
    </div>
  )
}

export default function PokemonDatabase() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [sortBy, setSortBy] = useState('usage')

  const filtered = useMemo(() => {
    let list = [...pokemonData]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) ||
        p.topMoves?.some(m => m.toLowerCase().includes(q)) ||
        p.topItem?.toLowerCase().includes(q))
    }
    if (sortBy === 'usage') list.sort((a, b) => b.metaUsagePct - a.metaUsagePct)
    else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === 'sets') list.sort((a, b) => b.metaSets.length - a.metaSets.length)
    return list
  }, [search, sortBy])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-100 mb-1">Pokémon Database</h2>
        <p className="text-sm text-gray-400">
          {pokemonData.length} Pokémon · sets basados en 514 pastes reales del meta Champions
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por nombre, move o item..."
          className="input flex-1 min-w-48"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input w-auto" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="usage">Ordenar: Uso</option>
          <option value="name">Ordenar: Nombre</option>
          <option value="sets">Ordenar: Sets</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-2 max-h-[700px] overflow-y-auto pr-1">
          {filtered.map(p => (
            <PokemonCard
              key={p.name}
              pokemon={p}
              onClick={setSelected}
              selected={selected?.name === p.name}
            />
          ))}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="space-y-4">
              <div className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-100">{selected.name}</h3>
                    <div className="flex gap-1 mt-1">
                      {selected.types.map(t => <TypeBadge key={t} type={t} />)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-brand-400">{selected.metaUsagePct}%</div>
                    <div className="text-xs text-gray-500">uso en meta ({selected.metaUsage} pastes)</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {STAT_ORDER.map(s => (
                    <StatBar key={s} stat={s} value={selected.baseStats[s] || 0} />
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <div className="text-xs text-gray-500">
                    <span className="mr-3">Abilities: {selected.abilities?.join(', ')}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-200 mb-2 text-sm">
                  Sets del meta ({selected.metaSets.length} variantes)
                </h4>
                <div className="space-y-2">
                  {selected.metaSets.map((set, i) => <MetaSetCard key={i} set={set} />)}
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">👆</div>
              Selecciona un Pokémon para ver sus sets, estadísticas y datos del meta
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
