import { useState } from 'react'
import Panel from './Panel'
import { NEEDS, PARTNERS, compatibility, fmt } from '../game'

export default function JVMatch({ s, dispatch, blocked }) {
  const [needs, setNeeds] = useState(['Capital'])
  const [passed, setPassed] = useState([])
  const matchedIds = s.funding.filter((f) => f.type === 'partner').map((f) => f.partnerId)
  const active = s.funding.filter((f) => f.type === 'partner' && f.status !== 'declined' && f.status !== 'withdrawn').length
  const queue = PARTNERS.filter((p) => !passed.includes(p.id) && !matchedIds.includes(p.id))
  const current = queue[0]
  const toggle = (n) => setNeeds(needs.includes(n) ? needs.filter((x) => x !== n) : [...needs, n])

  return (
    <section id="partners" className="scroll-mt-48">
      <Panel num="5" accent="cyan" title="Capital Partner Matchmaking"
        subtitle="Simulated profiles. Partners guarantee credit for a profit share; get the guarantee and agreement in writing."
        right={<div className="text-right"><div className="text-xs uppercase text-slate-500">Partners</div><div className="font-mono font-black text-cyan">{active}/2</div></div>}>
        <div className="text-[13px] uppercase tracking-widest text-slate-500">What do you need in a partner?</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {NEEDS.map((n) => (
            <button key={n} onClick={() => toggle(n)}
              className={`rounded-full border px-2.5 py-1 text-[13px] font-bold ${needs.includes(n) ? 'border-cyan bg-cyan text-ink' : 'border-edge text-slate-400 hover:border-cyan'}`}>{n}</button>
          ))}
        </div>
        <div className="mt-3">
          {current ? (() => {
            const c = compatibility(current, needs)
            return (
              <div key={current.id} className="toast-in rounded-2xl border border-cyan/40 bg-gradient-to-br from-cyan/10 to-ink p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan to-neon text-base font-black text-ink">
                    {current.name.split(' ').map((w) => w[0]).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-base font-black text-white">{current.name}</div>
                      <div className={`font-mono text-sm font-black ${c >= 75 ? 'text-neon' : c >= 55 ? 'text-gold' : 'text-hot'}`}>{c}% fit</div>
                    </div>
                    <div className="text-xs text-slate-400">{current.title}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {current.skills.map((sk) => <span key={sk} className={`rounded px-1.5 py-0.5 text-xs font-bold ${needs.includes(sk) ? 'bg-neon/20 text-neon' : 'bg-edge text-slate-400'}`}>{sk}</span>)}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-300">{current.bio}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[13px]">
                  <div className="rounded bg-ink/70 p-1.5 text-center"><div className="text-[11px] uppercase text-slate-500">FICO</div><span className="text-white">{current.fico}</span></div>
                  <div className="rounded bg-ink/70 p-1.5 text-center"><div className="text-[11px] uppercase text-slate-500">Credit capacity</div><span className="text-neon">{fmt(current.capacity)}</span></div>
                  <div className="rounded bg-ink/70 p-1.5 text-center"><div className="text-[11px] uppercase text-slate-500">Profit share</div><span className="text-gold">{current.split}%</span></div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => setPassed([...passed, current.id])} className="rounded-lg border border-hot/60 py-2 text-xs font-black uppercase text-hot hover:bg-hot/10">✕ Pass</button>
                  <button disabled={blocked || active >= 2} onClick={() => dispatch({ type: 'PLAY', card: 'partner', partnerId: current.id })}
                    className="rounded-lg bg-cyan py-2 text-xs font-black uppercase text-ink hover:brightness-110 disabled:opacity-40">{active >= 2 ? 'Max 2 partners' : '♥ Propose JV'}</button>
                </div>
              </div>
            )
          })() : (
            <div className="rounded-xl border border-dashed border-edge p-4 text-center text-xs text-slate-500">
              Deck empty. <button className="text-cyan underline" onClick={() => setPassed([])}>Reshuffle passed profiles</button>
            </div>
          )}
        </div>
      </Panel>
    </section>
  )
}
