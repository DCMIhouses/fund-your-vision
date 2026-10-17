import { useState } from 'react'
import { EVENTS } from '../../engine'
import { fmt } from '../../game'
import { consultantPick, eventChoicePreviews, snapshotNumbers } from '../../shared/gameSelectors'
import { Button, Card, Pill, Sheet } from '../../shared/ui'

const pctOwn = (v) => `${(v * 100).toFixed(1)}%`
function Delta({ label, a, b, format }) {
  const d = b - a
  return (
    <div className="rounded-[14px] bg-fos-soft p-3">
      <div className="text-[13px] text-fos-muted">{label}</div>
      <div className="fos-num text-[17px] font-semibold">{format(a)} → {format(b)}</div>
      {Math.abs(d) > 0.0001 && <div className={`text-[13px] font-semibold ${d > 0 ? 'text-fos-green' : 'text-fos-risk'}`}>{d > 0 ? '▲' : '▼'} {format(Math.abs(d))}</div>}
    </div>
  )
}

export default function EventSheet({ s, dispatch, open, onClose }) {
  const [details, setDetails] = useState(false)
  const [ask, setAsk] = useState(false)
  const [done, setDone] = useState(null)
  const ev = s.activeEvent ? EVENTS[s.activeEvent] : null
  const previews = ev ? eventChoicePreviews(s) : []
  const pick = consultantPick(previews)
  const good = ev?.tone === 'neon'

  const choose = (c) => {
    setDone({ title: ev.title, label: c.label, before: snapshotNumbers(s), id: c.id })
    dispatch({ type: 'RESOLVE_EVENT', choice: c.id })
    setDetails(false); setAsk(false)
  }

  if (done && !s.activeEvent) {
    const after = snapshotNumbers(s)
    return (
      <Sheet open title={done.title} subtitle={`You chose: ${done.label}`} onClose={() => { setDone(null); onClose() }}
        footer={<div className="flex justify-end"><Button onClick={() => { setDone(null); onClose() }}>Continue</Button></div>}>
        <p className="text-[15px]">Here is how that changed your business in this simulation. A month has passed, so promised money may have landed.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Delta label="Cash available" a={done.before.cash} b={after.cash} format={fmt} />
          <Delta label="Cash runway (days)" a={done.before.runway} b={after.runway} format={(v) => `${Math.round(v)}`} />
          <Delta label="You own" a={done.before.owner} b={after.owner} format={pctOwn} />
          <Delta label="Month-18 cash (forecast)" a={done.before.endCash} b={after.endCash} format={fmt} />
        </div>
        <p className="mt-4 text-[13px] text-fos-muted">Setbacks are part of every business. The forecast already includes this choice.</p>
      </Sheet>
    )
  }
  if (!ev || !open) return null

  return (
    <Sheet open title={ev.title} subtitle={`${good ? 'Good news' : 'A challenge'} · Month ${s.resolvedEvents.length + 1} · Simulated scenario`} onClose={onClose} wide>
      <p className="text-[17px]">{ev.body(s)}</p>
      <p className="mt-1 text-[15px] text-fos-muted">What do you do?</p>
      <div className="mt-5 space-y-3">
        {previews.map(({ choice: c, before, after }) => (
          <Card key={c.id} className={`p-4 ${pick?.choice.id === c.id && ask ? 'border-fos-gold' : ''}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[17px] font-semibold">{c.label}</div>
                <div className="text-[15px] text-fos-muted">{c.detail}</div>
                {details && after && (
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    <Pill tone={after.cash >= before.cash ? 'green' : 'risk'}>Cash {fmt(after.cash - before.cash)}</Pill>
                    <Pill tone={after.endCash >= before.endCash ? 'green' : 'risk'}>Month-18 cash {fmt(after.endCash)}</Pill>
                    {after.insolventMonth && <Pill tone="risk">Runs out month {after.insolventMonth}</Pill>}
                  </div>
                )}
              </div>
              <Button variant={c.disabled ? 'secondary' : 'primary'} disabled={c.disabled} onClick={() => choose(c)}>Choose</Button>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setDetails((v) => !v)}>{details ? 'Hide the details' : 'See the details'}</Button>
        <Button variant="secondary" onClick={() => setAsk((v) => !v)}>Ask my consultant</Button>
      </div>
      {ask && pick && (
        <Card className="mt-4 p-4">
          <div className="text-sm font-semibold text-fos-gold">Naomi · Mentor · guided explanation (rule-based)</div>
          <p className="mt-1 text-[15px]">In this game’s forecast, <b>{pick.choice.label}</b> leaves the most cash at month 18 ({fmt(pick.after.endCash)}){pick.after.insolventMonth ? ', although cash still runs out' : ''}. The best choice also depends on ownership, risk and what you plan next. It is your call.</p>
        </Card>
      )}
    </Sheet>
  )
}
