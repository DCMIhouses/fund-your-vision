import Panel from './Panel'
import { INDUSTRIES, SQUAD, SQUAD_SLOTS } from '../data'
import { fmt } from '../game'

const POS = [
  'left-[6%] top-[8%]', 'right-[6%] top-[8%]', 'left-[6%] bottom-[8%]', 'right-[6%] bottom-[8%]',
]

export default function Squad({ s, dispatch, locked }) {
  const pri = INDUSTRIES[s.startup.industry].priorities
  const cost = s.squad.reduce((a, id) => a + SQUAD.find((r) => r.id === id).cost, 0)
  const slots = Array.from({ length: SQUAD_SLOTS }, (_, i) => SQUAD.find((r) => r.id === s.squad[i]))
  return (
    <Panel guide="squad" num="6" accent="neon" title="Startup Squad Builder"
      subtitle={`${SQUAD_SLOTS} slots. Each specialist costs money monthly and changes risks, costs, or outcomes.`}
      right={<div className="text-right"><div className="text-xs uppercase text-slate-500">Squad cost</div><div className="font-mono font-black text-gold">{fmt(cost)}/mo</div></div>}>
      <div className="relative mx-auto h-48 max-w-lg">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {[[18, 20], [82, 20], [18, 80], [82, 80]].map(([x, y], i) => (
            <line key={i} x1="50" y1="50" x2={x} y2={y} stroke={slots[i] ? '#39ff88' : '#1c2540'} strokeWidth="0.8" strokeDasharray={slots[i] ? '0' : '2 2'} />
          ))}
        </svg>
        <div className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-neon to-cyan text-center text-xs font-black uppercase leading-tight text-ink shadow-[0_0_24px_rgba(57,255,136,.5)]">
          Founder
        </div>
        {slots.map((r, i) => (
          <div key={i} className={`absolute ${POS[i]} grid h-16 w-28 place-items-center rounded-xl border px-1 text-center ${r ? 'toast-in border-neon/70 bg-neon/10' : 'border-dashed border-edge bg-ink/60'}`}>
            {r ? (
              <div><div className="font-mono text-xs font-black text-neon">{r.short}</div><div className="text-[10px] leading-tight text-slate-300">{r.name}</div></div>
            ) : <div className="text-xs text-slate-600">Open slot</div>}
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SQUAD.map((r) => {
          const hired = s.squad.includes(r.id)
          const full = !hired && s.squad.length >= SQUAD_SLOTS
          return (
            <div key={r.id} className={`rounded-xl border p-2.5 ${hired ? 'border-neon/60 bg-neon/5' : 'border-edge bg-ink/60'}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold text-white">{r.name}</div>
                {pri.includes(r.id) && <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[11px] font-black uppercase text-gold">Priority</span>}
              </div>
              <div className="text-xs text-slate-500">{r.area} · {fmt(r.cost)}/mo</div>
              <div className="mt-1 text-[13px] leading-snug text-slate-300">{r.effect}</div>
              <button disabled={locked || full} onClick={() => dispatch({ type: hired ? 'FIRE' : 'HIRE', role: r.id })}
                className={`mt-2 w-full rounded-lg py-1 text-[13px] font-black uppercase disabled:opacity-40 ${hired ? 'border border-neon/60 text-neon hover:bg-neon/10' : 'bg-neon text-ink hover:brightness-110'}`}>
                {hired ? 'On squad ✓ (remove)' : full ? 'Squad full' : 'Recruit'}
              </button>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
