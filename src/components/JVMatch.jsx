import Panel from './Panel'
import { NEEDS, PARTNERS, compatibility, fmt } from '../game'

export default function JVMatch({ needs, setNeeds, decisions, onDecide }) {
  const queue = PARTNERS.filter((p) => !decisions[p.id])
  const current = queue[0]
  const matched = PARTNERS.filter((p) => decisions[p.id] === 'matched')
  const total = matched.reduce((s, p) => s + p.capacity, 0)

  const toggle = (n) => setNeeds(needs.includes(n) ? needs.filter((x) => x !== n) : [...needs, n])

  return (
    <Panel num="6" accent="cyan" title="JV Credit Partner Matchmaking"
      subtitle="Match with co-founders who bring credit capacity for a profit share. You keep the equity and the board."
      right={<div className="text-right"><div className="text-[10px] uppercase text-slate-500">JV Capital</div><div className="font-mono font-black text-cyan">{fmt(total)}</div></div>}>
      <div className="text-[11px] uppercase tracking-widest text-slate-500">What do you need in a partner?</div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {NEEDS.map((n) => (
          <button key={n} onClick={() => toggle(n)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${needs.includes(n) ? 'border-cyan bg-cyan text-ink' : 'border-edge text-slate-400 hover:border-cyan'}`}>
            {n}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {current ? (() => {
          const c = compatibility(current, needs)
          return (
            <div key={current.id} className="toast-in rounded-2xl border border-cyan/40 bg-gradient-to-br from-cyan/10 to-ink p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan to-neon text-lg font-black text-ink">
                  {current.name.split(' ').map((w) => w[0]).join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-base font-black text-white">{current.name}</div>
                    <div className={`font-mono text-sm font-black ${c >= 75 ? 'text-neon' : c >= 55 ? 'text-gold' : 'text-hot'}`}>{c}% match</div>
                  </div>
                  <div className="text-xs text-slate-400">{current.title}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {current.skills.map((s) => (
                      <span key={s} className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${needs.includes(s) ? 'bg-neon/20 text-neon' : 'bg-edge text-slate-400'}`}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-300">{current.bio}</p>
              <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="rounded bg-ink/70 p-1.5 text-center"><div className="text-[9px] uppercase text-slate-500">FICO</div><span className="text-white">{current.fico}</span></div>
                <div className="rounded bg-ink/70 p-1.5 text-center"><div className="text-[9px] uppercase text-slate-500">0% Capacity</div><span className="text-neon">{fmt(current.capacity)}</span></div>
                <div className="rounded bg-ink/70 p-1.5 text-center"><div className="text-[9px] uppercase text-slate-500">Profit Share</div><span className="text-gold">{current.split}%</span></div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => onDecide(current, 'passed')} className="rounded-lg border border-hot/60 py-2 text-xs font-black uppercase text-hot hover:bg-hot/10">✕ Pass</button>
                <button onClick={() => onDecide(current, 'matched')} className="rounded-lg bg-cyan py-2 text-xs font-black uppercase text-ink hover:brightness-110">♥ Match JV</button>
              </div>
            </div>
          )
        })() : (
          <div className="rounded-xl border border-dashed border-edge p-4 text-center text-xs text-slate-500">
            Deck empty. {matched.length} partner{matched.length === 1 ? '' : 's'} matched.
          </div>
        )}
      </div>

      {matched.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {matched.map((p) => (
            <span key={p.id} className="rounded-full border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-[11px] text-cyan">
              {p.name} · {fmt(p.capacity)}
            </span>
          ))}
        </div>
      )}
    </Panel>
  )
}
