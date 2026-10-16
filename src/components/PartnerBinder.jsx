import Panel from './Panel'
import { PARTNERS, fmt, partnerChecks } from '../game'

export function PartnerCard({ p, entry }) {
  if (!entry) {
    return (
      <div className="grid min-h-[260px] place-items-center rounded-2xl border-2 border-dashed border-edge bg-[repeating-linear-gradient(45deg,#0b1020,#0b1020_10px,#0e1530_10px,#0e1530_20px)] p-4 text-center">
        <div>
          <div className="text-5xl opacity-40">❔</div>
          <div className="mt-2 text-sm font-black uppercase tracking-wider text-slate-400">Not collected yet</div>
          <div className="mt-1 text-xs text-slate-500">Meet this partner in the matchmaking deck to collect the card.</div>
        </div>
      </div>
    )
  }
  const checks = partnerChecks(p)
  const ok = checks.every((c) => c.ok)
  return (
    <div className={`medal-pop relative overflow-hidden rounded-2xl border-2 p-4 ${ok ? 'border-neon/70 bg-gradient-to-br from-neon/15 via-ink to-ink shadow-[0_0_22px_rgba(57,255,136,.25)]' : 'border-hot/60 bg-gradient-to-br from-hot/15 via-ink to-ink'}`}>
      {ok && <span className="medal-shine" />}
      <div className={`absolute right-3 top-3 rotate-6 rounded-md border-2 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider ${ok ? 'border-neon text-neon' : 'border-hot text-hot'}`}>
        {ok ? 'Qualifies ✓' : "Doesn't qualify ✗"}
      </div>
      <div className="flex items-center gap-3 pr-24">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-3xl ${ok ? 'bg-neon/15 ring-2 ring-neon/60' : 'bg-hot/15 ring-2 ring-hot/50'}`}>{p.face}</div>
        <div className="min-w-0">
          <div className="text-base font-black text-white">{p.name}</div>
          <div className="text-xs text-slate-400">{p.title}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-[13px]">
        <div className="rounded-lg bg-ink/70 p-1.5"><div className="text-[10px] uppercase text-slate-500">FICO</div><span className={p.fico >= 720 ? 'text-neon' : 'text-hot'}>{p.fico}</span></div>
        <div className="rounded-lg bg-ink/70 p-1.5"><div className="text-[10px] uppercase text-slate-500">Capacity</div><span className="text-white">{fmt(p.capacity)}</span></div>
        <div className="rounded-lg bg-ink/70 p-1.5"><div className="text-[10px] uppercase text-slate-500">Profit share</div><span className="text-gold">{p.split}%</span></div>
      </div>
      <ul className="mt-3 space-y-1">
        {checks.map((c) => (
          <li key={c.id} className={`flex justify-between gap-2 text-xs ${c.ok ? 'text-slate-300' : 'font-bold text-hot'}`}>
            <span>{c.ok ? '✓' : '✗'} {c.label}</span><span className="font-mono text-slate-500">{c.value}</span>
          </li>
        ))}
      </ul>
      {entry.signed && <div className="mt-3 rounded-lg bg-gold/15 py-1 text-center text-xs font-black uppercase tracking-wider text-gold">🤝 Matched with you</div>}
    </div>
  )
}

export default function PartnerBinder({ book }) {
  const met = PARTNERS.filter((p) => book[p.id])
  const good = met.filter((p) => partnerChecks(p).every((c) => c.ok)).length
  const signed = PARTNERS.filter((p) => book[p.id]?.signed).length
  return (
    <Panel guide="binder" num="★" accent="gold" title="Credit Partner Binder"
      subtitle="Collect credit partner cards. Each card shows if the partner qualifies as a good credit partner and why. Simulated profiles, saved on this device."
      right={<div className="text-right"><div className="text-xs uppercase text-slate-500">Collected</div><div className="font-mono font-black text-gold">{met.length}/{PARTNERS.length}</div></div>}>
      <div className="mb-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        {[['Collected', `${met.length}/${PARTNERS.length}`, 'text-white'], ['Qualify ✓', good, 'text-neon'], ["Don't qualify ✗", met.length - good, 'text-hot'], ['Matched 🤝', signed, 'text-gold']].map(([k, v, c]) => (
          <div key={k} className="rounded-xl border border-edge bg-ink/60 p-3"><div className={`font-mono text-2xl font-black ${c}`}>{v}</div><div className="text-xs text-slate-400">{k}</div></div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PARTNERS.map((p) => <PartnerCard key={p.id} p={p} entry={book[p.id]} />)}
      </div>
    </Panel>
  )
}
