import { useState } from 'react'
import metaStats from '../data/metaStats.json'

const STAT_COLORS = {
  HP: '#E24B4A', Atk: '#D85A30', Def: '#378ADD',
  SpA: '#7F77DD', SpD: '#1D9E75', Spe: '#EF9F27'
}

function UsageRow({ rank, entry }) {
  const maxT8 = 66
  const barW = Math.min(100, (entry.top8 / maxT8) * 100)
  const convColor = entry.convRate >= 20 ? 'text-green-400' : entry.convRate >= 13 ? 'text-yellow-400' : 'text-gray-500'
  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
      <td className="py-2 px-3 text-gray-500 text-xs w-8">{rank}</td>
      <td className="py-2 px-3 font-medium text-gray-100 text-sm">{entry.name}</td>
      <td className="py-2 px-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-800 rounded-full h-1.5 w-20">
            <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${barW}%` }} />
          </div>
          <span className="text-xs font-mono text-gray-300 w-8 text-right">{entry.top8}</span>
        </div>
      </td>
      <td className="py-2 px-3 text-xs font-mono text-gray-400">{entry.usagePct}%</td>
      <td className="py-2 px-3 text-xs font-mono text-gray-400">{entry.top1}</td>
      <td className={`py-2 px-3 text-xs font-mono ${convColor}`}>{entry.convRate}%</td>
    </tr>
  )
}

function DuoCard({ duo }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {duo.pokemon.map(name => (
          <span key={name} className="px-2 py-1 bg-gray-800 rounded text-xs font-medium text-gray-200">{name}</span>
        ))}
      </div>
      <div className="flex gap-4 text-xs">
        <div><span className="text-gray-500">Apariciones </span><span className="font-mono text-gray-200">{duo.count}</span></div>
        <div><span className="text-gray-500">Co-uso </span><span className="font-mono text-yellow-400">{duo.usagePct}%</span></div>
      </div>
    </div>
  )
}

function MoveRow({ move }) {
  const maxCount = metaStats.topMoves[0]?.count || 1
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-xs text-gray-300 min-w-32 truncate">{move.move}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(move.count/maxCount)*100}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-500 w-8 text-right">{move.count}</span>
    </div>
  )
}

function ItemRow({ item }) {
  const maxCount = metaStats.topItems[0]?.count || 1
  const isMega = item.item.endsWith('ite') || item.item.endsWith('nite')
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className={`text-xs min-w-32 truncate ${isMega ? 'text-yellow-400' : 'text-gray-300'}`}>{item.item}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${isMega ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${(item.count/maxCount)*100}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-500 w-8 text-right">{item.count}</span>
    </div>
  )
}

export default function MetaDashboard() {
  const [tab, setTab] = useState('usage')
  const sorted = [...metaStats.usageStats].sort((a, b) => b.top8 - a.top8)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-100 mb-1">Meta Dashboard</h2>
        <p className="text-sm text-gray-400">
          {metaStats.format} · {metaStats.regulation} · {metaStats.totalTournaments} torneos · {metaStats.totalTop8Entries} jugadores top 8 · {metaStats.totalPastes} pastes
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="card text-center"><div className="text-2xl font-bold text-brand-400">{metaStats.totalTournaments}</div><div className="text-xs text-gray-400 mt-1">Torneos</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-brand-400">{metaStats.totalTop8Entries}</div><div className="text-xs text-gray-400 mt-1">Top 8 jugadores</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-brand-400">{metaStats.totalPastes}</div><div className="text-xs text-gray-400 mt-1">Pastes analizados</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-brand-400">{metaStats.usageStats.length}</div><div className="text-xs text-gray-400 mt-1">Pokémon rastreados</div></div>
      </div>

      <div className="flex gap-2">
        {['usage','duos','moves','items'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab===t ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            {t === 'usage' ? 'Uso' : t === 'duos' ? 'Duos' : t === 'moves' ? 'Moves' : 'Items'}
          </button>
        ))}
      </div>

      {tab === 'usage' && (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="font-semibold text-gray-100 text-sm">Pokémon más usados en top 8</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">#</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Pokémon</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">T8 aps.</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">% T8</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Victorias</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Conv%</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry, i) => <UsageRow key={entry.name} rank={i+1} entry={entry} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'duos' && (
        <div>
          <h3 className="font-semibold text-gray-100 mb-3 text-sm">Duos más frecuentes en top 8 ({metaStats.topDuos[0]?.count || 0} máx)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metaStats.topDuos.map((duo, i) => <DuoCard key={i} duo={duo} />)}
          </div>
        </div>
      )}

      {tab === 'moves' && (
        <div className="card">
          <h3 className="font-semibold text-gray-100 mb-4 text-sm">Top 30 moves en 514 pastes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {metaStats.topMoves.map((m, i) => <MoveRow key={i} move={m} />)}
          </div>
        </div>
      )}

      {tab === 'items' && (
        <div className="card">
          <h3 className="font-semibold text-gray-100 mb-4 text-sm">Items más usados (Mega en amarillo)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {metaStats.topItems.map((item, i) => <ItemRow key={i} item={item} />)}
          </div>
        </div>
      )}
    </div>
  )
}
