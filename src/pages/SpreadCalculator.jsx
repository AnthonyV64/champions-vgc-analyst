import { useState, useMemo, useRef, useEffect } from 'react'
import pokemonData from '../data/pokemon.json'

// Re-export DamageCalc as the full page — imports the component from Teambuilder
// We do this by extracting just the calc logic here as a standalone page

// All the calc logic lives in Teambuilder.jsx and is exported via the DamageCalc component.
// This page wraps it with a full-page layout and access to the shared team state.

export default function DamageCalcPage({ team }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-100">Damage Calculator</h2>
        <p className="text-sm text-gray-400">
          Calculadora Champions · Los Pokémon de tu equipo se sincronizan en tiempo real
          {team?.some(s => s.name) && (
            <span className="ml-2 text-brand-400 font-medium">
              · {team.filter(s => s.name).length} Pokémon cargados del Teambuilder
            </span>
          )}
        </p>
      </div>
      <DamageCalcInner team={team || []} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline damage calc (same logic as in Teambuilder, standalone)
// ─────────────────────────────────────────────────────────────────────────────

const STAT_KEYS = ['hp','atk','def','spa','spd','spe']
const STAT_LABELS = {hp:'HP',atk:'Atk',def:'Def',spa:'SpA',spd:'SpD',spe:'Spe'}
const STAT_COLORS = {hp:'#E24B4A',atk:'#D85A30',def:'#378ADD',spa:'#7F77DD',spd:'#1D9E75',spe:'#EF9F27'}

const NATURES = ['Hardy','Lonely','Brave','Adamant','Naughty','Bold','Docile','Relaxed',
  'Impish','Lax','Timid','Hasty','Serious','Jolly','Naive','Modest','Mild','Quiet',
  'Bashful','Rash','Calm','Gentle','Sassy','Careful','Quirky']

const NATURE_MODS = {
  Hardy:{},Lonely:{atk:1.1,def:0.9},Brave:{atk:1.1,spe:0.9},Adamant:{atk:1.1,spa:0.9},
  Naughty:{atk:1.1,spd:0.9},Bold:{def:1.1,atk:0.9},Docile:{},Relaxed:{def:1.1,spe:0.9},
  Impish:{def:1.1,spa:0.9},Lax:{def:1.1,spd:0.9},Timid:{spe:1.1,atk:0.9},
  Hasty:{spe:1.1,def:0.9},Serious:{},Jolly:{spe:1.1,spa:0.9},Naive:{spe:1.1,spd:0.9},
  Modest:{spa:1.1,atk:0.9},Mild:{spa:1.1,def:0.9},Quiet:{spa:1.1,spe:0.9},
  Bashful:{},Rash:{spa:1.1,spd:0.9},Calm:{spd:1.1,atk:0.9},Gentle:{spd:1.1,def:0.9},
  Sassy:{spd:1.1,spe:0.9},Careful:{spd:1.1,spa:0.9},Quirky:{}
}

const NORM_EV = {'HP':'hp','Atk':'atk','Def':'def','SpA':'spa','SpD':'spd','Spe':'spe'}
function normEvs(evs) {
  const out = {hp:0,atk:0,def:0,spa:0,spd:0,spe:0}
  Object.entries(evs||{}).forEach(([k,v]) => { const key = NORM_EV[k]||k.toLowerCase(); if (key in out) out[key]=v })
  return out
}

const TYPE_COLORS = {
  Normal:'#A8A878',Fire:'#F08030',Water:'#6890F0',Electric:'#F8D030',Grass:'#78C850',
  Ice:'#98D8D8',Fighting:'#C03028',Poison:'#A040A0',Ground:'#E0C068',Flying:'#A890F0',
  Psychic:'#F85888',Bug:'#A8B820',Rock:'#B8A038',Ghost:'#705898',Dragon:'#7038F8',
  Dark:'#705848',Steel:'#B8B8D0',Fairy:'#EE99AC'
}

const TYPE_CHART = {
  Normal:{Rock:0.5,Steel:0.5,Ghost:0},Fire:{Fire:0.5,Water:0.5,Rock:0.5,Dragon:0.5,Grass:2,Ice:2,Bug:2,Steel:2},
  Water:{Water:0.5,Grass:0.5,Dragon:0.5,Fire:2,Ground:2,Rock:2},
  Electric:{Electric:0.5,Grass:0.5,Dragon:0.5,Ground:0,Flying:2,Water:2},
  Grass:{Fire:0.5,Grass:0.5,Poison:0.5,Flying:0.5,Bug:0.5,Dragon:0.5,Steel:0.5,Water:2,Ground:2,Rock:2},
  Ice:{Water:0.5,Grass:2,Ground:2,Flying:2,Dragon:2,Ice:0.5,Steel:0.5,Fire:0.5},
  Fighting:{Normal:2,Ice:2,Rock:2,Dark:2,Steel:2,Poison:0.5,Flying:0.5,Psychic:0.5,Bug:0.5,Ghost:0,Fairy:0.5},
  Poison:{Grass:2,Fairy:2,Poison:0.5,Ground:0.5,Rock:0.5,Ghost:0.5,Steel:0},
  Ground:{Fire:2,Electric:2,Poison:2,Rock:2,Steel:2,Grass:0.5,Bug:0.5,Flying:0},
  Flying:{Grass:2,Fighting:2,Bug:2,Electric:0.5,Rock:0.5,Steel:0.5},
  Psychic:{Fighting:2,Poison:2,Psychic:0.5,Steel:0.5,Dark:0},
  Bug:{Grass:2,Psychic:2,Dark:2,Fire:0.5,Fighting:0.5,Flying:0.5,Ghost:0.5,Steel:0.5,Fairy:0.5},
  Rock:{Fire:2,Ice:2,Flying:2,Bug:2,Fighting:0.5,Ground:0.5,Steel:0.5},
  Ghost:{Ghost:2,Psychic:2,Normal:0,Dark:0.5},Dragon:{Dragon:2,Steel:0.5,Fairy:0},
  Dark:{Psychic:2,Ghost:2,Fighting:0.5,Dark:0.5,Fairy:0.5},
  Steel:{Ice:2,Rock:2,Fairy:2,Fire:0.5,Water:0.5,Electric:0.5,Steel:0.5,Poison:0,Ground:0.5},
  Fairy:{Fighting:2,Dragon:2,Dark:2,Fire:0.5,Poison:0.5,Steel:0.5},
}

function typeEff(mtype, defTypes) {
  let m = 1; (defTypes||[]).forEach(t => { m *= TYPE_CHART[mtype]?.[t]??1 }); return m
}

const MOVES = {
  'Close Combat':{bp:120,cat:'physical',type:'Fighting'},'Earthquake':{bp:100,cat:'physical',type:'Ground',spread:true},
  'Rock Slide':{bp:75,cat:'physical',type:'Rock',spread:true},'Dragon Claw':{bp:80,cat:'physical',type:'Dragon'},
  'Kowtow Cleave':{bp:85,cat:'physical',type:'Dark'},'Sucker Punch':{bp:70,cat:'physical',type:'Dark',priority:1},
  'Iron Head':{bp:80,cat:'physical',type:'Steel'},'Flare Blitz':{bp:120,cat:'physical',type:'Fire'},
  'Fake Out':{bp:40,cat:'physical',type:'Normal',priority:3},'Wave Crash':{bp:120,cat:'physical',type:'Water'},
  'Aqua Jet':{bp:40,cat:'physical',type:'Water',priority:1},'Bullet Punch':{bp:40,cat:'physical',type:'Steel',priority:1},
  'Shadow Sneak':{bp:40,cat:'physical',type:'Ghost',priority:1},'Stomping Tantrum':{bp:75,cat:'physical',type:'Ground'},
  'Darkest Lariat':{bp:85,cat:'physical',type:'Dark'},'Throat Chop':{bp:80,cat:'physical',type:'Dark'},
  'Brave Bird':{bp:120,cat:'physical',type:'Flying'},'Poltergeist':{bp:110,cat:'physical',type:'Ghost'},
  'Dire Claw':{bp:80,cat:'physical',type:'Poison'},'Flip Turn':{bp:60,cat:'physical',type:'Water'},
  'Liquidation':{bp:85,cat:'physical',type:'Water'},'Body Press':{bp:80,cat:'physical',type:'Fighting',useDefAsDmg:true},
  'Drain Punch':{bp:75,cat:'physical',type:'Fighting'},'Mach Punch':{bp:40,cat:'physical',type:'Fighting',priority:1},
  'Ice Punch':{bp:75,cat:'physical',type:'Ice'},'Thunder Punch':{bp:75,cat:'physical',type:'Electric'},
  'Crunch':{bp:80,cat:'physical',type:'Dark'},'Knock Off':{bp:65,cat:'physical',type:'Dark'},
  'Icicle Crash':{bp:85,cat:'physical',type:'Ice'},'Ice Shard':{bp:40,cat:'physical',type:'Ice',priority:1},
  'Flower Trick':{bp:70,cat:'physical',type:'Grass'},'Last Respects':{bp:50,cat:'physical',type:'Ghost'},
  'Scale Shot':{bp:25,cat:'physical',type:'Dragon',hits:5},'Dual Wingbeat':{bp:40,cat:'physical',type:'Flying',hits:2},
  'Extreme Speed':{bp:80,cat:'physical',type:'Normal',priority:2},
  'Heat Wave':{bp:95,cat:'special',type:'Fire',spread:true},'Weather Ball':{bp:50,cat:'special',type:'Normal',weatherBall:true},
  'Solar Beam':{bp:120,cat:'special',type:'Grass'},'Dazzling Gleam':{bp:80,cat:'special',type:'Fairy',spread:true},
  'Moonblast':{bp:95,cat:'special',type:'Fairy'},'Light of Ruin':{bp:140,cat:'special',type:'Fairy'},
  'Hurricane':{bp:110,cat:'special',type:'Flying'},'Shadow Ball':{bp:80,cat:'special',type:'Ghost'},
  'Sludge Bomb':{bp:90,cat:'special',type:'Poison'},'Blizzard':{bp:110,cat:'special',type:'Ice',spread:true},
  'Thunderbolt':{bp:90,cat:'special',type:'Electric'},'Electro Shot':{bp:130,cat:'special',type:'Electric'},
  'Flash Cannon':{bp:80,cat:'special',type:'Steel'},'Draco Meteor':{bp:130,cat:'special',type:'Dragon'},
  'Hydro Pump':{bp:110,cat:'special',type:'Water'},'Scald':{bp:80,cat:'special',type:'Water'},
  'Psychic':{bp:90,cat:'special',type:'Psychic'},'Hyper Voice':{bp:90,cat:'special',type:'Normal',spread:true},
  'Matcha Gotcha':{bp:80,cat:'special',type:'Grass',spread:true},'Dragon Pulse':{bp:85,cat:'special',type:'Dragon'},
  'Earth Power':{bp:90,cat:'special',type:'Ground'},'Aura Sphere':{bp:80,cat:'special',type:'Fighting'},
  'Overheat':{bp:130,cat:'special',type:'Fire'},'Dark Pulse':{bp:80,cat:'special',type:'Dark'},
  'Volt Switch':{bp:70,cat:'special',type:'Electric'},'Leaf Storm':{bp:130,cat:'special',type:'Grass'},
  'Energy Ball':{bp:90,cat:'special',type:'Grass'},'Clanging Scales':{bp:110,cat:'special',type:'Dragon',spread:true},
  'Focus Blast':{bp:120,cat:'special',type:'Fighting'},'Icy Wind':{bp:55,cat:'special',type:'Ice',spread:true},
  'Psyshock':{bp:80,cat:'special',type:'Psychic',usePhysDef:true},
  'Eruption':{bp:150,cat:'special',type:'Fire',spread:true,hpBased:true},
  'Thunderclap':{bp:80,cat:'special',type:'Electric',priority:1},
  'Snarl':{bp:55,cat:'special',type:'Dark',spread:true},'Power Gem':{bp:80,cat:'special',type:'Rock'},
  'Protect':{bp:0,cat:'status',type:'Normal'},'Tailwind':{bp:0,cat:'status',type:'Flying'},
  'Trick Room':{bp:0,cat:'status',type:'Psychic'},'Calm Mind':{bp:0,cat:'status',type:'Psychic'},
  'Helping Hand':{bp:0,cat:'status',type:'Normal'},'Follow Me':{bp:0,cat:'status',type:'Normal'},
  'Rage Powder':{bp:0,cat:'status',type:'Bug'},'Wide Guard':{bp:0,cat:'status',type:'Rock'},
}

const ALL_MOVES = Object.keys(MOVES).sort()
const META_MOVES = [...new Set(pokemonData.flatMap(p => p.metaSets?.flatMap(s=>s.moves)??[]))].sort()

function calcStat(stat, base, ev, nature) {
  const mod = NATURE_MODS[nature]?.[stat]??1
  return stat==='hp' ? base+ev+75 : Math.floor((base+ev+20)*mod)
}

function compute({ atkPkmn, defPkmn, atkEvs, defEvs, atkNature, defNature,
  atkItem, defItem, atkAbility, defAbility, moveName,
  atkBoost=0, defBoost=0, weather='none', isCrit=false,
  isHH=false, isBurn=false, hasScreen=false, atkHpPct=100, defHpFull=true }) {

  const mv = MOVES[moveName]
  if (!mv || mv.cat==='status' || mv.bp===0) return null

  let mtype = mv.type, bp = mv.bp
  if (mv.weatherBall) { const wm={sun:'Fire',rain:'Water',sand:'Rock',hail:'Ice'}; if(wm[weather]){mtype=wm[weather];bp=100} }
  if (mv.hpBased) bp = Math.max(1, Math.floor(bp*atkHpPct/100))

  const cat = mv.cat
  const useDefAsDmg = mv.useDefAsDmg
  const usePhysDef = mv.usePhysDef
  const atkKey = useDefAsDmg ? 'def' : cat==='special' ? 'spa' : 'atk'
  const defKey = usePhysDef ? 'def' : cat==='special' ? 'spd' : 'def'

  const bt = [0.25,0.29,0.33,0.4,0.5,1,1.5,2,2.5,3,3.5,4]
  let atkStat = calcStat(atkKey, atkPkmn.baseStats[atkKey]||0, atkEvs[atkKey]||0, atkNature)
  let defStat = calcStat(defKey, defPkmn.baseStats[defKey]||0, defEvs[defKey]||0, defNature)
  const defHp  = calcStat('hp', defPkmn.baseStats.hp||0, defEvs.hp||0, defNature)

  // Huge Power / Pure Power
  if (['Huge Power','Pure Power'].includes(atkAbility) && cat==='physical') atkStat = Math.floor(atkStat*2)

  atkStat = Math.floor(atkStat * bt[Math.min(11,Math.max(0,atkBoost+5))])
  defStat = Math.floor(defStat * bt[Math.min(11,Math.max(0,defBoost+5))])

  const base = Math.floor(Math.floor(Math.floor(2*50/5+2)*bp*atkStat/defStat)/50)+2
  const spread = (mv.spread||false) ? 0.75 : 1
  let wMod = 1
  if (weather==='sun' && mtype==='Fire') wMod=1.5
  if (weather==='sun' && mtype==='Water') wMod=0.5
  if (weather==='rain' && mtype==='Water') wMod=1.5
  if (weather==='rain' && mtype==='Fire') wMod=0.5
  const crit = isCrit ? 1.5 : 1
  const stab = (atkPkmn.types||[]).includes(mtype) ? (atkAbility==='Adaptability'?2:1.5) : 1
  const eff = typeEff(mtype, defPkmn.types||[])
  if (eff===0) return {immune:true, moveType:mtype}
  const burn = (isBurn && cat==='physical' && atkAbility!=='Guts') ? 0.5 : 1
  const screen = (hasScreen && !isCrit) ? 2/3 : 1
  const multiscale = (['Multiscale','Shadow Shield'].includes(defAbility) && defHpFull) ? 0.5 : 1
  const filter = (['Filter','Solid Rock','Prism Armor'].includes(defAbility) && eff>1) ? 0.75 : 1
  const hh = isHH ? 1.5 : 1
  // Item type boosts
  const itemBoostMap = {
    'Soft Sand':'Ground','Charcoal':'Fire','Mystic Water':'Water','Spell Tag':'Ghost',
    'Black Glasses':'Dark','Dragon Fang':'Dragon','Fairy Feather':'Fairy','Sharp Beak':'Flying',
    'Twisted Spoon':'Psychic','Silver Powder':'Bug','Hard Stone':'Rock','Metal Coat':'Steel',
    'Miracle Seed':'Grass','Magnet':'Electric','Poison Barb':'Poison','Never-Melt Ice':'Ice','Silk Scarf':'Normal',
  }
  const atkItemMult = itemBoostMap[atkItem]===mtype ? 1.2 : 1
  const berryMap = {'Chople Berry':'Fighting','Colbur Berry':'Dark','Shuca Berry':'Ground','Occa Berry':'Fire','Kasib Berry':'Ghost','Yache Berry':'Ice'}
  const defItemMult = (berryMap[defItem]===mtype && eff>0) ? 0.5 : 1

  const hits = mv.hits || 1
  const rolls = []
  for (let r=85;r<=100;r++) {
    let d = base
    d = Math.floor(d*spread)
    d = Math.floor(d*wMod)
    d = Math.floor(d*crit)
    d = Math.floor(d*r/100)
    d = Math.floor(d*stab)
    d = Math.floor(d*eff)
    d = Math.floor(d*burn)
    d = Math.floor(d*screen)
    d = Math.floor(d*multiscale)
    d = Math.floor(d*filter)
    d = Math.floor(d*atkItemMult)
    d = Math.floor(d*defItemMult)
    d = Math.floor(d*hh)
    d = Math.max(1,d) * hits
    rolls.push(d)
  }
  const min=rolls[0], max=rolls[15]
  const minPct=Math.round(min/defHp*1000)/10
  const maxPct=Math.round(max/defHp*1000)/10
  const koRolls=rolls.filter(r=>r>=defHp).length
  return {
    min,max,minPct,maxPct,defHp,rolls,stab,eff,wMod,spread,crit,burn,screen,
    multiscale,filter,atkItemMult,defItemMult,hh,
    ko1:max>=defHp, ko2:min*2>=defHp, ko3:min*3>=defHp,
    koPct:Math.round(koRolls/16*100),
    bp, hits, mtype,
    descLine:`${atkEvs[atkKey]||0}${NATURE_MODS[atkNature]?.[atkKey]>1?'+':''} ${STAT_LABELS[atkKey]} ${atkPkmn.name} ${moveName} vs. ${defEvs.hp||0} HP / ${defEvs[defKey]||0}${NATURE_MODS[defNature]?.[defKey]<1?'-':''} ${STAT_LABELS[defKey]} ${defPkmn.name}: ${min}–${max} (${minPct}%–${maxPct}%)`,
  }
}

function EvRow({ stat, value, base, nature, onChange }) {
  const final = base ? calcStat(stat, base, value, nature) : null
  const mod = NATURE_MODS[nature]?.[stat]??1
  const pct = (value/32)*100
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xs w-8 text-right font-medium" style={{color:STAT_COLORS[stat]}}>{STAT_LABELS[stat]}</span>
      <input type="range" min="0" max="32" value={value} onChange={e=>onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
        style={{background:`linear-gradient(to right, ${STAT_COLORS[stat]} ${pct}%, #374151 ${pct}%)`}} />
      <input type="number" min="0" max="32" value={value}
        onChange={e=>onChange(Math.max(0,Math.min(32,Number(e.target.value)||0)))}
        className="w-10 text-center text-xs bg-gray-800 border border-gray-700 rounded px-1 py-0.5 font-mono text-gray-200" />
      {final!==null && <span className={`text-xs font-mono w-8 text-right ${mod>1?'text-green-400':mod<1?'text-red-400':'text-gray-400'}`}>{final}</span>}
    </div>
  )
}

import { getSprite } from '../data/sprites.js'

const TYPE_COLORS_S = {
  Normal:'#A8A878',Fire:'#F08030',Water:'#6890F0',Electric:'#F8D030',Grass:'#78C850',
  Ice:'#98D8D8',Fighting:'#C03028',Poison:'#A040A0',Ground:'#E0C068',Flying:'#A890F0',
  Psychic:'#F85888',Bug:'#A8B820',Rock:'#B8A038',Ghost:'#705898',Dragon:'#7038F8',
  Dark:'#705848',Steel:'#B8B8D0',Fairy:'#EE99AC'
}

function PokemonSearch({ value, onChange, placeholder }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const sorted = useMemo(() => [...pokemonData].sort((a,b) => a.name.localeCompare(b.name)), [])
  const results = useMemo(() => {
    if (!q) return sorted
    const s = q.toLowerCase()
    return sorted.filter(p => p.name.toLowerCase().includes(s))
  }, [q, sorted])

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const selected = pokemonData.find(p => p.name === value)

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="input w-full flex items-center gap-2 text-left cursor-pointer min-h-[38px]">
        {selected ? (
          <>
            <img src={getSprite(selected.name)} alt={selected.name}
              className="w-6 h-6 object-contain flex-shrink-0" style={{imageRendering:'crisp-edges'}} />
            <span className="flex-1 text-sm text-gray-100 truncate">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 text-sm text-gray-500">{placeholder || '-- Pokémon --'}</span>
        )}
        <span className="text-gray-600 text-xs ml-1">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl flex flex-col" style={{maxHeight:'300px'}}>
          <div className="p-2 border-b border-gray-800 flex-shrink-0">
            <input autoFocus className="input w-full text-sm" placeholder="Buscar..."
              value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="overflow-y-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-800 text-gray-500 text-sm"
              onMouseDown={() => { onChange(''); setQ(''); setOpen(false) }}>-- Ninguno --</div>
            {results.map(p => (
              <div key={p.name}
                className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-800 ${value===p.name?'bg-brand-900/30':''}`}
                onMouseDown={() => { onChange(p.name); setQ(''); setOpen(false) }}>
                <img src={getSprite(p.name)} alt={p.name}
                  className="w-7 h-7 object-contain flex-shrink-0" style={{imageRendering:'crisp-edges'}} />
                <span className="text-sm text-gray-100 flex-1">{p.name}</span>
                <div className="flex gap-1">
                  {p.types.map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded text-white"
                      style={{backgroundColor:TYPE_COLORS_S[t]||'#888'}}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MoveSearch({ value, onChange, suggested, placeholder }) {
  const [q, setQ] = useState(value)
  const [open, setOpen] = useState(false)
  const results = useMemo(() => {
    const s = q.toLowerCase()
    if (!s) return suggested.slice(0,8)
    const sg = suggested.filter(m=>m.toLowerCase().includes(s))
    const rest = ALL_MOVES.filter(m=>m.toLowerCase().includes(s)&&!sg.includes(m))
    return [...sg,...rest].slice(0,10)
  }, [q, suggested])
  return (
    <div className="relative">
      <input className="input w-full text-sm" value={q} placeholder={placeholder||'Move...'}
        onChange={e=>{setQ(e.target.value);onChange(e.target.value);setOpen(true)}}
        onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),150)} />
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-44 overflow-y-auto">
          {results.map(m => {
            const mv = MOVES[m]
            return (
              <div key={m} className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-800 ${suggested.includes(m)?'text-brand-300':'text-gray-300'}`}
                onMouseDown={()=>{onChange(m);setQ(m);setOpen(false)}}>
                <span className="flex-1 text-sm">{m}</span>
                {mv&&mv.bp>0&&<span className="text-[10px] text-gray-500">{mv.bp}BP</span>}
                {mv&&<span className="text-[9px] px-1.5 py-0.5 rounded text-white" style={{backgroundColor:TYPE_COLORS[mv.type]||'#888'}}>{mv.type}</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function BoostRow({ value, onChange, color='blue' }) {
  const boosts = [-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6]
  return (
    <div className="flex flex-wrap gap-1">
      {boosts.map(b => (
        <button key={b} onClick={()=>onChange(b)}
          className={`text-[10px] w-7 h-7 rounded font-mono transition-colors ${value===b
            ? color==='red' ? 'bg-red-700 text-white' : 'bg-brand-600 text-white'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
          {b>0?`+${b}`:b}
        </button>
      ))}
    </div>
  )
}

function SlotPicker({ source, setSource, idx, setIdx, team, label }) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        <button onClick={()=>setSource('team')} className={`text-[10px] px-2.5 py-1 rounded font-semibold transition-colors ${source==='team'?'bg-brand-600 text-white':'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
          📋 Mi equipo
        </button>
        <button onClick={()=>setSource('custom')} className={`text-[10px] px-2.5 py-1 rounded font-semibold transition-colors ${source==='custom'?'bg-brand-600 text-white':'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
          ✏️ Personalizado
        </button>
      </div>
      {source==='team' && (
        <div className="flex gap-1.5 flex-wrap">
          {team.map((slot,i) => slot.name ? (
            <button key={i} onClick={()=>setIdx(i)}
              className={`text-[10px] px-2.5 py-2 rounded-lg border transition-colors text-left ${idx===i?'bg-brand-600/30 border-brand-500/50 text-brand-300':'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
              <div className="font-semibold">{slot.name}</div>
              <div className="text-gray-500 font-normal text-[9px]">{slot.nature} · {(slot.item||'').slice(0,10)}</div>
            </button>
          ) : null)}
          {!team.some(s=>s.name) && <span className="text-[10px] text-gray-600 italic">Agrega Pokémon en el Teambuilder</span>}
        </div>
      )}
    </div>
  )
}

function DamageCalcInner({ team }) {
  const [atkSrc, setAtkSrc] = useState('custom')
  const [atkIdx, setAtkIdx] = useState(0)
  const [atkName2, setAtkName2] = useState('')
  const [atkNat2, setAtkNat2] = useState('Hardy')
  const [atkEvs2, setAtkEvs2] = useState({hp:0,atk:0,def:0,spa:0,spd:0,spe:0})
  const [atkItem2, setAtkItem2] = useState('')
  const [atkAb2, setAtkAb2] = useState('')
  const [atkBoost, setAtkBoost] = useState(0)
  const [atkBurn, setAtkBurn] = useState(false)
  const [atkHpPct, setAtkHpPct] = useState(100)

  const [defSrc, setDefSrc] = useState('custom')
  const [defIdx, setDefIdx] = useState(0)
  const [defName2, setDefName2] = useState('')
  const [defNat2, setDefNat2] = useState('Hardy')
  const [defEvs2, setDefEvs2] = useState({hp:0,atk:0,def:0,spa:0,spd:0,spe:0})
  const [defItem2, setDefItem2] = useState('')
  const [defAb2, setDefAb2] = useState('')
  const [defBoost, setDefBoost] = useState(0)
  const [defHpFull, setDefHpFull] = useState(true)

  const [moveName, setMoveName] = useState('')
  const [weather, setWeather] = useState('none')
  const [isCrit, setIsCrit] = useState(false)
  const [isHH, setIsHH] = useState(false)
  const [hasScreen, setHasScreen] = useState(false)

  // Resolve live values from team or custom
  const atkSlot = atkSrc==='team' ? team[atkIdx] : null
  const atkName   = atkSrc==='team' ? (atkSlot?.name||'')    : atkName2
  const atkNature = atkSrc==='team' ? (atkSlot?.nature||'Hardy') : atkNat2
  const atkEvs    = atkSrc==='team' ? (atkSlot?.evs||{hp:0,atk:0,def:0,spa:0,spd:0,spe:0}) : atkEvs2
  const atkItem   = atkSrc==='team' ? (atkSlot?.item||'')    : atkItem2
  const atkAbility= atkSrc==='team' ? (atkSlot?.ability||'') : atkAb2

  const defSlot = defSrc==='team' ? team[defIdx] : null
  const defName   = defSrc==='team' ? (defSlot?.name||'')    : defName2
  const defNature = defSrc==='team' ? (defSlot?.nature||'Hardy') : defNat2
  const defEvs    = defSrc==='team' ? (defSlot?.evs||{hp:0,atk:0,def:0,spa:0,spd:0,spe:0}) : defEvs2
  const defItem   = defSrc==='team' ? (defSlot?.item||'')    : defItem2
  const defAbility= defSrc==='team' ? (defSlot?.ability||'') : defAb2

  const atkPkmn = pokemonData.find(p=>p.name===atkName)
  const defPkmn = pokemonData.find(p=>p.name===defName)

  const suggested = useMemo(() => {
    const slotMoves = atkSlot?.moves?.filter(Boolean)||[]
    if (!atkPkmn) return slotMoves
    const c={}
    slotMoves.forEach(m=>{c[m]=(c[m]||0)+10})
    atkPkmn.metaSets?.forEach(s=>s.moves.forEach(m=>{c[m]=(c[m]||0)+1}))
    return Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([m])=>m)
  }, [atkPkmn, atkSlot])

  const result = useMemo(() => {
    if (!atkPkmn||!defPkmn||!moveName) return null
    return compute({
      atkPkmn,defPkmn,atkEvs,defEvs,atkNature,defNature,
      atkItem,defItem,atkAbility,defAbility,moveName,
      atkBoost,defBoost,weather,isCrit,isHH,isBurn:atkBurn,
      hasScreen,atkHpPct,defHpFull,
    })
  }, [atkPkmn,defPkmn,atkEvs,defEvs,atkNature,defNature,atkItem,defItem,
    atkAbility,defAbility,moveName,atkBoost,defBoost,weather,isCrit,isHH,atkBurn,hasScreen,atkHpPct,defHpFull])

  const swap = () => {
    const [s1,i1,n1,nat1,e1,it1,ab1] = [atkSrc,atkIdx,atkName2,atkNat2,atkEvs2,atkItem2,atkAb2]
    setAtkSrc(defSrc);setAtkIdx(defIdx);setAtkName2(defName2);setAtkNat2(defNat2);setAtkEvs2(defEvs2);setAtkItem2(defItem2);setAtkAb2(defAb2)
    setDefSrc(s1);setDefIdx(i1);setDefName2(n1);setDefNat2(nat1);setDefEvs2(e1);setDefItem2(it1);setDefAb2(ab1)
  }

  const loadDefMeta = (name) => {
    setDefName2(name)
    const p = pokemonData.find(x=>x.name===name)
    const ms = p?.metaSets?.[0]
    if (ms) { setDefNat2(ms.nature||'Hardy'); setDefEvs2(normEvs(ms.evs)); setDefItem2(ms.item||''); setDefAb2(ms.ability||'') }
  }

  const koColor = result?.ko1?'text-red-400 font-bold':result?.ko2?'text-orange-400':result?.ko3?'text-yellow-400':'text-gray-400'
  const koLabel = result?.ko1?`OHKO (${result.koPct}%)`:result?.ko2?'2HKO garantizado':result?.ko3?'3HKO garantizado':result&&!result.immune?'No KO en 3 hits':''

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Left column: controls */}
      <div className="space-y-3">
        {/* Attacker */}
        <div className="card space-y-3">
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">⚔️ Atacante</div>
          <SlotPicker source={atkSrc} setSource={setAtkSrc} idx={atkIdx} setIdx={setAtkIdx} team={team} label="atk" />
          {atkSrc==='custom' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <PokemonSearch value={atkName2} onChange={n=>{
                  setAtkName2(n)
                  const p=pokemonData.find(x=>x.name===n);const ms=p?.metaSets?.[0]
                  if(ms){setAtkNat2(ms.nature||'Hardy');setAtkEvs2(normEvs(ms.evs));setAtkItem2(ms.item||'');setAtkAb2(ms.ability||'')}
                }} placeholder="Atacante..." />
                <select className="input text-xs" value={atkNat2} onChange={e=>setAtkNat2(e.target.value)}>
                  {NATURES.map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="input text-xs" value={atkItem2} onChange={e=>setAtkItem2(e.target.value)} placeholder="Item" />
                <select className="input text-xs" value={atkAb2} onChange={e=>setAtkAb2(e.target.value)}>
                  <option value="">-- Ability --</option>
                  {(atkPkmn?.abilities||[]).map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {atkPkmn && STAT_KEYS.map(s=><EvRow key={s} stat={s} value={atkEvs2[s]||0} base={atkPkmn.baseStats[s]} nature={atkNat2} onChange={v=>setAtkEvs2({...atkEvs2,[s]:v})} />)}
            </div>
          )}
          {atkSrc==='team' && atkPkmn && (
            <div className="bg-gray-900/50 rounded-lg p-2 space-y-0.5">
              <div className="text-[10px] text-brand-400 mb-1 font-medium">📋 Tiempo real · {atkName} · {atkNature}</div>
              {STAT_KEYS.map(s=>{
                const base=atkPkmn.baseStats[s]||0, final=calcStat(s,base,atkEvs[s]||0,atkNature), mod=NATURE_MODS[atkNature]?.[s]??1
                return <div key={s} className="flex items-center gap-2">
                  <span className="text-[9px] w-7 text-right" style={{color:STAT_COLORS[s]}}>{STAT_LABELS[s]}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-1"><div className="h-1 rounded-full" style={{width:`${Math.min(100,(base/170)*100)}%`,backgroundColor:STAT_COLORS[s]}} /></div>
                  <span className="text-[9px] font-mono w-5 text-right text-gray-600">{atkEvs[s]||0}</span>
                  <span className={`text-[9px] font-mono w-7 text-right ${mod>1?'text-green-400':mod<1?'text-red-400':'text-gray-400'}`}>{final}</span>
                </div>
              })}
            </div>
          )}
          <div><div className="text-[10px] text-gray-500 mb-1">Boost</div><BoostRow value={atkBoost} onChange={setAtkBoost} color="blue" /></div>
          <div className="flex gap-3 flex-wrap text-[10px]">
            <label className="flex items-center gap-1 cursor-pointer text-gray-400"><input type="checkbox" checked={atkBurn} onChange={e=>setAtkBurn(e.target.checked)} className="accent-brand-500" /> Quemado</label>
            <label className="flex items-center gap-1 cursor-pointer text-gray-400"><input type="checkbox" checked={isHH} onChange={e=>setIsHH(e.target.checked)} className="accent-brand-500" /> Helping Hand</label>
            <div className="flex items-center gap-1 text-gray-400">HP: <input type="number" min="1" max="100" value={atkHpPct} onChange={e=>setAtkHpPct(Math.max(1,Math.min(100,Number(e.target.value)||100)))} className="w-12 text-xs bg-gray-800 border border-gray-700 rounded px-1 py-0.5 font-mono text-gray-200 ml-1" />%</div>
          </div>
        </div>

        {/* Swap + Move */}
        <div className="flex justify-center">
          <button onClick={swap} className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-800 border border-gray-700 hover:border-brand-500/50 hover:bg-gray-700 transition-colors text-xs text-gray-400 hover:text-gray-200">
            ⚔️ ↕ Intercambiar 🛡️
          </button>
        </div>

        <div className="card space-y-2">
          <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">💫 Move</div>
          <MoveSearch value={moveName} onChange={setMoveName} suggested={suggested} placeholder="Selecciona un move..." />
          {MOVES[moveName]?.bp > 0 && (
            <div className="flex gap-1.5 flex-wrap text-[10px]">
              <span className="px-2 py-0.5 rounded text-white text-[9px]" style={{backgroundColor:TYPE_COLORS[MOVES[moveName].type]||'#888'}}>{MOVES[moveName].type}</span>
              <span className="text-gray-400">{MOVES[moveName].bp}BP · {MOVES[moveName].cat==='physical'?'⚔️ Físico':'✨ Especial'}</span>
              {MOVES[moveName].spread && <span className="text-purple-300">Spread ×0.75</span>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <select className="input text-xs" value={weather} onChange={e=>setWeather(e.target.value)}>
              <option value="none">Sin clima</option>
              <option value="sun">☀️ Sol</option>
              <option value="rain">🌧️ Lluvia</option>
              <option value="sand">🌪️ Arena</option>
              <option value="hail">❄️ Nieve</option>
            </select>
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1 cursor-pointer text-[10px] text-gray-400"><input type="checkbox" checked={isCrit} onChange={e=>setIsCrit(e.target.checked)} className="accent-brand-500" /> Crítico ×1.5</label>
              <label className="flex items-center gap-1 cursor-pointer text-[10px] text-gray-400"><input type="checkbox" checked={hasScreen} onChange={e=>setHasScreen(e.target.checked)} className="accent-brand-500" /> Pantalla ×0.67</label>
            </div>
          </div>
        </div>

        {/* Defender */}
        <div className="card space-y-3">
          <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">🛡️ Defensor</div>
          <SlotPicker source={defSrc} setSource={setDefSrc} idx={defIdx} setIdx={setDefIdx} team={team} label="def" />
          {defSrc==='custom' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <PokemonSearch value={defName2} onChange={loadDefMeta} placeholder="Defensor..." />
                <select className="input text-xs" value={defNat2} onChange={e=>setDefNat2(e.target.value)}>
                  {NATURES.map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="input text-xs" value={defItem2} onChange={e=>setDefItem2(e.target.value)} placeholder="Item defensor" />
                <select className="input text-xs" value={defAb2} onChange={e=>setDefAb2(e.target.value)}>
                  <option value="">-- Ability --</option>
                  {(defPkmn?.abilities||[]).map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {defPkmn && ['hp','def','spd'].map(s=><EvRow key={s} stat={s} value={defEvs2[s]||0} base={defPkmn.baseStats[s]} nature={defNat2} onChange={v=>setDefEvs2({...defEvs2,[s]:v})} />)}
            </div>
          )}
          {defSrc==='team' && defPkmn && (
            <div className="bg-gray-900/50 rounded-lg p-2 space-y-0.5">
              <div className="text-[10px] text-red-400 mb-1 font-medium">📋 Tiempo real · {defName} · {defNature}</div>
              {STAT_KEYS.map(s=>{
                const base=defPkmn.baseStats[s]||0, final=calcStat(s,base,defEvs[s]||0,defNature), mod=NATURE_MODS[defNature]?.[s]??1
                return <div key={s} className="flex items-center gap-2">
                  <span className="text-[9px] w-7 text-right" style={{color:STAT_COLORS[s]}}>{STAT_LABELS[s]}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-1"><div className="h-1 rounded-full" style={{width:`${Math.min(100,(base/170)*100)}%`,backgroundColor:STAT_COLORS[s]}} /></div>
                  <span className="text-[9px] font-mono w-5 text-right text-gray-600">{defEvs[s]||0}</span>
                  <span className={`text-[9px] font-mono w-7 text-right ${mod>1?'text-green-400':mod<1?'text-red-400':'text-gray-400'}`}>{final}</span>
                </div>
              })}
            </div>
          )}
          <div><div className="text-[10px] text-gray-500 mb-1">Boost defensa</div><BoostRow value={defBoost} onChange={setDefBoost} color="red" /></div>
          <label className="flex items-center gap-1 cursor-pointer text-[10px] text-gray-400"><input type="checkbox" checked={defHpFull} onChange={e=>setDefHpFull(e.target.checked)} className="accent-brand-500" /> HP lleno (Multiscale)</label>
        </div>
      </div>

      {/* Right column: result */}
      <div className="space-y-3">
        {result?.immune && (
          <div className="card text-center py-8">
            <div className="text-3xl mb-2">🛡️</div>
            <div className="text-lg font-bold text-gray-300">Inmune</div>
            <div className="text-xs text-gray-500 mt-1">{defPkmn?.types?.join('/')} es inmune a {result.mtype}</div>
          </div>
        )}

        {result && !result.immune ? (
          <div className="card space-y-4">
            {/* Description */}
            <div className="font-mono text-[11px] text-gray-300 bg-gray-900 rounded-lg p-3 break-words leading-relaxed border border-gray-800">
              {result.descLine}
            </div>

            {/* KO */}
            <div className={`text-base font-bold ${koColor}`}>{koLabel}</div>

            {/* Bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>HP del defensor: <span className="font-mono text-gray-200">{result.defHp}</span></span>
                <span className="font-mono font-bold text-gray-200">{result.minPct}% – {result.maxPct}%</span>
              </div>
              <div className="relative h-10 bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                <div className="absolute inset-y-0 left-0 bg-green-700/30" style={{width:`${Math.max(0,100-result.maxPct)}%`}} />
                <div className="absolute inset-y-0 bg-red-500/60" style={{left:`${Math.max(0,100-result.maxPct)}%`,width:`${result.maxPct-result.minPct}%`}} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-mono font-bold text-white drop-shadow-lg">{result.min}–{result.max} / {result.defHp}</span>
                </div>
              </div>
            </div>

            {/* Rolls */}
            <div>
              <div className="text-[10px] text-gray-500 mb-2">Rolls (85%–100%):</div>
              <div className="flex flex-wrap gap-1">
                {result.rolls.map((r,i) => (
                  <span key={i} className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${r>=result.defHp?'bg-red-900/60 text-red-200 border-red-700':'bg-gray-800 text-gray-500 border-gray-700'}`}>{r}</span>
                ))}
              </div>
            </div>

            {/* Modifiers */}
            <div className="pt-3 border-t border-gray-700/50 flex flex-wrap gap-1.5 text-[10px]">
              {result.stab>1 && <span className="bg-yellow-900/40 text-yellow-300 px-2 py-0.5 rounded">STAB ×{result.stab}</span>}
              {result.eff!==1 && <span className={`px-2 py-0.5 rounded ${result.eff>1?'bg-green-900/40 text-green-300':'bg-red-900/40 text-red-300'}`}>×{result.eff} tipo</span>}
              {result.wMod!==1 && <span className="bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">clima ×{result.wMod}</span>}
              {result.spread<1 && <span className="bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded">spread ×0.75</span>}
              {result.crit>1 && <span className="bg-yellow-900/40 text-yellow-300 px-2 py-0.5 rounded">crítico ×1.5</span>}
              {result.burn<1 && <span className="bg-orange-900/40 text-orange-300 px-2 py-0.5 rounded">quemado ×0.5</span>}
              {result.screen<1 && <span className="bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded">pantalla ×{result.screen.toFixed(2)}</span>}
              {result.multiscale<1 && <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded">Multiscale ×0.5</span>}
              {result.filter<1 && <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded">Filter ×0.75</span>}
              {result.atkItemMult!==1 && <span className="bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded">item ×{result.atkItemMult}</span>}
              {result.defItemMult!==1 && <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded">def item ×{result.defItemMult}</span>}
              {result.hh>1 && <span className="bg-pink-900/40 text-pink-300 px-2 py-0.5 rounded">HH ×1.5</span>}
              {result.hits>1 && <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded">×{result.hits} hits</span>}
            </div>
          </div>
        ) : !result && (
          <div className="card text-center py-16 text-gray-500 space-y-2">
            <div className="text-4xl">⚔️</div>
            <div>Selecciona atacante → move → defensor</div>
            <div className="text-[11px] text-gray-600">El equipo del Teambuilder se sincroniza automáticamente</div>
          </div>
        )}
      </div>
    </div>
  )
}
