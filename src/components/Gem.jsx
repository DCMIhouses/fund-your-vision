import { useId } from 'react'

const CUTS = {
  brilliant: { body: '4,9 8,4 16,4 20,9 12,21', facets: 'M4 9h16M8 4l2 5 2-5 2 5 2-5M10 9l2 12 2-12' },
  emerald: { body: '8,3 16,3 21,8 21,16 16,21 8,21 3,16 3,8', facets: 'M9.5 7h5l2.5 2.5v5L14.5 17h-5L7 14.5v-5zM8 3l1.5 4M16 3l-1.5 4M21 16l-4-1.5M3 16l4-1.5M8 21l1.5-4M16 21l-1.5-4' },
  cushion: { body: '12,2 22,12 12,22 2,12', facets: 'M12 6l6 6-6 6-6-6zM12 2v4M22 12h-4M12 22v-4M2 12h4' },
  crystal: { body: '12,2 18,7 18,17 12,22 6,17 6,7', facets: 'M6 7l6 3 6-3M12 10v12M6 17l6-2 6 2' },
  trillion: { body: '12,3 21,20 3,20', facets: 'M12 9l4.5 8h-9zM12 3v6M21 20l-4.5-3M3 20l4.5-3' },
  heart: { body: '12,21 3.5,12 3,7.5 5.5,4 9,4 12,7 15,4 18.5,4 21,7.5 20.5,12', facets: 'M12 7v14M3.5 12h17M7 4l1.5 8M17 4l-1.5 8' },
}

export default function Gem({ gem, className = 'h-8 w-8' }) {
  const id = useId()
  const cut = CUTS[gem.cut] || CUTS.brilliant
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label={gem.name} role="img" style={{ filter: `drop-shadow(0 0 6px ${gem.c1})` }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={gem.c1} />
          <stop offset="1" stopColor={gem.c2} />
        </linearGradient>
      </defs>
      <polygon points={cut.body} fill={`url(#${id})`} stroke="rgba(255,255,255,.75)" strokeWidth="0.8" strokeLinejoin="round" />
      <path d={cut.facets} fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="0.6" strokeLinejoin="round" />
      <polygon points={cut.body} fill="rgba(255,255,255,.12)" transform="translate(12 12) scale(.35) translate(-14 -16)" />
    </svg>
  )
}
