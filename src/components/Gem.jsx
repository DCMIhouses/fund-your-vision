import { useId } from 'react'

export default function Gem({ gem, className = 'h-8 w-8' }) {
  const id = useId()
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label={`${gem.name} medal`} role="img" style={{ filter: `drop-shadow(0 0 6px ${gem.c1})` }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={gem.c1} />
          <stop offset="1" stopColor={gem.c2} />
        </linearGradient>
      </defs>
      <polygon points="5,1 10,1 13,10 9,11" fill={gem.c2} opacity=".9" />
      <polygon points="19,1 14,1 11,10 15,11" fill={gem.c2} opacity=".7" />
      <circle cx="12" cy="15.5" r="7.5" fill={`url(#${id})`} stroke="rgba(255,255,255,.85)" strokeWidth=".8" />
      <circle cx="12" cy="15.5" r="5.3" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth=".6" />
      <text x="12" y="18" textAnchor="middle" fontSize="7" fontWeight="900" fill="rgba(15,23,42,.85)" fontFamily="Inter, sans-serif">{gem.lvl ?? ''}</text>
    </svg>
  )
}
