import { EVENTS } from '../engine'

export default function EventModal({ s, dispatch }) {
  if (!s.activeEvent) return null
  const ev = EVENTS[s.activeEvent]
  const good = ev.tone === 'neon'
  const n = s.resolvedEvents.length + 1
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
      <div className={`toast-in w-full max-w-lg rounded-3xl border-2 bg-panel p-6 ${good ? 'border-neon shadow-[0_0_50px_rgba(57,255,136,.35)]' : 'border-hot shadow-[0_0_50px_rgba(255,46,99,.35)]'}`}>
        <div className={`text-[11px] font-black uppercase tracking-[0.3em] ${good ? 'text-neon' : 'text-hot'}`}>Event card {n} · Month {n}</div>
        <h2 className="mt-1 text-2xl font-black text-white">{ev.title}</h2>
        <p className="mt-2 text-sm text-slate-300">{ev.body(s)}</p>
        <div className="mt-4 space-y-2">
          {ev.choices(s).map((c) => (
            <button key={c.id} disabled={c.disabled} onClick={() => dispatch({ type: 'RESOLVE_EVENT', choice: c.id })}
              className="w-full rounded-xl border border-edge bg-ink/70 p-3 text-left transition hover:border-neon disabled:cursor-not-allowed disabled:opacity-40">
              <div className="text-sm font-black text-white">{c.label}</div>
              <div className="text-[11px] text-slate-400">{c.detail}</div>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-slate-500">Each choice changes the financial model. Simulated scenario.</p>
      </div>
    </div>
  )
}
