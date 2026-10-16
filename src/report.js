import {
  BOSS_MONTH, EVENTS, MONTHS, POST_PROMO_APR, TERM_MONTHS, amortizedPayment, bossOptions, findScenario, liveProfile, liveScore,
  monthlyBurn, ownership, runForecast, scoreGame, totals,
} from './engine'
import { INDUSTRIES, SQUAD } from './data'
import { runwayClock, runwayDays, tierFor } from './game'
import { LEVELS } from './achievements'
import { achievementById } from './achievements'

export const REPORT_VERSION = 'FYV-R1.0'
export const UNAVAILABLE = 'Unavailable'

export const SECTIONS = [
  ['summary', 'Executive Summary'],
  ['overview', 'Company Overview and Business Model'],
  ['health', 'Financial Health Assessment'],
  ['capital', 'Capital Structure and Financing History'],
  ['underwriting', 'Funding Applications and Underwriting Outcomes'],
  ['cashflow', 'Cash-Flow and Liquidity Analysis'],
  ['revenue', 'Revenue and Operating Expense Analysis'],
  ['debt', 'Debt Obligations and Repayment Schedule'],
  ['equity', 'Equity Ownership and Governance'],
  ['team', 'Team and Operational Performance'],
  ['risks', 'Financial Risks and Vulnerabilities'],
  ['forecast', '18-Month Forecast and Sensitivity Analysis'],
  ['alternatives', 'Comparison of Alternative Financing Strategies'],
  ['iq', 'Startup Capital IQ and Achievements'],
  ['recommendations', 'Strategic Recommendations'],
  ['actions', 'Prioritized Management Action Plan'],
  ['timeline', 'Decision and Event Timeline'],
  ['methodology', 'Assumptions, Methodology and Disclosures'],
]
export const SECTION_TITLE = Object.fromEntries(SECTIONS)

export const REPORT_TYPES = [
  { id: 'health', name: 'Executive Business Health Report', sections: ['summary', 'health', 'risks', 'actions'] },
  { id: 'blueprint', name: 'Complete Startup Capital Blueprint', sections: ['summary', 'overview', 'capital', 'debt', 'equity', 'forecast', 'alternatives', 'recommendations', 'actions'] },
  { id: 'performance', name: 'Financial Performance Report', sections: ['summary', 'health', 'revenue', 'cashflow', 'iq'] },
  { id: 'cashflow', name: 'Cash Flow and Runway Report', sections: ['summary', 'cashflow', 'forecast'] },
  { id: 'debt', name: 'Debt and Repayment Report', sections: ['summary', 'debt', 'forecast', 'recommendations'] },
  { id: 'ownership', name: 'Capital Structure and Ownership Report', sections: ['summary', 'capital', 'equity'] },
  { id: 'funding', name: 'Funding and Underwriting Report', sections: ['summary', 'capital', 'underwriting'] },
  { id: 'risk', name: 'Risk and Sustainability Report', sections: ['summary', 'risks', 'forecast', 'actions'] },
  { id: 'growth', name: 'Strategic Growth Report', sections: ['summary', 'team', 'revenue', 'alternatives', 'recommendations'] },
  { id: 'all', name: 'Comprehensive Business Intelligence Report', sections: SECTIONS.map(([id]) => id) },
]
export const reportType = (id) => REPORT_TYPES.find((r) => r.id === id) || REPORT_TYPES[REPORT_TYPES.length - 1]

const TYPE_LABEL = { credit: '0% business credit', term: 'Term loan', vc: 'Angel / VC equity', partner: 'Capital partner', savings: 'Personal savings', prepay: 'Customer prepayments', cut: 'Expense reduction' }
const DEBT_TYPES = new Set(['credit', 'term', 'partner'])
const money = (n) => `${n < 0 ? '-' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`
const pct = (v, d = 1) => `${(v * 100).toFixed(d)}%`
const r2 = (n) => Math.round(n * 100) / 100

function strategyMoves(s) {
  if (s.result?.moves) return s.result.moves
  if (s.phase === 'boss') return s.bossMoves
  return []
}

function alternatives(s) {
  const opts = bossOptions(s).filter((o) => !o.disabled)
  const base = [{ id: 'none', label: 'No turnaround moves', moves: [] }, ...opts.map((o) => ({ id: o.id, label: o.label, moves: [o.id] }))]
  const chosen = strategyMoves(s)
  if (chosen.length > 1) base.push({ id: 'chosen', label: `Chosen plan: ${chosen.map((m) => opts.find((o) => o.id === m)?.label || m).join(' + ')}`, moves: chosen })
  return base.map((a) => {
    const f = runForecast(s, a.moves)
    const sc = scoreGame(s, f, a.moves)
    return { ...a, endCash: f.endCash, minCash: f.minCash, insolventMonth: f.insolventMonth, debtRemaining: f.debtRemaining, score: sc.score, outcome: sc.outcome, founderOwnership: sc.founderOwnership }
  })
}

