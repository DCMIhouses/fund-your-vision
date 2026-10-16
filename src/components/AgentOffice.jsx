import { useEffect, useRef, useState } from 'react'

const LEFT = ['cfo', 'risk', 'underwriting', 'coach', null]
const RIGHT = ['reporting', 'guide', 'architect', 'ops', null]
const HANDOFF = { cfo: 'reporting', risk: 'guide', underwriting: 'architect', coach: 'reporting', architect: 'cfo', ops: 'cfo', guide: 'risk', reporting: 'guide' }
const ROUTINE = ['cfo', 'underwriting', 'architect', 'risk', 'ops', 'guide', 'coach', 'reporting']
const DOC = { cfo: 'cash forecast', risk: 'risk memo', underwriting: 'credit file', coach: 'medal log', architect: 'capital plan', ops: 'team cost sheet', guide: 'action plan', reporting: 'draft report' }
const ACT = { cfo: 'Modeling cash flow', risk: 'Scanning for risks', underwriting: 'Scanning applications', coach: 'Tracking medals', architect: 'Drafting capital plan', ops: 'Pricing the team', guide: 'Writing next steps', reporting: 'Assembling report' }
const SHIRT = { cfo: '#16a34a', risk: '#dc2626', underwriting: '#0891b2', coach: '#d97706', architect: '#7c3aed', ops: '#475569', guide: '#0d9488', reporting: '#2563eb' }
const SKIN = { cfo: '#f1c27d', risk: '#8d5524', underwriting: '#e0ac69', coach: '#c68642', architect: '#ffdbac', ops: '#a0663a', guide: '#f1c27d', reporting: '#8d5524' }
const STATUS = { ok: '#39ff88', watch: '#fbbf24', alert: '#ff2e63' }
const TINT = { ok: '#03140c', watch: '#1f1704', alert: '#22060d' }
const ROW = 140
const rowY = (i) => 46 + i * ROW
const DUR = 7000
const H = rowY(5) + 6

const where = (id) => { const l = LEFT.indexOf(id); return l >= 0 ? ['L', l] : ['R', RIGHT.indexOf(id)] }
const seat = (side, i) => ({ x: side === 'L' ? 286 : 714, y: rowY(i) + 44 })
const aisle = (side, i) => ({ x: side === 'L' ? 376 : 624, y: rowY(i) + 44 })
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })

function walk(w, now) {
  const p = Math.min(1, Math.max(0, (now - w.start) / DUR))
  const [fs, fi] = where(w.from), [ts, ti] = where(w.to)
  const A = seat(fs, fi), B = aisle(fs, fi), C = aisle(ts, ti), D = lerp(C, seat(ts, ti), 0.55)
  const seg = [[0, 0.08, A, B], [0.08, 0.42, B, C], [0.42, 0.5, C, D], [0.5, 0.58, D, D], [0.58, 0.66, D, C], [0.66, 0.92, C, B], [0.92, 1, B, A]]
  const [s0, s1, P, Q] = seg.find(([a, b]) => p >= a && p <= b) || seg[seg.length - 1]
  const pos = lerp(P, Q, (p - s0) / (s1 - s0 || 1))
  const moving = !(p >= 0.5 && p <= 0.58)
  return { p, pos, carrying: p < 0.54, handed: p >= 0.54, moving, facing: Q.x < P.x ? -1 : Q.x > P.x ? 1 : (ts === 'L' ? -1 : 1) }
}

function Person({ x, y, id, sitting, walking, facing = 1, carry, now }) {
  const shirt = SHIRT[id], skin = SKIN[id]
  const sw = walking ? Math.sin(now / 95) * 6 : 0
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy={sitting ? 24 : 30} rx="16" ry="5" fill="rgba(0,0,0,.35)" />
      {sitting && <rect x="-17" y="-8" width="34" height="34" rx="10" fill="#1f2937" stroke="#334155" />}
      {!sitting && <><line x1="-5" y1="14" x2={-5 + sw} y2="30" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" /><line x1="5" y1="14" x2={5 - sw} y2="30" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" /></>}
      <rect x="-12" y="-6" width="24" height="24" rx="8" fill={shirt} />
      {sitting
        ? <line className="arm-type" x1={facing * -8} y1="2" x2={facing * -22} y2="8" stroke={skin} strokeWidth="5" strokeLinecap="round" />
        : <line x1={facing * 9} y1="0" x2={facing * 18} y2={carry ? -2 : 10} stroke={skin} strokeWidth="5" strokeLinecap="round" />}
      <circle cx="0" cy="-15" r="11" fill={skin} />
      <path d="M-11 -17 a11 11 0 0 1 22 0 q-11 -6 -22 0z" fill="#111827" />
      {carry && (
        <g transform={`translate(${facing * 16} -14)`}>
          <rect x="-7" y="-9" width="16" height="20" rx="2" fill="#f8fafc" stroke="#94a3b8" />
          <line x1="-4" y1="-4" x2="6" y2="-4" stroke="#64748b" strokeWidth="1.5" /><line x1="-4" y1="0" x2="6" y2="0" stroke="#64748b" strokeWidth="1.5" /><line x1="-4" y1="4" x2="3" y2="4" stroke="#64748b" strokeWidth="1.5" />
        </g>
      )}
    </g>
  )
}

