import { runForecast } from '../../engine'
import { fmt } from '../../game'
import { SQUAD } from '../../data'
import PartnerBinder from '../../components/PartnerBinder'
import { SOURCE_LABEL, burnBreakdown, creditStanding, issuerPreviews, moneyPicture, ownershipInfo, runwayInfo, STATUS_TONE, STATUS_WORD } from '../../shared/gameSelectors'
import { Card, CashChart, Disclosure, Eyebrow, Pill, Progress, Ring, Term } from '../../shared/ui'
import TeamList from './TeamList'
import OfferCard from '../game/OfferCard'

export default function BusinessScreen({ s, dispatch, report, book }) {
  const m = moneyPicture(s)
  const r = runwayInfo(s)
  const o = ownershipInfo(s)
  const b = burnBreakdown(s)
  const f = report?.forecast || runForecast(s, [])
  const c = creditStanding(s)
  const ip = issuerPreviews(s)
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
      <h1 className="fos-display text-[32px]">My business</h1>
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="p-5">
          <Eyebrow>How much cash can I use today?</Eyebrow>
          <div className="fos-num mt-2 text-[34px] font-semibold">{fmt(m.cash)}</div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {Object.entries(m.bySource).map(([k, v]) => <li key={k} className="flex justify-between gap-2"><span className="text-fos-muted">{SOURCE_LABEL[k]}</span><span className="fos-num">{fmt(v)}</span></li>)}
            {!Object.keys(m.bySource).length && <li className="text-fos-muted">No cash raised yet.</li>}
            {m.eventCash !== 0 && <li className="flex justify-between gap-2"><span className="text-fos-muted">Event costs and bonuses</span><span className="fos-num">{fmt(m.eventCash)}</span></li>}
          </ul>
          <div className="mt-3 space-y-1.5 border-t border-fos-line pt-3 text-sm">
            <div className="flex justify-between gap-2"><span><Term k="committed">Promised, not in bank yet</Term></span><span className="fos-num">{fmt(m.pendingAmount)}</span></div>
            <div className="flex justify-between gap-2"><span><Term k="freed">Freed-up expenses (not cash)</Term></span><span className="fos-num">{fmt(m.freed)}</span></div>
          </div>
          {m.borrowed > 0 && <p className="mt-3 text-[13px] text-fos-muted">{fmt(m.borrowed)} of your cash is borrowed and must be repaid. The game assumes approved credit lines are fully drawn.</p>}
        </Card>
        <Card className="p-5">
          <Eyebrow>How long can I keep operating?</Eyebrow>
          <div className="fos-num mt-2 text-[34px] font-semibold">{r.days} days</div>
          <p className="text-sm text-fos-muted">About {(r.days / 30).toFixed(1)} months at {fmt(r.burn)}/month, estimated under this scenario. Includes your {r.bufferDays}-day starting buffer.</p>
          <div className="mt-3"><CashChart forecast={f} height={150} /></div>
        </Card>
        <Card className="p-5">
          <Eyebrow>How much of my company do I still own?</Eyebrow>
          <div className="mt-3 flex items-center gap-4">
            <Ring value={o.founder} size={110} label={`You own ${(o.founder * 100).toFixed(1)} percent`} />
            <ul className="space-y-1 text-sm">
              <li>Investors: {o.investors.length ? o.investors.map((x) => `${(x.equityPct * 100).toFixed(1)}%`).join(', ') : 'none'}</li>
              <li>Board seats given: {o.seats}</li>
              <li>Partner profit share: {(o.partnerShare * 100).toFixed(0)}%</li>
            </ul>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><Eyebrow>Funding goal progress</Eyebrow><span className="fos-num text-sm">{fmt(m.available)} of {fmt(m.target)}</span></div>
        <div className="mt-2"><Progress value={m.fundedPct} label="Funding goal progress" /></div>
        <p className="mt-2 text-[13px] text-fos-muted">Goal progress counts cash ready to use{m.freed ? ` plus ${fmt(m.freed)} of freed-up expenses` : ''}. Freed-up expenses cover part of the goal but are never cash in the bank.</p>
      </Card>

      <OfferCard s={s} dispatch={dispatch} />

      <Disclosure title="Money coming in" hint="Every funding source and its status">
        {s.funding.length === 0 ? <p className="text-fos-muted">Nothing yet.</p> : (
          <ul className="divide-y divide-fos-line">
            {s.funding.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="min-w-0"><span className="block font-semibold">{x.label}</span><span className="block text-sm text-fos-muted">Asked for {fmt(x.requested)}{x.status === 'committed' ? ` · lands in ${x.turns} month${x.turns > 1 ? 's' : ''}` : ''}</span></span>
                <span className="flex items-center gap-3"><span className="fos-num">{fmt(x.amount)}</span><Pill tone={STATUS_TONE[x.status]}>{STATUS_WORD[x.status]}</Pill></span>
              </li>
            ))}
          </ul>
        )}
      </Disclosure>

      <Disclosure title="Money going out" hint={`${fmt(b.total)} per month right now`}>
        <ul className="space-y-1.5 text-[15px]">
          <li className="flex justify-between"><span>Base operating costs{b.cut ? ' (cut 15%)' : ''}{b.operator ? ' (Operating Partner −5%)' : ''}</span><span className="fos-num">{fmt(b.base)}</span></li>
          <li className="flex justify-between"><span>Founder pay</span><span className="fos-num">{fmt(b.founderPay)}</span></li>
          {b.squad.map((x) => <li key={x.id} className="flex justify-between"><span>{x.name}</span><span className="fos-num">{fmt(x.cost)}</span></li>)}
          {s.mods.burnMult !== 1 || s.mods.burnDelta ? <li className="text-sm text-fos-muted">Event effects are included in the monthly total.</li> : null}
        </ul>
        {report?.debt?.length > 0 && (
          <>
            <Eyebrow className="mt-5">Debt payments</Eyebrow>
            <ul className="mt-2 space-y-2 text-[15px]">
              {report.debt.map((d) => <li key={d.label}><b>{d.label}</b>: {fmt(d.balance)}{d.promoMonths ? `, 0% for ${d.promoMonths} months then about ${Math.round(d.postPromoApr * 100)}% APR` : `, ${(d.apr * 100).toFixed(0)}% APR`}. About {fmt(d.payment)}/month ({d.paymentBasis}).</li>)}
            </ul>
          </>
        )}
        <p className="mt-3 text-[13px] text-fos-muted">Founder pay is an optional budget, not an entitlement. It shortens runway, and paying yourself from borrowed money must fit lender terms.</p>
      </Disclosure>

      <Disclosure title="Team" hint={`${s.squad.length} hire${s.squad.length === 1 ? '' : 's'} · ${s.squad.map((id) => SQUAD.find((x) => x.id === id)?.name).join(', ') || 'none yet'}`}>
        <TeamList s={s} dispatch={dispatch} />
      </Disclosure>

      <Disclosure title="Advanced" hint="Simulated credit standing, issuer stack, partners and number checks">
        <div className="space-y-5">
          <div>
            <Eyebrow>Simulated credit standing: {c.score}/100 (Tier {c.tier.tier})</Eyebrow>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">{c.factors.map((x) => <li key={x.id} className="flex justify-between text-sm"><span>{x.label}</span><span className="fos-num text-fos-muted">{Math.round(x.pts)}{x.max ? ` / ${x.max}` : ''}</span></li>)}</ul>
          </div>
          <div>
            <Eyebrow>0% issuer stack</Eyebrow>
            <ul className="mt-2 divide-y divide-fos-line text-sm">{ip.cards.map(({ card, applied, decision }) => <li key={card.id} className="flex justify-between gap-2 py-2"><span>{card.name} (needs {card.req})</span><span>{applied ? `${STATUS_WORD[applied.status]} ${fmt(applied.amount)}` : `Preview: ${STATUS_WORD[decision.status]}`}</span></li>)}</ul>
          </div>
          {report && (
            <div>
              <Eyebrow>Number checks ({report.reconciliation.filter((x) => x.ok).length}/{report.reconciliation.length} match)</Eyebrow>
              <ul className="mt-2 space-y-1 text-sm">{report.reconciliation.map((x) => <li key={x.label} className={x.ok ? 'text-fos-green' : 'text-fos-risk'}>{x.ok ? '✓' : '✕'} {x.label} <span className="text-fos-muted">({x.detail})</span></li>)}</ul>
            </div>
          )}
          <div className="rounded-[18px] bg-[#05070d] p-3"><PartnerBinder book={book} /></div>
        </div>
      </Disclosure>
    </div>
  )
}