function sensitivity(s, moves) {
  return [['Revenue 20% below plan', 0.8], ['Revenue as planned', 1], ['Revenue 20% above plan', 1.2]].map(([label, m]) => {
    const f = runForecast({ ...s, mods: { ...s.mods, revenueMult: s.mods.revenueMult * m } }, moves)
    return { label, mult: m, endCash: f.endCash, minCash: f.minCash, insolventMonth: f.insolventMonth }
  })
}

function debtInstruments(s) {
  return s.funding.filter((f) => DEBT_TYPES.has(f.type) && f.status === 'available' && f.amount > 0).map((f) => {
    const promo = f.type === 'term' ? null : Math.max(1, (f.promo || 12) + s.mods.promoShift)
    return {
      label: f.label, type: f.type, balance: f.amount - (f.paidDown || 0),
      apr: f.type === 'term' ? f.apr : 0, promoMonths: promo, postPromoApr: f.type === 'term' ? null : POST_PROMO_APR,
      payment: f.type === 'term' ? amortizedPayment(f.amount, f.apr, TERM_MONTHS) : (f.amount - (f.paidDown || 0)) * 0.01,
      paymentBasis: f.type === 'term' ? `${TERM_MONTHS}-month amortization` : '1% minimum during promo',
      profitShare: f.type === 'partner' ? f.split : null, agreement: f.type === 'partner' ? !!f.agreement : null,
    }
  })
}

function timeline(s) {
  return [...s.log].reverse().map((l, i) => ({ n: i + 1, text: l.text, tone: l.tone }))
}

function risksFor(ctx) {
  const { s, t, f, own, burn, runway, debt, promoExposure, profile } = ctx
  const out = []
  const add = (id, title, likelihood, impact, evidence, owner) => out.push({ id, title, likelihood, impact, severity: likelihood * impact >= 6 ? 'High' : likelihood * impact >= 3 ? 'Medium' : 'Low', evidence, owner })
  if (f.insolventMonth) add('insolvency', 'Cash runs out inside the forecast', 3, 3, `Forecast cash falls below $0 in month ${f.insolventMonth}.`, 'CFO')
  else if (f.minCash < burn) add('thin', 'Thin cash cushion', 2, 3, `Lowest forecast cash is ${money(f.minCash)}, under one month of expenses (${money(burn)}).`, 'CFO')
  if (promoExposure > 0) add('promo', 'Promotional APR expiration', promoExposure > t.available * 0.5 ? 3 : 2, 3, `${money(promoExposure)} of 0% balances; promos begin expiring around month ${Math.min(...debt.filter((d) => d.promoMonths).map((d) => d.promoMonths))}, then about ${pct(POST_PROMO_APR, 0)} APR.`, 'Risk Officer')
  if (s.phase === 'fund' && runway < 90) add('runway', 'Short cash runway', 3, 2, `Runway is ${runway} days at ${money(burn)}/month.`, 'CFO')
  if (own.founder < 0.75) add('dilution', 'Founder dilution', own.founder < 0.51 ? 3 : 2, 2, `Founder owns ${pct(own.founder)} with ${own.seats} board seat(s) given.`, 'Capital Architect')
  if (s.funding.some((x) => x.type === 'partner' && x.status === 'available' && !x.agreement)) add('handshake', 'Partner deal without a written agreement', 2, 3, 'At least one capital partner is funded on a handshake.', 'Risk Officer')
  if (profile.inquiries > 6) add('inquiries', 'Many recent credit inquiries', 2, 2, `${profile.inquiries} modeled inquiries can lower fundability.`, 'Capital Architect')
  const savingsUsed = s.funding.filter((x) => x.type === 'savings').reduce((a, x) => a + x.amount, 0)
  if (s.startup.savings && savingsUsed / s.startup.savings > 0.5) add('savings', 'Heavy use of personal savings', 2, 2, `${money(savingsUsed)} of ${money(s.startup.savings)} savings committed.`, 'Guidance Consultant')
  if (s.mods.disputeFlag) add('dispute', 'Unresolved co-founder dispute', 2, 2, 'A co-founder disagreement event is still flagged.', 'Guidance Consultant')
  if (s.mods.launchDelay > 0) add('delay', 'Product launch delay', 2, 2, `Launch pushed back ${s.mods.launchDelay} month(s).`, 'CFO')
  if (t.available < s.startup.target) add('gap', 'Funding target not yet reached', 2, 2, `${money(s.startup.target - t.available)} still needed to reach ${money(s.startup.target)}.`, 'Capital Architect')
  return out.sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact)
}

