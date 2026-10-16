import { useEffect, useState } from 'react'
import { addDays, daysUntil, fmt, FULL_RUNWAY_DAYS, runwayClock, runwayDays, toDateInput } from '../game'
import { totals, ownership, monthlyBurn, liveScore, MIN_EVENTS } from '../engine'
import { LevelTrack } from './Medals'

const STEPS = [['setup', 'Setup'], ['fund', 'Fund & Survive'], ['boss', 'Final Boss'], ['results', 'Results']]

function RunwaySettings({ s, dispatch, onClose }) {
  const [today] = useState(() => new Date())
  const setDays = (v) => dispatch({ type: 'START_DAYS', value: Math.max(0, Math.min(3650, Math.round(v) || 0)) })
  return (
    <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-edge bg-panel p-3 text-left shadow-2xl shadow-black/60 lg:left-auto lg:right-0">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-black uppercase tracking-widest text-white">Set Your Cash Runway</div>
        <button onClick={onClose} className="text-slate-500 hover:text-white">×</button>
      </div>
      <div className="mt-3 text-[11px] text-slate-400">How long your current cash lasts without new funding</div>
      <div className="mt-1 grid grid-cols-4 gap-1">
        {[[27, '27d'], [90, '90d'], [180, '180d'], [365, '1 yr']].map(([d, label]) => (
          <button key={d} onClick={() => setDays(d)}
            className={`rounded-md py-1 text-[11px] font-bold ${s.startDays === d ? 'bg-neon text-ink' : 'border border-edge text-slate-300 hover:border-neon'}`}>{label}</button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="block text-[10px] text-slate-500">Days
          <input type="number" min={0} max={3650} value={s.startDays} onChange={(e) => setDays(Number(e.target.value))}
            className="mt-0.5 w-full rounded-lg border border-edge bg-ink px-2 py-1.5 font-mono text-sm text-white focus:border-neon focus:outline-none" />
        </label>
        <label className="block text-[10px] text-slate-500">or cash runs out on
          <input type="date" min={toDateInput(today)} value={toDateInput(addDays(today, s.startDays))}
            onChange={(e) => e.target.value && setDays(daysUntil(e.target.value, today))}
            className="mt-0.5 w-full rounded-lg border border-edge bg-ink px-1.5 py-1.5 font-mono text-xs text-white [color-scheme:dark] focus:border-neon focus:outline-none" />
        </label>
      </div>
      <label className="mt-3 block text-[11px] text-slate-400">
        Monthly burn {s.phase !== 'setup' && <span className="text-slate-600">(locked after launch)</span>}
        <div className="mt-1 flex items-center rounded-lg border border-edge bg-ink px-2 focus-within:border-neon">
          <span className="font-mono text-sm text-slate-500">$</span>
          <input type="number" min={500} step={500} value={s.startup.monthlyBurn} disabled={s.phase !== 'setup'}
            onChange={(e) => dispatch({ type: 'SETUP', patch: { monthlyBurn: Math.max(500, Number(e.target.value) || 500) } })}
            className="w-full bg-transparent px-1 py-1.5 font-mono text-sm text-white focus:outline-none disabled:text-slate-500" />
          <span className="text-[10px] text-slate-500">/mo</span>
        </div>
      </label>
      <p className="mt-2 text-[10px] leading-snug text-slate-500">
        Runway = your starting buffer + available funding ÷ daily burn (incl. squad). 27 days is the JPMorgan Chase Institute median small-business cash buffer.
      </p>
    </div>
  )
}

function Clock({ days, className }) {
  const c = runwayClock(days)
  const unit = (n, l) => (
    <span className="inline-flex items-baseline">
      <span className="tabular-nums">{n}</span><span className="ml-px text-[0.55em] font-bold opacity-80">{l}</span>
    </span>
  )
  return (
    <div className={`flex items-baseline justify-center gap-1 font-mono font-black leading-tight ${className}`}>
      {c.years > 0 && unit(c.years, 'Y')}
      {(c.years > 0 || c.months > 0) && unit(c.months, 'M')}
      {unit(c.days, 'D')}
    </div>
  )
}

export default function TopBar({ s, dispatch, muted, toggleMute }) {
  const [showRunway, setShowRunway] = useState(false)
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const onScroll = () => setCompact((c) => (c ? window.scrollY > 40 : window.scrollY > 160))
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const t = totals(s)
  const target = s.startup.target
  const pct = (t.available / target) * 100
  const pctOf = (v) => `${Math.min(100, (v / target) * 100)}%`
  const funded = pct >= 100
  const burn = monthlyBurn(s)
  const runway = runwayDays(t.cash, s.startDays, burn)
  const own = ownership(s)
  const secured = runway >= FULL_RUNWAY_DAYS
  const mobileHide = compact ? 'hidden' : ''
  const stepIdx = STEPS.findIndex(([id]) => id === s.phase)
  const runwayClass = secured ? 'text-neon drop-shadow-[0_0_10px_#39ff88]' : runway < 90 ? 'flash-red' : runway < 200 ? 'text-gold' : 'text-cyan'
  const barColor = funded ? 'from-neon to-emerald-300' : pct < 33 ? 'from-hot to-orange-400' : pct < 66 ? 'from-gold to-amber-300' : 'from-cyan to-neon'

  let cta = null
  if (s.phase === 'fund') {
    const needEvents = Math.max(0, MIN_EVENTS - s.resolvedEvents.length)
    const pendingCovers = !funded && t.committed >= target
    cta = pendingCovers ? (
      <button onClick={() => dispatch({ type: 'DRAW_EVENT' })} disabled={!!s.activeEvent || s.deck.length === 0}
        className="mt-2 w-full rounded-xl bg-gold px-3 py-2 text-[11px] font-black uppercase tracking-wider text-ink transition hover:brightness-110 md:mt-3 md:py-2.5 md:text-sm">
        Target committed: advance a month so pending funds land ({fmt(t.committed - t.available)} pending)
      </button>
    ) : (
      <button onClick={() => dispatch({ type: 'START_BOSS' })} disabled={!funded || !!s.activeEvent}
        className={`mt-2 w-full rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-wider transition md:mt-3 md:py-2.5 md:text-sm ${funded ? 'glow-pulse bg-hot text-white hover:brightness-110' : 'cursor-not-allowed border border-dashed border-edge bg-ink text-slate-500'}`}>
        {funded
          ? needEvents ? `Target reached: survive ${needEvents} more event${needEvents > 1 ? 's' : ''}, then face the Final Boss` : 'Target reached: face the Final Boss (18-month forecast)'
          : `Locked: ${fmt(Math.max(0, target - t.available))} more available capital to unlock the Final Boss`}
      </button>
    )
  }

  return (
    <div className="sticky top-0 z-40 border-b border-edge bg-ink/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-3 py-2 md:px-4 md:py-3">
        <div className={`flex items-center justify-between gap-3 ${mobileHide}`}>
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <img src="/favicon.png" alt="" className="h-9 w-9 shrink-0 object-contain md:h-11 md:w-11" />
            <div className="min-w-0">
              <div className="text-xs font-black uppercase leading-tight tracking-tight text-white sm:text-base md:text-xl">
                <span className="text-neon">FUND YOUR VISION</span> <span className="text-slate-400">(FYV)</span>
              </div>
              <p className="truncate text-[10px] text-slate-400 md:text-[11px]">
                Powered by <span className="font-semibold text-cyan">NationwideBusinessFunding.com</span><span className="max-sm:hidden"> · Fractional Chief Capital Officer Platform</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${s.mode === 'tournament' ? 'bg-gold text-ink' : 'border border-edge text-slate-400'}`}>{s.mode === 'tournament' ? 'Tournament' : 'Arcade'}</span>
            {s.phase !== 'setup' && <span className="hidden rounded-lg border border-cyan/50 px-2 py-1 font-mono text-[11px] text-cyan sm:inline">Fundability {liveScore(s)}</span>}
            <button onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'} className="rounded-lg border border-edge px-2 py-1 text-[11px] text-slate-400 hover:text-white">{muted ? 'SFX OFF' : 'SFX ON'}</button>
            {s.phase !== 'setup' && <button onClick={() => dispatch({ type: 'RESTART' })} className="rounded-lg border border-edge px-2 py-1 text-[11px] text-slate-400 hover:border-gold hover:text-gold">Restart</button>}
          </div>
        </div>

        <div className={`mt-2 flex gap-1 ${mobileHide}`}>
          {STEPS.map(([id, label], i) => (
            <div key={id} className={`flex-1 rounded-md px-1 py-0.5 text-center text-[9px] font-black uppercase tracking-wider md:text-[10px] ${i === stepIdx ? 'bg-neon text-ink' : i < stepIdx ? 'bg-neon/20 text-neon' : 'bg-edge/60 text-slate-500'}`}>{i + 1}. {label}</div>
          ))}
        </div>

        <div className={`mt-1 ${mobileHide}`}><LevelTrack level={s.level} /></div>

        <div className="mt-2 grid gap-2 md:gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <div className={`flex items-end justify-between gap-2 ${mobileHide}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 md:text-xs">{s.startup.name || 'Your startup'} · Funding target</span>
              <span className="font-mono text-base font-black text-neon md:text-lg">{fmt(target)}</span>
            </div>
            <div className="relative mt-1 h-10 overflow-hidden rounded-xl border border-edge bg-ink md:h-9">
              <div className="absolute inset-y-0 left-0 border-r-2 border-dashed border-slate-500/70 bg-slate-500/10 transition-[width] duration-700" style={{ width: pctOf(t.requested) }} />
              <div className="absolute inset-y-0 left-0 bg-gold/30 bar-stripes transition-[width] duration-700" style={{ width: pctOf(t.committed) }} />
              <div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${barColor} bar-stripes transition-[width] duration-1000 ease-out ${funded ? 'glow-pulse' : ''}`} style={{ width: pctOf(t.available) }} />
              <div className="absolute inset-0 flex items-center justify-center px-2 text-center font-mono text-[10px] font-bold leading-tight text-white drop-shadow-[0_1px_2px_#000] sm:text-sm">
                Available: {fmt(t.available)} / Target: {fmt(target)} ({pct.toFixed(1)}% Funded)
              </div>
            </div>
            <div className={`mt-1 flex flex-wrap justify-end gap-x-3 font-mono text-[10px] ${mobileHide}`}>
              <span className="text-slate-400">▭ Requested {fmt(t.requested)}</span>
              <span className="text-gold">▨ Committed {fmt(t.committed)}</span>
              <span className="text-neon">█ Available {fmt(t.available)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 lg:w-[460px]">
            <div className="relative">
              <button onClick={() => setShowRunway((v) => !v)} title="Set your runway"
                className="h-full w-full rounded-xl border border-edge bg-panel p-1.5 text-center hover:border-neon/60 md:p-2">
                <div className="flex items-center justify-center gap-1 text-[9px] font-bold uppercase leading-tight tracking-wider text-slate-400 md:text-[10px]">Cash Buffer Runway <span className="text-neon">⚙</span></div>
                <Clock days={runway} className={`text-base md:text-xl ${runwayClass}`} />
                <div className="text-[9px] leading-tight text-slate-500 md:text-[10px]">
                  {secured && <span className="text-neon">1 YR+ SECURED · </span>}Out of cash {runwayClock(runway).date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </button>
              {showRunway && <RunwaySettings s={s} dispatch={dispatch} onClose={() => setShowRunway(false)} />}
            </div>
            <div className="rounded-xl border border-edge bg-panel p-1.5 text-center md:p-2" title="Your choice, set in Setup. Paying yourself from loan proceeds must fit each lender's permitted uses, and borrowing to pay yourself does not create profit.">
              <div className="text-[9px] font-bold uppercase leading-tight tracking-wider text-slate-400 md:text-[10px]">Founder Pay</div>
              <div className="font-mono text-base font-black text-gold md:text-xl">{fmt(s.startup.founderPay || 0)}<span className="text-[10px]">/mo</span></div>
              <div className="text-[9px] text-slate-500 md:text-[10px]">Discretionary · in burn</div>
            </div>
            <div className="rounded-xl border border-edge bg-panel p-1.5 text-center md:p-2">
              <div className="text-[9px] font-bold uppercase leading-tight tracking-wider text-slate-400 md:text-[10px]">Equity Kept</div>
              <div className={`font-mono text-base font-black md:text-xl ${own.founder >= 0.9 ? 'text-neon' : own.founder >= 0.51 ? 'text-gold' : 'text-hot'}`}>{(own.founder * 100).toFixed(own.founder === 1 ? 0 : 1)}%</div>
              <div className="text-[9px] text-slate-500 md:text-[10px]">{own.seats} Board Seat{own.seats === 1 ? '' : 's'} Given</div>
            </div>
          </div>
        </div>
        {cta}
      </div>
    </div>
  )
}
