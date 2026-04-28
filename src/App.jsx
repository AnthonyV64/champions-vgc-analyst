import { useState } from 'react'
import MetaDashboard from './pages/MetaDashboard'
import TournamentBrowser from './pages/TournamentBrowser'
import Teambuilder from './pages/Teambuilder'
import SpreadCalculator from './pages/SpreadCalculator'
import PokemonDatabase from './pages/PokemonDatabase'

const TABS = [
  { id: 'meta',        label: 'Meta Dashboard',      icon: '📊' },
  { id: 'tournaments', label: 'Tournament Browser',   icon: '🏆' },
  { id: 'teambuilder', label: 'Teambuilder',          icon: '🛠️' },
  { id: 'spreads',     label: 'Spread Calculator',    icon: '🔢' },
  { id: 'database',    label: 'Pokémon Database',     icon: '📖' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('meta')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const currentTab = TABS.find(t => t.id === activeTab)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <span className="text-brand-400 font-bold text-lg leading-none">Champions</span>
            <span className="text-gray-400 text-sm font-medium">VGC Analyst</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-gray-100"
            onClick={() => setMobileMenuOpen(o => !o)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-gray-900 px-4 py-2 space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Page title bar */}
      <div className="border-b border-gray-800/50 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-sm font-medium text-gray-400">
            <span className="mr-2">{currentTab?.icon}</span>{currentTab?.label}
          </h1>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {activeTab === 'meta'        && <MetaDashboard />}
        {activeTab === 'tournaments' && <TournamentBrowser />}
        {activeTab === 'teambuilder' && <Teambuilder />}
        {activeTab === 'spreads'     && <SpreadCalculator />}
        {activeTab === 'database'    && <PokemonDatabase />}
      </main>

      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        Champions VGC Analyst · fan-made tool · not affiliated with The Pokémon Company
      </footer>
    </div>
  )
}
