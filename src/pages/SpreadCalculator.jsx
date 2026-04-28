import { useState } from 'react'
import pokemonData from '../data/pokemon.json'

const STAT_KEYS = ['hp','atk','def','spa','spd','spe']
const STAT_LABELS = {hp:'HP',atk:'Atk',def:'Def',spa:'SpA',spd:'SpD',spe:'Spe'}
const STAT_COLORS = {hp:'#E24B4A',atk:'#D85A30',def:'#378ADD',spa:'#7F77DD',spd:'#1D9E75',spe:'#EF9F27'}

const NATURE_MODS = {
  Hardy:{},Lonely:{atk:1.1,def:0.9},Brave:{atk:1.1,spe:0.9},Adamant:{atk:1.1,spa:0.9},
  Naughty:{atk:1.1,spd:0.9},Bold:{def:1.1,atk:0.9},Docile:{},Relaxed:{def:1.1,spe:0.9},
  Impish:{def:1.1,spa:0.9},Lax:{def:1.1,spd:0.9},Timid:{spe:1.1,atk:0.9},
  Hasty:{spe:1.1,def:0.9},Serious:{},Jolly:{spe:1.1,spa:0.9},Naive:{spe:1.1,spd:0.9},
  Modest:{spa:1.1,atk:0.9},Mild:{spa:1.1,def:0.9},Quiet:{spa:1.1,spe:0.9},
  Bashful:{},Rash:{spa:1.1,spd:0.9},Calm:{spd:1.1,atk:0.9},Gentle:{spd:1.1,def:0.9},
  Sassy:{spd:1.1,spe:0.9},Careful:{spd:1.1,spa:0.9},Quirky:{}
}
const NATURES = Object.keys(NATURE_MODS)

function calcStat(stat, base, ev, nature) {
  const bonus = stat === 'hp' ? 75 : 20
  const raw = base + ev + bonus
  const mod = NATURE_MODS[nature]?.[stat] ?? 1
  return stat === 'hp' ? raw : Math.floor(raw * mod)
}

export default function SpreadCalculator() {
  const [selectedName, setSelectedName] = useState('')
  const [nature, setNature] = useState('Hardy')
  const [evs, setEvs] = useState({hp:0,atk:0,def:0,spa:0,spd:0,spe:0})
  const [compareSet, setCompareSet] = useState(null)

  const pkmn = pokemonData.find(p => p.name === selectedName)

  const setEv = (stat, val) => {
    setEvs({...evs, [stat]: Math.max(0, Math.min(32, Number(val)||0))})
  }

  const loadMetaSet = (setIdx) => {
    const ms = pkmn?.metaSets?.[setIdx]
    if (!ms) return
    setNature(ms.nature)
    setEvs({hp:0,atk:0,def:0,spa:0,spd:0,spe:0,...ms.evs})
    setCompareSet(setIdx)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-100 mb-1">Spread Calculator</h2>
        <p className="text-sm text-gray-400">
          Formato Champions · HP = base + EVs + 75 · Otros = ⌊nature × (base + EVs + 20)⌋ · EVs: 0–32
        </p>
      </div>

      <div className="card">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="label">Pokémon</label>
            <select className="input w-full" value={selectedName}
              onChange={e => { setSelectedName(e.target.value); setEvs({hp:0,atk:0,def:0,spa:0,spd:0,spe:0}); setNature('Hardy'); setCompareSet(null) }}>
              <option value="">-- Seleccionar --</option>
              {pokemonData.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Nature</label>
            <select className="input w-full" value={nature} onChange={e => setNature(e.target.value)}>
              {NATURES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {pkmn && pkmn.metaSets?.length > 0 && (
          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Sets del meta ({pkmn.metaUsage} pastes):</p>
            <div className="flex gap-2 flex-wrap">
              {pkmn.metaSets.map((ms, i) => (
                <button key={i} onClick={() => loadMetaSet(i)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${compareSet===i ? 'border-brand-500 bg-brand-900/30 text-brand-300' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'}`}>
                  {ms.item} <span className="text-gray-500">{ms.nature}</span>
                  <span className="text-gray-600 ml-1">({ms.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="label mb-0">EVs (0–32 por stat, máx 32 cada uno)</label>
            <span className="text-xs font-mono text-gray-500">total: {Object.values(evs).reduce((a,b)=>a+b,0)}</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {STAT_KEYS.map(s => (
              <div key={s} className="text-center">
                <label className="text-[10px] font-medium block mb-1" style={{color: STAT_COLORS[s]}}>{STAT_LABELS[s]}</label>
                <input type="number" min="0" max="32" className="input w-full font-mono text-center px-1"
                  value={evs[s]} onChange={e => setEv(s, e.target.value)} />
                <input type="range" min="0" max="32" className="w-full mt-1 accent-brand-500"
                  value={evs[s]} onChange={e => setEv(s, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {pkmn ? (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold text-gray-100">{pkmn.name} · {nature}</h3>
            <span className="text-xs text-gray-500">uso meta: {pkmn.metaUsagePct}%</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="py-2 px-4 text-left text-xs text-gray-500">Stat</th>
                <th className="py-2 px-4 text-right text-xs text-gray-500">Base</th>
                <th className="py-2 px-4 text-right text-xs text-gray-500">EVs</th>
                <th className="py-2 px-4 text-right text-xs text-gray-500">Final</th>
                <th className="py-2 px-4 text-left text-xs text-gray-500 hidden sm:table-cell">Barra</th>
                {compareSet !== null && <th className="py-2 px-4 text-right text-xs text-gray-500">Meta avg</th>}
              </tr>
            </thead>
            <tbody>
              {STAT_KEYS.map(s => {
                const base = pkmn.baseStats[s] || 0
                const final = calcStat(s, base, evs[s], nature)
                const mod = NATURE_MODS[nature]?.[s] ?? 1
                const color = mod > 1 ? 'text-green-400' : mod < 1 ? 'text-red-400' : 'text-gray-100'
                const metaEv = compareSet !== null ? (pkmn.metaSets[compareSet]?.evs?.[s] ?? 0) : null
                const metaNat = compareSet !== null ? pkmn.metaSets[compareSet]?.nature : null
                const metaFinal = metaNat ? calcStat(s, base, metaEv, metaNat) : null
                return (
                  <tr key={s} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="py-2 px-4 text-sm font-medium" style={{color: STAT_COLORS[s]}}>{STAT_LABELS[s]}</td>
                    <td className="py-2 px-4 text-right font-mono text-sm text-gray-400">{base}</td>
                    <td className="py-2 px-4 text-right font-mono text-sm text-gray-400">{evs[s]}</td>
                    <td className={`py-2 px-4 text-right font-mono text-sm font-semibold ${color}`}>{final}</td>
                    <td className="py-2 px-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-800 rounded-full h-1.5 w-20">
                          <div className="h-1.5 rounded-full" style={{width:`${Math.min(100,(final/220)*100)}%`, backgroundColor: STAT_COLORS[s]}} />
                        </div>
                      </div>
                    </td>
                    {compareSet !== null && (
                      <td className={`py-2 px-4 text-right font-mono text-xs ${metaFinal === final ? 'text-gray-500' : metaFinal > final ? 'text-green-400' : 'text-red-400'}`}>
                        {metaFinal} {metaEv > 0 && <span className="text-gray-600">({metaEv}ev)</span>}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-500">
            Fórmula Champions: HP = base + evs + 75 · Otros = ⌊{'{'}nature × (base + evs + 20){'}'}⌋ · No hay IVs
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-500">Selecciona un Pokémon arriba</div>
      )}
    </div>
  )
}
