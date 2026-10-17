const COLORS = ['#6D5BD0', '#2B8FB0', '#C2557F', '#2F9E6B', '#D9772F', '#C24B4B', '#3A6FD8', '#22968A']
const NAMES = ['Capital Architect', 'AI Underwriter', 'VC Negotiator', 'AI CFO', 'Growth Strategist', 'Risk Officer', 'Reporting Agent', 'Guidance Consultant']

// Lightweight welcome-screen preview of the 10-desk office (5 per wall, 2 open). The playable office is PixiJS on the Play screen.
export default function OfficePreview() {
  const desk = (side, i) => {
    const x = side === 'L' ? 22 : 238
    const y = 22 + i * 52
    const idx = side === 'L' ? i : 4 + i
    const empty = i === 4
    return (
      <g key={`${side}${i}`}>
        <rect x={x} y={y} width="80" height="34" rx="6" fill="#22324A" />
        <rect x={side === 'L' ? x + 50 : x + 6} y={y + 6} width="24" height="15" rx="2" fill={empty ? '#2B3A52' : '#9FD3F5'} opacity={empty ? 1 : 0.85} className={empty ? '' : 'fos-blink'} style={{ animationDelay: `${idx * 0.3}s` }} />
        {!empty && <circle cx={side === 'L' ? x + 30 : x + 50} cy={y + 17} r="8" fill={COLORS[idx]} />}
        <text x={x + 40} y={y + 46} textAnchor="middle" fontSize="8.5" fill="#C9D6E8">{empty ? 'Open desk' : NAMES[idx]}</text>
      </g>
    )
  }
  return (
    <svg viewBox="0 0 340 290" className="h-auto w-full" role="img" aria-label="Preview of your office: ten desks, five on each wall, eight advisors working and two open desks.">
      <rect width="340" height="290" rx="20" fill="#101C2C" />
      <rect x="128" y="10" width="84" height="270" rx="10" fill="#15263B" />
      {[0, 1, 2, 3, 4].map((i) => desk('L', i))}
      {[0, 1, 2, 3, 4].map((i) => desk('R', i))}
      <g className="fos-walk" style={{ '--wx': '0px', '--wy': '104px' }}>
        <circle cx="160" cy="60" r="8" fill={COLORS[1]} />
        <rect x="166" y="58" width="9" height="11" rx="1.5" fill="#E8B64C" />
      </g>
    </svg>
  )
}
