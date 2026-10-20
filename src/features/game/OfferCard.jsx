import { has } from '../../engine'
import { fmt } from '../../game'
import { SQUAD_SLOTS } from '../../data'
import { Button, Card, Eyebrow } from '../../shared/ui'

export default function OfferCard({ s, dispatch }) {
  const offers = s.funding.filter((f) => f.status === 'conditional')
  if (!offers.length) return null
  const blocked = !!s.activeEvent
  const canHireAttorney = has(s, 'attorney') || s.squad.length < SQUAD_SLOTS
  return (
    <div className="space-y-3">
      {offers.map((f) => (
        <Card key={f.id} className="border-fos-gold p-5">
          <Eyebrow>Simulated offer · needs your decision</Eyebrow>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2"><div className="text-[17px] font-semibold">{f.label}</div><div className="fos-num text-[19px] font-semibold">{fmt(f.amount)}</div></div>
          <p className="mt-1 text-[15px]">Condition: {f.requirement}</p>
          <p className="mt-1 text-sm text-fos-muted">If you accept, it becomes “promised” and lands in your bank after {f.type === 'vc' ? 'about 2 months' : 'a month'}.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {f.type === 'partner' ? (
              <>
                <Button disabled={blocked || !canHireAttorney} onClick={() => { if (!has(s, 'attorney')) dispatch({ type: 'HIRE', role: 'attorney' }); dispatch({ type: 'RESOLVE_CONDITION', id: f.id, choice: 'agreement' }) }}>{has(s, 'attorney') ? 'Sign a written agreement' : 'Hire attorney & sign agreement'}</Button>
                <Button variant="secondary" disabled={blocked} onClick={() => dispatch({ type: 'RESOLVE_CONDITION', id: f.id, choice: 'handshake' })}>Proceed on a handshake</Button>
              </>
            ) : <Button disabled={blocked} onClick={() => dispatch({ type: 'RESOLVE_CONDITION', id: f.id, choice: 'accept' })}>{f.type === 'vc' ? 'Accept term sheet' : 'Meet the condition & accept'}</Button>}
            <Button variant="secondary" disabled={blocked} onClick={() => dispatch({ type: 'RESOLVE_CONDITION', id: f.id, choice: 'decline' })}>Decline</Button>
          </div>
          {f.type === 'partner' && <p className="mt-2 text-[13px] text-fos-muted">A handshake deal costs governance points and raises dispute risk. Real partnerships need independent legal review.</p>}
        </Card>
      ))}
    </div>
  )
}
