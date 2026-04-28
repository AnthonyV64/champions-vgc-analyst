import { useState, useMemo, useRef, useEffect } from 'react'
import pokemonData from '../data/pokemon.json'

// ── Constants ────────────────────────────────────────────────────────────────
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

const MEGA_ITEMS = ['Floettite','Charizardite Y','Charizardite X','Froslassite','Gengarite',
  'Tyranitarite','Delphoxite','Aerodactylite','Gardevoirite','Meganiumite','Scizorite',
  'Dragoninite','Gyaradosite','Kangaskhanite','Glimmoranite','Scovillainite','Blastoisinite',
  'Manectite','Starminite','Lucarionite','Venusaurite','Lopunnite','Aggronite']

const TYPE_COLORS = {
  Normal:'#A8A878',Fire:'#F08030',Water:'#6890F0',Electric:'#F8D030',Grass:'#78C850',
  Ice:'#98D8D8',Fighting:'#C03028',Poison:'#A040A0',Ground:'#E0C068',Flying:'#A890F0',
  Psychic:'#F85888',Bug:'#A8B820',Rock:'#B8A038',Ghost:'#705898',Dragon:'#7038F8',
  Dark:'#705848',Steel:'#B8B8D0',Fairy:'#EE99AC'
}

// ── Type chart ────────────────────────────────────────────────────────────────
const TYPE_CHART = {
  Normal:{Rock:0.5,Steel:0.5,Ghost:0},
  Fire:{Fire:0.5,Water:0.5,Rock:0.5,Dragon:0.5,Grass:2,Ice:2,Bug:2,Steel:2},
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
  Ghost:{Ghost:2,Psychic:2,Normal:0,Dark:0.5},
  Dragon:{Dragon:2,Steel:0.5,Fairy:0},
  Dark:{Psychic:2,Ghost:2,Fighting:0.5,Dark:0.5,Fairy:0.5},
  Steel:{Ice:2,Rock:2,Fairy:2,Fire:0.5,Water:0.5,Electric:0.5,Steel:0.5,Poison:0,Ground:0.5},
  Fairy:{Fighting:2,Dragon:2,Dark:2,Fire:0.5,Poison:0.5,Steel:0.5},
}

function typeEffect(mtype, defTypes) {
  let m = 1
  ;(defTypes||[]).forEach(t => { m *= TYPE_CHART[mtype]?.[t] ?? 1 })
  return m
}

// ── Full move database ────────────────────────────────────────────────────────
const MOVES = {
  // Physical
  'Close Combat':{bp:120,cat:'physical',type:'Fighting'},
  'Earthquake':{bp:100,cat:'physical',type:'Ground',spread:true},
  'Rock Slide':{bp:75,cat:'physical',type:'Rock',spread:true},
  'Dragon Claw':{bp:80,cat:'physical',type:'Dragon'},
  'Kowtow Cleave':{bp:85,cat:'physical',type:'Dark',neverMiss:true},
  'Sucker Punch':{bp:70,cat:'physical',type:'Dark',priority:1},
  'Iron Head':{bp:80,cat:'physical',type:'Steel'},
  'Low Kick':{bp:60,cat:'physical',type:'Fighting'},
  'Flare Blitz':{bp:120,cat:'physical',type:'Fire',recoil:0.33},
  'Fake Out':{bp:40,cat:'physical',type:'Normal',priority:3},
  'Wave Crash':{bp:120,cat:'physical',type:'Water',recoil:0.33},
  'Extreme Speed':{bp:80,cat:'physical',type:'Normal',priority:2},
  'Aqua Jet':{bp:40,cat:'physical',type:'Water',priority:1},
  'Bullet Punch':{bp:40,cat:'physical',type:'Steel',priority:1},
  'Shadow Sneak':{bp:40,cat:'physical',type:'Ghost',priority:1},
  'Stomping Tantrum':{bp:75,cat:'physical',type:'Ground'},
  'Darkest Lariat':{bp:85,cat:'physical',type:'Dark',ignoreBoosts:true},
  'Throat Chop':{bp:80,cat:'physical',type:'Dark'},
  'Brave Bird':{bp:120,cat:'physical',type:'Flying',recoil:0.33},
  'Poltergeist':{bp:110,cat:'physical',type:'Ghost'},
  'Dual Wingbeat':{bp:40,cat:'physical',type:'Flying',hits:2},
  'Dire Claw':{bp:80,cat:'physical',type:'Poison'},
  'Scale Shot':{bp:25,cat:'physical',type:'Dragon',hits:5},
  'Flip Turn':{bp:60,cat:'physical',type:'Water'},
  'Liquidation':{bp:85,cat:'physical',type:'Water'},
  'Body Press':{bp:80,cat:'physical',type:'Fighting',useDefAsDmg:true},
  'Waterfall':{bp:80,cat:'physical',type:'Water'},
  'Double-Edge':{bp:120,cat:'physical',type:'Normal',recoil:0.33},
  'Drain Punch':{bp:75,cat:'physical',type:'Fighting'},
  'Mach Punch':{bp:40,cat:'physical',type:'Fighting',priority:1},
  'Ice Punch':{bp:75,cat:'physical',type:'Ice'},
  'Thunder Punch':{bp:75,cat:'physical',type:'Electric'},
  'Crunch':{bp:80,cat:'physical',type:'Dark'},
  'Knock Off':{bp:65,cat:'physical',type:'Dark'},
  'Rock Tomb':{bp:60,cat:'physical',type:'Rock'},
  'Icicle Crash':{bp:85,cat:'physical',type:'Ice'},
  'Ice Shard':{bp:40,cat:'physical',type:'Ice',priority:1},
  'Flower Trick':{bp:70,cat:'physical',type:'Grass',alwaysCrit:true},
  'Zen Headbutt':{bp:80,cat:'physical',type:'Psychic'},
  'Swords Dance':{bp:0,cat:'status',type:'Normal'},
  'Last Respects':{bp:50,cat:'physical',type:'Ghost',stackable:true},
  // Special
  'Heat Wave':{bp:95,cat:'special',type:'Fire',spread:true},
  'Weather Ball':{bp:50,cat:'special',type:'Normal',weatherBall:true},
  'Solar Beam':{bp:120,cat:'special',type:'Grass'},
  'Dazzling Gleam':{bp:80,cat:'special',type:'Fairy',spread:true},
  'Moonblast':{bp:95,cat:'special',type:'Fairy'},
  'Light of Ruin':{bp:140,cat:'special',type:'Fairy',recoil:0.5},
  'Hurricane':{bp:110,cat:'special',type:'Flying'},
  'Shadow Ball':{bp:80,cat:'special',type:'Ghost'},
  'Sludge Bomb':{bp:90,cat:'special',type:'Poison'},
  'Blizzard':{bp:110,cat:'special',type:'Ice',spread:true},
  'Thunderbolt':{bp:90,cat:'special',type:'Electric'},
  'Electro Shot':{bp:130,cat:'special',type:'Electric'},
  'Flash Cannon':{bp:80,cat:'special',type:'Steel'},
  'Draco Meteor':{bp:130,cat:'special',type:'Dragon'},
  'Hydro Pump':{bp:110,cat:'special',type:'Water'},
  'Scald':{bp:80,cat:'special',type:'Water'},
  'Psychic':{bp:90,cat:'special',type:'Psychic'},
  'Hyper Voice':{bp:90,cat:'special',type:'Normal',spread:true,sound:true},
  'Matcha Gotcha':{bp:80,cat:'special',type:'Grass',spread:true},
  'Dragon Pulse':{bp:85,cat:'special',type:'Dragon'},
  'Earth Power':{bp:90,cat:'special',type:'Ground'},
  'Aura Sphere':{bp:80,cat:'special',type:'Fighting',neverMiss:true},
  'Overheat':{bp:130,cat:'special',type:'Fire'},
  'Eruption':{bp:150,cat:'special',type:'Fire',spread:true,hpBased:true},
  'Dark Pulse':{bp:80,cat:'special',type:'Dark'},
  'Volt Switch':{bp:70,cat:'special',type:'Electric'},
  'Power Gem':{bp:80,cat:'special',type:'Rock'},
  'Snarl':{bp:55,cat:'special',type:'Dark',spread:true},
  'Electroweb':{bp:55,cat:'special',type:'Electric',spread:true},
  'Leaf Storm':{bp:130,cat:'special',type:'Grass'},
  'Giga Drain':{bp:75,cat:'special',type:'Grass'},
  'Energy Ball':{bp:90,cat:'special',type:'Grass'},
  'Clanging Scales':{bp:110,cat:'special',type:'Dragon',spread:true},
  'Focus Blast':{bp:120,cat:'special',type:'Fighting'},
  'Water Spout':{bp:150,cat:'special',type:'Water',spread:true,hpBased:true},
  'Icy Wind':{bp:55,cat:'special',type:'Ice',spread:true},
  'Freeze-Dry':{bp:70,cat:'special',type:'Ice'},
  'Psyshock':{bp:80,cat:'special',type:'Psychic',usePhysDef:true},
  'Air Slash':{bp:75,cat:'special',type:'Flying'},
  'Hyper Beam':{bp:150,cat:'special',type:'Normal'},
  'Discharge':{bp:80,cat:'special',type:'Electric',spread:true},
  'Thunderclap':{bp:80,cat:'special',type:'Electric',priority:1},
  'Calm Mind':{bp:0,cat:'status',type:'Psychic'},
  'Quiver Dance':{bp:0,cat:'status',type:'Bug'},
  // Status
  'Protect':{bp:0,cat:'status',type:'Normal'},
  'Tailwind':{bp:0,cat:'status',type:'Flying'},
  'Trick Room':{bp:0,cat:'status',type:'Psychic'},
  'Encore':{bp:0,cat:'status',type:'Normal'},
  'Fake Tears':{bp:0,cat:'status',type:'Dark'},
  'Will-O-Wisp':{bp:0,cat:'status',type:'Fire'},
  'Helping Hand':{bp:0,cat:'status',type:'Normal'},
  'Rage Powder':{bp:0,cat:'status',type:'Bug'},
  'Life Dew':{bp:0,cat:'status',type:'Water'},
  'Taunt':{bp:0,cat:'status',type:'Dark'},
  "King's Shield":{bp:0,cat:'status',type:'Steel'},
  'Follow Me':{bp:0,cat:'status',type:'Normal'},
  'Aurora Veil':{bp:0,cat:'status',type:'Ice'},
  'Parting Shot':{bp:0,cat:'status',type:'Dark'},
  'Coaching':{bp:0,cat:'status',type:'Fighting'},
  'Growth':{bp:0,cat:'status',type:'Normal'},
  'Iron Defense':{bp:0,cat:'status',type:'Steel'},
  'Wide Guard':{bp:0,cat:'status',type:'Rock'},
  'Spiky Shield':{bp:0,cat:'status',type:'Grass'},
  'Substitute':{bp:0,cat:'status',type:'Normal'},
  'Bulk Up':{bp:0,cat:'status',type:'Fighting'},
  'Clangorous Soul':{bp:0,cat:'status',type:'Dragon'},
  'Sleep Powder':{bp:0,cat:'status',type:'Grass'},
  'Recover':{bp:0,cat:'status',type:'Normal'},
  'Roost':{bp:0,cat:'status',type:'Flying'},
  'Disable':{bp:0,cat:'status',type:'Normal'},
  'Perish Song':{bp:0,cat:'status',type:'Normal'},
  'Thunder Wave':{bp:0,cat:'status',type:'Electric'},
}

