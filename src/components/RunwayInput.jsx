import { useState } from 'react'

const UNITS = [['days', 'Days', 1], ['weeks', 'Weeks', 7], ['months', 'Months', 30.4375], ['years', 'Years', 365.25]]
const PRESETS = [[27, '27 days'], [90, '3 months'], [183, '6 months'], [365, '1 year'], [730, '2 years']]

export default function RunwayInput({ days, onChange, big }) {
  const [unit, setUnit] = useState('days')
  const factor = UNITS.find(([u]) => u === unit)[2]
  const [draft, setDraft] = useState(null)
  const shown = draft ?? String(Math.round((days / factor) * 10) / 10)
  const commit = (v) => onChange(Math.max(0, Math.min(3650, Math.round(v))))
  return (
    <div>
      <div className={`grid grid-cols-[minmax(0,1fr)_auto] gap-2 ${big ? '' : 'text-sm'}`}>
        <input type="number" inputMode="decimal" min={0} step={unit === 'days' ? 1 : 0.5} value={shown} aria-label="Runway amount"
          onChange={(e) => { setDraft(e.target.value); if (e.target.value !== '') commit(Number(e.target.value) * factor) }}
          onBlur={() => setDraft(null)}
          className={`w-full min-w-0 rounded-lg border border-edge bg-ink px-3 font-mono font-black text-white focus:border-neon focus:outline-none ${big ? 'py-3 text-2xl' : 'py-2 text-lg'}`} />
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-ink p-1 sm:grid-cols-4">
          {UNITS.map(([u, label]) => (
            <button key={u} type="button" onClick={() => { setUnit(u); setDraft(null) }}
              className={`rounded-md px-2 py-1 text-xs font-black uppercase ${unit === u ? 'bg-neon text-ink' : 'text-slate-400 hover:text-white'}`}>{label}</button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PRESETS.map(([d, label]) => (
          <button key={d} type="button" onClick={() => { setDraft(null); commit(d) }}
            className={`rounded-full border px-3 py-1 text-xs font-bold ${days === d ? 'border-neon bg-neon/15 text-neon' : 'border-edge text-slate-300 hover:border-neon/60'}`}>{label}</button>
        ))}
      </div>
      <div className="mt-1 text-xs text-slate-500">= {days} days of cash before new funding</div>
    </div>
  )
}
