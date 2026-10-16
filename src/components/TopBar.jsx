import { useEffect, useState } from 'react'
import { addDays, daysUntil, fmt, FULL_RUNWAY_DAYS, runwayClock, runwayDays, toDateInput } from '../game'
import { totals, ownership, monthlyBurn, liveScore, MIN_EVENTS } from '../engine'
import { LevelTrack } from './Medals'
import RunwayInput from './RunwayInput'
import { CountUp } from './Fx'

const STEPS = [['setup', 'Setup'], ['fund', 'Fund & Survive'], ['boss', 'Final Boss'], ['results', 'Results']]

function RunwaySettings({ s, dispatch, onClose }) {
  const [today] = useState(() => new Date())
  const setDays = (v) => dispatch({ type: 'START_DAYS', value: Math.max(0, Math.min(3650, Math.round(v) || 0)) })
  return (
    <div className="absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border border-edge bg-panel p-3 text-left shadow-2xl shadow-black/60 lg:left-auto lg:right-0">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-black uppercase tracking-widest text-white">Set Your Cash Runway</div>
        <button onClick={onClose} className="text-slate-500 hover:text-white">×</button>
      </div>
      <div className="mt-3 text-[11px] text-slate-400">How long your current cash lasts without new funding</div>
      <div className="mt-2"><RunwayInput days={s.startDays} onChange={setDays} /></div>
      <label className="mt-2 block text-[10px] text-slate-500">or pick the day your cash runs out
        <input type="date" min={toDateInput(today)} value={toDateInput(addDays(today, s.startDays))}
          onChange={(e) => e.target.value && setDays(daysUntil(e.target.value, today))}
          className="mt-0.5 w-full rounded-lg border border-edge bg-ink px-2 py-1.5 font-mono text-xs text-white [color-scheme:dark] focus:border-neon focus:outline-none" />
      </label>
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

const fmtDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

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

export default function TopBar({ s, dispatch, muted, toggleMute, meta }) {
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
            {meta && <span title="Capital Points (game points)" className="rounded-lg border border-gold/50 px-2 py-1 font-mono text-[11px] font-black text-gold">★ <CountUp value={meta.points} format={(v) => Math.round(v).toLocaleString()} /></span>}
            {meta?.streak > 0 && <span title="Daily streak" className="hidden rounded-lg border border-hot/50 px-2 py-1 font-mono text-[11px] font-black text-hot sm:inline">🔥 {meta.streak}</span>}
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

        <div className="mt-2 grid gap-2 md:gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
          <div className="min-w-0 rounded-xl border border-edge bg-panel/60 px-3 py-2 md:px-4">
            {[
              ['Raised', t.committed, 'text-sky-300', 'Promised + ready money'],
              ['Available', t.available, 'text-neon drop-shadow-[0_0_14px_rgba(57,255,136,.35)]', 'Ready to use now'],
              ['Target', target, 'text-gold', s.startup.name || 'Your startup'],
            ].map(([label, value, color, hint]) => (
              <div key={label} className="flex items-center justify-between gap-3 border-b border-edge/60 py-1 last:border-0 md:py-1.5">
                <div className="min-w-0">
                  <div className={`text-xs font-black uppercase tracking-widest md:text-sm ${color}`}>{label}</div>
                  <div className={`truncate text-[10px] text-slate-500 md:text-xs ${mobileHide}`}>{hint}</div>
                </div>
                <div className={`font-mono font-black leading-none ${color} ${compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-4xl'}`}><CountUp value={value} /></div>
              </div>
            ))}
            <div className="relative mt-2 h-9 overflow-hidden rounded-xl border border-edge bg-ink">
              <div className="absolute inset-y-0 left-0 border-r-2 border-dashed border-slate-500/70 bg-slate-500/10 transition-[width] duration-700" style={{ width: pctOf(t.requested) }} />
              <div className="absolute inset-y-0 left-0 bg-gold/30 bar-stripes transition-[width] duration-700" style={{ width: pctOf(t.committed) }} />
              <div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${barColor} bar-stripes liquid overflow-visible transition-[width] duration-1000 ease-out ${funded ? 'glow-pulse' : ''}`} style={{ width: pctOf(t.available) }} />
              <div className="absolute inset-0 flex items-center justify-center px-2 text-center font-mono text-[11px] font-bold leading-tight text-white drop-shadow-[0_1px_2px_#000] sm:text-sm">
                <span>{pct.toFixed(1)}% funded · {fmt(Math.max(0, target - t.available))} to go</span>
              </div>
            </div>
            <div className={`mt-1 flex flex-wrap justify-end gap-x-3 font-mono text-[10px] ${mobileHide}`}>
              <span className="text-slate-400">▭ Requested {fmt(t.requested)}</span>
              <span className="text-gold">▨ Committed {fmt(t.committed)}</span>
              <span className="text-neon">█ Available {fmt(t.available)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="relative">
              <button onClick={() => setShowRunway((v) => !v)} title="Set your runway"
                className="w-full rounded-xl border-2 border-cyan/40 bg-panel px-3 py-2 text-center hover:border-neon/60">
                <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-widest text-cyan md:text-xs">Cash Runway · time left <span className="text-neon">⚙</span></div>
                <div className={`font-mono font-black leading-tight ${compact ? 'text-2xl' : 'text-3xl md:text-4xl'} ${runwayClass}`}>{runway.toLocaleString()} <span className="text-[0.5em]">DAYS</span></div>
                <Clock days={runway} className="text-sm text-slate-200" />
                <div className="mt-1 grid grid-cols-2 gap-2 text-[10px] md:text-xs">
                  <div className="rounded-lg bg-ink/70 px-2 py-1"><div className="uppercase text-slate-500">Today</div><div className="font-bold text-white">{fmtDate(runwayClock(0).date)}</div></div>
                  <div className="rounded-lg bg-ink/70 px-2 py-1"><div className="uppercase text-slate-500">Cash runs out</div><div className={`font-bold ${secured ? 'text-neon' : runway < 90 ? 'text-hot' : 'text-white'}`}>{fmtDate(runwayClock(runway).date)}</div></div>
                </div>
                {!compact && (runway > s.startDays || secured) && (
                  <div className="mt-1 text-[10px] leading-tight text-slate-400 md:text-[11px]">
                    {secured && <span className="font-bold text-neon">1 YR+ SECURED · </span>}{runway > s.startDays ? `${s.startDays}d buffer + ${(runway - s.startDays).toLocaleString()}d from funding` : ''}
                  </div>
                )}
              </button>
              {showRunway && <RunwaySettings s={s} dispatch={dispatch} onClose={() => setShowRunway(false)} />}
            </div>
            <div className={`grid grid-cols-2 gap-2 ${compact ? 'max-md:hidden' : ''}`}>
              <div className="rounded-xl border border-edge bg-panel p-1.5 text-center md:p-2" title="Your choice, set in Setup. Paying yourself from loan proceeds must fit each lender's permitted uses, and borrowing to pay yourself does not create profit.">
                <div className="text-[9px] font-bold uppercase leading-tight tracking-wider text-slate-400 md:text-[10px]">Founder Pay</div>
                <div className="font-mono text-base font-black text-gold md:text-lg">{fmt(s.startup.founderPay || 0)}<span className="text-[10px]">/mo</span></div>
                <div className="text-[9px] text-slate-500 md:text-[10px]">Discretionary · in burn</div>
              </div>
              <div className="rounded-xl border border-edge bg-panel p-1.5 text-center md:p-2">
                <div className="text-[9px] font-bold uppercase leading-tight tracking-wider text-slate-400 md:text-[10px]">Equity Kept</div>
                <div className={`font-mono text-base font-black md:text-lg ${own.founder >= 0.9 ? 'text-neon' : own.founder >= 0.51 ? 'text-gold' : 'text-hot'}`}>{(own.founder * 100).toFixed(own.founder === 1 ? 0 : 1)}%</div>
                <div className="text-[9px] text-slate-500 md:text-[10px]">{own.seats} Board Seat{own.seats === 1 ? '' : 's'} Given</div>
              </div>
            </div>
          </div>
        </div>
        {cta}
      </div>
    </div>
  )
}