// Move tags for ability checks
const PUNCHING_MOVES = new Set(['Mach Punch','Drain Punch','Thunder Punch','Ice Punch','Fire Punch','Focus Punch','Bullet Punch','Shadow Punch','Meteor Mash','Power-Up Punch','Sucker Punch'])
const BITING_MOVES   = new Set(['Crunch','Bite','Hyper Fang','Thunder Fang','Ice Fang','Fire Fang','Poison Fang','Bug Bite','Psychic Fangs'])
const PULSE_MOVES    = new Set(['Aura Sphere','Dragon Pulse','Dark Pulse','Origin Pulse','Heal Pulse','Water Pulse','Terrain Pulse','Austere Pulse'])
const SOUND_MOVES    = new Set(['Hyper Voice','Snarl','Bug Buzz','Clanging Scales','Clangorous Soul','Boomburst','Echoed Voice','Round','Sparkling Aria','Overdrive','Disarming Voice'])
const CONTACT_MOVES  = new Set(['Close Combat','Dragon Claw','Kowtow Cleave','Iron Head','Low Kick','Flare Blitz','Fake Out','Wave Crash','Extreme Speed','Bullet Punch','Aqua Jet','Shadow Sneak','Stomping Tantrum','Darkest Lariat','Throat Chop','Brave Bird','Dual Wingbeat','Dire Claw','Scale Shot','Flip Turn','Liquidation','Waterfall','Double-Edge','Drain Punch','Mach Punch','Ice Punch','Thunder Punch','Crunch','Knock Off','Rock Tomb','Icicle Crash','Flower Trick','Zen Headbutt','Body Press'])
const RECOIL_MOVES   = new Set(['Flare Blitz','Wave Crash','Brave Bird','Double-Edge','Light of Ruin','Head Smash','Wild Charge','Volt Tackle'])

// Abilities that affect damage
const ABILITY_MODS = {
  // ── Attacker: stat multipliers (applied directly to stat before formula) ──
  'Huge Power':    { atkStatMult: 2 },    // doubles Attack stat
  'Pure Power':    { atkStatMult: 2 },    // doubles Attack stat
  'Hustle':        { atkStatMult: 1.5 },  // 1.5x Atk (ignore accuracy penalty)
  // ── Attacker: type conversion ──
  'Adaptability': { stabMult: 2 },
  'Technician':   { technicianMult: 1.5 },
  'Dragonize':    { normalToType: 'Dragon', convertMult: 1.2 },
  'Pixilate':     { normalToType: 'Fairy',  convertMult: 1.2 },
  'Aerilate':     { normalToType: 'Flying', convertMult: 1.2 },
  'Refrigerate':  { normalToType: 'Ice',    convertMult: 1.2 },
  // ── Attacker: damage multipliers ──
  'Guts':         { gutsMult: 1.5 },       // 1.5x physical when burned/paralyzed/poisoned
  'Tough Claws':  { contactMult: 1.3 },
  'Sand Force':   { sandTypes: ['Rock','Steel','Ground'], sandMult: 1.3 },
  'Solar Power':  { sunSpaMult: 1.5 },
  'Sheer Force':  { sheerForceMult: 1.3 }, // 1.3x on moves with secondary effects
  'Iron Fist':    { ironFistMult: 1.2 },   // 1.2x punching moves
  'Strong Jaw':   { strongJawMult: 1.5 },  // 1.5x biting moves
  'Mega Launcher':{ megaLauncherMult: 1.5 },// 1.5x pulse/aura moves
  'Punk Rock':    { punkRockMult: 1.3 },   // 1.3x sound moves (attacker)
  'Reckless':     { recklessMult: 1.2 },   // 1.2x recoil moves
  'Neuroforce':   { neuroforceMult: 1.25 },// 1.25x super effective
  'Tinted Lens':  { tintedLensMult: 2 },   // 2x not very effective
  'Steely Spirit':{ steelMult: 1.5 },      // 1.5x Steel moves
  'Stakeout':     { stakeoutMult: 2 },     // 2x if switched in (manual)
  'Mold Breaker': { moldBreaker: true },   // ignore defensive abilities
  'Turboblaze':   { moldBreaker: true },
  'Teravolt':     { moldBreaker: true },
  'Blaze':        { fireBoost: { type: 'Fire',  threshold: 0.33 } },
  'Torrent':      { fireBoost: { type: 'Water', threshold: 0.33 } },
  'Overgrow':     { fireBoost: { type: 'Grass', threshold: 0.33 } },
  'Swarm':        { fireBoost: { type: 'Bug',   threshold: 0.33 } },
  'Chlorophyll':  {},
  'Swift Swim':   {},
  'Sand Rush':    {},
  'Unburden':     {},
  'Intimidate':   {},
  'Prankster':    {},
  'Drizzle':      {},
  'Drought':      {},
  'Sand Stream':  {},
  'Snow Warning': {},
  'Hospitality':  {},
  'Mirror Armor': {},
  'Armor Tail':   {},
  'Levitate':     {},
  'Stance Change':{},
  // ── Defender: damage reduction ──
  'Multiscale':   { defMult: 0.5, fullHpOnly: true },
  'Shadow Shield':{ defMult: 0.5, fullHpOnly: true },
  'Filter':       { superEffMult: 0.75 },
  'Solid Rock':   { superEffMult: 0.75 },
  'Prism Armor':  { superEffMult: 0.75 },
  'Stamina':      {},
  'Fluffy':       { fluffyMult: true },    // 2x contact, 0.5x fire
  'Friend Guard': { friendGuardMult: 0.75 },
  'Wonder Guard': { wonderGuard: true },
  'Punk Rock':    { punkRockDefMult: 0.5 }, // halves sound moves as defender
  'Ice Scales':   { iceScalesMult: 0.5 },  // halves special damage
  'Thick Fat':    { thickFatTypes: ['Fire','Ice'] }, // halves Fire/Ice
}