function actionsFor(ctx) {
  const { s, t, f, risks, alts } = ctx
  const out = []
  const add = (priority, action, why, owner) => out.push({ priority, action, why, owner })
  const best = [...alts].sort((a, b) => b.score - a.score || b.endCash - a.endCash)[0]
  if (t.available < s.startup.target) add(1, `Close the ${money(s.startup.target - t.available)} funding gap`, 'The Final Boss unlocks only at 100% available capital.', 'Capital Architect')
  if (!s.underwritten && s.phase === 'fund') add(1, 'Run underwriting before applying for credit', 'Card applications are blocked until underwriting is complete.', 'Capital Architect')
  if (risks.some((r) => r.id === 'promo')) add(f.insolventMonth ? 1 : 2, 'Plan for the month-12 promo cliff now', `Compare restructuring, paydown and expense cuts. Best single plan in this model: ${best.label} (IQ ${best.score}).`, 'Risk Officer')
  if (risks.some((r) => r.id === 'handshake')) add(2, 'Put every partner deal in writing', 'Handshake deals cost governance points and add dispute risk.', 'Risk Officer')
  if (f.insolventMonth) add(1, `Fix the month-${f.insolventMonth} cash shortfall`, 'Cut burn, defer founder pay, or add non-debt capital before the forecast goes negative.', 'CFO')
  if (!s.squad.includes('cpa')) add(3, 'Consider adding a CPA', 'A CPA adds a third turnaround move at the boss and an early-warning forecast.', 'CFO')
  if (risks.some((r) => r.id === 'dilution')) add(2, 'Protect founder ownership', 'Favor non-dilutive capital before another equity round.', 'Capital Architect')
  if (!out.length) add(3, 'Hold the plan and keep a one-month cash reserve', 'No material risks were flagged by the model.', 'Guidance Consultant')
  return out.sort((a, b) => a.priority - b.priority)
}

function reconcile(ctx) {
  const { s, t, f, own, iq, monthsChart } = ctx
  const avail = s.funding.filter((x) => x.status === 'available')
  const sumAvail = avail.reduce((a, x) => a + x.amount, 0)
  const sumDebt = avail.filter((x) => DEBT_TYPES.has(x.type)).reduce((a, x) => a + x.amount, 0)
  const ownCalc = s.funding.filter((x) => x.type === 'vc' && !['declined', 'conditional', 'withdrawn'].includes(x.status)).reduce((a, x) => a * (1 - x.equityPct), 1)
  const scoreSum = iq.breakdown.reduce((a, b) => a + b.pts, 0)
  return [
    { label: 'Ledger available = sum of available sources', ok: Math.abs(sumAvail - t.available) < 1, detail: `${money(sumAvail)} vs ${money(t.available)}` },
    { label: 'Available = cash sources + freed capital', ok: Math.abs(t.cash + t.freed - t.available) < 1, detail: `${money(t.cash)} + ${money(t.freed)}` },
    { label: 'Debt = credit + term + partner balances', ok: Math.abs(sumDebt - t.debt) < 1, detail: money(t.debt) },
    { label: 'Committed includes available', ok: t.committed >= t.available - 0.5, detail: `${money(t.committed)} >= ${money(t.available)}` },
    { label: 'Founder ownership recomputed', ok: Math.abs(ownCalc - own.founder) < 1e-9, detail: pct(own.founder, 2) },
    { label: 'Capital IQ = sum of components', ok: scoreSum === iq.score, detail: `${scoreSum} / ${iq.score}` },
    { label: 'Chart values = forecast months', ok: monthsChart.length === MONTHS && monthsChart.every((m, i) => m.cash === f.months[i].cash), detail: `${monthsChart.length} months` },
  ]
}

function commentary(r) {
  const k = r.kpis
  const lines = []
  lines.push(`${r.company.name} has ${money(k.available)} of available capital against a ${money(k.target)} target (${pct(k.fundedPct, 1)} funded), with ${money(k.committed - k.available)} committed but not yet available.`)
  lines.push(r.forecast.insolventMonth
    ? `On the current plan the forecast runs out of cash in month ${r.forecast.insolventMonth}. This is a forecast, not a historical result.`
    : `On the current plan the 18-month forecast stays solvent, ending at ${money(r.forecast.endCash)} with a low point of ${money(r.forecast.minCash)}.`)
  if (k.promoExposure > 0) lines.push(`${money(k.promoExposure)} of 0% balances is exposed to promo expiration around month ${BOSS_MONTH}; debt still owed at month 18 is ${money(r.forecast.debtRemaining)}.`)
  lines.push(`The founder keeps ${pct(k.founderOwnership)} ownership. Startup Capital IQ is ${k.iq}/100${r.iqFinal ? '' : ' (provisional, until the Final Boss is played)'}.`)
  if (r.risks[0]) lines.push(`Top risk: ${r.risks[0].title}. ${r.risks[0].evidence}`)
  if (r.actions[0]) lines.push(`First priority: ${r.actions[0].action}.`)
  return lines
}

