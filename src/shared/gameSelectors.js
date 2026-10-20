import {
  EVENTS, MIN_EVENTS, TERM_MONTHS, amortizedPayment, bossOptions, cardDecision, creditUsed, has, liveProfile, liveScore,
  monthlyBurn, ownership, prepayMax, reducer, runForecast, scoreGame, termDecision, totals, vcTerms,
} from '../engine'
import { CARDS, PARTNERS, fmt, fundabilityFactors, partnerChecks, partnerQualifies, runwayDays, tierFor } from '../game'
import { INDUSTRIES, SQUAD } from '../data'

export const PLAIN_STATUS = {
  conditional: 'Offer with conditions: your decision needed',
  committed: 'Promised, but not in your bank yet',
  available: 'Ready to use in the simulation',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
}

export const SOURCE_LABEL = {
  credit: 'Approved 0% credit lines', term: 'Business term loan', partner: 'Capital partner credit', vc: 'Investor money',
  savings: 'Your personal savings', prepay: 'Customer prepayments', cut: 'Freed-up expenses',
}

export const GLOSSARY = {
  apr: ['APR', 'The yearly interest rate on borrowed money. A 0% intro APR ends after a set number of months, then a higher rate applies.'],
  committed: ['Committed', 'Promised, but not in your bank yet. It arrives after time passes in the game.'],
  available: ['Available', 'Funds ready to use in the simulation. In this game, approved credit lines are assumed fully drawn, so they also must be repaid.'],
  freed: ['Freed-up expenses', 'Money you no longer spend because you cut costs. It covers part of your goal, but it is never cash in your bank.'],
  dilution: ['Dilution', 'You give up some ownership of your company in exchange for investor money.'],
  premoney: ['Pre-money valuation', 'What investors say your company is worth before their money comes in. It decides how much ownership they get.'],
  inquiry: ['Hard inquiry', 'A credit check from an application. Each one can lower your score a little for a while.'],
  guarantee: ['Personal guarantee', 'You promise to repay the business debt yourself if the business cannot.'],
  runway: ['Cash runway', 'How long your cash lasts at your current monthly spending, estimated under this scenario.'],
  burn: ['Monthly burn', 'What the business spends every month.'],
  promo: ['Promo cliff', 'Your introductory interest rate ends, and payments may rise.'],
  iq: ['Capital IQ', 'How strong your funding strategy was in this game. A game score, not a credit score.'],
  fundability: ['Simulated credit standing', 'A pretend score from the credit profile you set. Real lenders use their own rules.'],
}

export function moneyPicture(s) {
  const t = totals(s)
  const bySource = {}
  for (const f of s.funding) if (f.status === 'available' && f.type !== 'cut') bySource[f.type] = (bySource[f.type] || 0) + f.amount
  const target = s.startup.target
  const eventCash = s.mods.cashBonus - s.mods.oneTimeCosts - s.funding.reduce((a, f) => a + (f.paidDown || 0), 0)
  return {
    ...t,
    raisedCash: t.cash,
    eventCash,
    cash: t.cash + eventCash,
    target,
    pendingAmount: t.committed - t.available,
    pending: s.funding.filter((f) => f.status === 'committed'),
    awaiting: s.funding.filter((f) => f.status === 'conditional'),
    gap: Math.max(0, target - t.available),
    fundedPct: target ? t.available / target : 0,
    bySource,
    borrowed: (bySource.credit || 0) + (bySource.term || 0) + (bySource.partner || 0),
  }
}

export function runwayInfo(s) {
  const burn = monthlyBurn(s)
  const days = runwayDays(moneyPicture(s).cash, s.startDays, burn)
  return { days, months: days / 30, burn, bufferDays: s.startDays }
}

export function ownershipInfo(s) {
  const o = ownership(s)
  const investors = s.funding.filter((f) => f.type === 'vc' && ['committed', 'available'].includes(f.status))
  const partnerShare = s.funding.filter((f) => f.type === 'partner' && f.status === 'available').reduce((a, f) => a + (f.split || 0), 0)
  return { founder: o.founder, seats: o.seats, investors, partnerShare }
}

