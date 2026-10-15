import { useEffect, useState } from 'react'
import { fmt, FULL_RUNWAY_DAYS, SALARY_VAULT_PCT, levelFor } from '../game'

function RunwaySettings({ settings, monthlyBurn, setRunway, onClose }) {
  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-edge bg-panel p-3 text-left shadow-2xl shadow-black/60">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-black uppercase tracking-widest text-white">Set Your Runway</div>
        <button onClick={onClose} className="text-slate-500 hover:text-white">×</button>
      </div>
      <label className="mt-3 block text-[11px] text-slate-400">
        Starting cash buffer (days)
        <input type="number" min={0} max={3650} value={settings.startDays}
          onChange={(e) => setRunway({ startDays: Math.max(0, Math.min(3650, Number(e.target.value) || 0)) })}
          className="mt-1 w-full rounded-lg border border-edge bg-ink px-2 py-1.5 font-mono text-sm text-white focus:border-neon focus:outline-none" />
      </label>
      <div className="mt-3 text-[11px] text-slate-400">Monthly burn rate</div>
      <div className="mt-1 grid grid-cols-2 gap-1 rounded-lg bg-ink p-1">
        {[['auto', 'Auto'], ['custom', 'Custom']].map(([m, label]) => (
          <button key={m} onClick={() => setRunway(m === 'custom' && settings.mode === 'auto' ? { mode: m, monthlyBurn: Math.round(monthlyBurn / 100) * 100 } : { mode: m })}
            className={`rounded-md py-1 text-[11px] font-bold ${settings.mode === m ? 'bg-neon text-ink' : 'text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>
      {settings.mode === 'custom' ? (
        <label className="mt-2 block">
          <div className="flex items-center rounded-lg border border-edge bg-ink px-2 focus-within:border-neon">
            <span className="font-mono text-sm text-slate-500">$</span>
            <input type="number" min={100} step={500} value={settings.monthlyBurn}
              onChange={(e) => setRunway({ monthlyBurn: Math.max(100, Number(e.target.value) || 100) })}
              className="w-full bg-transparent px-1 py-1.5 font-mono text-sm text-white focus:outline-none" />
            <span className="text-[10px] text-slate-500">/mo</span>
          </div>
        </label>
      ) : (
        <div className="mt-2 rounded-lg border border-edge bg-ink/60 px-2 py-1.5 font-mono text-xs text-slate-300">
          {fmt(monthlyBurn)}/mo <span className="text-slate-500">(100% funded = 365 days)</span>
        </div>
      )}
      <p className="mt-2 text-[10px] leading-snug text-slate-500">
        Runway = starting days + unlocked capital ÷ daily burn.
      </p>
    </div>
  )
}

export default function TopBar({ target, setTarget, unlocked, spend, xp, runway, runwaySettings, monthlyBurn, setRunway, onVictory, onReset }) {
  const [showRunway, setShowRunway] = useState(false)
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const onScroll = () => setCompact((c) => (c ? window.scrollY > 40 : window.scrollY > 160))
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const net = Math.max(0, unlocked - spend)
  const pct = target > 0 ? (net / target) * 100 : 0
  const shown = Math.min(100, pct)
  const funded = pct >= 100
  const salary = net * SALARY_VAULT_PCT
  const lvl = levelFor(xp)
  const secured = runway >= FULL_RUNWAY_DAYS
  const mobileHide = compact ? 'max-md:hidden' : ''

  const runwayClass =
    secured ? 'text-neon drop-shadow-[0_0_10px_#39ff88]'
      : runway < 90 ? 'flash-red'
        : runway < 200 ? 'text-gold' : 'text-cyan'

  const barColor = funded
    ? 'from-neon to-emerald-300'
    : pct < 33 ? 'from-hot to-orange-400' : pct < 66 ? 'from-gold to-amber-300' : 'from-cyan to-neon'

  return (
    <div className="sticky top-0 z-40 border-b border-edge bg-ink/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-3 py-2 md:px-4 md:py-3">
        <div className={`flex items-center justify-between gap-3 ${mobileHide}`}>
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-neon font-mono text-sm font-black text-ink md:h-10 md:w-10 md:rounded-xl md:text-lg">0%</span>
            <div className="min-w-0">
              <h1 className="text-xs font-black uppercase leading-tight tracking-tight text-white sm:text-base md:text-xl">
                <span className="text-hot">SCREW VCs:</span> The 0% Capital Architect &amp; Target Raise Game
              </h1>
              <p className="truncate text-[10px] text-slate-400 md:text-[11px]">
                Powered by <span className="font-semibold text-cyan">NationwideBusinessFunding.com</span><span className="max-sm:hidden"> · Fractional Chief Capital Officer Platform</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right md:block">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">Lvl {lvl.idx + 1} · {xp} XP</div>
              <div className="text-xs font-bold text-gold">{lvl.name}</div>
              <div className="mt-1 h-1 w-40 overflow-hidden rounded bg-edge">
                <div className="h-full bg-gold transition-all duration-500" style={{ width: `${lvl.pct * 100}%` }} />
              </div>
            </div>
            <button onClick={onReset} className="rounded-lg border border-edge px-2 py-1 text-[11px] text-slate-400 hover:border-hot hover:text-hot">
              Reset
            </button>
          </div>
        </div>

        <div className="mt-2 grid gap-2 md:mt-3 md:gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <div className={mobileHide}>
              <div className="flex items-end justify-between gap-2">
                <label htmlFor="target" className="text-[10px] font-bold uppercase tracking-widest text-slate-300 md:text-xs">
                  Set Your Target Startup Capital Raise Goal
                </label>
                <span className="font-mono text-base font-black text-neon md:text-lg">{fmt(target)}</span>
              </div>
              <input
                id="target" type="range" min={25000} max={500000} step={5000} value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="range-neon mt-1 w-full"
              />
              <div className="mt-1 hidden justify-between font-mono text-[10px] text-slate-500 md:flex"><span>$25K</span><span>$500K</span></div>
            </div>

            <div className="relative mt-2 h-10 overflow-hidden rounded-xl border border-edge bg-ink md:h-9">
              <div
                className={`h-full bg-gradient-to-r ${barColor} bar-stripes transition-[width] duration-1000 ease-out ${funded ? 'glow-pulse' : ''}`}
                style={{ width: `${shown}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center px-2 text-center font-mono text-[10px] font-bold leading-tight text-white drop-shadow-[0_1px_2px_#000] sm:text-sm">
                Current Capital Unlocked: {fmt(net)} / Target Goal: {fmt(target)} ({pct.toFixed(1)}% Funded)
              </div>
            </div>
            {spend > 0 && (
              <div className={`mt-1 text-right font-mono text-[10px] text-slate-500 ${compact ? 'max-md:hidden' : ''}`}>
                Gross {fmt(unlocked)} − tradeline spend {fmt(spend)}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 lg:w-[460px]">
            <div className="relative">
              <button onClick={() => setShowRunway((v) => !v)} title="Set your runway"
                className="h-full w-full rounded-xl border border-edge bg-panel p-1.5 text-center hover:border-neon/60 md:p-2">
                <div className="flex items-center justify-center gap-1 text-[9px] font-bold uppercase leading-tight tracking-wider text-slate-400 md:text-[10px]">
                  Cash Buffer Runway <span className="text-neon">⚙</span>
                </div>
                <div className={`font-mono text-lg font-black md:text-2xl ${runwayClass}`}>
                  {runway.toLocaleString('en-US')}
                </div>
                <div className="text-[9px] text-slate-500 md:text-[10px]">{secured ? 'DAYS · 365+ SECURED' : 'DAYS'}</div>
              </button>
              {showRunway && (
                <RunwaySettings settings={runwaySettings} monthlyBurn={monthlyBurn} setRunway={setRunway} onClose={() => setShowRunway(false)} />
              )}
            </div>
            <div className="rounded-xl border border-edge bg-panel p-1.5 text-center md:p-2">
              <div className="text-[9px] font-bold uppercase leading-tight tracking-wider text-slate-400 md:text-[10px]">Pay Yourself First Salary Vault</div>
              <div className="font-mono text-base font-black text-gold md:text-xl">{fmt(salary)}</div>
              <div className="text-[9px] text-slate-500 md:text-[10px]">20% Day-1 Reserve</div>
            </div>
            <div className="rounded-xl border border-edge bg-panel p-1.5 text-center md:p-2">
              <div className="text-[9px] font-bold uppercase leading-tight tracking-wider text-slate-400 md:text-[10px]">Equity Kept vs VCs</div>
              <div className="font-mono text-base font-black text-neon md:text-xl">100%</div>
              <div className="text-[9px] text-slate-500 md:text-[10px]">0 Board Seats Lost</div>
            </div>
          </div>
        </div>

        <button
          onClick={onVictory}
          disabled={!funded}
          className={`mt-2 w-full rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-wider transition md:mt-3 md:px-4 md:py-2.5 md:text-sm ${
            funded
              ? 'glow-pulse bg-neon text-ink hover:brightness-110'
              : 'cursor-not-allowed border border-dashed border-edge bg-ink text-slate-500'
          }`}
        >
          {funded
            ? 'VICTORY: Confirm Plan & Dispatch to 22-Person Slack War Room'
            : `Locked: unlock ${fmt(Math.max(0, target - net))} more to reach VICTORY`}
        </button>
      </div>
    </div>
  )
}
