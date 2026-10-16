import Chart from './Chart'
import { fmt } from '../game'
import { bossLimit, bossOptions, monthlyBurn, runForecast, scoreGame, totals } from '../engine'

export default function Boss({ s, dispatch }) {
  const options = bossOptions(s)
  const limit = bossLimit(s)
  const baseline = runForecast(s, [])
  const f = runForecast(s, s.bossMoves)
  const preview = scoreGame(s, f, s.bossMoves)
  const crunch = baseline.insolventMonth || baseline.endCash < baseline.endExpenses
  const left = limit - s.bossMoves.length
  return (
    <section className="rounded-3xl border-2 border-hot bg-panel p-5 shadow-[0_0_60px_rgba(255,46,99,.25)] md:p-7">
      <div className="text-center">
        <div className="text-[13px] font-black uppercase tracking-[0.35em] text-hot">Final Boss · Month 12</div>
        <h2 className="medal-pop mt-1 text-4xl font-black uppercase text-white md:text-6xl">{crunch ? 'The Cash Crunch' : 'The Promo Cliff'}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
          You raised {fmt(totals(s).available)}. Now the 0% promos expire and revenue lands 25% below projections.
          {crunch ? ' Untouched, your forecast ends ' + (baseline.insolventMonth ? `out of cash in month ${baseline.insolventMonth}.` : 'without a one-month reserve.') : ' Your untouched forecast survives, but can you make it stronger?'}
        </p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Available', fmt(totals(s).available)], ['Promo balances', fmt(s.funding.filter((x) => (x.type === 'credit' || x.type === 'partner') && x.status === 'available').reduce((a, x) => a + x.amount, 0))], ['Monthly burn', fmt(monthlyBurn(s))], ['Untouched month-18 cash', fmt(baseline.endCash)]].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-edge bg-ink/60 p-3"><div className="text-[11px] uppercase tracking-widest text-slate-500">{k}</div><div className={`font-mono text-sm font-black ${k.startsWith('Untouched') && baseline.endCash < 0 ? 'text-hot' : 'text-white'}`}>{v}</div></div>
        ))}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-2xl border border-edge bg-ink/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-slate-400">
            <span>Forecast cash position {s.bossMoves.length ? '(with your moves)' : '(no moves yet)'}</span>
            <span className={f.insolventMonth ? 'font-black text-hot' : 'font-black text-neon'}>{f.insolventMonth ? `NEGATIVE: out of cash month ${f.insolventMonth}` : `Month 18 cash ${fmt(f.endCash)}`}</span>
          </div>
          <Chart forecast={f} />
          <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {preview.checks.map((c) => <div key={c.label} className={`text-[13px] ${c.ok ? 'text-neon' : 'text-hot'}`}>{c.ok ? '✓' : '✕'} {c.label}</div>)}
          </div>
          <div className="mt-2 text-xs text-slate-500">Assumes approved credit lines are fully drawn to fund operations. Simulation only: no refinancing or new financing is guaranteed.</div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-gold/60 bg-gold/10 px-3 py-2">
            <span className="text-xs font-black uppercase text-gold">Turnaround moves</span>
            <span className="font-mono text-lg font-black text-gold">{left}/{limit}</span>
          </div>
          {s.squad.includes('cpa') && <div className="text-xs text-cyan">Your CPA's tighter controls earned you a 3rd move.</div>}
          {options.map((o) => {
            const used = s.bossMoves.includes(o.id)
            return (
              <button key={o.id} disabled={o.disabled || used || left === 0} onClick={() => dispatch({ type: 'BOSS_MOVE', option: o.id })}
                className={`w-full rounded-xl border p-3 text-left transition disabled:cursor-not-allowed ${used ? 'border-neon bg-neon/10' : 'border-edge bg-ink/60 hover:border-neon/60 disabled:opacity-40'}`}>
                <div className="flex justify-between text-sm font-black text-white"><span>{o.label}</span>{used && <span className="text-neon">✓</span>}</div>
                <div className="text-[13px] text-slate-400">{o.detail}</div>
              </button>
            )
          })}
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <button disabled={!s.bossMoves.length} onClick={() => dispatch({ type: 'BOSS_UNDO' })} className="rounded-xl border border-edge px-3 text-xs font-bold uppercase text-slate-300 disabled:opacity-40">Undo</button>
            <button onClick={() => dispatch({ type: 'BOSS' })} className="glow-pulse rounded-xl bg-hot py-3 text-sm font-black uppercase tracking-wider text-white hover:brightness-110">Lock it in: final forecast</button>
          </div>
        </div>
      </div>
    </section>
  )
}
