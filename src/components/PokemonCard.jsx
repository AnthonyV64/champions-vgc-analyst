import TypeBadge from './TypeBadge'
import StatBar from './StatBar'

const STAT_LABELS = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' }

export default function PokemonCard({ pokemon, compact = false }) {
  if (!pokemon) return null
  const set = pokemon.metaSets?.[0]

  return (
    <div className="card hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-semibold text-gray-100 text-sm">{pokemon.name}</h3>
          <div className="flex gap-1 mt-1 flex-wrap">
            {pokemon.types.map(t => <TypeBadge key={t} type={t} />)}
          </div>
        </div>
        {set && (
          <div className="text-right text-xs text-gray-400 shrink-0">
            <div>{set.item}</div>
            <div>{set.nature}</div>
          </div>
        )}
      </div>

      {!compact && (
        <div className="space-y-1 mb-3">
          {Object.entries(pokemon.baseStats).map(([stat, val]) => (
            <StatBar key={stat} label={STAT_LABELS[stat]} value={val} />
          ))}
        </div>
      )}

      {set && !compact && (
        <div className="border-t border-gray-800 pt-2 mt-2">
          <div className="text-xs text-gray-400 mb-1">{set.ability}</div>
          <div className="flex flex-wrap gap-1">
            {set.moves.map(m => (
              <span key={m} className="badge bg-gray-800 text-gray-300">{m}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
