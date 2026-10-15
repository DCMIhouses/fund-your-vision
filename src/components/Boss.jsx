import { useState } from 'react'
import Chart from './Chart'
import { fmt } from '../game'
import { bossOptions, runForecast, scoreGame, totals } from '../engine'

export default function Boss({ s, dispatch }) {
  const options = bossOptions(s)
  const [pick, setPick] = useState(options.find((o) => !o.disabled && o.id === 'refi') ? 'refi' : 'ride')
  const f = runForecast(s, pick)
  const preview = scoreGame(s, f, pick)
  const t = totals(s)
  return (
    <section className="rounded-3xl border-2 border-hot bg-panel p-5 shadow-[0_0_60px_rgba(255,46,99,.25)] md:p-7">
      <div className="text-center">
        <div className="text-[11px] font-black uppercase tracking-[0.35em] text-hot">Final Boss · Month 12</div>
        <h2 className="mt-1 text-2xl font-black uppercase text-white md:text-4xl">You raised the money. Can you pay it back?</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
          You have {fmt(t.available)} available. Now the 0% promos expire and revenue lands {s.squad.includes('cpa') ? '10%' : '25%'} below projections. Pick your response, then run the 18-month forecast.
        </p>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-edge bg-ink/70 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Projected cash (preview)</span>
            <span className={f.insolventMonth ? 'font-black text-hot' : 'font-black text-neon'}>{f.insolventMonth ? `Out of cash in month ${f.insolventMonth}` : `Month 18 cash ${fmt(f.endCash)}`}</span>
          </div>
          <Chart forecast={f} />
          <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {preview.checks.map((c) => (
              <div key={c.label} className={`text-[11px] ${c.ok ? 'text-neon' : 'text-hot'}`}>{c.ok ? '✓' : '✕'} {c.label}</div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {options.map((o) => (
            <button key={o.id} disabled={o.disabled} onClick={() => setPick(o.id)}
              className={`w-full rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${pick === o.id ? 'border-neon bg-neon/10' : 'border-edge bg-ink/60 hover:border-neon/60'}`}>
              <div className="text-sm font-black text-white">{o.label}</div>
              <div className="text-[11px] text-slate-400">{o.detail}</div>
            </button>
          ))}
          <button onClick={() => dispatch({ type: 'BOSS', option: pick })}
            className="glow-pulse w-full rounded-xl bg-hot py-3 text-sm font-black uppercase tracking-wider text-white hover:brightness-110">
            Lock it in: run the 18-month forecast
          </button>
        </div>
      </div>
    </section>
  )
}
