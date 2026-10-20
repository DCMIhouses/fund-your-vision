import { bossLimit, monthlyBurn, runForecast, scoreGame, totals } from '../../engine'
import { fmt } from '../../game'
import { bossMovePreviews } from '../../shared/gameSelectors'
import { Button, Card, CashChart, Eyebrow, Pill } from '../../shared/ui'

export default function CashCrunch({ s, dispatch, onDone }) {
  const limit = bossLimit(s)
  const left = limit - s.bossMoves.length
  const baseline = runForecast(s, [])
  const f = runForecast(s, s.bossMoves)
  const preview = scoreGame(s, f, s.bossMoves)
  const tiles = bossMovePreviews(s)
  const passed = preview.checks.filter((c) => c.ok).length
  const promo = s.funding.filter((x) => (x.type === 'credit' || x.type === 'partner') && x.status === 'available').reduce((a, x) => a + x.amount, 0)
  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="bg-fos-office px-6 py-8 text-white">
          <div className="text-sm font-semibold uppercase tracking-[0.1em] text-[#D2B077]">Chapter · Cash crunch · Month 12</div>
          <h1 className="fos-display mt-2 text-[32px] sm:text-[40px]">You raised the money. Can you keep the business alive?</h1>
          <p className="mt-3 max-w-2xl text-white/80">Intro 0% rates end and sales come in 25% below plan. {baseline.insolventMonth ? `If you change nothing, cash runs out in month ${baseline.insolventMonth}.` : 'If you change nothing, cash lasts, but you can make it stronger.'}</p>
          <div className="mt-5 max-w-md">
            <div className="flex justify-between text-sm text-white/80"><span>Survival checks passed</span><span className="fos-num">{passed}/{preview.checks.length}</span></div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#45BD94] transition-all" style={{ width: `${(passed / preview.checks.length) * 100}%` }} /></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          {[['Funding raised', fmt(totals(s).available)], ['0% balances to repay', fmt(promo)], ['Monthly spending', fmt(monthlyBurn(s))], ['Month-18 cash, no moves', fmt(baseline.endCash)]].map(([k, v]) => (
            <div key={k}><div className="text-sm text-fos-muted">{k}</div><div className="fos-num text-[19px] font-semibold">{v}</div></div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow>18-month cash {s.bossMoves.length ? 'with your moves' : '(no moves yet)'}</Eyebrow>
            <Pill tone={f.insolventMonth ? 'risk' : 'green'}>{f.insolventMonth ? `Runs out in month ${f.insolventMonth}` : `Month 18: ${fmt(f.endCash)}`}</Pill>
          </div>
          <div className="mt-3"><CashChart forecast={f} height={240} /></div>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {preview.checks.map((c) => <li key={c.label} className={`text-[15px] ${c.ok ? 'text-fos-green' : 'text-fos-risk'}`}>{c.ok ? '✓' : '✕'} {c.label}</li>)}
          </ul>
          <p className="mt-3 text-[13px] text-fos-muted">Assumes approved credit lines are fully drawn. Simulation only: no refinancing or new financing is guaranteed.</p>
        </Card>
        <div className="space-y-3">
          <Card className="flex items-center justify-between p-4"><span className="font-semibold">Turnaround moves left</span><span className="fos-num text-[22px] font-semibold text-fos-gold">{left} / {limit}</span></Card>
          {s.squad.includes('cpa') && <p className="text-sm text-fos-muted">Your CPA earned you a third move.</p>}
          {tiles.map(({ o, used, delta, insolventMonth }) => (
            <button key={o.id} disabled={o.disabled || used || left === 0} onClick={() => dispatch({ type: 'BOSS_MOVE', option: o.id })}
              className={`w-full rounded-[18px] border p-4 text-left transition disabled:cursor-not-allowed ${used ? 'border-fos-green bg-fos-green/5' : 'border-fos-line bg-fos-surface hover:border-fos-gold disabled:opacity-50'}`}>
              <div className="flex justify-between gap-2 font-semibold"><span>{o.label}</span>{used && <span className="text-fos-green">Chosen ✓</span>}</div>
              <div className="mt-1 text-sm text-fos-muted">{o.detail}</div>
              {!o.disabled && !used && <div className={`mt-2 text-sm font-semibold ${delta >= 0 ? 'text-fos-green' : 'text-fos-risk'}`}>Month-18 cash {delta >= 0 ? '+' : ''}{fmt(delta)}{insolventMonth ? ` · still runs out month ${insolventMonth}` : ''}</div>}
            </button>
          ))}
          <div className="flex gap-3">
            <Button variant="secondary" disabled={!s.bossMoves.length} onClick={() => dispatch({ type: 'BOSS_UNDO' })}>Undo</Button>
            <Button className="flex-1" onClick={() => { dispatch({ type: 'BOSS' }); onDone() }}>Lock in my plan</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
