import { fmt } from '../game'
import { fundingTiers } from '../selectors'

const TIERS = [
  ['collected', 'Collected', 'cash in the bank', 'bg-neon', 'text-neon'],
  ['saved', 'Saved', 'cost cuts, not cash', 'bg-teal-400/70', 'text-teal-300'],
  ['committed', 'Committed', 'promised, not here yet', 'bg-gold/70', 'text-gold'],
  ['pledged', 'Pledged', 'soft offer, not final', 'bg-sky-400/40 bar-stripes', 'text-sky-300'],
]

function segments(t, target) {
  const out = []
  let left = 0
  for (const [k, , , bg] of TIERS) {
    const w = Math.max(0, Math.min(100 - left, (t[k] / target) * 100))
    out.push([k, bg, left, w])
    left += w
  }
  return out
}

export default function FundingBar({ s, compact }) {
  const t = fundingTiers(s)
  const target = t.target || 1
  const ready = Math.min(100, (t.countsToTarget / target) * 100)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-black uppercase tracking-widest text-slate-300">Goal {fmt(target)}</span>
        <span className="font-mono font-bold text-white">{Math.round(ready)}% ready · {fmt(Math.max(0, target - t.countsToTarget))} to go</span>
      </div>
      <div className="relative mt-1.5 h-3.5 overflow-hidden rounded-full border border-edge bg-ink" role="img" aria-label={`Funding: ${TIERS.map(([k, l]) => `${l} ${fmt(t[k])}`).join(', ')} of ${fmt(target)}`}>
        {segments(t, target).map(([k, bg, left, w]) => <div key={k} className={`absolute inset-y-0 ${bg} transition-all duration-700`} style={{ left: `${left}%`, width: `${w}%` }} />)}
      </div>
      {!compact && (
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          {TIERS.map(([k, l, hint, bg, tc]) => (
            <span key={k} className="flex items-center gap-1.5 text-slate-400"><span className={`h-2.5 w-2.5 rounded-sm ${bg}`} /><b className={tc}>{l} {fmt(t[k])}</b> {hint}</span>
          ))}
          <span className="text-slate-500">Collected + saved count toward the goal.</span>
        </div>
      )}
    </div>
  )
}