function ScreenArt({ id, x, y, w, h, color }) {
  const cx = x + w / 2
  switch (id) {
    case 'cfo': return <g>
      <line x1={x + 10} y1={y + h - 12} x2={x + w - 10} y2={y + h - 12} stroke="#334155" />
      {[0, 1, 2, 3].map((i) => <rect key={i} className="scr-bar" style={{ animationDelay: `${i * 0.25}s` }} x={x + 14 + i * 16} y={y + h - 40} width="10" height="28" fill="#16a34a" opacity=".55" />)}
      <polyline className="scr-draw" pathLength="1" points={`${x + 12},${y + h - 18} ${x + 40},${y + h - 30} ${x + 64},${y + h - 26} ${x + 90},${y + 22} ${x + w - 12},${y + 14}`} fill="none" stroke={color} strokeWidth="3" />
    </g>
    case 'reporting': return <g>
      <rect x={cx - 34} y={y + 8} width="68" height={h - 16} rx="3" fill="#e2e8f0" />
      <rect x={cx - 28} y={y + 13} width="40" height="6" fill="#2563eb" />
      {[0, 1, 2, 3].map((i) => <rect key={i} className="scr-type" style={{ animationDelay: `${i * 0.45}s` }} x={cx - 28} y={y + 25 + i * 9} width="56" height="4" fill="#64748b" />)}
      <circle cx={cx + 22} cy={y + 16} r="5" fill="#fbbf24" className="scr-blink" />
    </g>
    case 'risk': return <g>
      <path className="scr-blink" d={`M${cx - 22} ${y + 50} L${cx} ${y + 12} L${cx + 22} ${y + 50} Z`} fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" />
      <rect x={cx - 2} y={y + 24} width="4" height="14" fill={color} /><rect x={cx - 2} y={y + 42} width="4" height="4" fill={color} />
      {[0, 1].map((i) => <rect key={i} className="scr-bar" style={{ animationDelay: `${i * 0.4}s` }} x={x + 10 + i * (w - 30)} y={y + 16} width="10" height="40" fill="#ff2e63" opacity=".4" />)}
    </g>
    case 'architect': return <g>
      <rect x={cx - 34} y={y + 8} width="68" height={h - 16} rx="3" fill="#ede9fe" />
      {[0, 1, 2].map((i) => <rect key={i} x={cx - 28} y={y + 14 + i * 8} width="56" height="4" fill="#7c3aed" opacity=".5" />)}
      <path className="scr-draw" pathLength="1" d={`M${cx - 26} ${y + h - 16} q8 -10 14 0 t14 0 t14 -2`} fill="none" stroke="#1e293b" strokeWidth="2.5" />
      <circle cx={cx + 22} cy={y + h - 18} r="6" fill="#fbbf24" className="scr-blink" />
    </g>
    case 'underwriting': return <g>
      <rect x={cx - 34} y={y + 8} width="68" height={h - 16} rx="3" fill="#cffafe" />
      {[0, 1, 2, 3].map((i) => <g key={i}><rect x={cx - 28} y={y + 14 + i * 11} width="12" height="7" fill="#0891b2" opacity=".6" /><rect x={cx - 12} y={y + 15 + i * 11} width="38" height="5" fill="#94a3b8" /></g>)}
      <rect className="scr-scan" x={cx - 38} y={y + 10} width="76" height="4" fill={color} opacity=".85" />
    </g>
    case 'ops': return <g>
      <line x1={cx} y1={y + 22} x2={cx - 26} y2={y + 48} stroke="#94a3b8" strokeWidth="2" /><line x1={cx} y1={y + 22} x2={cx + 26} y2={y + 48} stroke="#94a3b8" strokeWidth="2" /><line x1={cx} y1={y + 22} x2={cx} y2={y + 48} stroke="#94a3b8" strokeWidth="2" />
      {[[cx, y + 20], [cx - 26, y + 50], [cx, y + 50], [cx + 26, y + 50]].map(([a, b], i) => <circle key={i} className="scr-pulse" style={{ animationDelay: `${i * 0.3}s` }} cx={a} cy={b} r="7" fill={i ? '#64748b' : color} />)}
    </g>
    case 'coach': return <g>
      <path d={`M${cx - 10} ${y + 8} L${cx - 4} ${y + 26} M${cx + 10} ${y + 8} L${cx + 4} ${y + 26}`} stroke="#2563eb" strokeWidth="5" />
      <circle cx={cx} cy={y + 40} r="16" fill="#fbbf24" stroke="#fde68a" strokeWidth="3" className="scr-pulse" />
      <path d={`M${cx} ${y + 31} l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1z`} fill="#fff7d6" />
    </g>
    case 'guide': return <g>
      <rect className="scr-type" x={x + 12} y={y + 12} width="70" height="16" rx="8" fill="#0d9488" />
      <rect className="scr-type" style={{ animationDelay: '.7s' }} x={x + w - 82} y={y + 34} width="70" height="16" rx="8" fill="#334155" />
      <rect className="scr-type" style={{ animationDelay: '1.4s' }} x={x + 12} y={y + 56} width="50" height="10" rx="5" fill="#0d9488" />
    </g>
    default: return null
  }
}

