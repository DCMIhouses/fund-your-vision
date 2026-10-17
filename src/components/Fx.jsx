import { useEffect, useRef, useState } from 'react'
import { fmt, runwayDays } from '../game'
import { MIN_EVENTS, monthlyBurn, totals } from '../engine'
import { EVENT_ICON, SKINS, activeRank, dailyConfig, dailyName, medalCount, rankGem } from '../meta'
import Gem from './Gem'
import { play } from '../sfx'

const STARS = Array.from({ length: 46 }, (_, i) => ({
  left: `${(i * 37.7) % 100}%`, top: `${(i * 61.3) % 100}%`, size: 1 + (i % 3), dur: `${2 + (i % 5)}s`, delay: `${(i % 7) * 0.4}s`,
}))
const ORBS = Array.from({ length: 10 }, (_, i) => ({
  left: `${(i * 23 + 7) % 100}%`, size: 4 + (i % 4) * 2, dur: `${14 + (i % 5) * 4}s`, delay: `${-i * 3}s`,
  color: ['#39ff88', '#22d3ee', '#fbbf24', '#a855f7'][i % 4],
}))

export function Starfield() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {STARS.map((x, i) => <span key={i} className="star" style={{ left: x.left, top: x.top, width: x.size, height: x.size, animationDuration: x.dur, animationDelay: x.delay }} />)}
      {ORBS.map((x, i) => <span key={`o${i}`} className="orb" style={{ left: x.left, width: x.size, height: x.size, background: x.color, boxShadow: `0 0 12px ${x.color}`, opacity: 0.45, animationDuration: x.dur, animationDelay: x.delay }} />)}
    </div>
  )
}

export function CountUp({ value, format = fmt, className = '' }) {
  const [v, setV] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    let raf
    const step = (t) => {
      const p = Math.min(1, (t - start) / 900)
      const cur = a + (value - a) * (1 - (1 - p) ** 3)
      setV(cur)
      from.current = cur
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span className={className}>{format(v)}</span>
}

export function CoinBurst({ burst }) {
  if (!burst) return null
  return (
    <div key={burst.id} aria-hidden>
      {Array.from({ length: 14 }, (_, i) => (
        <span key={i} className="coin" style={{ left: `calc(50% + ${(i - 7) * 18}px)`, top: '70vh', '--dx': `${(i - 7) * 14}px`, '--dy': `-${55 + (i % 4) * 6}vh`, animationDelay: `${i * 0.04}s` }}>$</span>
      ))}
      <div className="float-up pointer-events-none fixed left-1/2 top-[55vh] z-[81] rounded-2xl border-2 border-gold bg-ink/90 px-5 py-2 font-mono text-2xl font-black text-gold shadow-[0_0_40px_rgba(251,191,36,.6)]">+{fmt(burst.amount)}</div>
    </div>
  )
}

function mascotLine(s, last) {
  if (s.phase === 'setup') return 'Hi! Set your goal, then launch me!'
  if (s.phase === 'boss') return 'Boss time! Pick smart moves to knock out the Cash Crunch!'
  if (s.phase === 'results') return s.result?.outcome === 'victory' ? 'WE DID IT! You are a real Capital Architect!' : 'Good try! Play again and beat your score.'
  if (s.activeEvent) return 'Uh oh, a surprise! Read each choice carefully.'
  const t = totals(s)
  const runway = runwayDays(t.cash, s.startDays, monthlyBurn(s))
  if (t.available >= s.startup.target) return s.resolvedEvents.length >= MIN_EVENTS ? 'Target hit! Hit the red button to face the boss!' : 'Target hit! Survive a few more events first.'
  if (last?.tone === 'hot') return 'Ouch, that was a no. Try a different option.'
  if (last?.tone === 'neon') return 'Cha-ching! Money is coming in!'
  if (runway < 60) return 'Yikes! Cash is running low. Find funding fast!'
  if (!s.underwritten) return 'Tip: run Underwriting before you apply for cards.'
  return 'Keep going! Mix different kinds of money.'
}

export function Mascot({ s, meta, collection }) {
  const [hidden, setHidden] = useState(false)
  const last = s.log[0]
  const line = mascotLine(s, last)
  const panic = s.phase === 'fund' && runwayDays(totals(s).cash, s.startDays, monthlyBurn(s)) < 60
  const avatar = activeRank(meta, medalCount(collection))
  const skin = rankGem(meta, medalCount(collection))
  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-[55] flex items-end gap-2">
      <button onClick={() => setHidden((h) => !h)} title={`Level ${avatar.level}: ${avatar.name}`}
        className={`pointer-events-auto grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br ${skin.grad} sm:h-14 sm:w-14 p-[3px] shadow-[0_0_24px_rgba(168,85,247,.5)] ${panic ? 'panic' : 'bob'}`}>
        <span className="grid h-full w-full place-items-center rounded-full bg-ink text-2xl">{avatar.icon}</span>
      </button>
      {!hidden && (
        <div key={line} className="bubble-life mb-6 max-w-[220px] rounded-2xl rounded-bl-none border border-purple-400/60 bg-panel/95 px-3 py-2 text-xs font-bold leading-snug text-white shadow-lg max-sm:max-w-[170px]">{line}</div>
      )}
    </div>
  )
}