export function buildReport(s, { now = new Date(), previous = null } = {}) {
  const t = totals(s)
  const own = ownership(s)
  const burn = monthlyBurn(s)
  const moves = strategyMoves(s)
  const f = s.result?.forecast || runForecast(s, moves)
  const iqFinal = !!s.result
  const iq = s.result ? { score: s.result.score, breakdown: s.result.breakdown, outcome: s.result.outcome, badge: s.result.badge, checks: s.result.checks } : scoreGame(s, f, moves)
  const profile = liveProfile(s)
  const fundability = liveScore(s)
  const debt = debtInstruments(s)
  const promoExposure = debt.filter((d) => d.type !== 'term').reduce((a, d) => a + d.balance, 0)
  const runway = runwayDays(t.cash, s.startDays, burn)
  const ind = INDUSTRIES[s.startup.industry]
  const alts = alternatives(s)
  const ctx = { s, t, f, own, burn, runway, debt, promoExposure, profile }
  const risks = risksFor(ctx)
  const actions = actionsFor({ ...ctx, risks, alts })
  const monthsChart = f.months.map((m) => ({ m: m.m, cash: m.cash, revenue: m.revenue, expenses: m.expenses, debt: m.debt, share: m.share, promoBalance: m.promoBalance }))
  const squadCost = s.squad.reduce((a, id) => a + (SQUAD.find((r) => r.id === id)?.cost || 0), 0)
  const scenario = findScenario(s.scenarioId)
  const kpis = {
    target: s.startup.target, requested: t.requested, committed: t.committed, available: t.available, pending: t.committed - t.available,
    deployed: null, fundedPct: t.available / s.startup.target, cash: t.cash, freed: t.freed, debt: t.debt, equityRaised: t.equity,
    monthlyBurn: burn, founderPay: s.startup.founderPay || 0, squadCost, runwayDays: runway,
    runOutDate: runwayClock(runway, now).date.toISOString().slice(0, 10), promoExposure, founderOwnership: own.founder, boardSeats: own.seats,
    fundability, tier: tierFor(fundability).tier, iq: iq.score, month1Revenue: f.months[0].revenue, month18Revenue: f.months[MONTHS - 1].revenue,
    endCash: f.endCash, minCash: f.minCash, insolventMonth: f.insolventMonth, debtRemaining: f.debtRemaining, medals: s.achievements.length,
  }
  const report = {
    meta: {
      version: REPORT_VERSION, generatedAt: now.toISOString(), phase: s.phase, mode: s.mode,
      scenario: scenario ? scenario.label : s.mode === 'tournament' ? s.scenarioId : 'Custom arcade run', seed: s.seed,
      id: `${(s.startup.name || 'startup').replace(/\W+/g, '-').toUpperCase()}-${s.seed || 0}-${now.toISOString().slice(0, 10)}`,
    },
    company: { name: s.startup.name || 'Your startup', industry: ind.label, launchMonth: ind.launch, revenueCap: ind.cap, revenueBase: ind.base, growth: ind.growth - 1, founderPay: s.startup.founderPay || 0, target: s.startup.target, baseBurn: s.startup.monthlyBurn, savings: s.startup.savings, priorities: ind.priorities.map((p) => SQUAD.find((r) => r.id === p)?.name || p) },
    kpis,
    sources: s.funding.map((x) => ({ label: x.label, type: TYPE_LABEL[x.type] || x.type, kind: x.type, requested: x.requested, amount: x.amount, status: x.status, apr: x.apr ?? null, promo: x.promo ?? null, equityPct: x.equityPct ?? null, split: x.split ?? null, reason: x.reason || x.requirement || '' })),
    mix: Object.entries(s.funding.filter((x) => x.status === 'available').reduce((a, x) => ({ ...a, [x.type]: (a[x.type] || 0) + x.amount }), {})).map(([k, v]) => ({ kind: k, label: TYPE_LABEL[k] || k, amount: v, share: t.available ? v / t.available : 0 })).sort((a, b) => b.amount - a.amount),
    underwriting: { done: s.underwritten, fundability, tier: tierFor(fundability), profile, applications: s.funding.filter((x) => x.type === 'credit' || x.type === 'term').map((x) => ({ label: x.label, status: x.status, amount: x.amount, requested: x.requested, reason: x.reason || '' })) },
    debt, equity: { founder: own.founder, seats: own.seats, investors: s.funding.filter((x) => x.type === 'vc' && x.status !== 'declined').map((x) => ({ label: x.label, amount: x.amount, equityPct: x.equityPct, status: x.status })), partnerShare: s.funding.filter((x) => x.type === 'partner' && x.status === 'available').reduce((a, x) => a + (x.split || 0), 0) },
    team: s.squad.map((id) => SQUAD.find((r) => r.id === id)).filter(Boolean).map((r) => ({ name: r.name, area: r.area, cost: r.cost, effect: r.effect, priority: ind.priorities.includes(r.id) })),
    forecast: { ...f, months: monthsChart, moves, basis: s.phase === 'fund' ? 'Available capital only; committed funds are excluded until they land.' : 'All landed capital and chosen turnaround moves.' },
    sensitivity: sensitivity(s, moves), alternatives: alts, iq, iqFinal,
    level: s.level >= 0 ? LEVELS[s.level].name : UNAVAILABLE, nextLevel: LEVELS[s.level + 1] || null,
    achievements: s.achievements.map((id) => achievementById[id]).filter(Boolean).map((a) => ({ name: a.name, rarity: a.rarity, desc: a.desc })),
    events: s.resolvedEvents.map((e) => { const ev = EVENTS[e.id]; let choice = e.choice; try { choice = ev.choices(s).find((c) => c.id === e.choice)?.label || e.choice } catch { /* keep id */ } return { title: ev?.title || e.id, choice, tone: ev?.tone } }),
    risks, actions, timeline: timeline(s),
    milestones: [
      t.available < s.startup.target ? `Reach 100% of target (${money(s.startup.target - t.available)} to go)` : 'Funding target reached',
      s.resolvedEvents.length < 3 ? `Handle ${3 - s.resolvedEvents.length} more event(s) before the Final Boss` : 'Event requirement met',
      `Promo cliff and revenue shortfall in month ${BOSS_MONTH}`,
      LEVELS[s.level + 1] ? `Next level: ${LEVELS[s.level + 1].name} (${LEVELS[s.level + 1].goal})` : 'Top founder level reached',
    ],
  }
  report.reconciliation = reconcile({ s, t, f, own, iq, monthsChart })
  report.commentary = commentary(report)
  report.changes = previous ? compareSnapshots(previous, snapshotOf(report)) : null
  return report
}