export function burnBreakdown(s) {
  const cut = s.funding.some((f) => f.type === 'cut' && f.status === 'available')
  const squad = s.squad.map((id) => SQUAD.find((r) => r.id === id)).filter(Boolean)
  return {
    base: s.startup.monthlyBurn, founderPay: s.startup.founderPay || 0, cut, operator: has(s, 'operator'),
    squad, squadCost: squad.reduce((a, r) => a + r.cost, 0), total: monthlyBurn(s),
  }
}

export const JOURNEY = ['Fund your goal', 'Run the business', 'Cash crunch', 'Results']

export function currentMission(s) {
  const m = moneyPicture(s)
  if (s.phase === 'setup') return { id: 'setup', step: 0, title: 'Create your startup', body: 'Answer three quick questions to open your office.', label: 'Start my business', action: 'new' }
  if (s.phase === 'boss') return { id: 'crunch', step: 2, title: 'Survive the cash crunch', body: 'Month 12: intro 0% rates end and sales come in 25% below plan. Choose your turnaround moves.', label: 'Open the cash-crunch challenge', action: 'crunch' }
  if (s.phase === 'results') return { id: 'results', step: 3, title: 'See how you did', body: 'Your 18-month forecast is locked in.', label: 'See my results', action: 'results' }
  if (s.activeEvent) return { id: 'event', step: 1, title: 'Something happened', body: EVENTS[s.activeEvent].title, label: 'See what happened', action: 'event' }
  if (m.awaiting.length) return { id: 'offer', step: 0, title: 'Decide on your offer', body: `${m.awaiting[0].label}: ${m.awaiting[0].requirement || 'conditions apply'}.`, label: 'Review the offer', action: 'offer' }
  if (!s.funding.length) return { id: 'first', step: 0, title: 'Make your first funding decision', body: `Your startup needs ${fmt(m.target)} to launch. Where could the money come from?`, label: 'Explore my options', action: 'doors' }
  if (m.available < m.target) {
    if (m.committed >= m.target) return { id: 'wait', step: 1, title: 'Let promised money arrive', body: `${fmt(m.pendingAmount)} is promised but not in your bank yet. Let a month pass so it can land.`, label: 'Advance one month', action: 'month' }
    return { id: 'gap', step: 0, title: `Cover the remaining ${fmt(m.gap)}`, body: 'Compare another way to fund the rest of your goal.', label: 'Compare funding choices', action: 'doors' }
  }
  const need = Math.max(0, MIN_EVENTS - s.resolvedEvents.length)
  if (need > 0) return { id: 'months', step: 1, title: `Run the business for ${need} more month${need > 1 ? 's' : ''}`, body: 'Your goal is covered. Let time pass and handle what comes up.', label: 'Advance one month', action: 'month' }
  return { id: 'boss', step: 2, title: 'Face the cash crunch', body: 'You covered your goal and survived the first months. Can the business keep paying its bills?', label: 'Start the cash-crunch challenge', action: 'boss' }
}

export const DOORS = [
  { id: 'borrow', title: 'Borrow money', benefit: 'You keep 100% ownership.', downside: 'You must pay it back, usually with a personal guarantee.', options: ['credit', 'term'] },
  { id: 'invest', title: 'Invite an investor or partner', benefit: 'No loan payments to investors.', downside: 'You give up ownership or a share of profits.', options: ['vc', 'partner'] },
  { id: 'customers', title: 'Earn money from customers', benefit: 'No debt and no ownership given up.', downside: 'You owe customers the product. Delays can mean refunds.', options: ['prepay'] },
  { id: 'less', title: 'Use less money', benefit: 'Fast and fully in your control.', downside: 'Uses your safety net or slows growth.', options: ['savings', 'cut'] },
]

