import { useState } from 'react'
import { GUIDES } from '../guides'

export default function Guide({ id }) {
  const g = GUIDES[id]
  const key = `fyv-guide-${id}`
  const [open, setOpen] = useState(() => localStorage.getItem(key) !== 'closed')
  const toggle = () => { localStorage.setItem(key, open ? 'closed' : 'open'); setOpen(!open) }
  if (!g) return null
  return (
    <div className="mb-6 rounded-2xl border border-cyan/40 bg-cyan/5 p-4 text-left sm:p-5">
      <button onClick={toggle} className="flex w-full items-center justify-between gap-2 text-left">
        <span className="text-sm font-black uppercase tracking-wider text-cyan">ⓘ How this works: {g.title}</span>
        <span className="text-xs font-bold text-cyan">{open ? 'Hide ▲' : 'Show ▼'}</span>
      </button>
      {open && (
        <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="text-sm leading-relaxed text-slate-200">{g.what}</p>
            <div className="mt-3 text-xs font-black uppercase tracking-wider text-slate-400">What to do</div>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-slate-300">{g.steps.map((x) => <li key={x}>{x}</li>)}</ol>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-400">Legend</div>
            <ul className="mt-2 space-y-2">{g.legend.map(([c, t]) => <li key={t} className="flex items-center gap-2 text-sm text-slate-300"><span className={`h-3.5 w-3.5 shrink-0 rounded-full ${c}`} />{t}</li>)}</ul>
          </div>
        </div>
      )}
    </div>
  )
}
