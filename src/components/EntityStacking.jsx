import { useState } from 'react'
import Panel from './Panel'
import { ENTITY_TASKS, MAX_ENTITIES, fmt } from '../game'

export default function EntityStacking({ entities, onAdd, onToggle, onStack, entityCapacity, locked }) {
  const [name, setName] = useState('')
  const [state, setState] = useState('WY')
  const total = entities.reduce((s, e) => s + (e.amount || 0), 0)

  const add = (e) => {
    e.preventDefault()
    if (!name.trim() || entities.length >= MAX_ENTITIES) return
    onAdd(name.trim(), state)
    setName('')
  }

  return (
    <Panel num="4" accent="gold" title="Multi-Entity Stacking"
      subtitle="Each fundable LLC is a separate borrower on business credit. Finish the checklist, then stack it."
      right={<div className="text-right"><div className="text-[10px] uppercase text-slate-500">Entities</div><div className="font-mono font-black text-gold">{fmt(total)}</div></div>}>
      <form onSubmit={add} className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New entity name, e.g. Apex Holdings LLC"
          className="min-w-0 flex-1 rounded-lg border border-edge bg-ink px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-gold focus:outline-none" />
        <select value={state} onChange={(e) => setState(e.target.value)}
          className="rounded-lg border border-edge bg-ink px-2 text-sm text-white focus:border-gold focus:outline-none">
          {['WY', 'DE', 'NV', 'TX', 'FL', 'NY', 'CA'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <button disabled={entities.length >= MAX_ENTITIES || !name.trim()}
          className="rounded-lg bg-gold px-3 text-xs font-black uppercase text-ink disabled:opacity-40">+ Form</button>
      </form>
      <div className="mt-1 text-[11px] text-slate-500">
        {entities.length}/{MAX_ENTITIES} entities · current capacity per fundable entity ≈ <span className="font-mono text-gold">{fmt(entityCapacity)}</span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {entities.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-edge p-4 text-center text-xs text-slate-500">
            No entities yet. Corporate America runs on subsidiaries. Form your first LLC.
          </div>
        )}
        {entities.map((ent) => {
          const done = ENTITY_TASKS.filter((t) => ent.tasks[t.id]).length
          const ready = done === ENTITY_TASKS.length
          return (
            <div key={ent.id} className={`rounded-xl border p-3 ${ent.amount ? 'border-gold/60 bg-gold/5' : 'border-edge bg-ink/60'}`}>
              <div className="flex items-center justify-between">
                <div className="truncate text-sm font-bold text-white">{ent.name} <span className="text-[10px] text-slate-500">({ent.state})</span></div>
                <span className="font-mono text-[10px] text-slate-400">{done}/{ENTITY_TASKS.length}</span>
              </div>
              <div className="mt-2 space-y-1">
                {ENTITY_TASKS.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-[11px] text-slate-300">
                    <input type="checkbox" className="accent-gold" disabled={!!ent.amount}
                      checked={!!ent.tasks[t.id]} onChange={() => onToggle(ent.id, t.id)} />
                    {t.label}
                  </label>
                ))}
              </div>
              {ent.amount ? (
                <div className="mt-2 text-center font-mono text-sm font-black text-gold">STACKED +{fmt(ent.amount)}</div>
              ) : (
                <button onClick={() => onStack(ent.id)} disabled={!ready || locked}
                  className="mt-2 w-full rounded-lg border border-gold/60 py-1.5 text-[11px] font-black uppercase text-gold hover:bg-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-40">
                  {locked ? 'Run underwriting first' : ready ? `Stack entity · ${fmt(entityCapacity)}` : 'Complete checklist'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
