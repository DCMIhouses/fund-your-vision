import { INDUSTRIES, SQUAD, SQUAD_SLOTS } from '../../data'
import { fmt } from '../../game'
import { Button, Pill } from '../../shared/ui'

export default function TeamList({ s, dispatch }) {
  const pri = INDUSTRIES[s.startup.industry].priorities
  const cost = s.squad.reduce((a, id) => a + SQUAD.find((r) => r.id === id).cost, 0)
  const locked = !!s.activeEvent || s.phase !== 'fund'
  return (
    <div>
      <p className="text-[15px]">Your eight AI advisors are included and free. <b>Hired team members cost money every month</b> and change your results. Up to {SQUAD_SLOTS} hires. Current hires cost <b>{fmt(cost)}/month</b>.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {SQUAD.map((r) => {
          const hired = s.squad.includes(r.id)
          const full = !hired && s.squad.length >= SQUAD_SLOTS
          return (
            <li key={r.id} className={`rounded-[18px] border p-4 ${hired ? 'border-fos-green bg-fos-green/5' : 'border-fos-line bg-fos-surface'}`}>
              <div className="flex items-start justify-between gap-2"><div className="font-semibold">{r.name}</div>{pri.includes(r.id) && <Pill tone="gold">Good fit</Pill>}</div>
              <div className="text-sm text-fos-muted">{r.area} · {fmt(r.cost)}/month</div>
              <p className="mt-2 text-sm">{r.effect}</p>
              <Button variant={hired ? 'secondary' : 'primary'} className="mt-3 w-full" disabled={locked || full} onClick={() => dispatch({ type: hired ? 'FIRE' : 'HIRE', role: r.id })}>{hired ? 'On your team · Remove' : full ? 'Team is full' : 'Hire'}</Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
