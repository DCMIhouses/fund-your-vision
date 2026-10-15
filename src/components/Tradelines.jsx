import Panel from './Panel'
import { TRADELINES, fmt } from '../game'

export default function Tradelines({ owned, onBuy, onRemove }) {
  const ids = new Set(owned.map((t) => t.id))
  const spend = owned.reduce((s, t) => s + t.cost, 0)
  return (
    <Panel num="5" accent="hot" title="Authorized User (AU) Tradelines"
      subtitle="Rent seasoned age and unused limit to lower utilization and lift your score. Buy BEFORE you stack."
      right={<div className="text-right"><div className="text-[10px] uppercase text-slate-500">Spend</div><div className="whitespace-nowrap font-mono font-black text-hot">−{fmt(spend)}</div></div>}>
      <div className="grid gap-2 sm:grid-cols-2">
        {TRADELINES.map((t) => {
          const has = ids.has(t.id)
          return (
            <div key={t.id} className={`rounded-xl border p-3 ${has ? 'border-hot/60 bg-hot/5' : 'border-edge bg-ink/60'}`}>
              <div className="text-sm font-bold text-white">{t.bank}</div>
              <div className="mt-1 grid grid-cols-3 gap-1 font-mono text-[11px]">
                <div><div className="text-[9px] uppercase text-slate-500">Age</div><span className="text-cyan">{t.age} yrs</span></div>
                <div><div className="text-[9px] uppercase text-slate-500">Limit</div><span className="text-neon">{fmt(t.limit)}</span></div>
                <div><div className="text-[9px] uppercase text-slate-500">Cost</div><span className="text-hot">{fmt(t.cost)}</span></div>
              </div>
              <button onClick={() => (has ? onRemove(t.id) : onBuy(t))}
                className={`mt-2 w-full rounded-lg py-1.5 text-[11px] font-black uppercase ${has
                  ? 'border border-hot/60 text-hot hover:bg-hot/10'
                  : 'bg-hot text-white hover:brightness-110'}`}>
                {has ? 'Added ✓ (remove)' : 'Add as AU'}
              </button>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-[10px] leading-snug text-slate-500">
        Not every lender counts AU tradelines, and score impact varies. Spend is subtracted from your unlocked capital.
      </p>
    </Panel>
  )
}
