import Panel from './Panel'
import { CARDS, fmt } from '../game'
import { cardDecision, creditUsed } from '../engine'

export default function CardStacking({ s, dispatch, blocked }) {
  return (
    <section id="card-stack" className="scroll-mt-48">
      <Panel num="4" accent="hot" title="0% Card Stack"
        subtitle="Thresholds are shown up front. Every application is a hard inquiry, so the next card gets harder."
        right={<div className="text-right"><div className="text-xs uppercase text-slate-500">Approved</div><div className="font-mono font-black text-neon">{fmt(creditUsed(s))}</div></div>}>
        {!s.underwritten && (
          <div className="mb-3 rounded-lg border border-dashed border-cyan/50 bg-cyan/5 p-2 text-center text-xs text-cyan">Run AI Underwriting to unlock applications.</div>
        )}
        <div className="space-y-2">
          {CARDS.map((card) => {
            const r = s.funding.find((f) => f.cardId === card.id)
            const d = cardDecision(s, card)
            return (
              <div key={card.id} className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${
                r?.status === 'available' ? 'border-neon/60 bg-neon/5' : r?.status === 'declined' ? 'border-hot/40 bg-hot/5 opacity-70' : r ? 'border-gold/50 bg-gold/5' : 'border-edge bg-ink/60'}`}>
                <div className="grid h-10 w-14 shrink-0 place-items-center rounded-md bg-gradient-to-br from-slate-700 to-slate-900 font-mono text-xs font-black text-gold">0%·{card.promo}m</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-white">{card.name}</div>
                  <div className="text-[13px] text-slate-400">{card.type} · threshold {card.req} · 0% for {card.promo} mo, then ~24% APR</div>
                  {!r && s.underwritten && (
                    <div className="text-xs">
                      Preview: <span className={d.status === 'approved' ? 'text-neon' : d.status === 'conditional' ? 'text-gold' : 'text-hot'}>{d.status}{d.limit ? ` ${fmt(d.limit)}` : ''}</span>
                      <span className="text-slate-500"> · {d.reason}</span>
                    </div>
                  )}
                  {r && <div className="text-xs text-slate-500">{r.reason}</div>}
                </div>
                <div className="w-full shrink-0 text-right sm:w-28">
                  {r ? (
                    <div className={`font-mono text-sm font-black ${r.status === 'available' ? 'text-neon' : r.status === 'declined' ? 'text-hot' : 'text-gold'}`}>
                      {r.amount ? `+${fmt(r.amount)}` : ''}<div className="text-xs font-normal uppercase">{r.status === 'available' ? 'approved' : r.status}</div>
                    </div>
                  ) : (
                    <button disabled={blocked || !s.underwritten} onClick={() => dispatch({ type: 'APPLY_CARD', cardId: card.id })}
                      className="w-full rounded-lg border border-neon/60 px-2 py-1.5 text-[13px] font-black uppercase text-neon hover:bg-neon hover:text-ink disabled:cursor-not-allowed disabled:opacity-40">
                      Apply
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Panel>
    </section>
  )
}
