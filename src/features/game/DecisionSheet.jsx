import { useMemo, useState } from 'react'
import { fmt } from '../../game'
import {
  DOORS, OPTION_NAME, creditStanding, issuerPreviews, optionAction, optionLimits, optionPreview, partnerPreviews, PLAIN_STATUS,
  STATUS_TONE, STATUS_WORD, NBF_URL,
} from '../../shared/gameSelectors'
import { Button, Card, Eyebrow, Pill, Progress, Sheet, Slider, Term } from '../../shared/ui'

const ROWS = [
  ['available', 'Money this may make available'],
  ['repay', 'What you must repay or deliver'],
  ['own', 'Ownership you give up'],
  ['when', 'When funds arrive'],
  ['risk', 'Risk to your business'],
]
const SHORT = {
  credit: 'Several 0% intro cards, applied for one at a time.', term: 'One loan with fixed monthly payments for 36 months.',
  vc: 'Sell part of your company to an investor.', partner: 'A partner backs credit for you in exchange for a profit share.',
  prepay: 'Customers pay now for what you deliver later.', savings: 'Put your own money in.', cut: 'Spend 15% less every month.',
}

function defaults(s) {
  const l = optionLimits(s)
  return { term: Math.min(60000, l.term.max), vc: Math.min(50000, l.vc.max), prepay: Math.min(10000, l.prepay.max), savings: Math.min(10000, l.savings.max) }
}