export const OPTION_NAME = {
  credit: '0% intro business credit cards', term: 'Business term loan', vc: 'Angel / VC investment', partner: 'Qualified capital partner',
  prepay: 'Customer prepayments', savings: 'Personal savings', cut: 'Cut operating expenses 15%',
}

// Office agent that visibly starts work when a strategy is chosen (illustrative choreography only).
export const OPTION_AGENT = { credit: 'underwriting', term: 'underwriting', vc: 'vc', partner: 'architect', prepay: 'growth', savings: 'cfo', cut: 'cfo' }

const savingsLeft = (s) => s.startup.savings - s.funding.filter((f) => f.type === 'savings').reduce((a, f) => a + f.amount, 0)
export const termMax = (s) => Math.round(Math.min(250000, s.startup.target * 0.6) / 5000) * 5000

export function optionLimits(s) {
  const ind = INDUSTRIES[s.startup.industry]
  return {
    term: { min: 10000, max: termMax(s), step: 5000 },
    vc: { min: 10000, max: ind.vcCap, step: 5000 },
    prepay: { min: Math.min(5000, prepayMax(s)), max: prepayMax(s), step: 1000 },
    savings: { min: Math.min(5000, Math.max(0, savingsLeft(s))), max: Math.max(0, savingsLeft(s)), step: 1000 },
  }
}

export function creditStanding(s) {
  const p = liveProfile(s)
  const score = liveScore(s)
  return { score, tier: tierFor(score), factors: fundabilityFactors(p), profile: p, underwritten: s.underwritten }
}

export function issuerPreviews(s) {
  const cap = Math.max(25000, s.profile.income) * (has(s, 'cco') ? 1.1 : 1)
  return {
    used: creditUsed(s), cap,
    cards: CARDS.map((c) => ({ card: c, applied: s.funding.find((f) => f.cardId === c.id) || null, decision: cardDecision(s, c) })),
  }
}

export function partnerPreviews(s) {
  const count = s.funding.filter((f) => f.type === 'partner' && f.status !== 'declined').length
  return PARTNERS.map((p) => ({ p, checks: partnerChecks(p), qualifies: partnerQualifies(p), taken: s.funding.some((f) => f.partnerId === p.id), full: count >= 2 }))
}