function Desk({ side, i, agent, label, task, onOpen, away, reviewing, now }) {
  const L = side === 'L'
  const y = rowY(i)
  const dx = L ? 56 : 748
  const sx = L ? 84 : 778, sw = 138, sh = 76, sy = y - 6
  const lx = L ? 160 : 840
  const st = agent ? STATUS[agent.status] : '#334155'
  return (
    <g>
      <rect x={dx} y={y + 22} width="196" height="56" rx="6" fill="#1e293b" stroke="#334155" />
      <rect x={dx} y={y + 76} width="196" height="10" rx="3" fill="#0b1222" />
      <rect x={L ? dx + 150 : dx + 8} y={y + 52} width="38" height="12" rx="2" fill="#0f172a" stroke="#334155" />
      <rect x={sx + sw / 2 - 6} y={sy + sh} width="12" height="14" fill="#334155" />
      <g role="button" tabIndex={0} aria-label={`Open ${label}`} className="office-screen" onClick={onOpen} onKeyDown={(e) => { if (e.key === 'Enter') onOpen() }}>
        <rect x={sx - 4} y={sy - 4} width={sw + 8} height={sh + 8} rx="8" fill="#0b1020" stroke={st} strokeWidth="3" className={agent?.status === 'alert' ? 'scr-border-blink' : ''} style={{ filter: `drop-shadow(0 0 8px ${st}66)` }} />
        <rect x={sx} y={sy} width={sw} height={sh} rx="5" fill={agent ? TINT[agent.status] : '#020617'} />
        {agent && !away ? <ScreenArt id={agent.id} x={sx} y={sy} w={sw} h={sh} color={st} /> : agent ? <text x={sx + sw / 2} y={sy + sh / 2 + 5} textAnchor="middle" fontSize="13" fill="#64748b" fontWeight="700">Away · delivering</text> : <text x={sx + sw / 2} y={sy + sh / 2 + 5} textAnchor="middle" fontSize="13" fill="#475569" fontWeight="700">OFF</text>}
        {reviewing && <g><rect x={sx + sw - 30} y={sy + 6} width="22" height="26" rx="2" fill="#f8fafc" className="scr-pulse" /><line x1={sx + sw - 26} y1={sy + 14} x2={sx + sw - 12} y2={sy + 14} stroke="#64748b" strokeWidth="2" /></g>}
        <rect x={sx} y={sy} width={sw} height={sh} rx="5" fill="transparent" />
      </g>
      {agent && !away && <Person x={seat(side, i).x} y={seat(side, i).y} id={agent.id} sitting facing={L ? 1 : -1} now={now} />}
      {!agent && <rect x={seat(side, i).x - 17} y={seat(side, i).y - 8} width="34" height="34" rx="10" fill="#1f2937" stroke="#334155" strokeDasharray="4 3" />}
      <text x={lx} y={y + 104} textAnchor="middle" fontSize="16" fontWeight="800" fill={agent ? '#f8fafc' : '#64748b'}>{label}</text>
      <text x={lx} y={y + 120} textAnchor="middle" fontSize="12" fill={agent ? st : '#475569'}>{task}</text>
    </g>
  )
}

