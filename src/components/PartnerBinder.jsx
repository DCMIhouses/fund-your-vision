import { useState } from 'react'
import Panel from './Panel'
import { PARTNERS, fmt, partnerChecks } from '../game'

const qualifies = (p) => partnerChecks(p).every((c) => c.ok)
const FILTERS = [['all', 'All'], ['good', 'Qualify ✓'], ['bad', "Don't qualify ✗"], ['matched', 'Matched 🤝']]

function Details({ p, entry }) {
  const checks = partnerChecks(p)
  return (
    <div className="fade-up border-t border-edge/70 px-4 pb-4 pt-3">
      <p className="text-sm leading-relaxed text-slate-300">{p.bio}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {p.skills.map((sk) => <span key={sk} className="rounded bg-edge px-1.5 py-0.5 text-xs font-bold text-slate-300">{sk}</span>)}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-[13px]">
        <div className="rounded-lg bg-ink/70 p-2"><div className="text-[10px] uppercase text-slate-500">FICO</div><span className={p.fico >= 720 ? 'text-neon' : 'text-hot'}>{p.fico}</span></div>
        <div className="rounded-lg bg-ink/70 p-2"><div className="text-[10px] uppercase text-slate-500">Capacity</div><span className="text-white">{fmt(p.capacity)}</span></div>
        <div className="rounded-lg bg-ink/70 p-2"><div className="text-[10px] uppercase text-slate-500">Profit share</div><span className="text-gold">{p.split}%</span></div>
      </div>
      <div className="mt-3 text-xs font-black uppercase tracking-wider text-slate-500">Qualification checks</div>
      <ul className="mt-1 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.id} className={`flex justify-between gap-2 text-xs ${c.ok ? 'text-slate-300' : 'font-bold text-hot'}`}>
            <span>{c.ok ? '✓' : '✗'} {c.label}</span><span className="font-mono text-slate-500">{c.value}</span>
          </li>
        ))}
      </ul>
      {entry.signed && <div className="mt-3 rounded-lg bg-gold/15 py-1.5 text-center text-xs font-black uppercase tracking-wider text-gold">🤝 Matched with you</div>}
    </div>
  )
}