export function Comparison({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-0 text-left text-sm">
        <thead><tr><th className="w-44 p-2" />{rows.map((r) => <th key={r.id + (r.key || '')} scope="col" className="p-2 text-[15px] font-semibold">{r.title || r.name}</th>)}</tr></thead>
        <tbody>
          {ROWS.map(([k, label]) => (
            <tr key={k}><th scope="row" className="border-t border-fos-line p-2 align-top font-medium text-fos-muted">{label}</th>
              {rows.map((r) => <td key={r.id + (r.key || '')} className="border-t border-fos-line p-2 align-top">{r[k]}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CreditReadiness({ s, dispatch }) {
  const c = creditStanding(s)
  return (
    <Card className="p-5">
      <Eyebrow>Step 1 · Simulated credit check</Eyebrow>
      <p className="mt-2 text-[15px]">Lenders look at your credit before they lend. This game uses a pretend score built from the fictional profile you set. It is not a credit report, and real lenders use their own rules.</p>
      <div className="mt-4 flex items-baseline gap-3"><span className="fos-num text-[36px] font-semibold">{c.score}</span><span className="text-fos-muted">/ 100 · <Term k="fundability">simulated credit standing</Term> · Tier {c.tier.tier}</span></div>
      <ul className="mt-4 space-y-3">
        {c.factors.filter((f) => f.max > 0 || f.pts < 0).map((f) => (
          <li key={f.id}>
            <div className="flex justify-between text-sm"><span>{f.label}</span><span className="fos-num text-fos-muted">{f.max ? `${Math.round(f.pts)} / ${f.max}` : `${f.pts}`}</span></div>
            {f.max > 0 && <Progress value={f.pts / f.max} tone={f.pts / f.max >= 0.7 ? 'green' : f.pts / f.max >= 0.4 ? 'gold' : 'risk'} label={f.label} />}
          </li>
        ))}
      </ul>
      <details className="mt-4 text-sm text-fos-muted">
        <summary className="min-h-[44px] cursor-pointer py-2 font-semibold text-fos-info">What helps a real credit profile?</summary>
        <p>Paying on time, keeping card balances low compared with limits, applying only when needed, and keeping older accounts open. Being an authorized user on someone else’s card is reported and scored differently by different lenders and models; it is not a guaranteed boost, and paying for “tradelines” carries real risks.</p>
      </details>
      {!s.underwritten
        ? <Button className="mt-5 w-full" onClick={() => dispatch({ type: 'UNDERWRITE' })}>Run the simulated credit check</Button>
        : <div className="mt-4"><Pill tone="green">Credit check done</Pill></div>}
    </Card>
  )
}

export default function DecisionSheet({ s, dispatch, open, onClose, onChosen }) {
  const [door, setDoor] = useState(null)
  const [opt, setOpt] = useState(null)
  const [params, setParams] = useState({})
  const [stage, setStage] = useState('doors')
  const [before, setBefore] = useState(null)
  const [amounts, setAmounts] = useState(() => defaults(s))
  const limits = optionLimits(s)
  const reset = () => { setDoor(null); setOpt(null); setParams({}); setStage('doors'); setBefore(null) }
  const close = () => { reset(); onClose() }
  const d = DOORS.find((x) => x.id === door)
  const preview = opt ? optionPreview(s, opt, { amount: amounts[opt], ...params }) : null

  const doorRows = useMemo(() => (d ? d.options.map((o) => ({ ...optionPreview(s, o, { amount: defaults(s)[o] }), title: OPTION_NAME[o] })) : []), [d, s])

  const choose = () => setStage('review')
  const confirm = () => {
    setBefore({ funding: s.funding.length, log: s.log[0]?.id, event: s.activeEvent })
    dispatch(optionAction(opt, { amount: amounts[opt], ...params }))
    onChosen?.(opt)
    setStage('result')
  }

  const newEntries = before ? s.funding.slice(before.funding) : []
  const newLogs = []
  if (before) for (const l of s.log) { if (l.id === before.log) break; newLogs.push(l) }

  const back = () => {
    if (stage === 'review') return setStage('option')
    if (opt && (params.cardId || params.partnerId) && stage === 'option' && (opt === 'credit' || opt === 'partner')) return setParams({})
    if (opt) { setOpt(null); setParams({}); return setStage('door') }
    if (door) { setDoor(null); return setStage('doors') }
  }

  let title = 'Where could the money come from?'
  if (stage === 'door') title = d.title
  if (stage === 'option') title = OPTION_NAME[opt]
  if (stage === 'review') title = 'Review your choice'
  if (stage === 'result') title = 'Here is what happened'

  return (
    <Sheet open={open} onClose={close} wide title={title} subtitle={stage === 'doors' ? 'Pick a door to see real numbers from your game. Nothing happens until you confirm.' : 'Simulation only. Not a real application or offer.'}
      footer={stage !== 'doors' && stage !== 'result' ? <div className="flex justify-between gap-3"><Button variant="secondary" onClick={back}>Back</Button>{stage === 'review' && <Button onClick={confirm}>Confirm</Button>}</div> : stage === 'result' ? <div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" onClick={reset}>Compare another option</Button><Button onClick={close}>See my next move</Button></div> : null}>

      {stage === 'doors' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {DOORS.map((x) => (
            <button key={x.id} onClick={() => { setDoor(x.id); setStage('door') }} className="min-h-[150px] rounded-[20px] border border-fos-line bg-fos-surface p-5 text-left transition hover:border-fos-gold hover:fos-shadow">
              <div className="text-[19px] font-semibold">{x.title}</div>
              <div className="mt-3 text-sm"><span className="font-semibold text-fos-green">Good:</span> {x.benefit}</div>
              <div className="mt-1 text-sm"><span className="font-semibold text-fos-risk">Watch out:</span> {x.downside}</div>
              <div className="mt-3 text-sm font-semibold text-fos-info">See options →</div>
            </button>
          ))}
        </div>
      )}

      {stage === 'door' && d && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {d.options.map((o) => {
              const p = optionPreview(s, o, { amount: defaults(s)[o] })
              return (
                <button key={o} onClick={() => { setOpt(o); setStage('option') }} className="rounded-[20px] border border-fos-line bg-fos-surface p-5 text-left hover:border-fos-gold">
                  <div className="text-[17px] font-semibold">{OPTION_NAME[o]}</div>
                  <div className="mt-1 text-sm text-fos-muted">{SHORT[o]}</div>
                  {p.blocked && <div className="mt-2 text-sm text-fos-gold">{p.blocked}</div>}
                  <div className="mt-3 text-sm font-semibold text-fos-info">Look closer →</div>
                </button>
              )
            })}
          </div>
          <Card className="p-4"><Eyebrow className="mb-2">Side by side, with example amounts</Eyebrow><Comparison rows={doorRows} /></Card>
        </div>
      )}

      {stage === 'option' && opt && (
        <div className="space-y-5">
          {(opt === 'credit' || opt === 'term') && <CreditReadiness s={s} dispatch={dispatch} />}

          {opt === 'credit' && s.underwritten && !params.cardId && (() => {
            const ip = issuerPreviews(s)
            return (
              <Card className="p-5">
                <Eyebrow>Step 2 · Compare issuers</Eyebrow>
                <p className="mt-1 text-sm text-fos-muted">Approved so far {fmt(ip.used)} of a {fmt(ip.cap)} game cap (100% of income, a game assumption, not a bank rule). Each application is a hard inquiry, so later cards get harder.</p>
                <ul className="mt-3 divide-y divide-fos-line">
                  {ip.cards.map(({ card, applied, decision }) => (
                    <li key={card.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0"><div className="font-semibold">{card.name}</div><div className="text-sm text-fos-muted">{card.type} · 0% for {card.promo} months · needs {card.req}+</div></div>
                      {applied ? <Pill tone={STATUS_TONE[applied.status]}>{STATUS_WORD[applied.status]}{applied.amount ? ` ${fmt(applied.amount)}` : ''}</Pill> : (
                        <div className="flex items-center gap-3"><Pill tone={STATUS_TONE[decision.status]}>{STATUS_WORD[decision.status]}{decision.limit ? ` ~${fmt(decision.limit)}` : ''}</Pill>
                          <Button variant="secondary" onClick={() => setParams({ cardId: card.id })}>Preview</Button></div>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            )
          })()}

          {opt === 'partner' && !params.partnerId && (
            <Card className="p-5">
              <Eyebrow>Choose a fictional partner</Eyebrow>
              <p className="mt-1 text-sm text-fos-muted">A qualified partner passes all six checks. Profiles are fictional; a real partner is never guaranteed.</p>
              <ul className="mt-3 divide-y divide-fos-line">
                {partnerPreviews(s).map(({ p, checks, qualifies, taken, full }) => (
                  <li key={p.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div><div className="font-semibold">{p.name}</div><div className="text-sm text-fos-muted">{p.title} · {fmt(p.capacity)} capacity · {p.split}% profit share</div></div>
                      {taken ? <Pill tone="green">Matched</Pill> : <Button variant="secondary" disabled={full} onClick={() => setParams({ partnerId: p.id })}>{full ? 'Limit of 2 reached' : 'Preview'}</Button>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">{checks.map((c) => <Pill key={c.id} tone={c.ok ? 'green' : 'risk'}>{c.ok ? '✓' : '✕'} {c.label}</Pill>)}</div>
                    {!qualifies && <div className="mt-1 text-sm text-fos-risk">Does not qualify.</div>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {['term', 'vc', 'prepay', 'savings'].includes(opt) && limits[opt].max > 0 && (
            <Card className="p-5"><Slider label="How much?" value={amounts[opt]} min={limits[opt].min} max={limits[opt].max} step={limits[opt].step} onChange={(v) => setAmounts((a) => ({ ...a, [opt]: v }))} /></Card>
          )}

          {(opt !== 'credit' || params.cardId) && (opt !== 'partner' || params.partnerId) && preview && (
            <Card className="p-5">
              <Eyebrow className="mb-2">If you choose this…</Eyebrow>
              <dl className="divide-y divide-fos-line">
                {ROWS.map(([k, label]) => <div key={k} className="grid gap-1 py-3 sm:grid-cols-[200px_1fr]"><dt className="text-sm text-fos-muted">{label}</dt><dd className="text-[15px]">{preview[k]}</dd></div>)}
              </dl>
              {preview.status && <div className="mt-2"><Pill tone={STATUS_TONE[preview.status]}>Expected result: {STATUS_WORD[preview.status]}</Pill></div>}
              <p className="mt-3 text-[13px] text-fos-muted">Numbers come from this game’s rules for your scenario. Terms: <Term k="apr" />, <Term k="guarantee">personal guarantee</Term>, <Term k="inquiry">hard inquiry</Term>, <Term k="dilution">dilution</Term>.</p>
              {preview.blocked ? <div className="mt-4 rounded-[14px] bg-fos-gold/10 p-3 text-sm">{preview.blocked}</div> : <Button className="mt-5 w-full" onClick={choose}>Choose this strategy</Button>}
            </Card>
          )}
        </div>
      )}

      {stage === 'review' && preview && (
        <Card className="p-5">
          <div className="text-[19px] font-semibold">{OPTION_NAME[opt]}</div>
          <ul className="mt-3 space-y-2 text-[15px]">
            <li><b>You may get:</b> {preview.available}</li>
            <li><b>You must:</b> {preview.repay}</li>
            <li><b>Ownership:</b> {preview.own}</li>
            <li><b>Timing:</b> {preview.when}</li>
          </ul>
          <p className="mt-4 text-sm text-fos-muted">Your advisors will process this in the office. Every second funding move, a month passes and a surprise may happen.</p>
        </Card>
      )}

      {stage === 'result' && (
        <div className="space-y-4">
          {newEntries.map((f) => (
            <Card key={f.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-[17px] font-semibold">{f.label}</div><Pill tone={STATUS_TONE[f.status]}>{STATUS_WORD[f.status]}</Pill></div>
              <div className="fos-num mt-2 text-[28px] font-semibold">{fmt(f.amount)}</div>
              <p className="mt-1 text-[15px]">{PLAIN_STATUS[f.status]}.{f.type === 'cut' ? ' This is spending you avoid, not cash in your bank.' : ''}</p>
              {(f.requirement || f.reason) && <p className="mt-1 text-sm text-fos-muted">{f.requirement ? `Condition: ${f.requirement}` : f.reason}</p>}
              {f.status === 'conditional' && <p className="mt-2 text-sm">Simulated offer: conditional, more verification required. Decide on it from your mission card.</p>}
            </Card>
          ))}
          {!newEntries.length && newLogs.map((l) => <Card key={l.id} className="p-5 text-[15px]">{l.text}</Card>)}
          {s.activeEvent && s.activeEvent !== before?.event && <Card className="border-fos-gold p-5 text-[15px]">A month passed and something happened. Close this panel to see it.</Card>}
          <div className="rounded-[18px] border border-fos-line p-4 text-sm">
            <div className="font-semibold">Want an expert to review your real eligibility?</div>
            <p className="mt-1 text-fos-muted">Nationwide Business Funding, the presenting partner, offers real funding assessments. This does not change your game, and nothing is sent unless you choose to.</p>
            <a href={`${NBF_URL}/?utm_source=fund-your-vision-game&utm_medium=game&utm_campaign=post-insight`} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-[44px] items-center font-semibold text-fos-info">Get a funding assessment →</a>
          </div>
        </div>
      )}
    </Sheet>
  )
}