// Items that affect damage
const ITEM_DMG_MODS = {
  'Choice Scarf':   { speedMult: 1.5 },
  'White Herb':     {},
  'Soft Sand':      { typeBoost: { type: 'Ground', mult: 1.2 } },
  'Charcoal':       { typeBoost: { type: 'Fire',   mult: 1.2 } },
  'Mystic Water':   { typeBoost: { type: 'Water',  mult: 1.2 } },
  'Spell Tag':      { typeBoost: { type: 'Ghost',  mult: 1.2 } },
  'Black Glasses':  { typeBoost: { type: 'Dark',   mult: 1.2 } },
  'Dragon Fang':    { typeBoost: { type: 'Dragon', mult: 1.2 } },
  'Fairy Feather':  { typeBoost: { type: 'Fairy',  mult: 1.2 } },
  'Sharp Beak':     { typeBoost: { type: 'Flying', mult: 1.2 } },
  'Twisted Spoon':  { typeBoost: { type: 'Psychic',mult: 1.2 } },
  'Silver Powder':  { typeBoost: { type: 'Bug',    mult: 1.2 } },
  'Hard Stone':     { typeBoost: { type: 'Rock',   mult: 1.2 } },
  'Metal Coat':     { typeBoost: { type: 'Steel',  mult: 1.2 } },
  'Miracle Seed':   { typeBoost: { type: 'Grass',  mult: 1.2 } },
  'Magnet':         { typeBoost: { type: 'Electric',mult:1.2 } },
  'Poison Barb':    { typeBoost: { type: 'Poison', mult: 1.2 } },
  'Never-Melt Ice': { typeBoost: { type: 'Ice',    mult: 1.2 } },
  'Silk Scarf':     { typeBoost: { type: 'Normal', mult: 1.2 } },
  'Lum Berry':      {},
  'Sitrus Berry':   {},
  'Focus Sash':     {},
  'Chople Berry':   { defType: 'Fighting', defMult: 0.5 },
  'Colbur Berry':   { defType: 'Dark',     defMult: 0.5 },
  'Shuca Berry':    { defType: 'Ground',   defMult: 0.5 },
  'Occa Berry':     { defType: 'Fire',     defMult: 0.5 },
  'Kasib Berry':    { defType: 'Ghost',    defMult: 0.5 },
  'Yache Berry':    { defType: 'Ice',      defMult: 0.5 },
  'Leftovers':      {},
  'Mental Herb':    {},
  'Bright Powder':  {},
}

// ── Stat calculation (Champions format) ───────────────────────────────────────
function calcStat(stat, base, ev, nature) {
  const mod = NATURE_MODS[nature]?.[stat] ?? 1
  return stat === 'hp'
    ? base + ev + 75
    : Math.floor((base + ev + 20) * mod)
}