function Row({ p, entry, open, toggle }) {
  if (!entry) {
    return (
      <div className="flex min-h-[64px] items-center gap-3 rounded-2xl border-2 border-dashed border-edge bg-[repeating-linear-gradient(45deg,#0b1020,#0b1020_10px,#0e1530_10px,#0e1530_20px)] px-4 py-2">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-edge/60 text-2xl opacity-50">❔</div>
        <div className="min-w-0">
          <div className="text-sm font-black uppercase tracking-wider text-slate-400">Not collected yet</div>
          <div className="text-xs text-slate-500">Meet this partner in the matchmaking deck.</div>
        </div>
      </div>
    )
  }
  const ok = qualifies(p)
  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 transition ${ok ? 'border-neon/60 bg-gradient-to-r from-neon/10 via-ink to-ink' : 'border-hot/50 bg-gradient-to-r from-hot/10 via-ink to-ink'} ${open ? 'shadow-[0_0_22px_rgba(57,255,136,.18)]' : ''}`}>
      {ok && <span className="medal-shine z-0 opacity-20" />}
      <button onClick={toggle} aria-expanded={open} className="relative z-10 flex min-h-[64px] w-full items-center gap-3 px-4 py-2 text-left">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-2xl ${ok ? 'bg-neon/15 ring-2 ring-neon/60' : 'bg-hot/15 ring-2 ring-hot/50'}`}>{p.face}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="truncate text-sm font-black text-white">{p.name}</span>
            {entry.signed && <span className="text-xs" title="Matched">🤝</span>}
          </div>
          <div className="truncate text-xs text-slate-400">{p.title}</div>
          <div className="font-mono text-[11px] text-slate-500 sm:hidden">{fmt(p.capacity)} · {p.split}% share</div>
        </div>
        <div className="hidden shrink-0 text-right font-mono text-xs sm:block">
          <div className="text-white">{fmt(p.capacity)}</div>
          <div className="text-gold">{p.split}% share</div>
        </div>
        <span className={`shrink-0 rounded-md border-2 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${ok ? 'border-neon text-neon' : 'border-hot text-hot'}`}>{ok ? '✓ Qualifies' : '✗ No'}</span>
        <span className={`shrink-0 text-lg text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <Details p={p} entry={entry} />}
    </div>
  )
}

export default function PartnerBinder({ book }) {
  const [open, setOpen] = useState([])
  const [filter, setFilter] = useState('all')
  const met = PARTNERS.filter((p) => book[p.id])
  const good = met.filter(qualifies).length
  const signed = PARTNERS.filter((p) => book[p.id]?.signed).length
  const shown = PARTNERS.filter((p) => filter === 'all' || (book[p.id] && (filter === 'good' ? qualifies(p) : filter === 'bad' ? !qualifies(p) : book[p.id].signed)))
  const toggle = (id) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]))
  const allOpen = met.length > 0 && met.every((p) => open.includes(p.id))
  return (
    <Panel guide="binder" num="★" accent="gold" title="JV Credit Partners"
      subtitle="Every circle is a JV credit partner. Tap a circle to open the full details and qualification checks. Simulated profiles, saved on this device."
      right={<div className="text-right"><div className="text-xs uppercase text-slate-500">Collected</div><div className="font-mono font-black text-gold">{met.length}/{PARTNERS.length}</div></div>}>
      <div className="mb-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        {[['Collected', `${met.length}/${PARTNERS.length}`, 'text-white'], ['Qualify ✓', good, 'text-neon'], ["Don't qualify ✗", met.length - good, 'text-hot'], ['Matched 🤝', signed, 'text-gold']].map(([k, v, c]) => (
          <div key={k} className="rounded-xl border border-edge bg-ink/60 p-3"><div className={`font-mono text-2xl font-black ${c}`}>{v}</div><div className="text-xs text-slate-400">{k}</div></div>
        ))}
      </div>
      <div className="mb-5 rounded-2xl border border-gold/40 bg-ink/50 p-4">
        <div className="mb-3 text-xs font-black uppercase tracking-widest text-gold">JV credit partners · tap a circle</div>
        <div className="flex flex-wrap justify-center gap-4">
          {PARTNERS.map((p) => {
            const e = book[p.id]
            const ok = e && qualifies(p)
            const on = open.includes(p.id)
            return (
              <button key={p.id} disabled={!e} onClick={() => toggle(p.id)} aria-pressed={on} aria-label={e ? `${p.name}, ${ok ? 'qualifies' : 'does not qualify'}` : 'Partner not collected yet'} className="group flex w-20 flex-col items-center gap-1 disabled:cursor-not-allowed">
                <span className={`relative grid h-16 w-16 place-items-center rounded-full text-3xl transition ${!e ? 'border-2 border-dashed border-edge bg-edge/30 opacity-60' : ok ? 'bg-neon/15 ring-4 ring-neon/60' : 'bg-hot/15 ring-4 ring-hot/50'} ${on ? 'scale-110 !ring-gold shadow-[0_0_24px_rgba(251,191,36,.6)]' : 'group-hover:scale-105'}`}>
                  {e ? p.face : '❔'}
                  {e && <span className={`absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full text-[11px] font-black ${ok ? 'bg-neon text-ink' : 'bg-hot text-white'}`}>{ok ? '✓' : '✗'}</span>}
                </span>
                <span className="w-full truncate text-center text-[11px] font-bold text-slate-300">{e ? p.name.split(' ')[0] : 'Locked'}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)}
              className={`min-h-[36px] rounded-full border px-3 text-xs font-bold ${filter === id ? 'border-gold bg-gold text-ink' : 'border-edge text-slate-400 hover:border-gold'}`}>{label}</button>
          ))}
        </div>
        <button disabled={!met.length} onClick={() => setOpen(allOpen ? [] : met.map((p) => p.id))}
          className="min-h-[36px] rounded-full border border-cyan/60 px-3 text-xs font-black uppercase text-cyan hover:bg-cyan/10 disabled:opacity-40">{allOpen ? 'Collapse all ▴' : 'Expand all ▾'}</button>
      </div>
      <div className="grid grid-cols-1 items-start gap-2 lg:grid-cols-2">
        {shown.filter((p) => open.includes(p.id)).map((p) => <Row key={p.id} p={p} entry={book[p.id]} open toggle={() => toggle(p.id)} />)}
        {!shown.some((p) => open.includes(p.id)) && <div className="rounded-xl border border-dashed border-edge p-4 text-center text-sm text-slate-400 lg:col-span-2">{met.length ? 'Tap a circle above to open that partner’s full details here.' : 'No partners collected yet. Meet them in the Partners step.'}</div>}
      </div>
    </Panel>
  )
}
