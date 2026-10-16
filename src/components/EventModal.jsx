import { useEffect, useState } from 'react'
import { EVENTS } from '../engine'
import { EVENT_ICON } from '../meta'
import { SpinReveal } from './Fx'
import { play } from '../sfx'

export default function EventModal({ s, dispatch }) {
  const [shown, setShown] = useState(null)
  useEffect(() => {
    if (!s.activeEvent) return
    play('spin')
    const t = setTimeout(() => { setShown(s.activeEvent); play('flip') }, 1400)
    return () => clearTimeout(t)
  }, [s.activeEvent])
  if (!s.activeEvent) return null
  const ev = EVENTS[s.activeEvent]
  const good = ev.tone === 'neon'
  const n = s.resolvedEvents.length + 1
  const ready = shown === s.activeEvent
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      {!ready ? <SpinReveal id={s.activeEvent} /> : (
        <div className={`card-flip w-full max-w-lg rounded-3xl border-2 bg-panel p-6 ${good ? 'border-neon shadow-[0_0_50px_rgba(57,255,136,.35)]' : 'border-hot shadow-[0_0_50px_rgba(255,46,99,.35)]'}`}>
          <div className="flex items-start gap-4">
            <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-4xl ${good ? 'bg-neon/15' : 'bg-hot/15'}`}>{EVENT_ICON[s.activeEvent] || '🃏'}</div>
            <div className="min-w-0">
              <div className={`text-[13px] font-black uppercase tracking-[0.3em] ${good ? 'text-neon' : 'text-hot'}`}>{good ? 'Lucky card' : 'Trouble card'} {n} · Month {n}</div>
              <h2 className="mt-1 text-2xl font-black text-white">{ev.title}</h2>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-300">{ev.body(s)}</p>
          <div className="mt-3 rounded-xl border border-cyan/40 bg-cyan/5 p-3 text-xs leading-relaxed text-slate-300">
            <span className="font-black text-cyan">💡 What to do:</span> Read each choice. Pick the one that keeps your cash safest. Every choice changes your money plan.
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1"><span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-neon" />Green card = good luck</span><span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-hot" />Red card = trouble</span><span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-slate-600" />Faded = you can't pick it</span></div>
          </div>
          <div className="mt-4 space-y-2">
            {ev.choices(s).map((c, i) => (
              <button key={c.id} disabled={c.disabled} onClick={() => dispatch({ type: 'RESOLVE_EVENT', choice: c.id })}
                className="fade-up w-full rounded-xl border border-edge bg-ink/70 p-3 text-left transition hover:scale-[1.01] hover:border-neon disabled:cursor-not-allowed disabled:opacity-40" style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
                <div className="text-sm font-black text-white">{c.label}</div>
                <div className="text-[13px] text-slate-400">{c.detail}</div>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Simulated scenario.</p>
        </div>
      )}
    </div>
  )
}
