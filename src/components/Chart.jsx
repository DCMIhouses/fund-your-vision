import { fmtK } from '../game'
import { BOSS_MONTH } from '../engine'

export default function Chart({ forecast, height = 180 }) {
  const pts = forecast.months
  const vals = pts.map((p) => p.cash)
  const max = Math.max(10000, ...vals)
  const min = Math.min(0, ...vals)
  const W = 600, H = height, pad = 28
  const x = (i) => pad + (i / (pts.length - 1)) * (W - pad * 2)
  const y = (v) => pad / 2 + (1 - (v - min) / (max - min)) * (H - pad * 1.5)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.cash).toFixed(1)}`).join(' ')
  const area = `${line} L${x(pts.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
  const bad = forecast.insolventMonth
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="18-month cash forecast">
      <defs>
        <linearGradient id="cashfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={bad ? '#ff2e63' : '#39ff88'} stopOpacity="0.35" />
          <stop offset="100%" stopColor={bad ? '#ff2e63' : '#39ff88'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={pad} x2={W - pad} y1={y(0)} y2={y(0)} stroke="#64748b" strokeDasharray="4 4" strokeWidth="1" />
      <line x1={x(BOSS_MONTH - 1)} x2={x(BOSS_MONTH - 1)} y1={8} y2={H - pad / 2} stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x={x(BOSS_MONTH - 1) + 4} y={16} fill="#fbbf24" fontSize="11" fontFamily="monospace">Promo cliff + revenue shortfall</text>
      <path d={area} fill="url(#cashfill)" />
      <path d={line} fill="none" stroke={bad ? '#ff2e63' : '#39ff88'} strokeWidth="2.5" />
      {pts.map((p, i) => (
        <circle key={p.m} cx={x(i)} cy={y(p.cash)} r={p.m === bad ? 5 : 2.5} fill={p.cash < 0 ? '#ff2e63' : '#39ff88'} />
      ))}
      <text x={pad} y={H - 4} fill="#64748b" fontSize="10" fontFamily="monospace">M1</text>
      <text x={W - pad - 20} y={H - 4} fill="#64748b" fontSize="10" fontFamily="monospace">M18</text>
      <text x={4} y={y(max) + 4} fill="#64748b" fontSize="10" fontFamily="monospace">{fmtK(max)}</text>
      <text x={4} y={y(0) - 4} fill="#64748b" fontSize="10" fontFamily="monospace">$0</text>
    </svg>
  )
}