// Plain-language comparison for one option, using the engine's own decision functions.
export function optionPreview(s, id, { amount, cardId, partnerId } = {}) {
  const row = (available, repay, own, when, risk, extra = {}) => ({ id, name: OPTION_NAME[id], available, repay, own, when, risk, ...extra })
  switch (id) {
    case 'credit': {
      const card = CARDS.find((c) => c.id === cardId)
      if (!card) {
        const room = Math.max(0, issuerPreviews(s).cap - creditUsed(s))
        return row(`Up to ${fmt(room)} more across issuers (game cap: 100% of income)`, '1% minimum a month during the 0% period, then about 24% APR', 'None', 'Approved lines count right away', 'Personal guarantee. Each application is a hard inquiry. Payments rise when the promo ends.', { blocked: s.underwritten ? null : 'Run the simulated credit check first.' })
      }
      const d = cardDecision(s, card)
      return row(d.limit ? fmt(d.limit) : '$0', `0% for ${card.promo} months, then about 24% APR`, 'None', d.status === 'approved' ? 'Right away if approved' : d.status === 'conditional' ? 'After you provide income proof' : 'Not available', `Hard inquiry. ${d.reason}.`, { status: d.status, value: d.limit })
    }
    case 'term': {
      if (s.funding.some((f) => f.type === 'term' && f.status !== 'declined')) return row('—', '—', 'None', '—', '—', { blocked: 'You already applied for a term loan.' })
      const d = termDecision(s, amount)
      const pay = d.amount ? amortizedPayment(d.amount, d.apr, TERM_MONTHS) : 0
      return row(d.amount ? fmt(d.amount) : '$0', d.amount ? `About ${fmt(pay)}/month for ${TERM_MONTHS} months at ${(d.apr * 100).toFixed(0)}% APR, starting month 1` : 'Nothing: declined', 'None', d.status === 'approved' ? 'Promised now, in your bank after one month' : d.status === 'conditional' ? 'Offer with conditions first (collateral or co-signer)' : 'Not available', `Personal guarantee. ${d.reason}.`, { status: d.status, value: d.amount, blocked: s.underwritten ? null : 'Run the simulated credit check first.' })
    }
    case 'vc': {
      if (s.funding.some((f) => f.type === 'vc' && f.status !== 'declined')) return row('—', '—', '—', '—', '—', { blocked: 'You already have an investor term sheet.' })
      const t = vcTerms(s, amount)
      return row(fmt(t.amount), 'No scheduled repayment', `${(t.equityPct * 100).toFixed(1)}% of your company${t.equityPct >= 0.15 ? ' plus an investor board seat' : ''}`, 'Term sheet first. If you accept, money lands about 2 months later.', `Valuation ${fmt(t.preMoney)} pre-money in this game. Investors gain rights; terms are negotiated, not guaranteed.`, { status: 'conditional', value: t.amount })
    }
    case 'partner': {
      const p = PARTNERS.find((x) => x.id === partnerId)
      if (!p) return row('Partner credit capacity', 'Partner-guaranteed credit must be repaid, plus a profit share', 'No equity; a share of profits in positive months', 'After a written agreement', 'Without a written agreement, disputes and withdrawals hurt more.')
      const q = partnerQualifies(p)
      return row(fmt(p.capacity), `0% for 12 months, then about 24% APR, plus ${p.split}% of monthly profits`, `No equity; ${p.split}% profit share`, has(s, 'attorney') ? 'Promised now; lands after one month' : 'Offer with conditions: needs a written agreement', q ? 'Partner credit still has to be repaid. A real partner is never guaranteed.' : `Does not qualify: ${partnerChecks(p).filter((c) => !c.ok).map((c) => c.label).join(', ')}`, { status: q ? 'conditional' : 'declined', value: q ? p.capacity : 0, blocked: q ? null : 'This partner does not qualify.' })
    }
    case 'prepay': {
      const max = prepayMax(s)
      if (s.funding.some((f) => f.type === 'prepay')) return row('—', '—', 'None', '—', '—', { blocked: 'You already pre-sold to customers.' })
      const amt = Math.min(amount, max)
      return row(fmt(amt), 'Deliver the product. It counts against your first 6 months of sales.', 'None', 'Right away', `Launch delays can trigger refunds (about 30%).${has(s, 'sales') ? '' : ' Without a Sales Specialist you can pre-sell only half as much.'}`, { status: 'available', value: amt, blocked: max <= 0 ? 'No prepayment capacity right now.' : null })
    }
    case 'savings': {
      const left = savingsLeft(s)
      const amt = Math.min(amount, left)
      return row(fmt(Math.max(0, amt)), 'No repayment', 'None', 'Right away', 'Drains your personal emergency fund and lowers your personal-risk score.', { status: 'available', value: amt, blocked: left <= 0 ? 'Your savings are fully committed.' : null })
    }
    case 'cut': {
      if (s.funding.some((f) => f.type === 'cut')) return row('—', '—', 'None', '—', '—', { blocked: 'You already cut expenses.' })
      const amt = Math.round(s.startup.monthlyBurn * 0.15 * 12)
      return row(`Frees ${fmt(amt)} over 12 months. Not cash in your bank.`, 'No repayment', 'None', 'Spending drops from now on', 'Growth slows: revenue about 8% lower in this game.', { status: 'available', value: 0, freed: amt })
    }
    default: return null
  }
}

export function optionAction(id, { amount, cardId, partnerId } = {}) {
  if (id === 'credit') return { type: 'APPLY_CARD', cardId }
  if (id === 'partner') return { type: 'PLAY', card: 'partner', partnerId }
  if (id === 'cut') return { type: 'PLAY', card: 'cut' }
  return { type: 'PLAY', card: id, amount }
}

