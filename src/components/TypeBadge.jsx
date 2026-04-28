const TYPE_COLORS = {
  Normal:   'bg-gray-500 text-white',
  Fire:     'bg-orange-600 text-white',
  Water:    'bg-blue-500 text-white',
  Electric: 'bg-yellow-400 text-gray-900',
  Grass:    'bg-green-500 text-white',
  Ice:      'bg-cyan-400 text-gray-900',
  Fighting: 'bg-red-700 text-white',
  Poison:   'bg-purple-600 text-white',
  Ground:   'bg-amber-600 text-white',
  Flying:   'bg-indigo-400 text-white',
  Psychic:  'bg-pink-500 text-white',
  Bug:      'bg-lime-500 text-gray-900',
  Rock:     'bg-stone-500 text-white',
  Ghost:    'bg-violet-700 text-white',
  Dragon:   'bg-indigo-700 text-white',
  Dark:     'bg-gray-700 text-white',
  Steel:    'bg-slate-400 text-gray-900',
  Fairy:    'bg-pink-300 text-gray-900',
}

export default function TypeBadge({ type }) {
  const cls = TYPE_COLORS[type] ?? 'bg-gray-600 text-white'
  return (
    <span className={`badge ${cls}`}>{type}</span>
  )
}