// ── Full Champions damage engine ──────────────────────────────────────────────
function computeDamage(params) {
  const {
    atkPkmn, defPkmn,
    atkEvs, defEvs,
    atkNature, defNature,
    atkItem, defItem,
    atkAbility, defAbility,
    moveName,
    atkBoost = 0, defBoost = 0,
    weather = 'none',
    terrain = 'none',
    isCrit = false,
    isHelpingHand = false,
    isBurn = false,
    hasScreen = false,
    defFainted = 0,    // for Last Respects
    atkHpPct = 100,    // for Eruption/Water Spout
    atkHpFull = true,  // for Multiscale
  } = params

  const mv = MOVES[moveName]
  if (!mv || mv.cat === 'status' || mv.bp === 0) return null

  // ── Resolve move type (weather ball, pixilate, etc.) ──
  let moveType = mv.type
  let bp = mv.bp

  // Weather Ball type + power
  if (mv.weatherBall) {
    const wMap = {sun:'Fire',rain:'Water',sand:'Rock',hail:'Ice',snow:'Ice'}
    if (wMap[weather]) { moveType = wMap[weather]; bp = 100 }
  }

  // Normalize abilities (convert Normal → type)
  const atkAbMod = ABILITY_MODS[atkAbility] || {}
  if (atkAbMod.normalToType && moveType === 'Normal') {    moveType = atkAbMod.normalToType
    bp = Math.floor(bp * atkAbMod.convertMult)
  }

  // HP-based moves (Eruption, Water Spout)
  if (mv.hpBased) {
    bp = Math.max(1, Math.floor(bp * atkHpPct / 100))
  }

  // Last Respects stacking
  if (moveName === 'Last Respects') {
    bp = 50 + 50 * defFainted
  }

  // Scale Shot / multi-hit: use total
  const hits = mv.hits || 1

  // Psyshock uses physical defense
  const usePhysDef = mv.usePhysDef
  // Body Press uses attacker's Defense as attack stat
  const useDefAsDmg = mv.useDefAsDmg

  const cat = mv.cat
  const atkStatKey = useDefAsDmg ? 'def' : cat === 'special' ? 'spa' : 'atk'
  const defStatKey = usePhysDef ? 'def' : cat === 'special' ? 'spd' : 'def'

  // ── Compute base stats ──
  let atkStat = calcStat(atkStatKey, atkPkmn.baseStats[atkStatKey]||0, atkEvs[atkStatKey]||0, atkNature)
  let defStat = calcStat(defStatKey, defPkmn.baseStats[defStatKey]||0, defEvs[defStatKey]||0, defNature)
  const defHp  = calcStat('hp', defPkmn.baseStats.hp||0, defEvs.hp||0, defNature)

  // Apply stat multipliers BEFORE formula (Huge Power, Pure Power, Hustle)
  if (atkAbMod.atkStatMult && cat === 'physical' && !useDefAsDmg) atkStat = Math.floor(atkStat * atkAbMod.atkStatMult)

  // ── Boosts (from -6 to +6) ──
  const boostTable = [0.25,0.28,0.33,0.4,0.5,1,1.5,2,2.5,3,3.5,4]
  const atkBoostMult = boostTable[Math.min(11,Math.max(0,atkBoost+5))]
  const defBoostMult = boostTable[Math.min(11,Math.max(0,defBoost+5))]

  // Critical ignores negative atk boosts and positive def boosts
  const effectiveAtkBoost = isCrit ? Math.max(1, atkBoostMult) : atkBoostMult
  const effectiveDefBoost = isCrit ? Math.min(1, defBoostMult) : defBoostMult

  atkStat = Math.floor(atkStat * effectiveAtkBoost)
  defStat = Math.floor(defStat * effectiveDefBoost)

  // ── Base damage formula (Champions = standard VGC at level 50) ──
  const baseDmg = Math.floor(Math.floor(Math.floor(2 * 50 / 5 + 2) * bp * atkStat / defStat) / 50) + 2

  // ── Modifier chain ──
  // 1. Spread (0.75)
  const spreadMod = (mv.spread || false) ? 0.75 : 1

  // 2. Weather
  let weatherMod = 1
  if (weather === 'sun') {
    if (moveType === 'Fire') weatherMod = 1.5
    if (moveType === 'Water') weatherMod = 0.5
  } else if (weather === 'rain') {
    if (moveType === 'Water') weatherMod = 1.5
    if (moveType === 'Fire') weatherMod = 0.5
  }
  // Solar Power in sun
  if (weather === 'sun' && atkAbility === 'Solar Power' && cat === 'special') weatherMod *= 1.5

  // 3. Critical (1.5x, ignores screens and negative atk/positive def boosts)
  const critMod = isCrit ? 1.5 : 1

  // 4. Random roll (85-100%) — calculate per roll
  // 5. STAB
  const atkTypes = atkPkmn.types || []
  let stab = atkTypes.includes(moveType) ? 1.5 : 1
  if (atkAbility === 'Adaptability' && atkTypes.includes(moveType)) stab = 2

  // 6. Type effectiveness
  const defTypes = defPkmn.types || []
  const eff = typeEffect(moveType, defTypes)
  if (eff === 0) return { immune: true, moveType, defTypes }

  // 7. Burn (halves physical damage, unless Guts which is handled in abilityMult)
  const burnMod = (isBurn && cat === 'physical' && atkAbility !== 'Guts') ? 0.5 : 1

  // 8. Screens (halved in doubles when not crit)
  const screenMod = (hasScreen && !isCrit) ? (2/3) : 1

  // 9. Ability mods
  // Attacker
  const defAbMod = ABILITY_MODS[defAbility] || {}
  const moldBreaker = atkAbMod.moldBreaker // Mold Breaker ignores defensive abilities

  let atkAbilityMult = 1
  if (atkAbMod.technicianMult && bp <= 60)                                      atkAbilityMult *= atkAbMod.technicianMult
  if (atkAbMod.sandTypes && weather === 'sand' && atkAbMod.sandTypes.includes(moveType)) atkAbilityMult *= atkAbMod.sandMult
  if (atkAbMod.contactMult && CONTACT_MOVES.has(moveName))                      atkAbilityMult *= atkAbMod.contactMult
  if (atkAbMod.ironFistMult && PUNCHING_MOVES.has(moveName))                    atkAbilityMult *= atkAbMod.ironFistMult
  if (atkAbMod.strongJawMult && BITING_MOVES.has(moveName))                     atkAbilityMult *= atkAbMod.strongJawMult
  if (atkAbMod.megaLauncherMult && PULSE_MOVES.has(moveName))                   atkAbilityMult *= atkAbMod.megaLauncherMult
  if (atkAbMod.punkRockMult && SOUND_MOVES.has(moveName))                       atkAbilityMult *= atkAbMod.punkRockMult
  if (atkAbMod.recklessMult && RECOIL_MOVES.has(moveName))                      atkAbilityMult *= atkAbMod.recklessMult
  if (atkAbMod.gutsMult && isBurn && cat === 'physical')                         atkAbilityMult *= atkAbMod.gutsMult
  if (atkAbMod.neuroforce && eff > 1)                                            atkAbilityMult *= 1.25
  if (atkAbMod.neuroforceMult && eff > 1)                                        atkAbilityMult *= atkAbMod.neuroforceMult
  if (atkAbMod.tintedLensMult && eff < 1)                                        atkAbilityMult *= atkAbMod.tintedLensMult
  if (atkAbMod.steelMult && moveType === 'Steel')                                atkAbilityMult *= atkAbMod.steelMult
  if (atkAbMod.stakeoutMult)                                                     atkAbilityMult *= atkAbMod.stakeoutMult
  if (atkAbMod.fireBoost) {
    const {type, threshold} = atkAbMod.fireBoost
    if (moveType === type && atkHpPct <= threshold * 100)                        atkAbilityMult *= 1.5
  }
  if (atkAbMod.sheerForceMult) {
    // Sheer Force applies to moves with secondary effects (roughly, moves with >90bp or secondary)
    const sfMoves = new Set(['Rock Slide','Air Slash','Iron Head','Psychic','Flash Cannon','Dark Pulse','Scald','Sludge Bomb','Dire Claw','Thunder Punch','Ice Punch','Fire Punch','Drain Punch','Thunderbolt','Shadow Ball','Energy Ball','Dragon Pulse','Earth Power','Overheat'])
    if (sfMoves.has(moveName)) atkAbilityMult *= atkAbMod.sheerForceMult
  }

  // Defender
  let defAbilityMult = 1
  if (!moldBreaker) {
    if (defAbMod.defMult && (!defAbMod.fullHpOnly || atkHpFull))               defAbilityMult *= defAbMod.defMult
    if (defAbMod.superEffMult && eff > 1)                                       defAbilityMult *= defAbMod.superEffMult
    if (defAbMod.wonderGuard && eff <= 1) return { immune: true, moveType, reason: 'Wonder Guard' }
    if (defAbMod.fluffyMult) {
      if (CONTACT_MOVES.has(moveName))  defAbilityMult *= 2
      if (moveType === 'Fire')          defAbilityMult *= 0.5
    }
    if (defAbMod.punkRockDefMult && SOUND_MOVES.has(moveName))                 defAbilityMult *= defAbMod.punkRockDefMult
    if (defAbMod.iceScalesMult && cat === 'special')                            defAbilityMult *= defAbMod.iceScalesMult
    if (defAbMod.thickFatTypes && defAbMod.thickFatTypes.includes(moveType))   defAbilityMult *= 0.5
    if (defAbMod.friendGuardMult)                                               defAbilityMult *= defAbMod.friendGuardMult
  }

  // 10. Item mods
  const atkItemMod = ITEM_DMG_MODS[atkItem] || {}
  let atkItemMult = 1
  if (atkItemMod.typeBoost?.type === moveType) atkItemMult *= atkItemMod.typeBoost.mult

  const defItemMod = ITEM_DMG_MODS[defItem] || {}
  let defItemMult = 1
  if (defItemMod.defType === moveType && eff > 0) defItemMult *= defItemMod.defMult

  // 11. Helping Hand
  const hhMod = isHelpingHand ? 1.5 : 1

  // ── Build rolls ──
  const rolls = []
  for (let r = 85; r <= 100; r++) {
    let d = baseDmg
    d = Math.floor(d * spreadMod)
    d = Math.floor(d * weatherMod)
    d = Math.floor(d * critMod)
    d = Math.floor(d * r / 100)
    d = Math.floor(d * stab)
    d = Math.floor(d * eff)
    d = Math.floor(d * burnMod)
    d = Math.floor(d * screenMod)
    d = Math.floor(d * atkAbilityMult)
    d = Math.floor(d * defAbilityMult)
    d = Math.floor(d * atkItemMult)
    d = Math.floor(d * defItemMult)
    d = Math.floor(d * hhMod)
    d = Math.max(1, d)
    // Multi-hit
    d = d * hits
    rolls.push(d)
  }

  const min = rolls[0], max = rolls[15]
  const minPct = Math.round(min / defHp * 1000) / 10
  const maxPct = Math.round(max / defHp * 1000) / 10

  // KO probabilities
  const koRolls = rolls.filter(r => r >= defHp).length
  const koPct = Math.round(koRolls / 16 * 100)
  const ko1 = max >= defHp
  const ko2 = min * 2 >= defHp
  const ko3 = min * 3 >= defHp

  const atkEvStr = `${atkEvs[atkStatKey]||0}${NATURE_MODS[atkNature]?.[atkStatKey] > 1 ? '+' : ''} ${STAT_LABELS[atkStatKey]}`
  const hugeStr = atkAbMod.atkStatMult ? ` ${atkAbility}` : ''
  const descLine = `${atkEvStr}${hugeStr} ${atkPkmn.name} ${moveName} vs. ${defEvs.hp||0} HP / ${defEvs[defStatKey]||0}${NATURE_MODS[defNature]?.[defStatKey] < 1 ? '-' : ''} ${STAT_LABELS[defStatKey]} ${defPkmn.name}: ${min}–${max} (${minPct}%–${maxPct}%)`

  return {
    min, max, minPct, maxPct, defHp, rolls,
    ko1, ko2, ko3, koPct, koRolls,
    stab, eff, weatherMod, spreadMod, critMod, burnMod, screenMod,
    atkAbilityMult, defAbilityMult, atkItemMult, defItemMult, hhMod,
    moveType, bp, hits, descLine,
    immune: false,
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function PokemonSearch({ value, onChange, placeholder }) {
  const [q, setQ] = useState(value)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const results = useMemo(() => {
    const s = q.toLowerCase()
    return pokemonData.filter(p => !s || p.name.toLowerCase().includes(s)).slice(0, 10)
  }, [q])
  useEffect(() => { setQ(value) }, [value])
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <input className="input w-full" value={q} placeholder={placeholder || 'Pokémon...'}
        onChange={e => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} />
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {results.map(p => (
            <div key={p.name} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 cursor-pointer"
              onMouseDown={() => { onChange(p.name); setQ(p.name); setOpen(false) }}>
              <span className="text-sm text-gray-100 flex-1">{p.name}</span>
              {p.types.map(t => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded text-white font-medium"
                  style={{ backgroundColor: TYPE_COLORS[t] || '#888' }}>{t}</span>
              ))}
              <span className="text-[10px] text-gray-500">{p.metaUsagePct}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const ALL_MOVE_NAMES = Object.keys(MOVES).sort()
const META_MOVES = [...new Set(pokemonData.flatMap(p => p.metaSets?.flatMap(s => s.moves) ?? []))].sort()

function MoveSearch({ value, onChange, suggestedMoves = [], placeholder }) {
  const [q, setQ] = useState(value)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const results = useMemo(() => {
    const s = q.toLowerCase()
    if (!s) return suggestedMoves.slice(0, 8)
    const sug = suggestedMoves.filter(m => m.toLowerCase().includes(s))
    const rest = ALL_MOVE_NAMES.filter(m => m.toLowerCase().includes(s) && !sug.includes(m))
    return [...sug, ...rest].slice(0, 10)
  }, [q, suggestedMoves])
  useEffect(() => { setQ(value) }, [value])
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <input className="input w-full text-sm" value={q} placeholder={placeholder || 'Move...'}
        onChange={e => { setQ(e.target.value); onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)} />
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-44 overflow-y-auto">
          {results.map(m => {
            const mv = MOVES[m]
            return (
              <div key={m} className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-800 ${suggestedMoves.includes(m) ? 'text-brand-300' : 'text-gray-300'}`}
                onMouseDown={() => { onChange(m); setQ(m); setOpen(false) }}>
                <span className="flex-1 text-sm">{m}</span>
                {mv && mv.bp > 0 && <span className="text-[10px] text-gray-500">{mv.bp}BP</span>}
                {mv && <span className="text-[9px] px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: TYPE_COLORS[mv.type] || '#888' }}>{mv.type}</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EvRow({ stat, value, base, nature, onChange }) {
  const final = base ? calcStat(stat, base, value, nature) : null
  const mod = NATURE_MODS[nature]?.[stat] ?? 1
  const pct = (value / 32) * 100
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xs w-8 text-right font-medium" style={{ color: STAT_COLORS[stat] }}>{STAT_LABELS[stat]}</span>
      <input type="range" min="0" max="32" value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, ${STAT_COLORS[stat]} ${pct}%, #374151 ${pct}%)` }} />
      <input type="number" min="0" max="32" value={value}
        onChange={e => onChange(Math.max(0, Math.min(32, Number(e.target.value) || 0)))}
        className="w-10 text-center text-xs bg-gray-800 border border-gray-700 rounded px-1 py-0.5 font-mono text-gray-200" />
      {final !== null && (
        <span className={`text-xs font-mono w-8 text-right ${mod > 1 ? 'text-green-400' : mod < 1 ? 'text-red-400' : 'text-gray-400'}`}>{final}</span>
      )}
    </div>
  )
}

// ── Boost selector ────────────────────────────────────────────────────────────
function BoostSelector({ value, onChange, color = 'brand' }) {
  const boosts = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]
  const activeClass = color === 'brand' ? 'bg-brand-600 text-white' : 'bg-red-700 text-white'
  return (
    <div className="flex flex-wrap gap-1">
      {boosts.map(b => (
        <button key={b} onClick={() => onChange(b)}
          className={`text-[10px] w-7 h-7 rounded font-mono transition-colors ${value === b ? activeClass : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
          {b > 0 ? `+${b}` : b}
        </button>
      ))}
    </div>
  )
}

// ── Damage Calculator ─────────────────────────────────────────────────────────
function DamageCalc({ attackerSlot }) {
  const [atkName, setAtkName] = useState(attackerSlot?.name || '')
  const [atkNature, setAtkNature] = useState(attackerSlot?.nature || 'Hardy')
  const [atkEvs, setAtkEvs] = useState(attackerSlot?.evs || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 })
  const [atkItem, setAtkItem] = useState(attackerSlot?.item || '')
  const [atkAbility, setAtkAbility] = useState(attackerSlot?.ability || '')
  const [atkBoost, setAtkBoost] = useState(0)
  const [atkBurn, setAtkBurn] = useState(false)
  const [atkHpPct, setAtkHpPct] = useState(100)
  const [defName, setDefName] = useState('')
  const [defNature, setDefNature] = useState('Hardy')
  const [defEvs, setDefEvs] = useState({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 })
  const [defItem, setDefItem] = useState('')
  const [defAbility, setDefAbility] = useState('')
  const [defBoost, setDefBoost] = useState(0)
  const [defHpFull, setDefHpFull] = useState(true)
  const [moveName, setMoveName] = useState('')
  const [weather, setWeather] = useState('none')
  const [terrain, setTerrain] = useState('none')
  const [isCrit, setIsCrit] = useState(false)
  const [isHH, setIsHH] = useState(false)
  const [hasScreen, setHasScreen] = useState(false)
  const [fainted, setFainted] = useState(0)

  // Sync from slot
  useEffect(() => {
    if (attackerSlot?.name) {
      setAtkName(attackerSlot.name)
      setAtkNature(attackerSlot.nature || 'Hardy')
      setAtkEvs(attackerSlot.evs || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 })
      setAtkItem(attackerSlot.item || '')
      setAtkAbility(attackerSlot.ability || '')
    }
  }, [attackerSlot])

  const loadDef = (name) => {
    setDefName(name)
    const p = pokemonData.find(x => x.name === name)
    const ms = p?.metaSets?.[0]
    if (ms) {
      setDefNature(ms.nature || 'Hardy')
      setDefEvs({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...(ms.evs || {}) })
      setDefItem(ms.item || '')
      setDefAbility(ms.ability || '')
    }
  }

  const atkPkmn = pokemonData.find(p => p.name === atkName)
  const defPkmn = pokemonData.find(p => p.name === defName)
  const mv = MOVES[moveName]

  const atkSugMoves = useMemo(() => {
    if (!atkPkmn) return []
    const c = {}
    atkPkmn.metaSets?.forEach(s => s.moves.forEach(m => { c[m] = (c[m] || 0) + 1 }))
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([m]) => m)
  }, [atkPkmn])

  const result = useMemo(() => {
    if (!atkPkmn || !defPkmn || !mv || mv.cat === 'status') return null
    return computeDamage({
      atkPkmn, defPkmn,
      atkEvs, defEvs,
      atkNature, defNature,
      atkItem, defItem,
      atkAbility, defAbility,
      moveName,
      atkBoost, defBoost,
      weather, terrain,
      isCrit, isHelpingHand: isHH,
      isBurn: atkBurn,
      hasScreen,
      defFainted: fainted,
      atkHpPct,
      atkHpFull: defHpFull,
    })
  }, [atkPkmn, defPkmn, atkEvs, defEvs, atkNature, defNature, atkItem, defItem,
    atkAbility, defAbility, moveName, atkBoost, defBoost, weather, terrain,
    isCrit, isHH, atkBurn, hasScreen, fainted, atkHpPct, defHpFull])

  const koColor = result?.ko1 ? 'text-red-400 font-bold' : result?.ko2 ? 'text-orange-400' : result?.ko3 ? 'text-yellow-400' : 'text-gray-400'
  const koLabel = result?.ko1 ? `OHKO (${result.koPct}% de rolls)` : result?.ko2 ? '2HKO garantizado' : result?.ko3 ? '3HKO garantizado' : result && !result.immune ? 'No KO en 3 hits' : ''

  return (
    <div className="space-y-3">
      {/* Attacker */}
      <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50 space-y-2">
        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Atacante</div>
        <div className="grid grid-cols-2 gap-2">
          <PokemonSearch value={atkName} onChange={n => {
            setAtkName(n)
            const p = pokemonData.find(x => x.name === n)
            const ms = p?.metaSets?.[0]
            if (ms) { setAtkNature(ms.nature || 'Hardy'); setAtkEvs({ hp:0,atk:0,def:0,spa:0,spd:0,spe:0,...(ms.evs||{}) }); setAtkItem(ms.item||''); setAtkAbility(ms.ability||'') }
          }} placeholder="Atacante..." />
          <select className="input text-xs" value={atkNature} onChange={e => setAtkNature(e.target.value)}>
            {NATURES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-gray-500 mb-1">Item</div>
            <input className="input w-full text-xs" value={atkItem} onChange={e => setAtkItem(e.target.value)} placeholder="Item atacante" />
          </div>
          <div>
            <div className="text-[10px] text-gray-500 mb-1">Ability</div>
            <select className="input w-full text-xs" value={atkAbility} onChange={e => setAtkAbility(e.target.value)}>
              <option value="">-- Ability --</option>
              {(atkPkmn?.abilities || []).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        {atkPkmn && (
          <div>
            <div className="text-[10px] text-gray-500 mb-1">EVs ofensivos</div>
            {['atk', 'spa'].map(s => (
              <EvRow key={s} stat={s} value={atkEvs[s] || 0} base={atkPkmn.baseStats[s]} nature={atkNature}
                onChange={v => setAtkEvs({ ...atkEvs, [s]: v })} />
            ))}
          </div>
        )}
        <div>
          <div className="text-[10px] text-gray-500 mb-1">Boost ataque</div>
          <BoostSelector value={atkBoost} onChange={setAtkBoost} color="brand" />
        </div>
        <div className="flex gap-3 flex-wrap text-[10px]">
          <label className="flex items-center gap-1 cursor-pointer text-gray-400">
            <input type="checkbox" checked={atkBurn} onChange={e => setAtkBurn(e.target.checked)} className="accent-brand-500" />
            Quemado
          </label>
          <label className="flex items-center gap-1 cursor-pointer text-gray-400">
            <input type="checkbox" checked={isHH} onChange={e => setIsHH(e.target.checked)} className="accent-brand-500" />
            Helping Hand
          </label>
          <div className="flex items-center gap-1 text-gray-400">
            HP: <input type="number" min="1" max="100" value={atkHpPct}
              onChange={e => setAtkHpPct(Math.max(1, Math.min(100, Number(e.target.value) || 100)))}
              className="w-12 text-xs bg-gray-800 border border-gray-700 rounded px-1 py-0.5 font-mono text-gray-200 ml-1" />%
          </div>
          {moveName === 'Last Respects' && (
            <div className="flex items-center gap-1 text-gray-400">
              Bajas aliadas: <input type="number" min="0" max="5" value={fainted}
                onChange={e => setFainted(Math.max(0, Math.min(5, Number(e.target.value) || 0)))}
                className="w-8 text-xs bg-gray-800 border border-gray-700 rounded px-1 py-0.5 font-mono text-gray-200 ml-1" />
            </div>
          )}
        </div>
      </div>

      {/* Move + Conditions */}
      <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50 space-y-2">
        <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Move y Condiciones</div>
        <MoveSearch value={moveName} onChange={setMoveName} suggestedMoves={atkSugMoves} placeholder="Nombre del move..." />
        {mv && mv.bp > 0 && (
          <div className="flex gap-2 flex-wrap text-[10px] text-gray-400">
            <span className="px-2 py-0.5 rounded text-white text-[9px]" style={{ backgroundColor: TYPE_COLORS[mv.type] || '#888' }}>{mv.type}</span>
            <span>{mv.bp}BP</span>
            <span>{mv.cat === 'physical' ? '⚔️ Físico' : '✨ Especial'}</span>
            {mv.spread && <span className="text-purple-300">Spread ×0.75</span>}
            {mv.priority > 0 && <span className="text-yellow-300">Prioridad +{mv.priority}</span>}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-gray-500 mb-1">Clima</div>
            <select className="input w-full text-xs" value={weather} onChange={e => setWeather(e.target.value)}>
              <option value="none">Sin clima</option>
              <option value="sun">☀️ Sol</option>
              <option value="rain">🌧️ Lluvia</option>
              <option value="sand">🌪️ Arena</option>
              <option value="hail">❄️ Nieve</option>
            </select>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 mb-1">Terreno</div>
            <select className="input w-full text-xs" value={terrain} onChange={e => setTerrain(e.target.value)}>
              <option value="none">Sin terreno</option>
              <option value="electric">⚡ Eléctrico</option>
              <option value="grassy">🌿 Herboso</option>
              <option value="psychic">🔮 Psíquico</option>
              <option value="misty">🌫️ Niebla</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap text-[10px]">
          <label className="flex items-center gap-1 cursor-pointer text-gray-400">
            <input type="checkbox" checked={isCrit} onChange={e => setIsCrit(e.target.checked)} className="accent-brand-500" />
            Golpe crítico ×1.5
          </label>
          <label className="flex items-center gap-1 cursor-pointer text-gray-400">
            <input type="checkbox" checked={hasScreen} onChange={e => setHasScreen(e.target.checked)} className="accent-brand-500" />
            Pantalla (×0.67)
          </label>
        </div>
      </div>

      {/* Defender */}
      <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50 space-y-2">
        <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Defensor</div>
        <div className="grid grid-cols-2 gap-2">
          <PokemonSearch value={defName} onChange={loadDef} placeholder="Defensor..." />
          <select className="input text-xs" value={defNature} onChange={e => setDefNature(e.target.value)}>
            {NATURES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-gray-500 mb-1">Item</div>
            <input className="input w-full text-xs" value={defItem} onChange={e => setDefItem(e.target.value)} placeholder="Item defensor" />
          </div>
          <div>
            <div className="text-[10px] text-gray-500 mb-1">Ability</div>
            <select className="input w-full text-xs" value={defAbility} onChange={e => setDefAbility(e.target.value)}>
              <option value="">-- Ability --</option>
              {(defPkmn?.abilities || []).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        {defPkmn && (
          <div>
            <div className="text-[10px] text-gray-500 mb-1">EVs defensivos</div>
            {['hp', 'def', 'spd'].map(s => (
              <EvRow key={s} stat={s} value={defEvs[s] || 0} base={defPkmn.baseStats[s]} nature={defNature}
                onChange={v => setDefEvs({ ...defEvs, [s]: v })} />
            ))}
          </div>
        )}
        <div>
          <div className="text-[10px] text-gray-500 mb-1">Boost defensa</div>
          <BoostSelector value={defBoost} onChange={setDefBoost} color="red" />
        </div>
        <label className="flex items-center gap-1 cursor-pointer text-[10px] text-gray-400">
          <input type="checkbox" checked={defHpFull} onChange={e => setDefHpFull(e.target.checked)} className="accent-brand-500" />
          HP lleno (activa Multiscale)
        </label>
      </div>

      {/* Result */}
      {result?.immune && (
        <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50 text-center">
          <div className="text-lg font-bold text-gray-400">Inmune 🛡️</div>
          <div className="text-xs text-gray-500 mt-1">{result.reason || `${result.defTypes?.join('/')} es inmune a ${result.moveType}`}</div>
        </div>
      )}

      {result && !result.immune && (
        <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50 space-y-3">
          {/* Smogon-style description */}
          <div className="font-mono text-[11px] text-gray-300 bg-gray-900 rounded-lg p-2 break-words leading-relaxed">
            {result.descLine}
          </div>

          {/* KO verdict */}
          <div className={`text-sm ${koColor}`}>{koLabel}</div>

          {/* Damage bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>HP defensor: <span className="font-mono text-gray-200">{result.defHp}</span></span>
              <span className="font-mono text-gray-200">{result.minPct}%–{result.maxPct}%</span>
            </div>
            <div className="relative h-7 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <div className="absolute inset-y-0 left-0 bg-green-700/40"
                style={{ width: `${Math.max(0, 100 - result.maxPct)}%` }} />
              <div className="absolute inset-y-0 bg-red-500/70"
                style={{ left: `${Math.max(0, 100 - result.maxPct)}%`, width: `${result.maxPct - result.minPct}%` }} />
              <div className="absolute inset-y-0 bg-red-600"
                style={{ right: 0, width: `${Math.max(0, result.minPct - (100 - result.maxPct))}%`, left: 'auto' }}
                title={`Min: ${result.min}`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-mono font-bold text-white drop-shadow-lg">
                  {result.min}–{result.max} / {result.defHp}
                </span>
              </div>
            </div>
          </div>

          {/* Rolls */}
          <div>
            <div className="text-[10px] text-gray-500 mb-1.5">Rolls (85%–100%):</div>
            <div className="flex flex-wrap gap-0.5">
              {result.rolls.map((r, i) => (
                <span key={i} className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${r >= result.defHp ? 'bg-red-900/60 text-red-200 border-red-700' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* Modifiers breakdown */}
          <div className="pt-2 border-t border-gray-700 flex flex-wrap gap-2 text-[10px]">
            {result.stab > 1 && <span className="bg-yellow-900/40 text-yellow-300 px-2 py-0.5 rounded">STAB ×{result.stab}</span>}
            {result.eff !== 1 && (
              <span className={`px-2 py-0.5 rounded ${result.eff > 1 ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>
                Efect. ×{result.eff}
              </span>
            )}
            {result.weatherMod !== 1 && <span className="bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">Clima ×{result.weatherMod}</span>}
            {result.spreadMod < 1 && <span className="bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded">Spread ×0.75</span>}
            {result.critMod > 1 && <span className="bg-yellow-900/40 text-yellow-300 px-2 py-0.5 rounded">Crítico ×1.5</span>}
            {result.burnMod < 1 && <span className="bg-orange-900/40 text-orange-300 px-2 py-0.5 rounded">Quemado ×0.5</span>}
            {result.screenMod < 1 && <span className="bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded">Pantalla ×{result.screenMod.toFixed(2)}</span>}
            {result.atkAbilityMult !== 1 && <span className="bg-brand-900/40 text-brand-300 px-2 py-0.5 rounded">Ability atk ×{result.atkAbilityMult.toFixed(2)}</span>}
            {result.defAbilityMult !== 1 && <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded">Ability def ×{result.defAbilityMult.toFixed(2)}</span>}
            {result.atkItemMult !== 1 && <span className="bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded">Item atk ×{result.atkItemMult.toFixed(2)}</span>}
            {result.defItemMult !== 1 && <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded">Item def ×{result.defItemMult.toFixed(2)}</span>}
            {result.hhMod > 1 && <span className="bg-pink-900/40 text-pink-300 px-2 py-0.5 rounded">Helping Hand ×1.5</span>}
            {result.bp !== MOVES[moveName]?.bp && <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded">BP real: {result.bp}</span>}
            {result.hits > 1 && <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded">×{result.hits} hits</span>}
          </div>
        </div>
      )}

      {!result && atkName && defName && moveName && mv?.bp > 0 && (
        <div className="text-center text-xs text-gray-500 py-4">Completa todos los campos para calcular</div>
      )}
      {(!atkName || !defName || !moveName) && (
        <div className="text-center text-sm text-gray-500 py-6">Selecciona atacante, move y defensor</div>
      )}
    </div>
  )
}

// ── Meta Suggestions Panel ────────────────────────────────────────────────────
function MetaSuggestions({ slot, onApply }) {
  const pkmn = pokemonData.find(p => p.name === slot.name)
  const [suggested, setSuggested] = useState(null)

  if (!slot.name) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-600 gap-3">
      <span className="text-4xl">👈</span>
      <span className="text-sm">Selecciona un Pokémon para ver sugerencias</span>
    </div>
  )
  if (!pkmn) return <div className="text-sm text-gray-500 py-8 text-center">Sin datos para {slot.name}</div>

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-gray-100 text-lg">{pkmn.name}</h3>
          <div className="flex gap-1 mt-1">
            {pkmn.types.map(t => (
              <span key={t} className="text-xs px-2 py-0.5 rounded font-medium text-white"
                style={{ backgroundColor: TYPE_COLORS[t] || '#888' }}>{t}</span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-brand-400">{pkmn.metaUsagePct}%</div>
          <div className="text-[10px] text-gray-500">{pkmn.metaUsage} pastes</div>
        </div>
      </div>

      <div className="space-y-1">
        {STAT_KEYS.map(s => {
          const base = pkmn.baseStats[s] || 0
          const ev = slot.evs?.[s] || 0
          const final = calcStat(s, base, ev, slot.nature || 'Hardy')
          const mod = NATURE_MODS[slot.nature || 'Hardy']?.[s] ?? 1
          const sugEv = suggested?.evs?.[s] ?? null
          const sugFinal = sugEv !== null ? calcStat(s, base, sugEv, suggested?.nature || 'Hardy') : null
          return (
            <div key={s} className="flex items-center gap-2">
              <span className="text-[10px] w-7 text-right" style={{ color: STAT_COLORS[s] }}>{STAT_LABELS[s]}</span>
              <span className="text-[10px] font-mono text-gray-600 w-6 text-right">{base}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (base / 170) * 100)}%`, backgroundColor: STAT_COLORS[s] }} />
              </div>
              <span className={`text-[10px] font-mono w-8 text-right ${mod > 1 ? 'text-green-400' : mod < 1 ? 'text-red-400' : 'text-gray-400'}`}>{final}</span>
              {sugFinal !== null && sugFinal !== final && (
                <span className={`text-[10px] font-mono w-8 text-right ${sugFinal > final ? 'text-green-300' : 'text-red-300'}`}>→{sugFinal}</span>
              )}
            </div>
          )
        })}
      </div>

      {pkmn.metaSets?.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Sets del meta</div>
          {pkmn.metaSets.map((ms, i) => {
            const isCurrent = slot.item === ms.item && slot.nature === ms.nature
            const isPreview = suggested === ms
            return (
              <div key={i}
                className={`rounded-lg p-3 border transition-all ${isCurrent ? 'border-brand-500/60 bg-brand-900/20' : isPreview ? 'border-yellow-500/40 bg-yellow-900/10' : 'border-gray-700/60 hover:border-gray-500/60 bg-gray-800/30'}`}
                onMouseEnter={() => setSuggested(ms)}
                onMouseLeave={() => setSuggested(null)}>
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${MEGA_ITEMS.includes(ms.item) ? 'text-yellow-400' : 'text-gray-200'}`}>{ms.item}</span>
                    {MEGA_ITEMS.includes(ms.item) && <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-1 rounded">MEGA</span>}
                  </div>
                  <span className="text-[10px] text-gray-500">{ms.count} pastes · {ms.usagePct}%</span>
                </div>
                <div className="flex gap-2 text-[10px] mb-1.5">
                  <span className="text-purple-400">{ms.nature}</span>
                  <span className="text-gray-500">{ms.ability}</span>
                </div>
                {ms.evsStr && <div className="text-[10px] text-gray-500 font-mono mb-2">{ms.evsStr}</div>}
                <div className="flex flex-wrap gap-1 mb-2">
                  {ms.moves.map((m, j) => (
                    <span key={j} className={`text-[10px] px-2 py-0.5 rounded ${j < 2 ? 'bg-brand-900/50 text-brand-300' : 'bg-gray-700/50 text-gray-400'}`}>{m}</span>
                  ))}
                </div>
                <button
                  onClick={() => { onApply(ms); setSuggested(null) }}
                  className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${isCurrent ? 'bg-brand-800/50 text-brand-300 cursor-default' : 'bg-brand-600 hover:bg-brand-500 text-white cursor-pointer'}`}
                  disabled={isCurrent}>
                  {isCurrent ? '✓ Aplicado actualmente' : '← Aceptar sugerencia'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Set Editor ────────────────────────────────────────────────────────────────
function SetEditor({ slot, onChange }) {
  const pkmn = pokemonData.find(p => p.name === slot.name)
  const isMega = MEGA_ITEMS.includes(slot.item)
  const sugMoves = useMemo(() => {
    if (!pkmn) return []
    const c = {}
    pkmn.metaSets?.forEach(s => s.moves.forEach(m => { c[m] = (c[m] || 0) + (s.count || 1) }))
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([m]) => m)
  }, [pkmn])

  const setEv = (s, v) => onChange({ ...slot, evs: { ...slot.evs, [s]: v } })
  const setMove = (i, v) => { const m = [...slot.moves]; m[i] = v; onChange({ ...slot, moves: m }) }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="label">Pokémon</div>
          <PokemonSearch value={slot.name} onChange={name => {
            const p = pokemonData.find(x => x.name === name)
            const ms = p?.metaSets?.[0]
            onChange({ ...slot, name, item: ms?.item ?? '', ability: ms?.ability ?? p?.abilities?.[0] ?? '', nature: ms?.nature ?? 'Hardy', evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0,...(ms?.evs||{}) }, moves: ms ? [...ms.moves,'','',''].slice(0,4) : ['','','',''] })
          }} />
        </div>
        <div>
          <div className="label">Item {isMega && <span className="text-yellow-400 text-[10px] ml-1">● MEGA</span>}</div>
          <select className="input w-full" value={slot.item} onChange={e => onChange({ ...slot, item: e.target.value })}>
            <option value="">-- Item --</option>
            {pkmn?.metaSets?.map(s => s.item).filter((v, i, a) => a.indexOf(v) === i).map(i => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="label">Ability</div>
          <select className="input w-full" value={slot.ability} onChange={e => onChange({ ...slot, ability: e.target.value })}>
            <option value="">-- Ability --</option>
            {(pkmn?.abilities || []).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <div className="label">Nature</div>
          <select className="input w-full" value={slot.nature} onChange={e => onChange({ ...slot, nature: e.target.value })}>
            {NATURES.map(n => {
              const mods = NATURE_MODS[n]; const keys = Object.keys(mods)
              return <option key={n} value={n}>{keys.length ? `${n} (+${STAT_LABELS[keys.find(k => mods[k] > 1)]} -${STAT_LABELS[keys.find(k => mods[k] < 1)]})` : n}</option>
            })}
          </select>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="label mb-0">EVs <span className="text-gray-500 font-normal text-[10px]">(0–32 Champions)</span></div>
          <span className="text-xs font-mono text-gray-500">{Object.values(slot.evs).reduce((a, b) => a + b, 0)} EVs</span>
        </div>
        {STAT_KEYS.map(s => <EvRow key={s} stat={s} value={slot.evs[s] || 0} base={pkmn?.baseStats?.[s]} nature={slot.nature} onChange={v => setEv(s, v)} />)}
      </div>
      <div>
        <div className="label">Moveset</div>
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map(i => (
            <MoveSearch key={i} value={slot.moves[i] || ''} onChange={v => setMove(i, v)} suggestedMoves={sugMoves} placeholder={`Move ${i + 1}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Export Modal ──────────────────────────────────────────────────────────────
function toShowdown(team) {
  return team.filter(s => s.name).map(s => {
    const lines = [`${s.name}${s.item ? ` @ ${s.item}` : ''}`]
    if (s.ability) lines.push(`Ability: ${s.ability}`)
    const ep = STAT_KEYS.filter(k => s.evs[k] > 0).map(k => `${s.evs[k]} ${STAT_LABELS[k]}`)
    if (ep.length) lines.push(`EVs: ${ep.join(' / ')}`)
    if (s.nature) lines.push(`${s.nature} Nature`)
    s.moves.filter(Boolean).forEach(m => lines.push(`- ${m}`))
    return lines.join('\n')
  }).join('\n\n')
}

function ExportModal({ team, onClose }) {
  const text = toShowdown(team)
  const [copied, setCopied] = useState(false)
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-gray-100">Exportar — formato Showdown</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">✕</button>
        </div>
        <div className="p-5">
          <textarea readOnly value={text} rows={16} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 font-mono text-xs text-gray-200 resize-none" />
          <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className={`mt-3 w-full py-2 rounded-lg font-medium text-sm transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-brand-600 hover:bg-brand-500 text-white'}`}>
            {copied ? '✓ Copiado!' : 'Copiar al portapapeles'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Team Slot Button ──────────────────────────────────────────────────────────
const emptySlot = () => ({ name: '', item: '', ability: '', nature: 'Hardy', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, moves: ['', '', '', ''] })

function TeamSlotButton({ slot, index, active, onClick, onRemove }) {
  const pkmn = pokemonData.find(p => p.name === slot.name)
  return (
    <div className={`relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors border ${active ? 'border-brand-500/60 bg-brand-900/20' : 'border-gray-700/50 hover:border-gray-600 bg-gray-800/40'}`} onClick={onClick}>
      <div className="flex-1 min-w-0">
        {slot.name ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-100 truncate">{slot.name}</span>
              {MEGA_ITEMS.includes(slot.item) && <span className="text-[9px] text-yellow-400 shrink-0">MEGA</span>}
            </div>
            <div className="text-[10px] text-gray-500 truncate">{slot.item || '—'} · {slot.nature}</div>
          </>
        ) : <span className="text-sm text-gray-600">Slot {index + 1}</span>}
      </div>
      {pkmn && <div className="flex gap-0.5 shrink-0">{pkmn.types.map(t => <span key={t} className="w-2 h-5 rounded-sm" style={{ backgroundColor: TYPE_COLORS[t] }} />)}</div>}
      <button onClick={e => { e.stopPropagation(); onRemove() }} className="text-gray-700 hover:text-red-400 transition-colors text-xs">✕</button>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Teambuilder() {
  const [team, setTeam] = useState([emptySlot()])
  const [activeIdx, setActiveIdx] = useState(0)
  const [rightTab, setRightTab] = useState('suggestions')
  const [showExport, setShowExport] = useState(false)

  const update = (i, slot) => setTeam(t => { const n = [...t]; n[i] = slot; return n })
  const remove = (i) => { setTeam(t => { const n = t.filter((_, j) => j !== i); return n.length ? n : [emptySlot()] }); setActiveIdx(i => Math.max(0, i - 1)) }
  const add = () => { if (team.length < 6) { setTeam(t => [...t, emptySlot()]); setActiveIdx(team.length) } }

  const hasMega = team.some(s => MEGA_ITEMS.includes(s.item))
  const filledCount = team.filter(s => s.name).length

  const applySet = (ms) => update(activeIdx, {
    ...team[activeIdx],
    item: ms.item, ability: ms.ability, nature: ms.nature,
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...(ms.evs || {}) },
    moves: [...ms.moves, '', '', ''].slice(0, 4),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-100">Teambuilder</h2>
          <p className="text-sm text-gray-400">Formato Champions · EVs 0-32 · sin IVs · requiere Mega</p>
        </div>
        <div className="flex items-center gap-2">
          {!hasMega && filledCount > 0 && <span className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 rounded-full">⚠ Sin Mega</span>}
          {hasMega && <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full">✓ Mega incluida</span>}
          <button onClick={() => setShowExport(true)} className="btn-primary text-sm px-4 py-1.5">Exportar Showdown</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {team.map((slot, i) => <TeamSlotButton key={i} slot={slot} index={i} active={activeIdx === i} onClick={() => setActiveIdx(i)} onRemove={() => remove(i)} />)}
        {team.length < 6 && (
          <button onClick={add} className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-dashed border-gray-700 text-gray-600 hover:text-gray-400 hover:border-gray-500 transition-colors text-sm">
            <span className="text-lg leading-none">+</span> Agregar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-100 text-sm">
              Slot {activeIdx + 1}{team[activeIdx]?.name && <span className="text-gray-400 font-normal"> — {team[activeIdx].name}</span>}
            </h3>
            <div className="flex gap-1">
              {team.map((_, i) => <button key={i} onClick={() => setActiveIdx(i)} className={`w-6 h-6 rounded text-xs transition-colors ${activeIdx === i ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>{i + 1}</button>)}
            </div>
          </div>
          {team[activeIdx] && <SetEditor slot={team[activeIdx]} onChange={slot => update(activeIdx, slot)} />}
        </div>

        <div className="card flex flex-col">
          <div className="flex gap-1 mb-4">
            <button onClick={() => setRightTab('suggestions')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${rightTab === 'suggestions' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>💡 Sugerencias</button>
            <button onClick={() => setRightTab('calc')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${rightTab === 'calc' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>⚔️ Calc de Daño</button>
          </div>
          <div className="overflow-y-auto flex-1 max-h-[700px]">
            {rightTab === 'suggestions' && team[activeIdx] && <MetaSuggestions slot={team[activeIdx]} onApply={applySet} />}
            {rightTab === 'calc' && <DamageCalc attackerSlot={team[activeIdx]} />}
          </div>
        </div>
      </div>

      {showExport && <ExportModal team={team} onClose={() => setShowExport(false)} />}
    </div>
  )
}
