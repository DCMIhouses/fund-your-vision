import Panel from './Panel'
import { fmt } from '../game'
import { totals, has, MIN_EVENTS, runForecast } from '../engine'
import Chart from './Chart'
import { SQUAD_SLOTS } from '../data'

const CHIP = {
  available: 'bg-neon/15 text-neon', committed: 'bg-gold/15 text-gold', conditional: 'bg-gold/15 text-gold',
  declined: 'bg-hot/15 text-hot', withdrawn: 'bg-hot/15 text-hot',
}

export default function Ledger({ s, dispatch, blocked }) {
  const t = totals(s)
  const creditLines = s.funding.filter((f) => (f.type === 'credit' || f.type === 'partner') && f.status === 'available').reduce((a, f) => a + f.amount, 0)
  const conditionals = s.funding.filter((f) => f.status === 'conditional')
  const canHireAttorney = has(s, 'attorney') || s.squad.length < SQUAD_SLOTS

  const conditionButtons = (f) => {
    if (f.type === 'partner') {
      return [
        { label: has(s, 'attorney') ? 'Sign agreement' : 'Hire attorney & sign', primary: true, disabled: !canHireAttorney, onClick: () => { if (!has(s, 'attorney')) dispatch({ type: 'HIRE', role: 'attorney' }); dispatch({ type: 'RESOLVE_CONDITION', id: f.id, choice: 'agreement' }) } },
        { label: 'Proceed on a handshake', onClick: () => dispatch({ type: 'RESOLVE_CONDITION', id: f.id, choice: 'handshake' }) },
        { label: 'Decline', onClick: () => dispatch({ type: 'RESOLVE_CONDITION', id: f.id, choice: 'decline' }) },
      ]
    }
    return [
      { label: f.type === 'vc' ? 'Accept term sheet' : 'Satisfy & accept', primary: true, onClick: () => dispatch({ type: 'RESOLVE_CONDITION', id: f.id, choice: 'accept' }) },
      { label: 'Decline', onClick: () => dispatch({ type: 'RESOLVE_CONDITION', id: f.id, choice: 'decline' }) },
    ]
  }

  return (
    <Panel guide="ledger" num="7" accent="gold" title="Funding Ledger & Timeline"
      subtitle="Requested ≠ committed ≠ available. Committed funds land as time passes (each event = a month).">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[['Requested', t.requested, 'text-slate-300'], ['Committed', t.committed, 'text-gold'], ['Available', t.available, 'text-neon']].map(([k, v, c]) => (
          <div key={k} className="rounded-lg border border-edge bg-ink/60 p-2"><div className="text-[11px] uppercase tracking-widest text-slate-500">{k}</div><div className={`font-mono text-sm font-black ${c}`}>{fmt(v)}</div></div>
        ))}
      </div>

      <div className="mt-1 text-center text-xs text-slate-500">
        Available = cash {fmt(t.cash - creditLines)} + approved credit lines {fmt(creditLines)}{t.freed ? ` + freed capital ${fmt(t.freed)}` : ''}
      </div>
      {has(s, 'cpa') && (() => {
        const f = runForecast(s, [])
        return (
          <div className="mt-3 rounded-xl border border-cyan/50 bg-cyan/5 p-2">
            <div className="flex justify-between text-xs font-black uppercase text-cyan"><span>CPA early warning: 18-month forecast</span><span className={f.insolventMonth ? 'text-hot' : 'text-neon'}>{f.insolventMonth ? `cash out month ${f.insolventMonth}` : `month 18: ${fmt(f.endCash)}`}</span></div>
            <Chart forecast={f} height={110} />
          </div>
        )
      })()}

      {conditionals.length > 0 && (
        <div className="mt-3 space-y-2">
          {conditionals.map((f) => (
            <div key={f.id} className="rounded-xl border border-gold/60 bg-gold/5 p-3">
              <div className="flex justify-between gap-2 text-sm font-bold text-white"><span>{f.label}</span><span className="font-mono text-gold">{fmt(f.amount)}</span></div>
              <div className="text-[13px] text-gold">Condition: {f.requirement}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {conditionButtons(f).map((b) => (
                  <button key={b.label} disabled={blocked || b.disabled} onClick={b.onClick}
                    className={`rounded-lg px-2.5 py-1 text-[13px] font-black uppercase disabled:opacity-40 ${b.primary ? 'bg-gold text-ink' : 'border border-edge text-slate-300 hover:border-gold'}`}>{b.label}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">
        {s.funding.length === 0 && <div className="rounded-lg border border-dashed border-edge p-3 text-center text-xs text-slate-500">No funding yet. Play a power-up card.</div>}
        {s.funding.map((f) => (
          <div key={f.id} className="flex items-center justify-between gap-2 rounded-lg bg-ink/60 px-2.5 py-1.5 text-xs">
            <span className="min-w-0 truncate text-slate-300">{f.label}</span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="font-mono text-slate-200">{fmt(f.amount)}</span>
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-black uppercase ${CHIP[f.status]}`}>{f.status}{f.status === 'committed' ? ` · ${f.turns}t` : ''}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-edge pt-3">
        <div className="text-[13px] text-slate-400">Events survived: <span className="font-mono text-white">{s.resolvedEvents.length}</span> (min {MIN_EVENTS} before the boss) · deck {s.deck.length}</div>
        <button disabled={blocked || s.deck.length === 0} onClick={() => dispatch({ type: 'DRAW_EVENT' })}
          className="rounded-lg border border-gold/60 px-3 py-1.5 text-[13px] font-black uppercase text-gold hover:bg-gold/10 disabled:opacity-40">Advance a month (draw event)</button>
      </div>

      <div className="mt-3 max-h-40 space-y-1 overflow-y-auto font-mono text-xs">
        {s.log.map((l) => <div key={l.id} className={{ neon: 'text-neon', cyan: 'text-cyan', gold: 'text-gold', hot: 'text-hot' }[l.tone]}>› {l.text}</div>)}
      </div>
    </Panel>
  )
}