export default function AgentOffice({ agents, onOpen }) {
  const byId = Object.fromEntries(agents.map((a) => [a.id, a]))
  const [walkers, setWalkers] = useState([])
  const [now, setNow] = useState(() => performance.now())
  const prev = useRef(Object.fromEntries(agents.map((a) => [a.id, a.finding])))
  const cycle = useRef(0)
  const sig = agents.map((a) => a.finding).join('|')

  const send = (from, reason) => setWalkers((ws) => (ws.some((w) => w.from === from || w.to === from) || ws.length >= 3 ? ws : [...ws, { key: `${from}-${performance.now()}`, from, to: HANDOFF[from], start: performance.now(), reason }]))

  useEffect(() => {
    const changed = agents.filter((a) => prev.current[a.id] !== a.finding)
    changed.forEach((a) => { prev.current[a.id] = a.finding; send(a.id, 'update') })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])
  useEffect(() => {
    const first = setTimeout(() => send(ROUTINE[cycle.current++ % ROUTINE.length], 'routine'), 1500)
    const t = setInterval(() => send(ROUTINE[cycle.current++ % ROUTINE.length], 'routine'), 9000)
    return () => { clearTimeout(first); clearInterval(t) }
  }, [])
  useEffect(() => {
    if (!walkers.length) return
    let raf
    const tick = () => {
      const t = performance.now()
      setNow(t)
      setWalkers((ws) => { const keep = ws.filter((w) => t - w.start < DUR); return keep.length === ws.length ? ws : keep })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [walkers.length])

  const live = walkers.map((w) => ({ ...w, ...walk(w, now) }))
  const away = new Set(live.map((w) => w.from))
  const reviewing = Object.fromEntries(live.filter((w) => w.handed).map((w) => [w.to, w]))
  const name = (id) => byId[id]?.name || id
  const taskFor = (id) => {
    const w = live.find((x) => x.from === id)
    if (w) return w.handed ? `Walking back to desk` : `Delivering ${DOC[id]} → ${name(w.to)}`
    if (reviewing[id]) return `Reviewing ${DOC[reviewing[id].from]} from ${name(reviewing[id].from)}`
    return `${ACT[id]} · ${byId[id].metric}`
  }
  const desk = (side) => (id, i) => (id
    ? <Desk key={id} side={side} i={i} agent={byId[id]} label={`${byId[id].icon} ${byId[id].name}`} task={taskFor(id)} onOpen={() => onOpen(id)} away={away.has(id)} reviewing={!!reviewing[id]} now={now} />
    : <Desk key={`empty-${side}`} side={side} i={i} label={`Future Agent ${side === 'L' ? 9 : 10}`} task="Open desk · ready for expansion" onOpen={() => onOpen(side === 'L' ? 'empty9' : 'empty10')} now={now} />)

  return (
    <div className="glass overflow-hidden rounded-3xl border border-cyan/40 p-3 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2 px-1">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan">The capital office</div>
          <h3 className="text-aurora text-2xl font-black uppercase md:text-3xl">Your agents at work</h3>
        </div>
        <div className="text-xs text-slate-400">Tap any screen to open that agent's work. Rule-based agents, not live AI.</div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <svg viewBox={`0 0 1000 ${H}`} className="block w-full min-w-[720px]" role="img" aria-label="Isometric office with eight agent desks">
          <defs>
            <linearGradient id="officeFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#111a33" /><stop offset="100%" stopColor="#0a1124" /></linearGradient>
            <pattern id="tiles" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="skewX(-12)"><path d="M40 0H0V40" fill="none" stroke="rgba(148,163,184,.07)" /></pattern>
          </defs>
          <rect x="0" y="0" width="1000" height={H} rx="18" fill="url(#officeFloor)" />
          <rect x="0" y="0" width="1000" height={H} rx="18" fill="url(#tiles)" />
          <rect x="0" y="0" width="1000" height="22" fill="#0f172a" />
          <text x="500" y="16" textAnchor="middle" fontSize="11" fontWeight="800" letterSpacing="4" fill="#475569">FYV CAPITAL OFFICE</text>
          <rect x="0" y="0" width="34" height={H} fill="#0d1428" /><rect x="966" y="0" width="34" height={H} fill="#0d1428" />
          <rect x="400" y="30" width="200" height={H - 40} rx="14" fill="rgba(34,211,238,.035)" stroke="rgba(34,211,238,.12)" strokeDasharray="6 8" />
          <text x="500" y={H - 18} textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="3" fill="rgba(148,163,184,.5)">CENTER AISLE</text>
          {LEFT.map(desk('L'))}
          {RIGHT.map(desk('R'))}
          {live.map((w) => <Person key={w.key} x={w.pos.x} y={w.pos.y} id={w.from} walking={w.moving} facing={w.facing} carry={w.carrying} now={now} />)}
        </svg>
      </div>
      <div className="mt-2 min-h-[20px] px-1 text-[13px] text-slate-300">
        {live.length
          ? live.map((w) => <div key={w.key}><b style={{ color: SHIRT[w.from] }}>{name(w.from)}</b> {w.handed ? `handed the ${DOC[w.from]} to` : `is carrying the ${DOC[w.from]} to`} <b className="text-white">{name(w.to)}</b>{w.reason === 'update' ? ' (new finding)' : ' (routine update)'}</div>)
          : <span className="text-slate-500">Everyone is at their desk. Tap a screen to open it.</span>}
      </div>
    </div>
  )
}