// Before/after numbers for a choice, computed by running the real reducer on a copy of the state.
export function snapshotNumbers(s) {
  return { cash: moneyPicture(s).cash, runway: runwayInfo(s).days, owner: ownership(s).founder, endCash: runForecast(s, []).endCash }
}

export function eventChoicePreviews(s) {
  if (!s.activeEvent) return []
  const ev = EVENTS[s.activeEvent]
  const before = snapshotNumbers(s)
  return ev.choices(s).map((c) => {
    if (c.disabled) return { choice: c, before, after: null }
    const next = reducer(s, { type: 'RESOLVE_EVENT', choice: c.id })
    const f = runForecast(next, [])
    return { choice: c, before, after: { ...snapshotNumbers(next), insolventMonth: f.insolventMonth, oneTime: next.mods.oneTimeCosts - s.mods.oneTimeCosts } }
  })
}

export function consultantPick(previews) {
  const ok = previews.filter((p) => p.after)
  if (!ok.length) return null
  const best = [...ok].sort((a, b) => (a.after.insolventMonth ? 1 : 0) - (b.after.insolventMonth ? 1 : 0) || b.after.endCash - a.after.endCash)[0]
  return best
}

export function bossMovePreviews(s) {
  const base = runForecast(s, s.bossMoves)
  return bossOptions(s).map((o) => {
    const moves = s.bossMoves.includes(o.id) ? s.bossMoves : [...s.bossMoves, o.id]
    const f = runForecast(s, moves)
    return { o, used: s.bossMoves.includes(o.id), endCash: f.endCash, delta: f.endCash - base.endCash, insolventMonth: f.insolventMonth, score: scoreGame(s, f, moves).score }
  })
}

export const OUTCOME_COPY = {
  victory: { title: 'You made it', sub: 'Funded, still in control, and cash lasted all 18 months in this scenario.' },
  partial: { title: 'You launched, but cash is tight', sub: 'The business survived, but some money checks failed.' },
  failure: { title: 'Your startup ran out of money', sub: 'You raised money but could not carry it through the forecast.' },
}

export function resultInsights(result, alternatives = []) {
  const ranked = [...result.breakdown].sort((a, b) => b.pts / b.max - a.pts / a.max)
  const well = ranked.filter((b) => b.pts / b.max >= 0.7).slice(0, 3)
  const failed = result.checks.filter((c) => !c.ok).map((c) => c.label)
  const weak = [...result.breakdown].sort((a, b) => a.pts / a.max - b.pts / b.max).filter((b) => b.pts / b.max < 0.7).map((b) => `${b.label}: ${b.pts}/${b.max}`)
  const trouble = [...failed, ...weak].slice(0, 2)
  const best = [...alternatives].sort((a, b) => b.score - a.score || b.endCash - a.endCash)[0]
  return { well, trouble, tryNext: best && best.score > result.score ? best : null }
}

export const RECOMMENDED_TARGET = (industry) => Math.min(500000, Math.max(25000, Math.round((INDUSTRIES[industry].burn * 12) / 5000) * 5000))

export const STATUS_TONE = { available: 'green', committed: 'gold', conditional: 'gold', declined: 'risk', withdrawn: 'risk', approved: 'green' }
export const STATUS_WORD = { available: 'Ready to use', committed: 'Promised', conditional: 'Needs your decision', declined: 'Declined', withdrawn: 'Withdrawn', approved: 'Likely approved' }

export const NBF_URL = 'https://nationwidebusinessfunding.com'

export function nbfLink(campaign, s, share) {
  const q = new URLSearchParams({ utm_source: 'fund-your-vision-game', utm_medium: 'game', utm_campaign: campaign })
  if (share) {
    q.set('industry', s.startup.industry)
    q.set('target', s.startup.target)
    if (s.result) { q.set('iq', s.result.score); q.set('outcome', s.result.outcome) }
  }
  return `${NBF_URL}/?${q}`
}