const SNAP_FIELDS = [
  ['available', 'Available capital', 'money'], ['committed', 'Committed capital', 'money'], ['debt', 'Debt outstanding', 'money'],
  ['monthlyBurn', 'Monthly burn', 'money'], ['runwayDays', 'Runway (days)', 'num'], ['promoExposure', 'Promo exposure', 'money'],
  ['founderOwnership', 'Founder ownership', 'pct'], ['fundability', 'Fundability', 'num'], ['iq', 'Startup Capital IQ', 'num'],
  ['endCash', 'Month-18 cash (forecast)', 'money'], ['debtRemaining', 'Debt left at month 18 (forecast)', 'money'], ['medals', 'Medals', 'num'],
]

export function snapshotOf(report, label) {
  return {
    id: `${report.meta.generatedAt}`, at: report.meta.generatedAt, label: label || `${report.company.name} · ${report.meta.phase}`,
    company: report.company.name, phase: report.meta.phase, metrics: Object.fromEntries(SNAP_FIELDS.map(([k]) => [k, report.kpis[k]])),
    insolventMonth: report.kpis.insolventMonth,
  }
}

export function compareSnapshots(a, b) {
  return SNAP_FIELDS.map(([k, label, fmt]) => {
    const from = a.metrics[k], to = b.metrics[k]
    const delta = to - from
    const rel = from ? Math.abs(delta / from) : delta ? 1 : 0
    const material = fmt === 'pct' ? Math.abs(delta) >= 0.01 : rel >= 0.05 && Math.abs(delta) >= (fmt === 'money' ? 500 : 1)
    return { key: k, label, fmt, from, to, delta: r2(delta), material }
  })
}

export function formatMetric(v, fmt) {
  if (v == null || Number.isNaN(v)) return UNAVAILABLE
  if (fmt === 'money') return money(v)
  if (fmt === 'pct') return pct(v)
  return Math.round(v).toLocaleString('en-US')
}

export { money, pct }
