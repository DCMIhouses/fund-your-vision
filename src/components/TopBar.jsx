import { fmt, runwayDays, FULL_RUNWAY_DAYS, SALARY_VAULT_PCT, levelFor } from '../game'

export default function TopBar({ target, setTarget, unlocked, spend, xp, onVictory, onReset }) {
  const net = Math.max(0, unlocked - spend)
  const pct = target > 0 ? (net / target) * 100 : 0
  const shown = Math.min(100, pct)
  const days = runwayDays(net, target)
  const funded = pct >= 100
  const salary = net * SALARY_VAULT_PCT
  const lvl = levelFor(xp)

  const runwayClass =
    days >= FULL_RUNWAY_DAYS ? 'text-neon drop-shadow-[0_0_10px_#39ff88]'
      : days < 90 ? 'flash-red'
        : days < 200 ? 'text-gold' : 'text-cyan'

  const barColor = funded
    ? 'from-neon to-emerald-300'
    : pct < 33 ? 'from-hot to-orange-400' : pct < 66 ? 'from-gold to-amber-300' : 'from-cyan to-neon'

  return (
    <div className="relative z-40 md:sticky md:top-0 border-b border-edge bg-ink/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon font-mono text-lg font-black text-ink">0%</span>
            <div>
              <h1 className="text-base font-black uppercase leading-tight tracking-tight text-white sm:text-xl">
                <span className="text-hot">SCREW VCs:</span> The 0% Capital Architect &amp; Target Raise Game
              </h1>
              <p className="text-[11px] text-slate-400">
                Powered by <span className="font-semibold text-cyan">NationwideBusinessFunding.com</span> · Fractional Chief Capital Officer Platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <label htmlFor="target" className="text-xs font-bold uppercase tracking-widest text-slate-300">
                Set Your Target Startup Capital Raise Goal
              </label>
              <span className="font-mono text-lg font-black text-neon">{fmt(target)}</span>
            </div>
            <input
              id="target" type="range" min={25000} max={500000} step={5000} value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="range-neon mt-1 w-full"
            />
            <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-500"><span>$25K</span><span>$500K</span></div>

            <div className="relative mt-2 h-9 overflow-hidden rounded-xl border border-edge bg-ink">
              <div
                className={`h-full bg-gradient-to-r ${barColor} bar-stripes transition-[width] duration-1000 ease-out ${funded ? 'glow-pulse' : ''}`}
                style={{ width: `${shown}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center px-2 text-center font-mono text-[11px] font-bold text-white drop-shadow-[0_1px_2px_#000] sm:text-sm">
                Current Capital Unlocked: {fmt(net)} / Target Goal: {fmt(target)} ({pct.toFixed(1)}% Funded)
              </div>
            </div>
            {spend > 0 && (
              <div className="mt-1 text-right font-mono text-[10px] text-slate-500">
                Gross {fmt(unlocked)} − tradeline spend {fmt(spend)}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 lg:w-[460px]">
            <div className="rounded-xl border border-edge bg-panel p-2 text-center">
              <div className="text-[10px] font-bold uppercase leading-tight tracking-wider text-slate-400">Cash Buffer Runway</div>
              <div className={`font-mono text-2xl font-black ${runwayClass}`}>
                {days >= FULL_RUNWAY_DAYS ? '365+' : days}
              </div>
              <div className="text-[10px] text-slate-500">DAYS</div>
            </div>
            <div className="rounded-xl border border-edge bg-panel p-2 text-center">
              <div className="text-[10px] font-bold uppercase leading-tight tracking-wider text-slate-400">Pay Yourself First Salary Vault</div>
              <div className="font-mono text-xl font-black text-gold">{fmt(salary)}</div>
              <div className="text-[10px] text-slate-500">20% Day-1 Reserve</div>
            </div>
            <div className="rounded-xl border border-edge bg-panel p-2 text-center">
              <div className="text-[10px] font-bold uppercase leading-tight tracking-wider text-slate-400">Equity Kept vs VCs</div>
              <div className="font-mono text-xl font-black text-neon">100%</div>
              <div className="text-[10px] text-slate-500">0 Board Seats Lost</div>
            </div>
          </div>
        </div>

        <button
          onClick={onVictory}
          disabled={!funded}
          className={`mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-black uppercase tracking-wider transition ${
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
