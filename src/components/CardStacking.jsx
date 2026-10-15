import { useState } from 'react'
import Panel from './Panel'
import { CARDS, approvalOdds, estimatedLimit, fmt } from '../game'

export default function CardStacking({ score, income, locked, results, onApply }) {
  const [pending, setPending] = useState(null)
  const total = Object.values(results).reduce((s, r) => s + (r.status === 'approved' ? r.limit : 0), 0)

  const apply = (card) => {
    setPending(card.id)
    setTimeout(() => { setPending(null); onApply(card) }, 900)
  }

  return (
    <Panel num="3" accent="neon" title="0% Card Stacking"
      subtitle="Apply in sequence. Every application is a hard inquiry, and each one lowers your odds on the next card."
      right={<div className="text-right"><div className="text-[10px] uppercase text-slate-500">Stacked</div><div className="font-mono font-black text-neon">{fmt(total)}</div></div>}>
      {locked && (
        <div className="mb-3 rounded-lg border border-dashed border-cyan/50 bg-cyan/5 p-2 text-center text-xs text-cyan">
          Run AI Underwriting (section 2) to unlock applications.
        </div>
      )}
      <div className="space-y-2">
        {CARDS.map((card) => {
          const r = results[card.id]
          const odds = approvalOdds(score, card)
          const est = estimatedLimit(score, income, card)
          return (
            <div key={card.id} className={`flex items-center gap-3 rounded-xl border p-3 transition ${
              r?.status === 'approved' ? 'border-neon/60 bg-neon/5' : r?.status === 'denied' ? 'border-hot/40 bg-hot/5 opacity-70' : 'border-edge bg-ink/60'}`}>
              <div className="grid h-10 w-14 shrink-0 place-items-center rounded-md bg-gradient-to-br from-slate-700 to-slate-900 font-mono text-[10px] font-black text-gold">
                0%·{card.promo}m
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-white">{card.name}</div>
                <div className="text-[11px] text-slate-400">
                  {card.type} · 0% intro APR {card.promo} mo · est. limit <span className="font-mono text-slate-200">{fmt(est)}</span>
                </div>
                {!r && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-edge">
                    <div className={`h-full ${odds >= 70 ? 'bg-neon' : odds >= 40 ? 'bg-gold' : 'bg-hot'}`} style={{ width: `${odds}%` }} />
                  </div>
                )}
              </div>
              <div className="w-28 shrink-0 text-right">
                {r?.status === 'approved' && <div className="font-mono text-sm font-black text-neon">+{fmt(r.limit)}<div className="text-[10px] font-normal">APPROVED</div></div>}
                {r?.status === 'denied' && <div className="font-mono text-xs font-black text-hot">DENIED</div>}
                {!r && (
                  <button disabled={locked || pending} onClick={() => apply(card)}
                    className="w-full rounded-lg border border-neon/60 px-2 py-1.5 text-[11px] font-black uppercase text-neon hover:bg-neon hover:text-ink disabled:cursor-not-allowed disabled:opacity-40">
                    {pending === card.id ? 'Underwriting…' : `Apply · ${odds}%`}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
