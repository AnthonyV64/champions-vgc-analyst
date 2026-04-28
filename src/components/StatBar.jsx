export default function StatBar({ label, value, max = 255 }) {
  const pct = Math.min(100, (value / max) * 100)
  const color =
    value >= 130 ? 'bg-green-400' :
    value >= 100 ? 'bg-yellow-400' :
    value >= 70  ? 'bg-orange-400' :
                   'bg-red-500'

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 text-gray-400 shrink-0">{label}</span>
      <span className="w-8 text-right font-mono text-gray-200 shrink-0">{value}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
