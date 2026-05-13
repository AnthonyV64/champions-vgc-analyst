import { useState, useEffect } from 'react'
import MetaDashboard from './pages/MetaDashboard'
import TournamentBrowser from './pages/TournamentBrowser'
import Teambuilder from './pages/Teambuilder'
import DamageCalcPage from './pages/SpreadCalculator'
import PokemonDatabase from './pages/PokemonDatabase'

const TABS = [
  { id: 'meta',        label: 'Meta',        icon: '◈' },
  { id: 'tournaments', label: 'Torneos',     icon: '◉' },
  { id: 'teambuilder', label: 'Teambuilder', icon: '◧' },
  { id: 'database',    label: 'Pokémon',     icon: '◫' },
  { id: 'calc',        label: 'Damage Calc', icon: '⚔️' },
]

const emptySlot = () => ({
  name: '', item: '', ability: '', nature: 'Hardy',
  evs: { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 },
  moves: ['','','','']
})

export default function App() {
  const [activeTab, setActiveTab] = useState('meta')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [team, setTeam] = useState([emptySlot()])

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <header className={`sticky top-0 z-30 transition-all duration-300 ${scrolled ? 'bg-[#080B10]/95 backdrop-blur-md border-b border-white/5' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F8EF7] to-[#7B5EA7] flex items-center justify-center">
                  <span className="text-white text-xs font-black tracking-tighter">CH</span>
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#4F8EF7] animate-pulse" />
              </div>
              <div>
                <div className="text-white font-black text-sm tracking-tight leading-none">CHAMPIONS</div>
                <div className="text-[#4F8EF7] text-[10px] font-medium tracking-widest uppercase leading-none mt-0.5">VGC Analyst</div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                    activeTab === tab.id ? 'bg-[#4F8EF7] text-white shadow-lg shadow-[#4F8EF7]/25' : 'text-gray-400 hover:text-white hover:bg-white/8'
                  }`}>
                  <span className="mr-1.5 opacity-70">{tab.icon}</span>{tab.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7B5EA7]/20 border border-[#7B5EA7]/30">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7B5EA7] animate-pulse" />
                <span className="text-[10px] text-[#A78BCC] font-semibold tracking-widest uppercase">Reg M-A · No Tera</span>
              </div>
              <button className="md:hidden p-2 text-gray-400 hover:text-white" onClick={() => setMobileOpen(o => !o)}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/8 bg-[#080B10]/98 px-4 py-3 space-y-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMobileOpen(false) }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'bg-[#4F8EF7]/20 text-[#4F8EF7] border border-[#4F8EF7]/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}>
                <span className="mr-2">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {activeTab === 'meta'        && <MetaDashboard />}
        {activeTab === 'tournaments' && <TournamentBrowser />}
        {activeTab === 'teambuilder' && <Teambuilder team={team} setTeam={setTeam} />}
        {activeTab === 'calc'        && <DamageCalcPage team={team} />}
        {activeTab === 'database'    && <PokemonDatabase />}
      </main>

      <footer className="border-t border-white/5 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-xs text-gray-600">Champions VGC Analyst · fan-made · not affiliated with The Pokémon Company</div>
          <div className="flex items-center gap-4 text-xs text-gray-700">
            <span>113 torneos</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>864 equipos</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>514 pastes</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