export function QuestMap({ tabs, tab, setTab, s, skin }) {
  const t = totals(s)
  const has = (type) => s.funding.some((f) => f.type === type && f.status !== 'declined')
  const done = {
    team: s.squad.length > 0, underwrite: s.underwritten, fund: s.funding.length > 0, stack: has('credit'), partners: has('partner'), trophies: s.achievements.length > 1, reports: false,
  }
  const icons = { team: '👥', underwrite: '🔍', fund: '🃏', stack: '💳', partners: '🤝', trophies: '🏅', reports: '📊' }
  const stops = [...tabs.map(([id, label, hint]) => ({ id, label, hint, icon: icons[id], ok: done[id], click: true })),
    { id: 'events', label: 'Events', hint: `${Math.min(s.resolvedEvents.length, MIN_EVENTS)}/${MIN_EVENTS} survived`, icon: '🎲', ok: s.resolvedEvents.length >= MIN_EVENTS },
    { id: 'boss', label: 'Boss', hint: t.available >= s.startup.target ? 'Unlocked!' : 'Locked', icon: '👾', ok: false, boss: true }]
  const active = stops.findIndex((x) => x.id === tab)
  const gem = SKINS.find((k) => k.id === skin) || SKINS[0]
  const grad = gem.grad
  return (
    <nav aria-label="Quest map" className="-mx-4 mb-6 overflow-x-auto px-4 pb-2 lg:mx-0 lg:px-0">
      <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Your quest map · tap a stop</div>
      <div className="relative mt-2 flex min-w-[720px] justify-between gap-1 pt-7">
        <div className="absolute left-8 right-8 top-[3.75rem] h-1.5 rounded-full bg-edge" />
        <div className={`absolute left-8 top-[3.75rem] h-1.5 rounded-full bg-gradient-to-r ${grad} shadow-[0_0_12px_rgba(57,255,136,.6)] transition-all duration-700`}
          style={{ width: `calc((100% - 4rem) * ${active / (stops.length - 1)})` }} />
        {stops.map((x, i) => {
          const cur = i === active
          return (
            <button key={x.id} disabled={!x.click} onClick={() => { if (x.click) { play('whoosh'); setTab(x.id) } }}
              className="relative flex w-20 flex-col items-center text-center disabled:cursor-default">
              {cur && <span className="bob absolute -top-8"><Gem gem={gem} className="h-7 w-7" /></span>}
              <span className={`relative grid h-14 w-14 place-items-center rounded-full border-2 text-2xl transition ${cur ? 'scale-110 border-neon bg-neon/20 shadow-[0_0_24px_rgba(57,255,136,.7)]' : x.ok ? 'border-neon/70 bg-ink' : x.boss ? 'border-hot/70 bg-hot/10' : 'border-edge bg-ink'} ${x.click && !cur ? 'hover:border-neon/70' : ''}`}>
                {x.icon}
                {x.ok && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-neon text-[11px] font-black text-ink">✓</span>}
              </span>
              <span className={`mt-1 text-xs font-black ${cur ? 'text-white' : 'text-slate-400'}`}>{x.label}</span>
              <span className="text-[10px] leading-tight text-slate-500">{x.hint}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export function BossBar({ hp, defeated }) {
  const [shake, setShake] = useState(0)
  const prev = useRef(hp)
  useEffect(() => {
    if (hp < prev.current) { setShake((n) => n + 1); play(hp === 0 ? 'boom' : 'hit') }
    prev.current = hp
  }, [hp])
  return (
    <div className="mt-5 flex items-center gap-4 rounded-2xl border border-hot/50 bg-ink/70 p-4">
      <div className="relative grid h-20 w-20 shrink-0 place-items-center">
        {defeated && <span key={`b${shake}`} className="boom absolute inset-0 rounded-full bg-gradient-to-br from-gold to-hot" />}
        <span key={shake} className={`text-6xl ${shake ? 'shake' : ''} ${defeated ? 'opacity-30 grayscale' : 'bob'}`}>👾</span>
        {defeated && <span className="absolute text-4xl">💥</span>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
          <span className="text-hot">Cash Crunch health</span>
          <span className={defeated ? 'text-neon' : 'text-hot'}>{defeated ? 'DEFEATED!' : `${hp} HP`}</span>
        </div>
        <div className="relative mt-1 h-6 overflow-hidden rounded-full border border-hot/50 bg-ink">
          <div className={`shimmer absolute inset-y-0 left-0 overflow-hidden rounded-full bg-gradient-to-r from-hot via-orange-500 to-gold transition-[width] duration-700`} style={{ width: `${hp}%` }} />
        </div>
        <div className="mt-1 text-xs text-slate-400">Each smart move that fixes a red check hits the boss. Get it to 0 to win big.</div>
      </div>
    </div>
  )
}

export function SpinReveal({ id }) {
  const ids = Object.keys(EVENT_ICON)
  const idx = Math.max(0, ids.indexOf(id))
  const slice = 360 / ids.length
  const turn = 1440 + (360 - idx * slice - slice / 2)
  return (
    <div className="flex flex-col items-center py-4">
      <div className="text-xs font-black uppercase tracking-[0.3em] text-gold">Spinning the event wheel…</div>
      <div className="relative mt-4 h-56 w-56">
        <div className="absolute left-1/2 top-[-10px] z-10 h-0 w-0 -translate-x-1/2 border-x-[12px] border-t-[20px] border-x-transparent border-t-gold drop-shadow" />
        <div className="wheel-spin relative h-full w-full rounded-full border-4 border-gold shadow-[0_0_40px_rgba(251,191,36,.5)]"
          style={{ '--turn': `${turn}deg`, background: `conic-gradient(${ids.map((_, i) => `${i % 2 ? '#1c2540' : '#0b1020'} ${i * slice}deg ${(i + 1) * slice}deg`).join(',')})` }}>
          {ids.map((e, i) => (
            <span key={e} className="absolute left-1/2 top-1/2 text-xl" style={{ transform: `translate(-50%,-50%) rotate(${i * slice + slice / 2}deg) translateY(-88px) rotate(-${i * slice + slice / 2}deg)` }}>{EVENT_ICON[e]}</span>
          ))}
          <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gold font-black text-ink">FYV</span>
        </div>
      </div>
    </div>
  )
}

export function Hangar({ meta, s, dispatch, today, collection }) {
  const count = medalCount(collection)
  const cur = activeRank(meta, count)
  const gem = rankGem(meta, count)
  const daily = s.startup.name === dailyName(today)
  const startDaily = () => {
    const c = dailyConfig(today)
    play('spin')
    dispatch({ type: 'SET_MODE', mode: 'arcade' })
    dispatch({ type: 'SETUP', patch: c.startup })
    dispatch({ type: 'PROFILE', patch: c.profile })
    document.getElementById('setup-panel')?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <section className="mb-8 rounded-3xl border-2 border-purple-500/60 bg-panel p-5 shadow-[0_0_50px_rgba(168,85,247,.2)] sm:p-8">
      <div className="text-center">
        <div className="text-xs font-black uppercase tracking-[0.35em] text-fuchsia-300">Your founder hangar</div>
        <h2 className="mt-1 text-3xl font-black uppercase text-white md:text-5xl">Points, Streak &amp; Daily Challenge</h2>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gold/50 bg-gold/5 p-4 text-center">
          <div className="text-xs font-black uppercase tracking-widest text-gold">Capital Points</div>
          <div className="mt-1 font-mono text-4xl font-black text-gold"><CountUp value={meta.points} format={(v) => Math.round(v).toLocaleString()} /></div>
          <div className="text-xs text-slate-400">Earn points from medals and finished games. Game points only, not real money.</div>
        </div>
        <div className="rounded-2xl border border-hot/50 bg-hot/5 p-4 text-center">
          <div className="text-xs font-black uppercase tracking-widest text-hot">Daily streak</div>
          <div className="mt-1 font-mono text-4xl font-black text-white">🔥 {meta.streak}</div>
          <div className="text-xs text-slate-400">Play every day to grow your streak. Best: {meta.bestStreak} day{meta.bestStreak === 1 ? '' : 's'}. Each streak day adds +10 bonus points.</div>
        </div>
        <div className="rounded-2xl border border-neon/50 bg-neon/5 p-4 text-center">
          <div className="text-xs font-black uppercase tracking-widest text-neon">Daily challenge</div>
          <div className="mt-1 text-sm font-black text-white">{meta.dailyDone === today ? '✓ Done today! Come back tomorrow.' : 'A new mystery startup every day'}</div>
          <button onClick={startDaily} disabled={daily}
            className="mt-2 min-h-[44px] w-full rounded-xl bg-neon px-3 text-sm font-black uppercase text-ink hover:brightness-110 disabled:opacity-50">{daily ? 'Loaded below ↓' : "Load today's challenge"}</button>
          <div className="mt-1 text-xs text-slate-400">Finish it for +100 bonus points.</div>
        </div>
      </div>
      <a href="#medal-board" className="mt-6 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-edge bg-ink/50 p-4 text-center hover:border-gold/60">
        <Gem gem={gem} className="h-10 w-10" />
        <span className="text-sm font-black text-white">Wearing: Level {cur.level} {cur.name} · {gem.gem} medal</span>
        <span className="text-xs font-bold text-gold">Founder Levels are on the Medal Board ↓</span>
      </a>
    </section>
  )
}
